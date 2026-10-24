"""Experimental alternating-action candidate, not implemented in the game."""
import importlib.util,sys,json,argparse,statistics,hashlib
from pathlib import Path
BASE_PATH=Path(__file__).resolve().with_name('simulate-card-design-fairness.py')
spec=importlib.util.spec_from_file_location('card_model',BASE_PATH);m=importlib.util.module_from_spec(spec);sys.modules['card_model']=m;spec.loader.exec_module(m)
Original=m.Game
class AlternatingGame(Original):
 def __init__(self,roster,training,hero,seeds,variant='alternating',policy='balanced',first=0,**kwargs):
  super().__init__(roster,training,hero,seeds,'none',policy,first,**kwargs)
  for p in self.p:p.own_turn=1;p.power_used=False;p.mana=p.maxmana=3
  self.passes=0;self.last_effective=None
 def act(self,action):
  actor=self.turn
  if action[0]!='end':
   super().act(action)
   self.passes=0;self.last_effective=actor
   if self.result is None:self.turn=1-actor
   return
  self.actions+=1;self.passes+=1
  if self.passes<2:self.turn=1-actor;return
  if self.round>=16:
   for p in self.p:p.hp-=self.round-15
   self.cleanup()
   if self.result is not None:return
  self.round+=1;opener=1-self.last_effective if self.last_effective is not None else 1-self.first
  for i in (0,1):super().start(i)
  self.turn=opener;self.passes=0
m.Game=AlternatingGame
if __name__=='__main__':
 p=argparse.ArgumentParser();p.add_argument('--pairs',type=int,default=300);p.add_argument('--full',action='store_true');p.add_argument('--output',default='/private/tmp/card-alternating-screen.json');p.add_argument('--offset',type=int,default=300000);p.add_argument('--policy',default='balanced');a=p.parse_args()
 cases=[(n,60,h) for n,h in [('mixed_1800','martial'),('mixed_1800','intelligence'),('mixed_1800','command'),('heavy_1800','intelligence'),('cavalry_1800','intelligence')]]
 if a.full:cases=[(n,t,h) for n in m.ROSTERS for t in (20,60,90) for h in ('martial','intelligence','command')]
 rows=[]
 for n,t,h in cases:
  r=m.evaluate(n,m.ROSTERS[n],a.pairs,t,h,'alternating',a.policy,a.offset);rows.append(r);print(n,t,h,r['first_score'],r['paired_95ci'],'draw',r['draws'],'turn',r['median_rounds'],flush=True)
 d={'scope':'isolated experimental alternating-action design model, not shipped game win rates','candidate':'one action each; shared round resources; no coin or bonus hand; next round opens opposite last effective actor','base_model_sha256':hashlib.sha256(BASE_PATH.read_bytes()).hexdigest(),'results':rows,'games':sum(r['games'] for r in rows),'policy':a.policy}
 Path(a.output).write_text(json.dumps(d,ensure_ascii=False,indent=2)+'\n')
 print('games',d['games'],'mean',statistics.mean(r['first_score'] for r in rows),'maxgap',max(abs(r['first_score']-.5)for r in rows),flush=True)
