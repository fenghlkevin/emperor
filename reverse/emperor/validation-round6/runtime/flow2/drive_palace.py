from live_flow import *
ctx=json.loads((ROOT/'active-main-context.json').read_text());rows=[]
def close(M):
 slot=get(M+0x47);shown=get(M+0x58,1,False)
 if shown:put(M+6,3);p.call(0x3039c,[M],20)
 if slot in [3,4] and get(p.data(0xc3926),1,False):
  child=p.u32(M+0x16)
  if child:p.call(0x30207,[M,child],20)
 return slot
for i in range(160):
 A=p.u32(p.data(0xc98d8));S=A+8;W=p.u32(S+0x3c);P=p.u32(p.data(0xcc588));T=p.u32(p.data(0xcca78));r={'i':i,'A_scene':get(A+2),'P_state':get(P+0x50,1,False),'P_seq':get(P+0x69,1,False),'P_msg':p.u32(P+0x52),'scheduler_msg':p.u32(T+0x16),'W':W,'head':p.u32(p.data(0xcc5e0)),'current':p.u32(p.data(0xcc5e8))}
 if W and get(A+2)==11:
  r['battle_constructed']=True;rows.append(r);print(r,flush=True);break
 for label,M in [('palace',r['P_msg']),('scheduler',r['scheduler_msg'])]:
  if M and p.u32(p.u32(M)+0x24)==p.code(0x3039c):
   r['closed']=label;r['slot']=close(M);print(r,flush=True);break
 rows.append(r);(ROOT/'palace-to-battle.json').write_text(json.dumps(rows,indent=2));p.dump_log('palace-to-battle-protocol.json')
 p.rpc('EXEC BPDEL *');p.rpc(f'EXEC BP 160:{p.code(0x10202):x}');p.rpc('EXEC SR '+' '.join(f'{k} {v:x}' for k,v in ctx.items() if k not in ['CS','DS','ES','SS']));p.rpc('EXEC RUN')
 for wait in range(300):
  time.sleep(.01);reg=p.regs()
  if reg['CS']==0x160 and reg['EIP']==p.code(0x10202):ctx=reg;break
 else:p.rpc('BREAK');raise TimeoutError(reg)
else:raise Exception('palace sequence did not reach battle')
(ROOT/'battle-main-context.json').write_text(json.dumps(ctx,indent=2));(ROOT/'palace-to-battle.json').write_text(json.dumps(rows,indent=2));p.dump_log('palace-to-battle-protocol.json')
