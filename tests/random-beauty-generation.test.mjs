import test from 'node:test';
import assert from 'node:assert/strict';
import {generateBeauty,rollBeautyStat,RANDOM_BEAUTY_TIERS} from '../src/random-beauty-generation.mjs';
import {portraitRandom} from '../src/beauty-portrait.mjs';
import {newGame,validateSave} from '../src/game.mjs';
import {encounter,palaceAction} from '../src/emperor.mjs';
import {companionRecovery} from '../src/emperor-rules.mjs';
test('both independent stat distributions have exact tier weights and inclusive ranges',()=>{
 for(const key of ['appearance','ability']){
 const counts=RANDOM_BEAUTY_TIERS.map(()=>0);
 for(let i=0;i<1000;i++)for(const edge of [0,.999999]){let n=0;const value=rollBeautyStat(key,()=>n++===0?(i+.5)/1000:edge);const tier=RANDOM_BEAUTY_TIERS.findIndex(t=>value>=t[key][0]&&value<=t[key][1]);assert.ok(tier>=0);counts[tier]++;}
 assert.deepEqual(counts,RANDOM_BEAUTY_TIERS.map(t=>t.weight*2));
 }
 const random=portraitRandom(15),pairs=Array.from({length:1000},(_,i)=>generateBeauty({id:`random-beauty-1-${i}`,random}));
 assert.ok(pairs.some(p=>p.appearance<65&&p.baseAbility>=110));assert.ok(pairs.some(p=>p.appearance>=80&&p.baseAbility<70));
});
test('summoning exceeds the former roster, preserves stats after rest and survives reload',()=>{
 let s=newGame('实时生成');s.harem.portraitSeed=345;
 const ids=new Set();
 for(let i=0;i<1200;i++){s.harem.encounter=null;const p=encounter(s);assert.ok(!ids.has(p.id));ids.add(p.id);if(i%300===0)validateSave(JSON.parse(JSON.stringify(s)));}
 while(!s.harem.encounter.randomBeauty){s.harem.encounter=null;encounter(s);}
 const before=structuredClone(s.harem.encounter);assert.equal(encounter(s),s.harem.encounter);
 s=palaceAction(s,'arrange').state;assert.equal(s.harem.encounter.ability,before.baseAbility);assert.equal(s.harem.encounter.appearance,before.appearance);
 s=palaceAction(s,'admit',{rank:null}).state;
 const saved=validateSave(JSON.parse(JSON.stringify(s))),p=saved.harem.members.find(p=>p.id===before.id);
 assert.equal(p.baseAbility,before.baseAbility);assert.equal(companionRecovery(p),p.baseAbility+p.experience+5);
 s.harem.encounter=null;encounter(s);s=palaceAction(s,'dismiss').state;validateSave(JSON.parse(JSON.stringify(s)));
 assert.ok(s.harem.seen.length<100);
});
