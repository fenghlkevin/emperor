from live_flow import *
ctx=stop_main();A=p.u32(p.data(0xc98d8));assert A==p.u32(ctx['EBP']+0x14);C=p.u32(p.data(0xc9920));p.call(0x91c87,[C,0]);put(A+2,11);p.call(0x11895,[A],30);S=A+8;p.call(0x3d82a,[S,7],20);W=p.u32(S+0x14)
j={'ctx':ctx,'A':A,'C':C,'S':S,'W':W,'official_screen':p.u32(p.data(0xcc5a0))};(ROOT/'init.json').write_text(json.dumps(j,indent=2));p.dump_log('init-protocol.json');print(j)
