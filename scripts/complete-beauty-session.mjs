import {readFileSync,writeFileSync,copyFileSync,existsSync,mkdirSync} from 'node:fs';
import {RANDOM_BEAUTY_ART,EVENT_BEAUTY_ART} from '../src/random-beauties-data.mjs';
const root=new URL('../',import.meta.url),out=new URL('outputs/model-portraits-20261026/',root);
const catalogPath=new URL('src/random-beauties-data.mjs',root);
let catalog=readFileSync(catalogPath,'utf8');
const manifestPath=new URL('manifest.json',out),manifest=JSON.parse(readFileSync(manifestPath));
const changes=[
 ['乐基儿','贺聪','贺聪-一字肩轻纱-v1.png'],
 ['王李丹妮','赵佳丽','赵佳丽-站姿修订-v2.png'],
 ['雎晓雯','雎晓雯','雎晓雯-完整全身-v2.png'],
];
const additions=EVENT_BEAUTY_ART.filter(row=>row.id.startsWith('carman-lee-20261026-'));
const carmanSource=row=>row.name+'-柳岩裹裙-v3.png';
for(const file of [...changes.map(r=>r[2]),...additions.map(carmanSource)])if(!existsSync(new URL(file,out)))throw Error('Missing portrait '+file);
const replacements=new Map();
mkdirSync(new URL('before-replacements/',out),{recursive:true});
for(const [old,name,source] of changes){
 const row=RANDOM_BEAUTY_ART.find(r=>r.name===old+'-古绡模特'||r.name===name+'-古绡模特');
 if(!row)throw Error('Missing catalogue '+old);
 const next={...row,name:name+'-古绡模特',asset:'assets/beauties/random/女明星/'+name+'-古绡模特.png',legacyAssets:[...new Set([...row.legacyAssets,...(old===name?[]:['assets/beauties/random/女明星/'+old+'-古绡模特.png'])])]};
 replacements.set(row.id,next);
 const backup=new URL('before-replacements/'+row.asset.split('/').at(-1),out);
 if(!existsSync(backup))copyFileSync(new URL(row.asset,root),backup);
 copyFileSync(new URL(source,out),new URL(next.asset,root));
 const entry=manifest.registered.find(r=>r.name===old||r.name===name);
 Object.assign(entry,{name,asset:next.asset,source});
 manifest.completed=manifest.completed.map(n=>n===old?name:n);
 delete manifest.revisions[old];manifest.revisions[name]=source;
}
catalog=catalog.replace(/\{[^{}]*\}/g,s=>{let row;try{row=JSON.parse(s);}catch{return s;}return replacements.has(row.id)?JSON.stringify(replacements.get(row.id)):s;});
for(const row of additions){
 copyFileSync(new URL(carmanSource(row),out),new URL(row.asset,root));
 if(![...RANDOM_BEAUTY_ART,...EVENT_BEAUTY_ART].some(r=>r.id===row.id))catalog=catalog.replace(/,?\n\];/,',\n  '+JSON.stringify(row)+'\n];');
}
manifest.removedFromPool=[...new Set([...manifest.removedFromPool,'乐基儿','王李丹妮'])];
manifest.replacements=changes.map(([previous,name,source])=>({previous,name,source}));
manifest.reworkCompleted=[...new Set([...manifest.reworkCompleted.filter(n=>!['乐基儿','王李丹妮'].includes(n)),...changes.map(r=>r[1])])];
writeFileSync(catalogPath,catalog);writeFileSync(manifestPath,JSON.stringify(manifest,null,2)+'\n');
writeFileSync(new URL('session-completion.json',out),JSON.stringify({changes,additions,pending:[]},null,2)+'\n');
console.log('Installed previous session corrections and two Carman Lee costumes.');
