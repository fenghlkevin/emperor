from pathlib import Path
import re,json
root=Path(__file__).resolve().parents[1]
funcs={'header':(0x91d70,0x91e94),'officials':(0x924db,0x9260f),'harem':(0x9268b,0x92780),'children':(0x927b7,0x928d4),'regions':(0x928c0,0x929a5),'other':(0x934d1,0x935b6),'tail_a':(0x9398c,0x93a28),'tail_b':(0x93ab8,0x93b46)}
res={}
for version,ix,read in [('KING',0,0x9b1cc),('EMPEROR',1,0x9b3dc)]:
 lines=(root/f'code-analysis/{version}/object1.relocated.asm').read_text().splitlines();parsed=[]
 for line in lines:
  m=re.match(r'\s*([0-9a-f]+):.*?\t(.*)',line)
  if m:parsed.append((int(m[1],16),m[2]))
 res[version]={}
 for name,pair in funcs.items():
  start=pair[ix];j=next(j for j,t in enumerate(parsed) if t[0]==start);chunk=[]
  for t in parsed[j:]:
   chunk.append(t)
   if t[1]=='ret':break
  reads=[];prev=0
  for k,(pc,ins) in enumerate(chunk):
   if not ins.startswith(f'call\t0x{read:x}'):continue
   candidates=[(a,re.search(r'^push\s+0x([0-9a-f]+)',b)) for a,b in chunk[prev:k]];candidates=[t for t in candidates if t[1]]
   length=int(candidates[-1][1][1],16);reads.append({'pc':hex(pc),'length':length});prev=k+1
  cmps=[{'pc':hex(a),'instruction':b} for a,b in chunk if b.startswith('cmp') and re.search(r', 0x',b)]
  res[version][name]={'start':hex(start),'end':hex(chunk[-1][0]),'reads':reads,'comparisons':cmps}
res['comparison']={name:{'read_length_sequence_equal':[r['length'] for r in res['KING'][name]['reads']]==[r['length'] for r in res['EMPEROR'][name]['reads']],'KING_lengths':[r['length'] for r in res['KING'][name]['reads']],'EMPEROR_lengths':[r['length'] for r in res['EMPEROR'][name]['reads']]} for name in funcs}
(root/'save-analysis/variant_comparison.json').write_text(json.dumps(res,indent=2));print(json.dumps(res['comparison'],indent=2))
