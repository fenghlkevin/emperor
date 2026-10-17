from live_flow import *
def block(start,end,frame,timeout=5):
 p.rpc('EXEC BPDEL *');p.rpc(f'EXEC BP 160:{p.code(end):x}');p.rpc(f'EXEC SR EBP {frame:x} ESP {frame-0x400:x} EIP {p.code(start):x}');p.rpc('EXEC RUN');deadline=time.time()+timeout
 while time.time()<deadline:
  time.sleep(.03);r=p.regs()
  if r['CS']==0x160 and r['EIP']==p.code(end):return r
 p.rpc('BREAK');raise TimeoutError(r)
rows=[];C=p.u32(p.data(0xc9920))
for counter in [255,256]:
 p.call(0x91c87,[C,0]);B=p.call(0x9ac78,[0x800])['EAX'];W=p.call(0x9ac78,[0x200])['EAX'];p.write(B,bytes(0x800));p.write(W,bytes(0x200));put(W+0x5d,B,4);put(W+0x81,1,1)
 n1=p.u32(p.data(0xc992c));n2=p.u32(n1+8);o1=p.u32(n1);o2=p.u32(n2);put(o1+2,7,1);frame=p.STACK-0x100;put(frame-0x1c,n2,4);put(frame-0x24,B,4);put(p.data(0xcc5dc),counter);block(0x80d2b,0x80d59,frame);put(frame+0x14,W,4);block(0x6670e,0x667c0,frame);matched=p.u32(frame-0x10);zero=p.read(0,4);row={'counter':counter,'B':B,'W':W,'node1':n1,'node2':n2,'officer1':o1,'officer2':o2,'matched':matched,'before_states':[get(o1+2,1,False),get(o2+2,1,False)],'low_linear_zero_u32':int.from_bytes(zero,'little')}
 block(0x667c0,0x667c2,frame);row['actual_dereferenced_pointer']=p.regs()['EAX'];row['write_target']=row['actual_dereferenced_pointer']+2
 try:
  block(0x667c2,0x6680a,frame);row['result']='original_write_completed';row['after_states']=[get(o1+2,1,False),get(o2+2,1,False)]
 except TimeoutError as e:row['result']='guest_did_not_reach_after_write';row['cpu_after']=p.regs()
 rows.append(row);(ROOT/'association-effect.json').write_text(json.dumps(rows,indent=2));p.dump_log('association-effect-protocol.json');print(row,flush=True)
 if row['result']!='original_write_completed':break
