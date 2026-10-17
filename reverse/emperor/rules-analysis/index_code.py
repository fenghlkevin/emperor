from pathlib import Path
import re,json,sys,bisect
ROOT=Path(__file__).resolve().parents[1]
def build(variant):
 d=ROOT/'code-analysis'/variant; instructions=[]
 for line in (d/'object1.relocated.asm').read_text().splitlines():
  m=re.match(r'\s*([0-9a-f]+):\s+((?:[0-9a-f]{2} ?)+)\s*\t([^\t]+)\t?(.*)',line)
  if m:instructions.append(dict(address=int(m[1],16),bytes=m[2].strip(),op=m[3].strip(),args=m[4].strip()))
 # Watcom stack-check prologue. Retain recognition boundary, not exhaustive function discovery.
 starts=[]
 for i,x in enumerate(instructions[:-5]):
  tail=instructions[i+1:i+6]
  if x['op']=='push' and tail[0]['op']=='call' and [(a['op'],a['args']) for a in tail[1:5]]==[('push','ebx'),('push','esi'),('push','edi'),('push','ebp')]:starts.append(x['address'])
 funcs=[]
 for i,start in enumerate(starts):funcs.append(dict(start=start,end=starts[i+1] if i+1<len(starts) else instructions[-1]['address']+1,calls=[],references=[]))
 def owner(va):
  i=bisect.bisect_right(starts,va)-1
  return funcs[i] if i>=0 else None
 for x in instructions:
  f=owner(x['address'])
  if not f:continue
  if x['op']=='call':
   m=re.match(r'0x([0-9a-f]+)',x['args'])
   if m:f['calls'].append(dict(pc=x['address'],target=int(m[1],16)))
 fix=json.loads((d/'fixups.json').read_text())['records']
 for x in fix:
  if x['source_object']==1:
   f=owner(x['source_va'])
   if f:f['references'].append(x)
 out=ROOT/'rules-analysis'/f'{variant}.index.json';out.write_text(json.dumps(dict(variant=variant,instructions=instructions,functions=funcs,limitation='Watcom recognized prologues only; linear disassembly may include data; functions without this prologue are not separately bounded'),indent=2));print(variant,len(instructions),len(funcs))
if __name__=='__main__':
 for v in sys.argv[1:] or ['KING','EMPEROR','QUICK']:build(v)
