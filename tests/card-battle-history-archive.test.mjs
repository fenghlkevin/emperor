import {test} from 'node:test';import assert from 'node:assert/strict';
import {archiveCardHistory,readCardHistoryArchive,validateCardHistoryArchive,packCardRecord,unpackCardRecord} from '../src/card-battle-history-archive.mjs';
import {publicCardHistory,validatePublicCardHistory} from '../src/card-battle-history.mjs';
import {createCardBattlePreview} from '../scripts/card-battle-preview-state.mjs';
import {cardAI,actCardsMutable} from '../src/card-battle.mjs';
import {finishWar} from '../src/war.mjs';import {newGame,validateSave} from '../src/game.mjs';
import {startCampaign,beginDefense} from '../src/foreign-strategy.mjs';import {defaultKitDefensePlan} from '../src/kit-defense.mjs';import {persistCandidate} from '../src/persistence.mjs';
const play=b=>{let n=0;while(!b.result&&n++<2000)actCardsMutable(b,cardAI(b));assert.ok(b.result);return b;};
test('lossless archive codec shares duplicate values and rejects forward references, garbage and expansion bombs',()=>{
 const raw={z:['名字',null,false,0,-4,1.5],a:{name:'沈文远',hp:5},b:{name:'沈文远',hp:5}},packed=packCardRecord(raw);assert.deepEqual(unpackCardRecord(packed),raw);assert.ok(packed.nodes.filter(n=>n[0]===2&&n[1]==='沈文远').length===1);
 for(const change of [x=>x.nodes.push([2,'SECRET']),x=>x.nodes[x.root]=[0,x.root],x=>x.nodes[x.root]=[9],x=>x.nodes[0]=[2,{secret:'SECRET'}]]){const bad=structuredClone(packed);change(bad);assert.throws(()=>unpackCardRecord(bad));}
 const bomb={nodes:[[2,0]],root:25};for(let i=1;i<=25;i++)bomb.nodes.push([0,i-1,i-1]);assert.throws(()=>unpackCardRecord(bomb));
});
test('production campaign archive survives settlement and reload with exact public actions and fixed identity bindings',()=>{
 const s=createCardBattlePreview(),b=play(s.domestic.war.battle),history=publicCardHistory(b),before=structuredClone(s),result=finishWar(s),archive=result.receipt.cardHistory,record=readCardHistoryArchive(archive);assert.deepEqual(s,before);assert.deepEqual(record.history,history);assert.equal(record.orderId,result.receipt.id);assert.equal(record.result,b.result);assert.equal(result.state.domestic.war.battle,undefined);assert.deepEqual(result.state.domestic.war.history[0].cardHistory,archive);
 const refs=record.people;assert.ok(refs.some(p=>p.cardId==='home-hero'));for(const p of refs){const actual=b.cardPeople[p.personId];assert.ok(actual);assert.equal(p.templateId,actual.templateId);assert.equal(p.historicalDefinitionId,actual.historicalDefinitionId);}
 const restored=JSON.parse(JSON.stringify(result.state));validateSave(restored);assert.deepEqual(readCardHistoryArchive(restored.domestic.war.history[0].cardHistory),record);const copy=readCardHistoryArchive(archive);copy.history.entries[0].actor.name='changed';assert.deepEqual(readCardHistoryArchive(archive),record);assert.throws(()=>finishWar(restored));
 const dead=b.units.filter(u=>u.side==='home').reduce((n,u)=>n+u.dead,0);assert.equal(result.receipt.report.home.dead,dead);assert.equal(record.history.entries.at(-1).events.findLast(e=>e.type==='result').result,b.result);
});
test('production card defense archives the same actions and settles real source soldiers and equipment once',()=>{
 const s=newGame('守城归档');s.turn=37;startCampaign(s.domestic,'xi','hebei',37);const n=beginDefense(s,{deployment:{...defaultKitDefensePlan(s),battleMode:'cards'}}),b=play(n.domestic.war.battle),history=publicCardHistory(b),result=finishWar(n);assert.deepEqual(readCardHistoryArchive(result.receipt.cardHistory).history,history);assert.equal(result.state.domestic.strategy.pending,null);const population=d=>d.provinces.reduce((n,p)=>n+p.population.total,0);assert.equal(population(result.state.domestic),population(s.domestic)-b.units.reduce((n,u)=>n+u.dead,0));assert.ok(result.receipt.defenseDetails);validateSave(JSON.parse(JSON.stringify(result.state)));assert.throws(()=>finishWar(result.state));
});
test('failed archive save publishes neither settlement nor records; retry commits only one receipt and one resource settlement',()=>{
 const s=createCardBattlePreview(),b=s.domestic.war.battle;actCardsMutable(b,{type:'retreat'});const before=structuredClone(s),result=finishWar(s);assert.throws(()=>persistCandidate(s,result.state,{getItem:()=>null,setItem:()=>{throw Error('full');}}),/保存失败/);assert.deepEqual(s,before);assert.equal(s.domestic.war.history.filter(r=>r.cardHistory).length,0);
 const retry=finishWar(s),values=new Map(),saved=persistCandidate(s,retry.state,{getItem:k=>values.get(k)??null,setItem:(k,v)=>values.set(k,v)});assert.equal(saved.domestic.war.history.filter(r=>r.cardHistory).length,1);assert.equal(readCardHistoryArchive(saved.domestic.war.history[0].cardHistory).history.entries.length,1);assert.throws(()=>persistCandidate(s,retry.state,{setItem:()=>{}}),/状态已更新/);validateSave(saved);
});
test('archive validation catches altered cached bytes, hidden fields, noncanonical payloads and mismatched receipt IDs',()=>{
 const s=createCardBattlePreview(),b=s.domestic.war.battle;actCardsMutable(b,{type:'retreat'});const result=finishWar(s),a=result.receipt.cardHistory;validateCardHistoryArchive(a,result.receipt);validateCardHistoryArchive(JSON.parse(JSON.stringify(a)),result.receipt);
 for(const change of [x=>x.secret='SECRET',x=>x.version=99,x=>x.data.nodes+='!',x=>x.data.values.push('HIDDEN_UNUSED'),x=>x.data.root++,x=>x.data.secret='PRIVATE']){const bad=structuredClone(a);change(bad);assert.throws(()=>validateCardHistoryArchive(bad));}
 const nonfinite=structuredClone(a);validateCardHistoryArchive(nonfinite);const nullable=nonfinite.data.values.indexOf(null);assert.ok(nullable>=0);nonfinite.data.values[nullable]=NaN;assert.throws(()=>validateCardHistoryArchive(nonfinite));
 const same=structuredClone(a);validateCardHistoryArchive(same);same.data.values.push('SECRET');assert.throws(()=>readCardHistoryArchive(same));const bad=structuredClone(result.state);bad.domestic.war.history[0].id++;bad.domestic.war.nextId++;bad.domestic.war.career.lastId++;assert.throws(()=>validateSave(bad),/归档无效/);
 const h=readCardHistoryArchive(a).history;h.entries[0].deck=['SECRET'];assert.throws(()=>validatePublicCardHistory(h,b.cards.ply));
});
test('old ongoing and already-ended v3 games show honest gaps; legacy rules never fabricate card archives',()=>{
 const s=createCardBattlePreview(),b=s.domestic.war.battle;actCardsMutable(b,cardAI(b));delete b.cards.history;actCardsMutable(b,{type:'retreat'});const a=archiveCardHistory(b);assert.equal(readCardHistoryArchive(a).history.partial,true);assert.equal(readCardHistoryArchive(a).history.entries.length,1);
 delete b.cards.history;const before=JSON.stringify(b),old=archiveCardHistory(b);assert.equal(readCardHistoryArchive(old).history.partial,true);assert.equal(readCardHistoryArchive(old).history.entries.length,0);assert.equal(JSON.stringify(b),before);const legacy=structuredClone(b);legacy.cards.rulesVersion=2;assert.equal(archiveCardHistory(legacy),undefined);assert.equal(archiveCardHistory({result:'victory'}),undefined);const fresh=createCardBattlePreview().domestic.war.battle;assert.throws(()=>archiveCardHistory(fresh),/结束/);
});
