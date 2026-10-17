from live_flow import *
# Resume the prior real hotspot call from its message-construction breakpoint.
p.rpc('EXEC BPDEL *');p.rpc(f'EXEC BP 160:{p.SENTINEL:x}');p.rpc('EXEC RUN');time.sleep(.1);r=p.regs();assert r['EIP']==p.SENTINEL,r
O=p.u32(p.data(0xcc5b0));E=p.u32(p.data(0xc98ac));M=p.u32(O+0x84);assert M
# Supply a controlled successful event result, then execute the original dialog-close callback.
put(O+0x8d,1,1);put(E+0x25,50);put(E+0x23,70);put(E+0x15,1000);put(E+0x45,100000,4)
def snap():return {'joy':get(E+0x25),'health':get(E+0x23),'life':get(E+0x15),'money':get(E+0x45,4)}
before=snap();p.call(0x87768,[O,M],timeout=30);after=snap();assert after=={'joy':100,'health':50,'life':990,'money':100000}
(ROOT/'brothel-success-result.json').write_text(json.dumps({'method':'DOSBox-X original87768 dialog-close callback; real scene14/message objects; successful outcome flag deliberately set1 (not a naturally sampled success)','before':before,'after':after,'next_hotspot':get(O+0x8a)},indent=2));p.dump_log('brothel-success-protocol.json');print(before,after)
