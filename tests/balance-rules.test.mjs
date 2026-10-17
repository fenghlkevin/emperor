import test from 'node:test';
import assert from 'node:assert/strict';
import {newGame,validateSave,advance,leaveRoom,sleepUntilNextTurn,resolveExhaustion} from '../src/game.mjs';
import {palaceAction} from '../src/emperor.mjs';
import {grainStorage} from '../src/grain-storage.mjs';
import {foodForecast,recordFoodSettlement,validateRelief,executeRelief} from '../src/food-relief.mjs';
import {createDomestic,countrySummary,settleDomestic} from '../src/domestic.mjs';
import {commerceMultiplier,welfareValue,settleBuildingEffects} from '../src/building-effects.mjs';
import {quoteKitPurchase,TROOP_KITS} from '../src/troop-kits.mjs';
import {persistCandidate} from '../src/persistence.mjs';

const home=s=>s.domestic.countries.find(c=>c.id==='sheng');
test('normal daily schedule and skip consume the same one-turn lifespan, including a year boundary',()=>{
 const a=newGame('普通作息'),b=structuredClone(a);a.turn=b.turn=36;
 a.phase=5;const night=palaceAction(a,'sleep').state;assert.equal(night.stats.life,a.stats.life);leaveRoom(night);sleepUntilNextTurn(b);
 assert.equal(night.turn,37);assert.equal(night.stats.age,21);assert.equal(night.stats.life,2159);assert.equal(b.stats.life,night.stats.life);assert.equal(b.stats.age,night.stats.age);
 const tired=newGame('过劳');tired.stats.energy=0;resolveExhaustion(tired);assert.equal(tired.stats.life,2129);assert.equal(tired.turn,2);
});
test('normal companionship is free of extra age loss but repetition retains a clear penalty',t=>{
 t.mock.method(Math,'random',()=>.99);let s=newGame('相伴');s.phase=5;const id=s.harem.members[0].id;
 s=palaceAction(s,'company',{id}).state;assert.equal(s.stats.life,2160);
 s=palaceAction(s,'company',{id}).state;assert.equal(s.stats.life,2158);
});
test('balance normalization preserves old resources, exhausted reigns and historical supply snapshots',()=>{
 const s=newGame('旧进度');delete s.balanceRulesVersion;s.stats.life=777;s.stats.age=45;
 const balances=s.domestic.countries.map(c=>[c.fiscal.treasury,c.fiscal.debt]),grain=s.domestic.provinces.map(p=>p.welfare.grainReserve),kits=structuredClone(s.domestic.troopKits);
 const n=validateSave(s);assert.equal(n.balanceRulesVersion,1);assert.equal(n.stats.life,777);assert.equal(n.stats.age,45);assert.deepEqual(n.domestic.countries.map(c=>[c.fiscal.treasury,c.fiscal.debt]),balances);assert.deepEqual(n.domestic.provinces.map(p=>p.welfare.grainReserve),grain);assert.deepEqual(n.domestic.troopKits,kits);
 assert.deepEqual(validateSave(structuredClone(n)),n);const bad=structuredClone(n);bad.balanceRulesVersion=2;assert.throws(()=>validateSave(bad),/平衡规则版本/);
 n.stats.life=0;const ended=validateSave(n);assert.equal(ended.stats.life,0);assert.ok(ended.reignResult);
});
test('market recovery has diminishing production impact and cannot compound past ten percent',()=>{
 const p=newGame('市集').domestic.provinces[0],base=p.buildingEffects.baselineActivity;p.welfare.activity=base+6;
 assert.equal(commerceMultiplier(p),1.01);p.welfare.activity=100;assert.ok(commerceMultiplier(p)<=1.1);
 const prior=commerceMultiplier(p);for(let turn=2;turn<200;turn++)settleBuildingEffects(p,turn,true,false);assert.equal(commerceMultiplier(p),prior);
});
test('prosperity services are counted once in the same budget used by settlement',()=>{
 const d=createDomestic(),q=countrySummary(d),plain=structuredClone(d);
 for(const p of plain.provinces)p.status.livingStandard=50;
 const baseline=countrySummary(plain);assert.ok(q.publicServiceCost>0);assert.equal(baseline.publicServiceCost,0);
 const expected=q.net,opening=q.country.fiscal.treasury;d.disasters.lastTurn=2;settleDomestic(d,2);
 assert.equal(q.country.fiscal.treasury,Math.max(0,opening+expected));assert.equal(q.country.ledger[0].income-q.country.ledger[0].expenditure,expected);
});
test('safe stock is preserved, excess grain decays once and new granaries activate next turn',()=>{
 const s=newGame('储粮'),p=s.domestic.provinces[0];const safe=grainStorage(p,2).protectedStock;
 p.welfare.grainReserve=safe;assert.equal(grainStorage(p,2).storageLoss,0);
 p.welfare.grainReserve=safe+1000;assert.equal(grainStorage(p,2).storageLoss,80);
 const forecast=foodForecast(p,1);const supply=recordFoodSettlement(p,2,p.welfare.grainReserve,forecast.produced,forecast.need);
 assert.equal(supply.storageLoss,80);assert.equal(supply.closing,forecast.closing);assert.equal(supply.opening+ supply.produced,supply.consumed+ supply.closing+ supply.storageLoss);validateRelief(s.domestic,2);
 p.buildings.granaries++;p.buildingEffects.pending={building:'granaries',completedTurn:2,effectiveTurn:3};assert.equal(grainStorage(p,2).protectedStock,safe);assert.ok(grainStorage(p,3).protectedStock>safe);
});
test('grain spoilage is idempotent, rejects corrupt arithmetic and rolls back with failed persistence',()=>{
 const s=newGame('陈粮'),p=s.domestic.provinces[0];p.welfare.grainReserve=grainStorage(p,2).protectedStock+1000;s.domestic.disasters.lastTurn=2;
 const next=structuredClone(s);advance(next);assert.ok(next.domestic.provinces[0].foodRelief.lastSettlement.storageLoss>0);
 const once=JSON.stringify(next);settleDomestic(next.domestic,2);assert.equal(JSON.stringify(next),once);
 const bad=structuredClone(next);bad.domestic.provinces[0].foodRelief.lastSettlement.storageLoss++;assert.throws(()=>validateSave(bad),/粮食救济存档/);
 const before=JSON.stringify(s);assert.throws(()=>persistCandidate(s,next,{setItem(){throw Error('quota');}}),/保存失败/);assert.equal(JSON.stringify(s),before);
});
test('opening treasury can buy a meaningful basic company without eliminating premium and origin restrictions',()=>{
 assert.equal(quoteKitPurchase({infantry:100},'sheng').cost,1200);assert.equal(quoteKitPurchase({spears:100},'sheng').cost,1000);assert.equal(quoteKitPurchase({'heavy-cavalry':100},'sheng').cost,4000);
 assert.equal(quoteKitPurchase({elephant:100},'india').cost,6000);assert.throws(()=>quoteKitPurchase({elephant:100},'sheng'),/产地/);
 const p=TROOP_KITS.find(k=>k.id==='infantry').price;assert.ok(TROOP_KITS.find(k=>k.id==='heavy-cavalry').price>p*3);
});
test('full natural lifetime reaches age eighty and an eligible heir starts with the same age-to-life scale',async()=>{
 const {succeedDynasty}=await import('../src/national-actions.mjs');const s=newGame('六十年历法');s.dynasty.heirId='prince-1';
 // Calendar/lineage isolation: foreign invasions are covered by real-start audits.
 for(const r of s.domestic.diplomacy)r.relation='nonaggression';
 for(let i=0;i<2160;i++){sleepUntilNextTurn(s);assert.equal(s.turn,i+2);}
 assert.equal(s.stats.age,80);assert.equal(s.stats.life,0);assert.ok(s.reignResult);
 const next=succeedDynasty(s);assert.equal(next.stats.life,(80-next.stats.age)*36);assert.ok(next.stats.life>0);assert.equal(next.dynasty.pastReigns.length,1);validateSave(next);
});
