from live_flow import *
P=p.u32(p.data(0xcc588));M=p.u32(P+0x52);assert M;slot=get(M+0x47);put(M+6,3);p.call(0x3039c,[M],20)
if slot in [3,4] and get(p.data(0xc3926),1,False):
 child=p.u32(M+0x16)
 if child:p.call(0x30207,[M,child],20)
print('closed',hex(M),'slot',slot,'state',get(P+0x50,1,False),'seq',get(P+0x69,1,False))
p.rpc('EXEC BPDEL *');p.rpc(f'EXEC BP 160:{p.code(0x10202):x}');ctx=json.loads((ROOT/'end-action.json').read_text())['ctx'];p.rpc('EXEC SR '+' '.join(f'{k} {v:x}' for k,v in ctx.items() if k not in ['CS','DS','ES','SS']));p.dump_log('close-palace-protocol.json')
