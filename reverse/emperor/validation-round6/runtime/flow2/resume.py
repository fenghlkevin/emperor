from live_flow import *
j=json.loads((ROOT/'init.json').read_text());resume(j['ctx']);time.sleep(.3);ctx=stop_main();A=j['A'];S=A+8
r={'ctx':ctx,'A_fields':[get(A+o) for o in [0,2,4]],'S_fields':[get(S+o) for o in [2,4]],'battle_window':p.u32(S+0x3c),'current':p.u32(p.data(0xcc5e8)),'head':p.u32(p.data(0xcc5e0)),'date':p.read(p.data(0xc98dc),4).hex(),'stamina':get(p.u32(p.data(0xc98ac))+0x19),'queue':p.read(p.data(0xcca7e),20).hex()};(ROOT/'resumed.json').write_text(json.dumps(r,indent=2));p.dump_log('resumed-protocol.json');print(r)
