from pathlib import Path
import re,json
root=Path(__file__).parent;lines=(root/'KING/object1.relocated.asm').read_text().splitlines(); inst=[]
for line in lines:
 m=re.match(r'\s*([0-9a-f]+):.*?\t([^\t]+)\t?(.*)',line)
 if m:inst.append((int(m[1],16),m[2].strip(),m[3].strip(),line))
functions=[('load_dispatch',0x91b6f,0x91c6d),('save_dispatch',0x91c6d,0x91d70),('load_header',0x91d70,0x924db),('load_officials',0x924db,0x9268b),('load_harem',0x9268b,0x927b7),('load_children',0x927b7,0x928c0),('load_regions',0x928c0,0x934d1),('load_other',0x934d1,0x9398c),('load_tail_a',0x9398c,0x93ab8),('load_tail_b',0x93ab8,0x93d92)]
out=root/'io';out.mkdir(exist_ok=True);rows=[]
for name,start,end in functions:
 seq=[x for x in inst if start<=x[0]<end];(out/(name+'.asm')).write_text('\n'.join(x[3] for x in seq)+'\n')
 maps=[]
 for i,(va,op,args,line) in enumerate(seq):
  m=re.match(r'(\w+), (byte|word|dword) ptr \[(0x[0-9a-f]+)\]',args)
  if op!='mov' or not m:continue
  reg,width,src=m.groups();source=int(src,16)
  if not 0xce4d8<=source<0xcee00:continue
  for dstva,dop,dargs,_ in seq[i+1:i+5]:
   dm=re.match(r'(byte|word|dword) ptr \[([^]]+)\], '+reg+r'$',dargs)
   if dop=='mov' and dm:
    maps.append(dict(load_va=hex(va),store_va=hex(dstva),serialized_buffer_va=src,width=width,destination_expression=dm[2],status='assembly observed; array indexes and semantic names require further mapping'));break
 (out/(name+'.mapping.json')).write_text(json.dumps(maps,indent=2));rows.append(dict(name=name,start=hex(start),end_exclusive=hex(end),scalar_mapping_count=len(maps)))
(out/'index.json').write_text(json.dumps(rows,indent=2));print(rows)
