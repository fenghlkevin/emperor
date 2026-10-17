import test from 'node:test';
import assert from 'node:assert/strict';
import {newGame,advance,validateSave} from '../src/game.mjs';
import {palaceAction,settleRoyalFamily,MISCARRIAGE_CHANCE,PRINCE_DEATH_CHANCE} from '../src/emperor.mjs';
test('per-turn risks match cumulative game targets',()=>{
 assert.ok(Math.abs(1-Math.pow(1-MISCARRIAGE_CHANCE,30)-.25)<1e-12);
 assert.ok(Math.abs(1-Math.pow(1-PRINCE_DEATH_CHANCE,18*36)-.40)<1e-12);
});
test('conception, ten month pregnancy, birth, birthday and save roundtrip',t=>{
 t.mock.method(Math,'random',()=>0);let s=newGame('帝'),id=s.harem.members[0].id;
 s=palaceAction(s,'company',{id}).state;assert.ok(s.harem.members[0].pregnancy);
 assert.throws(()=>palaceAction(s,'company',{id}),/怀胎/);
 s=validateSave(JSON.parse(JSON.stringify(s)));t.mock.method(Math,'random',()=>.99);
 for(let i=0;i<29;i++)advance(s);assert.equal(s.harem.children.length,0);
 advance(s);assert.equal(s.harem.children.length,1);assert.equal(s.harem.children[0].age,0);assert.equal(s.harem.members[0].pregnancy,undefined);
 assert.doesNotThrow(()=>palaceAction(s,'company',{id}));
 s.turn+=35;settleRoyalFamily(s);assert.equal(s.harem.children[0].age,0);s.turn++;settleRoyalFamily(s);assert.equal(s.harem.children[0].age,1);
 assert.doesNotThrow(()=>validateSave(JSON.parse(JSON.stringify(s))));
});
test('no conception on failed roll; palace cannot directly marry children',t=>{
 t.mock.method(Math,'random',()=>.99);let s=newGame('帝');assert.equal(palaceAction(s,'company',{id:s.harem.members[0].id}).state.harem.members[0].pregnancy,undefined);
 s.phase=1;const countryId=s.domestic.countries.find(c=>c.id!==s.domestic.playerCountryId).id;
 for(const gender of ['男','女']){s.harem.children.push({id:gender,name:'皇嗣',gender,age:16,motherId:s.harem.members[0].id,status:'palace'});assert.throws(()=>palaceAction(s,'marry-child',{id:gender,countryId}),/外臣商议/);assert.equal(s.harem.children.at(-1).status,'palace');}
 assert.equal(validateSave(JSON.parse(JSON.stringify(s))).harem.children.length,2);
});
test('miscarriage is random, ends pregnancy without a birth and permits company',()=>{
 let s=newGame('帝');const id=s.harem.members[0].id;s.harem.members[0].pregnancy={conceivedTurn:1};s.turn=2;
 settleRoyalFamily(s,()=>0);assert.equal(s.harem.members[0].pregnancy,undefined);assert.equal(s.harem.children.length,0);assert.match(s.harem.history[0],/流产/);
 assert.doesNotThrow(()=>palaceAction(s,'company',{id}));assert.doesNotThrow(()=>validateSave(JSON.parse(JSON.stringify(s))));
});
test('under eighteen palace princes may die, remain recorded, cannot marry or age again',()=>{
 const s=newGame('帝');s.turn=2;s.phase=1;
 s.harem.children=[['young','男',17,'palace'],['adult','男',18,'palace'],['girl','女',10,'palace'],['away','男',15,'married']].map(([id,gender,age,status])=>({id,name:id,gender,age,status,motherId:s.harem.members[0].id,...(status==='married'?{spouseCountryId:s.domestic.countries[1].id,marriedTurn:1}:{})}));
 settleRoyalFamily(s,()=>0);assert.deepEqual(s.harem.children.map(c=>c.status),['deceased','palace','palace','married']);assert.equal(s.harem.children[0].deathTurn,2);
 assert.throws(()=>palaceAction(s,'marry-child',{id:'young',countryId:s.domestic.countries[1].id}));
 s.turn=36;advance(s);assert.equal(s.harem.children[0].age,17);assert.equal(s.harem.children.length,4);assert.doesNotThrow(()=>validateSave(JSON.parse(JSON.stringify(s))));
});
test('failed random rolls preserve pregnancy and prince; same turn cannot roll again',()=>{
 const s=newGame('帝');s.turn=2;s.harem.members[0].pregnancy={conceivedTurn:1};s.harem.children=[{id:'p',name:'皇子',gender:'男',age:2,status:'palace',motherId:s.harem.members[0].id}];
 settleRoyalFamily(s,()=>.99);settleRoyalFamily(s,()=>0);assert.ok(s.harem.members[0].pregnancy);assert.equal(s.harem.children[0].status,'palace');
 s.turn++;settleRoyalFamily(s,()=>0);assert.equal(s.harem.children[0].status,'deceased');assert.equal(s.harem.members[0].pregnancy,undefined);
});
test('pregnancy notices wait for next turn, survive saving and acknowledgement removes only one event',async t=>{
 const {pendingRoyalEvent}=await import('../src/royal-events.mjs');t.mock.method(Math,'random',()=>0);
 let s=newGame('帝');s=palaceAction(s,'company',{id:s.harem.members[0].id}).state;
 assert.equal(pendingRoyalEvent(s),undefined);assert.equal(s.harem.royalNotices[0].kind,'pregnancy');
 s=validateSave(JSON.parse(JSON.stringify(s)));advance(s);
 assert.equal(pendingRoyalEvent(s).kind,'pregnancy');assert.deepEqual(s.harem.royalNotices.map(e=>e.kind),['pregnancy','miscarriage']);
 const id=pendingRoyalEvent(s).id;s.harem.royalNotices=s.harem.royalNotices.filter(e=>e.id!==id);
 s=validateSave(JSON.parse(JSON.stringify(s)));assert.equal(pendingRoyalEvent(s).kind,'miscarriage');
});
test('birth of either sex and prince death produce distinct start-of-turn notices',()=>{
 for(const genderRoll of [0,.99]){const s=newGame('帝');s.turn=31;s.harem.members[0].pregnancy={conceivedTurn:1};let roll=0;settleRoyalFamily(s,()=>roll++===0?.99:genderRoll);assert.equal(s.harem.royalNotices[0].kind,'birth');assert.match(s.harem.royalNotices[0].message,genderRoll===0?/皇子/:/公主/);}
 const s=newGame('帝');s.turn=2;s.harem.children=[{id:'p',name:'皇子',gender:'男',age:1,status:'palace',motherId:s.harem.members[0].id}];settleRoyalFamily(s,()=>0);assert.equal(s.harem.royalNotices[0].kind,'death');assert.doesNotThrow(()=>validateSave(JSON.parse(JSON.stringify(s))));
});
