import {recruitRate} from './difficulty.mjs';
import {ENABLED_KITS} from './troop-kit-world.mjs';
import {localAuthority} from './local-autonomy.mjs';
import {executeKitCommand,quoteKitCommand,worldKitDepot} from './troop-kit-world.mjs';
import {foodForecast} from './food-relief.mjs';
import {activeDisaster} from './disasters.mjs';
import {laborProfile} from './labor.mjs';
const terminal=['rejected','cancelled','executed'];
function checkCommand(c){
 if(!c||!['recruit','transfer'].includes(c.kind)||typeof c.sourceId!=='string'||c.sourceId==='central')throw Error('地方军务奏请无效');
 if(c.kind==='recruit'&&(!Number.isSafeInteger(c.amount)||c.amount<1||c.amount>10000))throw Error('扩军人数无效');
 if(c.kind==='transfer'&&(typeof c.targetId!=='string'||c.targetId===c.sourceId||c.targetId==='central'||!Number.isSafeInteger(c.soldiers)||c.soldiers<0||!c.quantities||Array.isArray(c.quantities)||Object.keys(c.quantities).some(k=>!ENABLED_KITS.includes(k))||Object.values(c.quantities).some(n=>!Number.isSafeInteger(n)||n<0)||(c.soldiers===0&&!Object.values(c.quantities).some(n=>n>0))))throw Error('跨州调兵调装数量无效');
}
export function requestLocalMilitary(state,command,reason='地方军务超出日常权限，须专项请旨'){
 checkCommand(command);const next=structuredClone(state),d=next.domestic,p=d.provinces.find(p=>p.id===command.sourceId&&p.countryId===d.playerCountryId);
 if(!p||p.resourceRulesVersion!==1||!localAuthority(d,p).military)throw Error('须由已授权且在任的本州将军呈请');
 if(typeof reason!=='string'||reason.length>300)throw Error('奏请缘由无效');
 const c=command.kind==='recruit'?{kind:'recruit',sourceId:p.id,amount:command.amount}:{kind:'transfer',sourceId:p.id,targetId:command.targetId,soldiers:command.soldiers,quantities:structuredClone(command.quantities)};
 const quote=quoteKitCommand(state,c),book=d.governance.militaryPetitions??={nextId:1,items:[]},signature=JSON.stringify(c);
 if(book.items.some(r=>(JSON.stringify(r.command)===signature||(r.command.kind===c.kind&&r.command.sourceId===c.sourceId&&r.command.targetId===c.targetId))&&(!terminal.includes(r.status)||r.status==='rejected'&&state.turn-r.decidedTurn<3)))throw Error('同一军务已呈请或仍在驳回冷却期');
 if(book.items.filter(r=>!terminal.includes(r.status)).length>=100)throw Error('未决军务奏请已满，请先处理');
 book.items.unshift({id:book.nextId++,provinceId:p.id,turn:state.turn,status:'pending',cost:quote.cost,reason,command:c});book.items=book.items.filter((r,i)=>i<100||!terminal.includes(r.status));
 return {state:next,message:'军务方案已呈请，尚未征兵、调动或扣款'};
}
export function proposeLocalRecruitment(d,p,turn){
 if(p.resourceRulesVersion!==1||!localAuthority(d,p).military||activeDisaster(p,turn)||foodForecast(p,turn,turn+1,d).shortfall||!d.troopKits)return;
 const depot=worldKitDepot(d,p.id),amount=Math.min(100,Math.max(0,Math.ceil(p.population.total*.01)-depot.soldiers),laborProfile(p).available);
 if(!amount)return;
 try{const result=requestLocalMilitary({turn,domestic:d,stats:{treasury:d.countries.find(c=>c.id===d.playerCountryId).fiscal.treasury}},{kind:'recruit',sourceId:p.id,amount},'地方驻军低于人口1%，建议扩军；不自动抽调农人');d.governance.militaryPetitions=result.state.domestic.governance.militaryPetitions;}catch(error){if(!/已呈请|冷却期|已满/.test(error.message))throw error;}
}
export function decideLocalMilitaryPetition(state,{id,approve}){
 if(typeof approve!=='boolean')throw Error('批复无效');const next=structuredClone(state),d=next.domestic,row=d.governance.militaryPetitions?.items.find(r=>r.id===id);
 if(!row||terminal.includes(row.status))throw Error('军务奏请已处理或不存在');
 if(d.war?.battle||d.strategy?.pending||d.collapse?.pending||d.collapse?.ended||state.stats.life===0)throw Error('当前须先处理紧急国事');
 const record=(target,status,message,cost=0)=>{const r=target.domestic.governance.militaryPetitions.items.find(r=>r.id===id);Object.assign(r,{status,reason:message,decidedTurn:state.turn});const g=target.domestic.governance;g.records.unshift({turn:state.turn,provinceId:row.provinceId,cost,reason:message});g.records=g.records.slice(0,100);return {state:target,message};};
 if(!approve)return record(next,'rejected','陛下驳回地方军务奏请，三旬内不重复呈奏');
 const p=d.provinces.find(p=>p.id===row.provinceId&&p.countryId===d.playerCountryId);
 if(!p||!localAuthority(d,p).military)return record(next,'cancelled','军务奏请失效：失地、将军空缺或军权已收回');
 try{
  const c={...row.command,id:d.troopKits.nextId},q=quoteKitCommand(next,c),target=c.kind==='transfer'?d.provinces.find(p=>p.id===c.targetId):p;
  if(activeDisaster(p,state.turn)||activeDisaster(target,state.turn))throw Error('来源州或接收州仍有灾情');
  if(foodForecast(p,state.turn,state.turn+1,d).shortfall||foodForecast(target,state.turn,state.turn+1,d).shortfall)throw Error('须先保证来源州及接收州口粮');
  const home=d.countries.find(c=>c.id===d.playerCountryId);if(q.cost!==row.cost)throw Error(`军令费用已变化：原拟${row.cost}两，现需${q.cost}两；请重新拟定。`);if(home.fiscal.treasury-q.cost<d.governance.reserve)throw Error(`国库保留线不足：军令需${q.cost}两，另须保留${d.governance.reserve}两；现有${home.fiscal.treasury}两，缺${q.cost+d.governance.reserve-home.fiscal.treasury}两。`);
  const result=executeKitCommand(next,c);
  for(const pid of new Set([p.id,target.id]))if(foodForecast(result.state.domestic.provinces.find(p=>p.id===pid),state.turn,state.turn+1,result.state.domestic).shortfall)throw Error('执行后将突破口粮底线');
  return record(result.state,'executed',`奉旨${c.kind==='recruit'?`扩军${c.amount}人`:`跨州调兵${c.soldiers}人并调装`}已执行，实支${q.cost}两；不占日常委任额度`,q.cost);
 }catch(error){return record(next,'deferred',`军务批准暂缓：${error.message}，未调动或扣款`);}
}
export function validateLocalMilitaryPetitions(d,turn){
 const b=d.governance.militaryPetitions;if(b===undefined)return;if(!Number.isSafeInteger(b.nextId)||b.nextId<1||!Array.isArray(b.items)||b.items.length>1000)throw Error('地方军务奏请无效');
 const ids=new Set();for(const r of b.items){checkCommand(r.command);if(!Number.isSafeInteger(r.id)||r.id<1||r.id>=b.nextId||ids.has(r.id)||r.provinceId!==r.command.sourceId||!d.provinces.some(p=>p.id===r.provinceId)||(r.command.kind==='transfer'&&!d.provinces.some(p=>p.id===r.command.targetId))||!Number.isSafeInteger(r.cost)||r.cost!==(r.command.kind==='recruit'?Math.ceil(r.command.amount*recruitRate(d)):0)||!Number.isSafeInteger(r.turn)||r.turn<1||r.turn>turn||!['pending','deferred',...terminal].includes(r.status)||typeof r.reason!=='string'||r.reason.length>500||(r.status!=='pending'&&(!Number.isSafeInteger(r.decidedTurn)||r.decidedTurn<r.turn||r.decidedTurn>turn)))throw Error('地方军务奏请无效');ids.add(r.id);}
}
