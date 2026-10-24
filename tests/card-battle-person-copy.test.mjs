import {test} from 'node:test';
import assert from 'node:assert/strict';
import {HISTORICAL_CARDS,cardText} from '../src/card-battle.mjs';
import {compactPersonText} from '../src/card-battle-person-copy.mjs';
test('100 historical face summaries remain short and leave full rules and actual effects intact',()=>{
 const original=JSON.stringify(HISTORICAL_CARDS);
 for(const d of HISTORICAL_CARDS){const text=compactPersonText(d);assert.ok(text.length<=26,d.name+': '+text);assert.ok(!text.includes('登场：'));assert.ok(!text.includes('…'));assert.ok(text.length<=cardText(d).length,d.name);}
 assert.equal(JSON.stringify(HISTORICAL_CARDS),original);
});
test('compact copy preserves targeting, duration and key numbers for distinct personal effects',()=>{
 const text=name=>compactPersonText(HISTORICAL_CARDS.find(d=>d.name===name));
 assert.equal(text('刘基'),'抽1计策；下张计策−1费（本回合）');
 assert.equal(text('苏轼'),'主将护甲+3；主将回血3');
 assert.equal(text('岳飞'),'突袭；至多2个其他友方步兵攻+1（本回合）');
 assert.equal(text('张飞'),'护卫；敌方部队受1伤害');
 assert.equal(text('李牧'),'护卫；反骑（主动攻骑兵+2攻）；主将护甲+1');
 const d={type:'general',enter:[{op:'draw',n:1,filter:'low'}],death:[{op:'damage',n:2,target:'enemy_character'},{op:'refund',n:1}]};
 assert.equal(compactPersonText(d),'抽1张≤2费牌；遗计：敌方角色受2伤害，军令+1（本回合）');
});
test('other card types and future unknown effects retain full rule text',()=>{
 const spell={type:'spell',enter:[{op:'damage',n:2,target:'enemy_character'}]};assert.equal(compactPersonText(spell),cardText(spell));
 const unknown={type:'general',enter:[{op:'future'}],tags:['taunt']};assert.equal(compactPersonText(unknown),cardText(unknown));
});
