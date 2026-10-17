from live_flow import *
C=p.u32(p.data(0xc9920));p.call(0x91c87,[C,0]);B=p.call(0x9ac78,[0x704])['EAX'];p.write(B,bytes(0x704));offs=[base+i*18+17 for base in [0x65,0x3ce] for i in range(45)]
for o in offs:put(B+o,165,1)
p.call(0x84210,[B]);put(B+0x12,1,1);put(B+0x5d,10,1);put(B+0x390,0,1);rows=[]
for va in [0x8437e,0x8454c]:
 r=p.call(va,[B],15);b=p.read(B,0x704);(OUT/f'flag-after-{va:x}.bin').write_bytes(b);rows.append({'function':hex(va),'return':r,'all90_preserved':all(b[o]==165 for o in offs),'flags':[b[o] for o in offs]});(ROOT/'flag-auto.json').write_text(json.dumps(rows,indent=2));p.dump_log('flag-auto-protocol.json');print(hex(va),rows[-1]['all90_preserved'],flush=True)
