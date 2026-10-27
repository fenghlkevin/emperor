import test from 'node:test';
import assert from 'node:assert/strict';
import {newGame,validateSave} from '../src/game.mjs';
import {economicProsperity,nationalProsperity} from '../src/economic-prosperity.mjs';
import {initializeResourceEconomy} from '../src/province-resources.mjs';
import {INDUSTRIES} from '../src/economy.mjs';
import {industryLandLimit} from '../src/terrain-economy.mjs';
const province=()=>{const s=newGame('景气验收');initializeResourceEconomy(s.domestic);return s.domestic.provinces[0];};
function full(p){p.development={};p.civic.localInvestment=null;for(const [key,,job] of INDUSTRIES){const area=industryLandLimit(p,key),b=p.industryLabor.base[key];p.economy[key].developedArea=area;p.economy[key].productivity=100;p.population.professions[job]=Math.ceil(area*b.workers/b.area);}return p;}
test('all four normalized sectors contribute equally; stopping one loses 25 points',()=>{const p=full(province());assert.equal(economicProsperity(p,2).value,100);for(const [key,,job] of INDUSTRIES){const q=structuredClone(p);q.population.professions[job]=0;const r=economicProsperity(q,2);assert.equal(r.value,75);assert.equal(r.sectors.find(x=>x.key===key).score,0);}});
test('zero workforce is zero, score bounded, staffing and productivity each matter',()=>{const p=full(province());for(const [,,job] of INDUSTRIES)p.population.professions[job]=0;assert.equal(economicProsperity(p,2).value,0);const q=full(province());q.economy.agriculture.productivity=50;assert(economicProsperity(q,2).value<100);assert(economicProsperity(q,2).value>=87);});
test('derived display does not mutate saves or change when tax rate changes',()=>{const s=newGame('景气验收'),before=JSON.stringify(s),p=s.domestic.provinces[0],v=economicProsperity(p,2).value;economicProsperity(p,2);nationalProsperity(s.domestic.provinces,2);assert.equal(JSON.stringify(s),before);validateSave(s);p.budget.taxRate=.5;assert.equal(economicProsperity(p,2).value,v);});
test('development waiting for effective turn does not enter the current score early',()=>{const p=province(),before=economicProsperity(p,1).value;p.economy.agriculture.developedArea+=10000;p.development.activation={industry:'agriculture',area:10000,effectiveTurn:2};assert.equal(economicProsperity(p,1).value,before);assert(economicProsperity(p,2).sectors[0].actual>=economicProsperity(p,1).sectors[0].actual);});
