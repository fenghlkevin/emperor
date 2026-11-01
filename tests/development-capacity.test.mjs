import test from 'node:test';
import assert from 'node:assert/strict';
import {createPlayableGame,validateSave} from '../src/game.mjs';
import {developmentLaborCapacity,projectWorkers} from '../src/project-labor.mjs';
import {executeIndustry,quoteIndustry,settleIndustry} from '../src/industry.mjs';
import {industryQuantityLimit} from '../src/industry-quantity-limits.mjs';
test('development scales above 500 with workforce, reserves shared labor and survives completion/reload',()=>{
 const s=createPlayableGame('规模开发'),p=s.domestic.provinces.find(p=>p.id==='henan');p.disaster=null;
 p.population.professions.militia=400;s.stats.treasury=100000;s.domestic.countries.find(c=>c.id===p.countryId).fiscal.treasury=100000;
 const capacity=developmentLaborCapacity(s.domestic,p);
 assert(capacity>=2000);assert(projectWorkers('development',{area:capacity},s.domestic)<=400);
 assert(projectWorkers('development',{area:capacity+1},s.domestic)>400);
 const input={dataset:{value:'area'},matches:()=>false};
 assert.equal(industryQuantityLimit(s,p,'develop','agriculture','commerce',{},input,{}),capacity);
 const command={id:s.domestic.industryActions.nextId,kind:'develop',provinceId:p.id,industry:'agriculture',area:capacity};
 assert.equal(quoteIndustry(s,command).cost,capacity*2);
 assert.throws(()=>quoteIndustry(s,{...command,area:capacity+1}),/民夫/);
 const next=executeIndustry(s,command).state;validateSave(structuredClone(next));
 const target=next.domestic.provinces.find(x=>x.id===p.id),before=target.economy.agriculture.developedArea;
 for(let turn=next.turn+1;target.development.project&&turn<=next.turn+18;turn++)settleIndustry(next.domestic,turn);
 assert.equal(target.development.project,null);assert(target.economy.agriculture.developedArea-before>=Math.ceil(capacity*.8));
 next.turn=target.development.lastTurn;validateSave(structuredClone(next));
});
test('other construction consumes the same workforce capacity',()=>{
 const s=createPlayableGame('共享民夫'),p=s.domestic.provinces[0];p.population.professions.militia=400;
 const before=developmentLaborCapacity(s.domestic,p);p.construction.project={building:'temples',progress:0,requiredTurns:36,startedTurn:s.turn};
 assert(developmentLaborCapacity(s.domestic,p)<before);
});
