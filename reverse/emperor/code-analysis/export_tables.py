from pathlib import Path
import json,struct,csv,re
root=Path(__file__).parent;out=root/'tables';out.mkdir(exist_ok=True)
p=root/'KING';b=(p/'object2.relocated.bin').read_bytes();raw=(p/'object2.bin').read_bytes();fix=json.loads((p/'fixups.json').read_text())['records'];base=0xb0000

def string(va):
 at=va-base;end=b.find(b'\0',at)
 if at<0 or at>=len(b) or end<0:return None
 return b[at:end].decode('big5',errors='replace')
def save(name,rows):
 (out/(name+'.json')).write_text(json.dumps(rows,ensure_ascii=False,indent=2))
 if rows:
  with (out/(name+'.csv')).open('w',newline='',encoding='utf-8-sig') as f:
   w=csv.DictWriter(f,fieldnames=rows[0].keys());w.writeheader();w.writerows(rows)
rows=[]
for i in range(30):
 at=0x14c70+8*i;ptr,a,c=struct.unpack_from('<IHH',b,at)
 rows.append(dict(index=i,table_va=hex(base+at),name=string(ptr),name_va=hex(ptr),word_at_4=a,word_at_6=c,raw_hex=raw[at:at+8].hex(),interpretation='word_at_4 likely age; word_at_6 likely beauty; names and numeric widths observed, field meanings inferred'))
save('historical_women',rows)
for name,at,count in [('region_names',0x14e70,30),('herbs',0x1528c,8)]:
 save(name,[dict(index=i,table_va=hex(base+at+4*i),string_va=hex(ptr:=struct.unpack_from('<I',b,at+4*i)[0]),text=string(ptr)) for i in range(count)])
# Entire pointer-backed literal inventory, avoids arbitrary string scanning through numeric data.
refs={}
for r in fix:
 if r['target_object']==2:refs.setdefault(r['target_offset'],[]).append(dict(source_object=r['source_object'],source_va=hex(r['source_va'])))
rows=[]
for at,rr in sorted(refs.items()):
 end=raw.find(b'\0',at)
 if end<at+2 or end>at+4096:continue
 s=raw[at:end]
 try:txt=s.decode('big5')
 except UnicodeError:continue
 if any(ord(c)<32 and c not in '\r\n\t' for c in txt):continue
 rows.append(dict(va=hex(base+at),object_offset=at,raw_hex=s.hex(),text=txt,references=rr,confidence='candidate literal, pointer reference observed; numeric false positives possible'))
(out/'referenced_strings.json').write_text(json.dumps(rows,ensure_ascii=False,indent=2))
print('strings',len(rows))
# Contiguous 22-byte person templates, each name pointer advances over 7-byte literals.
rr=sorted([x for x in fix if x['source_object']==2 and x['target_object']==2 and x['source_type']==7],key=lambda x:x['source_offset']);runs=[];run=[]
for x in rr:
 if run and (x['source_offset']-run[-1]['source_offset']!=22 or x['target_offset']-run[-1]['target_offset']!=7):
  if len(run)>=10:runs.append(run)
  run=[]
 run.append(x)
if len(run)>=10:runs.append(run)
for n,run in enumerate(runs):
 rows=[]
 for i,x in enumerate(run):
  at=x['source_offset'];words=struct.unpack_from('<9H',b,at+4)
  rows.append(dict(index=i,table_va=hex(base+at),name=string(x['target_va']),name_va=hex(x['target_va']),u16_fields=list(words),raw_hex=raw[at:at+22].hex(),status='22-byte pointer+9*u16 template observed; semantic field names pending caller verification'))
 save(f'person_templates_{n}',rows)
 print('person templates',len(rows),hex(run[0]['source_offset']))
