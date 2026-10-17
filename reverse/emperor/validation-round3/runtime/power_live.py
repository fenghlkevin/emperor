import probe as p,live_checks as l,struct,json
l.load();B=p.call(0x9ac78,[0x800])['EAX'];blob=bytearray(0x800)
for base in (0x65,0x3ce):
 for i in range(45):blob[base+i*18+1]=255
for i,t,d in [(0,30,100),(1,0,0)]:
 u=0x3ce+i*18;blob[u+1]=0;struct.pack_into('<h',blob,u+4,100);blob[u+12]=t;struct.pack_into('<h',blob,u+15,d)
p.write(B,blob);p.call(0x85a60,[B]);actual=list(struct.unpack('<2H',p.read(B+0x700,4)));result={'actual_B_A':actual,'expected':[460,0],'passed':actual==[460,0],'slot0_included':True};(p.ROOT/'power-live.json').write_text(json.dumps(result,indent=2));p.dump_log('power-live-protocol.json');print(result)
