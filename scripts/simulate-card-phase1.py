#!/usr/bin/env python3
"""Isolated Hearthstone-style design model; never imported by the playable game."""
from dataclasses import dataclass, field
from pathlib import Path
from random import Random
from collections import Counter
import argparse, copy, hashlib, json, math, statistics
CATALOG_PATH = Path(__file__).resolve().parents[1] / 'docs' / 'card-battle-phase1-catalog.json'
CAT = json.loads(CATALOG_PATH.read_text())
DEFS = {c['id']: c for c in CAT['cards'] + CAT['initial_generals'] + [CAT['coin']]}
KINDS = ['infantry','spears','cavalry','heavy','archers','crossbows','horse_archers','camel','elephant']
MASKS = {'all': set(KINDS), 'foot': {'infantry','spears'}, 'cavalry': {'cavalry','heavy','horse_archers','camel'}, 'ranged': {'archers','crossbows','horse_archers'}}
ROSTERS = {
 'mixed_1800': {'infantry':500,'spears':400,'cavalry':400,'archers':300,'heavy':200},
 'infantry_1800': {'infantry':1800}, 'cavalry_1800': {'cavalry':1000,'heavy':800},
 'ranged_1800': {'archers':900,'crossbows':900}, 'heavy_1800': {'heavy':1800},
 'exotic_1800': {'camel':600,'horse_archers':600,'elephant':600},
 'mixed_600': {'infantry':200,'spears':200,'cavalry':100,'archers':100},
 'reserve_3600': {'infantry':1000,'spears':800,'cavalry':800,'archers':600,'heavy':400}}

@dataclass
class Card:
    cid: str
    uid: int
    kind: str = ''
    count: int = 0
    a: int = 0
    maxhp: int = 0
    hp: int = 0
    tags: set = field(default_factory=set)
    printed_a: int = 0
    printed_hp: int = 0
    temp_a: int = 0
    ready: bool = False
    rushing: bool = False
    frozen: bool = False
    silenced: bool = False
    played: int = 0
    loss_peak: float = 0
    source_person: str = ''
    @property
    def data(self): return DEFS[self.cid]
    @property
    def troop(self): return self.data['type'] != 'spell'
    @property
    def cost(self): return self.data['cost']

@dataclass
class Player:
    deck: list
    hand: list
    reserve: dict
    training: int
    hero: str
    rng: object
    total: int
    board: list = field(default_factory=list)
    grave: list = field(default_factory=list)
    hp: int = 30
    armor: int = 0
    mana: int = 0
    maxmana: int = 0
    own_turn: int = 0
    power_used: bool = False
    fatigue: int = 0
    discount: int = 0
    gaps: list = field(default_factory=list)
    nextid: int = 10000
    hero_damage: int = 0


def generic_definition(role, tier=1):
    """Fixed example of one already generated person's profile; no per-turn reroll."""
    cid = f'generic_{role}_{tier}'
    if cid in DEFS: return cid
    c = 3 + tier
    if role == 'martial': a,h,t,fx = c,c-1,['rush'],[]
    elif role == 'intelligence': a,h,t,fx = max(1,c-2),c,[],[{'op':'draw','n':1}]
    else: a,h,t,fx = c-1,c+1,['taunt'],[]
    DEFS[cid] = dict(id=cid,name='通用'+role,type='general',kind='source',cost=c,attack=a,health=h,tags=t,enter=fx,death=[])
    return cid

def fixed_random_person(store, person_id, abilities, seed, existing_name=None, portrait_id=None):
    """Create once from ability-gated exclusive pools; reading an existing ID never rolls."""
    if person_id in store: return copy.deepcopy(store[person_id])
    assert all(isinstance(abilities[k],int) and 0<=abilities[k]<=100 for k in ('martial','intelligence','leadership'))
    scores={'martial':abilities['martial'],'intelligence':abilities['intelligence'],'command':abilities['leadership']}
    top=max(scores.values())
    allowed=[r for r,n in scores.items()if n>=top-10 and(r!='martial'or n>=60)]
    if not allowed:allowed=['command'if scores['command']>=scores['intelligence']else'intelligence']
    rng=Random(seed);role=rng.choices(allowed,weights=[1+scores[r]//20 for r in allowed])[0]
    value=scores[role];tier=0 if value<60 else 1 if value<75 else 2 if value<90 else 3
    options=[d for d in CAT['random_pools']if d['role']==role and d['tier']==tier and abilities['martial']>=d['requires_martial']]
    chosen=copy.deepcopy(rng.choice(options))
    attack_limit=2 if abilities['martial']<40 else 3 if abilities['martial']<60 else 4 if abilities['martial']<80 else 6
    chosen['attack']=min(attack_limit,max(1,chosen['attack']+(-1 if abilities['martial']<30 else 1 if abilities['martial']>=90 else 0)))
    chosen['health']=max(1,chosen['health']+(-1 if abilities['leadership']<40 else 1 if abilities['leadership']>=80 else 0))
    identity=CAT['random_identity_pool'];profession=abilities.get('role')
    kind='civil'if profession=='文职'else'military'if profession=='武将'else'civil'if role=='intelligence'and abilities['martial']<60 else'military'
    name=existing_name
    while not name or name in {c['name']for c in CAT['cards']if c['type']=='general'}:
        name=rng.choice(identity['surnames'])+rng.choice(identity['given_names'])
    chosen['name']=name;chosen['person_id']=person_id;chosen['historical_definition_id']=None
    record={'personId':person_id,'name':name,'portraitId':portrait_id or rng.choice(identity[kind]),'abilities':dict(abilities),'role':role,'tier':tier,'poolId':chosen['pool'],'templateId':chosen['id'],'generationVersion':1,'generationSeed':seed,'cardDefinition':chosen}
    store[person_id]=copy.deepcopy(record);return record

class Game:
    def __init__(self, roster, training=60, hero='martial', seeds=(17,19), first=0,
                 policy='balanced', people=None, roster2=None, training2=None, hero2=None,
                 people2=None, generals=True):
        self.first = self.turn = first
        self.round = 1; self.result = None; self.actions = 0; self.sequence = 0
        self.policy = policy; self.play_counts = Counter(); self.opening = [False,False]
        self.p = [self.make(roster, training, hero, seeds[0], people, generals),
                  self.make(roster2 or roster, training if training2 is None else training2,
                            hero2 or hero, seeds[1], people if people2 is None else people2, generals)]
        for side,p in enumerate(self.p):
            front = p.hand[0]
            raw = [p.deck.pop(0) for _ in range(min(2 + (side != first),len(p.deck)))]
            keep = [c for c in raw if c.cost <= 3]
            back = [c for c in raw if c.cost > 3]
            for _ in back:
                if p.deck: keep.append(p.deck.pop(0))
            p.hand = [front] + keep; p.deck += back
            Random(seeds[side] ^ 0x519ca).shuffle(p.deck)
            if side != first: p.hand.append(self.card('coin',9000))
        self.start(first)

    def card(self,cid,uid,kind='',count=0,training=60,source_person=''):
        d = DEFS[cid]
        if d['type']=='spell': return Card(cid,uid)
        is_main = cid.endswith('_line') or cid.endswith('_elite') or d['type']=='general'
        is_elite = cid.endswith('_elite'); is_general = d['type']=='general'
        dh = -1 if training<40 and is_main else 1 if training>=90 and(is_elite or is_general) else 1 if training>=70 and is_elite else 0
        a=max(1,d['attack']); h=max(1,d['health']+dh)
        if count<100:
            a=max(1,math.floor(a*count/100)); h=max(1,math.floor(h*count/100))
        return Card(cid,uid,kind,count,a,h,h,set(d['tags']),a,h,source_person=source_person)

    def make(self,roster,training,hero,seed,people,generals):
        total=sum(roster.values()); k=min(18,max(1,total//100)); reserve=dict(roster)
        q={kind:math.floor(k*n/total) for kind,n in roster.items()}
        order=sorted(roster,key=lambda z:(-(k*roster[z]/total-q[z]),KINDS.index(z)))
        for kind in order[:k-sum(q.values())]: q[kind]+=1
        raw=[]; uid=0
        for kind in KINDS:
            for _ in range(q.get(kind,0)):
                n=min(100,reserve[kind]);reserve[kind]-=n
                raw.append([kind,n,uid]);uid+=1
        # The same actual army members are reassigned to front/scout/general roles.
        front=min(raw,key=lambda x:(DEFS[x[0]+'_line']['cost'],KINDS.index(x[0]),x[2]));raw.remove(front)
        frontcard=self.card('vanguard',front[2],front[0],front[1],training)
        l=min(5,max(0,math.ceil(k/3)-1)); scout=[]
        for _ in range(l):
            if not raw: break
            counts=Counter(x[0] for x in raw)
            pick=min(raw,key=lambda x:(-counts[x[0]],KINDS.index(x[0]),x[2]));raw.remove(pick);scout.append(pick)
        deck=[self.card(kind+'_scout',i,kind,n,training)for kind,n,i in scout]
        # Up to three real additional commanders, with disjoint troops. No repeated person.
        g=min(3,math.ceil(k/6),max(0,k-1),len(raw)) if generals else 0
        selected = list(dict.fromkeys(people)) if people is not None else [generic_definition(hero)]*3
        if people is not None: g=min(g,len(selected))
        for j in range(g):
            pick=max(raw,key=lambda x:(x[1],-KINDS.index(x[0]),-x[2]));raw.remove(pick)
            kind,n,i=pick
            if n<100:raw.append(pick);continue
            cid=selected[j] if people is not None else generic_definition(hero)
            deck.append(self.card(cid,i,kind,n,training,source_person=(cid if people is not None else 'officer_'+str(j))))
        for j,(kind,n,i) in enumerate(raw):
            suffix='elite' if (j+1)%3==0 else 'line'
            deck.append(self.card(kind+'_'+suffix,i,kind,n,training))
        spell_defs=[d for d in CAT['cards']if d['type']=='spell']
        for j in range(30-k):
            d=spell_defs[j%len(spell_defs)];deck.append(self.card(d['id'],uid));uid+=1
        Random(seed).shuffle(deck)
        return Player(deck,[frontcard],reserve,training,hero,Random(seed^0x71cafe),total)

    def draw(self,p,filter=None):
        if filter:
            def ok(c):
                return (c.data['type']=='spell' if filter=='tactic' else c.troop if filter=='troop' else c.data['type']=='general' if filter=='general' else c.cost<=2 if filter=='low' else c.cost>=5)
            i=next((i for i,c in enumerate(p.deck)if ok(c)),None)
            if i is None:return
        else:
            if not p.deck:
                p.fatigue+=1;self.hero_hurt(p,p.fatigue);return
            i=0
        c=p.deck.pop(i);(p.hand if len(p.hand)<10 else p.grave).append(c)

    def start(self,side):
        self.turn=side;p=self.p[side];p.own_turn+=1;p.maxmana=min(10,p.maxmana+1);p.mana=p.maxmana;p.power_used=False;p.discount=0
        for c in p.board:c.ready=True;c.rushing=False
        reserve=[k for k,n in p.reserve.items()if n>=100]
        if p.own_turn>1 and p.gaps and reserve and len(p.hand)<10 and not p.deck:
            kind=next((k for k in p.gaps if p.reserve.get(k,0)>=100),None)
            if kind is None:kind=max(reserve,key=lambda k:(p.reserve[k],-KINDS.index(k)))
            p.reserve[kind]-=100;p.gaps.pop(p.gaps.index(kind)if kind in p.gaps else 0)
            c=self.card(kind+'_line',p.nextid,kind,100,p.training);p.nextid+=1;p.deck.insert(0,c)
        self.draw(p);self.cleanup()

    def hero_hurt(self,p,n):
        absorbed=min(p.armor,n);p.armor-=absorbed;p.hp-=n-absorbed;p.hero_damage+=n-absorbed

    def hurt(self,c,n):
        if n<=0:return
        if 'shield'in c.tags:c.tags.remove('shield');return
        c.hp-=n;c.loss_peak=max(c.loss_peak,min(1,1-c.hp/c.maxhp))

    def cleanup(self):
        # Battlefield death order is play order, never country ID or container order.
        while True:
            dead=sorted([(c.played,s,c)for s,p in enumerate(self.p)for c in p.board if c.hp<=0],key=lambda x:x[0])
            if not dead:break
            for _,s,c in dead:
                p=self.p[s]
                if c not in p.board:continue
                p.board.remove(c);p.grave.append(c);c.loss_peak=1;p.gaps.append(c.kind)
            for _,s,c in dead:
                if not c.silenced:
                    for fx in c.data['death']:self.effect(s,fx,None,c)
        a,b=self.p
        if a.hp<=0 and b.hp<=0:self.result='draw'
        elif a.hp<=0:self.result=1
        elif b.hp<=0:self.result=0

    def mask(self,c,fx):return c.kind in MASKS.get(fx.get('mask','all'),set(KINDS))
    def targets(self,side,fx,actor=None):
        target=fx.get('target')
        if not target:return [None]
        p=self.p[side];e=self.p[1-side]
        pool=p.board if target=='friend'else e.board
        out=[]
        for c in pool:
            if c is actor:continue
            if target!='friend'and 'stealth'in c.tags:continue
            if not self.mask(c,fx):continue
            if fx.get('injured')and c.hp>=c.maxhp:continue
            out.append(c.uid)
        return out
    def find(self,p,uid):return next((c for c in p.board if c.uid==uid),None)
    def effect(self,side,fx,target,actor):
        p=self.p[side];e=self.p[1-side];op=fx['op'];n=fx.get('n',0)
        t=self.find(p if fx.get('target')=='friend'else e,target)if target is not None else None
        if op=='draw':
            for _ in range(n):self.draw(p,fx.get('filter'))
        elif op=='armor':p.armor+=n
        elif op=='heal':p.hp=min(30,p.hp+n)
        elif op=='selfdamage':self.hero_hurt(p,n)
        elif op=='refund':p.mana=min(10,p.mana+n)
        elif op=='discount':p.discount=max(p.discount,n)
        elif op=='aoe':
            for c in list(e.board):self.hurt(c,n)
        elif op=='damage'and t:self.hurt(t,n)
        elif op=='destroy'and t:t.hp=0;t.loss_peak=1
        elif op=='freeze'and t:t.frozen=True
        elif op=='setattack'and t:t.a=n;t.temp_a=0
        elif op=='silence'and t:
            t.silenced=True;t.tags.clear();t.a=t.printed_a;t.maxhp=t.printed_hp;t.hp=min(t.hp,t.maxhp);t.temp_a=0;t.frozen=False
            t.loss_peak=max(t.loss_peak,min(1,1-t.hp/t.maxhp))
        elif op=='buff'and t:self.buff(t,fx)
        elif op=='group':
            pool=[c for c in p.board if c is not actor and self.mask(c,fx)]
            for c in p.rng.sample(pool,min(len(pool),fx.get('limit',len(pool)))):self.buff(c,fx)
    def buff(self,t,fx):
        a,h=fx.get('a',0),fx.get('h',0);t.a=max(0,t.a+a);t.maxhp+=h;t.hp+=h
        if fx.get('temp'):t.temp_a+=a
        if fx.get('give'):t.tags.add(fx['give'])
    def damage(self,a,b):
        bonus=2 if ('anti'in a.tags and b.kind in MASKS['cavalry'])or('pierce'in a.tags and 'taunt'in b.tags)else 0
        return a.a+bonus,b.a
    def legal_attacks(self,c,e):
        if not c.ready or c.frozen or c.a<=0:return []
        guards=[x.uid for x in e.board if 'taunt'in x.tags and 'stealth'not in x.tags]
        return guards or [x.uid for x in e.board if 'stealth'not in x.tags]+([]if c.rushing else [-1])
    def cost(self,p,c):return max(0,c.cost-(p.discount if not c.troop and c.cid!='coin'else 0))
    def targeted_fx(self,c):return next((fx for fx in c.data['enter']if fx.get('target')),None)
    def actions_legal(self):
        s=self.turn;p=self.p[s];e=self.p[1-s];actions=[]
        for c in p.board:
            for uid in self.legal_attacks(c,e):actions.append(('attack',c.uid,uid))
        for c in p.hand:
            if self.cost(p,c)>p.mana or c.troop and len(p.board)>=7:continue
            fx=self.targeted_fx(c);targets=self.targets(s,fx)if fx else [None]
            if c.troop and not targets:targets=[None]
            for target in targets:actions.append(('play',c.uid,target))
        if p.mana>=2 and not p.power_used:
            if p.hero=='martial':actions.extend(('power',x.uid)for x in e.board if 'stealth'not in x.tags);actions.append(('power',-1))
            elif p.hero=='command':
                actions.extend(('power',x.uid)for x in p.board if x.hp<x.maxhp)
                if p.hp<30:actions.append(('power',-1))
            else:actions.append(('power',None))
        return actions+[('end',)]

    def value(self,c):
        return c.a*1.15+max(0,c.hp)*.55+('taunt'in c.tags)*.7+('shield'in c.tags)*(1+c.a*.3)+('stealth'in c.tags)*.6
    def hurt_value(self,c,n):
        if 'shield'in c.tags:return 1+c.a*.3
        return self.value(c)+1.2 if n>=c.hp else n*.55
    def fx_value(self,side,fx,target=None,actor=None):
        p=self.p[side];e=self.p[1-side];op=fx['op'];n=fx.get('n',0);danger=max(0,sum(c.a for c in e.board)-p.hp-p.armor+4)
        t=self.find(p if fx.get('target')=='friend'else e,target)if target is not None else None
        if op=='draw':
            if fx.get('filter'):available=sum((c.data['type']=='spell'if fx['filter']=='tactic'else c.troop if fx['filter']=='troop'else c.data['type']=='general'if fx['filter']=='general'else c.cost<=2 if fx['filter']=='low'else c.cost>=5)for c in p.deck)
            else:available=len(p.deck)
            return min(n,available,max(0,10-len(p.hand)+1))*2.8-(max(0,n-available)*2 if not fx.get('filter')else 0)
        if op=='armor':return n*(.4+min(4,danger)*.1)
        if op=='heal':return min(n,30-p.hp)*(.65+min(4,danger)*.15)
        if op=='selfdamage':return -n*(.5+min(4,danger)*.2)
        if op in ('refund','discount'):return n*.7
        if op=='aoe':return sum(self.hurt_value(c,n)for c in e.board)
        if op=='group':
            pool=[c for c in p.board if c is not actor and self.mask(c,fx)]
            v=fx.get('a',0)*(.9 if not fx.get('temp')else .65)+fx.get('h',0)*.55
            return min(len(pool),fx.get('limit',99))*v
        if not t:return 0
        if op=='damage':return self.hurt_value(t,n)+(min(danger,t.a)if n>=t.hp and 'shield'not in t.tags else 0)
        if op=='destroy':return self.value(t)+1.2+min(danger,t.a)
        if op=='freeze':return t.a*.65+('taunt'in t.tags)*.3 if not t.frozen else 0
        if op=='setattack':return max(0,t.a-n)*1.2
        if op=='silence':return max(0,t.a-t.printed_a)*1.15+max(0,t.maxhp-t.printed_hp)*.55+('shield'in t.tags)*2+('taunt'in t.tags)*1.2+('anti'in t.tags)*.5+len(t.data['death'])*1.2
        if op=='buff':
            a,h=fx.get('a',0),fx.get('h',0)
            if fx.get('temp')and(not t.ready or t.frozen):return 0
            v=a*(1.25 if t.ready and not t.frozen else .8)+h*.55
            if fx.get('give')=='shield'and 'shield'not in t.tags:v+=1+t.a*.3
            if t.ready and not t.frozen and -1 in self.legal_attacks(t,e)and sum(c.a for c in p.board if c.ready and not c.frozen)+a>=e.hp+e.armor:v+=10000
            return v
        return 0
    def play_value(self,c,target=None):
        p=self.p[self.turn];e=self.p[1-self.turn]
        v=(self.value(c)+('rush'in c.tags)*.8+sum(self.fx_value(self.turn,x,None,c)*.4 for x in c.data['death']))if c.troop else 0
        v+=sum(self.fx_value(self.turn,x,target,c)for x in c.data['enter'])
        return v-self.cost(p,c)*.6
    def choose(self):
        p=self.p[self.turn];e=self.p[1-self.turn];choices=[]
        face_weight=1.25 if self.policy=='aggressive'else .8 if self.policy=='control'else 1.0
        total_ready=sum(c.a for c in p.board if c.ready and not c.frozen and -1 in self.legal_attacks(c,e))
        danger=max(0,sum(c.a for c in e.board)-p.hp-p.armor+4)
        for action in self.actions_legal():
            op=action[0];score=0
            if op=='attack':
                a=self.find(p,action[1]);uid=action[2]
                if uid==-1:score=100000 if total_ready>=e.hp+e.armor else a.a*(face_weight+(e.hp+e.armor<=10)*.3)
                else:
                    t=self.find(e,uid);d,r=self.damage(a,t)
                    score=self.hurt_value(t,d)-self.hurt_value(a,r)
                    if d>=t.hp and 'shield'not in t.tags:score+=1.5+min(danger,t.a)
                    if 'stealth'in a.tags:score-=.2
            elif op=='play':
                c=next(c for c in p.hand if c.uid==action[1])
                if c.cid=='coin':
                    current=max((self.play_value(x,t)for x in p.hand if x.cid!='coin'and self.cost(p,x)<=p.mana and(not x.troop or len(p.board)<7)for t in(self.targets(self.turn,self.targeted_fx(x))if self.targeted_fx(x)else[None])),default=0)
                    unlocked=max((self.play_value(x,t)for x in p.hand if x.cid!='coin'and self.cost(p,x)==p.mana+1 and(not x.troop or len(p.board)<7)for t in(self.targets(self.turn,self.targeted_fx(x))if self.targeted_fx(x)else[None])),default=0)
                    if p.mana==1 and not p.power_used:
                        if p.hero=='martial'and e.hp+e.armor<=1:unlocked=100000
                        elif p.hero=='command'and danger>0:unlocked=max(unlocked,2.5)
                    score=unlocked+.2 if unlocked>current+.6 and p.mana<10 else -1
                else:score=self.play_value(c,action[2])
            elif op=='power':
                if p.hero=='martial':
                    score=(100000 if e.hp+e.armor<=1 else face_weight)if action[1]==-1 else self.hurt_value(self.find(e,action[1]),1)
                elif p.hero=='intelligence':score=(2.8-1.0)if p.deck and len(p.hand)<9 and p.hp+p.armor>2+danger else -1
                else:
                    if action[1]==-1:score=min(2,30-p.hp)*(.75+min(4,danger)*.2)
                    else:
                        t=self.find(p,action[1]);score=min(2,t.maxhp-t.hp)*(.9 if t.ready else .7)
            choices.append((score,action))
        score,action=max(choices,key=lambda x:(x[0],str(x[1])))
        return action if score>0 else ('end',)

    def act(self,action):
        p=self.p[self.turn];e=self.p[1-self.turn];s=self.turn;op=action[0];self.actions+=1
        if op=='attack':
            c=self.find(p,action[1]);assert action[2]in self.legal_attacks(c,e);c.ready=False;c.tags.discard('stealth')
            if action[2]==-1:self.hero_hurt(e,c.a)
            else:
                t=self.find(e,action[2]);d,r=self.damage(c,t);self.hurt(t,d);self.hurt(c,r)
        elif op=='play':
            c=next(c for c in p.hand if c.uid==action[1]);cost=self.cost(p,c);assert cost<=p.mana
            p.mana-=cost;p.hand.remove(c);self.play_counts[c.cid]+=1
            if not c.troop and c.cid!='coin':p.discount=0
            if c.troop:
                assert len(p.board)<7;p.board.append(c);self.sequence+=1;c.played=self.sequence;c.ready='rush'in c.tags;c.rushing=c.ready
                if p.own_turn==1:self.opening[s]=True
            else:p.grave.append(c)
            for fx in c.data['enter']:self.effect(s,fx,action[2],c)
        elif op=='power':
            assert p.mana>=2 and not p.power_used;p.mana-=2;p.power_used=True
            if p.hero=='martial':
                if action[1]==-1:self.hero_hurt(e,1)
                else:self.hurt(self.find(e,action[1]),1)
            elif p.hero=='intelligence':self.draw(p);self.hero_hurt(p,2)
            else:
                if action[1]==-1:p.hp=min(30,p.hp+2)
                else:
                    t=self.find(p,action[1]);t.hp=min(t.maxhp,t.hp+2)
        elif op=='end':
            for c in p.board:
                c.a-=c.temp_a;c.temp_a=0;c.frozen=False
            p.discount=0
            self.cleanup()
            if self.result is not None:return
            if self.turn!=self.first:self.round+=1
            self.start(1-self.turn)
        else:raise AssertionError(action)
        self.cleanup()
    def run(self,check=None):
        while self.result is None and self.round<=80 and self.actions<3500:
            self.act(self.choose())
            if check:check(self)
        if self.result is None:raise RuntimeError('stalled')
        return self.result


def evaluate(name,roster,n=200,training=60,hero='martial',policy='balanced',offset=0,**kwargs):
    wins=draws=0;rounds=[];paired=[];plays=Counter();bad=0
    for seed in range(offset,offset+n):
        ps=[];seeds=(seed*2+9187,seed*2+9188)
        for first in (0,1):
            g=Game(roster,training,hero,seeds,first,policy,**kwargs);r=g.run();draw=r=='draw';win=r==first
            wins+=win;draws+=draw;ps.append(.5 if draw else float(win));rounds.append(g.round);plays.update(g.play_counts);bad+=not all(g.opening)
        paired.append(sum(ps)/2)
    score=(wins+.5*draws)/(2*n);se=statistics.stdev(paired)/math.sqrt(n)if n>1 else 0
    return dict(case=name,training=training,hero=hero,policy=policy,seed_pairs=n,games=2*n,first_wins=wins,second_wins=2*n-wins-draws,draws=draws,first_score=round(score,5),paired_95ci=[round(max(0,score-1.96*se),5),round(min(1,score+1.96*se),5)],median_rounds=statistics.median(rounds),opening_no_deployment=bad,plays=dict(plays))

if __name__=='__main__':
    ap=argparse.ArgumentParser();ap.add_argument('--pairs',type=int,default=100);ap.add_argument('--full',action='store_true');ap.add_argument('--offset',type=int,default=400000);ap.add_argument('--output',default='/private/tmp/card-phase1-screen.json');ap.add_argument('--policy',default='balanced');args=ap.parse_args()
    cases=[(n,60,h)for n,h in [('mixed_1800','martial'),('mixed_1800','intelligence'),('mixed_1800','command'),('heavy_1800','intelligence'),('cavalry_1800','intelligence')]]
    if args.full:cases=[(n,t,h)for n in ROSTERS for t in (20,60,90)for h in ('martial','intelligence','command')]
    results=[]
    for n,t,h in cases:
        row=evaluate(n,ROSTERS[n],args.pairs,t,h,args.policy,args.offset);results.append(row);print(n,t,h,row['first_score'],row['paired_95ci'],'round',row['median_rounds'],flush=True)
    report={'scope':'isolated phase-one design model, not game or human win rates','model_sha256':hashlib.sha256(Path(__file__).read_bytes()).hexdigest(),'catalog_sha256':hashlib.sha256(CATALOG_PATH.read_bytes()).hexdigest(),'results':results,'games':sum(r['games']for r in results),'offset':args.offset}
    Path(args.output).write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n');print('total',report['games'],flush=True)
