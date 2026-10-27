import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {CARD_CULTURES,cardRegionalArt,regionalPersonPortrait} from '../src/card-battle-cultures.mjs';
import {createFixedCardPerson,ensureCardPeople} from '../src/card-battle.mjs';
test('36 regional random portraits resolve independent role/variant assets and preserve ability templates',()=>{
 const assets=new Set();let count=0;
 for(const [culture,{index}]of Object.entries(CARD_CULTURES))if(index!==null)for(const role of ['文职','武将'])for(const seed of [100,101]){
  const person={id:'regional-person-'+count++,name:'角色',role,martial:role==='文职'?25:85,intelligence:75,leadership:65};
  const p=createFixedCardPerson(person,seed,culture),central=createFixedCardPerson(person,seed,'central');
  assert.equal(p.portraitId,regionalPersonPortrait(culture,role,seed));assert.deepEqual(p.definition,central.definition);assert.deepEqual(p.abilities,central.abilities);
  assert.equal(p.portraitId,createFixedCardPerson(person,seed,culture).portraitId);
  const art=cardRegionalArt(p.portraitId),png=readFileSync(art.src);assets.add(art.src);
  assert.deepEqual([png.readUInt32BE(16),png.readUInt32BE(20)],[1254,1254]);assert.equal(art.x,index%3*50);assert.equal(art.y,Math.floor(index/3)*50);
  assert.deepEqual(cardRegionalArt('regional-'+(role==='文职'?'civil':'military')+'-'+culture),cardRegionalArt('regional-'+(role==='文职'?'civil':'military')+'-'+culture+'-v2-0'));
 }
 assert.equal(count,36);assert.equal(assets.size,4);
 for(const id of ['regional-civil-central-v2-0','regional-civil-unknown-v2-0','regional-civil-persian-v2-2','manual-1554'])assert.equal(cardRegionalArt(id),null);
});
test('stored regional portrait never rerolls and regional metadata cannot replace historical identity',()=>{
 const world={playerCountryId:'persia',provinces:[],cardPeople:{version:1,rng:42,worldSeed:42,people:{},garrisons:{}}};
 const battle={units:[{id:'a',side:'home',sourceId:'central',general:{id:'fictional-persian',name:'某人',culture:'persian',role:'文职',martial:25,intelligence:75,leadership:65}},{id:'b',side:'home',sourceId:'central',general:{id:'manual-1554',name:'张飞',culture:'steppe',martial:95,intelligence:60,leadership:80}}]};
 ensureCardPeople(world,battle);const p=battle.cardPeople['fictional-persian'];assert.match(p.portraitId,/^regional-civil-persian-v2-[01]$/);assert.equal(battle.cardPeople['manual-1554'].portraitId,'manual-1554');
 const portrait=p.portraitId;world.cardPeople.worldSeed=123;ensureCardPeople(world,battle);assert.equal(battle.cardPeople['fictional-persian'].portraitId,portrait);
});
