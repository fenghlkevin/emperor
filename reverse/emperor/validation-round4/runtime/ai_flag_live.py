"""Execute original AI estimate function; no UI object or game logic substitute."""
from common import *
l.load()
B=alloc(0x800);W=alloc(0x200)
b=bytearray(0x800);w=bytearray(0x200)
# Actor B slot1 at (4,1), defender A slot1 at (5,1).
b[0x3c+11+4]=1;b[0x1b+11+5]=1
for base,attack in [(0x65,500),(0x3ce,1000)]:
 o=base+18;b[o+1]=0;b[o+2]=0
 struct.pack_into('<h',b,o+4,1000)
 struct.pack_into('<h',b,o+13,attack)
 struct.pack_into('<h',b,o+15,0)
struct.pack_into('<I',w,0x5d,B);w[0x79]=1;w[0x6b]=4;w[0x6c]=1
p.write(B,b);p.write(W,w);put(l.R0+0x13c,0)
rows=[]
for flag in [0,1,2,255]:
 put(B+0x65+18+17,flag,1)
 p.call(0x62905,[W,1,1,5])
 actual=get(W+0x8c+22+10)
 # raw losses 76 and38, both scaled by special85 when defender flag exactly1.
 # type0/type0 coefficient100 twice; no annihilation; x5 position term0; floor11.
 expected=43 if flag==1 else 49
 rows.append({'case':'whole AI scoring function','defender_flag':flag,'actual_score':actual,'expected_score':expected,'passed':actual==expected})
# Actor flag must not activate coefficient when defender flag is0.
put(B+0x65+18+17,0,1);put(B+0x3ce+18+17,1,1)
p.call(0x62905,[W,1,1,5]);actual=get(W+0x8c+22+10)
rows.append({'case':'actor flag does not activate coefficient','actual_score':actual,'expected_score':49,'passed':actual==49})
(OUT/'ai-flag-battle.bin').write_bytes(p.read(B,0x704))
(OUT/'ai-flag-window.bin').write_bytes(p.read(W,0x200))
finish('ai-flag-live',rows);assert all(x['passed'] for x in rows)
