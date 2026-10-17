import test from 'node:test';import assert from 'node:assert/strict';
import {officeRegister,CENTRAL_OFFICES,COURT_SIDES,OFFICIAL_ATTRIBUTES} from '../src/personnel.mjs';
import {createDomestic} from '../src/domestic.mjs';import {officials} from '../src/game.mjs';
test('13 central offices appear once in court and register, without local posts',()=>{
 const offices=officeRegister(createDomestic()),central=offices.filter(o=>o.scope==='central');
 assert.equal(central.length,13);assert.equal(central[0].name,'大将军');assert.equal(central.at(-1).name,'宰相');assert.equal(officials.length,13);assert.ok(!officials.some(o=>/河北|刺史/.test(o.name)));assert.deepEqual(officials.map(o=>o.id),central.map(o=>o.id));assert.equal(new Set(COURT_SIDES.flatMap(([,ids])=>ids)).size,13);assert.deepEqual(new Set(COURT_SIDES.flatMap(([,ids])=>ids)),new Set(CENTRAL_OFFICES.map(o=>o.id)));
});
test('local posts derive from current province names and ownership',()=>{
 const d=createDomestic(),country=d.countries[0];const all=officeRegister(d);assert.equal(all.length,33);assert.ok(all.some(o=>o.name==='河北刺史'));assert.ok(all.some(o=>o.name==='河北将军'));assert.ok(!all.some(o=>o.name==='罗马城刺史'));
 country.provinceIds=country.provinceIds.filter(id=>id!=='hebei');d.provinces.find(p=>p.id==='henan').name='新州';const next=officeRegister(d);assert.equal(next.length,31);assert.ok(!next.some(o=>o.name.includes('河北')));assert.ok(next.some(o=>o.name==='新州将军'));assert.ok(next.some(o=>o.name==='新州刺史'));
});
test('all eight official attributes are retained without inventing officeholders',()=>{
 const d=createDomestic(),before=JSON.stringify(d),rows=officeRegister(d);assert.equal(OFFICIAL_ATTRIBUTES.length,8);for(const o of rows){assert.deepEqual(Object.keys(o.attributes),OFFICIAL_ATTRIBUTES.map(([key])=>key));assert.ok(Object.values(o.attributes).every(v=>v===null));}assert.equal(JSON.stringify(d),before);
});
