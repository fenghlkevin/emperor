#!/usr/bin/env python3
"""Isolated design simulator. No imports from or edits to the playable game.
Models public-board greedy decisions, templates, entry effects, reserve, opening,
training, general slots, hero skills and shared fatigue. Not campaign accounting.
"""
from dataclasses import dataclass,field
from random import Random
from collections import Counter
import math,json,argparse,statistics,hashlib,time

BASE={
 'infantry':(2,2,8,'guard'), 'spears':(3,3,10,'guard,anti'),
 'cavalry':(3,4,7,'rush'), 'heavy':(5,6,11,'rush'),
 'archers':(3,4,6,'shot'), 'crossbows':(4,5,7,'pierce'),
 'horse_archers':(4,4,10,'rush,reduce1'), 'camel':(4,4,9,'rush,anti'),
 'elephant':(7,7,14,'guard,reduce2')}
CAV={'cavalry','heavy','horse_archers','camel'}
@dataclass
class Card:
 kind:str; cost:int; attack:int=0; hp:int=0; maxhp:int=0
 tags:set=field(default_factory=set); trait:str=''; ready:bool=False
 rushing:bool=False; general:bool=False; uid:int=0
@dataclass
class Player:
 deck:list; hand:list; reserve:dict; hero:str; hp:int=32; maxhp:int=32
 board:list=field(default_factory=list); mana:int=3; maxmana:int=3
 power_used:bool=False; own_turn:int=0; gaps:list=field(default_factory=list)
 grave:list=field(default_factory=list); nextid:int=10000

class Game:
 def __init__(self,roster,training,hero,seeds,variant='coin',policy='balanced',first=0,roster2=None,training2=None,hero2=None):
  self.rnd=Random(0);self.first=first;self.turn=first;self.round=1;self.result=None;self.actions=0;self.variant=variant;self.policy=policy;self.opening=[False,False]
  self.p=[self.make(roster,training,hero,seeds[0]),self.make(roster2 or roster,training if training2 is None else training2,hero2 or hero,seeds[1])]
  for i,p in enumerate(self.p):
   front=p.hand.pop();p.hand=[front]
   # Low-cost mulligan: replace expensive cards; replaced cards cannot be replacement.
   raw=[]
   for _ in range(3+(1 if i!=first and variant in ('coin_extra','extra') else 0)):raw.append(p.deck.pop(0))
   keep=[x for x in raw if x.cost<=3];returned=[x for x in raw if x.cost>3]
   for _ in returned:
    if p.deck:keep.append(p.deck.pop(0))
   p.hand+=keep;p.deck+=returned
   Random(seeds[i]^0x519ca).shuffle(p.deck)
   if i!=first and variant in ('coin','coin_extra'):p.hand.append(Card('coin',0))
  self.start(first)
 def makecard(self,kind,training,uid,general=False,hero='martial',front=False):
  cost,a,h,t=BASE[kind];tags=set(t.split(','))
  ta,th=(0,0) if training<40 else (1,1) if training<70 else (1,2) if training<90 else (2,3)
  trait=''
  if front:cost,a,h,tags=2,2,7,set()
  if general:cost+=1;h+=1;trait=hero
  return Card(kind,cost,a+ta,h+th,h+th,tags,trait,general=general,uid=uid)
 def make(self,roster,training,hero,seed):
  n=sum(roster.values());k=min(18,max(1,n//100));total=n
  quotas={kind:min(math.ceil(count/100),int(k*count/total)) for kind,count in roster.items()}
  remainders={kind:k*count/total-int(k*count/total) for kind,count in roster.items()}
  while sum(quotas.values())<k:
   candidates=[kind for kind in roster if quotas[kind]<math.ceil(roster[kind]/100)]
   pick=max(candidates,key=lambda kind:(remainders[kind],-list(BASE).index(kind)))
   quotas[pick]+=1;remainders[pick]=-1
  reserve=dict(roster);deck=[];uid=0
  for kind,q in sorted(quotas.items()):
   for _ in range(q):
    count=min(100,reserve[kind]);reserve[kind]-=count
    card=self.makecard(kind,training,uid);uid+=1
    if count<100:
     f=count/100;card.attack=max(1,math.floor(card.attack*f));card.hp=card.maxhp=max(1,math.floor(card.hp*f))
     if 'shot' in card.tags:card.tags.remove('shot');card.trait=''
    deck.append(card)
  # Canonical front selection is independent of player/country identity.
  frontidx=min(range(len(deck)),key=lambda i:(deck[i].cost,list(BASE).index(deck[i].kind),deck[i].uid))
  old=deck.pop(frontidx);front=self.makecard(old.kind,training,old.uid,front=True)
  # Test rosters are whole hundreds, except no partials in equal-resource suite.
  g=min(3,math.ceil(k/6),max(0,k-1))
  # Each represented troop kind has one real leader, never several copies of that person.
  eligible=[kind for kind in sorted(roster,key=lambda kind:(-roster[kind],list(BASE).index(kind))) if any(c.kind==kind for c in deck)]
  for kind in eligible[:g]:
   i=next(i for i,c in enumerate(deck) if c.kind==kind);deck[i]=self.makecard(kind,training,deck[i].uid,True,hero)
  for kind,cost in [('supply',3),('arrows',4),('heal',2)]:
   for _ in range(2):deck.append(Card(kind,cost,uid=uid));uid+=1
  Random(seed).shuffle(deck)
  p=Player(deck,[front],reserve,hero);p.training=training
  return p
 def draw(self,p):
  if p.deck:
   c=p.deck.pop(0);(p.hand if len(p.hand)<10 else p.grave).append(c)
 def start(self,i):
  self.turn=i;p=self.p[i];p.own_turn+=1;p.power_used=False
  if p.own_turn>1:p.maxmana=min(10,p.maxmana+1)
  p.mana=p.maxmana
  for c in p.board:c.ready=True;c.rushing=False
  if p.own_turn>1:
   reserve=[k for k,v in p.reserve.items() if v>=100]
   troops_in_hand=sum(c.attack>0 for c in p.hand)
   if p.gaps and reserve and len(p.hand)<10 and (troops_in_hand<=2 or not p.deck):
    kind=next((k for k in p.gaps if p.reserve.get(k,0)>=100),None)
    if kind is None:kind=max(reserve,key=lambda k:(p.reserve[k],-list(BASE).index(k)))
    p.reserve[kind]-=100;p.gaps.pop(p.gaps.index(kind) if kind in p.gaps else 0)
    c=self.makecard(kind,p.training,p.nextid);p.nextid+=1;p.deck.insert(0,c)
   self.draw(p)
 def cleanup(self):
  for p in self.p:
   dead=[c for c in p.board if c.hp<=0]
   for c in dead:p.gaps.append(c.kind)
   p.grave+=dead;p.board=[c for c in p.board if c.hp>0]
  a,b=self.p
  if a.hp<=0 and b.hp<=0:self.result='draw'
  elif a.hp<=0:self.result=1
  elif b.hp<=0:self.result=0
 def legal(self,c,enemy):
  if not c.ready:return []
  guards=[j for j,t in enumerate(enemy.board) if 'guard' in t.tags]
  if guards:return guards
  return list(range(len(enemy.board)))+([] if c.rushing else [-1])
 def damage(self,a,b):
  bonus=2 if ('anti'in a.tags and b.kind in CAV)or('pierce'in a.tags and 'guard'in b.tags) else 0
  reduce=2 if 'reduce2'in a.tags else 1 if 'reduce1'in a.tags else 0
  return a.attack+bonus,max(0,b.attack-reduce)
 def value(self,c):return c.attack*1.15+max(0,c.hp)*.6+('guard'in c.tags)*1.0
 def hurt_value(self,c,n):return self.value(c) if n>=c.hp else n*.6
 def public_threat(self,enemy):return sum(c.attack for c in enemy.board)
 def choose(self):
  p=self.p[self.turn];e=self.p[1-self.turn];actions=[];face_weight=.9 if self.policy=='balanced' else 1.35
  danger=max(0,self.public_threat(e)-p.hp+5)
  for i,a in enumerate(p.board):
   for j in self.legal(a,e):
    if j<0:
     score=1e6 if a.attack>=e.hp else a.attack*(face_weight+(e.hp<=12)*.35)
    else:
     t=e.board[j];d,r=self.damage(a,t)
     score=self.hurt_value(t,d)-self.hurt_value(a,r)
     if d>=t.hp:score+=1.8+min(danger,t.attack)*1.1
     if a.hp>r:score+=.15
    actions.append((score,('attack',i,j)))
  for i,c in enumerate(p.hand):
   if c.cost>p.mana:continue
   if c.kind=='coin':
    best=max((self.play_score(x,p,e)[0] for x in p.hand if x.kind!='coin' and x.cost<=p.mana and (not x.attack or len(p.board)<7)),default=0)
    unlocked=max((self.play_score(x,p,e)[0] for x in p.hand if x.cost==p.mana+1 and (not x.attack or len(p.board)<7)),default=0)
    if p.mana==1 and not p.power_used and p.hero=='martial':
     kills=[t for t in e.board if t.hp<=2]
     if kills:unlocked=max(unlocked,max(self.hurt_value(t,2)+2.1 for t in kills))
    if p.mana<10 and unlocked>best+.5:actions.append((unlocked+.2,('coin',i)))
    continue
   if c.attack and len(p.board)>=7:continue
   score,target=self.play_score(c,p,e)
   if score>0:actions.append((score,('play',i,target)))
  if p.mana>=2 and not p.power_used:
   if p.hero=='martial' and e.board:
    j=max(range(len(e.board)),key=lambda j:self.hurt_value(e.board[j],2));score=self.hurt_value(e.board[j],2)+.3
    if 2>=e.board[j].hp:score+=1.8+min(danger,e.board[j].attack)
    actions.append((score,('power',j)))
   elif p.hero=='intelligence' and p.deck and len(p.hand)<10:actions.append((3.8,('power',-1)))
   elif p.hero=='command' and p.hp<p.maxhp:actions.append((min(3,p.maxhp-p.hp)*(1.0+min(danger,4)*.15),('power',-1)))
  if not actions:return ('end',)
  score,action=max(actions,key=lambda x:(x[0],str(x[1])))
  return action if score>0 else ('end',)
 def play_score(self,c,p,e):
  danger=max(0,self.public_threat(e)-p.hp+5)
  if c.attack:
   score=self.value(c)-c.cost*.2+('rush'in c.tags)*.4+('guard'in c.tags)*min(4,danger*.25);target=-1
   entry=(2 if 'shot'in c.tags else 0)+(2 if c.trait=='martial' else 0)
   if entry and e.board:
    target=max(range(len(e.board)),key=lambda j:self.hurt_value(e.board[j],entry));score+=self.hurt_value(e.board[target],entry)
    if entry>=e.board[target].hp:score+=1.8
   if c.trait=='intelligence' and p.deck:score+=3.5
   if c.trait=='command':score+=min(3,p.maxhp-p.hp)
   return score,target
  if c.kind=='arrows':return sum(self.hurt_value(t,2)+(1.8 if t.hp<=2 else 0) for t in e.board)-.3,-1
  if c.kind=='heal':return min(4,p.maxhp-p.hp)*(1+min(4,danger)*.15),-1
  if c.kind=='supply':return min(2,len(p.deck),10-len(p.hand)+1)*3.5-.3,-1
  return 0,-1
 def act(self,action):
  p=self.p[self.turn];e=self.p[1-self.turn];kind=action[0];self.actions+=1
  if kind=='attack':
   _,i,j=action;a=p.board[i];a.ready=False
   if j<0:e.hp-=a.attack
   else:
    t=e.board[j];d,r=self.damage(a,t);t.hp-=d;a.hp-=r
  elif kind=='coin':p.hand.pop(action[1]);p.mana=min(10,p.mana+1)
  elif kind=='play':
   _,i,j=action;c=p.hand.pop(i);p.mana-=c.cost
   if c.attack:
    p.board.append(c);c.ready='rush'in c.tags;c.rushing=c.ready
    if p.own_turn==1:self.opening[self.turn]=True
    entry=(2 if 'shot'in c.tags else 0)+(2 if c.trait=='martial' else 0)
    if entry and j>=0:e.board[j].hp-=entry
    if c.trait=='intelligence':self.draw(p)
    if c.trait=='command':p.hp=min(p.maxhp,p.hp+3)
   elif c.kind=='arrows':
    for t in e.board:t.hp-=2
   elif c.kind=='supply':self.draw(p);self.draw(p)
   elif c.kind=='heal':p.hp=min(p.maxhp,p.hp+4)
  elif kind=='power':
   p.mana-=2;p.power_used=True
   if p.hero=='martial':e.board[action[1]].hp-=2
   elif p.hero=='intelligence':self.draw(p)
   else:p.hp=min(p.maxhp,p.hp+3)
  elif kind=='end':
   self.cleanup()
   if self.result is not None:return
   if self.turn!=self.first:
    if self.round>=16:
     for q in self.p:q.hp-=self.round-15
     self.cleanup()
     if self.result is not None:return
    self.round+=1
   self.start(1-self.turn)
  self.cleanup()
 def run(self):
  while self.result is None and self.round<=40 and self.actions<2500:self.act(self.choose())
  if self.result is None:raise RuntimeError('stalled')
  return self.result

ROSTERS={
 'mixed_1800':{'infantry':500,'spears':400,'cavalry':400,'archers':300,'heavy':200},
 'infantry_1800':{'infantry':1800},
 'cavalry_1800':{'cavalry':1000,'heavy':800},
 'ranged_1800':{'archers':900,'crossbows':900},
 'heavy_1800':{'heavy':1800},
 'exotic_1800':{'camel':600,'horse_archers':600,'elephant':600},
 'mixed_600':{'infantry':200,'spears':200,'cavalry':100,'archers':100},
 'reserve_3600':{'infantry':1000,'spears':800,'cavalry':800,'archers':600,'heavy':400}}

def evaluate(name,roster,n,training,hero,variant,policy='balanced',offset=0):
 first_wins=draws=identity_wins=opening_bad=0;rounds=[];pairs=[];fatigue=0
 for seed in range(offset,offset+n):
  pair=[]
  seeds=(seed*2+9187,seed*2+9188)
  for first in (0,1):
   game=Game(roster,training,hero,seeds,variant,policy,first)
   result=game.run();fw=result==first;draw=result=='draw'
   first_wins+=fw;draws+=draw;identity_wins+=result==0
   pair.append(.5 if draw else float(fw));rounds.append(game.round);fatigue+=game.round>=16;opening_bad+=not all(game.opening)
  pairs.append(sum(pair)/2)
 total=2*n;score=(first_wins+draws*.5)/total
 se=statistics.stdev(pairs)/math.sqrt(n) if n>1 else 0
 return dict(case=name,training=training,hero=hero,variant=variant,policy=policy,seed_pairs=n,games=total,first_wins=first_wins,second_wins=total-first_wins-draws,draws=draws,first_score=round(score,5),paired_95ci=[round(max(0,score-1.96*se),5),round(min(1,score+1.96*se),5)],A_score=round((identity_wins+draws*.5)/total,5),median_rounds=statistics.median(rounds),fatigue_rate=round(fatigue/total,5),opening_no_deployment=opening_bad)

def main():
 parser=argparse.ArgumentParser();parser.add_argument('--pairs',type=int,default=100);parser.add_argument('--variants',default='coin,coin_extra,extra');parser.add_argument('--output',default='/private/tmp/card-fairness-screen.json');parser.add_argument('--offset',type=int,default=0);parser.add_argument('--suite',default='screen');parser.add_argument('--policy',default='balanced');args=parser.parse_args()
 variants=args.variants.split(',');cases=[]
 if args.suite=='screen':cases=[('mixed_1800',60,h) for h in ('martial','intelligence','command')]+[('heavy_1800',60,'martial'),('cavalry_1800',60,'martial')]
 else:cases=[(name,t,h) for name in ROSTERS for t in (20,60,90) for h in ('martial','intelligence','command')]
 results=[];start=time.monotonic()
 for variant in variants:
  for name,training,hero in cases:
   r=evaluate(name,ROSTERS[name],args.pairs,training,hero,variant,policy=args.policy,offset=args.offset);results.append(r)
   print(name,training,hero,variant,r['first_score'],r['paired_95ci'],'draw',r['draws'],'turn',r['median_rounds'],flush=True)
 data={'date':'2026-10-22','model':'isolated-design-greedy-v4','scope':'design-level combat simulation; excludes campaign resources, portraits, source packing and user skill; one unique 75-primary leader per troop kind, hero HP32, no ordinary 80-attribute bonus or city','method':'paired faction A/B seats; per-faction deck seed held constant; paired-score normal 95% interval; no opponent hand/order inspection','results':results,'total_games':sum(r['games'] for r in results),'seconds':round(time.monotonic()-start,2),'sha256':hashlib.sha256(open(__file__,'rb').read()).hexdigest()}
 with open(args.output,'w') as f:json.dump(data,f,ensure_ascii=False,indent=2)
 print('total',data['total_games'],'seconds',data['seconds'],flush=True)
if __name__=='__main__':main()
