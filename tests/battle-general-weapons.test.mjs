import {test} from 'node:test';
import assert from 'node:assert/strict';
import {GENERAL_WEAPONS,WEAPON_ACTIONS,weaponMotion} from '../src/battle-general-weapons.mjs';

test('named generals use melee weapons and the four requested heroes have different techniques',()=>{
 assert.equal(new Set(['guanyu','zhangfei','zhaoyun','machao'].map(k=>GENERAL_WEAPONS[k])).size,4);
 for(const style of Object.values(GENERAL_WEAPONS)){
  assert.ok(WEAPON_ACTIONS[style]);
  assert.doesNotMatch(style,/bow|archer/);
 }
 assert.equal(GENERAL_WEAPONS.huangzhong,'guandao');
 assert.equal(GENERAL_WEAPONS.liguang,'saber');
});
test('weapon types differ in anticipation, reach, impact timing, duration and impact strokes',()=>{
 const motions=new Set(),effects=new Set();
 for(const [style,s] of Object.entries(WEAPON_ACTIONS)){
  const frames=weaponMotion(style,76,0),reverse=weaponMotion(style,-76,0);
  assert.deepEqual(frames.map(f=>f.offset),[0,s.times[1],s.contact,s.times[3],1]);
  assert.equal(frames[0].transform,frames.at(-1).transform);
  assert.notEqual(frames[2].transform,reverse[2].transform);
  assert.ok(s.times.every((t,i,a)=>i===0||t>a[i-1]));
  motions.add(JSON.stringify(frames));effects.add(s.impact);
 }
 assert.equal(motions.size,Object.keys(WEAPON_ACTIONS).length);
 assert.equal(effects.size,Object.keys(WEAPON_ACTIONS).length);
 assert.ok(WEAPON_ACTIONS.guandao.ms>WEAPON_ACTIONS['quick-spear'].ms);
});
