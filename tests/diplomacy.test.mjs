import test from 'node:test';import assert from 'node:assert/strict';
import {createDomestic,migrateDomestic,validateDomestic} from '../src/domestic.mjs';
import {relationBetween,diplomaticRows} from '../src/diplomacy.mjs';
import {newGame,validateSave,advance} from '../src/game.mjs';
test('each country pair has one shared diplomatic record and every foreign country is listed',()=>{
 const d=createDomestic();assert.equal(d.diplomacy.length,d.countries.length*(d.countries.length-1)/2);assert.equal(diplomaticRows(d).length,d.countries.length-1);assert.equal(relationBetween(d,'sheng','rome'),relationBetween(d,'rome','sheng'));assert.equal(relationBetween(d,'sheng','sheng'),undefined);const r=relationBetween(d,'sheng','rome');assert.equal(r.relation,'none');assert.equal(r.friendship,50);assert.deepEqual(r.trade,{years:0,quota:0,income:0});
});
test('invalid pairs, duplicates, friendship and trade values are rejected',()=>{
 for(const change of [d=>d.diplomacy.pop(),d=>d.diplomacy[1]=d.diplomacy[0],d=>d.diplomacy[0].countryIds=['sheng','sheng'],d=>d.diplomacy[0].countryIds=['bad','rome'],d=>d.diplomacy[0].friendship=101,d=>d.diplomacy[0].trade.quota=-1,d=>d.diplomacy[0].trade.years=1.5,d=>d.diplomacy[0].relation='unknown']){const d=createDomestic();change(d);assert.throws(()=>validateDomestic(d));}
});
test('diplomatic queries and turns do not create trade receipts or alter treaties',()=>{
 const state=newGame('邦交帝'),r=relationBetween(state.domestic,'sheng','rome');r.trade={years:2,quota:300,income:175};r.friendship=79;const prior=JSON.stringify(state.domestic.diplomacy);diplomaticRows(state.domestic);advance(state);assert.equal(JSON.stringify(state.domestic.diplomacy),prior);const restored=validateSave(JSON.parse(JSON.stringify(state)));assert.equal(relationBetween(restored.domestic,'rome','sheng').trade.income,175);
});
