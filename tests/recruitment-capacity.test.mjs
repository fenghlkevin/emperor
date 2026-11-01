import test from 'node:test';
import assert from 'node:assert/strict';
import {newGame} from '../src/game.mjs';
import {recruitmentCapacity} from '../src/recruitment-capacity.mjs';
import {quoteKitCommand} from '../src/troop-kit-world.mjs';
test('MAX is executable and constrained by funds and selected draft sources',()=>{
 const s=newGame('募兵上限');
 for(const id of ['central'])for(const rates of [{},{farmers:50,herders:50,merchants:50,workers:50}]){
 const before=JSON.stringify(s),q=recruitmentCapacity(s,id,rates);assert.equal(JSON.stringify(s),before);
 assert.ok(q.max>0);assert.ok(quoteKitCommand(s,{kind:'recruit',sourceId:id,amount:q.max,draftRates:rates}).canAfford);
 try{const next=quoteKitCommand(s,{kind:'recruit',sourceId:id,amount:q.max+1,draftRates:rates});assert.equal(next.canAfford,false);}catch(e){assert.match(e.message,/不足|上限|可征/);}
 }
 s.domestic.countries.find(c=>c.id===s.domestic.playerCountryId).fiscal.treasury=0;
 assert.equal(recruitmentCapacity(s,'central').max,0);
});
