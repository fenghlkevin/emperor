from live_flow import *
W=json.loads((ROOT/'battle-objects.json').read_text())['W'];rows=[]
for i in range(6):
 M=p.u32(W+8)
 r={'i':i,'state':get(W+0xc),'msg':M,'start_dialog':p.u32(W+0x20),'left':p.u32(W+0x3b),'right':p.u32(W+0x43)};rows.append(r);print(r,flush=True)
 if r['start_dialog'] or r['left']:break
 assert M;slot=get(M+0x47);put(M+6,3);p.call(0x3039c,[M],20)
 if slot in [3,4] and get(p.data(0xc3926),1,False):
  child=p.u32(M+0x16)
  if child:p.call(0x30207,[M,child],20)
(ROOT/'battle-intro.json').write_text(json.dumps(rows,indent=2));p.dump_log('battle-intro-protocol.json')
