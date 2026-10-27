import test from 'node:test';
import assert from 'node:assert/strict';
import {newGame,validateSave,advance} from '../src/game.mjs';
import {initializeResourceEconomy} from '../src/province-resources.mjs';
import {outputFor} from '../src/economy.mjs';
import {laborProfile} from '../src/labor.mjs';
import {industryStaffing,settleIndustryHiring} from '../src/industry-labor.mjs';
import {initializeIndustry,quoteIndustry,executeIndustry,settleIndustry} from '../src/industry.mjs';
import {cityLand,CITY_EXPANSION_LAND} from '../src/city-capacity.mjs';
import {activeDrafts,cityDraftCapacity,validateManpower} from '../src/manpower.mjs';
import {quoteKitCommand,executeKitCommand,reserveWorldKits,settleWorldKits} from '../src/troop-kit-world.mjs';
import {persistCandidate} from '../src/persistence.mjs';
import {startConstruction} from '../src/construction.mjs';
const p=s=>s.domestic.provinces[0];
const game=()=>{const s=newGame('产业军役');initializeResourceEconomy(s.domestic);s.domestic.countries[0].fiscal.treasury=1e8;s.stats.treasury=1e8;s.domestic.disasters.lastTurn=10000;return s;};
const industry=(s,c)=>executeIndustry(s,{id:s.domestic.industryActions.nextId,provinceId:p(s).id,...c});
const army=(s,c)=>executeKitCommand(s,{id:s.domestic.troopKits.nextId,sourceId:p(s).id,...c});
const roundtrip=s=>validateSave(JSON.parse(JSON.stringify(s)));
const production=s=>Object.fromEntries(['agriculture','pastoral','commerce','industry'].map(k=>[k,outputFor(p(s),k)]));

test('initial occupations and 75% labor stay unchanged; enabling industry staffing preserves all starting output',()=>{
 const s=newGame('开局');s.domestic.resourceRulesVersion=1;for(const c of s.domestic.provinces)c.resourceRulesVersion=1;
 const jobs=structuredClone(p(s).population),before=production(s);initializeResourceEconomy(s.domestic);
 assert.deepEqual(p(s).population,jobs);assert.deepEqual(production(s),before);assert.equal(laborProfile(p(s)).ratio,.75);
 for(const k of Object.keys(p(s).economy))assert.equal(industryStaffing(p(s),k).workers,industryStaffing(p(s),k).required);
 const base=structuredClone(p(s).industryLabor.base);initializeResourceEconomy(s.domestic);assert.deepEqual(p(s).industryLabor.base,base);
});

test('city expansion grows population capacity AND shared land; capped geographic land cannot be invented',()=>{
 const s=game(),before=structuredClone(s),q=quoteIndustry(s,{kind:'expand',provinceId:p(s).id}),r=industry(s,{kind:'expand'}).state;
 assert.equal(p(r).cityCapacity.land,p(s).cityCapacity.land+CITY_EXPANSION_LAND);assert.equal(q.landAfter.total,p(r).cityCapacity.land);assert.equal(p(r).cityCapacity.population,p(s).cityCapacity.population+10000);
 assert.deepEqual(p(r).population,p(s).population);assert.deepEqual(p(r).economy,p(s).economy);assert.equal(r.stats.treasury,s.stats.treasury-5000);assert.deepEqual(s,before);
 p(s).cityCapacity.land=p(s).terrainCapacity.landLimit-123;const last=industry(s,{kind:'expand'}).state;assert.equal(p(last).cityCapacity.land,p(last).terrainCapacity.landLimit);assert.throws(()=>industry(last,{kind:'expand'}),/土地上限/);
});

test('development hires corresponding idle workers on activation, not at payment or completion, without population growth',()=>{
 const s=game(),key='industry',q=quoteIndustry(s,{kind:'develop',provinceId:p(s).id,industry:key,area:500}),before=structuredClone(p(s).population),r=industry(s,{kind:'develop',industry:key,area:500}).state;
 assert.deepEqual(p(r).population,before);settleIndustry(r.domestic,2);assert.deepEqual(p(r).population,before);assert.equal(p(r).industryLabor.pending.length,1);
 r.turn=2;const loaded=roundtrip(r);settleIndustryHiring(loaded.domestic,3);assert.equal(p(loaded).population.total,before.total);assert.equal(p(loaded).population.professions.workers,q.outputs.find(x=>x.key===key).workersAfter);assert(p(loaded).population.professions.workers>before.professions.workers);
 assert.equal(outputFor(p(loaded),key,3),q.outputs.find(x=>x.key===key).after);
 const snapshot=JSON.stringify(loaded);settleIndustryHiring(loaded.domestic,3);assert.equal(JSON.stringify(loaded),snapshot);
});

test('land without labor remains partially staffed; empty positions do not produce',()=>{
 const s=game(),city=p(s);city.population.professions.militia+=laborProfile(city).available;
 const count=city.population.total,before=city.population.professions.workers;
 const r=industry(s,{kind:'develop',industry:'industry',area:500}).state;settleIndustry(r.domestic,2);settleIndustryHiring(r.domestic,3);
 const q=industryStaffing(p(r),'industry',3);assert.equal(q.workers,before);assert(q.required>q.workers);assert(q.ratio<1);assert.equal(p(r).population.total,count);
 const full=structuredClone(p(r));full.population.professions.workers=q.required;assert(outputFor(p(r),'industry',3)<outputFor(full,'industry',3));
});

test('land conversion releases donor jobs and hires the recipient from one shared pool at the same activation',()=>{
 const s=game(),total=p(s).population.total,land=cityLand(p(s)).used;
 const q=quoteIndustry(s,{kind:'convert',provinceId:p(s).id,fromIndustry:'industry',industry:'agriculture',area:500});
 const r=industry(s,{kind:'convert',fromIndustry:'industry',industry:'agriculture',area:500}).state;settleIndustry(r.domestic,2);settleIndustryHiring(r.domestic,3);
 assert.equal(p(r).population.total,total);assert.equal(cityLand(p(r)).used,land);
 for(const row of q.outputs)assert.equal(p(r).population.professions[{agriculture:'farmers',pastoral:'herders',commerce:'merchants',industry:'workers'}[row.key]],row.workersAfter);
 assert(laborProfile(p(r)).assigned<=laborProfile(p(r)).capacity);
});

test('recruitment preview shows production losses and extra running costs and stays read-only',()=>{
 const s=game(),city=p(s),amount=laborProfile(city).available+10000,before=structuredClone(s),command={kind:'recruit',sourceId:city.id,amount,draftRates:{farmers:50}};
 const q=quoteKitCommand(s,command);assert.deepEqual(s,before);assert(q.impact.delta.production<0);assert(q.impact.delta.expenses>0);assert(q.impact.delta.officialRations>0);assert.equal(q.cost,amount*4);
 assert(q.lines.some(l=>l.includes('国库银税')));assert(q.lines.some(l=>l.includes('官府口粮')));
 const r=army(s,command).state;assert.equal(p(r).population.total,city.population.total);assert.equal(p(r).population.professions.farmers,city.population.professions.farmers-10000);assert.equal(activeDrafts(r.domestic,p(r),'farmers'),10000);roundtrip(r);
});

test('soldiers and militia share the cumulative 50% quota across repeated orders and reload',()=>{
 const s=game(),city=p(s),free=laborProfile(city).available,half=Math.floor(city.population.professions.farmers/2);
 const r=army(s,{kind:'recruit',amount:free+half,draftRates:{farmers:50}}).state,loaded=roundtrip(r),before=JSON.stringify(loaded);
 assert.equal(activeDrafts(loaded.domestic,p(loaded),'farmers'),half);
 assert.throws(()=>army(loaded,{kind:'recruit',amount:1,draftRates:{farmers:50}}),/50%/);
 assert.throws(()=>industry(loaded,{kind:'levy-militia',amount:1,draftRates:{farmers:50}}),/50%/);assert.equal(JSON.stringify(loaded),before);
});

test('the aggregate 50% limit cannot be bypassed by assigning civilians to another industry',()=>{
 let s=game(),city=p(s),free=laborProfile(city).available,half=Math.floor(city.population.professions.farmers/2);
 s=army(s,{kind:'recruit',amount:free+half,draftRates:{farmers:50}}).state;city=p(s);
 const room=cityDraftCapacity(s.domestic,city);
 s=industry(s,{kind:'levy-militia',amount:room,draftRates:{herders:50,merchants:50,workers:50}}).state;
 assert.equal(cityDraftCapacity(s.domestic,p(s)),0);
 const before=JSON.stringify(s);assert.throws(()=>industry(s,{kind:'levy-militia',amount:1,draftRates:{farmers:50,workers:50,merchants:50,herders:50}}),/50%/);assert.equal(JSON.stringify(s),before);
});

test('militia has an actual enlist/dismiss operation, previews tax losses and cannot dismiss construction staff',()=>{
 const s=game(),free=laborProfile(p(s)).available,n=free+2000,q=quoteIndustry(s,{kind:'levy-militia',provinceId:p(s).id,amount:n,draftRates:{merchants:50}});
 assert(q.impact.delta.tax<0);assert(q.impact.delta.expenses>0);assert(q.impact.delta.officialRations>0);
 const r=industry(s,{kind:'levy-militia',amount:n,draftRates:{merchants:50}}).state;assert.equal(p(r).population.professions.militia,p(s).population.professions.militia+n);roundtrip(r);
 const released=industry(r,{kind:'release-militia',amount:n}).state;assert.equal(p(released).population.professions.merchants,p(s).population.professions.merchants);assert.equal(released.domestic.manpower.drafts.length,0);
 const construction=startConstruction(r,p(r).id,'temples').state;
 assert.throws(()=>industry(construction,{kind:'release-militia',amount:p(construction).population.professions.militia}),/占用/);
});

test('transfers preserve origin quotas and dismissals return residents and restore original vacancies',()=>{
 let s=game(),origin=p(s),amount=laborProfile(origin).available+100;
 s=army(s,{kind:'recruit',amount,draftRates:{farmers:50}}).state;
 s=army(s,{kind:'transfer',targetId:'henan',soldiers:100,quantities:{}}).state;
 assert.equal(s.domestic.manpower.drafts[0].stationId,'henan');assert.equal(activeDrafts(s.domestic,p(s),'farmers'),100);validateManpower(s.domestic);
 const total=s.domestic.provinces.reduce((n,p)=>n+p.population.total,0),r=army(s,{sourceId:'henan',kind:'dismiss',amount:100}).state;
 assert.equal(activeDrafts(r.domestic,p(r),'farmers'),0);assert.equal(p(r).population.professions.farmers,origin.population.professions.farmers);assert.equal(r.domestic.provinces.reduce((n,p)=>n+p.population.total,0),total);roundtrip(r);
});

test('casualties remove claims without resurrecting workers, and battle settlement is idempotent',()=>{
 const s=game(),n=laborProfile(p(s)).available+100,r=army(s,{kind:'recruit',amount:n,draftRates:{farmers:50}}).state,city=p(r),total=city.population.total,workers=city.population.professions.farmers;
 reserveWorldKits(r.domestic,city.id,'draft-loss',[{kind:'infantry',count:100}]);settleWorldKits(r.domestic,city.id,'draft-loss',[0]);
 assert.equal(city.population.total,total-100);assert.equal(city.population.professions.farmers,workers);assert.equal(activeDrafts(r.domestic,city,'farmers'),0);validateManpower(r.domestic);
 assert.throws(()=>settleWorldKits(r.domestic,city.id,'draft-loss',[0]));
});

test('failed saves do not consume labor, quota or funds; invalid ratios and partial staffing records are rejected',()=>{
 const s=game(),amount=laborProfile(p(s)).available+100,before=structuredClone(s),r=industry(s,{kind:'levy-militia',amount,draftRates:{farmers:50}});
 assert.throws(()=>persistCandidate(s,r.state,{setItem(){throw Error('quota');}}),/保存失败/);assert.deepEqual(s,before);
 for(const rate of [-1,5,51,100,NaN])assert.throws(()=>quoteKitCommand(s,{kind:'recruit',sourceId:p(s).id,amount:1,draftRates:{farmers:rate}}),/比例/);
 const corrupt=structuredClone(s);delete p(corrupt).industryLabor;assert.throws(()=>roundtrip(corrupt),/不完整/);
 const migrated=structuredClone(s);delete migrated.domestic.industryLaborVersion;for(const city of migrated.domestic.provinces)delete city.industryLabor;
 const jobs=structuredClone(p(migrated).population),normalized=roundtrip(migrated);assert.deepEqual(p(normalized).population,jobs);
});

test('half of a fully staffed industry produces half its normal output, subject only to rounding',()=>{
 for(const [key,job] of Object.entries({agriculture:'farmers',pastoral:'herders',commerce:'merchants',industry:'workers'})){
  const s=game(),city=p(s);city.population.professions.militia+=laborProfile(city).available;
  const before=outputFor(city,key),half=Math.floor(city.population.professions[job]/2),r=army(s,{kind:'recruit',amount:half,draftRates:{[job]:50}}).state;
  assert(Math.abs(outputFor(p(r),key)-before/2)<=1,`${key}: actual output must follow remaining crew, not just developed land`);
 }
});

test('deleting only the saved origin ledger cannot reset the accumulated draft cap',()=>{
 const s=game(),amount=laborProfile(p(s)).available+100,r=army(s,{kind:'recruit',amount,draftRates:{farmers:50}}).state;
 delete r.domestic.manpower;assert.throws(()=>roundtrip(r),/不完整/);
});

test('development respects a locked production occupation and leaves the new positions vacant',()=>{
 const s=game(),city=p(s);city.localPolicy={version:1,civil:true,military:false,budget:500,priority:'food',locks:['workers']};
 const before=city.population.professions.workers,r=industry(s,{kind:'develop',industry:'industry',area:500}).state;
 settleIndustry(r.domestic,2);settleIndustryHiring(r.domestic,3);assert.equal(p(r).population.professions.workers,before);assert(industryStaffing(p(r),'industry',3).vacant>0);
});
