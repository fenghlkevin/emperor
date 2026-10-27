import test from 'node:test';
import assert from 'node:assert/strict';
import {commitOperation} from '../src/operation-result.mjs';
test('persisted candidate is published once; explicit rejection and storage errors propagate before UI completion',()=>{
 const draft={version:1};let calls=0;
 assert.equal(commitOperation(next=>{calls++;assert.equal(next,draft);},draft),draft);
 assert.equal(calls,1);
 assert.throws(()=>commitOperation(()=>false,draft),/未保存/);
 assert.throws(()=>commitOperation(()=>{throw Error('quota');},draft),/quota/);
 assert.throws(()=>commitOperation(undefined,draft),/不支持办理/);
 const saved={...draft,committed:true};assert.equal(commitOperation(()=>saved,draft),saved);
});
