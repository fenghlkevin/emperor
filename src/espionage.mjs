import {treasuryShortage} from './action-feedback.mjs';
import {REALMS,countrySummary} from './domestic.mjs';
import {postTreasury} from './finance.mjs';
import {relationBetween} from './diplomacy.mjs';
export const spyBusy=(d,id)=>Boolean(d.espionage?.missions.some(m=>m.officialId===id));
export function spyEligible(d){return d.justice.officials.filter(o=>o.status==='serving'&&o.positionId===null&&!o.provinceId&&!spyBusy(d,o.id)&&!d.personnel.hanlin?.students.some(r=>r.officialId===o.id));}
export function spyCost(d,id){const a=REALMS.find(r=>r.id===d.playerCountryId)?.center??[108,34],b=REALMS.find(r=>r.id===id)?.center??a;return 1000+Math.floor(Math.hypot(b[0]-a[0],b[1]-a[1])/15)*500;}
export function spySnapshot(d,id,turn){const q=countrySummary(d,id,turn),sum=f=>q.provinces.reduce((n,p)=>n+f(p),0);return {turn,treasury:q.country.fiscal.treasury,grain:q.grainReserve??0,soldiers:q.military,population:q.total,provinces:q.provinces.length,prestige:q.country.prestige,weapons:sum(p=>Object.values(d.troopKits?.depots[p.id]?.stock??{}).reduce((a,b)=>a+b,0))};}
export function executeSpy(state,c){
 const s=structuredClone(state),d=s.domestic;d.espionage??={nextId:1,missions:[],reports:{},history:[]};const e=d.espionage;
 if(c.kind==='recall'){
  const m=e.missions.find(m=>m.id===c.id);if(!m)throw Error('任务已结束');
  e.missions=e.missions.filter(x=>x!==m);e.history.unshift(`第${s.turn}旬：召回${m.kind==='counterspy'?'查奸人员':'秘谍'}，本次进度作废，费用不退。`);
 }else{
  if(c.kind!==undefined&&!['foreign','counterspy'].includes(c.kind))throw Error('密令类型无效');
  const internal=c.kind==='counterspy',target=d.countries.find(x=>x.id===(internal?d.playerCountryId:c.countryId)&&Boolean(x.provinceIds.length)&&(internal||x.id!==d.playerCountryId));
  const o=spyEligible(d).find(o=>o.id===c.officialId);if(!target||!o)throw Error('请选择有效目标与空闲待命官员');
  if(e.missions.some(m=>m.countryId===target.id))throw Error(internal?'已有国内查奸任务':'该国已有秘谍');
  const cost=internal?1000:spyCost(d,target.id),home=d.countries.find(x=>x.id===d.playerCountryId);
  if(home.fiscal.treasury<cost)throw Error(treasuryShortage(cost,home.fiscal.treasury,internal?'国内反谍查奸':`派遣秘谍赴${target.name}`));
  const id=e.nextId++;postTreasury(d,d.playerCountryId,{turn:s.turn,expense:cost,key:`spy:${id}`,reason:internal?'皇城司反谍查奸':`皇城司赴${target.name}秘谍`});
  e.missions.push({id,kind:internal?'counterspy':'foreign',countryId:target.id,officialId:o.id,start:s.turn,due:s.turn+(internal?3:9),cost});
 }
 e.history=e.history.slice(0,50);s.stats.treasury=d.countries.find(x=>x.id===d.playerCountryId).fiscal.treasury;return s;
}
export function settleEspionage(d,turn,random=Math.random){
 const e=d.espionage;if(!e)return;
 for(const m of e.missions.filter(m=>m.due<=turn)){
  const o=d.justice.officials.find(o=>o.id===m.officialId),name=d.countries.find(c=>c.id===m.countryId)?.name??m.countryId;
  const success=o?.status==='serving'&&random()<Math.min(.9,.45+(o.intelligence??50)/200);
  if(m.kind==='counterspy'){
   let result='查察未果，未取得新线索';
   if(success){
    // Use the existing disloyalty / conspiracy system; sentencing stays with Justice.
    const found=d.justice.officials.filter(p=>p.id!==m.officialId&&p.status==='serving'&&!p.discovered&&(p.plotTurn!=null||p.loyalty<40)&&(!p.provinceId||d.provinces.some(q=>q.id===p.provinceId&&q.countryId===d.playerCountryId)));
    for(const p of found){p.discovered=true;p.discoveredTurn=turn;}
    result=found.length?`查获可疑线索：${found.map(p=>p.office+p.name).join('、')}，已移交刑部核查`:'本次查察未发现新增可疑线索';
   }
   e.history.unshift(`第${turn}旬：${o?.name??'查奸人员'}国内反谍查奸，${result}，人员已返回。`);
  }else{
   if(success)e.reports[m.countryId]=spySnapshot(d,m.countryId,turn);
   else{const r=relationBetween(d,d.playerCountryId,m.countryId);r.friendship=Math.max(0,r.friendship-10);}
   e.history.unshift(`第${turn}旬：${o?.name??'秘谍'}赴${name}谍报${success?'成功，取得当旬快照':'失败，友善降低10'}，人员已返回。`);
  }
 }
 e.missions=e.missions.filter(m=>m.due>turn);e.history=e.history.slice(0,50);
}
export function validateEspionage(d,turn){
 const e=d.espionage;if(e===undefined)return;
 if(!e||!Number.isSafeInteger(e.nextId)||e.nextId<1||!Array.isArray(e.missions)||!e.reports||Array.isArray(e.reports)||!Array.isArray(e.history)||e.history.length>50||e.history.some(x=>typeof x!=='string'))throw Error('秘谍存档无效');
 const ids=new Set(),people=new Set(),targets=new Set();
 for(const m of e.missions){
  const internal=m.kind==='counterspy';
  if((m.kind!==undefined&&!['foreign','counterspy'].includes(m.kind))||!Number.isSafeInteger(m.id)||m.id<1||m.id>=e.nextId||ids.has(m.id)||people.has(m.officialId)||targets.has(m.countryId)||!d.justice.officials.some(o=>o.id===m.officialId)||!d.countries.some(c=>c.id===m.countryId&&(internal?c.id===d.playerCountryId:c.id!==d.playerCountryId))||!Number.isSafeInteger(m.start)||m.start<1||m.start>turn||m.due!==m.start+(internal?3:9)||!Number.isSafeInteger(m.cost)||m.cost<1000)throw Error('秘谍任务存档无效');
  ids.add(m.id);people.add(m.officialId);targets.add(m.countryId);
 }
 for(const [id,q] of Object.entries(e.reports))if(!d.countries.some(c=>c.id===id&&id!==d.playerCountryId)||!Number.isSafeInteger(q.turn)||q.turn<1||q.turn>turn||['treasury','grain','soldiers','population','provinces','prestige','weapons'].some(k=>!Number.isFinite(q[k])||q[k]<0))throw Error('情报快照存档无效');
}
