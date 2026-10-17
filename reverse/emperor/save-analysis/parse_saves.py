#!/usr/bin/env python3
"""Lossless empirical KING*.SAV decoder. Semantic labels remain hypotheses."""
from pathlib import Path
import struct,json,csv,hashlib,argparse

def u16(b,o):return struct.unpack_from('<H',b,o)[0]
def text(b):return b.split(b'\0')[0].decode('big5',errors='replace')
def parse(p):
 b=p.read_bytes();result={'file':p.name,'size':len(b),'sha256':hashlib.sha256(b).hexdigest(),'raw_hex':b.hex()}
 if b==b'1\r\n':result['status']='empty-slot-marker';return result
 if len(b)<758:result['status']='unrecognized';return result
 result['status']='empirical-format';n=u16(b,0x2f4);result['official_count']=n; result['header']={'raw_hex':b[:0x2f4].hex(),'title':text(b[:8]),'title_2':text(b[10:17]),'personal_name':text(b[17:24]),'u16_08':u16(b,8),'age_candidate':b[24],'age':b[24],'state_byte_25':b[25],'lifespan_limit':u16(b,26),'lifespan_remaining':u16(b,28),'stamina_max':u16(b,30),'stamina_current':u16(b,32),'health':u16(b,42),'happiness':u16(b,44),'treasury_candidate':struct.unpack_from('<I',b,72)[0],'treasury_balance_signed':struct.unpack_from('<i',b,72)[0]}
 result['header'].update(intelligence=u16(b,34),martial=u16(b,36),charm=u16(b,38),arts=u16(b,40))
 officials=[]
 for j in range(n):
  o=0x2f6+j*47;r=b[o:o+47]
  if len(r)!=47:raise ValueError('truncated official')
  officials.append({'index':j,'offset':o,'name':text(r[:7]),'byte_07':r[7],'byte_08':r[8],'age_candidate':r[9],**{k:u16(r,a) for k,a in [('intelligence_candidate',10),('martial_candidate',12),('integrity_candidate',14),('loyalty_candidate',16),('experience_candidate',18)]},'byte_20':r[20],'byte_21':r[21],'byte_22':r[22],'raw_hex':r.hex()})
 for person in officials:
  person.update(battle_association_raw=person['byte_22'],battle_association=person['byte_22'],battle_association_unassigned_marker=person['byte_22']==255,battle_association_source='validation-round4/territory/README.md')
 result['officials']=officials;o=0x2f6+n*47;result['harem_offset']=o;h=[]
 ranks='皇后 贵妃 淑妃 德妃 贤妃 昭仪 昭容 昭媛 修仪 修容 修媛 充仪 充容 充媛 婕妤 舞涓 娱灵 美人 才人 良人 御女 采女 淑女 宝林 婧娥 荣华 充衣 长使 少使 八子 七子 五官 顺常 选侍'.split()
 for j in range(34):
  a=o+24*j;r=b[a:a+24];h.append({'slot':j,'rank_guide_candidate':ranks[j],'offset':a,'occupied':r[0],'name':text(r[1:8]),'byte_08':r[8],'age_candidate':r[9],'appearance_candidate':r[10],'experience_candidate':u16(r,11),'ability_candidate':u16(r,13),'pregnancy_candidate':r[15],'byte_16':r[16],'portrait_candidate':r[17],'portrait_id':r[17],'raw_hex':r.hex()})
 for record in h:
  record.update(age=record['age_candidate'],pregnancy_month_counter=record['pregnancy_candidate'],death_probability_counter=record['byte_16'])
 result['harem']=h;o+=816;c=u16(b,o);result['children_count']=c;result['children_count_offset']=o;o+=2;children=[]
 for j in range(c):
  a=o+21*j;r=b[a:a+21];children.append({'index':j,'offset':a,'name':text(r[:7]),'byte_07':r[7],'byte_08':r[8],'mother_name_candidate':text(r[9:16]),'raw_hex':r.hex()})
 for record in children:record.update(age=record['byte_07'],sex_flag=record['byte_08'],sex={0:'男',1:'女'}.get(record['byte_08'],'unknown'))
 result['children']=children;o+=21*c;result['region_offset']=o;regions=[]
 for j in range(31):
  a=o+370*j;r=b[a:a+370];regions.append({'index':j,'offset':a,'u16_000':u16(r,0),'u16_002':u16(r,2),'dwords_004_087':[struct.unpack_from('<i',r,k)[0] for k in range(4,88,4)],'all_u16_le':[u16(r,k) for k in range(0,370,2)],'float_at_328':struct.unpack_from('<f',r,328)[0],'raw_hex':r.hex()})
 
 layouts=json.loads((Path(__file__).resolve().parent/'layout_evidence.json').read_text())
 for key,layout_name in [('officials','official'),('harem','harem'),('children','child')]:
  for record in result[key]:
   raw=bytes.fromhex(record['raw_hex']);record['mapped_fields']=[{**field,'value_unsigned':int.from_bytes(raw[field['serialized_offset']:field['serialized_offset']+field['width']],'little'),'value_signed':int.from_bytes(raw[field['serialized_offset']:field['serialized_offset']+field['width']],'little',signed=True)} for field in layouts[layout_name]['fields']]
 for record in regions:
  raw=bytes.fromhex(record['raw_hex']);record['mapped_fields']=[{**field,'value_unsigned':int.from_bytes(raw[field['serialized_offset']:field['serialized_offset']+field['width']],'little'),'value_signed':int.from_bytes(raw[field['serialized_offset']:field['serialized_offset']+field['width']],'little',signed=True)} for field in layouts['region']['fields']]
 result['regions']=regions;o+=31*370;result['tail_offset']=o;result['tail_hex']=b[o:].hex();result.update(parse_tail(b,o));return result

def parse_tail(b,o):
 layouts=json.loads((Path(__file__).resolve().parent/'tail_layout_evidence.json').read_text());parts=[]
 def take(name,n,evidence=None):
  nonlocal o
  r=b[o:o+n]
  if len(r)!=n:raise ValueError('truncated tail '+name)
  item={'name':name,'offset':o,'length':n,'raw_hex':r.hex()}
  if n in [1,2,4]:item['value_unsigned']=int.from_bytes(r,'little')
  if evidence:item.update(evidence)
  parts.append(item);o+=n;return item
 count=take('other_count',1,layouts['load_other'][0])['value_unsigned'];other=[]
 for j in range(count):
  start=o;fields=[]
  for k,f in enumerate(layouts['load_other'][1:]):fields.append(take(f'other_{j}_field_{k}',f['length'],f))
  other.append({'index':j,'offset':start,'length':o-start,'fields':fields,'raw_hex':b[start:o].hex()})
 count_a=take('list_a_count',2,layouts['load_tail_a'][0])['value_unsigned'];lista=[]
 for j in range(count_a):lista.append(take(f'list_a_{j}',5,layouts['load_tail_a'][1]))
 tail_b_start=o;fields=layouts['load_tail_b'];take('tail_b_u16',2,fields[0]);herbs=[]
 names=['冰山雪莲','冷凝不化冰','千年人参王','透光灵芝','神僧舍利子','龙脑香','鲸王脂','炽火蛙']
 for j in range(8):
  item=take(f'herb_{j}',2,fields[1]);item['name_guide_candidate']=names[j];herbs.append(item)
 array12=[take(f'array12_{j}',12,fields[2]) for j in range(30)]
 array15=[take(f'array15_{j}',15,fields[3]) for j in range(20)]
 for item in array15:
  raw=bytes.fromhex(item['raw_hex']);item.update(region_id=raw[0],building_kind=raw[1],progress_display=raw[2],per_tick_work=struct.unpack_from('<i',raw,3)[0],required_work=struct.unpack_from('<i',raw,7)[0],completed_work=struct.unpack_from('<i',raw,11)[0],slot_status='empty' if raw[0]==255 else 'pending_removal' if raw[0]==100 else 'active',semantics_source='rules-analysis/domestic/README.md')
 for record in other:
  record['semantic_name']='serialized_battle_record';record['units_a']=decode_units(record,101);record['units_b']=decode_units(record,974)
 for j,f in enumerate(fields[4:]):take(f'tail_b_field_{j+4}',f['length'],f)
 portrait_part=next(part for part in parts if part.get('runtime_address')==0xcc4d8)
 portrait_part['semantic_name']='harem_portrait_used'
 flags=bytes.fromhex(portrait_part['raw_hex']);trailing=b[o:]
 copies=[{'name':'portrait_used_first13_copy','offset':o,'expected_length':13,'available_length':len(trailing[:13]),'raw_hex':trailing[:13].hex(),'matches':len(trailing)>=13 and trailing[:13]==flags[:13]},
         {'name':'portrait_used_full20_copy','offset':o+13,'expected_length':20,'available_length':len(trailing[13:33]),'raw_hex':trailing[13:33].hex(),'matches':len(trailing)>=33 and trailing[13:33]==flags}]
 status='missing' if not trailing else 'incomplete' if len(trailing)<33 else 'matches' if all(c['matches'] for c in copies) else 'differs'
 return {'other_count':count,'other_records':other,'battle_records':other,'list_a_count':count_a,'list_a':lista,'herbs':herbs,'array12':array12,'array15':array15,'tail_b_offset':tail_b_start,'tail_sections':parts,'parsed_end':o,'unparsed_bytes':len(b)-o,'trailing_hex':trailing.hex(),
         'harem_portrait_used':{'offset':portrait_part['offset'],'runtime_address':0xcc4d8,'flags':list(flags),'raw_hex':flags.hex()},
         'redundant_portrait_tail':{'status':status,'copies':copies,'extra_bytes_hex':trailing[33:].hex(),'loader_consumes':False}}

def decode_units(record,runtime_offset):
 block=next(f for f in record['fields'] if f.get('runtime_offset')==runtime_offset and f['length']==810)
 raw=bytes.fromhex(block['raw_hex']);units=[]
 for i in range(45):
  r=raw[i*18:(i+1)*18];words=struct.unpack_from('<4h',r,4)
  units.append(dict(slot=i,file_offset=block['offset']+i*18,raw_hex=r.hex(),flags=r[0],type=r[1],region_id=r[2],unknown_byte_3=r[3],action_state=r[3],has_acted_this_turn=r[3]>=128,guard_action_completed=r[3]==129,soldiers=words[0],helmet=words[1],armor=words[2],shield=words[3],training=r[12],attack=struct.unpack_from('<h',r,13)[0],defense=struct.unpack_from('<h',r,15)[0],special_flag=r[17],special_reduction_active=r[17]==1,semantics_source='validation-round4/unit-flags/README.md'))
 return units

def csvout(path,rows):
 if not rows:return
 with path.open('w',encoding='utf-8-sig',newline='') as f:
  w=csv.DictWriter(f,fieldnames=list(dict.fromkeys(k for row in rows for k in row)));w.writeheader();w.writerows([{k:json.dumps(v,ensure_ascii=False) if isinstance(v,(dict,list)) else v for k,v in r.items()} for r in rows])
def main():
 ap=argparse.ArgumentParser();ap.add_argument('--input',type=Path,default=Path(__file__).resolve().parents[1]/'extracted/皇帝完美版/games/EMPEROR');ap.add_argument('--output',type=Path,default=Path(__file__).resolve().parent/'decoded');a=ap.parse_args();a.output.mkdir(parents=True,exist_ok=True);summ=[]
 for p in sorted(a.input.glob('KING*.SAV')):
  r=parse(p);(a.output/(p.stem+'.json')).write_text(json.dumps(r,ensure_ascii=False,indent=2),encoding='utf-8')
  assert bytes.fromhex(r['raw_hex'])==p.read_bytes()
  for k in ['officials','harem','children','regions','other_records','list_a','herbs','array12','array15','tail_sections']:csvout(a.output/(p.stem+'_'+k+'.csv'),r.get(k,[]))
  with (a.output/(p.stem+'_bytes.csv')).open('w',newline='') as f:
   w=csv.writer(f);w.writerow(['offset_decimal','offset_hex','byte_decimal','byte_hex']);w.writerows((i,f'0x{i:X}',v,f'{v:02X}') for i,v in enumerate(p.read_bytes()))
  summ.append({k:v for k,v in r.items() if k in ['file','size','sha256','status','official_count','harem_offset','children_count','region_offset','tail_offset','other_count','list_a_count','parsed_end','unparsed_bytes']})
 (a.output/'summary.json').write_text(json.dumps(summ,indent=2),encoding='utf-8');print(json.dumps(summ,indent=2))
if __name__=='__main__':main()
