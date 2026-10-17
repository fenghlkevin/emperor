from common import *
l.load();B=alloc(0x800);b=bytearray(0x800)
for base in [0x65,0x3ce]:
 for i in range(45):b[base+i*18+17]=0xa5
p.write(B,b);p.call(0x84210,[B]);after=p.read(B,0x704);flags=[after[base+i*18+17] for base in [0x65,0x3ce] for i in range(45)];rows=[{'case':'initializer preserves poison','actual_unique_values':sorted(set(flags)),'count':len(flags),'passed':flags==[0xa5]*90}]
put(B+0x18,1,1);put(B+0x390,0,1);put(l.R0+0x22,100);put(l.R0+0x88,50);p.call(0x849ff,[B,0,0,50,0]);raw=p.read(B+0x3ce+18,18);rows.append({'case':'ordinary unit creation preserves poison','unit_hex':raw.hex(),'flag':raw[17],'passed':raw[17]==0xa5});(OUT/'created-unit.bin').write_bytes(raw)
W=alloc(0x200);p.write(W,bytes(0x200));put(W+0x96,B,4);frame=p.STACK-0x100;put(frame+0x14,W,4);put(frame-0x28,1,4);put(frame-0x2c,1,4)
for side in [1,2]:
 for flag in [0,1,2,255]:
  put(W+6,side);put(B+0x65+18+17,flag,1);put(B+0x3ce+18+17,flag,1);put(frame-0x14,500,4);put(frame-0x40,100,4);put(frame-0x3c,100,4);block(0x59658,0x59714,frame);actual=[get(frame-0x40,4),get(frame-0x3c,4)];expected=[85 if flag==1 and side==1 else 100,85 if flag==1 and side==2 else 100];rows.append({'case':'damage flag arithmetic','side':side,'flag':flag,'actual':actual,'expected':expected,'passed':actual==expected})
finish('flag-live',rows);assert all(x['passed'] for x in rows)
