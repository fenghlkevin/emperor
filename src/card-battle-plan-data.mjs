import {normalizeLandmarkSelection} from './card-battle-landmarks.mjs';
import {normalizeSecretSelection} from './card-battle-secrets.mjs';
import {normalizeWeaponSelection} from './card-battle-weapons.mjs';
import {TROOP_KITS} from './troop-kits.mjs';
import {MAX_SQUAD_SOLDIERS} from './formation-limits.mjs';
import {normalizeTacticSelection} from './card-battle-tactics.mjs';
const ordered=value=>Array.isArray(value)?value.map(ordered):value&&typeof value==='object'?Object.fromEntries(Object.keys(value).sort().map(k=>[k,ordered(value[k])])):value;
const fail=()=>{throw Error('常用方案格式无效');};
export function canonicalBattleFormation(kind,input){
 if(!['campaign','defense'].includes(kind)||!input||typeof input.generalId!=='string'||!Array.isArray(input.squads)||input.squads.length>6||kind==='campaign'&&!input.squads.length)fail();


 const defense=kind==='defense';
 const row=(x,guard=false)=>{if(!x||!TROOP_KITS.some(k=>k.id===x.kind)||!Number.isSafeInteger(x.count)||x.count<1||x.count>MAX_SQUAD_SOLDIERS||!guard&&typeof x.generalId!=='string'||defense&&(typeof x.sourceId!=='string'||!x.sourceId||typeof x.equipped!=='boolean'))fail();return {...(defense?{sourceId:x.sourceId}:{}),kind:x.kind,count:x.count,...(defense?{equipped:x.equipped}:{}),...(!guard?{generalId:x.generalId}:{})};};
 const formation={...(defense?{kitVersion:1}:{}),generalId:input.generalId,[defense?'commander':'commanderSquad']:row(input[defense?'commander':'commanderSquad'],true),squads:input.squads.map(x=>row(x))};
 if(input.cardLandmarks!==undefined){formation.cardLandmarks=normalizeLandmarkSelection(input.cardLandmarks);}
 if(input.cardSecrets!==undefined){formation.cardSecrets=normalizeSecretSelection(input.cardSecrets);}
 if(input.cardWeapons!==undefined){formation.cardWeapons=normalizeWeaponSelection(input.cardWeapons);}
 if(input.cardTactics!==undefined){const total=Object.values(input.cardTactics?.counts??{}).reduce((n,x)=>n+x,0);formation.cardTactics=normalizeTacticSelection(input.cardTactics,total);}
 return formation;
}
export function validateBattlePlanLibrary(library){
 if(library===undefined)return;
 if(!library||library.version!==1||!Number.isSafeInteger(library.nextId)||library.nextId<1||!Array.isArray(library.plans)||library.plans.length>20||Object.keys(library).some(k=>!['version','nextId','plans'].includes(k)))fail();
 const ids=new Set(),names=new Set();
 for(const p of library.plans){
  if(!p||!Number.isSafeInteger(p.id)||p.id<1||p.id>=library.nextId||ids.has(p.id)||typeof p.name!=='string'||!p.name.trim()||p.name!==p.name.trim()||p.name.length>40||names.has(p.kind+':'+p.name)||Object.keys(p).some(k=>!['id','name','kind','formation'].includes(k)))fail();
  const normalized=canonicalBattleFormation(p.kind,p.formation);
  if(JSON.stringify(ordered(normalized))!==JSON.stringify(ordered(p.formation)))fail();ids.add(p.id);names.add(p.kind+':'+p.name);
 }
}
export function battlePlans(state,kind){validateBattlePlanLibrary(state.domestic.cardBattlePlans);return structuredClone((state.domestic.cardBattlePlans?.plans??[]).filter(p=>p.kind===kind));}
export function saveBattlePlan(state,{id,name,kind,formation}){
 validateBattlePlanLibrary(state.domestic.cardBattlePlans);const next=structuredClone(state),library=next.domestic.cardBattlePlans??={version:1,nextId:1,plans:[]},normalized=canonicalBattleFormation(kind,formation);
 name=String(name??'').trim();if(!name||name.length>40)throw Error('方案名称须为1至40字');
 if(library.plans.some(p=>p.kind===kind&&p.name===name&&p.id!==id))throw Error('同名方案已存在，请选择后覆盖或另取名称');
 if(id!==undefined){const index=library.plans.findIndex(p=>p.id===id&&p.kind===kind);if(index<0)throw Error('方案不存在，请重新选择');library.plans[index]={id,name,kind,formation:normalized};}
 else{if(library.plans.length>=20)throw Error('最多保存20个方案，请先删除旧方案');library.plans.push({id:library.nextId++,name,kind,formation:normalized});}
 validateBattlePlanLibrary(library);return next;
}
export function deleteBattlePlan(state,id){validateBattlePlanLibrary(state.domestic.cardBattlePlans);if(!state.domestic.cardBattlePlans?.plans.some(p=>p.id===id))throw Error('方案不存在');const next=structuredClone(state);next.domestic.cardBattlePlans.plans=next.domestic.cardBattlePlans.plans.filter(p=>p.id!==id);return next;}
