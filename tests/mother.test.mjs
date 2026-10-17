import test from 'node:test';
import assert from 'node:assert/strict';
import {newGame,advance,validateSave} from '../src/game.mjs';
import {palaceAction} from '../src/emperor.mjs';
import {emperorPanel} from '../src/emperor-ui.mjs';
test('mother visits increase hidden filial piety, reset neglect and clamp gains',()=>{
 let s=newGame('问安');s.phase=1;s.mother.neglectedTurns=4;s.mother.filialPiety=98;s.stats.happiness=98;
 const n=palaceAction(s,'mother').state;
 assert.equal(n.mother.filialPiety,100);assert.equal(n.mother.neglectedTurns,0);assert.equal(n.mother.lastVisitTurn,1);assert.equal(n.stats.happiness,100);assert.equal(n.stats.energy,199);assert.equal(s.mother.filialPiety,98);
 assert.doesNotMatch(emperorPanel(n),/孝心|filialPiety/);
});
test('three completed neglected turns begin decay; visiting breaks the streak',()=>{
 let s=newGame('定省');advance(s);advance(s);assert.equal(s.mother.filialPiety,50);advance(s);assert.equal(s.mother.filialPiety,47);advance(s);assert.equal(s.mother.filialPiety,44);
 s.phase=1;s=palaceAction(s,'mother').state;advance(s);assert.equal(s.mother.filialPiety,49);assert.equal(s.mother.neglectedTurns,0);advance(s);advance(s);assert.equal(s.mother.filialPiety,49);advance(s);assert.equal(s.mother.filialPiety,46);
 s.mother.filialPiety=1;advance(s);assert.equal(s.mother.filialPiety,0);
});
test('old saves receive a fresh grace period, hidden relationship persists and corrupt values fail',()=>{
 const s=newGame('存档');delete s.mother;s.turn=100;const n=validateSave(s);assert.deepEqual(n.mother,{filialPiety:50,lastVisitTurn:null,neglectedTurns:0,age:45,alive:true});
 n.phase=1;const visited=palaceAction(n,'mother').state;assert.deepEqual(validateSave(JSON.parse(JSON.stringify(visited))).mother,visited.mother);
 for(const patch of [{filialPiety:101},{filialPiety:NaN},{lastVisitTurn:101},{neglectedTurns:-1}]){const bad=structuredClone(n);Object.assign(bad.mother,patch);assert.throws(()=>validateSave(bad),/慈宁宫/);}
});
