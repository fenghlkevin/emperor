from pathlib import Path
import json
root=Path(__file__).parent;layouts=json.loads((root.parent/'save-analysis/layout_evidence.json').read_text());sizes={'official':47,'harem':24,'child':21,'region':370};text=['/* Reconstructed serialized layouts, NOT original source and NOT runtime structs. */','#include <stdint.h>','#pragma pack(push, 1)']
semantics={'official':{9:'age; annual increment'},'harem':{9:'age; annual increment',15:'pregnancy_month_counter; 0 absent, >=11 birth event',16:'death_probability_counter; +2 per eligible event check',17:'portrait_id; runtime +18, LADY picture table'},'child':{7:'age; runtime +8; annual increment',8:'sex_flag; runtime +9; 0 male, 1 female'},'region':{}}
for name,size in sizes.items():
 fields={}
 for f in layouts[name]['fields']:
  at=f['serialized_offset'];width=f['width']
  if at not in fields:fields[at]=width
 # known text fields only; preserve full fixed storage including NUL/raw residual bytes.
 strings={'official':{0:7},'harem':{1:7},'child':{0:7,9:7},'region':{}}[name]
 for at,width in strings.items():fields[at]=-width
 text.append(f'typedef struct {name}_disk {{');at=0
 while at<size:
  if at in fields:
   w=fields[at]
   if w<0:text.append(f'  uint8_t raw_text_{at:03x}[{-w}]; /* offset {at} */');at-=w
   else:text.append(f'  uint{w*8}_t field_{at:03x}; /* offset {at}: {semantics[name].get(at,"meaning unresolved")}; LE byte order */');at+=w
  else:
   start=at;at+=1
   while at<size and at not in fields:at+=1
   text.append(f'  uint8_t raw_{start:03x}[{at-start}]; /* unknown/padding; preserve */')
 text.append(f'}} {name}_disk;');text.append(f'_Static_assert(sizeof({name}_disk)=={size}, "size");')
text+=['/* Formal tail holds portrait-used[20]; these EOF copies are ignored on load. */','typedef struct redundant_portrait_tail_disk {','  uint8_t portrait_used_first13_copy[13];','  uint8_t portrait_used_full20_copy[20];','} redundant_portrait_tail_disk;','_Static_assert(sizeof(redundant_portrait_tail_disk)==33, "size");','#pragma pack(pop)','/* region float field must be decoded via memcpy/LE conversion, not integer reinterpretation. */']
(root/'serialized_structs.h').write_text('\n'.join(text)+'\n')
