import {difficultyFactor} from './difficulty.mjs';
import {balanced} from './development-balance.mjs';
import {postTreasury} from './finance.mjs';
import {officialEffectSource} from './official-effects.mjs';
import {changeWelfare} from './building-effects.mjs';
import {validateDomestic} from './domestic.mjs';
export const GENERAL_TABS=[['train','加强训练'],['ongoing','长期训练'],['security','安全检视'],['transfer','调派地方']];
export function generalDefaults(d){const p=d.provinces.find(p=>p.id===d.centralArmy.sourceProvinceId);return {nextId:1,lastTrainingTurn:0,ongoing:false,trainingFloor:0,capitalProvinceId:p.id};}
export function centralTrainingEffect(d,base){
 const source=officialEffectSource(d,'central-general',{role:'general'}),cap=base===2?3:17;
 const gain=d.officialEffectsVersion===1&&source.active?Math.min(cap,Math.max(1,Math.round(base*source.efficiency))):base;
 return {source:{id:source.id,name:source.name,ability:source.ability},baseGain:base,gainCap:cap,gain};
}
export const centralTrainingCost=(d,manual=false,recovery=false)=>balanced(d)?Math.ceil(Math.max(manual?20:5,Math.ceil(d.centralArmy.soldiers*(manual?.04:.008)))*(recovery?difficultyFactor(d,'recoveryCostFactor'):1)):0;
export function quoteGeneral(state,command,{recovery=false}={}){
 const d=state.domestic,a=d.centralArmy,g=d.general,kind=command.kind,capital=d.provinces.find(p=>p.id===g.capitalProvinceId);let changes={},lines=[];
 if(kind==='train'){
  if(balanced(d)&&g.manualTrainingTurn===state.turn)throw Error('中央本旬已训练，请待下一旬');
  if(!a.soldiers)throw Error('中央无士兵，无法训练');if(a.training>=100)throw Error('训练值已满');const effect=centralTrainingEffect(d,10);changes.training=Math.min(100,a.training+effect.gain);lines=[`中央训练值：${a.training} → ${changes.training}（上限100）`,...(d.officialEffectsVersion===1?[`大将军${effect.source.name}，能力${effect.source.ability}；基础+10，本次实际+${changes.training-a.training}（单次增量上限17）`]:[])];
 }else if(kind==='ongoing'){
  if(typeof command.enabled!=='boolean')throw Error('训练计划设置无效');if(command.enabled===g.ongoing)throw Error('训练计划未改变');if(command.enabled&&!a.soldiers)throw Error('中央无士兵，无法开启训练');changes.ongoing=command.enabled;lines=[command.enabled?(balanced(d)?`开启长期训练：未满100时每旬实付${centralTrainingCost(d)}两（按实时兵数计），训练值提高${centralTrainingEffect(d,2).gain}，上限100；支出后不足国库保留线${d.governance?.reserve??0}两时暂停。征兵会稀释训练值，随后按旬恢复。`:`开启长期训练：每旬训练值提高${centralTrainingEffect(d,2).gain}，维持不低于当前 ${a.training}，上限100。`):'停止长期训练，保留现有训练值。'];
 }else if(kind==='security'){
  if(!a.soldiers)throw Error('中央无士兵，无法检视');if(capital.welfare.security>=100)throw Error('京城治安值已满');changes.security=Math.min(100,capital.welfare.security+10);lines=[`京城（${capital.name}）治安：${capital.welfare.security} → ${changes.security}`];
 }else throw Error('军令无效');
 const cost=kind==='train'?centralTrainingCost(d,true,recovery):0;
 if(cost)lines.push(`本次训练支银${cost}两，每旬限一次；新兵需逐旬训练。`);
 return {kind,title:GENERAL_TABS.find(([k])=>k===kind)[1],changes,lines,cost,canAfford:d.countries.find(c=>c.id===d.playerCountryId).fiscal.treasury>=cost};
}
export function executeGeneral(state,command,options={}){
 if(command.id!==state.domestic.general.nextId||!Number.isSafeInteger(command.id))throw Error('军令已执行或数据已更新，请重新拟令');
 const q=quoteGeneral(state,command,options),next=structuredClone(state),d=next.domestic,a=d.centralArmy,g=d.general,c=q.changes;
 if(!q.canAfford)throw Error(`国库不足，训练需${q.cost}两`);
 if(q.cost){postTreasury(d,d.playerCountryId,{turn:state.turn,expense:q.cost,reason:'中央军训练投入',key:`central-training:${state.turn}`});g.manualTrainingTurn=state.turn;next.stats.treasury=d.countries.find(c=>c.id===d.playerCountryId).fiscal.treasury;}
 if(q.kind==='train'){if(d.officialEffectsVersion===1){const effect=centralTrainingEffect(d,10);g.trainingEffect={turn:state.turn,before:a.training,after:c.training,delta:c.training-a.training,mode:'manual',floor:a.training,...effect};}a.training=c.training;}
 if(q.kind==='ongoing'){g.ongoing=c.ongoing;g.trainingFloor=balanced(d)?0:c.ongoing?a.training:0;}
 if(q.kind==='security')changeWelfare(d.provinces.find(p=>p.id===g.capitalProvinceId),'security',10);
 g.nextId++;validateDomestic(d);return {state:next,receipt:{title:q.title,lines:q.lines,id:command.id}};
}
export function settleGeneral(d,turn){const g=d.general;if(g.lastTrainingTurn>=turn)return;g.lastTrainingTurn=turn;if(g.ongoing&&d.centralArmy.soldiers){const effect=centralTrainingEffect(d,2),before=d.centralArmy.training;if(balanced(d)){g.trainingFloor=0;if(before>=100)return;const cost=centralTrainingCost(d);if(d.countries.find(c=>c.id===d.playerCountryId).fiscal.treasury-cost<(d.governance?.reserve??0))return;postTreasury(d,d.playerCountryId,{turn,expense:cost,recurring:true,reason:'中央军长期训练投入',key:`ongoing-training:${turn}`});}d.centralArmy.training=Math.min(100,Math.max(g.trainingFloor,before)+effect.gain);if(d.officialEffectsVersion===1)g.trainingEffect={turn,before,after:d.centralArmy.training,delta:d.centralArmy.training-before,mode:'ongoing',floor:g.trainingFloor,...effect};}}
