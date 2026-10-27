import {test} from 'node:test';
import assert from 'node:assert/strict';
import {battleCardStatuses,battleStatBreakdown} from '../src/card-battle-status-view.mjs';
import {cardStateBorders,cardStateEffectMarkup,cardSurfaceState} from '../src/card-battle-status-effects.mjs';
const card=(patch={})=>({id:'unit',name:'前锋',type:'general',printedAttack:3,printedHp:7,attack:3,maxHp:7,hp:7,buffAttack:0,buffHealth:0,tempAttack:0,tags:[],frozen:false,silenced:false,definition:{tags:[]},...patch});
const snapshot=(attack=3,tempAttack=0,maxHp=7,tags=[])=>({attack,tempAttack,maxHp,tags});
const event=(before,after,attack,source='鼓舞')=>({type:'buff',subject:{id:'unit'},before,after,...(attack===undefined?{}:{attack}),cause:{source:{id:source,name:source}},round:2});
const battle=events=>({cards:{history:{entries:[{round:2,actor:{id:'actor',name:'人物'},events}]}}});
test('public history preserves opposing modifiers even when their net value is zero',()=>{
 const b=battle([event(snapshot(),snapshot(7),4,'正面军令'),event(snapshot(7),snapshot(3),-4,'负面军令')]),x=card(),before=JSON.stringify({b,x}),list=battleCardStatuses(b,x);
 assert.deepEqual(list.map(s=>[s.key,s.value]),[['attack',4],['attack-negative',-4]]);
 assert.deepEqual(cardStateBorders(list),['positive','negative']);
 assert.match(battleStatBreakdown(x,list).attack,/3（基础） \+4（持续修正） −4（持续修正） = 3/);
 assert.equal(list[0].sources[0].name,'正面军令');assert.equal(list[1].sources[0].name,'负面军令');assert.equal(JSON.stringify({b,x}),before);
});
test('temporary effects expire without removing persistent sources or negative modifiers',()=>{
 const events=[event(snapshot(),snapshot(7),4),event(snapshot(7),snapshot(9,2),2,'旌台'),event(snapshot(9,2),snapshot(7,2),-2,'牵制'),{type:'expire',subject:{id:'unit'},attack:-2,thaw:true}];
 const list=battleCardStatuses(battle(events),card({attack:5,buffAttack:2}));
 assert.equal(list.some(s=>s.kind==='temporary'),false);assert.deepEqual(list.map(s=>s.value),[4,-2]);
});
test('silence resets old sources; new buffs and shields still create independent positive and negative frames',()=>{
 const events=[event(snapshot(),snapshot(7),4,'旧军令'),{type:'silence',subject:{id:'unit'},cause:{source:{id:'silencer',name:'扰阵'}}},event(snapshot(),snapshot(5,0,10,['shield']),2,'新军令')];
 const x=card({attack:5,buffAttack:2,buffHealth:3,maxHp:10,hp:10,tags:['shield'],silenced:true}),list=battleCardStatuses(battle(events),x);
 assert.deepEqual(cardStateBorders(list),['positive','negative']);assert.equal(list.find(s=>s.key==='attack').sources[0].name,'新军令');assert.equal(list.find(s=>s.key==='shield').sources[0].name,'新军令');assert.equal(list.some(s=>s.sources.some(src=>src.name==='旧军令')),false);
 const html=cardStateEffectMarkup(x,list);assert.equal((html.match(/data-state-border=/g)??[]).length,2);assert.doesNotMatch(html,/animation|ellipse|circle/);
});
test('setattack replaces earlier modifiers instead of pretending to stack a second buff',()=>{
 const b=battle([event(snapshot(),snapshot(7),4,'旧军令'),event(snapshot(7),snapshot(1),undefined,'定攻')]);
 const list=battleCardStatuses(b,card({attack:1,buffAttack:-2}));assert.equal(list.length,1);assert.equal(list[0].value,-2);assert.equal(list[0].sources[0].name,'定攻');assert.deepEqual(cardStateBorders(list),['negative']);
});
test('partial or stale history falls back to actual saved state with an honest unknown source',()=>{
 const list=battleCardStatuses(battle([event(snapshot(),snapshot(7),4,'陈旧事件')]),card({attack:5,buffAttack:2}));assert.equal(list.length,1);assert.equal(list[0].value,2);assert.equal(list[0].sources[0].name,'来源未记录');
 assert.deepEqual(battleCardStatuses(battle([]),card()),[]);assert.deepEqual(cardStateBorders([]),[]);
});
test('all actual statuses map to distinct live emitters, without badges or bitmap shells',()=>{
 const x=card({attack:9,buffAttack:4,tempAttack:2,buffHealth:3,maxHp:10,tags:['shield','taunt','rush','stealth','anti','anti_horse','pierce'],frozen:true,silenced:true}),list=battleCardStatuses(battle([]),x),states=cardSurfaceState(list),markup=cardStateEffectMarkup(x,list);
 assert.equal(list.length,12);assert.equal(states.length,12);assert.equal(new Set(states.map(s=>s.id)).size,12);assert.match(markup,/<canvas/);assert.doesNotMatch(markup,/img|svg|badge|ellipse/);assert.deepEqual(cardStateBorders(list),['positive','negative']);
});
test('clamped negative attack still preserves its full modifier and the separate positive source',()=>{
 const events=[event(snapshot(),snapshot(7),4,'鼓舞'),event(snapshot(7),snapshot(0),-10,'削弱')],list=battleCardStatuses(battle(events),card({attack:0,buffAttack:-6}));assert.deepEqual(list.map(s=>s.value),[4,-10]);assert.deepEqual(cardSurfaceState(list).map(s=>s.id),['attack','weak']);
});
test('ending the owner turn clears opposing temporary modifiers even with zero net attack change',()=>{
 const b=battle([event(snapshot(),snapshot(5,2),2),event(snapshot(5,2),snapshot(),-2)]);b.cards.history.entries.push({type:'end',side:'home',events:[]});const list=battleCardStatuses(b,card({side:'home'}));assert.equal(list.length,0);
});
