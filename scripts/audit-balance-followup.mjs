// Additional player-command investigations; no injected money, troops or disasters.
import {mkdirSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {createPlayableGame,advance,validateSave} from '../src/game.mjs';
import {executePersonnel} from '../src/personnel-actions.mjs';
import {executeRevenue} from '../src/revenue.mjs';
import {executeKitCommand,quoteKitCommand,worldKitSummary,worldKitDepot} from '../src/troop-kit-world.mjs';
import {industrialProcurement} from '../src/supply-economy.mjs';
import {countrySummary} from '../src/domestic.mjs';
import {spendEnergy,palaceAction,courtBlock} from '../src/emperor.mjs';
import {beginWar,finishWar,generals,borderingCountries} from '../src/war.mjs';
import {automaticKitFormation} from '../src/kit-formation.mjs';
import {actBattle,aiAction} from '../src/battle.mjs';
import {quoteArmyRecovery,executeArmyRecovery} from '../src/army-recovery.mjs';
import {autoDefense} from '../src/foreign-strategy.mjs';
import {resolveCapital,refugeProvinces} from '../src/capital-crisis.mjs';
const output=resolve(process.argv.find(a=>a.startsWith('--output-dir='))?.slice(13)??'outputs/balance-complete-recheck-2026-10-22/followups');mkdirSync(output,{recursive:true});
const mode=process.argv.find(a=>a.startsWith('--mode='))?.slice(7)??'delegated-equipment',seed=Number(process.argv.find(a=>a.startsWith('--seed='))?.slice(7)??1);
let rng=seed;Math.random=()=>((rng=Math.imul(rng,1664525)+1013904223>>>0)/4294967296);
let s=createPlayableGame('补充平衡检查');s.createdAt='2026-10-21T00:00:00.000Z';s.domestic.disasters.seed=seed;
const home=()=>s.domestic.countries.find(c=>c.id===s.domestic.playerCountryId),metrics=()=>{const q=countrySummary(s.domestic,undefined,s.turn);return{turn:s.turn,cash:home().fiscal.treasury,debt:home().fiscal.debt,net:q.net,soldiers:s.domestic.centralArmy.soldiers,training:s.domestic.centralArmy.training,plan:structuredClone(s.domestic.armyRecovery?.plan??null),stock:structuredClone(worldKitDepot(s.domestic,'central').stock)};};
const report={mode,seed,initial:metrics(),methodology:'Fresh factory, legal paid commands and actual battles, full world and natural disasters. No resource injection. Extra emergency recruits use actual existing equipment and available cash.',orders:[],rows:[]};
function order(label,fn){if(courtBlock(s))throw Error(courtBlock(s));const before=metrics();s=fn(s).state;spendEnergy(s,true);report.orders.push({label,before,after:metrics()});}
const personnel=c=>order(c.kind,x=>executePersonnel(x,{id:x.domestic.personnel.nextId,...c}));
const tax=rate=>order('tax '+rate,x=>executeRevenue(x,{id:x.domestic.fiscalActions.nextId,kind:'tax',rates:Object.fromEntries(home().provinceIds.map(id=>[id,rate]))}));
function step(){if(s.domestic.strategy.pending?.defender===s.domestic.playerCountryId){s=autoDefense(s).state;if(s.stats.life>0&&!s.domestic.collapse?.pending&&!courtBlock(s))spendEnergy(s,true);}if(s.domestic.collapse?.pending)s=resolveCapital(s,{kind:'relocate',provinceId:refugeProvinces(s)[0]?.id}).state;for(const [phase,kind]of[[1,'view'],[1,'view'],[1,'view'],[2,'sleep']]){s.phase=phase;const d=s.domestic;s=palaceAction({...s,domestic:undefined},kind).state;s.domestic=d;}advance(s);if(s.turn%36===1)s=validateSave(JSON.parse(JSON.stringify(s)));}
if(mode==='appointment-reward'){
 const officialId='henan-governor';
 personnel({kind:'assign',officialId,officeId:'hebei-governor'});
 personnel({kind:'assign',officialId,officeId:'henan-governor'});
 report.sameYear=structuredClone(s.domestic.justice.officials.find(o=>o.id===officialId));
 for(let i=0;i<36;i++)step();
 report.beforeNextYear=structuredClone(s.domestic.justice.officials.find(o=>o.id===officialId));
 personnel({kind:'assign',officialId,officeId:'hebei-governor'});
 report.afterNextYear=structuredClone(s.domestic.justice.officials.find(o=>o.id===officialId));
}else if(mode==='tax22'||mode==='tax24'){
 tax(Number(mode.slice(3)));
 for(let i=0;i<720;i++){step();if((i+1)%36===0)report.rows.push(metrics());}
}else if(mode==='delegated-equipment'){
 for(const p of countrySummary(s.domestic).provinces)personnel({kind:'localPolicy',provinceId:p.id,civil:false,military:p.id==='hebei',budget:1400,priority:'security',locks:[]});
 order('recruit 100 hebei',x=>executeKitCommand(x,{id:x.domestic.troopKits.nextId,kind:'recruit',sourceId:'hebei',amount:100}));
 for(let i=0;i<12;i++){step();const ledger=home().ledger.find(r=>r.turn===s.turn);report.rows.push({turn:s.turn,discount:industrialProcurement(s.domestic),governance:structuredClone(s.domestic.governance),entries:structuredClone(ledger.entries),kits:structuredClone(s.domestic.troopKits.history.filter(r=>r.turn===s.turn))});}
}else{
 tax(0);
 for(let i=0;i<180;i++){
  if(i===36){tax(20);const plan=automaticKitFormation(worldKitSummary(s.domestic).find(r=>r.id==='central'),generals(s.domestic)),cash=home().fiscal.treasury;s=beginWar(s,{id:s.domestic.war.nextId,kind:'war',kitVersion:1,targetId:borderingCountries(s.domestic)[0].id,...plan});spendEnergy(s,true);let b=s.domestic.war.battle;for(let t=0;t<15000&&!b.result;t++)b=actBattle(b,aiAction(b));if(!b.result)throw Error('Battle timeout');s.domestic.war.battle=b;const done=finishWar(s);s=done.state;spendEnergy(s,true);report.battle={cashCost:cash-home().fiscal.treasury,receipt:done.receipt,after:metrics()};const q=quoteArmyRecovery(s);order('authorize debt-time recovery',x=>executeArmyRecovery(x,{id:x.domestic.armyRecovery.nextId,kind:'start',cap:q.suggestedCap,train:true,draft:true,debtRecovery:true}));}
  if(i>36&&mode==='debt-wipe-emergency'&&!report.emergency&&s.domestic.centralArmy.soldiers===0&&worldKitDepot(s.domestic,'central').stock.infantry>=300&&!s.domestic.strategy.pending){const c={kind:'recruit',sourceId:'central',amount:300},q=quoteKitCommand(s,c);if(home().fiscal.treasury-q.cost>=7000){order('paid emergency 300 infantry-ready recruits',x=>executeKitCommand(x,{id:x.domestic.troopKits.nextId,...c}));report.emergency=metrics();}}
  step();report.rows.push(metrics());
 }
}
if(mode==='delegated-equipment'){
 report.reconciliation=report.rows.map(r=>{
  const payments=r.entries.filter(e=>e.key.startsWith('troop-kit:')||e.key.startsWith('governance:')||e.key.startsWith('delegation:')).reduce((n,e)=>n+e.expenditure,0);
  const recorded=r.governance.records.filter(e=>e.turn===r.turn).reduce((n,e)=>n+e.cost,0);
  if(payments!==r.governance.spent||recorded!==payments)throw Error('Delegated spending differs from actual cash');
  return {turn:r.turn,actual:payments,recorded,training:r.governance.records.some(e=>e.turn===r.turn&&e.cost>0&&e.reason.startsWith('驻军训练不足'))};
 });
 if(!report.reconciliation[0].training)throw Error('Affordable training still blocked by gross-price reservation');
}
if(mode.startsWith('debt-wipe-')){
 const rows=report.rows.filter(r=>r.turn>report.battle.after.turn);
 report.recoveryTimeline={firstTroops:rows.find(r=>r.soldiers>0)?.turn,basicReady:rows.find(r=>r.soldiers>=300&&r.training>=40)?.turn,zeroSoldierSnapshots:rows.filter(r=>r.soldiers===0).length,completed:rows.find(r=>r.plan&&!r.plan.active)?.turn};
 if(report.battle.after.soldiers!==0)throw Error('Did not reproduce a real full defeat');
 if(report.recoveryTimeline.firstTroops>report.battle.after.turn+12||!report.recoveryTimeline.basicReady)throw Error('Basic formation still delayed behind reserve equipment');
 if(s.domestic.armyRecovery.plan.active||s.domestic.centralArmy.soldiers<1600||s.domestic.centralArmy.training<60)throw Error('Full paid recovery incomplete');
 for(let i=1;i<rows.length;i++){
  const delta=rows[i].plan.spent-rows[i-1].plan.spent;
  if(delta<0||delta>(rows[i-1].debt?350:1400)||rows[i].plan.spent>rows[i].plan.cap)throw Error('Recovery authorization exceeded');
  if(delta>0&&rows[i].debt>rows[i-1].debt)throw Error('Recovery worsened debt');
  if(delta>0&&rows[i].cash<7000)throw Error('Recovery crossed cash reserve');
 }
}
report.final=metrics();validateSave(JSON.parse(JSON.stringify(s)));writeFileSync(resolve(output,mode+'-'+seed+'.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({mode,seed,final:report.final,emergency:report.emergency?.turn}));
