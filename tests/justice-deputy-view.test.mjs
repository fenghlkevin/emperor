import test from 'node:test';
import assert from 'node:assert/strict';
import {newGame} from '../src/game.mjs';
import {justiceDeputyMarkup} from '../src/justice-deputy-ui.mjs';
test('justice register shows illustrated empty states without inventing cases or changing state',()=>{
 const s=newGame('刑狱图鉴'),before=JSON.stringify(s),html=justiceDeputyMarkup(s);
 assert.match(html,/sketch-justice-hearing-v1.png/);assert.match(html,/sketch-justice-prison-v1.png/);assert.match(html,/governance-art--registers/);
 assert.match(html,/暂无待决案件/);assert.match(html,/天牢暂无在押官员/);assert.doesNotMatch(html,/data-case-propose|data-case-seal|<form|<table/);
 assert.equal(JSON.stringify(s),before);
});
test('case cards separate pending, imprisoned and concluded records and escape saved text',()=>{
 const s=newGame('案卷');const [a,b,c,d]=s.domestic.justice.officials;
 Object.assign(a,{discovered:true,discoveredTurn:1,caseDismissed:false,name:'<img onerror=evil>'});
 Object.assign(b,{status:'imprisoned',prison:{admittedTurn:2,servedTurns:3}});
 Object.assign(c,{status:'released'});Object.assign(d,{discovered:true,discoveredTurn:1,caseDismissed:true});
 const html=justiceDeputyMarkup(s,{view:'prison'});
 assert.match(html,/已服刑 3 旬/);assert.match(html,/&lt;img onerror=evil&gt;/);assert.doesNotMatch(html,/<img onerror=evil>/);
 assert.match(html,new RegExp(`data-jd-person="${a.id}"`));assert.match(html,new RegExp(`data-jd-person="${b.id}"`));assert.match(html,new RegExp(`data-jd-person="${c.id}"`));assert.doesNotMatch(html,new RegExp(`data-jd-person="${d.id}"`));
 assert.match(html,/data-jd-tab="prison" aria-current="page"/);
});
