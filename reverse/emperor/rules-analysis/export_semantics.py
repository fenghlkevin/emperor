from pathlib import Path
import json,csv,struct
ROOT=Path(__file__).resolve().parents[1];out=ROOT/'rules-analysis';layout=json.loads((ROOT/'save-analysis/layout_evidence.json').read_text())['region']['fields'];mapping={f['runtime_offset']:f for f in layout};joined=json.loads((ROOT/'trainer-analysis/region-fields-joined.json').read_text());fields={}
for x in joined:
 r=x['runtime_relative_offset']+2;fields[r]=dict(name=x['label'],R_offset=r,meaning_status='trainer label + load mapping; runtime-use crosscheck available for core fields',source='trainer-analysis/region-fields-joined.json')
add=[(0x04,'地区自动治理状态','s16','121cc'),(0x1e,'劳役/特殊人口','s16','13997'),(0x24,'四行业职业人口合计/产出分母','s32','388ba'),(0x54,'农行业效率','s16','38979'),(0x56,'牧行业效率','s16','389d8'),(0x58,'商行业效率','s16','38a37'),(0x5a,'工行业效率','s16','38a96'),(0x9a,'指定开发行业1..4','u8','3b0d8'),(0x9b,'指定人口转业目标1..4','u8','3b2fc'),(0x9c,'人均产出/生活收益指标','s16','126c7'),(0x94,'民忠额外修正','s16','3ba52'),(0x96,'民忠公式输入（UI名未定）','s16','3b9f1'),(0xa4,'税款征收系数（UI名未定）','s16','1287f'),(0xa6,'财富累积/贫富升降积分','s16','127e9'),(0xb2,'贸易结算收入','s32','12fd0'),(0xb6,'累积贸易利润率','s16','12edd'),(0xce,'本旬待分摊入账/赈济额','u16','14632'),(0xd3,'内乱状态','u8','13905'),(0xd7,'灾害类型1..6','u8','14030'),(0xd8,'灾害解除累计概率','u8','14201'),(0x11b,'饥荒状态','u8','13db7'),(0x11f,'农产出剩余百分比','u8','124d4'),(0x120,'商产出剩余百分比','u8','12557'),(0x121,'牧产出剩余百分比','u8','12557'),(0x122,'工产出剩余百分比','u8','12557'),(0x128,'本半年累计产出扣减','u8','12731'),(0x12e,'饥荒结束概率进度','u8','13fbb'),(0x12f,'非玩家地区军事负担','s32','3bb12'),(0x134,'非零后每阶段递增计数（未定名）','s16','138df'),(0x136,'自动军队人口比例','u8','3ba92'),(0x13c,'战斗单向伤害缩放修正（未定名）','s16','5960f'),(0x142,'外援动员人口百分比','u8','84a5a')]
add += [(0xd2,'内乱累计触发概率','u8','81397'),(0xd4,'暴动累计触发概率','u8','81596'),(0xd5,'暴动状态','u8','81596')]
for r,n,t,pc in add:fields[r]=dict(name=n,R_offset=r,runtime_type=t,meaning_status='code-use observed; descriptive role, UI name may remain unknown',source=f'rules-analysis/{"war-diplomacy" if r in [0xb2,0xb6,0x13c,0x142] else "domestic"}/README.md',rule_pc='0x'+pc,rule_pc_variant='EMPEROR' if r in [0xb2,0xb6,0x13c,0x142] else 'KING')
for r in [0x94,0x96,0xd2,0xd3,0xd4,0xd5,0x11b,0x12e]:
 fields[r]['source']='validation-round3/special-fields/README.md'
 fields[r]['meaning_status']='round3 instruction and state/message evidence; see explicit UI-name limits'
rows=[]
for r,x in sorted(fields.items()):
 m=mapping.get(r-2);row=dict(name=x['name'],R_offset=r,load_data_relative_offset=r-2,KING_R0='0xc990c',EMPEROR_R0='0xc99ac',KING_field0=hex(0xc990c+r),EMPEROR_field0=hex(0xc99ac+r),runtime_type=x.get('runtime_type','width-known; sign per usage'),disk_record_offset=m['serialized_offset'] if m else None,disk_width=m['width'] if m else None,runtime_width=m.get('runtime_width',m['width']) if m else None,load_conversion=m.get('conversion','copy') if m else None,load_pc_KING=m['load_pc'] if m else None,meaning_status=x['meaning_status'],source=x['source'],rule_pc=x.get('rule_pc',''),rule_pc_variant=x.get('rule_pc_variant',''));rows.append(row)
for name,data in [('region-semantics',rows)]:
 (out/f'{name}.json').write_text(json.dumps(data,ensure_ascii=False,indent=2))
 with (out/f'{name}.csv').open('w',newline='',encoding='utf-8-sig') as f:w=csv.DictWriter(f,fieldnames=data[0]);w.writeheader();w.writerows(data)
values=[]
for n in ['KING1','KING2','KING3']:
 s=json.loads((ROOT/f'save-analysis/decoded/{n}.json').read_text())
 for reg in s['regions']:
  raw=bytes.fromhex(reg['raw_hex'])
  for f in rows:
   if f['disk_record_offset'] is None:continue
   off=f['disk_record_offset'];w=f['disk_width'];b=raw[off:off+w]
   values.append(dict(save=n,region_index=reg['index'],name=f['name'],R_offset=f['R_offset'],file_offset=reg['offset']+off,disk_offset=off,disk_width=w,raw_hex=b.hex(),value_unsigned=int.from_bytes(b,'little'),value_signed=int.from_bytes(b,'little',signed=True),runtime_type=f['runtime_type'],load_conversion=f['load_conversion']))
(out/'region-semantic-values.json').write_text(json.dumps(values,ensure_ascii=False,indent=2))
with (out/'region-semantic-values.csv').open('w',newline='',encoding='utf-8-sig') as f:w=csv.DictWriter(f,fieldnames=values[0]);w.writeheader();w.writerows(values)
print('semantic fields',len(rows),'mapped',sum(x['disk_record_offset'] is not None for x in rows),'values',len(values))
