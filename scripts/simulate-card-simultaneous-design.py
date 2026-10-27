"""Experimental simultaneous-order design model. Does not change the game."""
import importlib.util,sys,json,argparse,statistics,hashlib,copy,random,math
from pathlib import Path
BASE_PATH=Path(__file__).resolve().with_name('simulate-card-design-fairness.py')
spec=importlib.util.spec_from_file_location('card_model_sync',BASE_PATH);m=importlib.util.module_from_spec(spec);sys.modules[spec.name]=m;spec.loader.exec_module(m)
Original=m.Game
class SimultaneousGame(Original):
 def __init__(self,roster,training,hero,seeds,variant='simultaneous',policy='balanced',first=0,**kwargs):
  super().__init__(roster,training,hero,seeds,'none',policy,first,**kwargs)
  for p in self.p:p.own_turn=1;p.power_used=False;p.mana=p.maxmana=3
  self.ticks=0;self.planning_orders=[]
 def choose_for(self,i):
  self.turn=i
  return self.choose()
 def step(self,orders,resolve_order=(0,1)):
  """Both orders refer to one common pre-action board. No initiative parameter."""
  before=[list(p.board) for p in self.p]
  self.planning_orders=list(orders);self.ticks+=1
  if all(a[0]=='end' for a in orders):
   self.actions+=2
   if self.round>=16:
    for p in self.p:p.hp-=self.round-15
    self.cleanup()
    if self.result is not None:return
   self.round+=1
   for i in resolve_order:super().start(i)
   return
  damage=[{},{}];hero_delta=[0,0];heals=[0,0]
  def hit(side,c,n):damage[side][id(c)]=damage[side].get(id(c),0)+n
  # Mutual attacks between the same two troops form one clash, not two clashes.
  mutual=False
  if all(a[0]=='attack' and a[2]>=0 for a in orders):
   a,b=orders
   mutual=(a[1]==b[2] and a[2]==b[1])
  if mutual:
   a,b=before[0][orders[0][1]],before[1][orders[1][1]]
   # A troop acting as attacker gets its anti/pierce bonus; no counter-reduction.
   da=self.damage(a,b)[0];db=self.damage(b,a)[0]
   hit(1,b,da);hit(0,a,db);a.ready=False;b.ready=False
  for side in resolve_order:
   p=self.p[side];e=self.p[1-side];a=orders[side];kind=a[0];self.actions+=1
   if kind=='end':continue
   if kind=='attack':
    if mutual:continue
    _,i,j=a;c=before[side][i];c.ready=False
    if j<0:hero_delta[1-side]-=c.attack
    else:
     target=before[1-side][j];d,r=self.damage(c,target);hit(1-side,target,d);hit(side,c,r)
   elif kind=='play':
    _,i,j=a;c=p.hand.pop(i);p.mana-=c.cost
    if c.attack:
     p.board.append(c);c.ready='rush'in c.tags;c.rushing=c.ready
     if p.own_turn==1:self.opening[side]=True
     entry=(2 if 'shot'in c.tags else 0)+(2 if c.trait=='martial' else 0)
     if entry and j>=0:hit(1-side,before[1-side][j],entry)
     if c.trait=='intelligence':self.draw(p)
     if c.trait=='command':heals[side]+=3
    elif c.kind=='arrows':
     for target in before[1-side]:hit(1-side,target,2)
    elif c.kind=='supply':self.draw(p);self.draw(p)
    elif c.kind=='heal':heals[side]+=4
   elif kind=='power':
    p.mana-=2;p.power_used=True
    if p.hero=='martial':hit(1-side,before[1-side][a[1]],2)
    elif p.hero=='intelligence':self.draw(p)
    else:heals[side]+=3
   else:raise AssertionError(a)
  # Healing cannot bank HP above max before same-tick damage.
  for i,p in enumerate(self.p):
   for c in before[i]:c.hp-=damage[i].get(id(c),0)
   p.hp=min(p.maxhp,p.hp+heals[i])+hero_delta[i]
  self.cleanup()
 def run(self):
  while self.result is None and self.round<=40 and self.actions<2500:
   orders=tuple(self.choose_for(i) for i in (0,1))
   self.step(orders)
  if self.result is None:raise RuntimeError('stalled')
  return self.result
m.Game=SimultaneousGame

def summary_case(name,t,h,n,offset,policy):
 scores=[];draws=0;rounds=[];opening=0;long=0;points=[]
 for seed in range(offset,offset+n):
  g=SimultaneousGame(m.ROSTERS[name],t,h,(seed*2+9187,seed*2+9188),policy=policy)
  result=g.run();draw=result=='draw';draws+=draw
  scores.append(.5 if draw else float(result==0));rounds.append(g.round);opening+=not all(g.opening);long+=g.round>=16
 score=statistics.mean(scores);se=statistics.stdev(scores)/math.sqrt(n) if n>1 else 0
 return {'case':name,'training':t,'hero':h,'games':n,'A_wins':sum(s==1 for s in scores),'B_wins':sum(s==0 for s in scores),'draws':draws,'A_score':round(score,5),'A_score_95ci':[round(max(0,score-1.96*se),5),round(min(1,score+1.96*se),5)],'median_rounds':statistics.median(rounds),'fatigue_rate':round(long/n,5),'opening_no_deployment':opening}

def invariants(n=200,offset=900000):
 counters={'identity_swap_games':0,'resolver_order_games':0,'first_label_games':0,'resource_states':0,'identical_orders_games':0,'legal_opening_states':0,'edge_cases':0}
 for seed in range(offset,offset+n):
  name=list(m.ROSTERS)[seed%8];t=(20,60,90)[seed%3];h=('martial','intelligence','command')[seed%3];seeds=(seed*2+9187,seed*2+9188)
  a=SimultaneousGame(m.ROSTERS[name],t,h,seeds)
  b=SimultaneousGame(m.ROSTERS[name],t,h,seeds[::-1])
  c=SimultaneousGame(m.ROSTERS[name],t,h,seeds,first=1)
  rev=SimultaneousGame(m.ROSTERS[name],t,h,seeds)
  for p in a.p:
   assert any(c.attack>0 and c.cost<=p.mana for c in p.hand)
   counters['legal_opening_states']+=1
  while a.result is None:
   orders=tuple(a.choose_for(i) for i in (0,1))
   assert tuple(b.choose_for(i) for i in (0,1))==orders[::-1]
   assert tuple(c.choose_for(i) for i in (0,1))==orders
   assert tuple(rev.choose_for(i) for i in (0,1))==orders
   a.step(orders);b.step(orders[::-1]);c.step(orders);rev.step(orders,(1,0))
   def state(g):
    return [(p.hp,p.mana,p.maxmana,p.power_used,p.own_turn,[(x.kind,x.cost,x.attack,x.hp,x.ready,x.rushing,x.trait,x.uid) for x in p.board],[(x.kind,x.uid)for x in p.hand],[(x.kind,x.uid)for x in p.deck],p.reserve,[(x.kind,x.uid)for x in p.grave])for p in g.p]
   assert state(a)==state(b)[::-1]
   assert state(a)==state(c)==state(rev)
   for g in (a,b,c,rev):
    for p in g.p:
     assert 0<=p.mana<=p.maxmana<=10 and len(p.board)<=7 and len(p.hand)<=10
     cards=[x for x in p.deck+p.hand+p.board+p.grave if x.attack>0]
     assert len({x.uid for x in cards})==len(cards)
     assert len(cards)*100+sum(p.reserve.values())==sum(m.ROSTERS[name].values())
     counters['resource_states']+=1
  assert b.result==('draw' if a.result=='draw' else 1-a.result)
  assert c.result==a.result==rev.result
  counters['identity_swap_games']+=2;counters['resolver_order_games']+=2;counters['first_label_games']+=2
  equal=SimultaneousGame(m.ROSTERS[name],t,h,(seeds[0],seeds[0]))
  assert equal.run()=='draw';counters['identical_orders_games']+=1
 # Explicit same-tick clashes and lethal cases.
 def blank():
  g=SimultaneousGame(m.ROSTERS['mixed_600'],60,'martial',(17,19))
  for p in g.p:p.board=[];p.hand=[];p.hp=32
  return g
 def card(a,h,tags=()):return m.Card('infantry',2,a,h,h,set(tags),ready=True)
 g=blank();g.p[0].board=[card(5,10)];g.p[1].board=[card(3,10)]
 g.step((('attack',0,0),('attack',0,0)))
 assert [p.board[0].hp for p in g.p]==[7,5];counters['edge_cases']+=1
 g=blank()
 for p in g.p:p.hp=5;p.board=[card(5,10)]
 g.step((('attack',0,-1),('attack',0,-1)))
 assert g.result=='draw';counters['edge_cases']+=1
 g=blank();g.p[0].board=[card(5,2)];g.p[1].board=[card(3,10)]
 g.step((('attack',0,-1),('power',0)))
 assert g.p[1].hp==27 and len(g.p[0].board)==0;counters['edge_cases']+=1
 g=blank();g.p[0].board=[card(5,10)];g.p[1].hand=[m.Card('infantry',2,2,8,8,{'guard'})]
 g.step((('attack',0,-1),('play',0,-1)))
 assert g.p[1].hp==27 and len(g.p[1].board)==1;counters['edge_cases']+=1
 g=blank();g.p[0].board=[card(5,10)];g.p[1].hand=[m.Card('infantry',2,2,8,8,{'guard'})]
 g.step((('end',),('play',0,-1)))
 assert g.round==1;g.step((('end',),('end',)));assert g.round==2;counters['edge_cases']+=1
 g=blank();g.p[0].hand=[m.Card('arrows',4)];g.p[0].mana=4;g.p[0].maxmana=4
 g.p[1].board=[card(2,8)];g.p[1].hand=[m.Card('infantry',2,2,8,8,{'guard'})]
 g.step((('play',0,-1),('play',0,-1)))
 assert [c.hp for c in g.p[1].board]==[6,8];counters['edge_cases']+=1
 g=blank();g.p[0].hand=[m.Card('cavalry',3,4,7,7,{'rush'})]
 g.step((('play',0,-1),('end',)))
 assert g.p[0].board[0].ready and g.p[0].board[0].rushing
 assert -1 not in g.legal(g.p[0].board[0],g.p[1]);counters['edge_cases']+=1
 return counters

if __name__=='__main__':
 p=argparse.ArgumentParser();p.add_argument('--games',type=int,default=500);p.add_argument('--full',action='store_true');p.add_argument('--output',default='/private/tmp/card-simultaneous-screen.json');p.add_argument('--offset',type=int,default=500000);p.add_argument('--policy',default='balanced');p.add_argument('--check-games',type=int,default=200);a=p.parse_args()
 checks=invariants(a.check_games);print('checks',checks,flush=True)
 cases=[(n,60,h)for n,h in [('mixed_1800','martial'),('mixed_1800','intelligence'),('mixed_1800','command'),('heavy_1800','intelligence'),('cavalry_1800','intelligence')]]
 if a.full:cases=[(n,t,h)for n in m.ROSTERS for t in (20,60,90)for h in ('martial','intelligence','command')]
 rows=[]
 for n,t,h in cases:
  r=summary_case(n,t,h,a.games,a.offset,a.policy);rows.append(r);print(n,t,h,r['A_score'],r['A_score_95ci'],'draw',r['draws'],'turn',r['median_rounds'],flush=True)
 d={'scope':'isolated experimental simultaneous-order design model, not shipped game win rates; no first seat exists','candidate':'one hidden action each; common snapshot targets; simultaneous damage; shared round resources; no coin or bonus hand','base_model_sha256':hashlib.sha256(BASE_PATH.read_bytes()).hexdigest(),'results':rows,'games':sum(r['games']for r in rows),'policy':a.policy,'checks':checks,'model_sha256':hashlib.sha256(Path(__file__).read_bytes()).hexdigest()}
 Path(a.output).write_text(json.dumps(d,ensure_ascii=False,indent=2)+'\n')
 print('games',d['games'],'mean_A',statistics.mean(r['A_score']for r in rows),'max_A_gap',max(abs(r['A_score']-.5)for r in rows),flush=True)
