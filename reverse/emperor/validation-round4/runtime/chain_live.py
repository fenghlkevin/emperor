from common import *
def trace_delete(frame):
 p.rpc('EXEC BPDEL *');p.rpc(f'EXEC BP 160:{p.code(0x658ad):x}');p.rpc(f'EXEC BP 160:{p.code(0x9ad58):x}');p.rpc(f'EXEC SR EBP {frame:x} ESP {frame-0x400:x} EIP {p.code(0x657f3):x}');frees=[]
 for j in range(3):
  p.rpc('EXEC RUN');deadline=time.time()+15
  while time.time()<deadline:
   time.sleep(.02);r=p.regs()
   if r['CS']==0x160 and r['EIP'] in [p.code(0x658ad),p.code(0x9ad58)]:break
  else:p.rpc('BREAK');raise TimeoutError(r)
  if r['EIP']==p.code(0x658ad):return frees
  frees.append(get(r['ESP']+4,4,False))
 raise RuntimeError(frees)
results=[];frame=p.STACK-0x100
for name,count,index in [('head',3,0),('middle',3,1),('tail',3,2),('single',1,0)]:
 records=[alloc(0x704) for i in range(count)];nodes=[alloc(8) for i in range(count)]
 for i,n in enumerate(nodes):p.write(n,struct.pack('<II',records[i],nodes[i+1] if i+1<count else 0))
 put(p.data(0xcc5e0),nodes[0],4);put(p.data(0xcc5e8),nodes[index],4);free_args=trace_delete(frame)
 head=get(p.data(0xcc5e0),4,False);cur=get(p.data(0xcc5e8),4,False);remaining=[n for i,n in enumerate(nodes) if i!=index];actual=[];n=head
 while n:
  assert len(actual)<count;nxt=get(n+4,4,False);actual.append(n);n=nxt
 expected_cur=nodes[index+1] if index+1<count else 0;expected_head=remaining[0] if remaining else 0
 row={'case':name,'input_nodes':nodes,'removed_payload':records[index],'free_arguments':free_args,'actual_head':head,'actual_current':cur,'remaining_nodes':actual,'expected_remaining':remaining,'passed':actual==remaining and head==expected_head and cur==expected_cur and free_args==[records[index],nodes[index]]};results.append(row);finish('chain-live',results)
assert all(x['passed'] for x in results)
