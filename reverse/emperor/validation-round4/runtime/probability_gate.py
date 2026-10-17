from common import *
rows=[]
for seed in [0,1,12345,0xffffffff]:
 nextseed=(seed*0x41c64e6d+0x3039)&0xffffffff;draw=((nextseed>>16)&0x7fff)%100
 for threshold in sorted(set([-1,0,1,draw,draw+1,99,100,109,150])):
  put(p.data(0xc9030),seed,4);r=p.call(0x8a7fe,[p.data(0xcc584),threshold&0xffffffff]);actual=r['EAX']&0xffff;actualseed=get(p.data(0xc9030),4,False);expect=int(draw<threshold);rows.append(dict(seed=seed,draw=draw,threshold=threshold,actual=actual,expected=expect,next_seed=actualseed,passed=actual==expect and actualseed==nextseed))
finish('probability-gate',rows);assert all(r['passed'] for r in rows)
