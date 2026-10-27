"""Install the approved model replacements, retaining saved portrait aliases."""
from pathlib import Path
import json
import shutil

root = Path(__file__).resolve().parents[1]
out = root / 'outputs/model-portraits-20261026'
replacements = [
    ('乐基儿', '贺聪', '贺聪-一字肩轻纱-v1.png'),
    ('王李丹妮', '赵佳丽', '赵佳丽-站姿修订-v2.png'),
    ('雎晓雯', '雎晓雯', '雎晓雯-完整全身-v2.png'),
]
catalog_path = root / 'src/random-beauties-data.mjs'
manifest_path = out / 'manifest.json'
manifest = json.loads(manifest_path.read_text())
catalog = catalog_path.read_text()
# Check every output and registry entry before updating the batch.
prepared = []
for old, new, source in replacements:
    if not (out / source).is_file():
        raise FileNotFoundError(source)
    entry = next(r for r in manifest['registered'] if r['name'] in (old, new))
    old_asset = entry['asset']
    asset = f'assets/beauties/random/女明星/{new}-古绡模特.png'
    line = next(line for line in catalog.splitlines() if f'"asset": "{old_asset}"' in line)
    row = json.loads(line.strip().rstrip(','))
    row['name'] = new + '-古绡模特'
    row['asset'] = asset
    if old_asset != asset:
        row['legacyAssets'] = list(dict.fromkeys(row['legacyAssets'] + [old_asset]))
    prepared.append((old, new, source, entry, old_asset, asset))
    catalog = catalog.replace(line, '  ' + json.dumps(row, ensure_ascii=False) + ',')

backup = out / 'before-replacements'
backup.mkdir(exist_ok=True)
for old, new, source, entry, old_asset, asset in prepared:
    original = backup / Path(old_asset).name
    if not original.exists():
        shutil.copy2(root / old_asset, original)
    shutil.copy2(out / source, root / asset)
    entry.update(name=new, asset=asset, source=source)
    manifest['revisions'].pop(old, None)
    manifest['revisions'][new] = source
    for key in ('completed', 'reworkCompleted'):
        manifest[key] = list(dict.fromkeys(new if n == old else n for n in manifest.get(key, [])))
    if old != new:
        manifest['removedFromPool'] = list(dict.fromkeys(manifest['removedFromPool'] + [old]))
manifest['replacements'] = [{'previous': old, 'name': new, 'source': source} for old, new, source in replacements]
catalog_path.write_text(catalog)
manifest_path.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + '\n')
print('Installed replacements; old save paths resolve through legacyAssets.')
