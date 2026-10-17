from pathlib import Path
import json,shutil
root=Path(__file__).resolve().parents[1]
manifest=json.loads((root/'outputs/random-beauties/cleanup-manifest.json').read_text())
rows=[]
for p in manifest['people']:
 if p['status']!='ready':raise ValueError('Not ready '+p['id'])
 if not (root/p['target']).is_file():shutil.copyfile(p['source'],root/p['target'])
 rows.append({'id':p['id'],'name':p['name'],'asset':p['target'],'legacyAssets':[p['asset']]})
text='export const RANDOM_BEAUTY_ART='+json.dumps(rows,ensure_ascii=False,indent=2)+';\nexport const RANDOM_PORTRAITS=RANDOM_BEAUTY_ART.map(p=>p.asset);\nexport function resolveRandomPortraitAsset(asset){return RANDOM_BEAUTY_ART.find(p=>p.asset===asset||p.legacyAssets.includes(asset))?.asset;}\n'
(root/'src/random-beauties-data.mjs').write_text(text)
p=root/'src/beauty-raster-portrait.mjs';s=p.read_text().replace("import {RANDOM_PORTRAITS} from './random-beauties-data.mjs';","import {RANDOM_PORTRAITS,resolveRandomPortraitAsset} from './random-beauties-data.mjs';").replace('(RANDOM_PORTRAITS.includes(person.randomPortraitAsset)?person.randomPortraitAsset:RANDOM_PORTRAITS[(seed>>>0)%6])','(resolveRandomPortraitAsset(person.randomPortraitAsset)??RANDOM_PORTRAITS[(seed>>>0)%6])');p.write_text(s)
print('Applied all 20 cleaned portraits with legacy aliases')
