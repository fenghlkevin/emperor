import {test} from 'node:test';
import assert from 'node:assert/strict';
import {fixture} from '../scripts/card-battle-balance-fixture.mjs';
import {HISTORICAL_CARDS,actCardsMutable,legalCardActions} from '../src/card-battle.mjs';
import {PERSON_DEATH_LINES,personDeathSegments,applyDeathVisualEvent} from '../src/card-battle-person-death-presentation.mjs';
const defs=Object.keys(PERSON_DEATH_LINES).map(id=>HISTORICAL_CARDS.find(d=>d.person_id===id));
function place(b,side,select){const c=b.cards,p=c.players[side],id=[...p.hand,...p.deck].find(id=>select(c.catalog[id]));assert.ok(id);p.hand=p.hand.filter(v=>v!==id);p.deck=p.deck.filter(v=>v!==id);p.board.push(id);const x=c.catalog[id];x.ready=true;x.played=++c.sequence;return x;}
function scene(id,{silenced=false,empty=false,full=false,double=false}={}){
 const def=defs.find(d=>d.person_id===id),b=fixture({people:[def],people2:double?[def]:[]});actCardsMutable(b,{type:'mulligan',ids:[]});const p=b.cards.players.home;p.hero=20;p.armor=0;
 const a=place(b,'home',x=>x.historicalDefinitionId===id),t=place(b,'enemy',x=>double?x.historicalDefinitionId===id:x.type==='troop');
 a.hp=1;a.silenced=silenced;if(silenced)a.tags=[];a.ready=true;t.hp=double?1:20;t.maxHp=Math.max(t.maxHp,t.hp);t.attack=10;t.tags=[];if(double)a.attack=10;
 if(empty){p.grave.push(...p.deck);p.deck=[];p.gaps=[];}
 if(full)while(p.hand.length<10)p.hand.push(p.deck.shift());
 return {b,action:{type:'attack',id:a.id,target:t.id}};
}
test('all five committed death sources produce exact ID-linked rule text and scoped benefit indices without mutation',()=>{
 for(const d of defs){const {b,action}=scene(d.person_id),before=structuredClone(b);assert.ok(legalCardActions(b).some(a=>JSON.stringify(a)===JSON.stringify(action)));actCardsMutable(b,action);const frozen=JSON.stringify(b),segments=personDeathSegments(b);assert.equal(JSON.stringify(b),frozen);assert.equal(segments.length,1);const s=segments[0];assert.equal(s.personId,d.person_id);assert.ok(s.description.includes('遗计'));assert.ok(s.indices.length);assert.ok(s.indices.every(i=>i>s.deathIndex));assert.ok(s.line.length>5);
  const visual=structuredClone(before),history=b.cards.history.entries.at(-1).events;for(let i=0;i<b.cards.events.length;i++)applyDeathVisualEvent(visual,history[i]);assert.equal(visual.cards.players.home.hero,b.cards.players.home.hero);assert.equal(visual.cards.players.home.armor,b.cards.players.home.armor);assert.deepEqual(visual.cards.players.home.board,b.cards.players.home.board);assert.equal(JSON.stringify(b),frozen);
 }
});
test('silence suppresses all five death performances and formal death benefits',()=>{for(const d of defs){const {b,action}=scene(d.person_id,{silenced:true});actCardsMutable(b,action);assert.deepEqual(personDeathSegments(b),[]);assert.equal(b.cards.players.home.hero,20);assert.equal(b.cards.players.home.armor,0);}});
test('simultaneous deaths retain each actual side and disjoint ordered benefit segments',()=>{const {b,action}=scene('manual-1518',{double:true});actCardsMutable(b,action);const segments=personDeathSegments(b);assert.equal(segments.length,2);assert.notEqual(segments[0].side,segments[1].side);assert.equal(new Set(segments.flatMap(s=>s.indices)).size,segments.reduce((n,s)=>n+s.indices.length,0));assert.equal(b.cards.players.home.armor,3);assert.equal(b.cards.players.enemy.armor,3);});
test('death draw fatigue follows nested source cause and capped heal/hand burn still have a performance',()=>{
 const {b,action}=scene('cbdb-28093',{empty:true});actCardsMutable(b,action);const segments=personDeathSegments(b);assert.equal(segments.length,1);assert.ok(segments[0].indices.some(i=>b.cards.events[i].type==='fatigue'));assert.ok(segments[0].indices.some(i=>b.cards.events[i].type==='damage'));assert.equal(b.cards.players.home.hero,19);
 const burn=scene('cbdb-28093',{full:true});actCardsMutable(burn.b,burn.action);assert.ok(personDeathSegments(burn.b)[0].indices.some(i=>burn.b.cards.events[i].type==='burn'));
 const heal=scene('original-62');heal.b.cards.players.home.hero=30;actCardsMutable(heal.b,heal.action);assert.equal(personDeathSegments(heal.b).length,1);assert.equal(heal.b.cards.players.home.hero,30);
});
test('public snapshot replay handles unit healing and shields without assuming every target is a hero',()=>{
 const {b}=scene('manual-1518'),id=b.cards.players.home.board[0],x=b.cards.catalog[id],unitStats={attack:x.attack,hp:2,maxHp:x.maxHp,tags:['shield'],frozen:false,silenced:false,tempAttack:0,zone:'board'};applyDeathVisualEvent(b,{subject:{id},after:unitStats});assert.equal(x.hp,2);assert.deepEqual(x.tags,['shield']);
 applyDeathVisualEvent(b,{subject:{id:'home-hero'},after:{hp:23,armor:3}});assert.equal(b.cards.players.home.hero,23);assert.equal(b.cards.players.home.armor,3);
});
