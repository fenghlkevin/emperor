import test from 'node:test';
import assert from 'node:assert/strict';
import {ACTIVE_HISTORICAL_PEOPLE,RANDOM_ABILITY_CAPS} from '../src/exam.mjs';
import {HISTORICAL_PEOPLE} from '../src/historical-people.mjs';
import {HISTORICAL_RATINGS} from '../src/historical-ratings.mjs';
import fs from 'node:fs';
import {newGame,validateSave} from '../src/game.mjs';
import {executePersonnel,settlePersonnel} from '../src/personnel-actions.mjs';
const person=name=>HISTORICAL_PEOPLE.find(p=>p.name===name);
test('all 2481 individuals have explicit five-axis designs, with no generic fallback rows',()=>{
 const cards=JSON.parse(fs.readFileSync(new URL('../src/historical-designs.json',import.meta.url),'utf8'));
 assert.equal(Object.keys(cards).length,2481);
 for(const p of HISTORICAL_PEOPLE){const card=cards[p.id];assert.ok(card,p.id);assert.equal(card.name,p.name);assert.equal(p.ratingStatus,'逐人设定');for(const k of ['intelligence','martial','leadership','politics','integrity']){assert.equal(p[k],card[k]);assert.ok(card.dimensionEvidence[k].every(e=>e.reason&&e.quote),p.name+' '+k);}assert.ok(!p.ratingBasis.includes('未作个人定评'));}
 assert.ok(new Set(HISTORICAL_PEOPLE.map(p=>[p.intelligence,p.martial,p.leadership,p.politics,p.integrity].join(','))).size>700);
});
test('reviewed cases distinguish history, same-name identities, charitable officials and corrupt ministers',()=>{
 assert.ok(person('刘宰').integrity>90);assert.ok(person('刘宰').politics>80);
 assert.ok(person('史弥远').politics>85);assert.ok(person('史弥远').integrity<20);
 assert.ok(person('高顺').martial>85);assert.ok(person('高顺').integrity>90);
 assert.ok(person('司马错').leadership>90);assert.ok(person('陈泰').leadership>90);
 assert.ok(person('张苞').martial<70);assert.ok(person('张苞').leadership<60);
 assert.ok(!person('刘爚').biography.includes('刘熻'));
});
test('every profile has five designed scores, a biography and visible provenance',()=>{
 for(const p of HISTORICAL_PEOPLE){
  for(const key of ['intelligence','martial','leadership','politics','integrity'])assert.ok(Number.isInteger(p[key])&&p[key]>=0&&p[key]<=100,p.name+' '+key);
  assert.ok(p.biography.length>15,p.name);assert.ok(p.ratingBasis.length>20,p.name);assert.ok(p.source.startsWith('https://'),p.name);assert.equal(p.ratingVersion,5);
 }
 assert.equal(new Set(HISTORICAL_RATINGS.map(p=>p.name)).size,HISTORICAL_RATINGS.length);
});
test('scholarship, martial prowess, command and integrity no longer collapse into random rankings',()=>{
 assert.ok(person('朱熹').intelligence>90);assert.ok(person('朱熹').martial<20);
 assert.ok(person('苏轼').martial<30);assert.ok(person('王安石').politics>90);
 for(const name of ['孙膑','陈庆之','韦睿']){assert.ok(person(name).martial<40);assert.ok(person(name).leadership>90);}
 assert.ok(person('典韦').martial>95);assert.ok(person('典韦').politics<30);
 assert.ok(person('秦桧').intelligence>80);assert.ok(person('秦桧').integrity<15);assert.ok(person('秦桧').tags.includes('奸臣'));
 assert.ok(person('和珅').politics>85);assert.ok(person('和珅').integrity<5);
 assert.ok(person('于谦').integrity>95);assert.ok(person('海瑞').integrity>95);
});
test('new examinations randomize selection but preserve historical attributes and stable starting values',()=>{
 const start=executePersonnel(newGame('帝'),{kind:'exam',id:1}).state;
 for(const roll of [0,.23,.999]){const state=structuredClone(start);settlePersonnel(state.domestic,2,()=>roll);for(const p of state.domestic.personnel.candidates){if(p.generated){for(const [key,cap] of Object.entries(RANDOM_ABILITY_CAPS))assert.ok(p[key]<=cap);continue;}const source=ACTIVE_HISTORICAL_PEOPLE.find(x=>x.id===p.id);for(const key of ['intelligence','martial','leadership','politics','integrity','biography'])assert.deepEqual(p[key],source[key]);assert.equal(p.age,source.initialAge);assert.equal(p.loyalty,source.initialLoyalty);assert.equal(p.experience,source.initialExperience);}validateSave(state);}
});
test('legacy recruits get new historical ratings without losing appointments, awards or loyalty',()=>{
 const state=newGame('帝'),p=person('苏轼');state.domestic.justice.officials.push({...p,id:'recruit-'+p.id,positionId:null,office:'待命',provinceId:null,age:42,loyalty:97,experience:91,rank:5,nobilityLevel:3,status:'serving',discovered:false,plotTurn:null,martial:96,ratingVersion:1});
 const next=validateSave(state),recruit=next.domestic.justice.officials.at(-1);assert.equal(recruit.martial,p.martial);assert.equal(recruit.loyalty,97);assert.equal(recruit.experience,91);assert.equal(recruit.rank,5);assert.equal(recruit.nobilityLevel,3);
});
