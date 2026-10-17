from live_flow import *
j=json.loads((ROOT/'paused-menu-context.json').read_text());W=j['W'];source=p.u32(W+0x1c);assert source
for va,value in [(0xcc5f8,100),(0xcc5fc,100),(0xcc600,100),(0xcc604,100),(0xcc608,100)]:put(p.data(va),value)
p.rpc('EXEC BPDEL *');p.rpc(f'EXEC BP 160:{p.code(0x49db1):x}');p.rpc(f'EXEC BP 160:{p.SENTINEL:x}');p.write(p.STACK,struct.pack('<IIII',p.SENTINEL,W,source,0));p.rpc(f'EXEC SR ESP {p.STACK:x} EIP {p.code(0x4967e):x}');p.rpc('EXEC RUN')
def until(address,timeout=20):
 deadline=time.time()+timeout
 while time.time()<deadline:
  time.sleep(.03);r=p.regs()
  if r['CS']==0x160 and r['EIP']==address:return r
 p.rpc('BREAK');raise TimeoutError(r)
r=until(p.code(0x49db1));B=r['EAX'];offsets=[base+i*18+17 for base in [0x65,0x3ce] for i in range(45)];initial=p.read(B,0x704);(OUT/'battle-at-malloc.bin').write_bytes(initial)
for off in offsets:put(B+off,0xa5,1)
watch_results=[]

p.rpc('EXEC RUN');r=until(p.SENTINEL);after=p.read(B,0x704);(OUT/'battle-after-first-unit.bin').write_bytes(after);result={'W':W,'B':B,'initial_flags':[initial[o] for o in offsets],'poison_value':165,'after_first_unit_flags':[after[o] for o in offsets],'all_poison_preserved':all(after[o]==165 for o in offsets),'watch_install_results':watch_results,'fields':{hex(o):p.u32(W+o) for o in [8,0x14,0x18,0x1c,0x20,0x34,0x3e]},'unit_cursor':get(W+0x45,1,False)};(ROOT/'create-watch.json').write_text(json.dumps(result,indent=2));p.dump_log('create-watch-protocol.json');print({k:v for k,v in result.items() if k!='watch_install_results'})
