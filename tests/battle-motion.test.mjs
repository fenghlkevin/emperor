import {test} from 'node:test';
import assert from 'node:assert/strict';
import {attackMotion,hitMotion,deathMotion} from '../src/battle-motion.mjs';
test('attack has anticipation, contact hold and complete return, mirrored by approach',()=>{
 for(const kind of ['spears','infantry','cavalry','heavy-cavalry','archers','crossbows','camel','elephant','horse-archers']){
  const frames=attackMotion(kind,76,0),reverse=attackMotion(kind,-76,0);
  assert.deepEqual(frames.map(f=>f.offset),[0,.18,.42,.49,.78,1]);
  assert.equal(frames[0].transform,frames.at(-1).transform);
  assert.equal(frames[2].transform,frames[3].transform);
  assert.notEqual(frames[2].transform,reverse[2].transform);
 }
 assert.notEqual(attackMotion('spears',76,0)[2].transform,attackMotion('cavalry',76,0)[2].transform);
});
test('hit recovers while death settles and fades; both anchor at the feet',()=>{
 for(const direction of [-1,1])for(const mounted of [false,true]){
  const hit=hitMotion(direction,mounted),death=deathMotion(direction,mounted);
  assert.equal(hit[0].transform,hit.at(-1).transform);
  assert.equal(death[0].opacity,1);assert.equal(death.at(-1).opacity,0);
  for(const f of [...hit,...death])assert.ok(f.transform.endsWith('translate(0,-24px)'));
 }
});
