import test from 'node:test';import assert from 'node:assert/strict';
import {newGame,advance,validateSave} from '../src/game.mjs';
import {initializeResourceEconomy} from '../src/province-resources.mjs';
import {initializeNewLocalAutonomy} from '../src/local-autonomy.mjs';
import {enableOfficialProduction} from '../src/official-production.mjs';
import {projectScheduledEconomy} from '../src/economy-projection.mjs';
test('12 real turns with official effects and automatic governance match resource forecasts across every reload',()=>{
 let s=newGame('连续旬验收');initializeResourceEconomy(s.domestic);initializeNewLocalAutonomy(s.domestic);enableOfficialProduction(s.domestic,1);
 const troops=s.domestic.provinces.filter(p=>p.countryId==='sheng').reduce((n,p)=>n+p.population.professions.soldiers,0),rng=Math.random;Math.random=()=>.5;
 try{for(let i=0;i<12;i++){
  const before=JSON.stringify(s),forecast=projectScheduledEconomy(s);assert.equal(JSON.stringify(s),before,'forecast changes actual save');assert.ok(forecast.available);
  advance(s);s=validateSave(JSON.parse(JSON.stringify(s)));
  const c=s.domestic.countries.find(c=>c.id===s.domestic.playerCountryId),row=c.ledger.find(r=>r.turn===s.turn&&!r.legacy),event=row.entries.filter(e=>e.key?.startsWith('auspice:')).reduce((n,e)=>n+(e.income??0)-(e.expense??0),0);
  assert.equal(s.stats.treasury-event,forecast.cash.closing,`cash turn ${s.turn}`);
  for(const p of forecast.provinces)assert.deepEqual(s.domestic.provinces.find(q=>q.id===p.id).resourceSettlement,p.resource,`${p.id} turn ${s.turn}`);
  assert.equal(s.domestic.provinces.filter(p=>p.countryId==='sheng').reduce((n,p)=>n+p.population.professions.soldiers,0),troops,'unapproved automatic recruitment');
  const keys=row.entries.map(e=>e.key).filter(Boolean);assert.equal(new Set(keys).size,keys.length,'duplicate posting');
 }}finally{Math.random=rng;}
});
