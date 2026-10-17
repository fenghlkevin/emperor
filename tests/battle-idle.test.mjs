import {test} from 'node:test';
import assert from 'node:assert/strict';
import {idleSeed,idlePose} from '../src/battle-idle.mjs';
import {piece,playSprite} from '../src/battle-sprites.mjs';

test('idle phases are stable and distinct without consuming game randomness',()=>{
 const random=Math.random;Math.random=()=>{throw Error('idle consumed randomness');};
 try{assert.equal(idleSeed('u0'),idleSeed('u0'));assert.notEqual(idleSeed('u0'),idleSeed('u1'));assert.equal(idlePose('mounted',idleSeed('u0'),5),idlePose('mounted',idleSeed('u0'),5));}finally{Math.random=random;}
});
test('idle breathes continuously with restrained ground-anchored transforms',()=>{
 for(const kind of ['infantry','spears','mounted']){
  const poses=new Set();
  for(let t=0;t<30;t+=.05){const pose=idlePose(kind,.42,t);poses.add(pose);const values=pose.match(/-?\d+(?:\.\d+)?/g).map(Number);assert.ok(Math.abs(values[0])<=1.1);assert.ok(values[1]>=23.45&&values[1]<=24);assert.ok(Math.abs(values[2])<=.65);assert.ok(values[4]>=1&&values[4]<=1.018);assert.ok(pose.endsWith('translate(0,-24)'));}
  assert.ok(poses.size>100);
 }
});
test('idle artwork is nested inside facing and outside sprite action playback',()=>{
 assert.match(piece({id:'u0',kind:'cavalry',side:'home'}),/class="unit-idle" data-idle-kind="mounted"><svg class="unit-sprite"/);
 assert.match(piece({id:'u1',commander:true,kind:'spears',side:'enemy'}),/data-idle-kind="spears"/);
});

test('action playback tolerates a queued animation timestamp older than its start',()=>{
 const request=globalThis.requestAnimationFrame,cancel=globalThis.cancelAnimationFrame;let tick;
 globalThis.requestAnimationFrame=callback=>{tick=callback;return 1;};globalThis.cancelAnimationFrame=()=>{};
 const element={dataset:{spriteKind:'infantry'},setAttribute(){},closest(){return null;}};
 try{const before=performance.now(),stop=playSprite(element,'walk');tick(before-50);assert.equal(element.dataset.frame,'0');tick(performance.now()+100);assert.ok(Number(element.dataset.frame)>0);stop();assert.equal(element.dataset.frame,'0');assert.equal(element.dataset.animation,undefined);}finally{globalThis.requestAnimationFrame=request;globalThis.cancelAnimationFrame=cancel;}
});

test('sprite frame clip follows the atlas viewport and restores on action stop',()=>{
 const request=globalThis.requestAnimationFrame,cancel=globalThis.cancelAnimationFrame;let tick;
 globalThis.requestAnimationFrame=callback=>{tick=callback;return 1;};globalThis.cancelAnimationFrame=()=>{};
 const clip={},attrs={},element={dataset:{spriteKind:'heavy-cavalry'},setAttribute(k,v){attrs[k]=v;},closest(){return null;},querySelector(){return {setAttribute(k,v){clip[k]=Number(v);}};}};
 try{const stop=playSprite(element,'attack');tick(performance.now()+450);assert.deepEqual(attrs.viewBox.split(' ').map(Number),['x','y','width','height'].map(k=>clip[k]));stop();assert.deepEqual(attrs.viewBox.split(' ').map(Number),['x','y','width','height'].map(k=>clip[k]));assert.equal(clip.y,75);}finally{globalThis.requestAnimationFrame=request;globalThis.cancelAnimationFrame=cancel;}
});
