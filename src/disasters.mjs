import {difficultyFactor} from './difficulty.mjs';
import {treasuryShortage} from './action-feedback.mjs';
import {postNationalGrain,nationalGrain,nationalCountry} from './national-resources.mjs';
import {postGrain} from './grain-finance.mjs';
import {welfareValue,changeWelfare,protectedGrainLoss} from './building-effects.mjs';
import {postTreasury} from './finance.mjs';
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
export const DISASTERS=[['flood','洪涝','天灾'],['drought','旱灾','天灾'],['landslide','山崩','天灾'],['epidemic','疫病','天灾'],['fire','失火','人祸'],['bandits','盗匪','人祸'],['riot','民乱','人祸']];
export const DISASTER_DURATIONS={flood:6,drought:9,landslide:4,epidemic:6,fire:2,bandits:4,riot:5};
export function activeDisaster(p,turn){return p.disaster&&p.disaster.startTurn<=turn&&turn<p.disaster.endTurn?p.disaster:null;}
export const RITUAL_COST=1200,RITUAL_DURATION=12;
export function initializeDisasters(d){if(!d||!Array.isArray(d.provinces))return d;d.disasters??={seed:184713,lastTurn:1,ritualUntil:0,lastRitualTurn:0,history:[]};for(const e of d.disasters.history||[])if(e.endTurn===undefined)e.endTurn=e.turn+(DISASTER_DURATIONS[e.kind]||3);
 for(const p of d.provinces){if(p.disaster===undefined){const e=d.disasters.history?.find(e=>e.provinceId===p.id&&e.endTurn>d.disasters.lastTurn);p.disaster=e?{kind:e.kind,startTurn:e.turn,endTurn:e.endTurn}:null;}}return d;}

export function quoteDisasterSubsidy(p,turn,amount){
 const a=activeDisaster(p,turn),minimum=Math.max(1,Math.ceil(p.population.total*.01));
 if(!a)return null;
 const before=a.endTurn-turn,eligible=amount>=minimum&&a.lastReliefTurn!==turn&&before>1;
 return {before,after:eligible?before-1:before,shortened:eligible?1:0,minimum,endBefore:a.endTurn,endAfter:eligible?a.endTurn-1:a.endTurn};
}
export function applyDisasterSubsidy(d,p,turn,quote){
 if(!quote?.shortened)return;
 const a=p.disaster;a.endTurn=quote.endAfter;a.reliefTurns=(a.reliefTurns??0)+1;a.lastReliefTurn=turn;
 const history=d.disasters.history.find(e=>e.provinceId===p.id&&e.turn===a.startTurn&&e.kind===a.kind);
 if(history){history.endTurn=a.endTurn;history.reliefTurns=a.reliefTurns;history.lastReliefTurn=turn;}
}
function validDisasterPeriod(a,start){const shortened=a.reliefTurns??0;return Number.isSafeInteger(shortened)&&shortened>=0&&shortened<DISASTER_DURATIONS[a.kind]&&a.endTurn===start+DISASTER_DURATIONS[a.kind]-shortened&&(shortened===0?a.lastReliefTurn===undefined:Number.isSafeInteger(a.lastReliefTurn)&&a.lastReliefTurn>=start&&a.lastReliefTurn<a.endTurn);}

export function disasterRisk(d,p,turn){
 const month=Math.floor((turn-1)%36/3)+1,wet=month>=5&&month<=8,dry=month>=7&&month<=9;
 const density=clamp(p.population.total/p.area,0,1),poverty=1-p.status.livingStandard/100,unrest=1-welfareValue(p,'stability',turn)/100,insecurity=1-welfareValue(p,'security',turn)/100;
 const weights={flood:(p.terrain==='河海型'?.016:.003)*(wet?1.8:1),drought:(p.terrain==='平原型'?.012:.005)*(dry?1.6:1),landslide:p.terrain==='高山型'?.013:p.terrain==='丘陵型'?.007:.001,epidemic:.003+density*.012+(1-welfareValue(p,'fitness',turn)/100)*.008,fire:.003+density*.01+poverty*.003,bandits:.002+insecurity*.016+poverty*.008,riot:.001+unrest*.018+(1-welfareValue(p,'loyalty',turn)/100)*.01+poverty*.006};
 const protectedByRitual=p.countryId===d.playerCountryId&&turn<=d.disasters.ritualUntil;
 const factor=activeDisaster(p,turn)?0:protectedByRitual?.6:1;
 const risks=DISASTERS.map(([id,name,category])=>({id,name,category,probability:weights[id]*factor*difficultyFactor(p,'disasterRiskFactor')}));
 return {risks,natural:risks.filter(r=>r.category==='天灾').reduce((n,r)=>n+r.probability,0),human:risks.filter(r=>r.category==='人祸').reduce((n,r)=>n+r.probability,0),total:risks.reduce((n,r)=>n+r.probability,0),protectedByRitual};
}
export function holdRitual(state){const next=structuredClone(state),d=initializeDisasters(next.domestic),r=d.disasters,c=d.countries.find(c=>c.id===d.playerCountryId);if(r.ritualUntil>state.turn)throw Error('祭祀祈福仍在生效，无需重复举办');if(c.fiscal.treasury<RITUAL_COST)throw Error(treasuryShortage(RITUAL_COST,c.fiscal.treasury,'举行祭祀'));postTreasury(d,c.id,{turn:state.turn,expense:RITUAL_COST,reason:'祭祀祈福',key:`ritual:${state.turn}`});next.stats.treasury=c.fiscal.treasury;r.lastRitualTurn=state.turn;r.ritualUntil=state.turn+RITUAL_DURATION;return {state:next,message:`祭祀已举行，支出 1,200 两；未来 ${RITUAL_DURATION} 旬本国各城天灾、人祸概率降低 40%。`};}
function roll(seed,id,turn){let hash=(seed^turn)>>>0;for(const c of id)hash=Math.imul(hash^c.charCodeAt(0),16777619)>>>0;hash^=hash>>>16;hash=Math.imul(hash,0x7feb352d);hash^=hash>>>15;hash=Math.imul(hash,0x846ca68b);return ((hash^(hash>>>16))>>>0)/4294967296;}
export function settleDisasters(d,turn){initializeDisasters(d);const system=d.disasters;if(system.lastTurn>=turn)return;for(const p of d.provinces){if(p.disaster&&turn>=p.disaster.endTurn){p.disaster=null;if(p.status.situation==='disaster')p.status.situation=p.welfare.stability<30?'unrest':'stable';}if(activeDisaster(p,turn))continue;const risk=disasterRisk(d,p,turn),value=roll(system.seed,p.id,turn);let cumulative=0;const event=risk.risks.find(r=>{cumulative+=r.probability;return value<cumulative;});if(!event)continue;
 const share=p.population.total/d.provinces.filter(x=>x.countryId===p.countryId).reduce((n,x)=>n+x.population.total,0),rawGrainLoss=Math.min(nationalGrain(d,p.countryId),Math.round(nationalGrain(d,p.countryId)*share*(event.category==='天灾'?.08:.03)*difficultyFactor(p,'disasterLossFactor'))),grainLoss=protectedGrainLoss(p,rawGrainLoss,turn),cashLoss=Math.round(nationalCountry(d,p.countryId).fiscal.treasury*share*(event.category==='人祸'?.1:.04)*difficultyFactor(p,'disasterLossFactor'));postNationalGrain(d,p.countryId,{turn,expense:grainLoss,category:'disaster',reason:event.id+'灾损',key:`disaster:${turn}:${p.id}`});postTreasury(d,p.countryId,{turn,expense:cashLoss,category:'oneOff',reason:p.name+event.name+'灾损',key:`disaster:${turn}:${p.id}`});changeWelfare(p,'stability',-Math.ceil(4*difficultyFactor(p,'disasterLossFactor')));if(event.id==='riot'||event.id==='bandits')changeWelfare(p,'security',-Math.ceil(3*difficultyFactor(p,'disasterLossFactor')));p.disaster={kind:event.id,startTurn:turn,endTurn:turn+DISASTER_DURATIONS[event.id]};if(p.status.situation!=='war')p.status.situation='disaster';system.history.unshift({turn,endTurn:p.disaster.endTurn,provinceId:p.id,kind:event.id,grainLoss,rawGrainLoss,grainSaved:rawGrainLoss-grainLoss,cashLoss});
 }system.lastTurn=turn;system.history=system.history.slice(0,200);}
export function validateDisasters(d){validateGrainProtectionHistory(d);for(const p of d.provinces){const a=p.disaster;if(a!==null&&(!a||!Object.hasOwn(DISASTER_DURATIONS,a.kind)||!Number.isSafeInteger(a.startTurn)||a.startTurn<1||!validDisasterPeriod(a,a.startTurn)))throw Error('灾害周期无效');}const r=d.disasters;if(!r||!['seed','lastTurn','ritualUntil','lastRitualTurn'].every(k=>Number.isSafeInteger(r[k])&&r[k]>=0)||r.seed>4294967295||!Array.isArray(r.history)||r.history.length>200)throw Error('祭祀灾害记录无效');for(const e of r.history)if(!d.provinces.some(p=>p.id===e.provinceId)||!DISASTERS.some(([id])=>id===e.kind)||!['turn','grainLoss','cashLoss'].every(k=>Number.isSafeInteger(e[k])&&e[k]>=0)||e.turn<1||!validDisasterPeriod(e,e.turn))throw Error('灾情记录无效');}

export function validateGrainProtectionHistory(d){for(const e of d.disasters.history)if(e.rawGrainLoss!==undefined||e.grainSaved!==undefined){if(!Number.isSafeInteger(e.rawGrainLoss)||!Number.isSafeInteger(e.grainSaved)||e.grainSaved<0||e.rawGrainLoss!==e.grainLoss+e.grainSaved)throw Error('粮仓灾损记录无效');}}
