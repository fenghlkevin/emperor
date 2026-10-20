import {test} from 'node:test';
import assert from 'node:assert/strict';
import {existsSync,readFileSync} from 'node:fs';
import {BATTLE_GENERALS,battleGeneral,generalSprites} from '../src/battle-general-art.mjs';
import {spriteKind,piece,attackDuration,playSprite} from '../src/battle-sprites.mjs';
import {HISTORICAL_PEOPLE} from '../src/historical-people.mjs';

test('dedicated generals resolve real and recruited identities on either side',()=>{
 assert.equal(new Set(BATTLE_GENERALS.map(g=>g.id)).size,BATTLE_GENERALS.length);
 for(const g of BATTLE_GENERALS){
  const person=HISTORICAL_PEOPLE.find(p=>p.id===g.id);
  assert.equal(person.name,g.name);
  for(const side of ['home','enemy'])for(const kind of ['spears','heavy-cavalry','archers']){
   const unit={id:'u0',side,kind,general:{...person,id:'recruit-'+person.id}};
   assert.equal(spriteKind(unit),g.key);
   assert.match(piece(unit),new RegExp(g.asset));
   assert.match(piece(unit),/data-idle-kind="mounted"/);
   assert.equal(unit.kind,kind);
   assert.equal(attackDuration(unit),generalSprites[g.key].attackMs);
  }
  assert.equal(battleGeneral({name:g.name}),g);
 }
 assert.equal(spriteKind({kind:'cavalry',general:{id:'ordinary',name:'普通将领'}}),'cavalry');
});
test('all dedicated atlas assets have measured frames and silhouette clips',()=>{
 for(const g of BATTLE_GENERALS){
  assert.ok(existsSync(g.asset),g.asset);
  const png=readFileSync(g.asset),s=generalSprites[g.key];
  assert.equal(s.mounted,true,g.name+' must ride a horse');
  assert.equal(png.readUInt32BE(16),s.width,g.name);
  assert.equal(png.readUInt32BE(20),s.height,g.name);
  for(const frames of [s.walk,s.attack]){
   assert.equal(frames.length,4);
   for(const frame of frames)assert.ok(s.clipPaths?.[frame.join(',')]?.startsWith('M'),g.name+' missing silhouette');
  }
 }
});
test('general attack updates silhouette and resets to standing after stop',()=>{
 const savedRAF=globalThis.requestAnimationFrame,savedCancel=globalThis.cancelAnimationFrame;
 let tick;globalThis.requestAnimationFrame=f=>{tick=f;return 1;};globalThis.cancelAnimationFrame=()=>{};
 try{
  const g=BATTLE_GENERALS[0],s=generalSprites[g.key],attrs={},clipAttrs={};
  const el={dataset:{spriteKind:g.key},closest(){return null;},setAttribute(k,v){attrs[k]=v;},querySelector(q){return {setAttribute(k,v){clipAttrs[q+k]=v;}};}};
  const stop=playSprite(el,'attack');tick(performance.now()+1200);
  assert.equal(attrs.viewBox,s.attack[3].join(' '));
  assert.equal(clipAttrs['[data-sprite-silhouette]d'],s.clipPaths[s.attack[3].join(',')]);
  stop();assert.equal(attrs.viewBox,s.walk[0].join(' '));assert.equal(el.dataset.animation,undefined);
 }finally{globalThis.requestAnimationFrame=savedRAF;globalThis.cancelAnimationFrame=savedCancel;}
});

test('named leader escorts show the actual troop on both sides with independent clips',()=>{
 const g=BATTLE_GENERALS[0];
 for(const side of ['home','enemy'])for(const kind of ['spears','infantry','archers','crossbows','cavalry','heavy-cavalry']){
  const html=piece({id:'formation',kind,side,general:{id:g.id,name:g.name}});
  assert.equal((html.match(/class="unit-escort"/g)||[]).length,1);
  assert.equal((html.match(new RegExp(`data-sprite-kind="${['spears','infantry','cavalry'].includes(kind)?'escort-'+kind:kind}"`,'g'))||[]).length,1);
  const ids=[...html.matchAll(/<clipPath id="([^"]+)"/g)].map(m=>m[1]);
  assert.equal(new Set(ids).size,2);
  assert.match(html,new RegExp(`data-sprite-kind="${g.key}"`));
 }
 assert.doesNotMatch(piece({id:'ordinary',kind:'spears',side:'home'}),/unit-escort/);
});
