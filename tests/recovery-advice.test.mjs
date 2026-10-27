import test from 'node:test';
import assert from 'node:assert/strict';
import {createPlayableGame,validateSave} from '../src/game.mjs';
import {recoveryAdvice} from '../src/recovery-advice.mjs';
import {executeRevenue} from '../src/revenue.mjs';
import {countrySummary} from '../src/domestic.mjs';
test('recovery advice is a pure bounded comparison and never changes taxes, cash, grain or debt',()=>{
 const s=createPlayableGame('恢复建议'),before=JSON.stringify(s),q=recoveryAdvice(s);assert.deepEqual(q.taxOptions.map(o=>o.rate),[20,22,24]);assert.equal(q.taxOptions[0].net,q.net);assert.ok(q.taxOptions.every(o=>Number.isSafeInteger(o.net)));assert.deepEqual(recoveryAdvice(s),q);assert.equal(JSON.stringify(s),before);validateSave(s);
});
test('each static recovery tax comparison matches the actual authorized policy at the same output',()=>{
 const s=createPlayableGame('核阅临时税率'),q=recoveryAdvice(s),country=s.domestic.countries.find(c=>c.id===s.domestic.playerCountryId);
 for(const option of q.taxOptions.filter(o=>o.rate!==20)){
  const result=executeRevenue(s,{id:s.domestic.fiscalActions.nextId,kind:'tax',rates:Object.fromEntries(country.provinceIds.map(id=>[id,option.rate]))}).state;assert.equal(countrySummary(result.domestic,undefined,result.turn).net,option.net);assert.equal(result.stats.treasury,s.stats.treasury);assert.equal(result.domestic.countries.find(c=>c.id===s.domestic.playerCountryId).fiscal.debt,country.fiscal.debt);
 }
});
