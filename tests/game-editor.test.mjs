import test from 'node:test';
import assert from 'node:assert/strict';
import {createPlayableGame,validateSave,advance} from '../src/game.mjs';
import {applyEditorChanges} from '../src/game-editor.mjs';
import {persistCandidate} from '../src/persistence.mjs';
const game=()=>createPlayableGame('编辑验收','汉');
test('钱粮增减记账、镜像同步并可继续推进',()=>{
 let s=game();const before=structuredClone(s);
 s=applyEditorChanges(s,'countries','sheng',{'fiscal.treasury':100000,'fiscal.grain':900000,prestige:180}).next;
 assert.equal(before.stats.prestige,50);assert.equal(s.stats.treasury,100000);assert.equal(s.stats.prestige,180);
 s.saveRevision++;s=applyEditorChanges(s,'countries','sheng',{'fiscal.treasury':123,'fiscal.grain':456}).next;
 assert.equal(s.domestic.countries.find(c=>c.id==='sheng').fiscal.grain,456);
 assert.doesNotThrow(()=>validateSave(advance(s)));
});
test('人物能力与地方修改可往返存档，原对象不变',()=>{
 const s=game(),id=s.domestic.justice.officials[0].id;
 const next=applyEditorChanges(s,'people',id,{intelligence:99,leadership:98,politics:97,loyalty:100}).next;
 const p=next.domestic.justice.officials.find(p=>p.id===id);assert.equal(p.intelligence,99);
 const restored=validateSave(JSON.parse(JSON.stringify(next)));assert.equal(restored.domestic.justice.officials.find(p=>p.id===id).politics,97);
 const local=applyEditorChanges(restored,'provinces',s.domestic.provinces[0].id,{'buildings.walls':88,'welfare.security':100}).next;
 assert.equal(local.domestic.provinces[0].buildings.walls,88);assert.notEqual(s.domestic.provinces[0].buildings.walls,88);
});
test('拒绝非法字段、范围和战斗中编辑',()=>{
 const s=game();for(const values of [{prestige:501},{prestige:NaN},{prestige:2.5},{'fiscal.debt':0}])assert.throws(()=>applyEditorChanges(s,'countries','sheng',values));
 s.domestic.war.battle={};assert.throws(()=>applyEditorChanges(s,'countries','sheng',{prestige:80}),/战斗/);
});
test('保存失败不改变当前进度',()=>{
 const s=game(),snapshot=JSON.stringify(s),next=applyEditorChanges(s,'countries','sheng',{prestige:200}).next;
 assert.throws(()=>persistCandidate(s,next,{getItem:()=>null,setItem:()=>{throw Error('quota');}}),/保存失败/);assert.equal(JSON.stringify(s),snapshot);
});
