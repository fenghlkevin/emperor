import probe as p,live_checks as l,struct,json
l.load();W=p.call(0x9ac78,[0x200])['EAX'];B=p.call(0x9ac78,[0x800])['EAX'];w=bytearray(0x200);struct.pack_into('<I',w,0x5d,B);w[0x80]=2;w[0x81]=1;b=bytearray(0x800)
for base in (0x65,0x3ce):
 for i in range(45):b[base+i*18+1:base+i*18+3]=b'\xff\xff'
b[0x5d]=1;u=0x65+18;b[u+1]=0;b[u+2]=2;struct.pack_into('<h',b,u+4,15)
p.write(W,w);p.write(B,b);r=l.R0+2*337;p.write(r+0x8c,struct.pack('<i',10000));p.call(0x67e9d,[W]);actual=p.u32(r+0x8c);result={'case':'aux survivors15 fixed100 base','expected_population':9915,'actual_population':actual,'passed':actual==9915};(p.ROOT/'aux-live.json').write_text(json.dumps(result,indent=2));p.dump_log('aux-live-protocol.json');print(result)
