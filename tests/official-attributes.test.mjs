import test from 'node:test';
import assert from 'node:assert/strict';
import {newGame,validateSave} from '../src/game.mjs';
import {initializeJustice} from '../src/justice.mjs';
const keys=['intelligence','martial','leadership','politics','integrity','loyalty','age','experience'];
const complete=d=>{for(const o of d.justice.officials)for(const k of keys)assert.ok(Number.isInteger(o[k])&&o[k]>=0&&o[k]<=100,`${o.name}: ${k}`);};
test('all initial central and local officials have complete attributes shared by every page',()=>{
 const a=newGame('属性'),b=newGame('属性');complete(a.domestic);
 assert.deepEqual(a.domestic.justice.officials,b.domestic.justice.officials);
});
test('legacy saves restore missing attributes without changing trained values or zero',()=>{
 const s=newGame('旧档');
 for(const o of s.domestic.justice.officials){delete o.politics;delete o.leadership;delete o.age;delete o.experience;o.intelligence=0;o.martial=99;o.growthVersion=1;}
 const next=validateSave(JSON.parse(JSON.stringify(s)));complete(next.domestic);
 for(const o of next.domestic.justice.officials){assert.equal(o.intelligence,0);assert.equal(o.martial,99);}
 const before=JSON.stringify(next.domestic.justice.officials);initializeJustice(next.domestic);
 assert.equal(JSON.stringify(next.domestic.justice.officials),before);
});
