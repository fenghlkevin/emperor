import {test} from 'node:test';
import assert from 'node:assert/strict';
import {CARD_RULES,validateCards} from '../src/card-battle.mjs';
import {fixture,ROSTERS} from '../scripts/card-battle-balance-fixture.mjs';
import {compactDiagnosticFixture,compareCompactPenalty} from '../scripts/card-battle-compact-diagnostic.mjs';
test('legacy compact penalty does not stack on the new attribute formula; identity, deck order and RNG stay fixed',()=>{
 const opts={roster:ROSTERS.mixed_600,training:20,hero:'command'},before=structuredClone(CARD_RULES),normal=fixture(opts),control=compactDiagnosticFixture(opts,true),ablation=compactDiagnosticFixture(opts,false);
 assert.deepEqual(control,normal);assert.deepEqual(CARD_RULES,before);let changed=0;
 for(const [id,x]of Object.entries(control.cards.catalog)){
  const y=ablation.cards.catalog[id],eligible=!control.cards.rulesSnapshot.attributeRules&&x.count<75&&(x.type==='general'||/_elite$/.test(x.definitionId));
  const difference=(y.hp??0)-(x.hp??0);assert.equal(difference,eligible?1:0);changed+=difference;
  const copy=structuredClone(y);for(const k of ['hp','maxHp','printedHp'])if(k in x)copy[k]=x[k];assert.deepEqual(copy,x);
 }
 assert.equal(changed,0);assert.deepEqual(ablation.cards.players,control.cards.players);validateCards(ablation);
 const copy=structuredClone(ablation);copy.cards.rulesSnapshot.compactPenalty=true;copy.cards.definitionHash=control.cards.definitionHash;copy.cards.catalog=control.cards.catalog;assert.deepEqual(copy,control);
 assert.deepEqual(fixture(opts),normal);
});
test('compact diagnostic validates completed paired games and restores production rules',()=>{
 const before=structuredClone(CARD_RULES),row=compareCompactPenalty({training:20,hero:'command',pairs:2,domain:'compact-diagnostic-test'});
 assert.equal(row.games,8);assert.equal(row.pairs,2);assert.ok(row.actions>0);assert.equal(row.pairedChange.mean,row.withoutCompactPenalty.mean-row.baseline.mean);assert.deepEqual(CARD_RULES,before);
 assert.throws(()=>compactDiagnosticFixture({roster:null},false));assert.deepEqual(CARD_RULES,before);
});
