from common import *
import importlib.util
spec=importlib.util.spec_from_file_location('pred',ROOT.parent/'negotiation/predictions.py');m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
seeds=json.loads((ROOT.parent/'negotiation/seeds.json').read_text());l.load();W=alloc(0x200);B=alloc(0x800);p.write(W,bytes(0x200));put(W+0x5d,B,4);b=bytearray(0x800)
for base in [0x65,0x3ce]:
 for i in range(45):b[base+i*18+1]=255
 b[base+1]=0
struct.pack_into('<h',b,0x3ce+4,100);p.write(B,b);frame=p.STACK-0x100;p.write(frame-0x380,bytes(0x3a0));put(frame+0x14,W,4)
configs=[]
for option,ratios in [(0,[0,1,72,73,74,75,76,40000]),(1,[0,1,99,100,101,40000]),(2,[0,100,1000])]:
 for r in ratios:configs.append(('surrender',option,r,0))
for d in [0,1]:
 for o in range(7):
  rs=([99,100] if o==0 else [74,75] if o==1 else [89,90] if o==2 else [24,25,74,75] if o==3 else [49,50,89,90] if o==4 else [110,111,120,121,199,200,201] if d else [0,1000])
  for r in rs:configs.append(('truce',o,r,d))
rows=[]
for kind,o,r,d in configs:
 t=m.threshold(kind,o,r,d);draws=sorted({0,99,max(0,min(99,t-1)),max(0,min(99,t))})
 for q in draws:
  # Two ordinary A slots support ratios above signed N16 max.
  if r<=32767:ns=[r,0]
  else:ns=[20000,r-20000]
  put(B+0x65+4,ns[0]);put(B+0x65+18+1,0 if ns[1] else 255,1);put(B+0x65+18+4,ns[1]);put(B+0x12,d,1);put(W+0x5b,o);put(frame+0x1c,o,4);seed=seeds[str(q)];put(p.data(0xc9030),seed,4)
  start,end=(0x5f611,0x5f739) if kind=='surrender' else (0x5fd48,0x5ffdf);block(start,end,frame);code=get(frame-0x10 if kind=='surrender' else frame-0x358);actual=code!=0;expect=q<m.s16(t);ratio=get(frame-0xc);row=dict(kind=kind,option=o,direction=d,raw_ratio=r,actual_local_c=ratio,expected_local_c=(m.s16(t) if kind=='truce' and ((d==0 and o in [3,4] and m.s16(r)<(75 if o==3 else 90)) or (d!=0 and o in [5,6] and 110<m.s16(r)<200)) else m.s16(r)),threshold=m.s16(t),draw=q,seed=seed,result_code=code,success=actual,expected_success=expect,passed=actual==expect and ratio==(m.s16(t) if kind=='truce' and ((d==0 and o in [3,4] and m.s16(r)<(75 if o==3 else 90)) or (d!=0 and o in [5,6] and 110<m.s16(r)<200)) else m.s16(r)));rows.append(row)
 (ROOT/'negotiation-live-progress.json').write_text(json.dumps({'done':len(rows),'latest':rows[-1]}))
finish('negotiation-live',rows);assert all(x['passed'] for x in rows)
