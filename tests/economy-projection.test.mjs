import test from 'node:test';
import assert from 'node:assert/strict';
import {newGame} from '../src/game.mjs';
import {initializeResourceEconomy} from '../src/province-resources.mjs';
import {projectScheduledEconomy} from '../src/economy-projection.mjs';
import {settleJustice} from '../src/justice.mjs';
import {settleDomestic} from '../src/domestic.mjs';
import {settlePersonnel} from '../src/personnel-actions.mjs';
function game(){const s=newGame('推演');initializeResourceEconomy(s.domestic);return s;}
test('scheduled projection preserves source and random stream, and repeats exactly',()=>{
 const s=game(),before=JSON.stringify(s),original=Math.random;
 try{Math.random=()=>{throw Error('projection consumed global RNG');};
 const a=projectScheduledEconomy(s);assert.deepEqual(projectScheduledEconomy(s),a);assert.equal(a.available,true);
 assert.equal(JSON.stringify(s),before);
 }finally{Math.random=original;}
});
test('scheduled projection includes recurring investigation and matches actual economy pipelines',()=>{
 const s=game();s.domestic.justice.funding=100;
 const p=projectScheduledEconomy(s),actual=structuredClone(s),turn=s.turn+1;
 settleJustice(actual.domestic,turn);settleDomestic(actual.domestic,turn);settlePersonnel(actual.domestic,turn,()=>.5,actual.stats);
 const home=actual.domestic.countries.find(c=>c.id===actual.domestic.playerCountryId);
 assert.equal(p.cash.closing,home.fiscal.treasury);
 assert.ok(p.entries.some(e=>e.reason==='每旬调查经费'&&e.expenditure===100));
 assert.equal(p.cash.opening+p.cash.income-p.cash.paid,p.cash.closing);
 assert.equal(p.grain.closing,home.fiscal.grain);
});
test('unresolved battles suppress unreliable projection',()=>{
 const s=game();s.domestic.war.battle={};assert.equal(projectScheduledEconomy(s).available,false);
});
test('scheduled projection excludes unused market allowances and includes annual tribute when due',()=>{
 const s=game();s.turn=36;
 const r=s.domestic.diplomacy.find(r=>r.countryIds.includes('sheng')&&r.countryIds.includes('rome'));
 Object.assign(r.agreement,{exports:250,imports:100,tribute:500,payerId:'sheng'});
 const p=projectScheduledEconomy(s);
 assert.ok(!p.entries.some(e=>e.reason.includes('通商出口')));
 assert.ok(!p.entries.some(e=>e.reason.includes('通商进口')));
 assert.ok(p.entries.some(e=>e.reason.includes('年度贡银')&&e.expenditure===500));
});
