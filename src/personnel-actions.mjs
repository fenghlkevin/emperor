import {examFee,difficultyRules} from './difficulty.mjs';
import {registerCardPerson,upgradeCardPerson,validateCardPeople} from './card-battle.mjs';
import {balanced} from './development-balance.mjs';
import {treasuryShortage} from './action-feedback.mjs';
import {spyBusy} from './espionage.mjs';
import {ensureOfficialGrowth,validateOfficialGrowth} from './official-growth.mjs';
import {configureHanlin,settleHanlin,cancelInvalidStudies,validateHanlin} from './hanlin.mjs';
import {examSelection} from './exam.mjs';
import {refreshOfficialProduction} from './official-production.mjs';
import {onLocalAppointment,updateLocalPolicy} from './local-autonomy.mjs';
import {initializeGovernance,settleGovernance} from './governance.mjs';
import {postTreasury} from './finance.mjs';
import {officeRegister} from './personnel.mjs';
import {HISTORICAL_PEOPLE} from './historical-people.mjs';
import {ACTIVE_HISTORICAL_PEOPLE,ABILITY_KEYS,RANDOM_ABILITY_CAPS,createExamCandidates} from './exam.mjs';
export const PERSONNEL_TABS=[['assign','官职调动'],['dismiss','官员外调'],['honor','封爵'],['delegate','地方委任'],['exam','制举'],['profiles','人物名册']];
export const NOBILITY=['无爵','男','子','伯','侯','公','王'];
export function initializePersonnel(d){d.personnel??={nextId:1,lastTurn:0,examTurn:null,candidates:[],delegations:[],history:[],retired:[]};
 initializeGovernance(d);
 const activeIds=new Set(ACTIVE_HISTORICAL_PEOPLE.map(p=>p.id));
 const hidden=o=>HISTORICAL_PEOPLE.some(p=>p.id===o.id?.replace(/^recruit-/,''))&&!activeIds.has(o.id?.replace(/^recruit-/,''));
 d.personnel.hiddenPeople??=[];
 for(const list of [d.personnel.candidates,d.justice?.officials??[]]){for(let i=list.length-1;i>=0;i--)if(hidden(list[i]))d.personnel.hiddenPeople.push(list.splice(i,1)[0]);}
 for(const person of [...d.personnel.candidates,...(d.justice?.officials??[])]){delete person.dimensionEvidence;delete person.ratingBasis;const source=HISTORICAL_PEOPLE.find(p=>p.id===person.id?.replace(/^recruit-/,''));if(source&&person.ratingVersion!==source.ratingVersion){for(const key of ['intelligence','martial','leadership','politics','integrity','tags','biography','source','sourceTitle','biographyStatus','ratingStatus','ratingMethod','ratingConfidence','designNote','designCaveats','personality','characterTraits','personalityBasis','personalityEvidence','personalityMethod','personalitySource','personalityVersion','ratingVersion'])if(!(person.growthVersion===1&&person[key]!=null&&['intelligence','martial','leadership','politics','integrity'].includes(key)))person[key]=structuredClone(source[key]);if(person.status===undefined){person.age=source.initialAge;person.loyalty=source.initialLoyalty;person.experience=source.initialExperience;}}}
 for(const person of [...d.personnel.candidates,...(d.justice?.officials??[])]){ensureOfficialGrowth(person);registerCardPerson(d,person);}
 return d;}
export const officeId=o=>o.positionId===undefined?o.id:o.positionId;
export function servingOfficials(d){return d.justice.officials.filter(o=>o.status==='serving'&&!spyBusy(d,o.id)&&(!o.provinceId||d.provinces.some(p=>p.id===o.provinceId&&p.countryId===d.playerCountryId)));}
function log(p,s){p.history.unshift(s);p.history=p.history.slice(0,100);}
export function executePersonnel(state,c){const next=structuredClone(state),d=initializePersonnel(next.domestic),p=d.personnel,home=d.countries.find(x=>x.id===d.playerCountryId);if(c.id!==p.nextId)throw Error('政令已执行，请重新拟令');let message='';if(d.war?.battle)throw Error('请先结束当前战斗，再调整官员与研习安排');const person=servingOfficials(d).find(o=>o.id===c.officialId);
 if(c.kind==='assign'){
 const office=officeRegister(d).find(o=>o.id===c.officeId);if(!person||!office)throw Error('请选择本国官员及有效职位');if(officeId(person)===office.id)throw Error('该官员已任此职');
 const incumbent=servingOfficials(d).find(o=>officeId(o)===office.id);if(incumbent){incumbent.positionId=null;incumbent.office='待命';incumbent.provinceId=null;incumbent.plotTurn=null;}
 Object.assign(person,{positionId:office.id,office:office.name,provinceId:office.provinceId,plotTurn:null});const loyaltyGain=!balanced(d)||person.lastAppointmentRewardTurn===undefined||state.turn-person.lastAppointmentRewardTurn>=36?5:0;person.loyalty=Math.min(100,person.loyalty+loyaltyGain);if(loyaltyGain)person.lastAppointmentRewardTurn=state.turn;if(office.provinceId)onLocalAppointment(d,d.provinces.find(p=>p.id===office.provinceId),office.id.endsWith('-governor')?'governor':'general');message=`${person.name}任${office.name}，忠诚提高${loyaltyGain}${incumbent?`；${incumbent.name}转为待命`:''}。`;
 }else if(c.kind==='dismiss'){
 if(!person)throw Error('请选择在朝官员');d.justice.officials=d.justice.officials.filter(o=>o.id!==person.id);p.retired.push(person.name);message=`${person.name}已外调，不再回中央任职。`;
 }else if(c.kind==='honor'){
 if(!person)throw Error('请选择在朝官员');if(!['rank','nobility'].includes(c.honor))throw Error('请选择加官或封爵');const key=c.honor==='rank'?'rank':'nobilityLevel',max=key==='rank'?9:6,level=person[key]??0;if(level>=max)throw Error('已达最高等级');const cost=(level+1)*100;if(home.fiscal.treasury<cost)throw Error(treasuryShortage(cost,home.fiscal.treasury,person.name+(c.honor==='rank'?'加官':'封爵')));postTreasury(d,home.id,{turn:state.turn,expense:cost,reason:'加官封爵',key:`personnel:${c.id}`});person[key]=level+1;person.loyalty=Math.min(100,person.loyalty+10);message=`${person.name}${key==='rank'?`晋为${10-person[key]}品`:`获封${NOBILITY[person[key]]}爵`}，忠诚提高10，赏银${cost}两。`;
 }else if(c.kind==='delegate'){
 if(!d.provinces.some(x=>x.id===c.provinceId&&x.countryId===d.playerCountryId)||typeof c.enabled!=='boolean')throw Error('委任设置无效');const city=d.provinces.find(x=>x.id===c.provinceId);if(city.localPolicy){city.localPolicy.civil=c.enabled;city.localPolicy.military=c.enabled;}p.delegations=p.delegations.filter(x=>x!==c.provinceId);if(c.enabled)p.delegations.push(c.provinceId);message=c.enabled?'已委任地方：每旬按缺粮、灾情、民生与产业需求治理，遵守全国预算及国库保留线。':'已收回地方委任。';
 }else if(c.kind==='localPolicy'){message=updateLocalPolicy(d,c);
 }else if(c.kind==='governanceBudget'){
 if(![c.reserve,c.budget].every(n=>Number.isSafeInteger(n)&&n>=0&&n<=1000000))throw Error('预算与保留线须为0至1000000两整数');
 Object.assign(d.governance,{reserve:c.reserve,budget:c.budget});message='全国治理预算与国库保留线已更新，下次自动治理生效';
 }else if(c.kind==='exam'){
 const fee=examFee(d);if(p.examTurn!==null)throw Error('制举正在筹备，下旬呈报');if(p.candidates.length)throw Error('请先录用或遣散本届候选');if(home.fiscal.treasury<fee)throw Error(treasuryShortage(fee,home.fiscal.treasury,'开科取士'));postTreasury(d,home.id,{turn:state.turn,expense:fee,reason:'全国制举',key:`personnel:${c.id}`});p.examTurn=next.turn+1;const e=examSelection(d,state.stats);message=`已诏令全国制举，按当前吏部任职预计下旬呈上${e.minCount}至${e.maxCount}名候选，名士概率${Math.round(e.historicalChance*100)}%，高能力新秀选拔概率${Math.round(e.highChance*1000)/10}%。揭榜时按在职官员核定。`;
 }else if(c.kind==='hire'){
 const i=p.candidates.findIndex(x=>x.id===c.candidateId);if(i<0)throw Error('候选已离开');const candidate=p.candidates.splice(i,1)[0];d.justice.officials.push({...candidate,id:`recruit-${candidate.id}`,positionId:null,office:'待命',provinceId:null,status:'serving',discovered:false,plotTurn:null,prison:null});message=`${candidate.name}已录用，可在官职调动中任职。`;
 }else if(['hanlin-enroll','hanlin-stop'].includes(c.kind)){message=configureHanlin(d,c,state.turn);
 }else if(c.kind==='clear'){p.candidates=[];message='本届未录用候选已遣散。';}else throw Error('未知吏部政令');
 cancelInvalidStudies(d,state.turn);
 p.nextId++;log(p,`第${next.turn}旬：${message}`);refreshOfficialProduction(d,next.turn);next.stats.treasury=home.fiscal.treasury;return {state:next,message};}
export function settlePersonnel(d,turn,random=Math.random,emperorStats=null){initializePersonnel(d);const p=d.personnel;if(p.lastTurn>=turn)return;p.lastTurn=turn;
 if(p.examTurn!==null&&p.examTurn<=turn){p.candidates=createExamCandidates(d,turn,random,emperorStats);for(const person of p.candidates)registerCardPerson(d,person);const count=p.candidates.length;p.examTurn=null;const e=examSelection(d,emperorStats);log(p,`第${turn}旬：制举揭榜，${count}名人才待选；吏部${e.source.name}额外${e.extra}名，名士概率${Math.round(e.historicalChance*100)}%，高能力新秀选拔概率${Math.round(e.highChance*1000)/10}%。`);}
 const home=d.countries.find(c=>c.id===d.playerCountryId);p.delegations=p.delegations.filter(id=>d.provinces.some(x=>x.id===id&&x.countryId===home.id));
 settleHanlin(d,turn);
 settleGovernance(d,turn);
 for(const person of [...p.candidates,...d.justice.officials])upgradeCardPerson(d,person,turn);
}
export function validatePersonnel(d,turn=Infinity){validateCardPeople(d);validateHanlin(d,turn);for(const person of [...d.personnel.candidates,...d.justice.officials])validateOfficialGrowth(person);const p=d.personnel;if(!p||!Number.isSafeInteger(p.nextId)||p.nextId<1||!Number.isSafeInteger(p.lastTurn)||p.lastTurn<0||!(p.examTurn===null||Number.isSafeInteger(p.examTurn)&&p.examTurn>0)||!Array.isArray(p.candidates)||p.candidates.length>difficultyRules(d).examMax+2||!Array.isArray(p.delegations)||new Set(p.delegations).size!==p.delegations.length||p.delegations.some(id=>!d.provinces.some(x=>x.id===id))||!Array.isArray(p.retired)||p.retired.some(x=>typeof x!=='string')||!Array.isArray(p.history)||p.history.length>100||p.history.some(x=>typeof x!=='string'))throw Error('吏部存档无效');for(const o of p.candidates){const source=ACTIVE_HISTORICAL_PEOPLE.find(x=>x.id===o.id);const generated=o.generated===true&&/^random-\d+-\d+$/.test(o.id)&&typeof o.name==='string'&&/^[\u3400-\u9fff]{2,4}$/.test(o.name)&&!HISTORICAL_PEOPLE.some(x=>x.name===o.name)&&ABILITY_KEYS.every(k=>Number.isInteger(o[k])&&o[k]>=0&&o[k]<=RANDOM_ABILITY_CAPS[k]);if((!generated&&(!source||source.name!==o.name))||!['age','loyalty','experience','intelligence','martial','integrity'].every(k=>Number.isInteger(o[k])&&o[k]>=0&&o[k]<=100))throw Error('制举候选无效');}if(new Set(p.candidates.map(o=>o.id)).size!==p.candidates.length)throw Error('制举候选重复');for(const o of d.justice.officials){if(o.lastAppointmentRewardTurn!==undefined&&(!Number.isSafeInteger(o.lastAppointmentRewardTurn)||o.lastAppointmentRewardTurn<1||o.lastAppointmentRewardTurn>turn))throw Error('调任嘉奖旬序无效');if(o.positionId!==undefined&&o.positionId!==null&&typeof o.positionId!=='string')throw Error('官职无效');for(const [key,max] of [['rank',9],['nobilityLevel',6]])if(o[key]!==undefined&&(!Number.isInteger(o[key])||o[key]<0||o[key]>max))throw Error('官阶爵位无效');}}
