import fs from 'node:fs';
import crypto from 'node:crypto';
const plan=JSON.parse(fs.readFileSync('docs/card-battle-final-balance-preregistration.json','utf8'));
const reports=['docs/card-battle-final-matrix.json','docs/card-battle-final-configured.json','docs/card-battle-final-yanying.json'];
const rows=[],missing=[],invalid=[];
for(const file of reports){
 if(!fs.existsSync(file)){missing.push(file);continue;}
 const report=JSON.parse(fs.readFileSync(file,'utf8'));
 if(report.domain!==plan.seedDomain||report.version!==plan.catalogVersion||report.pairsPerCase!==plan.pairsPerGroup)invalid.push(file+': seed/version/sample mismatch');
 for(const [source,expected]of Object.entries(plan.sourceHashes)){
  const current=crypto.createHash('sha256').update(fs.readFileSync(source)).digest('hex');
  if(current!==expected||report.sources?.[source]!==expected)invalid.push(file+': changed source '+source);
 }
 for(const r of report.rows){
  rows.push({id:r.id,games:r.games,pairs:r.pairs,score:r.first.mean,ci95:r.first.ci95,pass:r.first.mean>=.47&&r.first.mean<=.53,sourceReport:file,seedDomain:r.seedDomain});
 }
}
const ids=new Set();for(const row of rows){if(ids.has(row.id))invalid.push('duplicate '+row.id);ids.add(row.id);}
const expectedIds=plan.groups.map(x=>x.id);
for(const id of expectedIds)if(!ids.has(id))missing.push('group '+id);
for(const id of ids)if(!expectedIds.includes(id))invalid.push('unexpected '+id);
const failed=rows.filter(r=>!r.pass);
const out={status:invalid.length?'invalid':missing.length?'incomplete':failed.length?'failed':'passed',catalogVersion:plan.catalogVersion,seedDomain:plan.seedDomain,completedGroups:rows.length,expectedGroups:expectedIds.length,games:rows.reduce((n,r)=>n+r.games,0),missing,invalid,failedGroups:failed.map(r=>r.id),rows,limitations:['AI paired first-order score only; does not certify all human deck choices','20 actual UI games and foreground hour are separate acceptance gates']};
const acceptanceFile='docs/card-battle-base-balance-user-acceptance.json';
if(fs.existsSync(acceptanceFile)){out.userAcceptance=JSON.parse(fs.readFileSync(acceptanceFile,'utf8'));out.deliveryBalanceStatus=out.status==='failed'&&out.userAcceptance.additionalAcceptance?'accepted-by-user-with-recorded-target-exceptions':out.status;}
fs.writeFileSync('docs/card-battle-final-balance-summary.json',JSON.stringify(out,null,2)+'\n');
console.log(JSON.stringify({status:out.status,completedGroups:out.completedGroups,expectedGroups:out.expectedGroups,failedGroups:out.failedGroups,invalid:out.invalid}));
