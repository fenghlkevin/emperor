"""Install reviewed model revisions while retaining original catalogue paths and backups."""
from pathlib import Path
import json
import shutil

root = Path(__file__).resolve().parents[1]
out = root / 'outputs/model-portraits-20261026'
manifest_path = out / 'manifest.json'
manifest = json.loads(manifest_path.read_text())
selected = {
    '赵佳丽': '赵佳丽-站姿修订-v2.png',
    '柳岩': '柳岩-一字领轻纱-v6.png',
    '徐若瑄': '徐若瑄-一字领轻纱-v6.png',
    '贺聪': '贺聪-一字肩轻纱-v1.png',
    '雎晓雯': '雎晓雯-完整全身-v2.png',
    '侯梦蝶': '侯梦蝶-轻纱开衩-v5.png',
    '游天翼': '游天翼-轻纱开衩-v5.png',
    '张梓琳': '张梓琳-头身修订-v3.png',
}
# Validate the complete batch before changing any active resource.
for source in selected.values():
    if not (out / source).is_file():
        raise FileNotFoundError(source)
backup = out / 'before-rework'
backup.mkdir(exist_ok=True)
for name, source in selected.items():
    entry = manifest['existingRetained'] if name == '张梓琳' else next(r for r in manifest['registered'] if r['name'] == name)
    target = root / entry['asset']
    original = backup / target.name
    if not original.exists():
        shutil.copy2(target, original)
    shutil.copy2(out / source, target)
    entry['source'] = source
    manifest['revisions'][name] = source
manifest['reworkCompleted'] = list(selected)
manifest['pending'] = []
manifest['completed'] = [n for n in manifest['completed'] if n not in manifest['removedFromPool']]
manifest['skippedExisting'] = []
manifest_path.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + '\n')
request_path = out / 'rework-request.json'
request = json.loads(request_path.read_text())
request['status'] = 'integrated'
request['selected'] = selected
request['integrationDecision'] = '用户确认先按当前已生成版本接入，保留现有脸部风格；未生成的统一一字领版本不作为接入前置条件。'
request['userCorrections'] = ['游天翼抬头正视镜头', '张梓琳缩小头部', '使用用户指定纱裙参考，轻薄微透、减少裙摆体积与金绣', '单侧开衩露出部分大腿']
request_path.write_text(json.dumps(request, ensure_ascii=False, indent=2) + '\n')
print('Installed reviewed revised portraits; originals preserved in', backup)
