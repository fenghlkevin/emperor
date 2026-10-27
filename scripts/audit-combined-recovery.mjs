import {recoveryAdvice} from '../src/recovery-advice.mjs';
// Fresh-player combined crises. Money, people, food and disasters are never injected.
import {mkdirSync,writeFileSync,readFileSync,readdirSync} from 'node:fs';
import {resolve} from 'node:path';
import {createHash} from 'node:crypto';
import {createPlayableGame,advance,validateSave} from '../src/game.mjs';
import {executeKitCommand,quoteKitCommand,worldKitSummary,worldKitDepot} from '../src/troop-kit-world.mjs';
import {executeRevenue} from '../src/revenue.mjs';
import {executeGeneral} from '../src/general.mjs';
import {countrySummary} from '../src/domestic.mjs';
import {quoteArmyRecovery,executeArmyRecovery,recoveryStatus,recoveryPauseReason,recoveryGovernanceBudget} from '../src/army-recovery.mjs';
import {beginWar,finishWar,generals,borderingCountries} from '../src/war.mjs';
import {automaticKitFormation} from '../src/kit-formation.mjs';
import {actBattle,aiAction} from '../src/battle.mjs';
import {courtBlock,spendEnergy,palaceAction} from '../src/emperor.mjs';
import {autoDefense} from '../src/foreign-strategy.mjs';
import {resolveCapital,refugeProvinces} from '../src/capital-crisis.mjs';
const arg=(key,fallback)=>process.argv.find(a=>a.startsWith('--'+key+'='))?.slice(key.length+3)??fallback;
const output=resolve(arg('output-dir','outputs/player-combined-recovery-2026-10-22/exploration')),seed=Number(arg('seed',1)),turns=Number(arg('turns',540)),only=arg('mode','');mkdirSync(output,{recursive:true});
const modes=['paused-withheld','paused-cancelled','deficit-withheld','deficit-cancelled','deficit-guided','deficit-guided-early','debt-repeat','debt-overlap','debt-overlap-repeat','debt-overlap-training','lowcash-repeat'];
if(only&&!modes.includes(only))throw Error('Unknown mode '+only);
const report={seed,turns,sourceFingerprint:createHash('sha256').update(readdirSync('src').filter(f=>f.endsWith('.mjs')).sort().map(f=>readFileSync('src/'+f)).join('\n')).digest('hex'),methodology:'Fresh factory and full world. Only paid public orders; actual battles with AI tactics, court costs and natural multi-disaster overlap. No resource injection. Relief, recurring debt interest and principal remain automatic. Three garden visits and sleep each turn; daily JSON reload.',scenarios:[],errors:[]};
for(const mode of modes.filter(m=>!only||m===only)){
 let rng=seed;const random=Math.random;Math.random=()=>((rng=Math.imul(rng,1664525)+1013904223>>>0)/4294967296);
 let s=createPlayableGame('战灾债务组合复测');s.createdAt='2026-10-21T00:00:00.000Z';s.domestic.disasters.seed=seed;
 const home=()=>s.domestic.countries.find(c=>c.id===s.domestic.playerCountryId);
 const metrics=()=>{const q=countrySummary(s.domestic,undefined,s.turn),p=s.domestic.armyRecovery?.plan,status=recoveryStatus(s.domestic);return {turn:s.turn,cash:home().fiscal.treasury,debt:home().fiscal.debt,net:q.net,grain:home().fiscal.grain,industrialArea:q.provinces.reduce((n,p)=>n+Object.values(p.economy).reduce((a,e)=>a+e.developedArea,0),0),health:s.stats.health,happiness:s.stats.happiness,living:q.livingStandard,provinces:q.provinces.length,soldiers:s.domestic.centralArmy.soldiers,training:s.domestic.centralArmy.training,foodShortfall:home().foodSettlement?.shortfall??0,disasters:q.provinces.filter(p=>p.disaster&&p.disaster.endTurn>s.turn).map(p=>({id:p.id,...p.disaster})),governance:{budget:s.domestic.governance.budget,turnBudget:s.domestic.governance.turnBudget,spent:s.domestic.governance.spent,effective:recoveryGovernanceBudget(s.domestic,s.domestic.governance.budget,s.turn)},pause:recoveryPauseReason(s.domestic,s.turn),plan:p?structuredClone(p):null,gaps:status?.gaps??null};};
 const row={mode,seed,initial:metrics(),orders:[],battles:[],rows:[],steps:0};
 function order(label,fn){if(courtBlock(s))throw Error(courtBlock(s));const before=metrics();s=fn(s).state;spendEnergy(s,true);row.orders.push({label,before,after:metrics()});}
 const tax=rate=>order('tax '+rate,x=>executeRevenue(x,{id:x.domestic.fiscalActions.nextId,kind:'tax',rates:Object.fromEntries(home().provinceIds.map(id=>[id,rate]))}));
 function authorize(){if(!s.domestic.armyRecovery?.offer||s.domestic.armyRecovery.plan?.active)return;const q=quoteArmyRecovery(s);order('authorize',x=>executeArmyRecovery(x,{id:x.domestic.armyRecovery.nextId,kind:'start',cap:q.suggestedCap,train:true,draft:true,debtRecovery:mode.startsWith('deficit')||!mode.endsWith('withheld')&&!mode.endsWith('cancelled')}));}
 function deplete(){const available=Math.max(0,home().fiscal.treasury-1800);let lo=0,hi=100000;while(lo<hi){const mid=Math.ceil((lo+hi)/2);if(quoteKitCommand(s,{kind:'purchase',sourceId:'hebei',quantities:{infantry:mid}}).cost<=available)lo=mid;else hi=mid-1;}if(lo)order('paid equipment in local depot',x=>executeKitCommand(x,{id:x.domestic.troopKits.nextId,kind:'purchase',sourceId:'hebei',quantities:{infantry:lo}}));}
 function fight(){const before=metrics(),plan=automaticKitFormation(worldKitSummary(s.domestic).find(r=>r.id==='central'),generals(s.domestic));if(courtBlock(s))throw Error(courtBlock(s));s=beginWar(s,{id:s.domestic.war.nextId,kind:'war',kitVersion:1,targetId:borderingCountries(s.domestic)[0].id,...plan});spendEnergy(s,true);let b=s.domestic.war.battle;for(let i=0;i<15000&&!b.result;i++)b=actBattle(b,aiAction(b));if(!b.result)throw Error('Battle timeout');s.domestic.war.battle=b;const result=finishWar(s);s=result.state;if(!courtBlock(s))spendEnergy(s,true);row.battles.push({before,after:metrics(),receipt:result.receipt});authorize();}
 try{
  if(mode==='lowcash-repeat'){deplete();fight();}else tax(0);
  for(let i=0;i<turns;i++){
   if(s.domestic.strategy.pending?.defender===s.domestic.playerCountryId){s=autoDefense(s).state;const charged=s.stats.life>0&&!s.domestic.collapse?.pending&&!courtBlock(s);if(charged)spendEnergy(s,true);row.orders.push({label:'actual foreign defense',after:metrics(),courtCharged:charged});}
   if(s.domestic.collapse?.pending)s=resolveCapital(s,{kind:'relocate',provinceId:refugeProvinces(s)[0]?.id}).state;
   if(s.domestic.collapse?.ended||s.stats.life===0)throw Error('Dynasty ended before completion');
   if(i===36&&mode!=='lowcash-repeat'){
    tax(mode==='deficit-guided-early'?24:mode.startsWith('deficit')?10:20);if(mode==='deficit-guided-early')row.guidance={turn:s.turn,advice:recoveryAdvice(s),kind:'Act on the first fiscal warning: temporary 24%, then return to 20% after a stable forecast and buffers'};
    if(!mode.includes('overlap')){fight();if(mode.endsWith('cancelled'))order('cancel paused plan',x=>executeArmyRecovery(x,{id:x.domestic.armyRecovery.nextId,kind:'cancel'}));}
   }
   if(i===72&&mode.startsWith('deficit')&&mode!=='deficit-guided-early'){tax(mode==='deficit-guided'?24:20);if(mode==='deficit-guided')row.guidance={turn:s.turn,advice:recoveryAdvice(s),kind:'Temporary 24% tax, then return to 20% after stable positive 20% forecast and cash/food buffers'};}
   if(mode.startsWith('deficit-guided')&&i>=(mode.endsWith('early')?72:108)&&!row.guidanceReturn){
    const advice=recoveryAdvice(s),forecast=advice.taxOptions.find(q=>q.rate===20).net;
    row.safeTaxTurns=forecast>=500&&home().fiscal.treasury>=12000&&home().fiscal.grain>=advice.foodNeed*6&&s.domestic.centralArmy.soldiers>=300?(row.safeTaxTurns??0)+1:0;
    if(row.safeTaxTurns>=6&&!s.domestic.strategy.pending){tax(20);row.guidanceReturn=metrics();}
   }
   if(i>=36&&mode.includes('overlap')&&!row.overlap&&metrics().disasters.filter(d=>['flood','drought','landslide','epidemic'].includes(d.kind)).length>=3&&s.domestic.centralArmy.soldiers>=300&&!s.domestic.strategy.pending){row.overlap=metrics();deplete();fight();}
   const p=s.domestic.armyRecovery?.plan;
   if(mode.includes('repeat')&&row.battles.length&&row.battles.length<3&&s.domestic.centralArmy.soldiers>=300&&s.domestic.centralArmy.training>=40&&s.turn-row.battles.at(-1).after.turn>=6&&!s.domestic.strategy.pending)fight();
   if(mode.endsWith('training')&&row.battles.length&&s.domestic.centralArmy.soldiers>=300&&!s.domestic.general.ongoing&&!s.domestic.strategy.pending)order('paid ongoing training',x=>executeGeneral(x,{id:x.domestic.general.nextId,kind:'ongoing',enabled:true}));
   if(p?.active&&p.waitingCap&&!s.domestic.strategy.pending){const q=quoteArmyRecovery(s);order('explicit extension',x=>executeArmyRecovery(x,{id:x.domestic.armyRecovery.nextId,kind:'extend',amount:Math.max(1,q.suggestedCap-(p.cap-p.spent))}));}
   if(row.battles.length&&(!mode.endsWith('cancelled')||mode.startsWith('deficit')&&i>=72||!home().fiscal.debt))authorize();
   for(const [phase,kind]of [[1,'view'],[1,'view'],[1,'view'],[2,'sleep']]){s.phase=phase;const d=s.domestic;s=palaceAction({...s,domestic:undefined},kind).state;s.domestic=d;}
   advance(s);s=validateSave(JSON.parse(JSON.stringify(s)));row.rows.push(metrics());row.steps++;
  }
  row.final=metrics();row.firstCompletion=row.rows.find(r=>r.plan?.completedTurn)?.plan.completedTurn??null;row.firstBasic=row.rows.find(r=>r.turn>(row.battles[0]?.after.turn??0)&&r.soldiers>=300&&r.training>=40)?.turn??null;row.observations={pausedRestrictionTurns:row.rows.filter(r=>r.plan?.active&&r.pause&&r.governance.turnBudget<r.governance.budget).length,zeroCentralTurns:row.rows.filter(r=>r.turn>(row.battles[0]?.after.turn??0)&&!r.soldiers).length,foodShortfallTurns:row.rows.filter(r=>r.foodShortfall>0).length};
  if(mode.includes('overlap')&&!row.overlap)throw Error('Natural overlap not observed');
  if(mode.includes('repeat')&&row.battles.length!==3)throw Error('Three actual wars not covered');
 }catch(e){row.error={turn:s.turn,message:e.stack};report.errors.push({mode,...row.error});}
 finally{Math.random=random;report.scenarios.push(row);writeFileSync(resolve(output,`combined-${seed}${only?'-'+only:''}.json`),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({mode,seed,steps:row.steps,battles:row.battles.length,observations:row.observations,final:row.final,error:row.error}));}
}
if(report.errors.length)process.exitCode=1;
