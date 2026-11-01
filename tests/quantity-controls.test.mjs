import test from 'node:test';
import assert from 'node:assert/strict';
import {clampQuantity,affordableMaximum} from '../src/quantity-controls.mjs';
test('typed quantities respect zero stock, range, integer steps and non-finite values',()=>{
 assert.equal(clampQuantity(99999,0,1474),1474);
 assert.equal(clampQuantity(-3,0,1474),0);
 assert.equal(clampQuantity(3.8,0,1474),4);
 assert.equal(clampQuantity(1,0,0),0);
 assert.equal(clampQuantity(NaN,1,100),1);
});
test('affordable maximum includes exact budget and rounded pricing boundaries',()=>{
 assert.equal(affordableMaximum(1000,n=>Math.ceil(n*2.7)<=100),37);
 assert.equal(affordableMaximum(10,()=>true),10);
 assert.equal(affordableMaximum(1000,()=>false),0);
 assert.equal(affordableMaximum(0,()=>true),0);
});
