import {agriculturalProduction} from './economy.mjs';
import {laborProfile} from './labor.mjs';
import {localAuthority} from './local-autonomy.mjs';
// Protect food first. Only spare labor and at most 20% of each unlocked
// non-farming job may move in one turn; locked jobs and soldiers never move.
export function planLocalLabor(p,turn){
 if(p.industryLabor)return {targets:Object.fromEntries(['farmers','herders','merchants','workers'].map(k=>[k,p.population.professions[k]])),moved:0,goal:Math.ceil(p.population.total*.005*1.1),produced:agriculturalProduction(p,turn).produced,reason:'产业用工随开发招募，保留空闲劳力，不自动抽走其他行业人口'};
 const preview=structuredClone(p),jobs=preview.population.professions,locks=new Set(p.localPolicy?.locks??[]),capacity=laborProfile(p),goal=Math.ceil(p.population.total*.005*1.1),before=agriculturalProduction(p,turn).produced;
 let moved=0,reason='生产岗位维持现状';
 if(before<goal&&!locks.has('farmers')){
  const spare=capacity.available,donors=['herders','merchants','workers'].filter(k=>!locks.has(k));
  const room=spare+donors.reduce((n,k)=>n+Math.floor(jobs[k]*.2),0),maxFarmers=jobs.farmers+room;
  const at=n=>{const q=structuredClone(preview);q.population.professions.farmers=n;return agriculturalProduction(q,turn).produced;};
  const target=Math.min(goal,at(maxFarmers));let low=jobs.farmers,high=maxFarmers;
  while(low<high){const mid=Math.floor((low+high)/2);if(at(mid)>=target)high=mid;else low=mid+1;}
  let need=low-jobs.farmers;const unassigned=Math.min(spare,need);jobs.farmers+=unassigned;need-=unassigned;moved+=unassigned;
  for(const k of donors){const n=Math.min(need,Math.floor(jobs[k]*.2));jobs[k]-=n;jobs.farmers+=n;need-=n;moved+=n;}
  reason=moved?`优先保粮：增派农人${moved}，其他各业至少保留原岗位80%`:'耕地或劳力不足，无法通过调配增粮';
 }else if(before<goal)reason='农人已手动锁定，保粮目标不足，请陛下调整';
 if(agriculturalProduction(preview,turn).produced>=goal&&p.localPolicy?.priority==='economy'&&!locks.has('merchants')){
  const n=Math.min(laborProfile(preview).available,Math.ceil(capacity.capacity*.02));jobs.merchants+=n;if(n){moved+=n;reason+=`；富余劳力${n}人投入商业`;}
 }
 return {targets:{farmers:jobs.farmers,herders:jobs.herders,merchants:jobs.merchants,workers:jobs.workers},moved,goal,produced:agriculturalProduction(preview,turn).produced,reason};
}
export function prepareLocalLabor(d,turn){
 for(const p of d.provinces){if(p.industryLabor||p.resourceRulesVersion!==1||!p.localPolicy||!d.personnel.delegations.includes(p.id)||!localAuthority(d,p).civil||p.localPolicy.lastLaborTurn>=turn)continue;
  const q=planLocalLabor(p,turn);Object.assign(p.population.professions,q.targets);p.localPolicy.lastLaborTurn=turn;
  d.governance.records.unshift({turn,provinceId:p.id,cost:0,reason:q.reason+(q.produced<q.goal?'；仍未达到保粮目标，需上奏处理':'')});d.governance.records=d.governance.records.slice(0,100);
 }
}
