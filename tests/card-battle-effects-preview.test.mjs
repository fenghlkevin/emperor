import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createCardBattleEffectsPreview} from '../scripts/card-battle-effects-preview-state.mjs';
import {battleCardStatuses} from '../src/card-battle-status-view.mjs';
import {legalCardActions,actCardsMutable} from '../src/card-battle.mjs';
import {validateSave} from '../src/game.mjs';
test('effects practice opens with real buff/freeze/silence combinations, five playable spells and ten mana',()=>{
 const s=createCardBattleEffectsPreview(),b=s.domestic.war.battle,c=b.cards,h=c.players.home,e=c.players.enemy;
 assert.equal(c.turn,'home');assert.equal(c.phase,'play');assert.equal(h.mana,10);assert.equal(h.board.length,3);assert.equal(e.board.length,3);
 const statuses=id=>battleCardStatuses(b,c.catalog[id]).map(s=>s.key);
 for(const k of ['attack','health','temporary-attack','freeze'])assert.ok(statuses(h.board[0]).includes(k));
 for(const k of ['silence','freeze'])assert.ok(statuses(e.board[0]).includes(k));
 assert.deepEqual(h.hand.map(id=>c.catalog[id].definitionId),['fortify','assault','brace','pin','dispel']);
 for(const id of h.hand)assert.ok(legalCardActions(b).some(a=>a.type==='play'&&a.id===id));
 assert.ok(c.history.entries.filter(r=>r.type==='play').length>=6);validateSave(JSON.parse(JSON.stringify(s)));
 const spell=h.hand.find(id=>c.catalog[id].definitionId==='fortify');actCardsMutable(b,{type:'play',id:spell,target:h.board[2]});assert.ok(statuses(h.board[2]).includes('attack'));assert.equal(h.mana,8);validateSave(s);
});
