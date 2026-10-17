"""Bounded execution of recovered KING instructions; UI calls stubbed.
Not a DOS run. Uses existing interpreter, adds only helper-call/cwde support.
"""
from pathlib import Path
import sys,json,inspect,textwrap
ROOT=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT/'turns'))
import verify_calendar as cpu
source=inspect.getsource(cpu.CPU.execute)
source=source.replace("if op=='ret':return", "if pc in getattr(self,'stops',set()) or op=='ret':return")
source=source.replace("elif target==0x13577:self.push(nxt);self.execute(target);self.pop()", """elif target==0x9ab62:self.setreg('eax',next(self.randoms))
    elif target in [0x8e48b,0x8a70e,0x394cf,0x39540,0x395b1,0x39622,0x397d1]:self.push(nxt);self.execute(target);self.pop()
    else:self.trace.append(hex(target));self.setreg('eax',0)""")
source=source.replace("    else:self.trace.append(hex(target))\n", "")
source=source.replace("elif op=='push':", "elif op=='cwde':self.setreg('eax',cpu.SIGN(self.getreg('ax'),2))\n   elif op=='push':")
ns=vars(cpu).copy();ns["cpu"]=cpu;exec(textwrap.dedent(source),ns);cpu.CPU.execute=ns['execute']

def run(age,r1,r2,kind,specialty=255,current=50):
 c=cpu.CPU();c.r['esp']=0x900000;c.r['ebp']=0x900100
 c.put(c.r['ebp']+0x14,0x200000,4);c.put(0xc9810,0x100000,4)
 c.put(0x10000e,age);c.put(0x100027,specialty)
 offsets={'music':0x1f,'study':0x1b,'theatre':0x21,'martial':0x1d}
 c.put(0x100000+offsets[kind],current,2)
 c.randoms=iter([r1,r2,0]);c.stops={0x8db70}
 c.execute({'music':0x8d16d,'study':0x8d49b,'theatre':0x8d654,'martial':0x8d715}[kind])
 return c.get(0x100000+offsets[kind],2)-current

def expected(age,r1,r2,kind,specialty,current):
 base=1 if r1<20 else 2 if r1<55 else 3 if r1<90 else 4
 gain=max(1,base-(r2<age-10))
 if specialty=={'music':0,'study':1,'martial':2}.get(kind,-1):gain+=1
 return min(gain,500-current)

if __name__=='__main__':
 cases=0
 for age in [10,20,40,60,100,120]:
  for r1 in [0,19,20,54,55,89,90,99]:
   for r2 in [0,9,10,29,30,49,50,89,90,99]:
    for kind in ['music','study','theatre','martial']:
     for specialty in [0,1,2,255]:
      for current in [50,498,499,500]:
       actual=run(age,r1,r2,kind,specialty,current)
       assert actual==expected(age,r1,r2,kind,specialty,current),(age,r1,r2,kind,specialty,current,actual)
       cases+=1
 cost_cases=0
 for scene in [2,4,6,7]:
  for energy in [0,1,39,40,41,100,500]:
   c=cpu.CPU();c.r['esp']=0x900000;c.push(0x200000);c.push(0)
   c.put(0xc9810,0x100000,4);c.put(0x100019,energy,2)
   c.put(0x20001a,1);c.put(0x200016,scene,2)
   c.randoms=iter([]);c.stops={0x8de4a};c.execute(0x8dcea)
   assert c.get(0x100019,2)==max(0,energy-40)
   cost_cases+=1
 result={'method':'bounded recovered-instruction execution; random return values supplied; UI allocation/display stubbed; not a DOS runtime test','training_cases':cases,'cost_cases':cost_cases,'result':'passed','samples':[{'age':20,'base_roll':r,'age_roll':99,'normal_gain':run(20,r,99,'study'),'study_specialty_gain':run(20,r,99,'study',1)} for r in [0,20,55,90]]}
 (Path(__file__).parent/'training-verification.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n')
 print(json.dumps(result,ensure_ascii=False))
