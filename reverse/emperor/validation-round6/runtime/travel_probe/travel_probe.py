from live_flow import *
ctx=stop_main();C=p.u32(p.data(0xc9920));p.call(0x91c87,[C,0]);A=p.u32(p.data(0xc98d8));E=p.u32(p.data(0xc98ac))
put(E+0x45,100000,4);put(E+0x71,0,4);put(E+0x25,50);put(E+0x15,1000);put(E+0x19,100);put(E+0x92,0,1)
def snap():return {'money':get(E+0x45,4),'expense':get(E+0x71,4),'joy':get(E+0x25),'life':get(E+0x15),'stamina':get(E+0x19),'power':get(E+0x28),'reputation':get(E+0x2b8)}
before=snap();put(A+2,15);p.call(0x11895,[A],timeout=30);after_ctor=snap();O=p.u32(p.data(0xcc5d4));put(O+0x1a,1,1);p.call(0x8de02,[O],timeout=30);after_finish=snap()
r={'method':'DOSBox-X executing unmodified original EMPEROR scene15 constructor and completion; controlled state fixture; UI animation completion byte set to1','before':before,'after_ctor':after_ctor,'after_finish':after_finish,'object':O};assert after_ctor['money']==80000 and after_ctor['expense']==20000 and after_ctor['joy']==70;assert after_finish['life']==990;assert after_finish['stamina']==100
(ROOT/'travel-result.json').write_text(json.dumps(r,indent=2));p.dump_log('travel-protocol.json');print(r)
