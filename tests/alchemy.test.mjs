import test from 'node:test';
import assert from 'node:assert/strict';
import {newGame,validateSave,advance,roomBlock} from '../src/game.mjs';
import {alchemyAction,settleAlchemy,validateAlchemy,drugEffect,RECIPES} from '../src/alchemy.mjs';
import {persistCandidate} from '../src/persistence.mjs';
const start=()=>{const s=newGame('丹房验收');s.phase=2;return s;};
const act=(s,command)=>alchemyAction(s,command).state;
function ready(key='AB'){let s=act(start(),{kind:'brew',herbs:[...key]});for(let i=0;i<3;i++)advance(s);s.phase=2;return s;}
test('20 formulas and starter/legacy migration',()=>{assert.equal(RECIPES.length,20);const s=start();assert.ok(Object.values(s.alchemy.herbs).every(n=>n===1));delete s.alchemy;assert.ok(Object.values(validateSave(s).alchemy.herbs).every(n=>n===0));});
test('brew is atomic, consumes once; maturation and reload are idempotent',()=>{let s=start();assert.throws(()=>act(s,{kind:'brew',herbs:['A','A']}));assert.equal(s.alchemy.herbs.A,1);s=act(s,{kind:'brew',herbs:['B','A']});assert.equal(s.stats.energy,190);assert.equal(s.alchemy.herbs.A,0);assert.throws(()=>act(s,{kind:'brew',herbs:['C']}));advance(s);advance(s);assert.equal(s.alchemy.batches.length,0);s=validateSave(JSON.parse(JSON.stringify(s)));advance(s);assert.equal(s.alchemy.batches[0].quantity,2);settleAlchemy(s,()=>0);assert.equal(s.alchemy.batches.length,1);assert.equal(s.alchemy.furnace,null);validateSave(s);});
test('test, discovery, capped consumption and discard',()=>{let s=ready();s=act(s,{kind:'test',id:1});assert.equal(s.alchemy.batches[0].quantity,1);assert.ok(s.alchemy.known.includes('AB'));s.stats.energy=180;s=act(s,{kind:'take',id:1});assert.equal(s.stats.energy,200);assert.equal(s.alchemy.batches.length,0);assert.match(s.alchemy.history[0],/体力\+20/);s=ready();assert.throws(()=>act(s,{kind:'discard',id:1,quantity:2}));s=act(s,{kind:'discard',id:1,quantity:2,confirm:true});assert.equal(s.alchemy.batches.length,0);});
test('unknown harmful medicine requires confirmation and never kills',()=>{let s=ready('G');assert.throws(()=>act(s,{kind:'take',id:1}));s.stats.life=1;s.stats.health=5;s=act(s,{kind:'take',id:1,confirm:true});assert.equal(s.stats.life,1);assert.equal(s.stats.health,0);validateSave(s);});
test('all effects honor caps; aging decreases life dose without changing age',()=>{const s=start();s.stats.maxEnergy=499;assert.deepEqual(drugEffect(s,'capacity'),{maxEnergy:1});for(const k of ['wisdom','martial','charm','talent'])s.stats[k]=499;assert.ok(Object.values(drugEffect(s,'abilities')).every(n=>n===1));const young=drugEffect(s,'life7').life;s.stats.age=80;assert.ok(drugEffect(s,'life7').life<young);s.stats.life=s.stats.lifeLimit;assert.equal(drugEffect(s,'life7').life,0);let r=ready('ABCDEFH');r=act(r,{kind:'test',id:1});const age=r.stats.age,life=r.stats.life;r=act(r,{kind:'take',id:1});assert.equal(r.stats.age,age);assert.equal(r.stats.life,life+120);});
test('time, energy, ended reign and inventory guards',()=>{let s=start();s.phase=1;assert.match(roomBlock(s,'alchemy'),/午时/);assert.throws(()=>act(s,{kind:'brew',herbs:['A']}));s.phase=2;s.stats.energy=9;assert.throws(()=>act(s,{kind:'brew',herbs:['A']}));s.stats.energy=200;s.alchemy.herbs.A=0;assert.throws(()=>act(s,{kind:'brew',herbs:['A']}));s.stats.life=0;assert.throws(()=>act(s,{kind:'test',id:1}));});
test('tribute eligible country only, at most one per turn',()=>{const s=start();const foreignRoll=()=>{let first=true;return ()=>{if(first){first=false;return .99;}return 0;};};const home=s.domestic.playerCountryId;for(const r of s.domestic.diplomacy)r.friendship=0;const r=s.domestic.diplomacy.find(r=>r.countryIds.includes(home)&&s.domestic.countries.find(c=>c.id===r.countryIds.find(id=>id!==home))?.provinceIds.length);r.friendship=95;r.relation='none';s.turn++;settleAlchemy(s,foreignRoll());assert.equal(s.alchemy.herbs.A,2);settleAlchemy(s,foreignRoll());assert.equal(s.alchemy.herbs.A,2);r.relation='hostile';s.turn++;settleAlchemy(s,foreignRoll());assert.equal(s.alchemy.herbs.A,2);r.relation='none';r.friendship=94;s.turn++;settleAlchemy(s,foreignRoll());assert.equal(s.alchemy.herbs.A,2);r.friendship=100;s.domestic.countries.find(c=>c.id===r.countryIds.find(id=>id!==home)).provinceIds=[];s.turn++;settleAlchemy(s,foreignRoll());assert.equal(s.alchemy.herbs.A,2);});
test('bad saves rejected, persistence failure does not publish deduction',()=>{let s=ready();s.alchemy.batches[0].effect='life7';assert.throws(()=>validateAlchemy(s));s=ready();s.alchemy.herbs.A=-1;assert.throws(()=>validateSave(s));s=start();const candidate=act(s,{kind:'brew',herbs:['A','B']});assert.throws(()=>persistCandidate(s,candidate,{setItem(){throw Error('full');}}));assert.equal(s.alchemy.herbs.A,1);assert.equal(s.alchemy.furnace,null);});
test('identification propagates to older batches with the same recipe',()=>{let s=ready();s.alchemy.herbs.A=1;s.alchemy.herbs.B=1;s=act(s,{kind:'brew',herbs:['A','B']});for(let i=0;i<3;i++)advance(s);s.phase=2;s=act(s,{kind:'test',id:2});assert.ok(s.alchemy.batches.every(b=>b.identified));validateSave(s);});
test('domestic tribute uses one low-probability national roll with current ownership',()=>{
 const s=start();for(const r of s.domestic.diplomacy)r.friendship=0;
 const home=s.domestic.playerCountryId,owned=s.domestic.provinces.filter(p=>p.countryId===home);
 const province=owned.at(-1),before={...s.alchemy.herbs};let rolls=[.049,.999,.999];s.turn++;
 settleAlchemy(s,()=>rolls.shift()??.99);
 assert.equal(s.alchemy.herbs.H,before.H+1);assert.equal(Object.values(s.alchemy.herbs).reduce((a,b)=>a+b,0),9);assert.match(s.alchemy.history[0],new RegExp(province.name+'进贡炽火蛙'));
 settleAlchemy(s,()=>0);assert.equal(s.alchemy.herbs.H,before.H+1);
 s.turn++;settleAlchemy(s,()=>.05);assert.equal(Object.values(s.alchemy.herbs).reduce((a,b)=>a+b,0),9);
 // A lost province is not a possible source, even when first in the old order.
 owned[0].countryId='other';s.turn++;settleAlchemy(s,()=>0);assert.match(s.alchemy.history[0],new RegExp(owned[1].name+'进贡'));
 for(const p of s.domestic.provinces)p.countryId='other';s.turn++;settleAlchemy(s,()=>0);assert.equal(Object.values(s.alchemy.herbs).reduce((a,b)=>a+b,0),10);
});
test('domestic tribute coexists with foreign gifts and respects caps and end of reign',()=>{
 const s=start(),home=s.domestic.playerCountryId;const r=s.domestic.diplomacy.find(r=>r.countryIds.includes(home));r.friendship=100;r.relation='none';s.turn++;settleAlchemy(s,()=>0);assert.equal(s.alchemy.herbs.A,3);
 s.alchemy.herbs.A=1000000;s.turn++;settleAlchemy(s,()=>0);assert.equal(s.alchemy.herbs.A,1000000);
 s.alchemy.herbs.A=0;s.stats.life=0;s.turn++;settleAlchemy(s,()=>0);assert.equal(s.alchemy.herbs.A,0);
});
