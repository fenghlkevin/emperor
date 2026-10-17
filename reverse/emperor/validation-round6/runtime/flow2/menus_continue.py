from live_flow import *
W=3091748;rows=json.loads((ROOT/'menus.json').read_text())
def record(label):
 r={'label':label,'W':W,'state':get(W+0xc),'fields':{hex(o):p.u32(W+o) for o in [8,0x10,0x14,0x1c,0x28,0x34,0x3e]},'counter':get(p.data(0xcc5dc),2,False),'head':p.u32(p.data(0xcc5e0))};rows.append(r);(ROOT/'menus.json').write_text(json.dumps(rows,indent=2));p.dump_log('menus-protocol.json');print(r,flush=True)
def message():
 M=p.u32(W+8);assert M;put(M+6,3);p.call(0x3039c,[M],20)
C=p.u32(W+0x28);count=get(C+0xc6,2,False);countries=list(p.read(C+0xa,count));ix=0;target=countries[ix];p.call(0x2a987,[C,p.u32(C+0x46+ix*4)],20);record('normal-country-button-'+str(target))
message();record('normal-country-confirm-message')
D=p.u32(W+0x1c)
for off in [0xa,0xe,0x12,0x16]:
 F=p.u32(D+off);put(F+0x43,100,4);p.call(0x27396,[D,F],20)
p.call(0x27396,[D,p.u32(D+0x1a)],20);record('normal-troop-confirm-button')
message();record('normal-summary-close')
C=p.u32(W+0x14);(ROOT/'confirm.bin').write_bytes(p.read(C,0x80));print('confirm',hex(C),'vtable',hex(p.u32(C)), 'vtablefns', [hex(p.u32(p.u32(C)+o)) for o in range(0,0x38,4)],flush=True)
