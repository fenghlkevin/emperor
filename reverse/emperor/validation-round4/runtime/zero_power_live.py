from common import *
import importlib.util
sp=importlib.util.spec_from_file_location('pred',ROOT.parent/'negotiation/predictions.py');m=importlib.util.module_from_spec(sp);sp.loader.exec_module(m)
l.load();W=alloc(0x200);B=alloc(0x800);p.write(W,bytes(0x200));put(W+0x5d,B,4);b=bytearray(0x800)
for base in [0x65,0x3ce]:
 for i in range(45):b[base+i*18+1]=255
b[0x66]=0;struct.pack_into('<h',b,0x69,100);p.write(B,b);frame=p.STACK-0x100;p.write(frame-0x440,bytes(0x460));put(frame+0x14,W,4);seeds=json.loads((ROOT.parent/'negotiation/seeds.json').read_text());rows=[]
for kind,o,d,q,expect in [('surrender',0,0,0,False),('surrender',2,0,99,True),('truce',5,1,19,True),('truce',5,1,20,False),('truce',0,0,0,False)]:
 put(W+0x5b,o);put(frame+0x1c,o,4);put(B+0x12,d,1);put(p.data(0xc9030),seeds[str(q)],4);start,end=(0x5f611,0x5f739) if kind=='surrender' else (0x5fd48,0x5ffdf);block(start,end,frame);actual=get(frame-0x10 if kind=='surrender' else frame-0x358)!=0;r=get(frame-0xc);rows.append({'kind':kind,'option':o,'direction':d,'roll':q,'actual_local_c':r,'actual_success':actual,'expected':expect,'passed':actual==expect and r==1000})
finish('zero-power-live',rows);assert all(x['passed'] for x in rows)
