from live_flow import *
rows=[]
for i in range(80):
 p.rpc('EXEC RUN')
 for wait in range(250):
  time.sleep(.01);r=p.regs()
  if r['CS']==0x160 and r['EIP']==p.code(0x10202):break
 else:p.rpc('BREAK');raise TimeoutError(r)
 P=p.u32(p.data(0xcc588));row={'i':i,'palace_state':get(P+0x50,1,False),'sequence':get(P+0x69,1,False),'message':p.u32(P+0x52),'date':p.read(p.data(0xc98dc),4).hex(),'current':p.u32(p.data(0xcc5e8))};rows.append(row)
 if i%5==0:print(row,flush=True)
 if row['message'] or row['palace_state']==1 or row['current']:break
(ROOT/'ticks.json').write_text(json.dumps(rows,indent=2));p.dump_log('ticks-protocol.json')
