import test from 'node:test';import assert from 'node:assert/strict';
import {newGame,advance,validateSave} from '../src/game.mjs';
import {initializeResourceEconomy} from '../src/province-resources.mjs';import {initializeNewLocalAutonomy} from '../src/local-autonomy.mjs';import {enableOfficialProduction} from '../src/official-production.mjs';
import {executeKitCommand} from '../src/troop-kit-world.mjs';import {projectScheduledEconomy} from '../src/economy-projection.mjs';
import {startCampaign} from '../src/foreign-strategy.mjs';import {CAMPAIGN_SUPPLY} from '../src/military-costs.mjs';
const setup=()=>{const s=newGame('军费连旬');initializeResourceEconomy(s.domestic);initializeNewLocalAutonomy(s.domestic);enableOfficialProduction(s.domestic,1);return s;};
test('foreign new-rule mobilization pays the common silver and grain rates once, and insufficient provisions reject before payment',()=>{
 const s=setup();s.turn=37;const d=s.domestic,a=d.countries.find(c=>c.id==='xi'),p=d.provinces.find(p=>p.id==='xi-core'),cash=a.fiscal.treasury,grain=a.fiscal.grain;
 const c=startCampaign(d,'xi','hebei',37);assert.equal(cash-a.fiscal.treasury,Math.ceil(c.attack.soldiers*CAMPAIGN_SUPPLY.silverPerSoldier));assert.equal(grain-a.fiscal.grain,Math.ceil(c.attack.soldiers*CAMPAIGN_SUPPLY.grainPerSoldier));
 const saved=validateSave(JSON.parse(JSON.stringify(s))),before=JSON.stringify(saved);assert.throws(()=>startCampaign(saved.domestic,'xi','hebei',37),/未结/);assert.equal(JSON.stringify(saved),before);
 const low=setup();low.turn=37;low.domestic.countries.find(c=>c.id==='xi').fiscal.grain=0;const oldCash=low.domestic.countries.find(c=>c.id==='xi').fiscal.treasury;assert.throws(()=>startCampaign(low.domestic,'xi','hebei',37),/军需储备/);assert.equal(low.domestic.countries.find(c=>c.id==='xi').fiscal.treasury,oldCash);assert.equal(low.domestic.strategy.pending,null);
});
for(const amount of [0,100,1000,2000])test(`expansion ${amount}: forty complete turns preserve forecast, grain accounts and soldiers through reload`,t=>{
 let s=setup();if(amount)s=executeKitCommand(s,{kind:'recruit',sourceId:'central',amount,id:s.domestic.troopKits.nextId}).state;
 const originalIds=s.domestic.provinces.filter(p=>p.countryId==='sheng').map(p=>p.id),ownership=[];let foreignRecruited=0;
 const troops=s.domestic.provinces.filter(p=>p.countryId==='sheng').reduce((n,p)=>n+p.population.professions.soldiers,0),rng=Math.random,rows=[];Math.random=()=>.5;
 try{for(let i=0;i<40;i++){
 const before=JSON.stringify(s),owners=new Map(s.domestic.provinces.filter(p=>originalIds.includes(p.id)).map(p=>[p.id,p.countryId])),q=projectScheduledEconomy(s);assert.ok(q.available);assert.equal(JSON.stringify(s),before);advance(s);s=validateSave(JSON.parse(JSON.stringify(s)));
 const c=s.domestic.countries.find(c=>c.id==='sheng'),row=c.ledger.find(r=>r.turn===s.turn&&!r.legacy),reward=row.entries.filter(e=>e.key?.startsWith('auspice:')).reduce((n,e)=>n+(e.income??0)-(e.expenditure??0),0);
 assert.equal(s.stats.treasury-reward,q.cash.closing);for(const p of q.provinces)assert.deepEqual(s.domestic.provinces.find(x=>x.id===p.id).resourceSettlement,p.resource);
 for(const p of s.domestic.provinces.filter(p=>originalIds.includes(p.id)&&p.countryId!=='sheng')){const ledger=s.domestic.countries.find(c=>c.id===p.countryId).ledger.find(r=>r.turn===s.turn&&!r.legacy),entry=ledger?.entries.find(e=>e.key===`strategy:${s.turn}:${p.id}:recruit`);if(entry){assert.equal(entry.expenditure%4,0);foreignRecruited+=entry.expenditure/4;}}assert.equal(s.domestic.provinces.filter(p=>originalIds.includes(p.id)).reduce((n,p)=>n+p.population.professions.soldiers,0),troops+foreignRecruited,`registered soldiers turn ${s.turn}`);for(const p of s.domestic.provinces.filter(p=>originalIds.includes(p.id)&&owners.get(p.id)!==p.countryId)){ownership.push({turn:s.turn,provinceId:p.id,from:owners.get(p.id),to:p.countryId,soldiers:p.population.professions.soldiers});assert.ok(s.domestic.justice.history.some(h=>String(h).includes(p.name)&&String(h).includes('叛乱')),`ownership explanation ${p.id}`);}assert.equal(new Set(row.keys).size,row.keys.length);
 rows.push({turn:s.turn,cash:s.stats.treasury,debt:c.fiscal.debt,grain:q.grain.closing});
 }}finally{Math.random=rng;}
 t.diagnostic(JSON.stringify({amount,foreignRecruited,ownership,rows}));
});
test('unfunded large expansion fails atomically rather than borrowing for enlistment',()=>{const s=setup(),before=JSON.stringify(s);assert.throws(()=>executeKitCommand(s,{kind:'recruit',sourceId:'central',amount:5000,id:s.domestic.troopKits.nextId}),/国库不足/);assert.equal(JSON.stringify(s),before);});

test('allied march provisions are paid by the ally source, with no free march when grain is empty',async()=>{
 const {alliedExpedition}=await import('../src/foreign-strategy.mjs');const {relationBetween}=await import('../src/diplomacy.mjs');
 const s=setup(),d=s.domestic;relationBetween(d,'nanzhao','sheng').relation='defense';const ally=d.countries.find(c=>c.id==='nanzhao'),p=d.provinces.find(p=>p.countryId==='nanzhao'),cash=ally.fiscal.treasury,grain=ally.fiscal.grain;
 const fs=alliedExpedition(d,'xi','sheng',1,'budget-test'),f=fs.find(f=>f.countryId==='nanzhao');assert.ok(f);assert.equal(cash-ally.fiscal.treasury,Math.ceil(f.soldiers*CAMPAIGN_SUPPLY.silverPerSoldier));assert.equal(grain-ally.fiscal.grain,Math.ceil(f.soldiers*CAMPAIGN_SUPPLY.grainPerSoldier));
 const low=setup();relationBetween(low.domestic,'nanzhao','sheng').relation='defense';low.domestic.countries.find(c=>c.id==='nanzhao').fiscal.grain=0;const old=low.domestic.countries.find(c=>c.id==='nanzhao').fiscal.treasury;assert.ok(!alliedExpedition(low.domestic,'xi','sheng',1,'empty-test').some(f=>f.countryId==='nanzhao'));assert.equal(low.domestic.countries.find(c=>c.id==='nanzhao').fiscal.treasury,old);
});
