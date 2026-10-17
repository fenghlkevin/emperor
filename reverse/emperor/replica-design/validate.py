from pathlib import Path
import json,re,hashlib,importlib.util
from urllib.parse import unquote
R=Path(__file__).resolve().parent;S=R.parent
errors=[];checks=[]
def check(ok,label):
 checks.append({'check':label,'passed':bool(ok)})
 if not ok:errors.append(label)
for p in sorted(R.glob('*.md')):
 for target in re.findall(r'\[[^\]\n]+\]\(([^)]+)\)',p.read_text()):
  if '://' in target or target.startswith('#'):continue
  path=unquote(target.split('#')[0]).strip('<>')
  check((p.parent/path).exists(),f'link {p.name} -> {path}')
f=json.loads((R/'data/field-catalog.json').read_text())['fields']
check(len(f)==234,'234 copied field mappings')
check(len({v['id'] for v in f})==len(f),'unique field IDs')
for row in f:
 if row['entity']=='legacy_header':check(10<=row['serialized_absolute_offset']<756,'header offset '+row['id'])
 else:
  limit={'official':47,'harem':24,'child':21,'region':370}[row['entity']]
  check(0<=row['serialized_offset'] and row['serialized_offset']+row['disk_width']<=limit,'field range '+row['id'])
check(json.loads((R/'data/serialization-mappings.json').read_text())==json.loads((S/'save-analysis/layout_evidence.json').read_text()),'serialization mappings identical to source')
check(json.loads((R/'data/region-fields.json').read_text())==json.loads((S/'rules-analysis/region-semantics.json').read_text()),'77 region semantics identical to source')
for name in ['KING1','KING2','KING3']:
 j=json.loads((S/f'save-analysis/decoded/{name}.json').read_text());raw=bytes.fromhex(j['raw_hex'])
 check(len(raw)==j['size'] and hashlib.sha256(raw).hexdigest()==j['sha256'],name+' raw baseline size/SHA')
 h=0x2f6+47*j['official_count']; child_pos=h+34*24
 region=child_pos+2+21*j['children_count']; battle_count_pos=region+31*370
 fixed=battle_count_pos+1+1793*j['other_count']+2+5*j['list_a_count']
 check(h==j['harem_offset'] and region==j['region_offset'] and fixed==j['tail_b_offset'] and fixed+1523==j['parsed_end'],name+' recursive offset equations')
for row in json.loads((R/'data/settlement-observations.json').read_text()):
 check(row['status']=='complete-original-function-return',row['case']+' complete original function baseline')
 check((S/row['source']).exists(),row['case']+' source present')
for row in json.loads((R/'data/acceptance-cases.json').read_text()):
 check((R/row['source']).exists(),row['id']+' acceptance source exists')
check(any(x['status']=='blocked_original_e2e' for x in json.loads((R/'data/acceptance-cases.json').read_text())),'does not falsely mark original E2E completed')
for x in json.loads((R/'data/manifest.json').read_text()):
 p=R/'data'/x['file'];check(hashlib.sha256(p.read_bytes()).hexdigest()==x['sha256'],'data hash '+x['file'])
spec=importlib.util.spec_from_file_location('numerics',R/'reference/numeric.py');m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m);m.self_check();check(True,'bounded executable numeric assertions')
report={'scope':'Documentation links, evidence copies, raw baseline hashes, 7 recorded settlement returns and bounded arithmetic assertions; not game implementation or E2E acceptance', 'passed':not errors,'checks':len(checks),'errors':errors,'details':checks}
(R/'validation-report.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
print(json.dumps({k:report[k] for k in ['passed','checks','errors']},ensure_ascii=False))
raise SystemExit(bool(errors))
