import test from 'node:test';import assert from 'node:assert/strict';import {newGame,validateSave,advance,dateLabel,buildings,officials} from '../src/game.mjs';
test('save round trip preserves progress',()=>{const s=newGame('测试帝');s.scene='court';advance(s);assert.deepEqual(validateSave(JSON.parse(JSON.stringify(s))),s);});
test('calendar rolls over month and year',()=>{assert.equal(dateLabel(1),'元年正月上旬');assert.equal(dateLabel(4),'元年二月上旬');assert.equal(dateLabel(37),'二年正月上旬');});
test('rejects incompatible or malformed saves',()=>{assert.throws(()=>validateSave({version:99}));const s=newGame('帝');s.turn=-1;assert.throws(()=>validateSave(s));});
test('every hotspot has unique identity and remains in scene',()=>{const entries=[...buildings,...officials];assert.equal(new Set(entries.map(e=>e.id)).size,entries.length);for(const e of entries){assert.ok(e.x>=0&&e.y>=0&&e.x+e.w<=100&&e.y+e.h<=100);}});
