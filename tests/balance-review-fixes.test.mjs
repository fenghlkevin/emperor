import test from 'node:test';
import assert from 'node:assert/strict';
import {createPlayableGame,validateSave} from '../src/game.mjs';
import {campaignSupply} from '../src/military-costs.mjs';
import {settleStateDevelopment} from '../src/state-development.mjs';
import {settleBuildingEffects} from '../src/building-effects.mjs';
import {executeNational} from '../src/national-actions.mjs';
import {quoteRevenue} from '../src/revenue.mjs';
import {executeJustice,amnestyTerms} from '../src/justice.mjs';
import {quoteGeneral} from '../src/general.mjs';
import {postTreasury,validateFinance} from '../src/finance.mjs';
import {fiscalHealth} from '../src/fiscal-health.mjs';
import {growForeignKitArmy} from '../src/kit-strategy.mjs';
import {initializeStrategy} from '../src/foreign-strategy.mjs';
import {foreignOutlook,foreignMilitaryTarget,realmProfile,STRATEGIC_PROFILES,mayExpand} from '../src/foreign-policy.mjs';
import {countrySummary,settleDomestic} from '../src/domestic.mjs';
const game=()=>createPlayableGame('平衡修复验收'),home=s=>s.domestic.countries.find(c=>c.id==='sheng');

test('campaign grain follows fielded units and ignores idle equipment',()=>{
 const s=game(),d=s.domestic;
 const infantry=campaignSupply(d,200,[{kind:'infantry',count:200}]),cavalry=campaignSupply(d,200,[{kind:'cavalry',count:200}]);
 assert.equal(infantry.grain,16);assert.equal(cavalry.grain,24);assert.equal(cavalry.version,3);
 d.troopKits.depots.central.stock.spears+=10000;
 assert.deepEqual(campaignSupply(d,200,[{kind:'cavalry',count:200}]),cavalry);
 assert.equal(campaignSupply(d,200).grain,16);
 assert.throws(()=>campaignSupply(d,200,[{kind:'cavalry',count:100}]),/人数/);
});

test('persistent high tax causes revolt with full food and repeatedly restored loyalty; lower tax heals gradually',()=>{
 for(const rate of [.27,.29,.5]){
  const s=game(),d=s.domestic,p=d.provinces.find(p=>p.countryId==='sheng');p.budget.taxRate=rate;
  let first=null;
  // Counterfactual isolates taxation: no famine, with even stronger pacification than real amnesty.
  for(let turn=2;turn<=241;turn++){p.welfare.loyalty=100;p.welfare.stability=80;p.foodRelief.lastSettlement=null;settleStateDevelopment(d,turn);if(p.civic.unrestTurns>=3){first=turn;break;}}
  assert.ok(first&&first<=200,`${rate}: ${first}`);assert.equal(p.status.situation,'unrest');
  const grievance=p.civic.taxGrievance,turn=d.stateDevelopment.lastTurn;p.budget.taxRate=.2;settleStateDevelopment(d,turn+1);
  assert.ok(p.civic.taxGrievance<grievance&&p.civic.taxGrievance>0);assert.equal(p.status.situation,'unrest');
  for(let t=turn+2;t<=turn+110;t++)settleStateDevelopment(d,t);
  assert.equal(p.civic.taxGrievance,0);assert.equal(p.civic.unrestTurns,0);
 }
 const d=game().domestic,p=d.provinces.find(p=>p.countryId==='sheng');for(let t=2;t<=241;t++)settleStateDevelopment(d,t);assert.equal(p.civic.taxGrievance,0);
});

test('amnesty pays actual cash, diminishes within a year and never erases tax grievances',()=>{
 let s=game();const population=countrySummary(s.domestic).total,p=s.domestic.provinces[0];p.civic.taxGrievance=40;
 for(const [turn,gain] of [[1,3],[13,1],[25,0],[37,3]]){
  s.turn=turn;const q=amnestyTerms(s.domestic,turn),cash=home(s).fiscal.treasury;assert.equal(q.gain,gain);
  s=executeJustice(s,{kind:'amnesty',id:s.domestic.justice.nextId}).state;
  assert.equal(home(s).fiscal.treasury,cash-q.cost);assert.equal(countrySummary(s.domestic).total,population);assert.equal(s.domestic.provinces[0].civic.taxGrievance,40);validateFinance(s.domestic);
 }
});

test('operating health counts recurring one-off costs, excludes capital/principal, and persists three years of real observations',()=>{
 const s=game(),d=s.domestic;postTreasury(d,'sheng',{turn:1,income:20000,reason:'期初资本对照',key:'capital'});
 for(let turn=1;turn<=120;turn++){
  postTreasury(d,'sheng',{turn,income:1000,expense:900,category:'regular',reason:'常规对照',key:`regular:${turn}`});
  postTreasury(d,'sheng',{turn,expense:100,recurring:true,reason:'经常治理对照',key:`recurring:${turn}`});
 }
 const f=fiscalHealth(d);assert.equal(f.net,0);assert.equal(f.operations,50);assert.equal(f.observedTurns,108);assert.deepEqual(f.annual.map(r=>r.net),[0,0,0]);assert.equal(home(s).ledger.length,36);assert.equal(home(s).fiscal.accounting.history.length,72);
 validateFinance(d);const cash=home(s).fiscal.treasury;assert.equal(cash,50000);
 // Verify compaction does not lose recurring classification.
 for(let i=0;i<110;i++)postTreasury(d,'sheng',{turn:120,income:1,expense:1,recurring:true,reason:'明细结转对照',key:`compact:${i}`});validateFinance(d);assert.equal(fiscalHealth(d).net,0);
 const damaged=structuredClone(d);damaged.countries[0].ledger[0].recurring.expense++;assert.throws(()=>validateFinance(damaged),/财政流水/);
 assert.throws(()=>postTreasury(d,'sheng',{turn:120,expense:1,recurring:true,category:'transfer',reason:'无效分类',key:'invalid'}),/财政流水/);
});

test('foreign military budget protects future upkeep, grain and debt recovery',()=>{
 const s=game(),d=s.domestic;initializeStrategy(d);const p=d.provinces.find(p=>p.countryId==='cape'),c=d.countries.find(c=>c.id==='cape');
 assert.equal(foreignMilitaryTarget(d,p),1400);const before=p.population.professions.soldiers,cash=c.fiscal.treasury;
 assert.equal(growForeignKitArmy(d,p,800,6).recruited,0);assert.equal(p.population.professions.soldiers,before);assert.equal(c.fiscal.treasury,cash);
 c.fiscal.centralExpenses.other=1000;assert.ok(foreignOutlook(d,c,6).net<0);assert.equal(growForeignKitArmy(d,p,800,6).cost,0);assert.equal(mayExpand(d,c,6),false);
 c.fiscal.centralExpenses.other=0;c.fiscal.debt=1;assert.equal(growForeignKitArmy(d,p,800,6).cost,0);
});

test('every foreign realm has an explicit strategic aim and renaming preserves its stored aims',()=>{
 const d=game().domestic;initializeStrategy(d);
 for(const c of d.countries.filter(c=>c.id!=='sheng')){const n=d.strategy.nations[c.id];assert.equal(n.profile,realmProfile(c.id));assert.ok(STRATEGIC_PROFILES[n.profile].aggression>0);}
 const c=d.countries.find(c=>c.id==='steppe'),profile=d.strategy.nations[c.id].profile,initiative=d.strategy.nations[c.id].initiative;
 c.id='renamed-realm';d.strategy.nations[c.id]={profile,initiative,lastWar:1,lastPeace:1};initializeStrategy(d);assert.equal(d.strategy.nations[c.id].profile,'expansionist');assert.equal(d.strategy.nations[c.id].initiative,initiative);
});

test('zero facilities are credited only with baseline governance, and old saves remain loadable',()=>{
 const s=game(),p=s.domestic.provinces[0];for(const key of ['temples','yamen','markets','trainingGrounds','palaces'])p.buildings[key]=0;
 for(const key of ['stability','security','activity','fitness','loyalty']){p.welfare[key]=20;p.buildingEffects.carry[key]=0;}
 settleBuildingEffects(p,2,true,false);for(const key of Object.keys(p.buildingEffects.last.gains)){assert.equal(p.buildingEffects.last.facilityGains[key],0);assert.equal(p.buildingEffects.last.baseGains[key],.05);}
 const old=game();for(const p of old.domestic.provinces)delete p.civic.taxGrievance;for(const c of old.domestic.countries)delete c.fiscal.accounting.history;
 assert.equal(validateSave(JSON.parse(JSON.stringify(old))).domestic.countries[0].fiscal.treasury,home(old).fiscal.treasury);
});

test('ongoing training quotes paid incremental recovery and reserve pauses',()=>{
 const s=game(),q=quoteGeneral(s,{kind:'ongoing',enabled:true});assert.match(q.lines.join(''),/实付.*保留线.*稀释/);assert.doesNotMatch(q.lines.join(''),/不低于/);
});

test('automatic debt recovery amortizes a small recoverable debt with real cash and suppresses discretionary stipends',()=>{
 const s=game(),d=s.domestic,c=home(s);const normal=countrySummary(d).expenses.nobleStipends;
 // Cash-backed compulsory deficit fixture: debt is acquired through the authoritative ledger.
 postTreasury(d,c.id,{turn:1,expense:c.fiscal.treasury+1000,allowDebt:true,reason:'恢复压力对照',key:'debt'});
 postTreasury(d,c.id,{turn:1,income:8000,reason:'实收款对照',key:'capital'});
 assert.ok(countrySummary(d).expenses.nobleStipends<normal);
 d.personnel.delegations=[];
 for(let t=2;t<=20&&c.fiscal.debt;t++)settleDomestic(d,t);
 assert.equal(c.fiscal.debt,0);validateFinance(d);
});

test('a recent profitable year cannot erase the fiscal score of two preceding deficit years',()=>{
 const d=game().domestic;postTreasury(d,'sheng',{turn:1,income:100000,reason:'会计夹具储备',key:'funds'});
 for(let t=1;t<=108;t++)postTreasury(d,'sheng',{turn:t,income:1000,expense:t<=72?1200:900,category:'regular',reason:'滚动经营对照',key:'regular:'+t});
 const h=fiscalHealth(d);assert.equal(h.net,100);assert.ok(h.operations<60);validateFinance(d);
 const s=game(),rates=Object.fromEntries(countrySummary(s.domestic).provinces.map(p=>[p.id,50]));assert.match(quoteRevenue(s,{kind:'tax',rates}).lines.join(''),/预警.*持续高税.*及时降税治理.*不免除/);
});

test('windfall cash above a six-turn operating buffer is used for principal before discretionary investment',()=>{
 const s=game(),d=s.domestic,c=home(s);d.personnel.delegations=[];
 postTreasury(d,'sheng',{turn:1,expense:c.fiscal.treasury+20000,allowDebt:true,reason:'债务夹具',key:'debt'});
 postTreasury(d,'sheng',{turn:1,income:100000,reason:'实收账款夹具',key:'cash'});
 settleDomestic(d,2);assert.equal(c.fiscal.debt,0);assert.ok(c.fiscal.treasury<100000);validateFinance(d);
});

test('paid pacification cannot cancel rebellion while oppressive taxes remain in place',()=>{
 let s=game(),p=s.domestic.provinces.find(p=>p.countryId==='sheng');p.budget.taxRate=.29;p.civic.taxGrievance=60;p.civic.unrestTurns=3;p.status.situation='unrest';const id=p.id,cash=home(s).fiscal.treasury;
 s=executeNational(s,{id:s.domestic.stateDevelopment.nextId,kind:'pacify',provinceId:id}).state;p=s.domestic.provinces.find(p=>p.id===id);
 assert.equal(home(s).fiscal.treasury,cash-500);assert.equal(p.civic.taxGrievance,60);assert.equal(p.civic.unrestTurns,3);assert.equal(p.status.situation,'unrest');
 s.turn++;p.budget.taxRate=.2;s=executeNational(s,{id:s.domestic.stateDevelopment.nextId,kind:'pacify',provinceId:id}).state;p=s.domestic.provinces.find(p=>p.id===id);assert.equal(p.civic.unrestTurns,1);assert.equal(p.civic.taxGrievance,60);assert.equal(p.status.situation,'unrest');
});

test('brief alternating tax cuts cannot repeatedly erase a sustained excessive average burden',()=>{
 const d=game().domestic,p=d.provinces.find(p=>p.countryId==='sheng');let first=null;
 for(let t=2;t<=361;t++){
  // Four turns at 50%, twelve turns at 20%: average 27.5%, even with unlimited pacification of loyalty.
  p.budget.taxRate=(t-2)%16<4?.5:.2;p.welfare.loyalty=100;p.welfare.stability=80;p.foodRelief.lastSettlement=null;settleStateDevelopment(d,t);
  if(p.civic.unrestTurns>=3){first=t;break;}
 }
 assert.ok(first&&first<361);assert.equal(p.status.situation,'unrest');
});
