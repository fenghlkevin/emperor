import {readFileSync,writeFileSync,existsSync} from 'node:fs';
import {RANDOM_BEAUTY_ART} from '../src/random-beauties-data.mjs';
const manifest=JSON.parse(readFileSync(new URL('../outputs/random-beauties/redesign-v2.json',import.meta.url)));
for(const revision of manifest.people){if(revision.status!=='ready'||!existsSync(new URL('../'+revision.asset,import.meta.url)))throw Error('Not ready: '+revision.id);const row=RANDOM_BEAUTY_ART.find(r=>r.id===revision.id);if(row.asset!==revision.asset){row.legacyAssets=[...new Set([...row.legacyAssets,row.asset])];row.asset=revision.asset;}}
writeFileSync(new URL('../src/random-beauties-data.mjs',import.meta.url),`export const RANDOM_BEAUTY_ART=${JSON.stringify(RANDOM_BEAUTY_ART,null,2)};\nexport const RANDOM_PORTRAITS=RANDOM_BEAUTY_ART.map(p=>p.asset);\nexport function resolveRandomPortraitAsset(asset){return RANDOM_BEAUTY_ART.find(p=>p.asset===asset||p.legacyAssets.includes(asset))?.asset;}\n`);
