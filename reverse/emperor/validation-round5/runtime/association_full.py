from live_flow import *
def block(start,end,frame,timeout=5):
 p.rpc('EXEC BPDEL *');p.rpc(f'EXEC BP 160:{p.code(end):x}');p.rpc(f'EXEC SR EBP {frame:x} ESP {frame-0x400:x} EIP {p.code(start):x}');p.rpc('EXEC RUN');deadline=time.time()+timeout
 while time.time()<deadline:
  time.sleep(.03);r=p.regs()
  if r['CS']==0x160 and r['EIP']==p.code(end):return r
 p.rpc('BREAK');raise TimeoutError(r)
rows=[];C=p.u32(p.data(0xc9920));E=p.u32(p.data(0xc98ac))
for counter in [255,256]:
 p.call(0x91c87,[C,0]);B=p.call(0x9ac78,[0x800])['EAX'];W=p.call(0x9ac78,[0x200])['EAX'];H=p.call(0x9ac78,[0x4e])['EAX'];p.write(H,bytes(0x4e));p.call(0x962c8,[H]);put(p.data(0xcc5f4),H,4);p.write(B,bytes(0x800));p.write(W,bytes(0x200));put(W+0x5d,B,4);put(W+0x81,1,1);put(B+0x5d,10,1);put(B+0x390,30,1)
 for base in [0x65,0x3ce]:
  for i in range(45):p.write(B+base+i*18+1,b'\xff\xff')
 n1=p.u32(p.data(0xc992c));n2=p.u32(n1+8);o1=p.u32(n1);o2=p.u32(n2);put(o1+2,7,1);frame=p.STACK-0x100;put(frame-0x1c,n2,4);put(frame-0x24,B,4);put(p.data(0xcc5dc),counter);block(0x80d2b,0x80d59,frame)
 row={'counter':counter,'officers':[o1,o2],'before_states':[get(o1+2,1,False),get(o2+2,1,False)],'battle_word':get(B+0x6fc),'officer_byte':get(o2,1,False)}
 try:
  row['return']=p.call(0x6668f,[W],10);row['after_states']=[get(o1+2,1,False),get(o2+2,1,False)];row['result']='full_original_settlement_returned'
 except Exception as e:row['error']=str(e);row['result']='did_not_return'
 rows.append(row);(ROOT/'association-full.json').write_text(json.dumps(rows,indent=2));p.dump_log('association-full-protocol.json');print(row,flush=True)
 if row['result']=='did_not_return':break
