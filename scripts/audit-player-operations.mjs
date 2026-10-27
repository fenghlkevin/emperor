// Fresh campaigns using public player commands only; disasters and enemy attacks remain natural.
import {mkdirSync,writeFileSync,readFileSync,readdirSync} from 'node:fs';
import {resolve} from 'node:path';
import {createHash} from 'node:crypto';
import {createPlayableGame,advance,validateSave} from '../src/game.mjs';
import {countrySummary} from '../src/domestic.mjs';
import {executeRevenue} from '../src/revenue.mjs';
import {executeGeneral,quoteGeneral} from '../src/general.mjs';
import {executePersonnel} from '../src/personnel-actions.mjs';
import {worldKitSummary,quoteKitCommand,executeKitCommand} from '../src/troop-kit-world.mjs';
import {beginWar,finishWar,generals,borderingCountries} from '../src/war.mjs';
import {automaticKitFormation} from '../src/kit-formation.mjs';
import {aiAction,actBattle} from '../src/battle.mjs';
import {quoteArmyRecovery,recoveryStatus,executeArmyRecovery} from '../src/army-recovery.mjs';
import {palaceAction,spendEnergy,courtBlock} from '../src/emperor.mjs';
import {autoDefense} from '../src/foreign-strategy.mjs';
import {resolveCapital,refugeProvinces} from '../src/capital-crisis.mjs';
const out=resolve(process.argv.find(a=>a.startsWith('--output-dir='))?.slice(13)??'outputs/player-recovery-fixes-2026-10-22');
const seed=Number(process.argv.find(a=>a.startsWith('--seed='))?.slice(7)??1);
const only=process.argv.find(a=>a.startsWith('--mode='))?.slice(7);
const selected=process.argv.find(a=>a.startsWith('--modes='))?.slice(8)?.split(',');
mkdirSync(out,{recursive:true});
const home=s=>s.domestic.countries.find(c=>c.id===s.domestic.playerCountryId);
const central=s=>worldKitSummary(s.domestic).find(r=>r.id==='central');
function metrics(s){const q=countrySummary(s.domestic,undefined,s.turn),p=s.domestic.armyRecovery?.plan;return {turn:s.turn,cash:home(s).fiscal.treasury,debt:home(s).fiscal.debt,net:q.net,grain:home(s).fiscal.grain,soldiers:s.domestic.centralArmy.soldiers,training:s.domestic.centralArmy.training,provinces:q.provinces.length,living:q.livingStandard,unrest:q.provinces.filter(p=>p.status.situation==='unrest').length,disasters:q.provinces.filter(p=>p.disaster&&p.disaster.endTurn>s.turn).map(p=>({id:p.id,...p.disaster})),foodShortfall:home(s).foodSettlement?.shortfall??0,localShortfall:q.provinces.reduce((n,p)=>n+(p.foodRelief.lastSettlement?.shortfall??0),0),pending:s.domestic.strategy.pending?{attacker:s.domestic.strategy.pending.attacker,defender:s.domestic.strategy.pending.defender,playerAid:s.domestic.strategy.pending.playerAid}:null,plan:p?{active:p.active,spent:p.spent,cap:p.cap,debtRecovery:p.debtRecovery??false,waitingCap:p.waitingCap??false,targetTraining:p.target.training,target:p.target.soldiers,reserve:p.reserve,status:p.status,completedTurn:p.completedTurn}:null,offer:s.domestic.armyRecovery?.offer?.soldiers??null,happiness:s.stats.happiness,life:s.stats.life};}
const report={seed,sourceFingerprint:createHash('sha256').update(readdirSync('src').filter(f=>f.endsWith('.mjs')).sort().map(f=>readFileSync('src/'+f)).join('\n')).digest('hex'),methodology:{resources:'Unmodified createPlayableGame; no treasury, army, population or disaster injection. Disaster seed and fixed createdAt are reproducibility parameters.',world:'Full foreign strategy enabled, actual defense and relocation if required. All court actions charge energy, happiness and health, including outgoing battle result.',actions:'Public production commands, actual prices and battle simulation using AI tactical actions. Three paid-free garden visits and sleep each turn maintain emperor wellbeing; no direct stat refill.',save:'Validate and reload every 36 turns. 180 turns per scenario. All rows retained, not only final outcomes.'},scenarios:[],errors:[]};
for(const mode of ['normal','consecutive-active','consecutive-renewed','consecutive-unapproved','consecutive-cancelled','large-two-wars','low-cash-war','low-cash-large-war','low-cash-depot-war','natural-overlap-low-cash','natural-overlap-large-war','natural-overlap-depot-war','debt-recovery','debt-repay-control','debt-manual-minimum','debt-no-authorization','reserve-change'].filter(m=>(!only||m===only)&&(!selected||selected.includes(m)))){
 let rng=seed;const original=Math.random;Math.random=()=>((rng=Math.imul(rng,1664525)+1013904223>>>0)/4294967296);
 let s=createPlayableGame('玩家操作容错复测');s.createdAt='2026-10-21T00:00:00.000Z';s.domestic.disasters.seed=seed;
 const row={mode,seed,initial:metrics(s),orders:[],battles:[],rows:[],steps:0};
 const order=(label,fn)=>{if(courtBlock(s))throw Error(courtBlock(s));const before=metrics(s);s=fn(s).state;spendEnergy(s,true);row.orders.push({label,before,after:metrics(s)});};
 const tax=rate=>order('tax '+rate,x=>executeRevenue(x,{id:x.domestic.fiscalActions.nextId,kind:'tax',rates:Object.fromEntries(home(x).provinceIds.map(id=>[id,rate]))}));
 const authorize=()=>{const q=quoteArmyRecovery(s);order('authorize',x=>executeArmyRecovery(x,{id:x.domestic.armyRecovery.nextId,kind:'start',cap:mode==='consecutive-renewed'?1:q.suggestedCap,train:true,draft:true,debtRecovery:!['debt-repay-control','debt-manual-minimum','debt-no-authorization'].includes(mode)}));};
 const cancel=()=>order('cancel',x=>executeArmyRecovery(x,{id:x.domestic.armyRecovery.nextId,kind:'cancel'}));
 const budget=reserve=>order('reserve '+reserve,x=>executePersonnel(x,{id:x.domestic.personnel.nextId,kind:'governanceBudget',reserve,budget:1400}));
 const deplete=(sourceId='central')=>{let lo=0,hi=100000;const available=Math.max(0,home(s).fiscal.treasury-1800);while(lo<hi){const n=Math.ceil((lo+hi)/2);if(quoteKitCommand(s,{kind:'purchase',sourceId,quantities:{infantry:n}}).cost<=available)lo=n;else hi=n-1;}if(lo)order('paid surplus infantry equipment '+lo+' at '+sourceId,x=>executeKitCommand(x,{id:x.domestic.troopKits.nextId,kind:'purchase',sourceId,quantities:{infantry:lo}}));};
 const fight=large=>{const before=metrics(s),leaders=generals(s.domestic),target=borderingCountries(s.domestic)[0];if(!target)throw Error('No legal bordering target');const plan=large?automaticKitFormation(central(s),leaders):{generalId:leaders[0].id,commanderSquad:{kind:'infantry',count:20},squads:[{kind:'infantry',count:100,generalId:leaders[1].id}]};
  if(courtBlock(s))throw Error(courtBlock(s));s=beginWar(s,{id:s.domestic.war.nextId,kind:'war',kitVersion:1,targetId:target.id,...plan});spendEnergy(s,true);let b=s.domestic.war.battle,ticks=0;while(!b.result&&ticks++<15000)b=actBattle(b,aiAction(b));if(!b.result)throw Error('Battle timeout');s.domestic.war.battle=b;const done=finishWar(s);s=done.state;const charged=!courtBlock(s);if(charged)spendEnergy(s,true);row.battles.push({large,before,after:metrics(s),ticks,resultCourtCharged:charged,receipt:done.receipt});};
 try{
  if(mode.startsWith('low-cash-')||mode.startsWith('natural-overlap-')){if(mode.includes('depot'))deplete('hebei');else order('initial surplus equipment 2500',x=>executeKitCommand(x,{id:x.domestic.troopKits.nextId,kind:'purchase',sourceId:'central',quantities:{infantry:2500}}));row.lowCashStart=metrics(s);}
  if(mode.startsWith('debt-'))tax(0);
  if(mode==='reserve-change')budget(20000);
  for(let i=0;i<180&&s.stats.life>0;i++){
   if(s.domestic.strategy.pending?.defender===s.domestic.playerCountryId){const before=metrics(s);s=autoDefense(s).state;const charged=s.stats.life>0&&!s.domestic.collapse?.pending&&!courtBlock(s);if(charged)spendEnergy(s,true);row.orders.push({label:'actual enemy attack auto defense',before,after:metrics(s),courtCharged:charged});}
   if(s.domestic.collapse?.pending){s=resolveCapital(s,{kind:'relocate',provinceId:refugeProvinces(s)[0]?.id}).state;}
   if(s.domestic.collapse?.ended)break;
   if(mode.startsWith('consecutive')&&[6,8,10].includes(i)){
    if(mode==='consecutive-cancelled'&&s.domestic.armyRecovery?.plan?.active)cancel();
    fight(false);
    if(mode!=='consecutive-unapproved'&&!s.domestic.armyRecovery?.plan?.active)authorize();
    if(mode==='consecutive-unapproved'&&i===10)authorize();
   }
   if(mode==='large-two-wars'&&[6,66].includes(i)){fight(true);if(!s.domestic.armyRecovery?.plan?.active)authorize();}
   if(mode.startsWith('low-cash-')&&i===0){fight(mode!=='low-cash-war');authorize();}
   if(mode.startsWith('natural-overlap-')&&!row.overlap&&metrics(s).disasters.filter(e=>['flood','drought','landslide','epidemic'].includes(e.kind)).length>=3&&s.domestic.centralArmy.soldiers>=120&&!s.domestic.strategy.pending){deplete(mode.includes('depot')?'hebei':'central');row.overlap=metrics(s);fight(mode!=='natural-overlap-low-cash');authorize();}
   if(mode.startsWith('debt-')&&i===36){row.debtBeforeCut=metrics(s);tax(20);fight(false);authorize();}
   if(mode==='debt-recovery'&&i===108&&home(s).fiscal.debt>0){const amount=Math.min(home(s).fiscal.debt,Math.max(0,home(s).fiscal.treasury-7000));if(amount)order('manual debt repayment '+amount,x=>executeRevenue(x,{id:x.domestic.fiscalActions.nextId,kind:'repay',amount}));}
   if(mode==='debt-repay-control'&&i>36&&home(s).fiscal.debt>0&&home(s).fiscal.treasury>=home(s).fiscal.debt+7000)order('repay all real debt',x=>executeRevenue(x,{id:x.domestic.fiscalActions.nextId,kind:'repay',amount:home(x).fiscal.debt}));
   if(mode==='consecutive-renewed'&&i>10&&s.domestic.armyRecovery?.plan?.active&&s.domestic.armyRecovery.plan.waitingCap&&!s.domestic.strategy.pending){const q=quoteArmyRecovery(s),p=s.domestic.armyRecovery.plan;order('direct extension',x=>executeArmyRecovery(x,{id:x.domestic.armyRecovery.nextId,kind:'extend',amount:Math.max(1,q.suggestedCap-(p.cap-p.spent))}));}
   if(mode==='debt-manual-minimum'&&i>36&&!s.domestic.strategy.pending){const g=recoveryStatus(s.domestic).gaps,quantities=Object.fromEntries(Object.entries(g.kits).filter(([,n])=>n>0));let command;if(Object.keys(quantities).length)command={kind:'purchase',sourceId:'central',quantities};else if(g.soldiers)command={kind:'recruit',sourceId:'central',amount:g.soldiers};if(command){const q=quoteKitCommand(s,command);if(home(s).fiscal.treasury-q.cost>=7000)order('manual paid '+command.kind,x=>executeKitCommand(x,{id:x.domestic.troopKits.nextId,...command}));}else if(g.training){const q=quoteGeneral(s,{kind:'train'});if(home(s).fiscal.treasury-q.cost>=7000)order('manual paid training',x=>executeGeneral(x,{id:x.domestic.general.nextId,kind:'train'}));}}
   if(mode==='reserve-change'&&i===6){fight(true);authorize();budget(7000);row.reserveMismatch={planReserve:s.domestic.armyRecovery.plan.reserve,displayedReserve:quoteArmyRecovery(s).reserve};}
   for(const [phase,kind]of [[1,'view'],[1,'view'],[1,'view'],[2,'sleep']]){s.phase=phase;const domestic=s.domestic;s=palaceAction({...s,domestic:undefined},kind).state;s.domestic=domestic;}
   advance(s);row.steps++;if(row.steps%36===0)s=validateSave(JSON.parse(JSON.stringify(s)));row.rows.push(metrics(s));
  }
  row.final=metrics(s);row.finalStatus=recoveryStatus(s.domestic);
  if(['consecutive-unapproved','consecutive-cancelled','consecutive-renewed','debt-recovery','debt-manual-minimum'].includes(mode)&&!(s.domestic.centralArmy.soldiers>=1600&&s.domestic.centralArmy.training>=60&&!s.domestic.armyRecovery.plan.active))throw Error('恢复目标未完整达成');
  if(mode.startsWith('natural-overlap-')&&!row.overlap)throw Error('未覆盖自然多灾叠加');
  if(mode==='reserve-change'&&row.reserveMismatch.planReserve!==row.reserveMismatch.displayedReserve)throw Error('资金门槛仍不一致');
  if(mode==='consecutive-renewed'&&!row.orders.some(o=>o.label==='direct extension'))throw Error('未覆盖直接续批');
 }catch(e){row.error={turn:s.turn,message:e.stack};report.errors.push({mode,...row.error});}
 finally{Math.random=original;report.scenarios.push(row);writeFileSync(resolve(out,`player-operations-${seed}${only?'-'+only:selected?'-focused':''}.json`),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({seed,mode,steps:row.steps,battles:row.battles.length,overlap:row.overlap,final:row.final,error:row.error}));}
}
if(report.errors.length)process.exitCode=1;
