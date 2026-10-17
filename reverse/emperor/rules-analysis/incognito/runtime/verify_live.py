from live_flow import *
ctx=stop_main();E=p.u32(p.data(0xc98ac));C=p.u32(p.data(0xc9920));print(ctx,hex(E),flush=True)
p.call(0x91c87,[C,0]);E=p.u32(p.data(0xc98ac));put(E+0x25,50);put(E+0x15,1000);put(p.data(0xccd69),0,1)
W=p.call(0x9ac78,[0x8e])['EAX'];p.call(0x8665c,[W],30)
r={'method':'DOSBox-X original function calls; independent game copy and port 59023','E':E,'W':W,'happiness_after_constructor':get(E+0x25),'lifespan_after_constructor':get(E+0x15),'brothel':[]}
# Invoke original hotspot handler using the actual instantiated hotspot button pointers.
button=p.u32(W+0xc+11*4)
for prior in [0,4,5]:
 for seed in [1,12345]:
  put(W+0x84,0,4);put(W+0x8c,prior,1);put(W+0x8d,0,1);put(p.data(0xc93cc),seed,4)
  p.call(0x86a6e,[W,button],30)
  r['brothel'].append({'priorClicks':prior,'seed':seed,'afterClicks':get(W+0x8c,1,False),'special':get(W+0x8d,1,False)})
assert r['happiness_after_constructor']==70 and r['lifespan_after_constructor']==992
assert all(v['special']==0 for v in r['brothel'] if v['priorClicks']<5)
(ROOT/'live-result.json').write_text(json.dumps(r,ensure_ascii=False,indent=2));p.dump_log('live-protocol.json');print(r)
