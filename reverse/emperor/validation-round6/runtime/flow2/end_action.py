from live_flow import *
F=p.u32(p.data(0xcc598));p.call(0x7e201,[F,p.u32(F+0x12),0],20);C=p.u32(F+0x1e);print('confirm',hex(C),'vtable',hex(p.u32(C)), 'func8',hex(p.u32(p.u32(C)+8)),'bytes',p.read(C,0x30).hex(),flush=True)
(ROOT/'end-action-init.json').write_text(json.dumps({'F':F,'C':C},indent=2));p.dump_log('end-action-init-protocol.json')
