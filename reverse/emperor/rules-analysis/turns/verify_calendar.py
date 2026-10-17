"""Execute the recovered calendar instructions with explicit subsystem-call stubs.
This is a bounded assembly interpreter, not game execution or a DOS emulator.
"""
from pathlib import Path
import json,re
ROOT=Path(__file__).resolve().parents[1]
J=json.loads((ROOT/'KING.index.json').read_text());INS={x['address']:x for x in J['instructions']};NEXT={a:b for a,b in zip(INS,list(INS)[1:])}
ALIASES={a:(r,w) for r,a16,a8 in [('eax','ax','al'),('ebx','bx','bl'),('ecx','cx','cl'),('edx','dx','dl')] for a,w in [(a16,2),(a8,1)]}
MASK=lambda n,w:n&((1<<(8*w))-1)
SIGN=lambda n,w:(MASK(n,w)^(1<<(w*8-1)))-(1<<(w*8-1))
class CPU:
 def __init__(self):self.r={x:0 for x in ['eax','ebx','ecx','edx','esi','edi','esp','ebp']};self.mem={};self.trace=[];self.cmp=(0,0,4);self.steps=0
 def getreg(self,x):
  r,w=ALIASES.get(x,(x,4));return MASK(self.r[r],w)
 def setreg(self,x,n):
  r,w=ALIASES.get(x,(x,4));m=(1<<(8*w))-1;self.r[r]=(self.r[r]&~m)|(n&m)
 def addr(self,x):
  x=x.strip().replace(' - ',' + -');total=0
  for t in x.split(' + '):total+=self.getreg(t) if t in self.r or t in ALIASES else int(t,0)
  return total&0xffffffff
 def operand(self,x):
  x=re.sub(r' <.*','',x).strip()
  m=re.fullmatch(r'(byte|word|dword) ptr \[([^]]+)\]',x)
  if m:return ('m',self.addr(m[2]),{'byte':1,'word':2,'dword':4}[m[1]])
  if x in self.r or x in ALIASES:return ('r',x,ALIASES.get(x,(x,4))[1])
  return ('i',int(x,0),4)
 def read(self,o):
  kind,a,w=o
  return sum(self.mem.get(a+i,0)<<(8*i) for i in range(w)) if kind=='m' else self.getreg(a) if kind=='r' else MASK(a,w)
 def write(self,o,n):
  kind,a,w=o
  if kind=='r':self.setreg(a,n)
  elif kind=='m':
   for i in range(w):self.mem[a+i]=(n>>(i*8))&255
  else:raise ValueError(o)
 def put(self,a,n,w=1):self.write(('m',a,w),n)
 def get(self,a,w=1):return self.read(('m',a,w))
 def push(self,n):self.r['esp']-=4;self.put(self.r['esp'],n,4)
 def pop(self):n=self.get(self.r['esp'],4);self.r['esp']+=4;return n
 def execute(self,start):
  pc=start
  while True:
   self.steps+=1
   if self.steps>20000:raise RuntimeError('instruction bound')
   x=INS[pc];op=x['op'];arg=x['args'];nxt=NEXT[pc]
   if op=='ret':return
   if op=='call':
    target=int(arg.split()[0],0)
    if target==0x9a9b4:self.pop() # Watcom stack probe consumes preceding requested size
    elif target==0x13577:self.push(nxt);self.execute(target);self.pop()
    else:self.trace.append(hex(target))
   elif op=='push':self.push(self.read(self.operand(arg)))
   elif op=='pop':self.write(self.operand(arg),self.pop())
   elif op=='leave':self.r['esp']=self.r['ebp'];self.r['ebp']=self.pop()
   elif op.startswith('j'):
    a,b,w=self.cmp;sa,sb=SIGN(a,w),SIGN(b,w)
    cond={'jmp':True,'je':a==b,'jne':a!=b,'jl':sa<sb,'jge':sa>=sb,'jg':sa>sb,'jle':sa<=sb,'jb':a<b,'jbe':a<=b,'ja':a>b,'jae':a>=b}.get(op)
    if cond is None:raise ValueError(op)
    if cond:nxt=int(arg.split()[0],0)
   elif op=='imul':
    args=arg.split(', ');dst=self.operand(args[0]);left=self.read(dst) if len(args)==2 else self.read(self.operand(args[1]));right=self.read(self.operand(args[-1]));self.write(dst,left*right)
   elif op in ['idiv','div']:
    n=(self.r['edx']<<32)|self.r['eax'];d=self.read(self.operand(arg))
    if op=='idiv':n=SIGN(n,8);d=SIGN(d,4)
    if not d:raise ZeroDivisionError(hex(pc))
    q=abs(n)//abs(d);q=-q if (n<0)!=(d<0) else q;rem=n-q*d;self.setreg('eax',q);self.setreg('edx',rem)
   elif op in ['inc','dec']:
    dst=self.operand(arg);self.write(dst,self.read(dst)+(1 if op=='inc' else -1))
   else:
    args=arg.split(', ');args=args+['1'] if op in ['shl','sar','shr'] and len(args)==1 else args;dst=self.operand(args[0]);src=self.operand(args[1]);a,b=self.read(dst),self.read(src)
    if op in ['mov','movzx','movsx']:self.write(dst,SIGN(b,src[2]) if op=='movsx' else b)
    elif op=='cmp':self.cmp=(a,MASK(b,dst[2]),dst[2])
    elif op=='test':self.cmp=(a&b,0,dst[2])
    elif op in ['shl','sar','shr']:
     n=b&31;self.write(dst,(a<<n) if op=='shl' else (SIGN(a,dst[2])>>n) if op=='sar' else (a>>n))
    elif op in ['add','sub','xor']:self.write(dst,{'add':lambda:a+b,'sub':lambda:a-b,'xor':lambda:a^b}[op]())
    else:raise ValueError((hex(pc),op,arg))
   pc=nxt

def run(start,year,month,half,action_step,scene,cost,fast=0,ledger=77):
 c=CPU();c.r['esp']=0x900000;c.push(0x200000);c.push(0);c.put(0x200000,scene,2);c.put(0xc9810,0x100000,4)
 for a,v in zip(range(0xc9840,0xc9844),[year,month,half,action_step]):c.put(a,v)
 c.put(0xc3898+scene,cost);c.put(0xccc85,fast)
 for a in range(0x10004d,0x100075,4):c.put(a,ledger,4)
 c.execute(start)
 return dict(date=[c.get(a) for a in range(0xc9840,0xc9844)],calls=c.trace,ledger=[c.get(a,4) for a in range(0x10004d,0x100075,4)],steps=c.steps)
def verify():
 cases=[]
 def case(name,start,initial,scene,cost,expected_date,expected_calls,fast=0):
  observed=run(start,*initial,scene,cost,fast)
  assert observed['date']==expected_date,(name,observed)
  assert observed['calls']==expected_calls,(name,observed)
  cases.append(dict(name=name,entry=hex(start),initial=initial,scene=scene,table_cost=cost,fast=fast,observed=observed))
 case('one action no half advance',0x11f65,[0,0,0,0],1,1,[0,0,0,1],[])
 case('third action next half',0x11f65,[0,2,0,2],1,1,[0,2,1,0],['0x13630','0x13825'])
 case('month boundary',0x11f65,[0,2,1,2],1,1,[0,3,0,0],['0x13630','0x13825','0x120c7'])
 case('half-year boundary',0x11f65,[0,5,1,2],1,1,[0,6,0,0],['0x13630','0x13825','0x120c7','0x123e6'])
 case('year boundary ordering',0x11f65,[0,11,1,2],1,1,[1,0,0,0],['0x13630','0x13825','0x120c7','0x133c8','0x123e6'])
 case('scene13 forces half even zero cost',0x11f65,[0,2,0,0],13,0,[0,2,1,0],['0x13630','0x13825'])
 case('scene14 forces half',0x11f65,[0,2,0,1],14,0,[0,2,1,0],['0x13630','0x13825'])
 case('fast scene12 consumes half',0x11f65,[0,2,0,0],12,0,[0,2,1,0],['0x13630','0x13825'],1)
 case('advance month from upper half runs both halves',0x13485,[0,2,0,1],0,0,[0,3,0,0],['0x13630','0x13825','0x13630','0x13825','0x120c7'])
 case('advance month from lower half runs one half',0x13485,[0,2,1,1],0,0,[0,3,0,0],['0x13630','0x13825','0x120c7'])
 # Opening half-year action clears period accounts before any date advance.
 assert cases[0]['observed']['ledger']==[0]*10
 assert cases[1]['observed']['ledger']==[77]*10
 # Counter discards excess; it does not loop through every owed half.
 x=run(0x11f65,0,2,0,2,1,5);assert x['date']==[0,2,1,0]
 cases.append(dict(name='counter overshoot is discarded',observed=x))
 (ROOT/'turns/calendar-verification.json').write_text(json.dumps(dict(method='bounded interpreter of recovered KING assembly; subsystem update calls stubbed, not a live game run',cases=cases),indent=2));print('calendar cases passed',len(cases))
if __name__=='__main__':verify()
