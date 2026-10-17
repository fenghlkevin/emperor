from pathlib import Path
import hashlib,json,collections
root=Path(__file__).resolve().parent; src=root/'extracted'; rows=[]
for p in sorted(src.rglob('*')):
 if p.is_file():
  b=p.read_bytes();rows.append(dict(path=str(p.relative_to(src)),size=len(b),sha256=hashlib.sha256(b).hexdigest(),extension=p.suffix.lower()))
(root/'files.json').write_text(json.dumps(rows,ensure_ascii=False,indent=2))
print('files',len(rows),'bytes',sum(x['size'] for x in rows));print(collections.Counter(x['extension'] for x in rows))
