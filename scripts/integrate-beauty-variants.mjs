import {readFileSync,writeFileSync,copyFileSync,existsSync,mkdirSync} from 'node:fs';
import {RANDOM_BEAUTY_ART} from '../src/random-beauties-data.mjs';
const root=new URL('../',import.meta.url);
const out=new URL('outputs/model-portraits-20261026/',root);
const variants=[['紫绡团扇','刘亦菲-青竹团扇-柳岩衣款-v2.png'],['月白轻纱','刘亦菲-月白抚琴-柳岩衣款-v2.png'],['赵灵儿','刘亦菲-赵灵儿.png']];
for(const file of ['张予曦-一字肩轻纱-v1.png',...variants.map(r=>r[1])]){
 if(!existsSync(new URL(file,out)))throw Error('Missing final portrait: '+file);
}
const catalogPath=new URL('src/random-beauties-data.mjs',root);
let catalog=readFileSync(catalogPath,'utf8');
const previous=RANDOM_BEAUTY_ART.find(r=>r.name==='张天爱'||r.name==='张予曦');
if(!previous)throw Error('Missing replacement catalogue entry');
const next={...previous,name:'张予曦',asset:'assets/beauties/random/女明星/张予曦.png',legacyAssets:[...new Set([...previous.legacyAssets,...(previous.asset.endsWith('/张予曦.png')?[]:[previous.asset])])]};
mkdirSync(new URL('before-replacements/',out),{recursive:true});
const backup=new URL('before-replacements/张天爱.png',out);
if(!existsSync(backup))copyFileSync(new URL(previous.asset,root),backup);
copyFileSync(new URL('张予曦-一字肩轻纱-v1.png',out),new URL(next.asset,root));
for(const match of catalog.matchAll(/\{[^{}]*\}/g)){
 let row;try{row=JSON.parse(match[0]);}catch{continue;}
 if(row.id===previous.id){catalog=catalog.slice(0,match.index)+JSON.stringify(next,null,2).replace(/\n/g,'\n  ')+catalog.slice(match.index+match[0].length);break;}
}
const added=[];
for(const [style,file] of variants){
 const id='liu-yifei-variants-20261026-'+style;
 const row={id,name:'刘亦菲-'+style,asset:'assets/beauties/random/女明星/'+file,regionId:'sheng',poolScope:'mainland',legacyAssets:[],category:'女明星'};
 copyFileSync(new URL(file,out),new URL(row.asset,root));
 if(!RANDOM_BEAUTY_ART.some(r=>r.id===id))catalog=catalog.replace(/,?\n\];/, ',\n  '+JSON.stringify(row)+'\n];');
 added.push({...row,source:file});
}
writeFileSync(catalogPath,catalog);
writeFileSync(new URL('additional-variants.json',out),JSON.stringify({replacement:{previous:'张天爱',...next,source:'张予曦-一字肩轻纱-v1.png'},added},null,2)+'\n');
console.log('Installed Zhang Yuxi replacement and three independently selectable Liu Yifei variants.');
