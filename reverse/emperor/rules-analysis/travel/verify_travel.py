"""Bounded helper execution + source assertions; not a DOS runtime test."""
from pathlib import Path
import importlib.util,json,hashlib
ROOT=Path(__file__).resolve().parents[1]
spec=importlib.util.spec_from_file_location('calendar',ROOT/'turns/verify_calendar.py');m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
j=json.loads((ROOT/'EMPEROR.index.json').read_text());ins={r['address']:dict(r) for r in j['instructions']}
# Preserve interpreter's documented stack-probe stub contract for EMPEROR's address.
for r in ins.values():
 if r['op']=='call' and r['args'].startswith('0x9abc4 '):r['args']='0x9a9b4'
m.INS=ins;m.NEXT={a:b for a,b in zip(ins,list(ins)[1:])}
def helper(entry,offset,value,argument,fast=0):
 c=m.CPU();c.r['esp']=0x900000;c.push(argument);c.push(0x100000);c.push(0);c.put(0x100000+offset,value,2);c.put(0xccd69,fast);c.execute(entry)
 return c.get(0x100000+offset,2)
cases=[]
for value,arg,want in [(50,20,70),(90,20,100),(100,20,100)]:
 got=helper(0x39703,0x25,value,arg);assert got==want;cases.append(dict(helper='happiness',before=value,argument=arg,after=got))
for value,arg,want in [(100,10,90),(5,10,0),(100,10,90)]:
 got=helper(0x3984f,0x15,value,arg,1);assert got==want;cases.append(dict(helper='lifespan fast=1',before=value,argument=arg,after=got))
assert ins[0x8d99e]['args']=='dword ptr [eax + 0x45], 0x4e20'
assert ins[0x8d9aa]['args']=='dword ptr [eax + 0x71], 0x4e20'
assert ins[0x8da20]['args']=='eax, 0x14'
assert ins[0x8debb]['args']=='eax, 0xa'
assert ins[0x5e089]['args']=='word ptr [eax + 0xc9a40], 0x2'
b=(ROOT.parent/'code-analysis/EMPEROR/object2.relocated.bin').read_bytes();cost=list(b[0xc8a64-0xb0000+112:0xc8a64-0xb0000+119]);assert cost==[20,20,20,0,0,0,0]
(ROOT/'travel/travel-verification.json').write_text(json.dumps(dict(method=__doc__,variant='EMPEROR',cost_row16=cost,cases=cases,assertions=5),indent=2)+'\n')
for name,start,end in [('arrange',0x692db,0x693f8),('arrange_confirmation',0x69913,0x6995e),('arrange_cost',0x69b21,0x69c28),('travel_ctor',0x8d985,0x8da43),('travel_lifespan',0x8debb,0x8decf),('celebration_gate',0x7ffa8,0x80006),('celebration_settlement',0x5e077,0x5e0ab),('month_boundary',0x1349d,0x1358f)]:
 (ROOT/f'travel/EMPEROR_{name}.asm').write_text('\n'.join(f'{r["address"]:x}: {r["op"]:8} {r["args"]}' for r in j['instructions'] if start<=r['address']<end)+'\n')
print('6 helper cases, 5 instruction assertions and cost table passed; 8 evidence excerpts exported')
