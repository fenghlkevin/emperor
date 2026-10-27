import {balanced} from './development-balance.mjs';
import {treasuryShortage} from './action-feedback.mjs';
import {admittedPopulation} from './city-capacity.mjs';
import {refreshOfficialProduction} from './official-production.mjs';
import {centralPolicy} from './state-development.mjs';
import {changeWelfare} from './building-effects.mjs';
import {initializeFinance} from './finance.mjs';
import {postTreasury} from './finance.mjs';
import {officeRegister} from './personnel.mjs';
import {createDiplomacy,initializeRites} from './diplomacy.mjs';
import {PRISON_PERSONALITIES} from './personality-rules.mjs';
import {HISTORICAL_PEOPLE} from './historical-people.mjs';
export {PRISON_PERSONALITIES};
const historicalCharacters=new Map(HISTORICAL_PEOPLE.map(p=>[p.id,p]));
export function prisonLoyaltyDelta(o){const rule=PRISON_PERSONALITIES[o.personality];return rule.delta>0?Math.max(0,Math.min(rule.delta,rule.ceiling-o.loyalty)):Math.max(rule.delta,-o.loyalty)||0;}
export const JUSTICE_TABS=[['investigate','调查经费'],['amnesty','特赦'],['prison','天牢']];
export function initializeJustice(d){
 if(!d||!Array.isArray(d.provinces))return d;
 if(!d.justice){const offices=officeRegister(d);d.justice={nextId:1,funding:0,lastTurn:0,lastAmnesty:0,history:[],officials:offices.map((o,i)=>({id:o.id,name:o.id==='justice-deputy'?'周慎言':['沈','陆','顾','韩','许','张','李'][i%7]+['文远','怀安','守正','明德','景行'][i%5],office:o.name,provinceId:o.provinceId,loyalty:o.id==='justice-deputy'?65:30+(i*17)%66,status:'serving',discovered:false,plotTurn:null}))};}
 // Upgrade legacy saves once; subsequent dismissal, appointment or death stays intact.
 if(!d.justice.justiceDeputyVersion){
  if(!d.justice.officials.some(o=>o.id==='justice-deputy'||o.positionId==='justice-deputy'))d.justice.officials.push({id:'justice-deputy',name:'周慎言',office:'刑部侍郎',provinceId:null,loyalty:65,status:'serving',discovered:false,plotTurn:null});
  d.justice.justiceDeputyVersion=1;
 }
 for(const o of d.justice.officials??[]){
  const historical=historicalCharacters.get(o.id.replace(/^recruit-/,''));
  if(historical&&o.personalityVersion!==historical.personalityVersion){for(const key of ['personality','characterTraits','personalityBasis','personalityEvidence','personalityMethod','personalitySource','personalityVersion'])o[key]=structuredClone(historical[key]);}

  // Complete legacy and initial officials once, so every view and simulation
  // reads the same persisted attributes. Existing values (including zero) win.
  for(const key of ['intelligence','martial','leadership','politics','integrity','age','experience']){
   if(o[key]!==undefined&&o[key]!==null)continue;
   const sourceKey=key==='age'?'initialAge':key==='experience'?'initialExperience':key;
   const generated=key==='age'?25+Math.floor(plotRoll(o.id+':age',0)*31):key==='experience'?Math.floor(plotRoll(o.id+':experience',0)*51):30+Math.floor(plotRoll(o.id+':'+key,0)*61);
   o[key]=historical?.[sourceKey]??generated;
  }
  if(!Object.hasOwn(o,'personality'))o.personality=Object.keys(PRISON_PERSONALITIES)[Math.floor(plotRoll(o.id,0)*4)];
  if(!Object.hasOwn(o,'prison'))o.prison=o.status==='imprisoned'?{admittedTurn:Math.max(1,d.justice.lastTurn),lastSettledTurn:Math.max(1,d.justice.lastTurn),servedTurns:0,lastDelta:0,totalDelta:0,lastReason:'旧档囚臣，自本次载入后开始记录'}:null;
 }
 return d;
}
export function validateJustice(d){const j=d.justice;if(!j||!Number.isSafeInteger(j.nextId)||j.nextId<1||!Number.isSafeInteger(j.funding)||j.funding<0||j.funding>10000||!Number.isSafeInteger(j.lastTurn)||j.lastTurn<0||!Number.isSafeInteger(j.lastAmnesty)||j.lastAmnesty<0||!Array.isArray(j.history)||j.history.length>100||j.history.some(x=>typeof x!=='string'||x.length>300)||!Array.isArray(j.officials)||new Set(j.officials.map(o=>o.id)).size!==j.officials.length)throw Error('刑部存档无效');for(const o of j.officials)if(typeof o.id!=='string'||typeof o.name!=='string'||!o.name||typeof o.office!=='string'||(o.provinceId!==null&&!d.provinces.some(p=>p.id===o.provinceId))||!Number.isInteger(o.loyalty)||o.loyalty<0||o.loyalty>100||!['serving','imprisoned','executed','rebel','released','retired','deceased'].includes(o.status)||typeof o.discovered!=='boolean'||(o.discovered&&(!Number.isSafeInteger(o.discoveredTurn)||o.discoveredTurn<1))||(o.plotTurn!==null&&(!Number.isSafeInteger(o.plotTurn)||o.plotTurn<1)))throw Error('官员存档无效');
 if(j.amnestyUses&&(!Number.isSafeInteger(j.amnestyUses.year)||j.amnestyUses.year<0||!Number.isSafeInteger(j.amnestyUses.count)||j.amnestyUses.count<1||j.amnestyUses.count>3||j.amnestyUses.year!==Math.floor((j.lastAmnesty-1)/36)))throw Error('特赦次数记录无效');
 for(const o of j.officials){if(o.caseDismissed!==undefined&&typeof o.caseDismissed!=='boolean')throw Error('案件批复无效');if(!Object.hasOwn(PRISON_PERSONALITIES,o.personality))throw Error('官员性格无效');const p=o.prison;if(p===null){if(o.status==='imprisoned')throw Error('在押记录缺失');continue;}if(!p||!Number.isSafeInteger(p.admittedTurn)||p.admittedTurn<1||!Number.isSafeInteger(p.lastSettledTurn)||p.lastSettledTurn<p.admittedTurn||!Number.isSafeInteger(p.servedTurns)||p.servedTurns<0||!Number.isInteger(p.lastDelta)||Math.abs(p.lastDelta)>3||!Number.isInteger(p.totalDelta)||Math.abs(p.totalDelta)>100||typeof p.lastReason!=='string'||p.lastReason.length>100)throw Error('服刑记录无效');}
}
function log(j,text){j.history.unshift(text);j.history=j.history.slice(0,100);}
function investigate(d,turn){const j=d.justice;for(const o of j.officials){if(o.status==='serving'&&o.loyalty<Math.min(60,40+Math.floor((centralPolicy(d,'justice-minister').ability-50)/5))&&!o.discovered&&(!o.provinceId||d.provinces.some(p=>p.id===o.provinceId&&p.countryId===d.playerCountryId))){o.discovered=true;o.discoveredTurn=turn;log(j,`第${turn}旬：查出${o.office}${o.name}忠诚仅${o.loyalty}%，请尽快裁决。`);}}}
export function amnestyTerms(d,turn){
 const year=Math.floor((turn-1)/36),uses=d.justice.amnestyUses?.year===year?d.justice.amnestyUses.count:0;
 return {cost:Math.max(100,Math.ceil(d.provinces.filter(p=>p.countryId===d.playerCountryId).reduce((n,p)=>n+p.population.total,0)*.0001)),gain:Math.max(0,3-uses*2),year,uses,ready:!d.justice.lastAmnesty||turn-d.justice.lastAmnesty>=12};
}
export function executeJustice(state,c){const next=structuredClone(state),d=initializeJustice(next.domestic),j=d.justice,home=d.countries.find(x=>x.id===d.playerCountryId);if(c.id!==j.nextId)throw Error('政令已执行，请重新拟令');let message='';
 if(c.kind==='funding'){if(!Number.isSafeInteger(c.amount)||c.amount<0||c.amount>10000)throw Error('经费须为 0–10,000 两的整数');if(home.fiscal.treasury<c.amount)throw Error(treasuryShortage(c.amount,home.fiscal.treasury,'拨付调查经费'));postTreasury(d,home.id,{turn:state.turn,expense:c.amount,reason:'拨付调查经费',key:`justice:${c.id}`});j.funding=c.amount;if(c.amount)investigate(d,next.turn);message=c.amount?'经费已拨付，密查结果已呈报':'已停止暗中调查';}
 else if(c.kind==='amnesty'&&balanced(d)){if(j.lastAmnesty&&next.turn-j.lastAmnesty<12)throw Error('特赦后须间隔十二旬，避免反复扰乱地方秩序');const {year,uses,gain,cost}=amnestyTerms(d,next.turn),ps=d.provinces.filter(p=>p.countryId===home.id);postTreasury(d,home.id,{turn:next.turn,expense:cost,recurring:true,reason:'特赦复核与归籍费用',key:`justice:${c.id}`});for(const p of ps){changeWelfare(p,'loyalty',gain);changeWelfare(p,'security',-1);}j.amnestyUses={year,count:uses+1};j.lastAmnesty=next.turn;message=`特赦已颁布：实支${cost}两，各州民忠+${gain}、治安−1；同年反复特赦收益递减，不能消除苛税积怨。`; }
 else if(c.kind==='amnesty'){if(!d.provinces.some(p=>p.countryId===home.id&&admittedPopulation(p,1)))throw Error('各州已达人口超载上限，请先扩建或迁出人口');if(j.lastAmnesty===next.turn)throw Error('本旬已颁布特赦');let added=0;for(const p of d.provinces.filter(p=>p.countryId===home.id)){const n=admittedPopulation(p,Math.max(1,Math.floor(p.population.total*.005)));p.population.total+=n;changeWelfare(p,'security',-5);added+=n;}j.lastAmnesty=next.turn;message=`特赦已颁布：归籍人口增加${added}人，各州治安降低5（最低0）。`;}
 else if(c.kind==='reinstate'){const o=j.officials.find(o=>o.id===c.officialId);if(!o||o.status!=='imprisoned')throw Error('仅可重新启用在押官员');Object.assign(o,{status:'serving',positionId:null,office:'待命',provinceId:null,plotTurn:null,discovered:false,caseDismissed:false});delete o.discoveredTurn;message=`${o.name}已重新启用，出狱待命，由吏部另行任职`; }
 else if(c.kind==='dismiss'){const o=j.officials.find(o=>o.id===c.officialId);if(!o||o.status!=='serving'||!o.discovered||o.caseDismissed)throw Error('没有可批复的奏报');o.caseDismissed=true;message=`${o.office}${o.name}不予处理，仍留原任`; }
 else if(['imprison','execute','release'].includes(c.kind)){const o=j.officials.find(o=>o.id===c.officialId);if(!o)throw Error('官员不存在');if(c.kind==='release'){if(o.status!=='imprisoned')throw Error('该官员不在天牢');o.status='released';message=`${o.name}已释放为民，不再任职`;}else{if(!(o.status==='serving'&&o.discovered||c.kind==='execute'&&o.status==='imprisoned'))throw Error('仅可处置已查实官员或在押囚臣');if(c.kind==='execute'){next.dynasty.endingRecord??={version:1,executions:0,coverage:'partial',sinceTurn:next.turn};next.dynasty.endingRecord.executions++;}o.status=c.kind==='execute'?'executed':'imprisoned';o.plotTurn=null;if(c.kind==='imprison')o.prison={admittedTurn:next.turn,lastSettledTurn:next.turn,servedTurns:0,lastDelta:0,totalDelta:0,lastReason:'刚入天牢，下旬开始按性格结算'};message=`${o.office}${o.name}已${c.kind==='execute'?'处斩':'收押天牢'}，原职空缺`;}}
 else throw Error('未知刑部政令');j.nextId++;log(j,`第${next.turn}旬：${message}`);refreshOfficialProduction(d,next.turn);next.stats.treasury=home.fiscal.treasury;validateJustice(d);return {state:next,message};}
export function settleJustice(d,turn,random=null){const j=initializeJustice(d).justice;if(j.lastTurn>=turn)return;j.lastTurn=turn;const home=d.countries.find(c=>c.id===d.playerCountryId);
 for(const o of j.officials){if(o.status!=='imprisoned'||o.prison.lastSettledTurn>=turn)continue;const p=o.prison,delta=prisonLoyaltyDelta(o),rule=PRISON_PERSONALITIES[o.personality];o.loyalty+=delta;p.lastSettledTurn=turn;p.servedTurns++;p.lastDelta=delta;p.totalDelta+=delta;p.lastReason=delta===0?(rule.delta===0?rule.reason:'忠诚已达该性格的变化界限'):rule.reason;log(j,`第${turn}旬：囚臣${o.name}（${rule.name}）忠诚${delta>=0?'+':''}${delta}，现为${o.loyalty}%；${p.lastReason}。`);}
 if(j.funding){if(home.fiscal.treasury>=j.funding){postTreasury(d,home.id,{turn,expense:j.funding,recurring:true,reason:'每旬调查经费',key:`investigation:${turn}`});investigate(d,turn);}else{const needed=j.funding;j.funding=0;log(j,`第${turn}旬：${treasuryShortage(needed,home.fiscal.treasury,'本旬密查')}调查已自动停止。`);}}
 for(const o of j.officials){if(o.status!=='serving'||o.loyalty>=40||!o.provinceId)continue;const p=d.provinces.find(p=>p.id===o.provinceId);if(p.countryId!==home.id)continue;
 if(o.plotTurn!==null&&o.plotTurn<turn){if(o.discovered&&turn<=o.discoveredTurn+1)continue;
 const id='rebel-'+p.id,reb=structuredClone(home);Object.assign(reb,{id,name:p.name+'国',capital:p.name,relations:'hostile',provinceIds:[p.id],ledger:[]});reb.fiscal.treasury=0;reb.fiscal.grain=0;delete reb.grainAccounting;delete reb.foodSettledTurn;delete reb.foodSettlement;reb.fiscal.debt=0;delete reb.fiscal.accounting;
 // The capital remains the player's final stronghold.
 if(p.id===d.general.capitalProvinceId||p.id===d.centralArmy.sourceProvinceId||home.provinceIds.length<=1){o.status='rebel';log(j,`第${turn}旬：${o.name}在京谋反失败，已逃亡。`);continue;}
 home.provinceIds=home.provinceIds.filter(x=>x!==p.id);p.countryId=id;const oldRebel=d.countries.findIndex(c=>c.id===id);if(oldRebel>=0)d.countries[oldRebel]=reb;else d.countries.push(reb);initializeFinance(d);const rows=createDiplomacy(d.countries,home.id).filter(r=>r.countryIds.includes(id));for(const r of rows)if(r.countryIds.includes(home.id)){r.relation='hostile';r.friendship=0;}d.diplomacy=d.diplomacy.filter(r=>!r.countryIds.includes(id));d.diplomacy.push(...rows);initializeRites(d);for(const local of j.officials.filter(x=>x.provinceId===p.id&&x.status==='serving'))local.status='rebel';log(j,`第${turn}旬：${o.office}${o.name}叛乱，${p.name}独立为${reb.name}！`);
 }else if(o.plotTurn===null&&(random?random():plotRoll(o.id,turn))<(40-o.loyalty)/100){o.plotTurn=turn;log(j,`第${turn}旬：${p.name}传出异动，宜拨款密查。`);}}
}

function plotRoll(id,turn){let n=2166136261;for(const c of id+":"+turn)n=Math.imul(n^c.charCodeAt(0),16777619);n^=n>>>16;n=Math.imul(n,0x45d9f3b);n^=n>>>16;return (n>>>0)/4294967296;}
