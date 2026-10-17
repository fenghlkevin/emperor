"""Original no-UI per-side turn-completion predicates, validating unit+3."""
from common import *
l.load();B=alloc(0x800);W=alloc(0x200)
b=bytearray(0x800);w=bytearray(0x200)
b[0x1b:0x1b+33]=b'\xff'*33;b[0x3c:0x3c+33]=b'\xff'*33
b[0x1b+11+4]=1;b[0x3c+11+4]=1
struct.pack_into('<I',w,0x5d,B);p.write(B,b);p.write(W,w)
rows=[]
for state in [0,1,127,128,129,255]:
 for side,base,fn in [('B',0x3ce,0x65b57),('A',0x65,0x65c12)]:
  put(B+base+18+3,state,1);r=p.call(fn,[W]);actual=r['EAX']&0xffff;expected=int(state>=128)
  rows.append({'case':'per-side turn-completion predicate','side':side,'action_state':state,'actual':actual,'expected':expected,'passed':actual==expected})
finish('action-state-live',rows);assert all(x['passed'] for x in rows)
