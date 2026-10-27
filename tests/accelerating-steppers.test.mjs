import test from 'node:test';
import assert from 'node:assert/strict';
import {holdStepProfile,boundedStep} from '../src/accelerating-steppers.mjs';
test('holding a stepper speeds up both frequency and amount in stable tiers',()=>{const tiers=[0,1000,2500,5000].map(holdStepProfile);assert.equal(tiers[0].multiplier,1);for(let i=1;i<tiers.length;i++){assert.ok(tiers[i].interval<tiers[i-1].interval);assert.ok(tiers[i].multiplier>tiers[i-1].multiplier);}assert.deepEqual(holdStepProfile(60000),tiers.at(-1));});
test('accelerated increments and decrements stop exactly at existing field bounds',()=>{assert.equal(boundedStep(45,25,0,50),50);assert.equal(boundedStep(10,-100,0,10000),0);assert.equal(boundedStep(3,-5,1,10000),1);assert.equal(boundedStep(.2,.1,0,1),.3);assert.equal(boundedStep(Number.MAX_SAFE_INTEGER-2,100),Number.MAX_SAFE_INTEGER);});
