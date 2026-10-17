from live_flow import *
j=json.loads((ROOT/'paused-menu-context.json').read_text());W=j['W'];B=p.u32(W+0x34);rows=[]
def step(off,result):
 src=p.u32(W+off);assert src,(hex(off),get(W+0xc));p.call(0x4967e,[W,src,result],30);row={'source_offset':hex(off),'result':result,'state':get(W+0xc),'fields':{hex(o):p.u32(W+o) for o in [8,0x10,0x14,0x3e]},'count':get(p.data(0xcc5dc),2,False),'head':p.u32(p.data(0xcc5e0))};rows.append(row);(ROOT/'complete-menu.json').write_text(json.dumps(rows,indent=2));print(row)
step(8,1)
step(0x14,0)
step(8,1)
step(0x3e,77)
for i in range(0):
 if not p.u32(W+8):break
 step(8,1)
(OUT/'battle-after-menu.bin').write_bytes(p.read(B,0x704));p.dump_log('complete-menu-protocol.json')
