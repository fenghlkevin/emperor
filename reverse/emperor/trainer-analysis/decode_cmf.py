from pathlib import Path
from collections import Counter
import json,csv,re
out=Path(__file__).parent;d=(out/'皇帝内存修改器V1.2.resources/CMF_135_2052.bin').read_bytes()
weights={ord(c):3 for c in 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'};weights.update({ord(c):5 for c in ' \r\n[]=,.'});weights.update({ord(c):1 for c in '_-/:\\"<>;%(){}'})
k=[]
for i in range(54):
 cnt=Counter(d[i::54]);k.append(cnt.most_common(1)[0][0] if i%2 else max(range(256),key=lambda x:sum(n*weights.get(c^x,-2) for c,n in cnt.items())))
x=bytes(b^k[i%54] for i,b in enumerate(d));s=x.decode('utf-16le',errors='replace');start=s.index('[APPINFO]');end=s.index('\r\n',s.index('Script=unChecked||{||Call.SaveDataLock(CheckBox10);||}||',s.index('[CONTROL9_12]')))+2;s=s[start:end];(out/'trainer-config.ini').write_text(s)
sections={};cur=None
for line in s.splitlines():
 if re.fullmatch(r'\[[A-Z0-9_]+\]',line):cur=line[1:-1];sections[cur]={}
 elif '=' in line and cur:a,b=line.split('=',1);sections[cur][a]=b
(out/'trainer-config.json').write_text(json.dumps(sections,ensure_ascii=False,indent=2));rows=[]
for name,p in sections.items():
 if 'address' not in p:continue
 label=p.get('text','');source='explicit text'
 if not label:
  frame=name.split('_')[0];candidates=[]
  for n,l in sections.items():
   if n.split('_')[0]!=frame or l.get('type')!='3' or not l.get('text'):continue
   dx=int(p.get('left',0))-int(l.get('left',0))-int(l.get('width',0));dy=abs(int(p.get('top',0))-int(l.get('top',0)))
   candidates.append((dy*10+abs(dx),l['text']))
  if candidates:label=min(candidates)[1];source='inferred by nearby UI label'
 rows.append({'section':name,'name':p.get('name',''),'label':label,'label_source':source,'address':p['address'],'valueSize':p.get('valueSize',''),'way':p.get('way',''),'value':p.get('value',''),'DataType':p.get('DataType',''),'DataFormat':p.get('DataFormat','')})
(out/'trainer-fields.json').write_text(json.dumps(rows,ensure_ascii=False,indent=2))
with (out/'trainer-fields.csv').open('w') as f:
 w=csv.DictWriter(f,fieldnames=rows[0]);w.writeheader();w.writerows(rows)
print('key:',bytes(k).hex(),'sections',len(sections),'address-bearing controls',len(rows))
for row in rows:
 if row['section'].startswith(('CONTROL2_','CONTROL3_','CONTROL4_','CONTROL5_','CONTROL6_','CONTROL7_')):print(row['section'],row['label'],row['address'][:100],row['valueSize'])
