from pathlib import Path
import json,csv
out=Path(__file__).parent;x=json.loads((out/'trainer-config.json').read_text());rows=json.loads((out/'trainer-fields.json').read_text())
labels={'CONTROL3_27':'农田容量/上限（UI斜杠右侧，推断）','CONTROL3_29':'牧原容量/上限（推断）','CONTROL3_31':'运输容量/上限（推断）','CONTROL3_33':'矿区容量/上限（推断）','CONTROL3_56':'贫富等级','CONTROL3_57':'灾害/状态','CONTROL3_106':'现金','CONTROL5_17':'爵位','CONTROL6_5':'外交关系','CONTROL6_9':'统治标记'}
for r in rows:
 if r['section'] in labels:r['label']=labels[r['section']];r['label_source']='manual review of UI label or enum'
 for key in ['FunType','bound','value']:
  r[key]=x[r['section']].get(key,'')
(out/'trainer-fields.json').write_text(json.dumps(rows,ensure_ascii=False,indent=2))
with (out/'trainer-fields.csv').open('w') as f:
 w=csv.DictWriter(f,fieldnames=rows[0]);w.writeheader();w.writerows(rows)
region=[]
for r in rows:
 if r['section'].startswith('CONTROL3_') and ',' not in r['address'] and (int(r['section'].split('_')[1])<73 or int(r['section'].split('_')[1]) in [106,138,140,141,143,146,148,150,152]):
  region.append({'offset':hex(int(r['address'],16)-0x24f9ae),'label':r['label'],'bytes_declared_by_trainer':int(r['valueSize']),'source_section':r['section'],'enum':r.get('value') if x[r['section']].get('type')=='6' else None})
region.insert(0,{'offset':'0x0','label':'统治标记','bytes_declared_by_trainer':1,'source_section':'CONTROL6_9','enum':'0-敌国||1-统治'})
(out/'region-structure.json').write_text(json.dumps({'trainer_base_address':'0x24f9ae','stride':337,'fields':region,'note':'配置地址不是存档偏移；width是修改器声明，个别控件与锁定宽度冲突。'},ensure_ascii=False,indent=2))
enums={n:{'address':p.get('address'),'valueSize':p.get('valueSize'),'value':p.get('value'),'bound':p.get('bound')} for n,p in x.items() if p.get('type') in ['6','9']}
(out/'trainer-enums-and-selectors.json').write_text(json.dumps(enums,ensure_ascii=False,indent=2))
