import test from 'node:test';
import assert from 'node:assert/strict';
import {createPlayableGame,advance,validateSave} from '../src/game.mjs';
import {countrySummary} from '../src/domestic.mjs';
import {nationalFoodForecast} from '../src/national-resources.mjs';
import {executeRevenue} from '../src/revenue.mjs';
import {enableDevelopmentBalance} from '../src/new-dynasty-balance.mjs';
import {postTreasury} from '../src/finance.mjs';
import {debtInterest} from '../src/development-balance.mjs';
import {settleStateDevelopment} from '../src/state-development.mjs';
const game=()=>createPlayableGame('玩家容错验收');

test('fresh dynasty has cash, grain, fiscal and city headroom without refilling existing saves',()=>{
 const s=game(),d=s.domestic,c=d.countries.find(c=>c.id==='sheng'),q=countrySummary(d),f=nationalFoodForecast(d,2);
 assert.equal(c.fiscal.treasury,30000);assert.ok(q.net>=1400&&q.net<=2000);assert.ok(f.opening/f.need>=45&&f.opening/f.need<=60);
 for(const p of q.provinces)assert.ok(p.cityCapacity.population/p.population.total>=1.15);
 const estate=c.fiscal.otherIncome;postTreasury(d,c.id,{turn:1,expense:27000,reason:'存档余额对照',key:'cushion:spent'});
 enableDevelopmentBalance(d,1,{fresh:true});assert.equal(c.fiscal.treasury,3000);assert.equal(c.fiscal.otherIncome,estate);
 assert.equal(validateSave(JSON.parse(JSON.stringify(s))).domestic.countries.find(c=>c.id==='sheng').fiscal.treasury,3000);
});

test('one year of moderate emergency taxation can be corrected without dismissing the army',()=>{
 let s=game(),army=countrySummary(s.domestic).military;
 const tax=rate=>{s=executeRevenue(s,{id:s.domestic.fiscalActions.nextId,kind:'tax',rates:Object.fromEntries(countrySummary(s.domestic).provinces.map(p=>[p.id,rate]))}).state;};
 tax(30);
 for(let i=0;i<108;i++){
  if(i===36)tax(20);
  s.domestic.strategy.lastTurn=s.turn+1;s.domestic.disasters.lastTurn=s.turn+1;advance(s);
  assert.equal(s.domestic.countries.find(c=>c.id==='sheng').fiscal.debt,0);
 }
 assert.equal(countrySummary(s.domestic).military,army);assert.ok(countrySummary(s.domestic).provinces.every(p=>p.status.situation!=='unrest'));
 validateSave(JSON.parse(JSON.stringify(s)));
});

test('high-tax warnings precede revolt, and fixing the policy bounds old unrest duration',()=>{
 const d=game().domestic,p=d.provinces[0];p.budget.taxRate=.27;let warning=null,revolt=null;
 for(let t=2;t<=240;t++){p.welfare.loyalty=100;p.welfare.stability=80;p.foodRelief.lastSettlement=null;settleStateDevelopment(d,t);if(p.civic.taxGrievance>=10&&!warning)warning=t;if(p.civic.unrestTurns>=3){revolt=t;break;}}
 assert.ok(warning&&revolt&&revolt-warning>=36);assert.ok(d.stateDevelopment.history.some(r=>r.message.includes('抗税征兆')));
 p.civic.unrestTurns=240;p.civic.taxGrievance=0;p.civic.taxPressure=0;p.budget.taxRate=.2;p.status.situation='unrest';
 for(let t=revolt+1;t<=revolt+12;t++)settleStateDevelopment(d,t);
 assert.equal(p.civic.unrestTurns,0);assert.equal(p.status.situation,'stable');assert.equal(debtInterest(10000),5);
});
