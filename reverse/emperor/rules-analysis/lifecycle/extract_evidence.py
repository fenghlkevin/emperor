#!/usr/bin/env python3
"""Reproduce life-cycle source slices and packaged constants (static only)."""
from pathlib import Path
import json, struct
ROOT=Path(__file__).resolve().parents[2]
OUT=Path(__file__).resolve().parent
index=json.loads((ROOT/'rules-analysis/KING.index.json').read_text())
rows=index['instructions']
ranges={'conception':(0x10d45,0x10dd0),'pregnancy_monthly':(0x12158,0x12191),
 'annual_age':(0x133c8,0x13485),'official_age':(0x2e92e,0x2e96b),
 'child_age':(0x7e8b9,0x7e8f6),'birth_trigger':(0x824e9,0x825f9),
 'birth_dispatch':(0x7f99e,0x7f9d0),'newborn':(0x7f4a7,0x7f53e),
 'probability_gate':(0x8a70e,0x8a75b),'fertility_age_gate':(0x8a7a8,0x8a86d),
 'death_harem':(0x827d9,0x828e7),'death_child':(0x8290c,0x82a0a),
 'emperor_stat_helpers':(0x393af,0x39961),'lifespan_zero':(0x31c18,0x31d15),
 'drug_labels':(0x6ed32,0x6f052),'rest_and_collapse':(0x8d258,0x8d496),
 'cohabitation_cost':(0x8cd8a,0x8ce17),'cohabitation_stamina':(0x8cf77,0x8d05b),
 'cohabitation_count':(0x118b8,0x119b0),'predicted_lifetime':(0x86f90,0x86fb5),
 'child_sex_render':(0x6a407,0x6a434),'load_ui':(0x2bbde,0x2bc6a),
 'load_wrapper':(0x2bd7f,0x2bdb7),'load_dispatch':(0x91b6f,0x91c6d),
 'load_resume_main':(0x10432,0x105c4)}
for name,(start,end) in ranges.items():
 (OUT/f'{name}.asm').write_text('\n'.join(f'{x["address"]:x}: {x["op"]:8} {x["args"]}' for x in rows if start<=x['address']<end)+'\n')
data=(ROOT/'code-analysis/KING/object2.relocated.bin').read_bytes()
def string(va):return data[va-0xb0000:].split(b'\0',1)[0].decode('big5')
labels=[]
for j in range(9):
 slot=0xc7984+j*4;va=struct.unpack_from('<I',data,slot-0xb0000)[0]
 labels.append({'pointer_slot':hex(slot),'string_address':hex(va),'label':string(va),'initialized_pointer':hex(0xcdb20+j*4)})
fields=[('age',0xe,24,1),('lifespan_limit',0x13,26,2),('lifespan_remaining',0x15,28,2),
 ('stamina_max',0x17,30,2),('stamina_current',0x19,32,2),('intelligence',0x1b,34,2),
 ('martial',0x1d,36,2),('charm',0x1f,38,2),('arts',0x21,40,2),('health',0x23,42,2),('happiness',0x25,44,2)]
sex_labels=[]
for j in range(2):
 slot=0xc5048+j*4;va=struct.unpack_from('<I',data,slot-0xb0000)[0]
 sex_labels.append({'id':j,'pointer_slot':hex(slot),'string_address':hex(va),'label':string(va)})
result={'evidence_type':'static assembly + packaged constants; no observed runtime',
 'child_sex_labels':sex_labels,
 'female_conception_age_range':list(data[0xc8b0a-0xb0000:0xc8b0c-0xb0000]),
 'cohabitation_cost_by_count_0_to_6':list(data[0xc8bbc-0xb0000:0xc8bc3-0xb0000]),
 'cohabitation_cost_count_7_or_more':35,'harem_ability_slot_bonus':list(data[0xc8134-0xb0000:0xc8134-0xb0000+34]),'labels':labels,
 'emperor_fields':[{'name':n,'runtime_offset':hex(rt),'save_offset':so,'width':w} for n,rt,so,w in fields],
 'fertility_age_probabilities':[{'min_age':lo,'max_age':hi,'gate_percent':v,'combined_with_20percent':v/5} for lo,hi,v in [(0,19,90),(20,29,100),(30,39,80),(40,49,50),(50,59,20),(60,None,5)]]}
for n in range(1,4):
 r=json.loads((ROOT/f'save-analysis/decoded/KING{n}.json').read_text())
 result[f'KING{n}_values']={k:r['header'][k] for k in ['age','lifespan_limit','lifespan_remaining','stamina_max','stamina_current','health','happiness']}
(OUT/'evidence.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n')
assert result['female_conception_age_range']==[15,35]
assert result['cohabitation_cost_by_count_0_to_6']==[0,2,4,8,16,24,32]
print('Exported',len(ranges),'static evidence excerpts; data assertions passed.')
