import test from 'node:test';import assert from 'node:assert/strict';
import {newGame,validateSave} from '../src/game.mjs';
import {diplomaticMap} from '../src/court-diplomacy-ui.mjs';import {targetMap} from '../src/war-target-map.mjs';
test('new dynasty country name is independent of emperor and survives saves and all generated maps',()=>{
 const s=newGame('朱元璋',' 大明 ');s.eraName='洪武';const home=s.domestic.countries.find(c=>c.id===s.domestic.playerCountryId);assert.equal(home.name,'大明');assert.equal(s.name,'朱元璋');
 const loaded=validateSave(JSON.parse(JSON.stringify(s)));assert.equal(loaded.domestic.countries.find(c=>c.id==='sheng').name,'大明');
 for(const html of [diplomaticMap(loaded.domestic,null),targetMap(loaded.domestic,[],null)]){assert.ok(html.includes('大明'));assert.ok(!html.includes('大晟'));}
});
test('invalid explicit country names fail while legacy callers and saves remain supported',()=>{for(const name of ['', '   ',null,'国'.repeat(17)])assert.throws(()=>newGame('君主',name),/国号/);const s=newGame('旧存档');assert.equal(validateSave(s).domestic.countries.find(c=>c.id==='sheng').name,'大晟');});
