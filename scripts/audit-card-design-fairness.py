import importlib.util,sys,json
from pathlib import Path
import argparse,hashlib
args=argparse.ArgumentParser();args.add_argument('--quick',action='store_true');args.add_argument('--output',default='/private/tmp/card-design-fairness-audit.json');args=args.parse_args()
spec=importlib.util.spec_from_file_location('design',str(Path(__file__).with_name('simulate-card-design-fairness.py')));m=importlib.util.module_from_spec(spec);sys.modules['design']=m;spec.loader.exec_module(m)
checks=0;conservation=0;opening_checks=0
for name in ['mixed_1800','cavalry_1800','heavy_1800','mixed_600','reserve_3600']:
 for hero in ['martial','intelligence','command']:
  for seed in range(3 if args.quick else 30):
   a=m.Game(m.ROSTERS[name],60,hero,(seed*2+123,seed*2+124),first=0)
   b=m.Game(m.ROSTERS[name],60,hero,(seed*2+124,seed*2+123),first=1)
   for game in [a,b]:
    for p in game.p:
     assert any(c.attack>0 and c.cost<=3 for c in p.hand)
     opening_checks+=1
   ar=a.run();br=b.run();expected='draw' if ar=='draw' else 1-ar
   assert br==expected and a.actions==b.actions and a.round==b.round,(name,hero,seed,ar,br)
   checks+=1
   for game in [a,b]:
    for p in game.p:
     units=[c for zone in [p.hand,p.deck,p.board,p.grave] for c in zone if c.attack>0]
     assert len({c.uid for c in units})==len(units)
     assert len(units)*100+sum(p.reserve.values())==sum(m.ROSTERS[name].values())
     assert 0<=p.mana<=10 and len(p.hand)<=10 and len(p.board)<=7
     conservation+=1
# Fixed equal hands: a legal opening counterexample, not an optimal-strategy proof.
g=m.Game({'heavy':1800},60,'intelligence',(140,141),first=0)
for i,p in enumerate(g.p):
 pool=[c for c in p.hand+p.deck if c.kind!='coin'];front=next(c for c in pool if c.cost==2 and c.attack>0);pool.remove(front)
 heavy=[c for c in pool if c.kind=='heavy' and not c.general][:2]
 for c in heavy:pool.remove(c)
 heal=next(c for c in pool if c.kind=='heal');pool.remove(heal)
 p.hand=[front,*heavy,heal];p.deck=pool
 if i==1:p.hand.append(m.Card('coin',0))
trace=[]
def snap(event):
 trace.append(dict(event=event,round=g.round,turn=g.turn,mana=[p.mana for p in g.p],board=[[(c.kind,c.attack,c.hp) for c in p.board] for p in g.p]))
def play(kind):
 p=g.p[g.turn];i=next(i for i,c in enumerate(p.hand) if c.kind==kind and (kind!='heavy' or not c.general));assert p.hand[i].cost<=p.mana;g.act(('play',i,-1))
# both deploy actual vanguards
for _ in range(2):
 p=g.p[g.turn];i=next(i for i,c in enumerate(p.hand) if c.attack>0 and c.cost==2);g.act(('play',i,-1));snap('部署前锋');g.act(('end',))
assert g.turn==0 and g.p[0].mana==4
assert all(c.cost>4 for c in g.p[0].hand if c.attack>0);snap('先手第二回合4军令，不能出5费重骑');g.act(('end',))
coin=next(i for i,c in enumerate(g.p[1].hand) if c.kind=='coin');g.act(('coin',coin));snap('后手第二回合用调兵令，达到5军令');play('heavy');snap('后手提前部署5费重骑')
assert g.p[1].board[-1].ready and 'rush'in g.p[1].board[-1].tags
assert g.p[0].own_turn==2
print('通过：身份/座位变换',checks,'组；兵员额度、实体唯一与资源约束',conservation,'侧终态；固定起手费用越级反例1组')
held=[]
for name,hero in [('mixed_1800','martial'),('cavalry_1800','intelligence'),('heavy_1800','intelligence')]:
 for variant in ['coin','coin_extra']:
  r=m.evaluate(name,m.ROSTERS[name],50 if args.quick else 1000,60,hero,variant,offset=100000);held.append(r);print('独立复核',name,hero,variant,r['first_score'],r['paired_95ci'],flush=True)
main=[]
for variant in ['coin','coin_extra']:
 for name in m.ROSTERS:
  for training in (20,60,90):
   for hero in ('martial','intelligence','command'):
    main.append(m.evaluate(name,m.ROSTERS[name],25 if args.quick else 500,training,hero,variant))
 print('完成主矩阵',variant,flush=True)
aggressive=[]
for name,hero in [('mixed_1800','martial'),('cavalry_1800','intelligence'),('heavy_1800','intelligence')]:
 for variant in ['coin','coin_extra']:
  aggressive.append(m.evaluate(name,m.ROSTERS[name],25 if args.quick else 500,60,hero,variant,policy='aggressive',offset=200000))
report={'scope':'isolated design combat model; not shipped game win rates', 'quick':args.quick,'model_sha256':hashlib.sha256(Path(m.__file__).read_bytes()).hexdigest(),'identity_pairs':checks,'opening_legal_checks':opening_checks,'terminal_resource_checks':conservation,'fixed_hand_counterexample':trace,'main_matrix':main,'independent_holdout':held,'aggressive_policy':aggressive}
report['statistical_games']=sum(r['games'] for r in main+held+aggressive)
Path(args.output).write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
print('推演统计局数',report['statistical_games'],'结果',args.output)
