import test from 'node:test';
import assert from 'node:assert/strict';
import {dateLabel,chineseNumber,PERIOD_NAMES} from '../src/calendar.mjs';
import {PHASES,newGame,validateSave} from '../src/game.mjs';
import {DAYLIGHT} from '../src/palace-atmosphere.mjs';
test('reign dates retain ten-day periods across month and year boundaries',()=>{
 for(const [turn,label] of [[1,'雍正元年正月上旬'],[3,'雍正元年正月下旬'],[4,'雍正元年二月上旬'],[31,'雍正元年十一月上旬'],[36,'雍正元年腊月下旬'],[37,'雍正二年正月上旬'],[325,'雍正十年正月上旬']])assert.equal(dateLabel(turn,'雍正'),label);
 assert.equal(chineseNumber(21),'二十一');assert.equal(chineseNumber(101),'一百零一');
});
test('palace atmosphere and action stages use the same period names',()=>{
 assert.deepEqual(DAYLIGHT.map(x=>x.name),PERIOD_NAMES);
 PHASES.forEach((label,i)=>assert.ok(label.startsWith(PERIOD_NAMES[i])));
});
test('era names survive saves independently of the ruler name; old saves remain valid',()=>{
 const state=newGame('胤禛');state.eraName='雍正';assert.equal(validateSave(structuredClone(state)).eraName,'雍正');
 delete state.eraName;assert.equal(validateSave(state).name,'胤禛');
 state.eraName={};assert.throws(()=>validateSave(state),/年号/);
});
