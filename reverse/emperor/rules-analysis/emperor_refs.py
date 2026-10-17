from pathlib import Path
import json,re
r=Path(__file__).parent;j=json.loads((r/'KING.index.json').read_text());inst=j['instructions'];rows=[];starts=[f['start'] for f in j['functions']];import bisect
for i,x in enumerate(inst):
 m=re.fullmatch(r'(eax|ebx|ecx|edx|esi|edi), dword ptr \[0xc9810\]',x['args'])
 if x['op']!='mov' or not m:continue
 reg=m[1]
 for y in inst[i+1:i+5]:
  if y['op']=='call' or y['op'].startswith('j'):break
  mm=re.search(r'\['+reg+r' \+ (0x[0-9a-f]+)\]',y['args'])
  if mm:
   rows.append(dict(field=int(mm[1],16),load_state_pc=x['address'],pc=y['address'],function=starts[bisect.bisect_right(starts,y['address'])-1],op=y['op'],args=y['args']));break
  if re.match(reg+r',',y['args']):break
(r/'turns/emperor-direct-refs.json').write_text(json.dumps(rows,indent=2));print('refs',len(rows))
