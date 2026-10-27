// Same per-unit ceiling for both sides, independent of office or leader rank.
export const MAX_SQUAD_SOLDIERS=10000;
export function formationCountChoices(current,available){
 const limit=Math.max(0,Math.min(MAX_SQUAD_SOLDIERS,Math.floor(available)));
 const values=[...new Set([1,50,100,200,300,500,750,1000,2000,3000,5000,7500,10000,limit,current])].filter(n=>Number.isSafeInteger(n)&&n>0&&(n<=limit||n===current)).sort((a,b)=>a-b);
 return {limit,values};
}
// Legacy rule sets keep their historical command size for replay/load checks.
export const squadSoldierLimit=d=>d.resourceRulesVersion===1?MAX_SQUAD_SOLDIERS:10000;
export function formationCountSelect(current,available=MAX_SQUAD_SOLDIERS,attrs=''){
 const {limit,values}=formationCountChoices(current,available);
 return `<select ${attrs}>${values.map(n=>`<option value="${n}" ${n===current?'selected':''} ${n>limit?'disabled':''}>${n}人${n===limit?'（满额）':''}</option>`).join('')}</select>`;
}
export function remainingFormationCapacity(rows,current,source){
 const others=rows.filter(r=>r!==current&&r.sourceId===current.sourceId);
 const soldiers=(source?.soldiers??0)-others.reduce((n,r)=>n+r.count,0);
 const kits=(source?.kits[current.kind]??0)-others.filter(r=>r.kind===current.kind&&r.equipped!==false).reduce((n,r)=>n+r.count,0);
 return Math.max(0,Math.min(MAX_SQUAD_SOLDIERS,soldiers,current.equipped===false?MAX_SQUAD_SOLDIERS:kits));
}
