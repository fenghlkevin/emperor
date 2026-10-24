import {test} from 'node:test';
import assert from 'node:assert/strict';
import {cardStatuses,statBreakdown,effectNotice} from '../src/card-battle-status.mjs';
const card=(patch={})=>({type:'troop',attack:1,hp:2,maxHp:2,printedAttack:1,printedHp:2,buffAttack:0,buffHealth:0,tempAttack:0,frozen:false,silenced:false,tags:[],definition:{tags:[]},...patch});
test('applied attack bonus and duration survive serialization and explain 1 + 3 = 4',()=>{
 const x=card({attack:4,tempAttack:3}),before=JSON.stringify(x),rows=cardStatuses(JSON.parse(before));assert.equal(rows[0].label,'攻+3 · 本回合');assert.match(rows[0].description,/本回合结束失效/);assert.match(statBreakdown(x).attack,/1（基础） \+3（本回合） = 4/);assert.equal(JSON.stringify(x),before);
 assert.deepEqual(cardStatuses(card()),[]);assert.deepEqual(cardStatuses({type:'tactic'}),[]);
});
test('all persistent effects and removals are derived from saved state, not the latest action',()=>{
 const x=card({attack:3,maxHp:4,buffAttack:2,buffHealth:2,tags:['shield','taunt'],frozen:true,silenced:true}),rows=cardStatuses(x);assert.deepEqual(rows.map(x=>x.key),['freeze','silence','attack','health','shield','granted-taunt']);assert.match(rows.find(x=>x.key==='shield').description,/下一次伤害/);
 const cleared=card({silenced:true});assert.deepEqual(cardStatuses(cleared).map(x=>x.key),['silence']);assert.equal(cardStatuses(card({definition:{tags:['taunt']},tags:['taunt']})).length,0);
 assert.equal(cardStatuses(card({buffAttack:-1,attack:0}))[0].tone,'weakened');assert.match(statBreakdown(x).health,/2（基础） \+2（持续修正） = 4/);
});
test('hit notices use attack and maximum health changes rather than summing unlike numbers',()=>{
 const before={cards:{catalog:{x:card()}}},after={cards:{catalog:{x:card({attack:4,tempAttack:3})}}};assert.equal(effectNotice({type:'buff',target:'x'},before,after),'攻击+3 · 本回合');
 after.cards.catalog.x=card({attack:3,maxHp:4,buffAttack:2,buffHealth:2});assert.equal(effectNotice({type:'buff',target:'x'},before,after),'攻击+2 · 生命上限+2');
 assert.equal(effectNotice({type:'silence'},before,after),'已沉默 · 原技能移除');
});
