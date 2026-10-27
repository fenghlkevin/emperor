import test from 'node:test';
import assert from 'node:assert/strict';
import {ensureOfficialGrowth,validateOfficialGrowth,randomPotentialTier,STUDY_KEYS,gainOfficialAbility} from '../src/official-growth.mjs';
const person=i=>({id:`random-${i}-0`,generated:true,intelligence:40,martial:30,leadership:35,politics:38,integrity:50});
test('random potential tiers are rare, differentiated, immutable and stable after hiring',()=>{
 const counts={ordinary:0,talented:0,exceptional:0,legendary:0};
 for(let i=0;i<20000;i++){
  const p=person(i),tier=randomPotentialTier(p);counts[tier]++;ensureOfficialGrowth(p);validateOfficialGrowth(p);
  const caps=p.potential.caps;assert.equal(p.potential.version,3);assert.equal(caps.integrity,50);
  assert.ok(STUDY_KEYS.every(k=>caps[k]>=p[k]));
  if(tier==='ordinary')assert.ok(STUDY_KEYS.every(k=>caps[k]<=70));
  if(tier==='talented')assert.ok(STUDY_KEYS.every(k=>caps[k]<=85));
  if(tier==='exceptional'){assert.ok(caps.intelligence>=90&&caps.intelligence<=95);assert.ok(STUDY_KEYS.filter(k=>caps[k]>=90).length===1);}
  if(tier==='legendary'){const elite=STUDY_KEYS.filter(k=>caps[k]>=95);assert.ok(elite.length===2||elite.length===3);assert.ok(elite.every(k=>caps[k]<=100));}
  const frozen=structuredClone(p.potential);p.id='recruit-'+p.id;gainOfficialAbility(p,'intelligence',100);ensureOfficialGrowth(p);validateOfficialGrowth(p);assert.deepEqual(p.potential,frozen);assert.equal(p.intelligence,caps.intelligence);
 }
 assert.ok(counts.ordinary/20000>.88&&counts.ordinary/20000<.92);
 assert.ok(counts.talented/20000>.08&&counts.talented/20000<.10);
 assert.ok(counts.exceptional/20000>.006&&counts.exceptional/20000<.012);
 assert.ok(counts.legendary/20000>.0004&&counts.legendary/20000<.0017);
});
test('version one saved caps stay valid and new caps cannot be edited',()=>{
 const p=person(91),base=Object.fromEntries([...STUDY_KEYS,'integrity'].map(k=>[k,p[k]]));
 const margin=k=>5+[...p.id+':'+k].reduce((n,c)=>(Math.imul(n,31)+c.charCodeAt(0))>>>0,0)%16;
 p.potential={version:1,base,caps:Object.fromEntries(Object.entries(base).map(([k,v])=>[k,Math.min(v<40?50:80,v+margin(k))]))};
 const snapshot=structuredClone(p.potential);ensureOfficialGrowth(p);validateOfficialGrowth(p);assert.deepEqual(p.potential,snapshot);
 const q=person(8);ensureOfficialGrowth(q);q.potential.caps.martial++;assert.throws(()=>validateOfficialGrowth(q),/上限/);
 const strong={...person(1),intelligence:85};ensureOfficialGrowth(strong);assert.ok(strong.potential.caps.intelligence>=85);
});

test('existing version two rare potential remains single-specialty after fourth tier is added',()=>{
 let p;for(let i=0;i<20000;i++)if(randomPotentialTier(person(i))==='legendary'){p=person(i);break;}
 assert.ok(p);assert.equal(randomPotentialTier(p,2),'exceptional');ensureOfficialGrowth(p);
 const base=p.potential.base,id=p.id,roll=key=>{let n=2166136261;for(const c of id+':'+key)n=Math.imul(n^c.charCodeAt(0),16777619)>>>0;n=Math.imul(n^(n>>>16),0x7feb352d);n=Math.imul(n^(n>>>15),0x846ca68b);return ((n^(n>>>16))>>>0)/4294967296;};
 p.potential={version:2,base,caps:Object.fromEntries(Object.entries(base).map(([k,v])=>[k,k==='integrity'?v:k==='intelligence'?90+Math.floor(roll(k)*6):Math.max(v,Math.min(85,v+15+Math.floor(roll(k)*16)))]))};
 const frozen=structuredClone(p.potential);ensureOfficialGrowth(p);validateOfficialGrowth(p);assert.equal(randomPotentialTier(p),'exceptional');assert.deepEqual(p.potential,frozen);
});
