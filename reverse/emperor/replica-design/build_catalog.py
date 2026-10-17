from pathlib import Path
import json, csv, re, hashlib
ROOT = Path(__file__).resolve().parent
SRC = ROOT.parent
DATA = ROOT/'data'; DATA.mkdir(exist_ok=True)
def read(p): return json.loads((SRC/p).read_text())
def save(n, v): (DATA/n).write_text(json.dumps(v, ensure_ascii=False, indent=2)+'\n')
layout = read('save-analysis/layout_evidence.json')
regions = read('rules-analysis/region-semantics.json')
save('serialization-mappings.json', layout); save('region-fields.json', regions)
labels = {
 'official': {7:'状态',8:'原byte08',9:'年龄',10:'智慧',12:'武力',14:'清廉',16:'忠诚',18:'经验',20:'爵位',21:'职务',22:'战斗关联低byte'},
 'harem': {0:'存在标志',8:'入宫序号候选',9:'年龄',10:'外貌',11:'经验',13:'能力',15:'怀孕月计数',16:'老年死亡概率累计',17:'肖像'},
 'child': {7:'年龄',8:'性别(0男1女)'}}
rows=[]
for entity, group in layout.items():
 for i,f in enumerate(group['fields']):
  offset=f['serialized_offset']; name=labels.get(entity,{}).get(offset, f'unknown_{offset:03x}')
  matches=[r for r in regions if r.get('disk_record_offset')==offset] if entity=='region' else []
  if matches: name=' / '.join(r['name'] for r in matches)
  rows.append({'id':f'{entity}.{offset:03x}.{i}','entity':entity,'name':name,'serialized_offset':offset,
    'disk_width':f['width'],'runtime_offset':f['runtime_offset'],
    'runtime_width':f.get('runtime_width',f['width']),'conversion':f.get('conversion','copy'),
    'layout_evidence':'S','meaning_evidence':'unresolved' if (name.startswith('unknown') or name.startswith('原byte')) else 'see_source_per_field',
    'meaning_notes':[r.get('meaning_status','') for r in matches], 'source':'../save-analysis/layout_evidence.json',
    'semantic_source':'../rules-analysis/region-semantics.json' if matches else '../save-analysis/README.md',
    'load_pc':f.get('load_pc'),'store_pc':f.get('store_pc')})
header=read('code-analysis/io/load_header.mapping.json')
for i,f in enumerate(header):
 rows.append({'id':f'header.mapping.{i}','entity':'legacy_header','name':'raw_scalar_mapping',
   'serialized_absolute_offset':10+int(f['serialized_buffer_va'],16)-0xce4d8,
   'disk_width':{'byte':1,'word':2,'dword':4}.get(f['width']),
   'runtime_destination_expression':f['destination_expression'],'layout_evidence':'S','meaning_evidence':'unresolved',
   'source':'../code-analysis/io/load_header.mapping.json','load_pc':f['load_va'],'store_pc':f['store_va']})
save('field-catalog.json',{'note':'Copy mappings, not complete semantic recovery; unknown bytes remain in raw record. Header offsets are absolute, other offsets record-relative.','fields':rows})
with (DATA/'field-catalog.csv').open('w',newline='') as out:
 columns=['id','entity','name','serialized_offset','serialized_absolute_offset','disk_width','runtime_offset','runtime_width','conversion','runtime_destination_expression','meaning_evidence','source','load_pc']
 w=csv.DictWriter(out,columns,extrasaction='ignore');w.writeheader();w.writerows(rows)
settlements=[]
for tag in ['annex255','annex256','defeat255','defeat256','local254','local255','local256']:
 p=SRC/f'validation-round6/runtime/{tag}/result.json'
 if not p.exists():continue
 j=json.loads(p.read_text());b=j['before'];a=j.get('after',{});before=b['before'];after=a.get('after',[])
 before_ids={x['node'] for x in before};after_ids={x['node'] for x in after}
 settlements.append({'case':tag,'source':str(p.relative_to(SRC)),'method':'D: controlled fixture, complete original 6668F, not natural gameplay',
   'status':j['status'],'associations':b['associations'],'before_count':len(before),'after_count':len(after),
   'removed_nodes':sorted(before_ids-after_ids),'selected_nodes':[x['node'] for x in b['selected']],
   'witness_node':b['witness']['node'],'selected_after':[{**x,'actual_after':next((v for v in after if v['node']==x['node']),None)} for x in b['selected']],
   'target_owned':a.get('target_owned'),'local_owned':a.get('local_owned'),'owned_count':a.get('owned_count')})
save('settlement-observations.json',settlements)
for name, source in [('building-templates.json','rules-analysis/turns/building-templates.json'),('region-names.json','code-analysis/tables/region_names.json'),('herbs.json','code-analysis/tables/herbs.json')]:
 save(name,read(source))
manifest=[]
for p in sorted(DATA.glob('*')):
 if p.name=='manifest.json':continue
 manifest.append({'file':p.name,'size':p.stat().st_size,'sha256':hashlib.sha256(p.read_bytes()).hexdigest()})
save('manifest.json',manifest)
print(json.dumps({'field_mappings':len(rows),'region_semantics':len(regions),'settlement_cases':len(settlements)},ensure_ascii=False))
