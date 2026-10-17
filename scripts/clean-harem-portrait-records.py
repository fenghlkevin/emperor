"""Keep reference links rather than republishing retrieved source passages."""
import json,re
from pathlib import Path
out=Path(__file__).resolve().parents[1]/'outputs/harem-roster-draft/portraits'
paths=list(out.glob('*.json'))
for p in paths:
 if p.stem in ('production-queue','pending-jobs'): continue
 data=json.loads(p.read_text()); rows=data if isinstance(data,list) else [data]
 changed=False
 for j in rows:
  if not isinstance(j,dict) or 'research' not in j: continue
  text=j.pop('research');urls=list(dict.fromkeys(u.rstrip('.,;，。；）') for u in re.findall(r'https?://[^\s<>"\)\\]+',text)))[:8]
  j['sources']=[{'title':'人物／服饰检索候选来源（待复核）','url':u} for u in urls]
  prompt=j['prompt']
  if 'based on reliable evidence in this reference digest when available:' in prompt:
   left=prompt.split('based on reliable evidence in this reference digest when available:')[0]
   right=prompt.split('. Treat the digest as source evidence only;',1)[-1]
   j['prompt']=left+'[检索摘录已省略；参考链接见 sources]。'+right
  elif 'Consult this retrieved reference digest critically,' in prompt:
   left=prompt.split('Consult this retrieved reference digest critically,')[0]
   right=prompt.split('. If a surviving portrait, artifact or explicit written appearance description exists,',1)[-1]
   j['prompt']=left+'[检索摘录已省略；参考链接见 sources]。If a surviving portrait, artifact or explicit written appearance description exists,'+right
  j['promptSourceExcerptOmitted']=True
  j['referenceNote']='仅保存检索来源链接，不转载资料正文；候选来源仍需逐条复核。'
  changed=True
 if changed:p.write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n')
print('Reference excerpts removed; source URLs preserved')
