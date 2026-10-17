from live_flow import *
O=p.u32(p.data(0xcc5b0));B=p.u32(O+0xc+11*4);cases=[]
for count in [4,5]:
 p.rpc('EXEC BPDEL *');put(O+0x84,0,4);put(O+0x8c,count,1);put(O+0x8d,0,1);p.write(p.STACK,struct.pack('<III',p.SENTINEL,O,B));p.rpc(f'EXEC SR ESP {p.STACK:x} EIP {p.code(0x86a6e):x}');p.rpc(f'EXEC BP 160:{p.code(0x8a814):x}');p.rpc(f'EXEC BP 160:{p.code(0x873ff):x}');p.rpc('EXEC RUN');time.sleep(.05);r=p.regs();rng=r['EIP']==p.code(0x8a814);assert rng==(count>=5),r
 if rng:
  threshold=get(r['EBP']+0x18);assert threshold==50;p.rpc('EXEC BPDEL *');p.rpc(f'EXEC BP 160:{p.code(0x873ff):x}');p.rpc('EXEC RUN');time.sleep(.05);r=p.regs()
 assert r['EIP']==p.code(0x873ff),r
 message=get(r['EBP']-4,4);cases.append(dict(click_ordinal=count+1,random_called=rng,threshold=50 if rng else None,message=hex(message),success=get(O+0x8d,1)))
(ROOT/'brothel-result.json').write_text(json.dumps({'method':'DOSBox-X original hotspot function86A6E, real scene14 object; before-count fixture; breakpoints at RNG call and message construction','cases':cases},indent=2));p.dump_log('brothel-protocol.json');print(cases)
