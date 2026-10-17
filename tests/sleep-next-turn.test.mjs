import test from 'node:test';
import assert from 'node:assert/strict';
import {newGame,validateSave,sleepUntilNextTurn} from '../src/game.mjs';
import {emperorPanel} from '../src/emperor-ui.mjs';

test('skip each daytime phase into exactly one new turn with bounded recovery and normal settlement',()=>{
 for(let phase=0;phase<5;phase++){
  const s=newGame('安寝');s.phase=phase;s.scene=phase===0?'court':'palace';s.stats.energy=1;s.harem.streak=3;
  const life=s.stats.life;
  assert.match(emperorPanel(s),/data-sleep-next-turn/);
  sleepUntilNextTurn(s);
  assert.equal(s.turn,2);assert.equal(s.phase,0);assert.equal(s.scene,'palace');
  assert.equal(s.stats.energy,151);assert.equal(s.stats.life,life-1);assert.equal(s.harem.streak,0);
  assert.match(s.harem.history[0],/安寝至明/);validateSave(s);
 }
});
test('last phase and unavailable states cannot skip',()=>{
 const s=newGame('安寝');s.phase=5;
 assert.doesNotMatch(emperorPanel(s),/data-sleep-next-turn/);
 assert.throws(()=>sleepUntilNextTurn(s),/最后阶段/);assert.equal(s.turn,1);
 s.phase=1;s.stats.energy=0;sleepUntilNextTurn(s);assert.equal(s.stats.energy,200);
 s.stats.energy=1;s.stats.life=0;assert.throws(()=>sleepUntilNextTurn(s),/寿元已尽/);
 s.stats.life=100;s.domestic.war.battle={};assert.throws(()=>sleepUntilNextTurn(s),/战斗/);
});
