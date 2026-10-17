from live_flow import *
initial=json.loads((ROOT/'paused-menu-context.json').read_text());ctx=initial['ctx'];A=initial['A'];S=initial['S'];W=initial['W'];assert p.u32(W)==p.data(0xc2134)
def state(label):
 r={'label':label,'W':W,'menu_state':get(W+0xc),'choice':get(W+0xe),'target':get(W+0x44,1,False),'unit_cursor':get(W+0x45,1,False),'fields':{hex(o):p.u32(W+o) for o in [8,0x10,0x14,0x18,0x1c,0x20,0x28,0x30,0x34,0x3e]},'association_counter':get(p.data(0xcc5dc),2,False)};return r
rows=[state('initial')]
(ROOT/'menu-steps.json').write_text(json.dumps(rows,indent=2))
p.call(0x4967e,[W,p.u32(W+0x10),0]);rows.append(state('choose-deploy'));(ROOT/'menu-steps.json').write_text(json.dumps(rows,indent=2))
p.call(0x4967e,[W,p.u32(W+8),1]);rows.append(state('close-statistics'));(ROOT/'menu-steps.json').write_text(json.dumps(rows,indent=2))
p.call(0x4967e,[W,p.u32(W+0x28),10]);rows.append(state('choose-country10'));(ROOT/'menu-steps.json').write_text(json.dumps(rows,indent=2))
p.call(0x4967e,[W,p.u32(W+8),1]);rows.append(state('confirm-country'))
(ROOT/'menu-steps.json').write_text(json.dumps(rows,indent=2));p.dump_log('menu-steps-protocol.json');print(rows)
