from pathlib import Path
import re,json
root=Path(__file__).resolve().parents[1];res={}
for name in ['load_other','load_tail_a','load_tail_b']:
 lines=(root/'code-analysis/io'/f'{name}.asm').read_text().splitlines();prev=0;arr=[]
 for j,line in enumerate(lines):
  if 'call\t0x9b1cc' not in line:continue
  chunk=lines[prev:j];consts=[(k,re.search(r'push\s+0x([0-9a-f]+)',l)) for k,l in enumerate(chunk)];consts=[(k,m) for k,m in consts if m];k,m=consts[-1];following='\n'.join(chunk[k:]);dest=re.findall(r'add\s+eax, 0x([0-9a-f]+)',following);absdest=re.findall(r'mov\s+eax, 0x([0-9a-f]+)',following)
  arr.append({'read_pc':line.split(':')[0].strip(),'length':int(m[1],16),'runtime_offset':int(dest[-1],16) if dest else None,'runtime_address':int(absdest[-1],16) if absdest else None});prev=j+1
 res[name]=arr
(root/'save-analysis/tail_layout_evidence.json').write_text(json.dumps(res,indent=2));print({k:[f['length'] for f in v] for k,v in res.items()});print('other record',sum(f['length'] for f in res['load_other'][1:]))
