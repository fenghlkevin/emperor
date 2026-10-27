import {copyFileSync,existsSync,mkdirSync,readFileSync,writeFileSync} from 'node:fs';
import {EVENT_BEAUTY_ART} from '../src/random-beauties-data.mjs';
const root=new URL('../',import.meta.url),out=new URL('outputs/model-portraits-20261026/',root);
const rows=['王语嫣','小龙女'].map(style=>{
 const row=EVENT_BEAUTY_ART.find(r=>r.id==='carman-lee-20261026-'+style);
 if(!row)throw Error('Missing Carman Lee catalogue entry: '+style);
 return {...row,source:row.name+'-柳岩裹裙-v3.png'};
});
for(const row of rows)if(!existsSync(new URL(row.source,out)))throw Error('Missing final portrait: '+row.source);
const backupDir=new URL('before-carman-skirt-v3/',out);mkdirSync(backupDir,{recursive:true});
for(const row of rows){
 const backup=new URL(row.name+'.png',backupDir);
 if(!existsSync(backup))copyFileSync(new URL(row.asset,root),backup);
 copyFileSync(new URL(row.source,out),new URL(row.asset,root));
}
const report={mode:'built-in image_gen',revision:'liuyan-slim-wrap-skirt-v3',promptFiles:['carman-skirt-v3-prompts.json'],registered:rows,pending:[]};
writeFileSync(new URL('carman-tv-rework.json',out),JSON.stringify(report,null,2)+'\n');
const completionPath=new URL('session-completion.json',out);
const completion=JSON.parse(readFileSync(completionPath));
completion.carmanTvRework=report;
delete completion.validation;
writeFileSync(completionPath,JSON.stringify(completion,null,2)+'\n');
console.log('Updated both Carman Lee costumes; preserved IDs, active asset paths and original images.');
