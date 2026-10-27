import test from 'node:test';import assert from 'node:assert/strict';
import {newGame,validateSave} from '../src/game.mjs';import {REALMS} from '../src/domestic.mjs';import {occupyProvince} from '../src/occupation.mjs';
test('all campaign regions retain their geographic names before and after conquest',()=>{
 const s=newGame('地名');for(const r of REALMS.filter(r=>r.id!=='sheng')){const p=s.domestic.provinces.find(p=>p.id===r.id+'-core');assert.equal(p.name,r.name);occupyProvince(s.domestic,r.id,1);assert.equal(p.name,r.name);}
});
test('old generated city suffixes normalize on load without changing capitals or custom names',()=>{
 const s=newGame('旧地名');const capitals=s.domestic.countries.map(c=>c.capital);
 for(const r of REALMS.filter(r=>r.id!=='sheng'))s.domestic.provinces.find(p=>p.id===r.id+'-core').name=r.name+'城';
 const custom=s.domestic.provinces.find(p=>p.id==='japan-core');custom.name='自定州名';
 const loaded=validateSave(structuredClone(s));for(const r of REALMS.filter(r=>!['sheng','japan'].includes(r.id)))assert.equal(loaded.domestic.provinces.find(p=>p.id===r.id+'-core').name,r.name);
 assert.equal(loaded.domestic.provinces.find(p=>p.id===custom.id).name,'自定州名');assert.deepEqual(loaded.domestic.countries.map(c=>c.capital),capitals);
});
