import test from 'node:test';
import assert from 'node:assert/strict';
import {newGame,validateSave,advance} from '../src/game.mjs';

const game=()=>{const s=newGame('兼容边界');s.createdAt='2026-10-17T00:00:00.000Z';return s;};

test('supported save envelope and domestic schema match the compatibility matrix',()=>{
 const state=game();
 for(const version of [undefined,0,1,3,99]){
  const bad=structuredClone(state);if(version===undefined)delete bad.version;else bad.version=version;
  assert.throws(()=>validateSave(bad),/版本不支持/);
 }
 for(const schemaVersion of [undefined,0,1,2,3,4,5,6,7,9]){
  const bad=structuredClone(state);if(schemaVersion===undefined)delete bad.domestic.schemaVersion;else bad.domestic.schemaVersion=schemaVersion;
  assert.throws(()=>validateSave(bad),/内政存档版本不支持/);
 }
 assert.deepEqual(validateSave(structuredClone(state)),state);
});

test('same-schema missing-field normalization preserves resources and runs only once',()=>{
 const state=game();advance(state);
 const legacy=structuredClone(state);delete legacy.saveRevision;delete legacy.phase;
 delete legacy.alchemy;delete legacy.travel;
 const balances=legacy.domestic.countries.map(c=>[c.id,c.fiscal.treasury,c.fiscal.debt]);
 const kits=structuredClone(legacy.domestic.troopKits);
 const normalized=validateSave(legacy);
 assert.equal(normalized.saveRevision,0);assert.equal(normalized.phase,0);
 assert.ok(Object.values(normalized.alchemy.herbs).every(n=>n===0));
 assert.equal(normalized.alchemy.lastTurn,normalized.turn);
 assert.deepEqual(normalized.domestic.countries.map(c=>[c.id,c.fiscal.treasury,c.fiscal.debt]),balances);
 assert.deepEqual(normalized.domestic.troopKits,kits);
 assert.deepEqual(validateSave(structuredClone(normalized)),normalized);
});

test('same-schema compatibility does not infer kits from old loose equipment',()=>{
 const state=game();delete state.domestic.troopKits;
 state.domestic.centralArmy.arsenal={blades:1000,spears:1000,horses:1000,helmets:1000,armor:1000,shields:1000};
 assert.throws(()=>validateSave(state),/兵种套装军备缺失/);
});

test('same-schema compatibility rejects a partial new-format industry ledger',()=>{
 const state=game();delete state.domestic.provinces[0].development;
 assert.throws(()=>validateSave(state),/产业开发或职业调配存档无效/);
});
