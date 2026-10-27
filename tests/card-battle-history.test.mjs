import {test} from 'node:test';import assert from 'node:assert/strict';
import {fixture} from '../scripts/card-battle-balance-fixture.mjs';
import {cardAI,actCards,actCardsMutable,validateCards,HISTORICAL_CARDS} from '../src/card-battle.mjs';
import {publicCardHistory,validateCardHistory} from '../src/card-battle-history.mjs';
import {advanceWar} from '../src/war.mjs';import {validateSave} from '../src/game.mjs';
import {persistCandidate} from '../src/persistence.mjs';
import {createCardBattlePreview} from '../scripts/card-battle-preview-state.mjs';
const begin=b=>(actCardsMutable(b,cardAI(b)),b),last=b=>b.cards.history.entries.at(-1);
function place(b,side,select=x=>x.type!=='tactic'){const c=b.cards,p=c.players[side],id=[...p.hand,...p.deck,...p.grave].find(id=>select(c.catalog[id]));assert.ok(id);for(const z of ['hand','deck','grave'])p[z]=p[z].filter(x=>x!==id);p.board.push(id);const x=c.catalog[id];x.ready=true;x.played=++c.sequence;return x;}
function give(b,id){const p=b.cards.players.home,x=[...p.hand,...p.deck,...p.grave].find(k=>b.cards.catalog[k].definitionId===id);assert.ok(x,id);for(const z of ['hand','deck','grave'])p[z]=p[z].filter(k=>k!==x);p.hand.push(x);return x;}
function blank(options={}){const b=begin(fixture(options));for(const p of Object.values(b.cards.players))p.mana=p.maxMana=10;return b;}

test('complete production games preserve contiguous actions, exact costs and serialized history without changing engine decisions',()=>{
 for(const first of ['home','enemy']){
  let b=fixture({first}),without=structuredClone(b),steps=0;
  while(!b.result&&steps<600){const action=cardAI(b);assert.deepEqual(cardAI(without),action);b=actCards(b,action);actCardsMutable(without,action);delete without.cards.history;const stripped=structuredClone(b);delete stripped.cards.history;assert.deepEqual(stripped,without);steps++;assert.equal(last(b).id,steps);if(steps%23===0){b=JSON.parse(JSON.stringify(b));validateCards(b);}}
  assert.ok(b.result);assert.equal(b.cards.history.entries.length,steps);validateCards(b);
 }
});

test('attacks record both damage and simultaneous retaliation; shield consumption changes tags without invented damage',()=>{
 const b=blank(),a=place(b,'home'),target=place(b,'enemy');for(const [x,attack]of [[a,5],[target,3]]){x.attack=attack;x.hp=x.maxHp=10;x.tags=[];}
 actCardsMutable(b,{type:'attack',id:a.id,target:target.id});const row=last(b);assert.equal(row.cost,0);assert.equal(row.actor.id,a.id);assert.equal(row.target.id,target.id);
 const hit=row.events.find(e=>e.type==='damage'&&e.subject.id===target.id),counter=row.events.find(e=>e.cause.kind==='counterattack');assert.equal(hit.before.hp,10);assert.equal(hit.after.hp,5);assert.equal(counter.before.hp,10);assert.equal(counter.after.hp,7);assert.equal(counter.cause.source.id,target.id);
 a.ready=true;target.tags=['shield'];const hp=target.hp;actCardsMutable(b,{type:'attack',id:a.id,target:target.id});const shield=last(b).events.find(e=>e.type==='shield');assert.ok(shield.before.tags.includes('shield'));assert.ok(!shield.after.tags.includes('shield'));assert.equal(shield.after.hp,hp);validateCardHistory(b);
});

test('temporary buffs, thawing, silence, armor and fatigue retain explicit changes and reasons',()=>{
 const b=blank(),friend=place(b,'home'),foe=place(b,'enemy'),base=friend.attack;
 actCardsMutable(b,{type:'play',id:give(b,'assault'),target:friend.id});const buff=last(b).events.find(e=>e.type==='buff');assert.equal(buff.after.attack,base+3);assert.equal(buff.cause.kind,'enter');assert.equal(last(b).cost,1);
 actCardsMutable(b,{type:'play',id:give(b,'pin'),target:foe.id});assert.equal(last(b).events.find(e=>e.type==='freeze').after.frozen,true);
 actCardsMutable(b,{type:'end'});const expiry=last(b).events.find(e=>e.type==='expire');assert.equal(expiry.after.attack,base);assert.equal(expiry.cause.kind,'turn-end');actCardsMutable(b,{type:'end'});assert.ok(last(b).events.some(e=>e.type==='expire'&&e.thaw));
 foe.tags=['shield'];foe.frozen=true;actCardsMutable(b,{type:'play',id:give(b,'dispel'),target:foe.id});const silence=last(b).events.find(e=>e.type==='silence');assert.ok(silence.before.tags.includes('shield'));assert.equal(silence.after.silenced,true);assert.equal(silence.after.frozen,false);
 const f=blank({hero:'intelligence'}),p=f.cards.players.home;p.armor=1;actCardsMutable(f,{type:'power'});const damage=last(f).events.find(e=>e.type==='damage');assert.equal(damage.before.armor,1);assert.equal(damage.after.armor,0);assert.equal(last(f).cost,2);
 p.grave.push(...p.deck);p.deck=[];p.gaps=[];actCardsMutable(f,{type:'end'});actCardsMutable(f,{type:'end'});assert.ok(last(f).events.some(e=>e.type==='damage'&&e.cause.kind==='fatigue'));validateCardHistory(f);
});

test('death effects remain ordered after deaths and reference their actual source',()=>{
 const person=HISTORICAL_CARDS.find(d=>d.death.some(f=>f.op==='draw')),b=blank({people:[person]}),a=place(b,'home',x=>x.type==='general'&&x.definition.death.length),foe=place(b,'enemy');a.hp=1;a.attack=1;a.tags=[];foe.hp=20;foe.attack=10;foe.tags=[];
 actCardsMutable(b,{type:'attack',id:a.id,target:foe.id});const row=last(b),death=row.events.find(e=>e.type==='death'&&e.subject.id===a.id),effect=row.events.find(e=>e.cause.kind==='death');assert.ok(death);assert.ok(effect);assert.ok(effect.ordinal>death.ordinal);assert.equal(effect.cause.source.id,a.id);assert.equal(effect.cause.effect,'draw');validateCardHistory(b);
 const empty=blank({people:[person]}),d=place(empty,'home',x=>x.type==='general'&&x.definition.death.length),t=place(empty,'enemy');d.hp=1;d.attack=1;d.tags=[];t.hp=20;t.attack=10;t.tags=[];const p=empty.cards.players.home;p.grave.push(...p.deck);p.deck=[];p.gaps=[];actCardsMutable(empty,{type:'attack',id:d.id,target:t.id});const fatigue=last(empty).events.find(e=>e.type==='fatigue');assert.ok(fatigue.cause.parents.some(parent=>parent.kind==='death'&&parent.source.id===d.id));validateCardHistory(empty);
});

test('enemy draws and burns expose no card identity, deck ordering or RNG information',()=>{
 const b=begin(fixture({first:'enemy'})),projection=publicCardHistory(b);assert.ok(projection.entries[0].events.some(e=>e.type==='draw'&&e.side==='enemy'&&!e.subject));
 const enemy=b.cards.players.enemy;for(const id of [...enemy.hand,...enemy.deck])b.cards.catalog[id].name='SECRET-'+id;enemy.deck.reverse();enemy.rng=999;assert.deepEqual(publicCardHistory(b),projection);assert.ok(!JSON.stringify(projection).includes('SECRET-'));
 const burn=begin(fixture());const e=burn.cards.players.enemy;while(e.hand.length<10)e.hand.push(e.deck.shift());actCardsMutable(burn,{type:'end'});const event=last(burn).events.find(e=>e.type==='burn');assert.equal(event.side,'enemy');assert.equal(event.subject,undefined);assert.equal(event.after,undefined);validateCardHistory(burn);
});

test('failed persistence publishes no record; retry and restoration retain each committed action once',()=>{
 const state=createCardBattlePreview(),before=structuredClone(state),candidate=advanceWar(state,{type:'mulligan',ids:[]});assert.throws(()=>persistCandidate(state,candidate,{getItem:()=>null,setItem:()=>{throw Error('full');}}),/保存失败/);assert.deepEqual(state,before);
 const values=new Map(),storage={getItem:k=>values.get(k)??null,setItem:(k,v)=>values.set(k,v)},retry=advanceWar(state,{type:'mulligan',ids:[]}),saved=persistCandidate(state,retry,storage);assert.equal(saved.domestic.war.battle.cards.history.entries.length,1);const restored=JSON.parse(JSON.stringify(saved));validateSave(restored);assert.deepEqual(publicCardHistory(restored.domestic.war.battle),publicCardHistory(saved.domestic.war.battle));
 assert.throws(()=>persistCandidate(saved,saved,storage),/状态已更新/);assert.equal(saved.domestic.war.battle.cards.history.entries.length,1);
});

test('old battles explicitly start partial history at the next valid action and reject illegal or tampered records',()=>{
 const fresh=fixture();assert.equal(publicCardHistory(fresh).partial,false);actCardsMutable(fresh,{type:'retreat'});assert.equal(fresh.cards.history.partial,false);
 const b=begin(fixture());actCardsMutable(b,{type:'end'});assert.ok(last(b).events.some(e=>e.ply===b.cards.ply&&e.type==='turn'));delete b.cards.history;const snapshot=JSON.stringify(b);assert.equal(publicCardHistory(b).partial,true);assert.equal(JSON.stringify(b),snapshot);const ply=b.cards.ply;actCardsMutable(b,cardAI(b));assert.equal(b.cards.history.startedPly,ply);assert.equal(b.cards.history.partial,true);assert.equal(last(b).id,1);validateCards(b);
 const old=structuredClone(b.cards.history);assert.throws(()=>actCards(b,{type:'play',id:'missing'}));assert.deepEqual(b.cards.history,old);
 for(const corrupt of [x=>x.cards.history.nextId++,x=>x.cards.history.entries[0].deck=['SECRET'],x=>x.cards.history.entries[0].resources.home.hand=['SECRET'],x=>x.cards.history.entries[0].actor.name='SECRET']){const bad=structuredClone(b);corrupt(bad);assert.throws(()=>publicCardHistory(bad),/记录无效/);}
 const hidden=begin(fixture({first:'enemy'})),bad=structuredClone(hidden),event=bad.cards.history.entries[0].events.find(e=>e.type==='draw'&&e.side==='enemy');event.subject={id:'enemy-hero',side:'enemy',type:'hero',name:bad.units.find(u=>u.side==='enemy'&&u.commander).general.name};assert.throws(()=>publicCardHistory(bad),/记录无效/);
});
