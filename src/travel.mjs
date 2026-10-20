import {changeWelfare,effectiveBuildings} from './building-effects.mjs';
import {postTreasury} from './finance.mjs';
import {INCOGNITO_PLACES,incognitoDialogue} from './incognito-data.mjs';
import {createTourEncounters,nextTourEvent,validateTourEvents} from './tour-events.mjs';
export {INCOGNITO_PLACES};

// The numeric rules below are populated from the EMPEROR instruction evidence.
export const TRAVEL_RULES={
 tour:{name:'巡游',energyCost:20,treasuryCost:20000,lifeCost:10,healthGain:0,happinessGain:20,prestigeGain:0,description:'安排消耗20体力，次晨起驾。出发支出20,000两、快乐增加20；返宫消耗10寿元，推进至出发月的下一月上旬，期间旬务照常结算。'},
 incognito:{name:'微服体察',energyCost:20,treasuryCost:0,lifeCost:8,healthGain:0,happinessGain:20,prestigeGain:0,description:'安排消耗20体力，次晨换民服出京。入场快乐增加20、寿元减少8，不收取银两；返宫推进一个行动阶段。青楼奇遇另有寿元与健康代价。'}
};
export function initializeTravel(s){s.travel??={version:1,nextId:1,pending:null,history:[]};s.travel.easterEggs??={xiaYuheSeen:s.harem?.members?.some(p=>p.travelOrigin?.easterEgg==='xia-yuhe')??false};s.travel.easterEggs.cameosSeen??=[...new Set(s.harem?.members?.map(p=>p.travelOrigin?.easterEgg).filter(id=>id&&id!=='xia-yuhe')??[])];return s;}
export function travelDestinations(s,kind='tour'){
 if(kind==='incognito')return s.domestic.provinces.filter(p=>p.id===s.domestic.general.capitalProvinceId&&p.countryId===s.domestic.playerCountryId);
 return s.domestic.provinces.filter(p=>p.countryId===s.domestic.playerCountryId&&effectiveBuildings(p,s.turn).palaces>0);
}
export function travelReady(s){const p=s.travel?.pending;return p&&s.turn>=p.dueTurn?p:null;}
// The replica has no E+28 field. Retain its verified wealth, population and
// protectorate terms; unsupported original special-score terms are not invented.
export function travelImperialPower(s){
 const d=s.domestic,home=d.playerCountryId,points=[8,14,20,28,40];
 const local=d.provinces.filter(p=>p.countryId===home).reduce((sum,p)=>sum+points[Math.min(4,Math.floor(p.status.livingStandard/25))],0);
 const protectedStates=d.diplomacy.filter(r=>r.countryIds.includes(home)&&(r.relation==='protector'&&r.countryIds[0]===home||r.relation==='protected'&&r.countryIds[1]===home)&&d.countries.find(c=>c.id===r.countryIds.find(id=>id!==home))?.provinceIds.length).length;
 const population=d.provinces.filter(p=>p.countryId===home).reduce((sum,p)=>sum+Object.values(p.population.professions).reduce((a,b)=>a+b,0),0);
 return local+protectedStates*20+Math.floor(population/100);
}
function record(s,message){s.harem.history.unshift(`第${s.turn}旬：${message}`);s.harem.history=s.harem.history.slice(0,30);}
export function scheduleTravel(state,kind,provinceId){
 const s=structuredClone(state);initializeTravel(s);const rule=Object.hasOwn(TRAVEL_RULES,kind)&&TRAVEL_RULES[kind];
 if(!rule)throw Error('出行类型无效');
 if(s.stats.life===0)throw Error('寿元已尽，本朝终结');
 if(s.phase===0||s.phase===5)throw Error('请在退朝后、入夜前安排出行');
 if(s.domestic.war?.battle||s.domestic.strategy?.pending?.defender===s.domestic.playerCountryId)throw Error('请先处理战事');
 if(s.travel.pending)throw Error('已有出行安排，请先完成或取消');
 // Keep one point so arranging a journey cannot accidentally trigger the app's exhaustion/advance path.
 if(s.stats.energy<=rule.energyCost)throw Error('安排出行需20体力，并须保留体力候驾，请先休息');
 const place=travelDestinations(s,kind).find(p=>p.id===provinceId);
 if(!place)throw Error(kind==='tour'?'请选择本国已建成行宫的地方':'微服体察须从京畿出发');
 const country=s.domestic.countries.find(c=>c.id===s.domestic.playerCountryId);
 if(country.fiscal.treasury<rule.treasuryCost)throw Error('国库不足，巡游出发需20,000两');
 s.stats.energy-=rule.energyCost;s.harem.streak=0;
 s.travel.pending={id:s.travel.nextId++,kind,provinceId:place.id,scheduledTurn:s.turn,dueTurn:s.turn+1,visits:[],visitCounts:{},events:[],encounters:[],ended:false};
 const message=`已安排${rule.name}${kind==='tour'?'前往'+place.name:''}，次晨出发；体力减少20。`;
 record(s,message);return {state:s,message};
}
export function beginTravel(state){
 const s=structuredClone(state),p=travelReady(s);
 if(!p)throw Error('尚未到出发时辰');
 if(p.startedTurn!==undefined)throw Error('本次出行已经开始');
 if(s.stats.life===0)throw Error('寿元已尽，本朝终结');
 if(s.domestic.war?.battle||s.domestic.strategy?.pending?.defender===s.domestic.playerCountryId)throw Error('请先处理战事');
 if(!travelDestinations(s,p.kind).some(place=>place.id===p.provinceId))throw Error('目的地已不具备出行条件，请取消行程');
 const rule=TRAVEL_RULES[p.kind],country=s.domestic.countries.find(c=>c.id===s.domestic.playerCountryId);
 if(rule.treasuryCost)postTreasury(s.domestic,country.id,{turn:s.turn,expense:rule.treasuryCost,reason:'浩荡巡游仪仗支出',key:`travel:${p.id}`});
 s.stats.treasury=country.fiscal.treasury;
 p.startedTurn=s.turn;p.startedPhase=s.phase;p.returnTurn=p.kind==='tour'?(Math.floor((s.turn-1)/3)+1)*3+1:s.turn;
 p.reward={treasury:rule.treasuryCost,happiness:Math.min(rule.happinessGain,100-s.stats.happiness),life:p.kind==='incognito'?Math.min(s.stats.life,rule.lifeCost):0,health:0,loyalty:0};
 s.stats.happiness+=p.reward.happiness;s.stats.life-=p.reward.life;s.harem.streak=0;
 p.encounters=p.kind==='tour'?createTourEncounters(s,p):[];
 const encounteredPeople=p.encounters.map(e=>e.personId).filter(Boolean);if(encounteredPeople.length)s.harem.seen=[...new Set([...(s.harem.seen??[]),...encounteredPeople])];
 const message=`${rule.name}已启程，${rule.treasuryCost?'国库支出20,000两，':''}快乐增加${p.reward.happiness}${p.reward.life?'，寿元减少'+p.reward.life:''}。`;
 record(s,message);return {state:s,message};
}
export function visitIncognito(state,placeId,random){
 const s=structuredClone(state),p=travelReady(s);
 if(!p||p.kind!=='incognito'||p.startedTurn===undefined||p.ended||s.stats.life===0)throw Error('当前无法继续体察');
 const place=INCOGNITO_PLACES.find(place=>place.id===placeId);if(!place)throw Error('访查地点无效');
 const count=p.visitCounts[placeId]??0;
 if(count>=1000)throw Error('此处已访查多次，请移步别处');
 if(!random){let seed=2166136261;for(const c of `${s.createdAt}|${s.name}|${p.id}|${placeId}|${count}`)seed=Math.imul(seed^c.charCodeAt(0),16777619);random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};}
 let event=incognitoDialogue(s,placeId,random);
 if(placeId==='brothel'&&count>=5&&Math.floor(random()*100)<50){
  const loss=Math.min(s.stats.life,10),health=Math.min(s.stats.health,20);
  s.stats.life-=loss;s.stats.health-=health;s.stats.happiness=100;p.reward.life+=loss;p.reward.health-=health;
  event={title:'青楼奇遇',text:'皇帝偶遇佳人，流连忘返。快乐恢复至100，健康减少'+health+'，寿元减少'+loss+'。此次体察已毕，请回宫。'};p.ended=true;
 }
 p.visitCounts[placeId]=count+1;if(!p.visits.includes(placeId))p.visits.push(placeId);
 p.events.unshift({placeId,title:event.title,text:event.text});p.events=p.events.slice(0,20);
 return {state:s,message:event.text};
}
export function completeTravel(state){
 const s=structuredClone(state),p=travelReady(s);
 if(!p||p.startedTurn===undefined)throw Error('出行尚未开始或已结算');
 if(s.stats.life>0&&nextTourEvent(s)&&s.domestic.provinces.find(place=>place.id===p.provinceId)?.countryId===s.domestic.playerCountryId)throw Error('尚有巡游事件待处理，请先颁旨再回宫');
 if(p.kind==='tour'){
  const loss=Math.min(s.stats.life,TRAVEL_RULES.tour.lifeCost);s.stats.life-=loss;p.reward.life+=loss;
 }
 const encounters=(p.encounters??[]).filter(e=>e.status==='resolved');
 const message=`${TRAVEL_RULES[p.kind].name}毕，起驾回宫。基础出行费用${p.reward.treasury.toLocaleString('zh-CN')}两，入场快乐增加${p.reward.happiness}，基础寿元消耗${p.reward.life}。${encounters.length?'\n沿途纪事：\n'+encounters.map(e=>e.result).join('\n'):''}`;
 const trip={...p,completedTurn:s.turn,message};s.travel.history.unshift(trip);s.travel.history=s.travel.history.slice(0,30);s.travel.pending=null;
 record(s,message);return {state:s,message,reward:p.reward,returnTurn:p.returnTurn,kind:p.kind};
}
export function celebrateTravel(s){
 const trip=s.travel.history[0];if(!trip||trip.kind!=='tour'||trip.celebrated||s.stats.life===0)return '';
 trip.celebrated=true;
 const p=s.domestic.provinces.find(place=>place.id===trip.provinceId);
 if(p.countryId!==s.domestic.playerCountryId||travelImperialPower(s)<200||p.status.livingStandard<25)return '';
 const before=p.welfare.loyalty;changeWelfare(p,'loyalty',2);trip.reward.loyalty=p.welfare.loyalty-before;
 return `百姓庆贺，${p.name}民忠增加${trip.reward.loyalty}。`;
}
export function cancelTravel(state){
 const s=structuredClone(state);initializeTravel(s);const p=s.travel.pending;
 if(!p||p.startedTurn!==undefined)throw Error('当前行程无法取消');
 s.travel.pending=null;const message='已取消出行，安排时消耗的体力不返还，未收取出行费用。';record(s,message);return {state:s,message};
}
export function validateTravel(s){
 initializeTravel(s);const t=s.travel,int=n=>Number.isSafeInteger(n)&&n>=1;
 const fail=()=>{throw Error('出巡存档无效');};
 if(t.version!==1||!int(t.nextId)||!Array.isArray(t.history)||t.history.length>30||!t.easterEggs||typeof t.easterEggs.xiaYuheSeen!=='boolean')fail();
 const validRecord=r=>r&&int(r.id)&&r.id<t.nextId&&['tour','incognito'].includes(r.kind)&&typeof r.provinceId==='string'&&s.domestic.provinces.some(p=>p.id===r.provinceId)&&int(r.scheduledTurn)&&r.scheduledTurn<=s.turn&&r.dueTurn===r.scheduledTurn+1&&Array.isArray(r.visits)&&Array.isArray(r.events);
 if(t.pending!==null&&!validRecord(t.pending))fail();
 if(t.history.some(r=>!validRecord(r)||!int(r.completedTurn)||r.completedTurn>s.turn||r.completedTurn<r.dueTurn||typeof r.message!=='string'||r.message.length>1000))fail();
 const records=[...(t.pending?[t.pending]:[]),...t.history];
 if(new Set(records.map(r=>r.id)).size!==records.length)fail();
 for(const r of records){
  r.encounters??=[]; // Old journeys already in progress retain their original event-free route.
  if(r.visits.length>INCOGNITO_PLACES.length||new Set(r.visits).size!==r.visits.length||r.visits.some(id=>!INCOGNITO_PLACES.some(p=>p.id===id))||r.events.length>20)fail();
  if(typeof r.ended!=='boolean'||!r.visitCounts||Object.keys(r.visitCounts).some(id=>!r.visits.includes(id)||!int(r.visitCounts[id])||r.visitCounts[id]>1000)||r.visits.some(id=>!int(r.visitCounts[id])))fail();
  if(r.startedTurn!==undefined){
   if(!int(r.startedTurn)||r.startedTurn<r.dueTurn||r.startedTurn>s.turn||!Number.isInteger(r.startedPhase)||r.startedPhase<0||r.startedPhase>5||r.returnTurn!==(r.kind==='tour'?(Math.floor((r.startedTurn-1)/3)+1)*3+1:r.startedTurn)||!r.reward)fail();
   const a=r.reward;if(a.treasury!==TRAVEL_RULES[r.kind].treasuryCost||!Number.isInteger(a.happiness)||a.happiness<0||a.happiness>20||!Number.isInteger(a.life)||a.life<0||a.life>(r.kind==='tour'?10:18)||!Number.isInteger(a.health)||a.health< -20||a.health>0||!Number.isInteger(a.loyalty)||a.loyalty<0||a.loyalty>2)fail();
  }else if(r.visits.length||r.events.length||r.ended||r.reward!==undefined||r.returnTurn!==undefined)fail();
  if(r.completedTurn!==undefined&&(r.startedTurn===undefined||r.completedTurn<r.startedTurn))fail();
  if(r.events.some(e=>!e||typeof e.title!=='string'||e.title.length>100||typeof e.text!=='string'||e.text.length>1000||!r.visits.includes(e.placeId)))fail();
 }
 validateTourEvents(s);
 return s;
}
