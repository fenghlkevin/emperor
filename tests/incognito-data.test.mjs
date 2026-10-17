import test from 'node:test';
import assert from 'node:assert/strict';
import {newGame} from '../src/game.mjs';
import {INCOGNITO_PLACES,incognitoDialogue} from '../src/incognito-data.mjs';
const dialogue=(s,id)=>incognitoDialogue(s,id,()=>0).text;
function seed(){const s=newGame('微服');return s;}
const own=s=>s.domestic.provinces.filter(p=>p.countryId===s.domestic.playerCountryId);
test('tax boundaries retain the five original citizen reactions',()=>{
 const s=seed(),c=s.domestic.countries.find(c=>c.id===s.domestic.playerCountryId);
 const texts=[8,9,17,26,32].map(n=>{c.fiscal.taxRate=n/100;return dialogue(s,'tax');});assert.equal(new Set(texts).size,5);
 for(const [rate,band]of [[0,0],[8,0],[9,1],[16,1],[17,2],[25,2],[26,3],[31,3],[32,4],[40,4]]){c.fiscal.taxRate=rate/100;assert.equal(dialogue(s,'tax'),texts[band]);}
});
test('economic top bands are reachable and development remains a gate',()=>{
 const s=seed();const set=(productivity,area)=>{for(const p of own(s))for(const e of Object.values(p.economy)){e.productivity=productivity;e.developedArea=e.capacityArea*area;}};
 set(65,.8);const high=dialogue(s,'economy');assert.match(high,/遠近馳名/);
 set(57.5,.75);const second=dialogue(s,'economy');assert.match(second,/生意挺/);assert.notEqual(high,second);
 set(65,.7);assert.notEqual(dialogue(s,'economy'),high);
});
test('central soldiers already in province occupations are counted once',()=>{
 const s=seed();for(const p of own(s)){p.population.total=10000;p.population.professions.soldiers=850;}s.domestic.centralArmy.soldiers=10000;
 assert.match(dialogue(s,'army'),/少了一些/);
 for(const p of own(s))p.population.professions.soldiers=900;assert.match(dialogue(s,'army'),/衛國/);
 for(const p of own(s))p.population.professions.soldiers=1600;assert.match(dialogue(s,'army'),/暴君/);
});
test('living scale spans the original five bands at 25-point units',()=>{
 const s=seed(),texts=[];for(const n of [10,25,50,75,87.5]){for(const p of own(s))p.status.livingStandard=n;texts.push(dialogue(s,'living'));}assert.equal(new Set(texts).size,5);
 for(const [n,band]of [[0,0],[24.99,0],[25,1],[49.99,1],[50,2],[74.99,2],[75,3],[87.49,3],[87.5,4],[100,4]]){for(const p of own(s))p.status.livingStandard=n;assert.equal(dialogue(s,'living'),texts[band]);}
});
test('territory reads canonical protector direction and excludes landless states',()=>{
 const s=seed(),d=s.domestic,home=d.playerCountryId;const r=d.diplomacy.find(r=>r.countryIds.includes(home)),other=r.countryIds.find(id=>id!==home),c=d.countries.find(c=>c.id===other);
 assert.equal(own(s).length,10);r.relation='none';c.relations='protected';const base=dialogue(s,'territory');
 r.relation=r.countryIds[0]===home?'protected':'protector';assert.equal(dialogue(s,'territory'),base);
 r.relation=r.countryIds[0]===home?'protector':'protected';assert.notEqual(dialogue(s,'territory'),base);
 c.provinceIds=[];assert.equal(dialogue(s,'territory'),base);
});
test('diplomatic gossip excludes extinct countries and uses 90 when none remain',()=>{
 const s=seed(),d=s.domestic,home=d.playerCountryId;for(const r of d.diplomacy)if(r.countryIds.includes(home))r.friendship=0;
 assert.match(dialogue(s,'diplomacy'),/很差/);
 for(const c of d.countries)if(c.id!==home)c.provinceIds=[];
 assert.match(dialogue(s,'diplomacy'),/非常不錯/);
 const r=d.diplomacy.find(r=>r.countryIds.includes(home)),c=d.countries.find(c=>c.id===r.countryIds.find(id=>id!==home));c.provinceIds=['one'];r.friendship=65;
 assert.match(dialogue(s,'diplomacy'),/都還不錯/);
});
test('all thirteen queries preserve every resource and saved state',()=>{
 const s=seed(),before=structuredClone(s);assert.equal(INCOGNITO_PLACES.length,13);
 for(const p of INCOGNITO_PLACES){const result=incognitoDialogue(s,p.id,()=>.9);assert.ok(result.title);assert.ok(result.text);}assert.deepEqual(s,before);
});
