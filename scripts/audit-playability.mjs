// Real-start balance audit. No injected cash, loyalty, stats or free equipment.
// Only RNG/creation time are fixed; stress fixtures are labelled separately.
import {mkdirSync,writeFileSync} from 'node:fs';
import {createPlayableGame as newGame,leaveRoom,sleepUntilNextTurn,resolveExhaustion,validateSave} from '../src/game.mjs';
import {palaceAction,spendEnergy,courtBlock} from '../src/emperor.mjs';
import {executeRevenue} from '../src/revenue.mjs';
import {executePersonnel} from '../src/personnel-actions.mjs';
import {executeNational,succeedDynasty} from '../src/national-actions.mjs';
import {countrySummary} from '../src/domestic.mjs';
import {executeSpecial,quoteSpecial,specialActive} from '../src/special-buildings.mjs';
import {beginWar,finishWar,generals,borderingCountries} from '../src/war.mjs';
import {automaticKitFormation} from '../src/kit-formation.mjs';
import {worldKitSummary,executeKitCommand,worldKitDepot} from '../src/troop-kit-world.mjs';
import {industryTax,outputFor} from '../src/economy.mjs';
import {TROOP_KITS} from '../src/troop-kits.mjs';
import {aiAction,actBattle} from '../src/battle.mjs';
import {autoDefense} from '../src/foreign-strategy.mjs';
import {resolveCapital} from '../src/capital-crisis.mjs';
import {persistCandidate} from '../src/persistence.mjs';

const report={balanceRulesVersion:1,date:'2026-10-17',seedPolicy:'固定创建时间和随机源；普通场景不修改资源或官员忠诚',scenarios:[],wars:[],probes:{},errors:[]};
const output=new URL('../outputs/balance-v1-2026-10-17/',import.meta.url);mkdirSync(output,{recursive:true});
const modes=['skip-no-policy','managed-skip','managed-active','delegated-active','delegated-budget-active','academy-active','academy-capital-active'];
const selectedMode=process.argv.find(a=>a.startsWith('--mode='))?.slice(7);
const selectedTurns=Number(process.argv.find(a=>a.startsWith('--turns='))?.slice(8)??0);
if(!Number.isInteger(selectedTurns)||selectedTurns<0||selectedTurns>2160)throw Error('Turns must be 1–2160');
const selectedSeed=process.argv.find(a=>a.startsWith('--seed='))?.slice(7);
if(selectedMode&&!modes.includes(selectedMode))throw Error('Unknown audit mode');
if(selectedSeed&&!['1','7','41'].includes(selectedSeed))throw Error('Seed must be 1, 7 or 41');
const seeds=selectedSeed?[Number(selectedSeed)]:[1,7,41];
const resultUrl=new URL(selectedMode?`${selectedMode}${selectedSeed?'-'+selectedSeed:''}${selectedTurns?'-'+selectedTurns:''}.json`:'results.json',output);
report.methodology='普通政令计入办公成本；战事采用直接模型自动处置，前端入口、受阻状态与扣费另由crisis-recovery-desktop验证。战斗对比双方均使用同一AI，不能代表玩家战术上限。';
function rng(seed){let n=seed;return()=>((n=Math.imul(n,1664525)+1013904223>>>0)/4294967296);}
const home=s=>s.domestic.countries.find(c=>c.id===s.domestic.playerCountryId);
const start=seed=>{const s=newGame('可玩性验收');s.createdAt='2026-10-17T00:00:00.000Z';s.domestic.disasters.seed=seed;return s;};
function metrics(s){const q=countrySummary(s.domestic,undefined,s.turn);return {turn:s.turn,age:s.stats.age,life:s.stats.life,energy:s.stats.energy,health:s.stats.health,happiness:s.stats.happiness,treasury:q.country.fiscal.treasury,debt:q.country.fiscal.debt,net:q.net,provinces:q.provinces.length,population:q.total,grain:q.grainReserve,stability:q.welfare.stability,loyalty:q.loyalty,living:q.livingStandard,unrest:q.provinces.filter(p=>p.status.situation==='unrest').length,abilities:{wisdom:s.stats.wisdom,martial:s.stats.martial,charm:s.stats.charm,talent:s.stats.talent},officials:s.domestic.justice.officials.filter(o=>o.status==='serving').length};}
const serialize=s=>validateSave(JSON.parse(JSON.stringify(s)));
// Mirror app.mjs: domain action, court cost, exhaustion, persist, then publish.
const memory={getItem(k){return this[k]??null;},setItem(k,v){this[k]=v;},removeItem(k){delete this[k];}};
function commit(s,result,court=false){return persistCandidate(s,result.state??result,memory,n=>{if(court)spendEnergy(n,true);resolveExhaustion(n);});}
function court(s,fn){if(courtBlock(s))throw Error(courtBlock(s));s.scene='court';return commit(s,fn(s),true);}
function personnel(s,c){return court(s,x=>executePersonnel(x,{id:x.domestic.personnel.nextId,...c}));}
function national(s,c){return court(s,x=>executeNational(x,{id:x.domestic.stateDevelopment.nextId,...c}));}
function rest(s){return commit(s,palaceAction(s,'sleep'));}
function company(s){const p=s.harem.members.find(p=>!p.pregnancy&&!p.inColdPalace);return p?commit(s,palaceAction(s,'company',{id:p.id})):null;}
function emergencies(s,row){
 if(s.domestic.war.battle){let b=s.domestic.war.battle,steps=0;while(!b.result&&steps++<15000)b=actBattle(b,aiAction(b));if(!b.result)throw Error('防守战场未能结束');s.domestic.war.battle=b;s=commit(s,finishWar(s));row.battles++;}
 if(s.domestic.strategy.pending?.defender===s.domestic.playerCountryId){s=commit(s,autoDefense(s));row.battles++;}
 if(s.domestic.collapse.pending){const p=s.domestic.provinces.find(p=>p.countryId===s.domestic.playerCountryId&&p.id!==s.domestic.collapse.pending.provinceId&&!p.disaster);s=commit(s,resolveCapital(s,p?{kind:'relocate',provinceId:p.id}:{kind:'surrender',confirm:true}));row.relocations++;}
 return s;
}
function upkeep(s,row,training=false){
 // Four daytime slots after court include three practice/visit slots and a rest.
 leaveRoom(s);
 for(let slot=1;slot<=4&&s.stats.life>0;slot++){
  if(slot===1&&s.stats.happiness<80){const n=company(s);if(n){s=n;row.companions++;}else s=rest(s);}
  else if(training&&slot<4){s=commit(s,palaceAction(s,['study','music','martial'][slot-1]));row.training++;}
  else s=rest(s);
  if(s.phase===0)break; // exhaustion already advanced the turn
  leaveRoom(s);
 }
 if(s.phase===5&&s.stats.life>0){s=rest(s);leaveRoom(s);}
 return s;
}
for(const mode of modes.filter(m=>selectedMode?m===selectedMode:!['academy-capital-active','delegated-budget-active'].includes(m)))for(const seed of seeds){
 const original=Math.random;Math.random=rng(seed);let s=start(seed);
 const row={mode,seed,rows:[metrics(s)],steps:0,companions:0,training:0,battles:0,relocations:0,reigns:0,shortfall:0,minTreasury:10000,maxDebt:0,constructionStarted:null,constructionEnabled:null,firstLoss:null,firstBlock:null,abilityCaps:{}};
 try{
  if(mode!=='skip-no-policy'){
   for(const o of s.domestic.justice.officials.filter(o=>o.loyalty<40))s=personnel(s,{kind:'honor',honor:'rank',officialId:o.id});
   s=national(s,{kind:'heir',personId:'prince-1'});
  }
  for(let i=0;i<(selectedTurns||(mode.endsWith('active')?360:720));i++){
   s=emergencies(s,row);if(s.stats.life===0)break;
   if(mode.startsWith('delegated')&&s.domestic.personnel.delegations.length<s.domestic.countries[0].provinceIds.length&&!courtBlock(s)){
    const id=home(s).provinceIds.find(id=>!s.domestic.personnel.delegations.includes(id));if(id)s=personnel(s,{kind:'delegate',provinceId:id,enabled:true});
   }
   if(mode.startsWith('academy')&&!row.constructionStarted&&!courtBlock(s)&&home(s).fiscal.treasury>=10000){
    const provinceId=mode==='academy-capital-active'?'guannei':'hebei',q=quoteSpecial(s,{provinceId,building:'shigu'});if(q.canAfford){s=court(s,x=>executeSpecial(x,{id:x.domestic.specialWorks.nextId,provinceId,building:'shigu'}));row.constructionStarted=s.turn;}
   }
   if(mode==='delegated-budget-active'&&s.turn%36===1&&countrySummary(s.domestic,undefined,s.turn).net<0&&!courtBlock(s)){
    const rates=Object.fromEntries(countrySummary(s.domestic).provinces.map(p=>[p.id,Math.min(25,Math.round(p.budget.taxRate*100)+1)]));
    if(Object.entries(rates).some(([id,rate])=>rate!==Math.round(s.domestic.provinces.find(p=>p.id===id).budget.taxRate*100))){s=court(s,x=>executeRevenue(x,{id:x.domestic.fiscalActions.nextId,kind:'tax',rates}));row.taxAdjustments=(row.taxAdjustments??0)+1;}
   }
   const before=s.turn;
   if(mode.endsWith('active'))s=upkeep(s,row,mode==='managed-active');
   else {if(s.phase===5){s=rest(s);leaveRoom(s);}else sleepUntilNextTurn(s);}
   row.steps++;for(const key of ['wisdom','martial','charm','talent'])if(s.stats[key]>=500&&!row.abilityCaps[key])row.abilityCaps[key]=s.turn;
   if(s.turn<=before&&s.stats.life>0)throw Error('完整日程未推进旬序');
   row.shortfall+=s.domestic.provinces.filter(p=>p.countryId==='sheng').reduce((n,p)=>n+(p.foodRelief.lastSettlement?.shortfall??0),0);
   row.minTreasury=Math.min(row.minTreasury,home(s).fiscal.treasury);row.maxDebt=Math.max(row.maxDebt,home(s).fiscal.debt);
   if(!row.firstLoss&&home(s).provinceIds.length<10)row.firstLoss=s.turn;
   if(!row.constructionEnabled&&specialActive(s.domestic,'shigu',s.turn))row.constructionEnabled=s.turn;
   if(i%36===35||s.stats.life===0){s=serialize(s);row.rows.push(metrics(s));}
   if(s.stats.life===0&&mode!=='skip-no-policy'&&row.reigns===0){
    try{s=commit(s,succeedDynasty(s));row.reigns++;row.successionTurn=s.turn;serialize(s);}catch(e){row.successionUnavailable=e.message;break;}
   }
  }
  s=serialize(s);row.final=metrics(s);row.endReason=s.reignResult?.reason??null;row.saveBytes=Buffer.byteLength(JSON.stringify(s));
 }catch(e){row.error={turn:s.turn,message:e.message};report.errors.push({mode,seed,...row.error});}
 finally{Math.random=original;report.scenarios.push(row);console.log(JSON.stringify({mode,seed,steps:row.steps,final:row.final,error:row.error}));writeFileSync(resultUrl,JSON.stringify(report,null,2)+'\n');}
}
// Exact one-battle comparisons with real kit reservations, losses and automatic AI.
for(const mode of (selectedMode?[]:['initial','transfer-garrison']))for(const seed of seeds){
 const original=Math.random;Math.random=rng(seed);let s=start(seed);const row={mode,seed};
 try{
  if(mode==='transfer-garrison'){
   const depot=worldKitDepot(s.domestic,'jiannan');s=commit(s,executeKitCommand(s,{id:s.domestic.troopKits.nextId,kind:'transfer',sourceId:'jiannan',targetId:'central',soldiers:depot.soldiers,quantities:depot.stock}));
  }
  const p=worldKitSummary(s.domestic).find(p=>p.id==='central'),plan=automaticKitFormation(p,generals(s.domestic)),target=borderingCountries(s.domestic)[0];
  row.target=target.name;row.initialArmy=p.soldiers.total;row.fielded=plan.commanderSquad.count+plan.squads.reduce((n,p)=>n+p.count,0);row.openingCash=home(s).fiscal.treasury;
  s=commit(s,beginWar(s,{id:s.domestic.war.nextId,kind:'war',kitVersion:1,targetId:target.id,...plan}));let b=s.domestic.war.battle,steps=0;
  while(!b.result&&steps++<15000)b=actBattle(b,aiAction(b));if(!b.result)throw Error('战场未在15000步内结束');
  row.actions=steps;row.rounds=b.round;row.result=b.result;row.homeDead=b.units.filter(u=>u.side==='home').reduce((n,u)=>n+u.dead,0);row.enemyDead=b.units.filter(u=>u.side==='enemy').reduce((n,u)=>n+u.dead,0);
  s.domestic.war.battle=b;const result=finishWar(s);s=commit(s,result);serialize(s);row.loot=result.receipt.report.loot;row.kitLoss=result.receipt.report.kitLoss;row.kitReplacementCost=TROOP_KITS.reduce((n,k)=>n+row.kitLoss[k.id]*k.price,0);row.finalArmy=s.domestic.centralArmy.soldiers;row.finalCash=home(s).fiscal.treasury;
 }catch(e){row.error=e.message;report.errors.push({mode,seed,message:e.message});}finally{Math.random=original;report.wars.push(row);console.log(JSON.stringify(row));}
}
// Show marginal costs using actual APIs; no balancing assumptions are hard-coded.
{
 let s=start(1);report.probes.opening=metrics(s);
 s=personnel(s,{kind:'honor',honor:'rank',officialId:'prime-minister'});report.probes.afterOneCourtOrder=metrics(s);
 const t=start(1),limit=[];t.scene='court';for(let i=0;i<100;i++){try{spendEnergy(t,true);limit.push(t.stats.happiness);}catch(e){report.probes.courtLimit={actions:limit.length,reason:e.message,health:t.stats.health,happiness:t.stats.happiness};break;}}
 const r=start(1);let count=0;while(r.stats.life>0&&count<1000){sleepUntilNextTurn(r);if(r.domestic.collapse.pending||r.domestic.war.battle)break;count++;}report.probes.uninterruptedSleep={turns:count,age:r.stats.age,life:r.stats.life,reason:r.reignResult?.reason??'requires emergency resolution'};
}
{
 const p=start(1).domestic.provinces[0];
 report.probes.marginalDevelopment=['agriculture','commerce'].map(industry=>{
  const q=structuredClone(p);q.economy[industry].developedArea+=500;
  const extraTax=industryTax(q,1)-industryTax(p,1);
  return {province:p.name,industry,cost:1000,extraOutput:outputFor(q,industry,1)-outputFor(p,industry,1),extraTax,staticPaybackTurns:extraTax?Math.ceil(1000/extraTax):null};
 });
 report.probes.equipment100=TROOP_KITS.map(k=>({kind:k.id,cost:k.price*100}));
}
writeFileSync(resultUrl,JSON.stringify(report,null,2)+'\n');
if(report.errors.length)process.exitCode=1;
console.log(`Audit complete: ${report.scenarios.length} real-start runs, ${report.wars.length} battles, ${report.errors.length} errors.`);
