import test from 'node:test';
import assert from 'node:assert/strict';
import {newGame,advance,leaveRoom} from '../src/game.mjs';
import {executePersonnel} from '../src/personnel-actions.mjs';
import {examReady,finishExam,cancelExam} from '../src/exam-session.mjs';

test('诏令下一旬退朝后举行，录用一人消耗体力并推进阶段',()=>{
 let s=newGame('制举验收');s.scene='court';
 s=executePersonnel(s,{kind:'exam',id:s.domestic.personnel.nextId}).state;
 assert.equal(examReady(s),false);
 leaveRoom(s);assert.equal(examReady(s),false);
 advance(s);s.scene='court';assert.ok(s.domestic.personnel.candidates.length>=5);
 assert.equal(examReady(s),false);
 leaveRoom(s);assert.equal(examReady(s),true);
 const energy=s.stats.energy,count=s.domestic.justice.officials.length,id=s.domestic.personnel.candidates[0].id;
 const next=finishExam(s,id);
 assert.equal(next.phase,2);assert.equal(next.stats.energy,energy-1);
 assert.equal(next.domestic.justice.officials.length,count+1);
 assert.equal(next.domestic.personnel.candidates.length,0);
 assert.equal(s.domestic.personnel.candidates.length>=5,true);
 assert.equal(examReady(next),false);
});
test('体力不足与夜晚保留候选，不能录用或推进阶段',()=>{
 let s=newGame('制举验收');s=executePersonnel(s,{kind:'exam',id:s.domestic.personnel.nextId}).state;
 advance(s);leaveRoom(s);const id=s.domestic.personnel.candidates[0].id;
 s.stats.energy=0;assert.equal(examReady(s),false);assert.throws(()=>finishExam(s,id));
 s.stats.energy=1;s.phase=5;assert.equal(examReady(s),false);
 s.phase=1;assert.equal(finishExam(s,id).phase,2);
});

test('完成后后续回合不再提示，再次颁诏才开启新一届',()=>{
 let s=newGame('制举验收');
 s=executePersonnel(s,{kind:'exam',id:s.domestic.personnel.nextId}).state;
 advance(s);leaveRoom(s);s=finishExam(s,s.domestic.personnel.candidates[0].id);
 for(let i=0;i<2;i++){advance(s);leaveRoom(s);assert.equal(examReady(s),false);assert.equal(s.domestic.personnel.examTurn,null);}
 advance(s);s.scene='court';
 s=executePersonnel(s,{kind:'exam',id:s.domestic.personnel.nextId}).state;
 leaveRoom(s);assert.equal(examReady(s),false);
 advance(s);leaveRoom(s);assert.equal(examReady(s),true);
});

test('放弃本届制举后关闭且不再自动弹出',()=>{
 let s=newGame('取消制举');s=executePersonnel(s,{kind:'exam',id:s.domestic.personnel.nextId}).state;
 advance(s);leaveRoom(s);const energy=s.stats.energy,count=s.domestic.justice.officials.length;
 s=cancelExam(s);assert.equal(s.phase,2);assert.equal(s.stats.energy,energy-1);
 assert.equal(s.domestic.justice.officials.length,count);assert.equal(examReady(s),false);
 advance(s);leaveRoom(s);assert.equal(examReady(s),false);
});

test('多人统一录用只消耗一次体力并推进一次阶段，原存档不变',()=>{
 let s=newGame('多人制举');s=executePersonnel(s,{kind:'exam',id:s.domestic.personnel.nextId}).state;
 advance(s);leaveRoom(s);
 const ids=s.domestic.personnel.candidates.slice(0,3).map(o=>o.id),before=structuredClone(s);
 const next=finishExam(s,ids);
 assert.equal(next.domestic.justice.officials.length,s.domestic.justice.officials.length+3);
 for(const id of ids)assert.ok(next.domestic.justice.officials.some(o=>o.id===`recruit-${id}`));
 assert.equal(next.stats.energy,s.stats.energy-1);assert.equal(next.phase,s.phase+1);
 assert.equal(next.domestic.personnel.candidates.length,0);assert.deepEqual(s,before);
 for(const invalid of [[],[ids[0],ids[0]],[ids[0],'missing']])assert.throws(()=>finishExam(s,invalid));
 assert.deepEqual(s,before);
});
