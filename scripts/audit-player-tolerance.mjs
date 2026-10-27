import {captureArmyRecovery,offerArmyRecovery,quoteArmyRecovery,executeArmyRecovery} from '../src/army-recovery.mjs';
// New-game recovery audit. Artificial shocks are explicitly labelled; no funds or troops are granted.
import {mkdirSync,writeFileSync,readFileSync,readdirSync} from 'node:fs';
import {resolve} from 'node:path';
import {createHash} from 'node:crypto';
import {createPlayableGame,advance,validateSave} from '../src/game.mjs';
import {countrySummary} from '../src/domestic.mjs';
import {nationalFoodForecast,postNationalGrain} from '../src/national-resources.mjs';
import {postTreasury} from '../src/finance.mjs';
import {changeWelfare,protectedGrainLoss} from '../src/building-effects.mjs';
import {DISASTER_DURATIONS,quoteDisasterSubsidy} from '../src/disasters.mjs';
import {executePersonnel} from '../src/personnel-actions.mjs';
import {executeGeneral,quoteGeneral} from '../src/general.mjs';
import {executeRevenue} from '../src/revenue.mjs';
import {executeNational} from '../src/national-actions.mjs';
import {worldKitSummary,quoteKitCommand,executeKitCommand} from '../src/troop-kit-world.mjs';
import {loseForceKits} from '../src/kit-strategy.mjs';
import {beginWar,finishWar,generals,borderingCountries} from '../src/war.mjs';
import {automaticKitFormation} from '../src/kit-formation.mjs';
import {aiAction,actBattle} from '../src/battle.mjs';
import {palaceAction,spendEnergy,courtBlock} from '../src/emperor.mjs';
const out=resolve(process.argv.find(a=>a.startsWith('--output-dir='))?.slice(13)??'outputs/player-tolerance-retest-2026-10-21');
const seed=Number(process.argv.find(a=>a.startsWith('--seed='))?.slice(7)??1);
const setArg=process.argv.find(a=>a.startsWith('--modes='))?.slice(8)?.split(',');
const wanted=process.argv.find(a=>a.startsWith('--mode='))?.slice(7);
mkdirSync(out,{recursive:true});
const home=s=>s.domestic.countries.find(c=>c.id===s.domestic.playerCountryId);
const ps=s=>countrySummary(s.domestic,undefined,s.turn).provinces;
const modes=['normal18','normal20','normal22','mistake-overspend','national-drought',...Object.keys(DISASTER_DURATIONS).map(k=>'single-'+k),'triple-drought','triple-drought-relief','central-wipe-rebuild','central-wipe-rebuild-train','central-wipe-budget-shift-rebuild-train','national25-rebuild','combined-rebuild','campaign-auto','campaign-small','campaign-small-disaster','central-wipe-authorized-rebuild','central-wipe-authorized-no-train-rebuild','central-wipe-authorized-no-draft-rebuild','central-wipe-authorized-cap-rebuild','central-combined-authorized-rebuild','campaign-authorized','campaign-small-disaster-authorized'];
const result={seed,sourceFingerprint:createHash('sha256').update(readdirSync('src').filter(f=>f.endsWith('.mjs')).sort().map(f=>readFileSync('src/'+f,'utf8')).join('\n')).digest('hex'),methodology:{start:'Unmodified createPlayableGame, default delegations, fixed date and seeded random. Actual prices, cash, grain, labor and court energy; annual save/reload.',isolation:'Foreign strategy skipped to isolate recovery. Natural disasters remain active. Full world pressure is covered separately by review-world.',fixtures:'single/triple: at turn19 inject the named event using production disaster durations, actual proportional treasury/grain losses and welfare penalties. central/national: proportional real soldier/gear loss via loseForceKits. These are stress fixtures, not random frequency estimates or combat outcomes.',campaigns:'Actual beginWar + aiAction/actBattle + finishWar. Small force is a deliberate tactical mistake. Replacement buys lost kits and recruits with actual treasury. If idle labor is insufficient, authorizes up to 10% per-industry draft but takes only the actual missing batch. Budget-shift mode pays the court cost to lower automatic governance to350, then restores1400 after trained recovery. No free compensation.',recovery:'Rebuild original depot equipment and soldiers in paid batches, at most one order per turn and keep 7000 reserve. Relief mode pays each affected province once. Paid pacification only after grievance<15 and no active disaster or hunger.'},scenarios:[],errors:[]};
function m(s){const q=countrySummary(s.domestic,undefined,s.turn);return {turn:s.turn,cash:home(s).fiscal.treasury,debt:home(s).fiscal.debt,net:q.net,grain:home(s).fiscal.grain,population:q.total,living:q.livingStandard,loyalty:q.welfare.loyalty,stability:q.welfare.stability,provinces:q.provinces.length,centralTraining:s.domestic.centralArmy.training,soldiers:worldKitSummary(s.domestic).reduce((n,r)=>n+r.soldiers.total,0),unrest:ps(s).filter(p=>p.status.situation==='unrest').length,foodShortfall:ps(s).reduce((n,p)=>n+(p.foodRelief.lastSettlement?.shortfall??0),0),publicShortfall:home(s).foodSettlement?.shortfall??0,health:s.stats.health,life:s.stats.life};}
function order(s,fn){if(courtBlock(s))throw Error(courtBlock(s));const n=fn(s).state;spendEnergy(n,true);return n;}
function tax(s,rate){return order(s,x=>executeRevenue(x,{id:x.domestic.fiscalActions.nextId,kind:'tax',rates:Object.fromEntries(home(x).provinceIds.map(id=>[id,rate]))}));}
function step(s){const act=kind=>{const d=s.domestic;s=palaceAction({...s,domestic:undefined},kind).state;s.domestic=d;};s.phase=1;act('view');s.phase=2;act('sleep');s.domestic.strategy.lastTurn=s.turn+1;advance(s);return s;}
function shock(s,kind,ids){const total=countrySummary(s.domestic).total,events=[];for(const id of ids){const p=ps(s).find(p=>p.id===id),human=['fire','bandits','riot'].includes(kind),share=p.population.total/total,rawGrainLoss=Math.min(home(s).fiscal.grain,Math.round(home(s).fiscal.grain*share*(human?.03:.08))),grainLoss=protectedGrainLoss(p,rawGrainLoss,s.turn),cashLoss=Math.round(home(s).fiscal.treasury*share*(human?.1:.04));postNationalGrain(s.domestic,home(s).id,{turn:s.turn,expense:grainLoss,category:'disaster',reason:'容错测试受控灾害',key:`tolerance:${s.turn}:${id}`});postTreasury(s.domestic,home(s).id,{turn:s.turn,expense:cashLoss,category:'oneOff',reason:'容错测试受控灾损',key:`tolerance:${s.turn}:${id}`});changeWelfare(p,'stability',-4);if(['bandits','riot'].includes(kind))changeWelfare(p,'security',-3);p.disaster={kind,startTurn:s.turn,endTurn:s.turn+DISASTER_DURATIONS[kind]};p.status.situation='disaster';const e={turn:s.turn,endTurn:p.disaster.endTurn,provinceId:id,kind,grainLoss,rawGrainLoss,grainSaved:rawGrainLoss-grainLoss,cashLoss};s.domestic.disasters.history.unshift(e);events.push(e);}s.stats.treasury=home(s).fiscal.treasury;return events;}
function targetsMet(s,targets){const rows=worldKitSummary(s.domestic);return targets.every(t=>{const r=rows.find(r=>r.id===t.id);return r&&r.soldiers.total>=t.soldiers.total&&Object.keys(t.kits).every(k=>r.kits[k].total>=t.kits[k].total);});}
function rebuild(s,targets,row){for(const t of targets){const r=worldKitSummary(s.domestic).find(r=>r.id===t.id);if(!r)continue;const missing=Object.fromEntries(Object.keys(t.kits).map(k=>[k,Math.max(0,t.kits[k].total-r.kits[k].total)]).filter(([,n])=>n));let c;if(Object.keys(missing).length)c={kind:'purchase',sourceId:r.id,quantities:missing};else if(r.soldiers.total<t.soldiers.total)c={kind:'recruit',sourceId:r.id,amount:Math.min(300,t.soldiers.total-r.soldiers.total)};else continue;let q;try{q=quoteKitCommand(s,c);}catch(e){if(c.kind!=='recruit'||!e.message.includes('可征平民不足'))throw e;c.draftRates={farmers:10,herders:10,merchants:10,workers:10};q=quoteKitCommand(s,c);row.manpowerAdjustments??=[];row.manpowerAdjustments.push({turn:s.turn,sourceId:r.id,message:e.message,plannedIndustryDraft:q.details.plan.filter(p=>p.job).reduce((n,p)=>n+p.count,0)});}if(q.cost>home(s).fiscal.treasury-7000)return s;s=order(s,x=>executeKitCommand(x,{id:x.domestic.troopKits.nextId,...c}));row.actualIndustryDrafted=(row.actualIndustryDrafted??0)+(q.details.plan?.filter(p=>p.job).reduce((n,p)=>n+p.count,0)??0);row.replacementCost+=q.cost;row.replacementOrders++;return s;}return s;}
for(const mode of modes.filter(x=>(!wanted||x===wanted)&&(!setArg||setArg.includes(x)))){
 let s=createPlayableGame('新局容错复检');s.createdAt='2026-10-21T00:00:00.000Z';s.domestic.disasters.seed=seed;let n=seed;const original=Math.random;Math.random=()=>((n=Math.imul(n,1664525)+1013904223>>>0)/4294967296);
 const targets=worldKitSummary(s.domestic),row={mode,seed,fixture:!mode.startsWith('normal')&&!mode.startsWith('campaign')&&mode!=='mistake-overspend',initial:m(s),steps:0,minCash:30000,peakDebt:0,minLiving:100,foodShortfallTurns:0,publicShortfallTurns:0,unrestTurns:0,replacementCost:0,replacementOrders:0,reliefCost:0,reliefOrders:0,rebuildTurn:null,centralReadinessTurn:null,trainingCost:0,trainingOrders:0,economicRecoveryTurn:null,rows:[]};
 const duration=mode.startsWith('normal')?720:360,relieved=new Set();
 try{
 if(mode.startsWith('normal')&&mode!=='normal20')s=tax(s,Number(mode.slice(6)));
 if(mode.includes('combined'))s=tax(s,50);
 if(mode==='mistake-overspend'){const c={kind:'purchase',sourceId:'central',quantities:{infantry:2500}},q=quoteKitCommand(s,c);s=order(s,x=>executeKitCommand(x,{id:x.domestic.troopKits.nextId,...c}));row.upfrontSpending=q.cost;}
 for(let i=0;i<duration;i++){
  if(i===18&&!mode.startsWith('normal')){
   row.beforeShock=m(s);if(mode.includes('authorized')&&!mode.startsWith('campaign'))captureArmyRecovery(s.domestic,s.turn);
   if(mode.includes('combined'))s=tax(s,20);
   if(mode.startsWith('campaign')){
    const before=worldKitSummary(s.domestic).find(r=>r.id==='central');let plan=automaticKitFormation(before,generals(s.domestic));if(mode.startsWith('campaign-small'))plan={...plan,commanderSquad:{kind:'infantry',count:20},squads:[{kind:'infantry',count:100,generalId:generals(s.domestic)[1].id}]};
    const cash=home(s).fiscal.treasury,grain=home(s).fiscal.grain;s=beginWar(s,{id:s.domestic.war.nextId,kind:'war',kitVersion:1,targetId:borderingCountries(s.domestic)[0].id,...plan});spendEnergy(s,true);row.campaignCost={silver:cash-home(s).fiscal.treasury,grain:grain-home(s).fiscal.grain};let b=s.domestic.war.battle,ticks=0;while(!b.result&&ticks++<15000)b=actBattle(b,aiAction(b));if(!b.result)throw Error('战斗未结束');s.domestic.war.battle=b;const done=finishWar(s);s=done.state;row.battle=done.receipt.report;if(mode.startsWith('campaign-small-disaster'))row.events=shock(s,'drought',['guannei','hebei','henan']);
   }else{
    if(mode.includes('rebuild')){const ts=mode.startsWith('central')?targets.filter(r=>r.id==='central'):targets;row.losses=ts.map(r=>{const dead=Math.floor(r.soldiers.total*(mode.startsWith('central')?1:.25));loseForceKits(s.domestic,{countryId:home(s).id,sourceId:r.id,soldiers:r.soldiers.total,training:r.training},dead);return {sourceId:r.id,dead};});}
    if(mode==='national-drought')row.events=shock(s,'drought',ps(s).map(p=>p.id));else if(mode.startsWith('single-'))row.events=shock(s,mode.slice(7),['hebei']);else if(mode.startsWith('triple-')||mode.includes('combined'))row.events=shock(s,'drought',['guannei','hebei','henan']);
   }
   if(mode==='central-wipe-budget-shift-rebuild-train'){s=order(s,x=>executePersonnel(x,{id:x.domestic.personnel.nextId,kind:'governanceBudget',reserve:7000,budget:350}));row.governanceBudget=350;}if(mode.includes('authorized')){if(!mode.startsWith('campaign'))offerArmyRecovery(s.domestic,s.turn);const train=!mode.includes('no-train'),q=quoteArmyRecovery(s,{train}),cap=mode.includes('-cap-')?1000:q.suggestedCap;s=order(s,x=>executeArmyRecovery(x,{id:x.domestic.armyRecovery.nextId,kind:'start',train,draft:!mode.includes('no-draft'),cap}));row.authorizedRecovery={train,draft:!mode.includes('no-draft'),cap};}row.afterShock=m(s);validateSave(JSON.parse(JSON.stringify(s)));
  }
  if(i>18&&!courtBlock(s)){
   let acted=false;
   if(mode==='triple-drought-relief')for(const id of ['guannei','hebei','henan']){const p=ps(s).find(p=>p.id===id),q=quoteDisasterSubsidy(p,s.turn,Math.ceil(p.population.total*.01));if(!relieved.has(id)&&q?.shortened&&home(s).fiscal.treasury-q.minimum>=7000){s=order(s,x=>executeRevenue(x,{id:x.domestic.fiscalActions.nextId,kind:'subsidy',amounts:{[id]:q.minimum}}));row.reliefCost+=q.minimum;row.reliefOrders++;relieved.add(id);acted=true;break;}}
   if(!acted&&!mode.includes('authorized')&&(mode.includes('rebuild')||mode.startsWith('campaign'))){const orders=row.replacementOrders;s=rebuild(s,targets,row);if(mode.endsWith('rebuild-train')&&row.replacementOrders===orders&&targetsMet(s,targets)&&s.domestic.centralArmy.training<targets.find(t=>t.id==='central').training){const q=quoteGeneral(s,{kind:'train'});if(home(s).fiscal.treasury-q.cost>=7000){s=order(s,x=>executeGeneral(x,{id:x.domestic.general.nextId,kind:'train'}));row.trainingCost+=q.cost;row.trainingOrders++;}}}
   if(i>=36&&!courtBlock(s)&&home(s).fiscal.treasury>=7500){const p=ps(s).find(p=>(p.civic.taxGrievance??0)<15&&!p.disaster&&(p.foodRelief.lastSettlement?.shortfall??0)===0&&(p.welfare.stability<50||p.status.situation==='unrest'));if(p){s=order(s,x=>executeNational(x,{id:x.domestic.stateDevelopment.nextId,kind:'pacify',provinceId:p.id}));row.pacifyCost=(row.pacifyCost??0)+500;}}
  }
  row.minCash=Math.min(row.minCash,home(s).fiscal.treasury);row.peakDebt=Math.max(row.peakDebt,home(s).fiscal.debt);s=step(s);row.steps++;const q=m(s);row.minCash=Math.min(row.minCash,q.cash);row.peakDebt=Math.max(row.peakDebt,q.debt);row.minLiving=Math.min(row.minLiving,q.living);row.foodShortfallTurns+=q.foodShortfall>0;row.publicShortfallTurns+=q.publicShortfall>0;row.unrestTurns+=q.unrest>0;
  if(i>=18&&row.rebuildTurn===null&&(mode.includes('rebuild')||mode.startsWith('campaign'))&&targetsMet(s,targets))row.rebuildTurn=s.turn;
  if(i>=18&&row.centralReadinessTurn===null&&row.rebuildTurn!==null&&s.domestic.centralArmy.training>=targets.find(t=>t.id==='central').training)row.centralReadinessTurn=s.turn;
  if(mode==='central-wipe-budget-shift-rebuild-train'&&row.centralReadinessTurn!==null&&!row.budgetRestored&&!courtBlock(s)){s=order(s,x=>executePersonnel(x,{id:x.domestic.personnel.nextId,kind:'governanceBudget',reserve:7000,budget:1400}));row.budgetRestored=s.turn;}
  if(i>=27&&row.economicRecoveryTurn===null&&q.debt===0&&q.net>0&&q.unrest===0&&q.foodShortfall===0&&q.publicShortfall===0&&q.cash>=row.initial.cash&&!ps(s).some(p=>p.disaster))row.economicRecoveryTurn=s.turn;
  if([19,36,72,108,180,360,720].includes(i+1))row.rows.push(q);if((i+1)%36===0)s=validateSave(JSON.parse(JSON.stringify(s)));
 }
 row.final=m(s);row.recoveryPlan=s.domestic.armyRecovery?.plan??null;row.finalForecast=nationalFoodForecast(s.domestic,s.turn+1);row.finalCentral=worldKitSummary(s.domestic).find(r=>r.id==='central');
 }catch(e){row.error={turn:s.turn,message:e.stack};result.errors.push({mode,...row.error});}finally{Math.random=original;result.scenarios.push(row);writeFileSync(resolve(out,`tolerance-${seed}${wanted?'-'+wanted:setArg?'-adaptive':''}.json`),JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify({mode,seed,steps:row.steps,final:row.final,rebuildTurn:row.rebuildTurn,error:row.error}));}
}
if(result.errors.length)process.exitCode=1;
