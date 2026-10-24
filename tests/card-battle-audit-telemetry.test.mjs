import {test} from 'node:test';
import assert from 'node:assert/strict';
import {fixture,ROSTERS} from '../scripts/card-battle-balance-fixture.mjs';
import {cardAI,actCardsMutable,validateCards,cardCost} from '../src/card-battle.mjs';
import {createAuditTelemetry} from '../scripts/card-battle-audit-telemetry.mjs';

test('audit observer preserves every production action, RNG stream, loss and final state',()=>{
 for(const first of ['home','enemy'])for(let seed=1;seed<=4;seed++){
  const plain=fixture({roster:ROSTERS.mixed_600,hero:'command',training:20,first,seeds:{home:seed,enemy:seed+91}}),observed=structuredClone(plain),audit=createAuditTelemetry();audit.startGame(observed);
  let steps=0;while(!plain.result&&steps++<2500){
   const action=cardAI(plain);assert.deepEqual(cardAI(observed),action);
   const before=JSON.stringify(observed),pre=audit.beforeAction(observed,action);assert.equal(JSON.stringify(observed),before);
   actCardsMutable(plain,action);actCardsMutable(observed,action);
   const after=JSON.stringify(observed);audit.afterAction(observed,pre);assert.equal(JSON.stringify(observed),after);assert.deepEqual(observed,plain);
  }
  assert.ok(plain.result);audit.finishGame(observed,{seed});validateCards(observed);
  const result=audit.result();assert.equal(result.turns.filter(r=>r.ownTurn===1).length,2);assert.ok(result.turns.every(r=>r.completed<=r.reached));assert.ok(result.traces.length<=2);
 }
});

test('turn-end telemetry follows the outgoing player across either initiative label',()=>{
 for(const first of ['home','enemy']){
  const b=fixture({first}),audit=createAuditTelemetry();audit.startGame(b);actCardsMutable(b,cardAI(b));
  const c=b.cards,p=c.players[first],id=p.hand.find(id=>c.catalog[id].front),action={type:'play',id},cost=cardCost(b,id);
  let pre=audit.beforeAction(b,action);actCardsMutable(b,action);audit.afterAction(b,pre);
  pre=audit.beforeAction(b,{type:'end'});actCardsMutable(b,{type:'end'});audit.afterAction(b,pre);
  assert.notEqual(c.turn,first);const row=audit.result().turns[0];
  assert.equal(row.position,'first');assert.equal(row.ownTurn,1);assert.equal(row.reached,1);assert.equal(row.completed,1);assert.equal(row.deployments,1);assert.equal(row.manaSpent,cost);assert.equal(row.manaUnused,0);assert.equal(row.boardUnits,1);assert.equal(row.boardAttack,c.catalog[id].attack);assert.equal(row.boardHealth,c.catalog[id].hp);
 }
});

test('lethal partial turns do not enter completed-turn means and retain reproducible loss traces',()=>{
 const b=fixture({first:'enemy'});actCardsMutable(b,cardAI(b));const c=b.cards,p=c.players.enemy,id=p.hand.find(id=>c.catalog[id].front);p.hand=p.hand.filter(x=>x!==id);p.board.push(id);c.catalog[id].ready=true;c.players.home.hero=1;
 const audit=createAuditTelemetry();audit.startGame(b);const action={type:'attack',id,target:'hero'},pre=audit.beforeAction(b,action);actCardsMutable(b,action);audit.afterAction(b,pre);assert.throws(()=>audit.finishGame({...b,result:null}),/unfinished/);audit.finishGame(b,{seed:123});
 const row=audit.result().turns[0];assert.equal(row.reached,1);assert.equal(row.completed,0);assert.equal(row.attacks,1);assert.equal(row.boardUnits,0);
 const losing=fixture({first:'home'});actCardsMutable(losing,cardAI(losing));actCardsMutable(losing,{type:'end'});const enemy=losing.cards.players.enemy,attacker=enemy.hand.find(id=>losing.cards.catalog[id].front);enemy.hand=enemy.hand.filter(id=>id!==attacker);enemy.board.push(attacker);losing.cards.catalog[attacker].ready=true;losing.cards.players.home.hero=1;audit.startGame(losing);const lethal={type:'attack',id:attacker,target:'hero'},record=audit.beforeAction(losing,lethal);actCardsMutable(losing,lethal);audit.afterAction(losing,record);audit.finishGame(losing,{seed:456});assert.equal(audit.result().traces[0].seed,456);assert.equal(audit.result().traces[0].firstScore,0);assert.equal(audit.result().traces[0].opening[0].targetId,'hero');
});
