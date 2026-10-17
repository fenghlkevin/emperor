"""Run literal KING 128BA..12A4F using bounded numeric x86 semantics.
Uses shared calendar interpreter operand/memory helpers. No DOS binary execution.
"""
from pathlib import Path
import importlib.util,json
P=Path(__file__).resolve();sp=importlib.util.spec_from_file_location('calendar_cpu',P.parents[1]/'turns/verify_calendar.py');mod=importlib.util.module_from_spec(sp);sp.loader.exec_module(mod)
SIGN,MASK=mod.SIGN,mod.MASK
class CPU(mod.CPU):
 def __init__(self):super().__init__();self.writes=[]
 def write(self,o,n):
  if o[0]=='m':self.writes.append({'address':hex(o[1]),'value':SIGN(n,o[2]),'width':o[2]})
  super().write(o,n)
 def execute_range(self,start,end):
  pc=start
  while pc!=end:
   self.steps+=1
   if self.steps>10000:raise RuntimeError('bound exceeded')
   x=mod.INS[pc];op=x['op'];arg=x['args'];nxt=mod.NEXT[pc]
   if op.startswith('j'):
    a,b,w=self.cmp;sa,sb=SIGN(a,w),SIGN(b,w)
    cond={'jmp':True,'je':a==b,'jne':a!=b,'jl':sa<sb,'jge':sa>=sb,'jg':sa>sb,'jle':sa<=sb}[op]
    if cond:nxt=int(arg.split()[0],0)
   elif op in ['inc','dec']:
    d=self.operand(arg);self.write(d,self.read(d)+(1 if op=='inc' else -1))
   elif op in ['idiv','div']:
    d=self.read(self.operand(arg));numer=(self.getreg('edx')<<32)|self.getreg('eax')
    if op=='idiv':
     numer=SIGN(numer,8);d=SIGN(d,4);q=abs(numer)//abs(d)*(1 if (numer>=0)==(d>=0) else -1);r=numer-q*d
    else:q,r=divmod(numer,d)
    assert -(1<<31)<=q<(1<<32)
    self.setreg('eax',q);self.setreg('edx',r)
   else:
    args=arg.split(', ');args+=['0x1'] if op=='sar' and len(args)==1 else [];assert len(args)>=2,(hex(pc),op,arg);dst=self.operand(args[0]);src=self.operand(args[1]);a,b=self.read(dst),self.read(src)
    if op in ['mov','movzx','movsx']:self.write(dst,SIGN(b,src[2]) if op=='movsx' else b)
    elif op=='cmp':self.cmp=(a,MASK(b,dst[2]),dst[2])
    elif op=='test':self.cmp=(a&b,0,dst[2])
    elif op in ['add','sub','xor']:self.write(dst,{'add':lambda:a+b,'sub':lambda:a-b,'xor':lambda:a^b}[op]())
    elif op=='imul':self.write(dst,SIGN(b,src[2])*SIGN(self.read(self.operand(args[2])),4) if len(args)==3 else SIGN(a,dst[2])*SIGN(b,src[2]))
    elif op=='sar':self.write(dst,SIGN(a,dst[2])>>(b&31))
    else:raise ValueError((hex(pc),op,arg))
   pc=nxt

def run(last_delta,grains):
 c=CPU();c.r['ebp']=0x200000;c.put(0x200000-0x10,last_delta,4)
 for i,g in enumerate(grains):
  R=0xc990c+337*i;c.put(R+2,1,2);c.put(R+0x76,g,2);c.put(R+0x7a,40,2)
  for off in [6,10,14,18]:c.put(R+off,1000,4)
 c.writes=[];c.execute_range(0x128ba,0x12a4f)
 return {'last_tax_loop_delta':last_delta,'grain_by_region':grains,'population_by_region':[[c.get(0xc990c+337*i+off,4) for off in [6,10,14,18]] for i in range(len(grains))],'persistent_local_f0':SIGN(c.get(c.r['ebp']-0x10,4),4),'steps':c.steps,'population_or_f0_writes':[w for w in c.writes if w['address']==hex(c.r['ebp']-0x10) or 0xc990c<=int(w['address'],16)<0xc990c+len(grains)*337]}
if __name__=='__main__':
 cases=[run(-40,[20,80]),run(-40,[20,100,20]),run(60,[20,80])]
 assert cases[0]['population_by_region']==[[1003]*4,[1003]*4]
 assert cases[1]['population_by_region']==[[1003]*4,[1013]*4,[1013]*4]
 assert cases[2]['population_by_region']==[[1010]*4,[1010]*4]
 (P.parent/'population-verification.json').write_text(json.dumps({'method':'literal bounded KING 128BA..12A4F; shared CPU memory helpers; signed division, imul and sar implemented; not a live DOS run','cases':cases},ensure_ascii=False,indent=2))
 print('population literal instruction cases passed',len(cases))
