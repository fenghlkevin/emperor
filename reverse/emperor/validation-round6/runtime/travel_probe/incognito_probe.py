from live_flow import *
ctx=stop_main();C=p.u32(p.data(0xc9920));p.call(0x91c87,[C,0]);A=p.u32(p.data(0xc98d8));E=p.u32(p.data(0xc98ac));put(E+0x45,100000,4);put(E+0x25,50);put(E+0x15,1000);put(E+0x19,100)
def snap():return {'money':get(E+0x45,4),'joy':get(E+0x25),'life':get(E+0x15),'stamina':get(E+0x19),'power':get(E+0x28),'reputation':get(E+0x2b8)}
before=snap();put(A+2,14);p.call(0x11895,[A],timeout=30);after=snap();r={'method':'DOSBox-X original EMPEROR scene14 constructor via11895; controlled fixture','before':before,'after_ctor':after};assert after['joy']==70 and after['life']==992 and after['money']==100000 and after['stamina']==100
(ROOT/'incognito-result.json').write_text(json.dumps(r,indent=2));p.dump_log('incognito-protocol.json');print(r)
