import {executeNational} from './national-actions.mjs';
import {progressConditions,TITLES} from './imperial-progress.mjs';
import {specialActive} from './special-buildings.mjs';
export {TITLES};
export function courtHonorsStatus(state){
 const d=state.domestic,ps=d.provinces.filter(p=>p.countryId===d.playerCountryId),avg=k=>(ps.reduce((n,p)=>n+p.welfare[k],0)/(ps.length||1)).toFixed(1),conditions=progressConditions(state),heir=d.royalFamily.find(p=>p.id===state.dynasty.heirId);
 const facts={allLands:`本国${ps.length}/${d.provinces.length}州`,prosperous:`本国${ps.length}州，最低生活${ps.length?Math.min(...ps.map(p=>p.status.livingStandard)):0}；平均安定${avg('stability')}、治安${avg('security')}`,abilities:['wisdom','martial','charm','talent'].map((k,i)=>`${['智慧','武术','魅力','才艺'][i]}${state.stats[k]}/500`).join(' · '),wall:specialActive(d,'greatWall',state.turn)?'本国长城已启用':'本国长城尚未启用',mausoleum:specialActive(d,'mausoleum',state.turn)?'本国皇陵已启用':'本国皇陵尚未启用',family:`孝亲${state.mother?.filialPiety??0}/80 · 育亲${state.dynasty?.parenting??0}/80`,crowns:`已封禅${state.imperialProgress.crowns.length}/3次`};
 return {conditions,facts,heir,tenure:state.turn-state.dynasty.reignStartTurn,prestige:d.countries.find(c=>c.id===d.playerCountryId).prestige};
}
export function courtHonorsPlan(state,kind){
 if(!['fengshan','abdicate','ascend'].includes(kind))throw Error('请选择有效功业旨意');
 const command={kind,id:state.domestic.stateDevelopment.nextId},r=executeNational(state,command);
 return {command,message:r.message,cost:state.stats.treasury-r.state.stats.treasury,endsReign:r.state.stats.life===0,warning:kind==='fengshan'?'封禅支银3000两，每年最多一次；只增冠冕，不自动达成其他升仙条件。':'此旨会结束本朝并生成真实终评，不能撤回。后续继位须有成年未婚、未满80岁的在宫储君；亡国不能继位。'};
}
