import test from 'node:test';import assert from 'node:assert/strict';
import {newGame,validateSave,advance} from '../src/game.mjs';

import {quoteGeneral,executeGeneral} from '../src/general.mjs';import {militarySummary} from '../src/military.mjs';import {settleDomestic,countrySummary} from '../src/domestic.mjs';
const act=(s,c)=>executeGeneral(s,{id:s.domestic.general.nextId,...c}).state;
test('one-off training and security act immediately and cap at 100',()=>{let s=newGame('帝'),old=structuredClone(s);s=act(s,{kind:'train'});assert.equal(s.domestic.centralArmy.training,70);assert.equal(old.domestic.centralArmy.training,60);s.domestic.centralArmy.training=98;s=act(s,{kind:'train'});assert.equal(s.domestic.centralArmy.training,100);assert.throws(()=>act(s,{kind:'train'}));const cap=s.domestic.provinces.find(p=>p.id===s.domestic.general.capitalProvinceId);cap.welfare.security=97;s=act(s,{kind:'security'});assert.equal(s.domestic.provinces.find(p=>p.id===cap.id).welfare.security,100);assert.equal(s.stats.treasury,old.stats.treasury);});
test('ongoing training persists, settles once per turn, stops without losing current value',()=>{let s=act(newGame('帝'),{kind:'ongoing',enabled:true});advance(s);assert.equal(s.domestic.centralArmy.training,62);settleDomestic(s.domestic,s.turn);assert.equal(s.domestic.centralArmy.training,62);s=validateSave(JSON.parse(JSON.stringify(s)));advance(s);assert.equal(s.domestic.centralArmy.training,64);s=act(s,{kind:'ongoing',enabled:false});advance(s);assert.equal(s.domestic.centralArmy.training,64);});
test('invalid training settings and stale commands leave source unchanged',()=>{const s=newGame('帝'),old=structuredClone(s),id=s.domestic.provinces[0].id;for(const c of [{kind:'ongoing',enabled:'true'},{kind:'unknown'}]){assert.throws(()=>act(s,c));assert.deepEqual(s,old);}const n=act(s,{kind:'train'});assert.throws(()=>executeGeneral(n,{id:1,kind:'train'}));});

test('security inspection is limited to once per turn, persists after loading, and resets next turn',()=>{
 let s=newGame('巡防');const capital=()=>s.domestic.provinces.find(p=>p.id===s.domestic.general.capitalProvinceId);
 capital().welfare.security=40;s=act(s,{kind:'security'});assert.equal(capital().welfare.security,50);
 const before=structuredClone(s);assert.throws(()=>quoteGeneral(s,{kind:'security'}),/本旬已执行安全检视/);assert.throws(()=>act(s,{kind:'security'}),/本旬已执行安全检视/);assert.deepEqual(s,before);
 s=validateSave(JSON.parse(JSON.stringify(s)));assert.throws(()=>act(s,{kind:'security'}),/本旬已执行安全检视/);
 advance(s);const security=capital().welfare.security;s=act(s,{kind:'security'});assert.equal(capital().welfare.security,Math.min(100,security+10));
});
test('older saves without inspection history remain valid; rejected inspections do not consume the turn',()=>{
 let s=validateSave(JSON.parse(JSON.stringify(newGame('旧档'))));const soldiers=s.domestic.centralArmy.soldiers;s.domestic.centralArmy.soldiers=0;
 assert.throws(()=>act(s,{kind:'security'}),/无士兵/);assert.equal(s.domestic.general.securityInspectionTurn,undefined);
 s.domestic.centralArmy.soldiers=soldiers;s.domestic.provinces.find(p=>p.id===s.domestic.general.capitalProvinceId).welfare.security=40;
 s=act(s,{kind:'security'});assert.equal(s.domestic.general.securityInspectionTurn,s.turn);
});
