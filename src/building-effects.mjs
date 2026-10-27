import {balanced,serviceTarget} from './development-balance.mjs';
import {COMMERCE_ACTIVITY_SCALE,COMMERCE_GROWTH_CAP} from './balance-rules.mjs';
// Trial rules from the P0 plan. Fractions are stored as integer hundredths.
export const RECOVERY={temples:['stability',25,200],yamen:['security',25,200],markets:['activity',25,200],trainingGrounds:['fitness',25,200],palaces:['loyalty',10,100]};
const keys=['stability','security','activity','fitness','loyalty'];
const clamp=n=>Math.max(0,Math.min(100,n));
export function initializeBuildingEffects(d,turn=1){
 for(const p of d.provinces)if(p.buildingEffects===undefined)p.buildingEffects={version:1,baselineActivity:p.welfare.activity,baselineDefense:p.welfare.defense,baselineWalls:p.buildings.walls,lastTurn:turn,carry:Object.fromEntries(keys.map(k=>[k,0])),pending:null,last:null};
 return d;
}
export function welfareValue(p,key,turn){
 const b=p.buildingEffects;
 if(turn!==undefined&&b?.last?.turn===turn&&Object.hasOwn(b.last.before,key))return b.last.before[key];
 return p.welfare[key]+(b?.carry?.[key]??0)/100;
}
export function changeWelfare(p,key,delta){
 const n=clamp(welfareValue(p,key)+delta),whole=Math.floor(Math.round(n*100)/100);
 p.welfare[key]=whole;
 if(p.buildingEffects&&Object.hasOwn(p.buildingEffects.carry,key))p.buildingEffects.carry[key]=Math.round(n*100)-whole*100;
}
export function effectiveBuildings(p,turn){
 const counts={...p.buildings},pending=p.buildingEffects?.pending;
 if(pending&&turn!==undefined&&turn<pending.effectiveTurn)counts[pending.building]--;
 return counts;
}
export function commerceMultiplier(p,turn){return 1+Math.min(COMMERCE_GROWTH_CAP,Math.max(0,welfareValue(p,'activity',turn)-(p.buildingEffects?.baselineActivity??p.welfare.activity))/COMMERCE_ACTIVITY_SCALE);}
export function newRecruitTraining(p,turn){return Math.floor(welfareValue(p,'fitness')*.2);}
export function protectedGrainLoss(p,rawLoss,turn){return Math.floor(rawLoss/(1+effectiveBuildings(p,turn).granaries*.1));}
export function registerBuildingCompletion(p,building,turn){if(p.buildingEffects)p.buildingEffects.pending={building,completedTurn:turn,effectiveTurn:turn+1};}
export function buildingMarginal(p,building,turn){
 const counts=effectiveBuildings(p,turn),r=RECOVERY[building];
 if(r&&balanced(p)){const after={...p,buildings:{...p.buildings,[building]:p.buildings[building]+1}};return Math.max(0,serviceTarget(after,building,turn)-Math.max(serviceTarget(p,building,turn),welfareValue(p,r[0])));}
 if(r)return welfareValue(p,r[0])>=100?0:Math.min(r[2],(counts[building]+1)*r[1])-Math.min(r[2],counts[building]*r[1]);
 if(building==='walls')return Math.min(5,100-p.welfare.defense);
 return building==='granaries'?1/(1+counts.granaries*.1)-1/(1+(counts.granaries+1)*.1):0;
}
export function settleBuildingEffects(p,turn,fed,disaster){
 const b=p.buildingEffects;if(b.lastTurn>=turn)return;
 const counts=effectiveBuildings(p,turn),before=Object.fromEntries(keys.map(k=>[k,welfareValue(p,k)])),gains={},baseGains={},facilityGains={};
 for(const [building,[key,step,max]]of Object.entries(RECOVERY)){
  const allowed=building==='temples'?fed:building==='palaces'?fed&&!disaster:true;
  const target=serviceTarget(p,building,turn);
  const gain=balanced(p)?(allowed?Math.max(-.3,Math.min(Math.max(.05,Math.min(max,counts[building]*step)/100),(target-welfareValue(p,key))*.02)):0):(allowed?Math.min(max,counts[building]*step)/100:0);
  changeWelfare(p,key,gain);gains[key]=Math.round((welfareValue(p,key)-before[key])*100)/100;
  if(balanced(p)){const baseline=building==='palaces'?50:45,base=allowed?Math.max(-.3,Math.min(.05,(baseline-before[key])*.02)):0;baseGains[key]=Math.round(base*100)/100;facilityGains[key]=Math.round((gains[key]-baseGains[key])*100)/100;}
 }
 p.welfare.defense=clamp(b.baselineDefense+5*(counts.walls-b.baselineWalls));
 b.lastTurn=turn;b.last={turn,fed,disaster:Boolean(disaster),before,gains,...(balanced(p)?{baseGains,facilityGains}:{}),counts,defense:p.welfare.defense};
 if(b.pending&&b.pending.effectiveTurn<=turn)b.pending=null;
}
export function validateBuildingEffects(d,currentTurn=Infinity){
 const int=n=>Number.isSafeInteger(n)&&n>=0;
 const validValue=n=>Number.isFinite(n)&&n>=0&&n<=100;
 const fail=()=>{throw Error('建筑民生收益存档无效');};
 for(const p of d.provinces){const b=p.buildingEffects;
  if(!b||b.version!==1||!validValue(b.baselineActivity)||!validValue(b.baselineDefense)||!int(b.baselineWalls)||!int(b.lastTurn)||b.lastTurn<1||b.lastTurn>currentTurn||!b.carry||Object.keys(b.carry).length!==keys.length)fail();
  for(const key of keys)if(!int(b.carry[key])||b.carry[key]>99||(p.welfare[key]===100&&b.carry[key]!==0))fail();
  if(b.pending!==null){const v=b.pending;if(!v||!Object.hasOwn(p.buildings,v.building)||!int(v.completedTurn)||v.completedTurn<1||v.completedTurn>currentTurn||v.effectiveTurn!==v.completedTurn+1||p.buildings[v.building]<1)fail();}
  if(b.last!==null){const r=b.last;if(!r||r.turn!==b.lastTurn||typeof r.fed!=='boolean'||typeof r.disaster!=='boolean'||!r.before||!r.gains||!r.counts||!validValue(r.defense))fail();
   for(const key of keys)if(!validValue(r.before[key])||!Number.isFinite(r.gains[key])||r.gains[key]<(balanced(p)?-.3:0)-.001||r.gains[key]>2)fail();
   if(r.baseGains!==undefined||r.facilityGains!==undefined)for(const key of keys)if(!Number.isFinite(r.baseGains?.[key])||!Number.isFinite(r.facilityGains?.[key])||Math.abs(r.baseGains[key]+r.facilityGains[key]-r.gains[key])>.001)fail();
   for(const key of Object.keys(p.buildings))if(!int(r.counts[key]))fail();
  }
 }
}
