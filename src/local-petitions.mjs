import {constructionPlan} from './construction.mjs';
import {countrySummary} from './domestic.mjs';
import {welfareValue} from './building-effects.mjs';
import {activeDisaster} from './disasters.mjs';
import {CONSTRUCTION_PLANS,startConstruction} from './construction.mjs';
import {localAuthority} from './local-autonomy.mjs';
import {foodForecast} from './food-relief.mjs';
// Discretionary palace petitions belong to a settled, solvent dynasty.
export function palacePetitionReady(d,turn){
 if(turn<12)return false;
 const q=countrySummary(d,undefined,turn),cost=constructionPlan(d,'palaces').cost;
 if(!q.provinces.length||q.country.fiscal.debt>0||q.net<=0||q.country.fiscal.treasury-cost<Math.max(d.governance.reserve,cost*5))return false;
 if(q.provinces.some(p=>activeDisaster(p,turn)||welfareValue(p,'security')<60||welfareValue(p,'stability')<60||p.status.livingStandard<50))return false;
 const f=foodForecast(q.provinces[0],turn,turn+1,d),food=f.national??f;
 return food.shortfall===0&&(food.opening??food.grain)>=food.need*3;
}
// Optional extension: old saves acquire no fictitious petitions on read.
export function requestLocalConstruction(d,p,turn,building,reason){
 if(p.resourceRulesVersion!==1||building==='palaces'&&!palacePetitionReady(d,turn))return;
 const plan=constructionPlan(d,building);if(!plan)throw Error('请旨建物无效');
 const book=d.governance.petitions??={nextId:1,items:[]};
 if(book.items.some(r=>r.provinceId===p.id&&r.building===building&&['pending','deferred'].includes(r.status)))return;
 if(book.items.some(r=>r.provinceId===p.id&&r.building===building&&r.status==='rejected'&&turn-r.decidedTurn<3))return;
 book.items.unshift({id:book.nextId++,provinceId:p.id,building,cost:plan.cost,turn,status:'pending',reason});
 book.items=book.items.filter((r,i)=>i<100||['pending','deferred'].includes(r.status));
}
export function decideLocalPetition(state,{id,approve}){
 if(typeof approve!=='boolean')throw Error('批复无效');
 const next=structuredClone(state),d=next.domestic,book=d.governance.petitions,row=book?.items.find(r=>r.id===id);
 if(!row||!['pending','deferred'].includes(row.status))throw Error('奏请已处理或不存在');
 if(d.war?.battle||d.strategy?.pending||d.collapse?.pending||d.collapse?.ended||state.stats.life===0)throw Error('当前须先处理紧急国事');
 const finish=(status,reason,cost=0)=>{row.status=status;row.reason=reason;row.decidedTurn=state.turn;d.governance.records.unshift({turn:state.turn,provinceId:row.provinceId,cost,reason});d.governance.records=d.governance.records.slice(0,100);return {state:next,message:reason};};
 if(!approve)return finish('rejected','陛下驳回地方营建奏请，三旬内不重复呈奏');
 const p=d.provinces.find(p=>p.id===row.provinceId),home=d.countries.find(c=>c.id===d.playerCountryId),plan=constructionPlan(d,row.building);
 if(!p||p.countryId!==d.playerCountryId||!localAuthority(d,p).civil)return finish('cancelled','奏请失效：失地、州牧空缺或文政授权已收回');
 if(row.building==='palaces'&&!palacePetitionReady(d,state.turn))return finish('deferred','批准暂缓：国力与民生尚未达到行宫营建条件，未扣款');
 if(foodForecast(p,state.turn,state.turn+1,d).shortfall)return finish('deferred','批准暂缓：须先补足下旬口粮，未扣款');
 if(plan.cost!==row.cost||home.fiscal.treasury-plan.cost<d.governance.reserve)return finish('deferred','批准暂缓：费用变化或国库保留线不足，未扣款');
 try{
  const result=startConstruction(next,p.id,row.building),target=result.state.domestic.governance.petitions.items.find(r=>r.id===id);
  target.status='executed';target.reason='奉旨营建已开工';target.decidedTurn=state.turn;
  result.state.domestic.governance.records.unshift({turn:state.turn,provinceId:p.id,cost:plan.cost,reason:`奉旨营建${plan.name}，专项拨银${plan.cost}两；不占日常委任额度`});
  result.state.domestic.governance.records=result.state.domestic.governance.records.slice(0,100);
  return {...result,message:`奉旨营建${plan.name}已开工，实支${plan.cost}两`};
 }catch(error){return finish('deferred',`批准暂缓：${error.message}，未扣款`);}
}
export function validateLocalPetitions(d,turn){
 const book=d.governance.petitions;if(book===undefined)return;
 if(!Number.isSafeInteger(book.nextId)||book.nextId<1||!Array.isArray(book.items)||book.items.length>1000)throw Error('地方奏请记录无效');
 const ids=new Set();for(const r of book.items){if(!Number.isSafeInteger(r.id)||r.id<1||r.id>=book.nextId||ids.has(r.id)||!d.provinces.some(p=>p.id===r.provinceId)||!Object.hasOwn(CONSTRUCTION_PLANS,r.building)||r.cost!==constructionPlan(d,r.building).cost||!Number.isSafeInteger(r.turn)||r.turn<1||r.turn>turn||!['pending','deferred','rejected','cancelled','executed'].includes(r.status)||typeof r.reason!=='string'||r.reason.length>500||(r.status!=='pending'&&(!Number.isSafeInteger(r.decidedTurn)||r.decidedTurn<r.turn||r.decidedTurn>turn)))throw Error('地方奏请记录无效');ids.add(r.id);}
}
