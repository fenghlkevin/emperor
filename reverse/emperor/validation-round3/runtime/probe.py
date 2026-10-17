from pathlib import Path
import json,time,uuid,struct,re
ROOT=Path(__file__).resolve().parent;Q=ROOT/'queue';Q.mkdir(exist_ok=True)
CODE=0x1e0000;DATA=0x276000;SENTINEL=CODE+1;STACK=0x2b5000
LOG=[]
def rpc(command,timeout=20):
 uid=f'{time.time_ns()}-{uuid.uuid4().hex[:6]}';p=Q/f'{uid}.request.json';p.write_text(json.dumps({'command':command}));out=Q/f'{uid}.response.json';deadline=time.time()+timeout
 while not out.exists() and time.time()<deadline:time.sleep(.005)
 if not out.exists():raise TimeoutError(command)
 while True:
  try:r=json.loads(out.read_text());break
  except json.JSONDecodeError:
   if time.time()>=deadline:raise
   time.sleep(.005)
 LOG.append(r)
 if r.get('error') or any(' ERR' in l for l in r.get('lines',[])):raise RuntimeError(r)
 return '\n'.join(r['lines'])
def code(a):return CODE+a-0x10000
def data(a):return DATA+a-0xb0000
def read(addr,size):
 name=f'm-{uuid.uuid4().hex[:8]}.bin';rpc(f'EXEC MEMDUMPBIN 168:{addr:x} {size:x} {name}');p=ROOT/name;b=p.read_bytes();assert len(b)==size;return b
def write(addr,b):
 for off in range(0,len(b),64):rpc(f'EXEC SM 168:{addr+off:x} '+' '.join(f'0{x:02x}' for x in b[off:off+64]))
def u32(addr):return struct.unpack('<I',read(addr,4))[0]
def regs():
 text=rpc('EXEC EV CS EIP EAX EBX ECX EDX ESI EDI ESP EBP DS ES SS');values=[int(v,16) for v in text.splitlines()[-1].split()];return dict(zip(['CS','EIP','EAX','EBX','ECX','EDX','ESI','EDI','ESP','EBP','DS','ES','SS'],values))
def call(va,args,timeout=10):
 before=regs();assert before['CS']==0x160 and before['DS']==before['SS']==0x168,('must begin in authentic game 32-bit context',before)
 rpc('EXEC BPDEL *');rpc(f'EXEC BP 160:{SENTINEL:x}');write(STACK,struct.pack('<'+'I'*(len(args)+1),SENTINEL,*args));rpc(f'EXEC SR ESP {STACK:x} EIP {code(va):x}');rpc('EXEC RUN')
 deadline=time.time()+timeout
 while time.time()<deadline:
  time.sleep(.03);state=regs()
  if state['CS']==0x160 and state['EIP']==SENTINEL:return state
 rpc('BREAK');raise TimeoutError(('guest original function did not return',hex(va),state))
def dump_log(name):
 (ROOT/name).write_text(json.dumps(LOG,indent=2))
if __name__=='__main__':
 import sys
 E=u32(data(0xc98ac));C=u32(data(0xc9920));print('E',hex(E),'C',hex(C))
 if len(sys.argv)>1:print(call(int(sys.argv[1],16),[int(x,16) for x in sys.argv[2:]]))
 dump_log('latest-probe-log.json')
