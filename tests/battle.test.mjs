import test from 'node:test';import assert from 'node:assert/strict';
import {newGame,validateSave} from '../src/game.mjs';

import {beginWar,advanceWar,finishWar,generals,borderingCountries,quoteWar} from '../src/war.mjs';
import {active,aiAction,actBattle,reachable,bonuses,check} from '../src/battle.mjs';
function setup(n=1){const s=newGame('战棋'),gs=generals(s.domestic),c={id:1,kind:'war',kitVersion:1,commanderSquad:{kind:'infantry',count:100},targetId:borderingCountries(s.domestic)[0].id,generalId:gs[0].id,squads:Array.from({length:n},(_,i)=>({kind:'spears',count:50,generalId:gs[i+1].id}))};return {s,c};}
test('up to six unique squad leaders, whole kit reservations, command positions and save reload',()=>{const {s,c}=setup(6);assert.equal(quoteWar(s,c).details.friendly.reduce((n,u)=>n+u.count,0),400);const n=beginWar(s,c),b=n.domestic.war.battle;assert.equal(b.units.filter(u=>u.side==='home'&&!u.commander).length,6);assert.equal(b.units.find(u=>u.side==='home'&&u.commander).x,0);assert.equal(n.domestic.centralArmy.soldiers,s.domestic.centralArmy.soldiers);validateSave(JSON.parse(JSON.stringify(n)));assert.throws(()=>beginWar(n,c));const bad=structuredClone(c);bad.squads[1].generalId=bad.squads[0].generalId;assert.throws(()=>beginWar(s,bad));bad.squads=c.squads.concat(c.squads[0]);assert.throws(()=>beginWar(s,bad));assert.equal(s.domestic.war.battle,undefined);});
test('movement is blocked by occupied cells, invalid orders atomic, bonuses increase',()=>{const {s,c}=setup(),n=beginWar(s,c),b=n.domestic.war.battle,u=active(b),before=structuredClone(b);assert.throws(()=>actBattle(b,{type:'move',x:u.x,y:u.y}));assert.deepEqual(b,before);assert.ok(reachable(b).length);assert.ok(bonuses({martial:90}).attack>bonuses({martial:10}).attack);assert.ok(bonuses({leadership:90}).aura>bonuses({leadership:10}).aura);});
test('retreat returns living troops, no fake casualties and no duplicate settlement',()=>{const {s,c}=setup();let n=beginWar(s,c);while(active(n.domestic.war.battle).side!=='home')n=advanceWar(n,aiAction(n.domestic.war.battle));n=advanceWar(n,{type:'retreat'});assert.equal(n.domestic.war.battle.result,'defeat');const losses=n.domestic.war.battle.units.filter(u=>u.side==='home').reduce((v,u)=>v+u.dead,0);const result=finishWar(n);assert.equal(result.state.domestic.centralArmy.soldiers,s.domestic.centralArmy.soldiers-losses);assert.equal(result.state.domestic.war.battle,undefined);assert.throws(()=>finishWar(result.state));validateSave(result.state);});
test('automatic play reaches elimination and persists actual casualties',()=>{const {s,c}=setup(3);let n=beginWar(s,c),steps=0;while(!n.domestic.war.battle.result&&steps++<3000){n=advanceWar(n,aiAction(n.domestic.war.battle));validateSave(JSON.parse(JSON.stringify(n)));}assert.ok(n.domestic.war.battle.result,`stalled at ${steps}`);const b=n.domestic.war.battle,homeDead=b.units.filter(u=>u.side==='home').reduce((v,u)=>v+u.dead,0);assert.equal(finishWar(n).state.domestic.centralArmy.soldiers,s.domestic.centralArmy.soldiers-homeDead);});
test('commander alone can hold the battle; corrupt battle saves rejected',()=>{const {s,c}=setup(),n=beginWar(s,c),b=n.domestic.war.battle;for(const u of b.units.filter(u=>u.side==='enemy'&&!u.commander)){u.dead=u.initial;u.count=0;}assert.equal(check(b),null);b.units.find(u=>u.side==='enemy'&&u.commander).fled=true;assert.equal(check(b),'victory');const bad=beginWar(s,c);bad.domestic.war.battle.units[0].x=999;assert.throws(()=>validateSave(bad));});

// Rules exercised in close formation so movement/attack phases are deterministic.
async function tactical(){const {createBattle}=await import('../src/battle.mjs');return createBattle({command:{kind:'war',kitVersion:1,squads:[{kind:'cavalry',count:100}]},friendly:[{kind:'cavalry',name:'骑队',count:100,general:{}},{kind:'infantry',name:'我将',commander:true,count:100,general:{}}],enemy:[{kind:'infantry',name:'敌步',count:100,general:{}},{kind:'infantry',name:'敌将',commander:true,count:100,general:{}}],training:60,enemyTraining:60,targetName:'测试'});}
test('move retains activation, exposes adjacent attacks, forbids a second move and survives reload',async()=>{
 const {attackOptions,movementPath,validateBattle}=await import('../src/battle.mjs'),b=await tactical(),u=active(b),enemy=b.units.find(t=>t.side==='enemy'&&!t.commander);enemy.x=6;enemy.y=4;
 const n=actBattle(b,{type:'move',x:5,y:4});assert.equal(active(n).id,u.id);assert.equal(active(n).moved,true);assert.equal(reachable(n).length,0);assert.ok(attackOptions(n).some(o=>o.targetId===enemy.id));assert.throws(()=>actBattle(n,{type:'move',x:4,y:4}));assert.throws(()=>actBattle(n,{type:'wait'}));validateBattle(JSON.parse(JSON.stringify(n)));
 const hit=actBattle(n,{type:'attack',target:enemy.id});assert.notEqual(active(hit)?.id,u.id);assert.ok(hit.units.find(t=>t.id===enemy.id).count<100);assert.equal(b.units.find(t=>t.id===u.id).x,2);
 const path=movementPath(b,u,5,4);assert.equal(path.length,3);for(let i=0;i<path.length;i++){const {neighbors}=await import('../src/battle.mjs'),prev=i?path[i-1]:u;assert.ok(neighbors(prev.x,prev.y).some(([x,y])=>x===path[i].x&&y===path[i].y));}
});
test('preview exactly matches casualties and one retaliation; dead targets never retaliate',async()=>{
 const {attackPreview,damageEstimate}=await import('../src/battle.mjs'),b=await tactical(),u=active(b),t=b.units.find(t=>t.side==='enemy'&&!t.commander);t.x=3;t.y=4;
 const p=attackPreview(b,u,t),n=actBattle(b,{type:'attack',target:t.id});assert.equal(100-n.units.find(v=>v.id===t.id).count,p.killed);assert.equal(100-n.units.find(v=>v.id===u.id).count,p.retaliation);assert.ok(n.units.find(v=>v.id===t.id).retaliated);
 t.retaliated=true;assert.equal(attackPreview(b,u,t).retaliation,0);assert.equal(actBattle(b,{type:'attack',target:t.id}).units.find(v=>v.id===u.id).count,100);
 t.count=1;t.dead=99;t.retaliated=false;assert.equal(attackPreview(b,u,t).canRetaliate,false);assert.equal(actBattle(b,{type:'attack',target:t.id}).units.find(v=>v.id===u.id).count,100);
 t.count=100;t.dead=0;const plain=damageEstimate(b,u,t);t.defending=true;assert.ok(damageEstimate(b,u,t)<plain);
});
test('waiting phase is slow to fast; defend/end finish an activation; flags reset next round',async()=>{
 const {movement}=await import('../src/battle.mjs');let b=await tactical();b=actBattle(b,{type:'wait'});b=actBattle(b,{type:'wait'});b=actBattle(b,{type:'wait'});b=actBattle(b,{type:'wait'});
 const speeds=b.order.slice(b.cursor).map(id=>movement(b.units.find(u=>u.id===id)));assert.deepEqual(speeds,[...speeds].sort((a,c)=>a-c));assert.throws(()=>actBattle(b,{type:'wait'}));
 const defender=active(b).id;b=actBattle(b,{type:'defend'});assert.equal(b.units.find(u=>u.id===defender).defending,true);while(b.round===1)b=actBattle(b,{type:'end'});assert.ok(b.units.every(u=>!u.moved&&!u.waited&&!u.retaliated&&!u.defending));
});
test('unreachable attacks and invalid approach directions are atomic; occupied paths cannot be crossed',async()=>{
 const {attackOptions,movementPath,neighbors}=await import('../src/battle.mjs'),b=await tactical(),u=active(b),t=b.units.find(t=>t.side==='enemy'&&!t.commander),copy=structuredClone(b);assert.equal(attackOptions(b).length,0);assert.throws(()=>actBattle(b,{type:'attack',target:t.id}));assert.deepEqual(b,copy);
 t.x=5;t.y=4;assert.throws(()=>actBattle(b,{type:'attack',target:t.id,from:{x:12,y:0}}));const path=movementPath(b,u,6,4);if(path)assert.ok(!path.some(p=>p.x===5&&p.y===4));assert.ok(neighbors(2,4).length===6);
});
test('missing or corrupt tactical action flags are rejected',async()=>{
 const {validateBattle}=await import('../src/battle.mjs'),b=await tactical();for(const key of ['moved','waited']){const bad=structuredClone(b);delete bad.units[0][key];assert.throws(()=>validateBattle(bad));}b.units[0].moved='yes';assert.throws(()=>validateBattle(b));
});
test('AI uses a free attack route, then ends its move instead of moving twice',async()=>{
 const {validateBattle,alive}=await import('../src/battle.mjs');let b=await tactical();const u=active(b),t=b.units.find(t=>t.side==='enemy'&&!t.commander);u.x=1;u.y=4;t.x=10;t.y=4;
 const first=aiAction(b);assert.equal(first.type,'move');b=actBattle(b,first);assert.equal(active(b).id,u.id);assert.equal(aiAction(b).type,'end');b=actBattle(b,aiAction(b));assert.notEqual(active(b).id,u.id);validateBattle(b);assert.equal(b.units.filter(alive).length,4);
});

test('defeating a commander ends combat while surviving squads remain untouched',async()=>{
 let b=await tactical();const target=b.units.find(u=>u.commander&&u.side==='enemy'),squad=b.units.find(u=>!u.commander&&u.side==='enemy');target.x=3;target.y=4;target.count=1;target.dead=99;const next=actBattle(b,{type:'attack',target:target.id});assert.equal(next.result,'victory');assert.equal(next.cursor,b.cursor);assert.equal(next.units.find(u=>u.id===squad.id).count,100);assert.throws(()=>actBattle(next,{type:'end'}),/战斗已结束/);
});
test('a commander defeated by retaliation immediately loses with friendly troops still alive',async()=>{
 const b=await tactical(),commander=b.units.find(u=>u.commander&&u.side==='home'),enemy=b.units.find(u=>!u.commander&&u.side==='enemy');commander.x=2;commander.y=5;commander.count=1;commander.dead=99;enemy.x=3;enemy.y=5;b.order=[commander.id,...b.order.filter(id=>id!==commander.id)];const next=actBattle(b,{type:'attack',target:enemy.id});assert.equal(next.result,'defeat');assert.equal(next.units.find(u=>u.id==='u0').count,100);
});
test('front, flank and rear use target facing; commander has a measured attack bonus',async()=>{
 const {attackAspect,damageEstimate}=await import('../src/battle.mjs'),b=await tactical(),a=active(b),t=b.units.find(u=>u.side==='enemy'&&!u.commander);t.x=3;t.y=4;t.facing=3;const front=damageEstimate(b,a,t);assert.equal(attackAspect(a,t).name,'正面');t.facing=1;const side=damageEstimate(b,a,t);assert.equal(attackAspect(a,t).name,'侧击');t.facing=0;const rear=damageEstimate(b,a,t);assert.equal(attackAspect(a,t).name,'背击');assert.ok(side>front&&rear>side);t.facing=3;const leader=damageEstimate(b,{...a,commander:true},t);assert.ok(leader>front);assert.ok(Math.abs(leader/front-1.2)<.04);
});
test('flank preview uses the chosen landing cell and defender turns before retaliation',async()=>{
 const {attackPreview,attackOptions,directionTo,validateBattle}=await import('../src/battle.mjs'),b=await tactical(),a=active(b),t=b.units.find(u=>u.side==='enemy'&&!u.commander);t.x=4;t.y=4;t.facing=3;
 const option=attackOptions(b,a).find(o=>o.targetId===t.id),from=option.approaches.find(p=>p.x===5&&p.y===4);assert.ok(from);const p=attackPreview(b,a,t,from);assert.equal(p.aspect,'背击');const next=actBattle(b,{type:'attack',target:t.id,from}),na=next.units.find(u=>u.id===a.id),nt=next.units.find(u=>u.id===t.id);assert.equal(t.count-nt.count,p.killed);assert.equal(a.count-na.count,p.retaliation);assert.equal(nt.facing,directionTo(nt,na));assert.equal(na.facing,directionTo(na,nt));validateBattle(next);assert.equal(t.facing,3);
});
test('movement records its final segment facing and malformed facing cannot load',async()=>{
 const {directionTo,movementPath,validateBattle,facingOf}=await import('../src/battle.mjs'),b=await tactical(),a=active(b),path=movementPath(b,a,3,3),next=actBattle(b,{type:'move',x:3,y:3});assert.equal(active(next).facing,directionTo(path.length>1?path.at(-2):a,path.at(-1)));assert.equal(facingOf(b.units.find(u=>u.side==='enemy')),3);const bad=structuredClone(b);delete bad.units[0].facing;assert.throws(()=>validateBattle(bad));b.units[0].facing=6;assert.throws(()=>validateBattle(b));
});
test('AI selects a reachable rear approach and its preview is the exact chosen action',async()=>{
 const {attackPreview,attackOptions}=await import('../src/battle.mjs'),b=await tactical(),a=active(b),t=b.units.find(u=>u.side==='enemy'&&!u.commander);t.x=4;t.y=4;t.facing=3;t.retaliated=true;const action=aiAction(b);assert.equal(action.type,'attack');assert.equal(action.target,t.id);const p=attackPreview(b,a,t,action.from);assert.equal(p.aspect,'背击');const n=actBattle(b,action);assert.equal(t.count-n.units.find(u=>u.id===t.id).count,p.killed);assert.ok(attackOptions(b,a).find(o=>o.targetId===t.id).approaches.some(pos=>pos.x===action.from.x&&pos.y===action.from.y));
});
