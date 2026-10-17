from pathlib import Path
import sys,struct,time,json
ROOT=Path(__file__).resolve().parent; BASE=ROOT.parents[1]/'validation-round3/runtime';sys.path.insert(0,str(BASE))
import probe as p
import live_checks as l
OUT=ROOT/'checks';OUT.mkdir(exist_ok=True)
def put(a,n,w=2):p.write(a,(n%(1<<(w*8))).to_bytes(w,'little'))
def get(a,w=2,s=True):return int.from_bytes(p.read(a,w),'little',signed=s)
def alloc(n):return p.call(0x9ac78,[n])['EAX']
def finish(name,result):
 (ROOT/(name+'.json')).write_text(json.dumps(result,ensure_ascii=False,indent=2));(ROOT/(name+'-protocol.json')).write_text(json.dumps(p.LOG,indent=2));print(json.dumps(result,ensure_ascii=False),flush=True)
def block(start,end,frame,locals_bytes=None,timeout=10):
 before=p.regs();assert before['CS']==0x160 and before['DS']==before['SS']==0x168
 p.rpc('EXEC BPDEL *');p.rpc(f'EXEC BP 160:{p.code(end):x}');p.rpc(f'EXEC SR EBP {frame:x} ESP {frame-0x400:x} EIP {p.code(start):x}');p.rpc('EXEC RUN');deadline=time.time()+timeout
 while time.time()<deadline:
  time.sleep(.02);r=p.regs()
  if r['CS']==0x160 and r['EIP']==p.code(end):return r
 p.rpc('BREAK');raise TimeoutError((hex(start),hex(end),r))
