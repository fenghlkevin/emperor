from common import *
import importlib.util
spec=importlib.util.spec_from_file_location('pred',ROOT.parent/'negotiation/predictions.py');m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
l.load();W=alloc(0x200);B=alloc(0x800);p.write(W,bytes(0x200));put(W+0x5d,B,4);b=bytearray(0x800);b[0x12]=1
for base in [0x65,0x3ce]:
 for i in range(45):b[base+i*18+1]=255
 b[base+1]=0
struct.pack_into('<h',b,0x3ce+4,100);p.write(B,b);frame=p.STACK-0x100;p.write(frame-0x440,bytes(0x460));put(frame+0x14,W,4)
def model(seed,r):
 if r<=100:return 2,seed,[]
 t=(r-100)//4;s,q=m.next_rng(seed)
 if q<t:return 0,s,[q]
 s2,q2=m.next_rng(s)
 return (1 if q2<t else 2),s2,[q,q2]
rows=[]
for r in [99,100,103,104,108,496,499,500]:
 chosen={}
 for seed in range(300000):
  o,ns,qs=model(seed,r);chosen.setdefault(o,(seed,ns,qs))
  if len(chosen)==(1 if r<=103 or r>=500 else 3):break
 for o,(seed,ns,qs) in chosen.items():
  put(B+0x69,r);put(W+0x5b,77);put(p.data(0xc9030),seed,4);block(0x5e686,0x5e7a3,frame);actual=get(W+0x5b);actualseed=get(p.data(0xc9030),4,False);rows.append({'ratio':r,'seed':seed,'rolls':qs,'actual_option':actual,'expected_option':o,'actual_next_seed':actualseed,'expected_next_seed':ns,'passed':actual==o and actualseed==ns})
finish('enemy-surrender-live',rows);assert all(x['passed'] for x in rows)
