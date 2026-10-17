from pathlib import Path
import json,csv
out=Path(__file__).parent;save=out.parent/'save-analysis';r=json.loads((out/'region-structure.json').read_text());layout=json.loads((save/'layout_evidence.json').read_text())['region'];copies={f['runtime_offset']:f for f in layout['fields']};saves={n:json.loads((save/f'decoded/{n}.json').read_text()) for n in ['KING1','KING2','KING3']};rows=[];values=[]
fields=r['fields']
for p in fields:
 ro=int(p['offset'],16);f=copies.get(ro)
 if not f:continue
 row={'label':'财富累积积分' if p['label']=='现金' else p['label'],'trainer_label':p['label'],'runtime_relative_offset':ro,'trainer_address':hex(0x24f9ae+ro),'game_variant':'KING','game_LE_runtime_address':hex(0xc990e+ro),'EMPEROR_LE_runtime_address':hex(0xc99ae+ro),'disk_record_offset':f['serialized_offset'],'actual_width_from_load_code':f['width'],'actual_disk_width':f['width'],'actual_runtime_width':f.get('runtime_width',f['width']),'load_conversion':f.get('conversion','copy'),'type':'u'+str(f['width']*8)+'_le','trainer_width':p['bytes_declared_by_trainer'],'width_conflict':f.get('runtime_width',f['width'])!=p['bytes_declared_by_trainer'],'trainer_source':p['source_section'],'game_load_pc':f['load_pc'],'game_store_pc':f['store_pc']}
 for name,obj in saves.items():
  raw=bytes.fromhex(obj['regions'][0]['raw_hex']);off=f['serialized_offset'];row[name+'_hebei_value']=int.from_bytes(raw[off:off+f['width']],'little')
 rows.append(row)
sections=json.loads((out/'trainer-config.json').read_text());names=[sections[f'CONTROL3_{n}']['text'] for n in [73]+list(range(75,104))]+['中央（候选）']
for name,obj in saves.items():
 for reg in obj['regions']:
  raw=bytes.fromhex(reg['raw_hex'])
  for f in rows:
   q=f['disk_record_offset'];w=f['actual_width_from_load_code'];values.append({'save':name,'region_index':reg['index'],'region_name':names[reg['index']],'field':f['label'],'file_offset':reg['offset']+q,'disk_record_offset':q,'runtime_relative_offset':f['runtime_relative_offset'],'width':w,'raw_hex':raw[q:q+w].hex(),'value_unsigned':int.from_bytes(raw[q:q+w],'little'),'value_signed':int.from_bytes(raw[q:q+w],'little',signed=True)})
for filename,data in [('region-fields-joined',rows),('region-named-values',values)]:
 (out/(filename+'.json')).write_text(json.dumps(data,ensure_ascii=False,indent=2))
 with (out/(filename+'.csv')).open('w') as file:
  writer=csv.DictWriter(file,fieldnames=data[0]);writer.writeheader();writer.writerows(data)
print('joined fields',len(rows),'values',len(values));print([(v['label'],v['disk_record_offset'],v['KING1_hebei_value'],v['width_conflict']) for v in rows])
