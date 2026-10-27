"""Build-only, pixel-exact asset conversion. The source checkout is never changed."""
import argparse, concurrent.futures, hashlib, json, os, shutil
from pathlib import Path
from PIL import Image, ImageFile

ImageFile.LOAD_TRUNCATED_IMAGES = False
parser = argparse.ArgumentParser()
parser.add_argument('--source', type=Path, default=Path.cwd())
parser.add_argument('--destination', type=Path, required=True)
parser.add_argument('--jobs', type=int, default=min(4, os.cpu_count() or 1))
args = parser.parse_args()
source, destination = args.source.resolve(), args.destination.resolve()
assert source != destination and not destination.is_relative_to(source / 'src') and not destination.is_relative_to(source / 'assets'), 'Invalid stage location'
marker = destination / '.emperor-release-stage'
if destination.exists() and any(destination.iterdir()):
    assert marker.is_file(), 'Refuse to overwrite a directory not owned by this release builder'
    shutil.rmtree(destination)
destination.mkdir(parents=True, exist_ok=True)
marker.write_text('build-only staging directory', encoding='utf8')
destination.mkdir(parents=True, exist_ok=True)
for name in ['package.json', 'package-lock.json', 'desktop.cjs', 'desktop-runtime.cjs', 'desktop-assets.cjs', 'desktop-smoke.cjs', 'preload.cjs', 'index.html', 'electron-builder.release.cjs']:
    shutil.copy2(source / name, destination / name)
shutil.copytree(source / 'src', destination / 'src', dirs_exist_ok=True)
assets = []
for file in sorted((source / 'assets').rglob('*')):
    if not file.is_file():
        continue
    relative = file.relative_to(source)
    if 'references' in relative.parts or file.suffix.lower() == '.md':
        continue
    assets.append((file, relative))

def convert(item):
    file, relative = item
    target = destination / relative
    target.parent.mkdir(parents=True, exist_ok=True)
    if file.suffix.lower() != '.png' or relative.parts[1] == 'brand':
        shutil.copy2(file, target)
        return {'source': relative.as_posix(), 'bytes': file.stat().st_size, 'outputBytes': file.stat().st_size}
    webp = target.with_suffix('.webp')
    with Image.open(file) as original:
        image = original.convert('RGBA')
        pixels = image.tobytes()
        options = {'format': 'WEBP', 'lossless': True, 'exact': True, 'method': 4}
        if original.info.get('icc_profile'):
            options['icc_profile'] = original.info['icc_profile']
        image.save(webp, **options)
        with Image.open(webp) as decoded:
            assert image.size == decoded.size and pixels == decoded.convert('RGBA').tobytes(), f'Pixel mismatch: {relative}'
        row = {'source': relative.as_posix(), 'bytes': file.stat().st_size, 'dimensions': list(image.size), 'pixelSha256': hashlib.sha256(pixels).hexdigest()}
    if webp.stat().st_size < file.stat().st_size:
        if target.exists():
            target.unlink()
        row.update(target=webp.relative_to(destination).as_posix(), outputBytes=webp.stat().st_size)
    else:
        webp.unlink()
        shutil.copy2(file, target)
        row.update(outputBytes=file.stat().st_size)
    return row

rows = []
with concurrent.futures.ThreadPoolExecutor(max_workers=args.jobs) as pool:
    for row in pool.map(convert, assets):
        rows.append(row)
        if len(rows) % 100 == 0:
            print(f'Pixel-verified {len(rows)}/{len(assets)} assets', flush=True)
aliases = {row['source']: row['target'] for row in rows if 'target' in row}
(destination / 'release-assets.json').write_text(json.dumps({'version': 1, 'assets': aliases}, ensure_ascii=False), encoding='utf8')
report = {'version': 1, 'pixelExact': True, 'files': len(rows), 'converted': len(aliases), 'sourceBytes': sum(row['bytes'] for row in rows), 'outputBytes': sum(row['outputBytes'] for row in rows), 'assets': rows}
(destination.parent / 'asset-verification.json').write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding='utf8')
print(json.dumps({key: value for key, value in report.items() if key != 'assets'}), flush=True)
