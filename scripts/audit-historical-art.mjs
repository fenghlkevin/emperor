import fs from 'node:fs';
import crypto from 'node:crypto';
import {ACTIVE_HISTORICAL_PEOPLE} from '../src/exam.mjs';
import {OFFICIAL_ART} from '../src/official-art-data.mjs';
const variants=['full','court'];
const seen=new Map(),issues=[];
const rows=ACTIVE_HISTORICAL_PEOPLE.map(({id,name})=>{
 const images={};
 for(const variant of variants){
  const file=`assets/officials/historical/${id}/${variant}.png`;
  if(!fs.existsSync(file)){images[variant]={status:'missing',file};issues.push(`${name}: 缺少 ${variant}`);continue;}
  const bytes=fs.readFileSync(file),png=bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]));
  if(!png||bytes.length<33){images[variant]={status:'invalid',file};issues.push(`${name}: ${variant} 非有效PNG`);continue;}
  const width=bytes.readUInt32BE(16),height=bytes.readUInt32BE(20),hash=crypto.createHash('sha256').update(bytes).digest('hex');
  images[variant]={status:'present',file,width,height,hash};
  if(OFFICIAL_ART[id]?.[variant]!==file)issues.push(`${name}: ${variant} 未正确注册`);
  if(seen.has(hash))issues.push(`${name}: ${variant} 与 ${seen.get(hash)} 完全相同`);else seen.set(hash,`${name}/${variant}`);
 }
 return {id,name,images};
});
const report={total:rows.length,full:rows.filter(r=>r.images.full.status==='present').length,court:rows.filter(r=>r.images.court.status==='present').length,complete:rows.filter(r=>variants.every(v=>r.images[v].status==='present')).length,issues,characters:rows};
fs.writeFileSync('docs/official-art/completeness.json',JSON.stringify(report,null,2)+'\n');
console.log(`历史人物 ${report.total}：个人 ${report.full}，上朝 ${report.court}，双立绘齐全 ${report.complete}`);
for(const issue of issues)console.log(issue);
if(issues.length)process.exitCode=1;
