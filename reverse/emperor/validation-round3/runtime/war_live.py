import probe as p, live_checks as l, struct,json
out=[]
def put(a,n,w=2):p.write(a,int(n).to_bytes(w,'little',signed=False))
def get(a,w=2):return int.from_bytes(p.read(a,w),'little',signed=True)
def alloc(n):return p.call(0x9ac78,[n])['EAX']
W=alloc(0x200);B=alloc(0x800)
def fixture(result,reason):
 l.load();p.write(W,bytes(0x200));p.write(B,bytes(0x800));put(W+0x5d,B,4);put(W+0x80,result,1);put(W+0x81,reason,1)
 for base in (0x65,0x3ce):
  blob=bytearray(45*18)
  for i in range(45):blob[i*18+1:i*18+3]=b'\xff\xff'
  p.write(B+base,blob)
 put(B+0x12,1,1);put(B+0x390,0,1);put(B+0x3c2,100);put(l.R0+0x22,100);put(l.R0+0x88,20);put(l.R0+0x8c,10000,4);p.write(l.R0+0x7c,bytes(12));put(p.data(0xcc14c),0);put(p.data(0xcc1b2),0)
def unit(i,n,helmet=0,armor=0,shield=0):
 u=B+0x3ce+i*18;put(u+1,0,1);put(u+2,0,1);put(u+4,n);put(u+12,30,1);put(u+6,helmet);put(u+8,armor);put(u+10,shield)
for name,res,reason,expected in [('normal',2,0,[181,28,9981]),('retreat',1,1,[164,27,9964])]:
 fixture(res,reason);unit(1,81,51,31,11);before=p.read(l.R0,337);p.call(0x6775f,[W]);actual=[get(l.R0+0x22),get(l.R0+0x88),get(l.R0+0x8c,4)];out.append({'case':name,'actual':actual,'expected':expected,'inventory':list(struct.unpack('<6h',p.read(l.R0+0x7c,12))),'passed':actual==expected});(l.OUT/f'war-{name}-before.bin').write_bytes(before);(l.OUT/f'war-{name}-after.bin').write_bytes(p.read(l.R0,337))
(p.ROOT/'war-live.json').write_text(json.dumps(out,indent=2));p.dump_log('war-live-protocol.json');print(out)
