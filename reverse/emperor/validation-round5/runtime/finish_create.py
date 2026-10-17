from live_flow import *
j=json.loads((ROOT/'paused-menu-context.json').read_text());W=j['W'];B=3573528;offs=[base+i*18+17 for base in [0x65,0x3ce] for i in range(45)]
before=p.read(B,0x704);p.rpc('EXEC BPDEL *');p.rpc(f'EXEC BP 160:{p.SENTINEL:x}');p.rpc('EXEC RUN')
for _ in range(500):
 time.sleep(.02);r=p.regs()
 if r['EIP']==p.SENTINEL:break
else:raise Exception(r)
after=p.read(B,0x704);(OUT/'battle-after-first-unit.bin').write_bytes(after)
result={'B':B,'W':W,'initial_flags':[x for x in (OUT/'battle-at-malloc.bin').read_bytes()[0:0]],'before_flags':[before[o] for o in offs],'after_flags':[after[o] for o in offs],'all_poison_preserved':all(after[o]==165 for o in offs),'state':get(W+0xc),'cursor':get(W+0x45,1,False),'fields':{hex(o):p.u32(W+o) for o in [8,0x14,0x1c,0x20,0x34,0x3e]}}
(ROOT/'create-watch.json').write_text(json.dumps(result,indent=2));p.dump_log('finish-create-protocol.json');print(result)
