from live_flow import *
rows=[]
def record(label,W=0):
 A=p.u32(p.data(0xc98d8));S=A+8;r={'label':label,'head':p.u32(p.data(0xcc5e0)),'current':p.u32(p.data(0xcc5e8)),'scene':get(S+2),'stamina':get(p.u32(p.data(0xc98ac))+0x19)}
 if W:r.update({'W':W,'state':get(W+0xc),'fields':{hex(o):p.u32(W+o) for o in [8,0x18,0x20,0x3b,0x43,0x5d]}})
 rows.append(r);(ROOT/'battle-exit-full.json').write_text(json.dumps(rows,indent=2));p.dump_log('battle-exit-full-protocol.json');print(r,flush=True)
C=p.u32(p.data(0xc9920));p.call(0x91c87,[C,0]);A=p.u32(p.data(0xc98d8));put(A+2,11);p.call(0x11895,[A],30);S=A+8;p.call(0x3d82a,[S,7]);War=p.u32(S+0x14)
def menu(off,r):p.call(0x4967e,[War,p.u32(War+off),r],15)
menu(0x10,0);menu(8,1);menu(0x28,10);menu(8,1)
for va in [0xcc5f8,0xcc5fc,0xcc600,0xcc604,0xcc608]:put(p.data(va),100)
menu(0x1c,0);menu(8,1);menu(0x14,0);menu(0x3e,77)
B=p.u32(War+0x34);node=p.u32(p.data(0xcc5e0));record('created-through-original-menu-callbacks');(OUT/'exit-flow-created-battle.bin').write_bytes(p.read(B,0x704))
# Controlled selection of the real newly-created battle; final deployment-message close is deliberately not called after the separately recorded test failure.
put(p.data(0xcc5e8),node,4);p.call(0x3d82a,[S,23],20);W=p.u32(S+0x3c);assert p.u32(W+0x5d)==B;record('real-battle-constructor',W)
p.call(0x5cd22,[W,p.u32(W+0x20),1],20);record('original-open-battle-callback',W)
# Controlled retreat outcome. GUI objects and actual newly-created chain are retained, no destructor/free substitutes.
put(W+0x81,1,1);put(W+0xc,17);p.call(0x5cd22,[W,p.u32(W+8),1],20);record('original-end-message-and-complete-exit',W)
