import test from 'node:test';
import assert from 'node:assert/strict';
import {HISTORICAL_PEOPLE} from '../src/historical-people.mjs';
import {PRISON_PERSONALITIES,initializeJustice,settleJustice,prisonLoyaltyDelta} from '../src/justice.mjs';
import {newGame} from '../src/game.mjs';
test('every historical person has a fixed sourced personality and disclosed design basis',()=>{
 assert.equal(HISTORICAL_PEOPLE.length,2481);
 for(const p of HISTORICAL_PEOPLE){assert.ok(PRISON_PERSONALITIES[p.personality],p.name);assert.ok(p.characterTraits.length,p.name);assert.ok(p.personalityBasis&&p.personalitySource&&p.personalityMethod,p.name);}
 for(const [name,type] of [['文天祥','steadfast'],['张飞','resentful'],['韩信','staunch'],['司马懿','pragmatic'],['廉颇','repentant']])assert.equal(HISTORICAL_PEOPLE.find(p=>p.name===name).personality,type,name);
});
test('historical prisoner migration preserves actual loyalty and served history, new rules settle once',()=>{
 const s=newGame('性格'),d=s.domestic,p=HISTORICAL_PEOPLE.find(p=>p.name==='文天祥');
 const o={...structuredClone(d.justice.officials[0]),id:`recruit-${p.id}`,name:p.name,status:'imprisoned',personality:'fearful',loyalty:51,prison:{admittedTurn:1,lastSettledTurn:4,servedTurns:3,lastDelta:1,totalDelta:3,lastReason:'旧记录'}};
 d.justice.officials.push(o);d.justice.lastTurn=4;const record=structuredClone(o.prison);initializeJustice(d);
 assert.equal(o.personality,'steadfast');assert.equal(o.loyalty,51);assert.deepEqual(o.prison,record);initializeJustice(d);assert.deepEqual(o.prison,record);
 settleJustice(d,5);assert.equal(o.loyalty,51);assert.equal(o.prison.servedTurns,4);assert.match(o.prison.lastReason,/守持本志/);settleJustice(d,5);assert.equal(o.prison.servedTurns,4);
 o.status='released';settleJustice(d,6);assert.equal(o.prison.servedTurns,4);
});
test('new reactions respect loyalty bounds and old reactions remain unchanged',()=>{
 for(const [personality,loyalty,delta] of [['steadfast',50,0],['composed',50,0],['pragmatic',69,1],['pragmatic',70,0],['pragmatic',90,0],['resentful',2,-2],['staunch',0,0],['repentant',79,1],['fearful',59,1]])assert.equal(prisonLoyaltyDelta({personality,loyalty}),delta);
 const d=newGame('原臣').domestic;d.justice.officials[0].personality='resentful';initializeJustice(d);assert.equal(d.justice.officials[0].personality,'resentful');
});
