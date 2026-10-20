import {resourceShortage} from './action-feedback.mjs';
import {laborProfile} from './labor.mjs';
import {cityPopulation} from './city-capacity.mjs';
import {INDUSTRY_JOBS,industryStaffing} from './industry-labor.mjs';
const jobs=Object.values(INDUSTRY_JOBS);
const valid=n=>Number.isSafeInteger(n)&&n>=0;
export function initializeManpower(d){if(d.manpowerVersion!==undefined&&d.manpowerVersion!==1||d.manpowerVersion===1&&!d.manpower)throw Error('征调来源记录不完整');if(d.manpower===undefined)d.manpower={version:1,drafts:[]};d.manpowerVersion=1;return d;}
export function activeDrafts(d,p,job){return (d.manpower?.drafts??[]).filter(r=>r.originId===p.id&&r.job===job).reduce((n,r)=>n+r.count,0);}
export function cityDraftCapacity(d,p){return Math.max(0,Math.floor((jobs.reduce((n,j)=>n+p.population.professions[j]-activeDrafts(d,p,j),0))/2));}
export function draftCapacity(d,p,job){return Math.min(cityDraftCapacity(d,p),Math.max(0,Math.floor((p.population.professions[job]-activeDrafts(d,p,job))/2)));}
export function planManpower(d,provinces,amount,rates={}){
 if(!valid(amount)||amount<1)throw Error('征调人数须为正整数');
 if(!rates||typeof rates!=='object'||Array.isArray(rates)||Object.entries(rates).some(([job,n])=>!jobs.includes(job)||!valid(n)||n!==0&&(n<10||n>50)))throw Error('产业抽调比例须为0或10%—50%');
 let left=amount;const rows=[];
 // Always use idle workers throughout the eligible territory before industry.
 for(const p of provinces){const n=Math.min(left,laborProfile(p).available);if(n)rows.push({provinceId:p.id,job:null,count:n});left-=n;if(!left)break;}
 for(const p of provinces){let room=cityDraftCapacity(d,p);for(const job of jobs){if(!left)break;const n=Math.min(left,Math.floor(p.population.professions[job]*(rates[job]??0)/100),draftCapacity(d,p,job),room);if(n)rows.push({provinceId:p.id,job,count:n});left-=n;room-=n;}if(!left)break;}
 if(left)throw Error(resourceShortage('按当前抽调比例征调','可征平民',amount,amount-left,'人')+'可增加产业抽调比例（累计上限50%）。');
 return rows;
}
function addDraft(d,row){const existing=d.manpower.drafts.find(r=>r.originId===row.originId&&r.stationId===row.stationId&&r.role===row.role&&r.job===row.job);if(existing)existing.count+=row.count;else d.manpower.drafts.push({...row});}
export function applyManpower(d,rows,role,stationId){
 initializeManpower(d);
 for(const row of rows){const p=d.provinces.find(p=>p.id===row.provinceId);if(row.job){p.population.professions[row.job]-=row.count;addDraft(d,{originId:p.id,stationId,role,job:row.job,count:row.count});}p.population.professions[role]+=row.count;}
}
// Move the associated origin claims together with actual troops. Untracked
// starting soldiers remain valid; no historical origin is invented.
export function moveDrafts(d,from,to,n,role='soldiers'){
 if(!d.manpower||from===to||!n)return;
 const additions=[];for(const row of d.manpower.drafts){if(row.stationId!==from||row.role!==role||!n)continue;const moved=Math.min(n,row.count);row.count-=moved;n-=moved;additions.push({...row,stationId:to,count:moved});}
 d.manpower.drafts=d.manpower.drafts.filter(r=>r.count);for(const row of additions)addDraft(d,row);
}
export function releaseDrafts(d,stationId,n,{role='soldiers',dead=false,turn}={}){
 if(!d.manpower)return;
 const station=d.provinces.find(p=>p.id===(stationId==='central'?d.centralArmy.sourceProvinceId:stationId));
 for(const row of d.manpower.drafts){if(row.stationId!==stationId||row.role!==role||!n)continue;const used=Math.min(n,row.count);row.count-=used;n-=used;if(dead)continue;
  const origin=d.provinces.find(p=>p.id===row.originId);
  // Repatriate only to a friendly home with capacity. Otherwise released
  // residents remain idle at the current station, without being discarded.
  const returning=origin.countryId===station.countryId?(origin===station?used:Math.min(used,cityPopulation(origin).available)):0;
  if(returning&&origin!==station){station.population.total-=returning;origin.population.total+=returning;}
  if(returning){const key=Object.keys(INDUSTRY_JOBS).find(k=>INDUSTRY_JOBS[k]===row.job),q=industryStaffing(origin,key,turn),back=Math.min(returning,q.vacant,laborProfile(origin).available);origin.population.professions[row.job]+=back;}
 }
 d.manpower.drafts=d.manpower.drafts.filter(r=>r.count);
}
export function validateManpower(d){
 if(d.manpowerVersion!==1||!d.manpower)throw Error('征调来源记录不完整');
 if(d.manpower.version!==1||!Array.isArray(d.manpower.drafts)||d.manpower.drafts.length>20000)throw Error('征调来源记录无效');
 const keys=new Set();for(const r of d.manpower.drafts){const key=[r.originId,r.stationId,r.role,r.job].join(':');if(keys.has(key)||!d.provinces.some(p=>p.id===r.originId)||r.stationId!=='central'&&!d.provinces.some(p=>p.id===r.stationId)||!['soldiers','militia'].includes(r.role)||r.role==='militia'&&r.stationId==='central'||!jobs.includes(r.job)||!valid(r.count)||r.count<1)throw Error('征调来源记录无效');keys.add(key);}
 for(const role of ['soldiers','militia'])for(const id of ['central',...d.provinces.map(p=>p.id)]){const p=d.provinces.find(p=>p.id===(id==='central'?d.centralArmy.sourceProvinceId:id)),actual=id==='central'?(role==='soldiers'?d.centralArmy.soldiers:0):p.population.professions[role]-(role==='soldiers'&&id===d.centralArmy.sourceProvinceId?d.centralArmy.soldiers:0),tracked=d.manpower.drafts.filter(r=>r.stationId===id&&r.role===role).reduce((n,r)=>n+r.count,0);if(tracked>actual)throw Error('征调来源超过实际在役人数');}
}
