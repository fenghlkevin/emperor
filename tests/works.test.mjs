import test from 'node:test';import assert from 'node:assert/strict';
import {createDomestic,migrateDomestic,validateDomestic,countrySummary,grainSecurity,outputFor} from '../src/domestic.mjs';
import {worksSummary,worksProvince,WORKS_BUILDINGS} from '../src/works.mjs';
import {newGame,validateSave,advance} from '../src/game.mjs';
test('works building totals use the same provincial registers as domestic reports',()=>{
 const d=createDomestic();d.provinces[0].buildings.temples=101;
 const s=worksSummary(d);assert.equal(s.provinces.length,10);assert.equal(WORKS_BUILDINGS.length,7);assert.equal(s.buildings.temples,101+d.provinces.slice(1,10).reduce((n,p)=>n+p.buildings.temples,0));assert.deepEqual(s.buildings,countrySummary(d).buildings);assert.equal(s.buildingTotal,Object.values(s.buildings).reduce((n,v)=>n+v,0));
});
test('special buildings count actual records and stay within the chosen country',()=>{
 const d=createDomestic();assert.equal(worksSummary(d).specialTotal,0);
 d.provinces[0].specialBuildings=[{id:'canal',name:'运河',count:2,description:'水运工程'}];d.provinces[1].specialBuildings=[{id:'bridge',name:'石桥',count:3,description:''}];d.provinces.find(p=>p.countryId==='rome').specialBuildings=[{id:'port',name:'港口',count:9,description:''}];
 validateDomestic(d);assert.equal(worksSummary(d).specialTotal,5);assert.equal(worksSummary(d).specialBuildings[0].provinceName,'河北');assert.equal(worksSummary(d,'rome').specialTotal,9);
});
test('welfare, workers, development and output agree with shared economic calculations',()=>{
 const d=createDomestic(),p=d.provinces[0];d.countries[0].fiscal.grain=0;p.economy.industry.developedArea=0;
 const detail=worksProvince(p,d);assert.equal(detail.grainSecurity,grainSecurity(p));assert.equal(detail.grainSecurity,0);
 assert.equal(detail.industries.find(i=>i.key==='agriculture').workers,p.population.professions.farmers);assert.equal(detail.industries.find(i=>i.key==='industry').developmentRate,0);assert.equal(detail.industries.find(i=>i.key==='industry').output,0);for(const row of detail.industries)assert.equal(row.output,outputFor(p,row.key));
});
test('invalid special records rejected; querying and settlement preserve inventory',()=>{
 for(const entry of [{id:'x',name:'桥',description:'',count:-1},{id:'x',name:'桥',description:'',count:0},{id:'x',name:'桥',description:'',count:1.5},{id:'x',name:'',description:'',count:1}]){const d=createDomestic();d.provinces[0].specialBuildings=[entry];assert.throws(()=>validateDomestic(d));}
 const bad=createDomestic();bad.provinces[0].specialBuildings=Array(2).fill({id:'x',name:'桥',description:'',count:1});assert.throws(()=>validateDomestic(bad));
 const s=newGame('营造帝');s.domestic.provinces[0].specialBuildings=[{id:'bridge',name:'石桥',count:1,description:'通行设施'}];const before=JSON.stringify(s);worksSummary(s.domestic);worksProvince(s.domestic.provinces[0]);assert.equal(JSON.stringify(s),before);advance(s);const next=validateSave(JSON.parse(JSON.stringify(s)));assert.equal(worksSummary(next.domestic).specialTotal,1);
});
