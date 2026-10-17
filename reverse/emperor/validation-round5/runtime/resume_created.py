from live_flow import *
j=json.loads((ROOT/'paused-menu-context.json').read_text());W=j['W'];B=p.u32(W+0x34);b=p.read(B,0x704);(OUT/'battle-after-menu.bin').write_bytes(b)
print('flags',set(b[base+i*18+17] for base in [0x65,0x3ce] for i in range(45)),flush=True)
resume(j['ctx']);time.sleep(.5);ctx=stop_main();(ROOT/'created-main-context.json').write_text(json.dumps(ctx));A=j['A'];S=A+8
result={'A_scene':get(A+2),'S_scene':get(S+2),'war':p.u32(S+0x14),'battle_window':p.u32(S+0x3c),'head':p.u32(p.data(0xcc5e0)),'current':p.u32(p.data(0xcc5e8)),'queue':p.read(p.data(0xcca7e),30).hex()};(ROOT/'created-main.json').write_text(json.dumps(result,indent=2));p.dump_log('created-main-protocol.json');print(result)
