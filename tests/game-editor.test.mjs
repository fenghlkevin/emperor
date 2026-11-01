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
test('皇帝属性支持同时调整上限、往返存档且不推进时间',()=>{
 const s=game(),snapshot=JSON.stringify(s);
 const values={'stats.age':35,'stats.energy':450,'stats.maxEnergy':450,'stats.health':88,'stats.happiness':90,'stats.charm':500,'stats.talent':499,'stats.wisdom':498,'stats.martial':497,'stats.life':4000,'stats.lifeLimit':5000};
 const result=applyEditorChanges(s,'emperor','emperor',values);
 const restored=validateSave(JSON.parse(JSON.stringify(result.next)));
 for(const [key,value] of Object.entries(values))assert.equal(restored.stats[key.split('.')[1]],value);
 assert.equal(restored.turn,s.turn);assert.equal(restored.phase,s.phase);
 assert.equal(JSON.stringify(s),snapshot);assert.equal(result.changes.length,11);
 assert.doesNotThrow(()=>validateSave(advance(restored)));
});
test('皇帝编辑拒绝超出上限及非法字段且不改变原进度',()=>{
 const s=game(),snapshot=JSON.stringify(s);
 for(const values of [{'stats.energy':501},{'stats.maxEnergy':0},{'stats.health':101},{'stats.wisdom':501},{'stats.age':2.5},{'stats.life':s.stats.lifeLimit+1},{'stats.maxEnergy':1},{'stats.lifeLimit':1},{'stats.treasury':1}]){
  assert.throws(()=>applyEditorChanges(s,'emperor','emperor',values));
  assert.equal(JSON.stringify(s),snapshot);
 }
 assert.throws(()=>applyEditorChanges(s,'emperor','missing',{'stats.health':80}),/不存在/);
});
