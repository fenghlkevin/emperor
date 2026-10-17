import test from 'node:test';
import assert from 'node:assert/strict';
import {newGame} from '../src/game.mjs';
import {childrenBook} from '../src/children-ui.mjs';
test('children register is read only even when adult royals are eligible',()=>{
 const s=newGame('御览');
 const before=JSON.stringify(s);
 const html=childrenBook(s);
 assert.ok(s.domestic.royalFamily.some(p=>p.age>=16&&p.status==='palace'));
 assert.doesNotMatch(html,/<(?:form|select|button|input)\b|data-child-marriage/);
 assert.match(html,/须与外臣商议/);
 assert.equal(JSON.stringify(s),before);
});
