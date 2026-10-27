import {test} from 'node:test';
import assert from 'node:assert/strict';
import {ATTRIBUTE_RULES,attributeStats} from '../src/card-battle-attributes.mjs';
import {CARD_RULES,attachCards,cardAttributeBreakdown,validateCards,actCardsMutable,cardAI} from '../src/card-battle.mjs';
import {cardInspectMarkup} from '../src/card-battle-inspect.mjs';
import {battleDeckView} from '../src/card-battle-deck.mjs';
import {fixture} from '../scripts/card-battle-balance-fixture.mjs';
const d={attack:4,health:5,kind:'infantry'},a={martial:60,intelligence:60,leadership:60};
const stats=(n=100,t=60,o=a,c=a,kind='infantry')=>attributeStats(d,n,t,ATTRIBUTE_RULES,o,c,kind);
test('training, manpower and ability improve ordinary troops; integer rounding stays monotonic',()=>{
 assert.deepEqual([stats().attack,stats().hp],[4,5]);
 assert.ok(stats(100,90).rawAttack>stats(100,30).rawAttack);assert.ok(stats(100,90).hp>stats(100,30).hp);
 assert.ok(stats(100).hp>stats(25).hp);assert.ok(stats(25).hp>stats(10).hp);
 for(let n=1;n<100;n++){assert.ok(stats(n+1).attack>=stats(n).attack);assert.ok(stats(n+1).hp>=stats(n).hp);}
 for(let t=0;t<100;t++){assert.ok(stats(100,t+1).attack>=stats(100,t).attack);assert.ok(stats(100,t+1).hp>=stats(100,t).hp);}
 assert.ok(stats(100,60,{...a,martial:90}).rawAttack>stats().rawAttack);
 assert.ok(stats(100,60,{...a,intelligence:90},a,'archers').rawAttack>stats(100,60,{...a,intelligence:90}).rawAttack);
 assert.ok(stats(100,60,{...a,leadership:90}).hp>stats().hp);
 assert.ok(stats(100,60,a,{...a,leadership:90}).rawHealth>stats().rawHealth);
});
test('live engine and source explanations agree; save roundtrips and inspection are read-only',()=>{
 const b=fixture({training:90});validateCards(b);const before=JSON.stringify(b);
 for(const x of Object.values(b.cards.catalog).filter(x=>x.type==='troop'||x.type==='general')){
  const explanation=cardAttributeBreakdown(b,x);assert.ok(explanation.lines.some(s=>s.endsWith(`→ ${x.printedAttack}攻。`)));assert.ok(explanation.lines.some(s=>s.endsWith(`→ ${x.printedHp}命。`)));
  const html=cardInspectMarkup({name:x.name,type:x.type,cost:x.cost,art:'',rules:'',attributes:explanation});assert.match(html,/开战属性/);assert.match(html,/训练 90/);assert.match(html,/主将/);
 }
 assert.ok(battleDeckView(b).rows.some(x=>x.attributes));assert.equal(JSON.stringify(b),before);validateCards(JSON.parse(before));
 for(let i=0;i<20&&!b.result;i++)actCardsMutable(b,cardAI(b));validateCards(JSON.parse(JSON.stringify(b)));
});
test('previous v3-v6 rule snapshots keep their original stats and remain playable',()=>{
 const rule=CARD_RULES.attributeRules;let b;try{delete CARD_RULES.attributeRules;b=fixture();}finally{CARD_RULES.attributeRules=rule;}
 validateCards(b);assert.match(cardAttributeBreakdown(b,Object.values(b.cards.catalog).find(x=>x.type==='troop')).title,/旧版/);
 for(let i=0;!b.result&&i<2000;i++)actCardsMutable(b,cardAI(b));assert.ok(b.result);validateCards(JSON.parse(JSON.stringify(b)));
});
