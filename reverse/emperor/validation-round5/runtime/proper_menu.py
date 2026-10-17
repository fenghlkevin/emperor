from live_flow import *
ctx=stop_main();A=p.u32(p.data(0xc98d8));assert A==p.u32(ctx['EBP']+0x14);p.call(0x2bd6f,[0,0]);resume(ctx);time.sleep(.2);ctx=stop_main();A=p.u32(p.data(0xc98d8));put(A+2,11);p.call(0x11895,[A],timeout=30);S=A+8;p.call(0x3d82a,[S,7]);W=p.u32(S+0x14)
state={'ctx':ctx,'A':A,'S':S,'W':W,'official_screen':p.u32(p.data(0xcc5a0)),'scene':get(A),'fields':{hex(o):p.u32(W+o) for o in [0,8,0x10]}};assert state['official_screen'];(ROOT/'paused-menu-context.json').write_text(json.dumps(state,indent=2));p.dump_log('proper-menu-init-protocol.json');print(state)
