import {famine} from './helpers/national.mjs';
import test from 'node:test';import assert from 'node:assert/strict';import {newGame} from '../src/game.mjs';import {initializeResourceEconomy} from '../src/province-resources.mjs';import {quoteSpecial,executeSpecial} from '../src/special-buildings.mjs';
function game(){const s=newGame('长工程边界');initializeResourceEconomy(s.domestic);return s;}
test('special imperial order rechecks changed food and reserve at execution; failed approval changes nothing',()=>{
 for(const scenario of ['food','reserve']){const s=game(),c={id:s.domestic.specialWorks.nextId,kind:'special',provinceId:'hebei',building:'shigu'};assert.ok(quoteSpecial(s,c).canAfford);if(scenario==='food'){famine(s.domestic);}else s.domestic.governance.reserve=s.stats.treasury;const before=JSON.stringify(s);assert.throws(()=>executeSpecial(s,c),scenario==='food'?/口粮/:/保留线/);assert.equal(JSON.stringify(s),before);}
});
