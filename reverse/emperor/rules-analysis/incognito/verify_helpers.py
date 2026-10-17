from pathlib import Path
import importlib.util,json
ROOT=Path(__file__).resolve().parents[1]
s=importlib.util.spec_from_file_location('calendar',ROOT/'turns/verify_calendar.py');m=importlib.util.module_from_spec(s);s.loader.exec_module(m)
j=json.loads((ROOT/'EMPEROR.index.json').read_text());ins={r['address']:dict(r) for r in j['instructions']}
for r in ins.values():
 if r['op']=='call' and r['args'].startswith('0x9abc4 '):r['args']='0x9a9b4'
m.INS=ins;m.NEXT={a:b for a,b in zip(ins,list(ins)[1:])}
cases=[]
for entry,offset,before,arg,fast,want in [(0x39703,0x25,50,20,0,70),(0x39703,0x25,90,20,0,100),(0x39703,0x25,50,500,0,100),(0x3984f,0x15,1000,8,0,992),(0x3984f,0x15,1000,8,1,904),(0x3984f,0x15,1000,10,1,990),(0x398bb,0x23,15,20,0,0),(0x398bb,0x23,70,20,0,50)]:
 c=m.CPU();c.r['esp']=0x900000;c.push(arg);c.push(0x100000);c.push(0);c.put(0x100000+offset,before,2);c.put(0xccd69,fast);c.execute(entry);got=c.get(0x100000+offset,2);assert got==want;(cases.append(dict(entry=hex(entry),before=before,argument=arg,fast=fast,after=got)))
assert ins[0x8697f]['args']=='eax, 0x14';assert ins[0x86993]['args']=='eax, 0x8'
assert ins[0x8732d]['args']=='eax, 0x5';assert ins[0x87332]['args']=='eax, 0x32'
assert ins[0x87927]['args']=='eax, 0xa';assert ins[0x8793b]['args']=='eax, 0x1f4';assert ins[0x8794f]['args']=='eax, 0x14'
(ROOT/'incognito/helper-verification.json').write_text(json.dumps({'method':'bounded original-instruction interpreter, UI/stack-probe stubbed; not DOS runtime','cases':cases,'instruction_assertions':7},indent=2)+'\n');print('8 helper cases and 7 callsite assertions passed')
