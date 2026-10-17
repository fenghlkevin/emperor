from live_flow import *
E=p.u32(p.data(0xc98ac));O=0x2e0000;R=p.data(0xc99ac);cases=[]
for wealth,power in [(0,200),(1,199),(1,200),(4,200)]:
 p.rpc('EXEC BPDEL *');p.write(O,bytes(0x60));put(O+0x29,33);put(R+0x5e,wealth);put(E+0x28,power);put(E+0x92,0,1);put(p.data(0xc98df),0,1);put(p.data(0xcca92),0);p.write(p.data(0xcca7e),bytes(20));p.write(p.STACK,struct.pack('<II',p.SENTINEL,O));p.rpc(f'EXEC SR ESP {p.STACK:x} EIP {p.code(0x7f871):x}');p.rpc(f'EXEC BP 160:{p.code(0x80006):x}');p.rpc('EXEC RUN');time.sleep(.05)
 state=p.regs();assert state['EIP']==p.code(0x80006),state
 count=get(p.data(0xcca92));event=get(p.data(0xcca7e));cases.append(dict(wealth=wealth,power=power,count=count,event=event));assert (event==33)==(wealth>=1 and power>=200)
(ROOT/'celebration-result.json').write_text(json.dumps({'method':'DOSBox-X original scanner entry7F871 stopped immediately after original celebration branch80006; controlled fixture','cases':cases},indent=2));p.dump_log('celebration-protocol.json');print(cases)
