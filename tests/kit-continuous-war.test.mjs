import test from 'node:test';
import assert from 'node:assert/strict';
import {newGame,validateSave,advance} from '../src/game.mjs';
import {beginWar,advanceWar,finishWar,generals,borderingCountries} from '../src/war.mjs';
import {aiAction,active} from '../src/battle.mjs';
import {occupyProvince} from '../src/occupation.mjs';
import {executeKitCommand,worldKitDepot} from '../src/troop-kit-world.mjs';
import {kitAvailability} from '../src/troop-kits.mjs';
const population=d=>d.provinces.reduce((n,p)=>n+p.population.total,0);
const snapshot=d=>Object.fromEntries(Object.keys(d.troopKits.depots).map(id=>[id,worldKitDepot(d,id)]));
test('one new realm survives consecutive mixed wars, manual waiting, retreat, reload and exact source settlement',()=>{
 let s=newGame('连续战争');
 for(const [kind,origin]of [['camel','arabia'],['elephant','india'],['horse-archers','east-turk']]){occupyProvince(s.domestic,origin,s.turn,'sheng',origin+'-core');const p=s.domestic.provinces.find(p=>p.id===origin+'-core');p.status.situation='stable';p.occupation.settled=true;s=executeKitCommand(s,{id:s.domestic.troopKits.nextId,kind:'transfer',sourceId:p.id,targetId:'central',amount:0,quantities:{[kind]:31}}).state;}
 const plans=[['spears','archers'],['heavy-cavalry','crossbows'],['camel','elephant','horse-archers']];
 for(const [wave,kinds]of plans.entries()){
 const g=generals(s.domestic),before=snapshot(s.domestic),pop=population(s.domestic),career=s.domestic.war.career.total;
 s=beginWar(s,{id:s.domestic.war.nextId,kind:'war',kitVersion:1,targetId:borderingCountries(s.domestic)[0].id,generalId:g[0].id,commanderSquad:{kind:'infantry',count:10},squads:kinds.map((kind,i)=>({kind,count:kind==='heavy-cavalry'?20:30,generalId:g[i+1].id}))});let waited=false,steps=0;
 while(!s.domestic.war.battle.result&&steps<3000){const b=s.domestic.war.battle,u=active(b);let action=aiAction(b);if(u.side==='home'&&wave===0&&!waited){action={type:'wait'};waited=true;}else if(u.side==='home'&&wave===1){action={type:'retreat'};}s=advanceWar(s,action);steps++;if(steps%17===0)s=validateSave(JSON.parse(JSON.stringify(s)));}
 assert.ok(s.domestic.war.battle.result);assert.ok(steps<3000);if(wave===0)assert.ok(waited);const b=s.domestic.war.battle,dead=b.units.reduce((n,u)=>n+u.dead,0),losses=structuredClone(b.units);s=finishWar(s).state;assert.equal(population(s.domestic),pop-dead);assert.equal(s.domestic.war.career.total,career+1);
 for(const [id,old]of Object.entries(before)){const rows=losses.filter(u=>u.sourceId===id),now=worldKitDepot(s.domestic,id);assert.equal(now.soldiers,old.soldiers-rows.reduce((n,u)=>n+u.dead,0),id);for(const kind of Object.keys(old.stock))assert.equal(now.stock[kind],old.stock[kind]-rows.filter(u=>u.kind===kind&&u.equipped!==false).reduce((n,u)=>n+u.dead,0),id+kind);assert.equal(kitAvailability(now).soldiers.used,0);}
 assert.throws(()=>finishWar(s));s=validateSave(JSON.parse(JSON.stringify(s)));
 }
 assert.equal(s.domestic.war.career.total,3);
});
test('real turn settlement preserves valid kit ledgers through foreign income, growth and warfare',()=>{
 let s=newGame('长期军需');for(let i=0;i<72;i++){s=advance(s);s=validateSave(JSON.parse(JSON.stringify(s)));if(s.domestic.collapse.pending||s.domestic.collapse.ended||s.stats.life===0)break;}
 assert.equal(s.turn,73);for(const id of Object.keys(s.domestic.troopKits.depots)){const depot=worldKitDepot(s.domestic,id);assert.ok(depot.soldiers>=0);assert.equal(kitAvailability(depot).soldiers.used,0);}
 assert.ok(s.domestic.troopKits.nextId>1);
});
test('actual border withdrawal and tactical reconquest preserve captured depot identity and population',async()=>{
 const {startCampaign}=await import('../src/foreign-strategy.mjs'),{withdrawKitDefense}=await import('../src/kit-defense.mjs'),{automaticKitFormation}=await import('../src/kit-formation.mjs'),{worldKitSummary}=await import('../src/troop-kit-world.mjs');let s=newGame('失地收复');
 startCampaign(s.domestic,'xi','hebei',s.turn);s=withdrawKitDefense(s,{central:0}).state;assert.equal(s.domestic.provinces.find(p=>p.id==='hebei').countryId,'xi');
 const depot=worldKitDepot(s.domestic,'jiannan');s=executeKitCommand(s,{id:s.domestic.troopKits.nextId,kind:'transfer',sourceId:'jiannan',targetId:'central',soldiers:depot.soldiers,quantities:depot.stock}).state;
 const before=snapshot(s.domestic),pop=population(s.domestic),leaders=generals(s.domestic),central=worldKitDepot(s.domestic,'central'),plan={generalId:leaders[0].id,commanderSquad:{kind:'infantry',count:1000},squads:['spears','cavalry'].map((kind,i)=>({kind,count:central.stock[kind],generalId:leaders[i+1].id}))};s=beginWar(s,{id:s.domestic.war.nextId,kind:'war',kitVersion:1,targetId:'xi',...plan});assert.equal(s.domestic.war.battle.command.provinceId,'hebei');
 for(let i=0;!s.domestic.war.battle.result&&i<3000;i++)s=advanceWar(s,aiAction(s.domestic.war.battle));assert.equal(s.domestic.war.battle.result,'victory',JSON.stringify({log:s.domestic.war.battle.log,units:s.domestic.war.battle.units.map(u=>({kind:u.kind,count:u.count,commander:u.commander,side:u.side}))}));const units=s.domestic.war.battle.units;s=finishWar(s).state;assert.equal(s.domestic.provinces.find(p=>p.id==='hebei').countryId,'sheng');assert.equal(population(s.domestic),pop-units.reduce((n,u)=>n+u.dead,0));
 for(const id of ['central','hebei']){const now=worldKitDepot(s.domestic,id),rows=units.filter(u=>u.sourceId===id);assert.equal(now.soldiers,before[id].soldiers-rows.reduce((n,u)=>n+u.dead,0));for(const kind of Object.keys(now.stock))assert.equal(now.stock[kind],before[id].stock[kind]-rows.filter(u=>u.kind===kind&&u.equipped!==false).reduce((n,u)=>n+u.dead,0));}validateSave(s);
});
test('a failed battle action save publishes neither damage nor activation and a successful retry settles only once',async()=>{
 const {persistCandidate}=await import('../src/persistence.mjs');const s=newGame('战斗保存'),g=generals(s.domestic),current=beginWar(s,{id:1,kind:'war',kitVersion:1,targetId:borderingCountries(s.domestic)[0].id,generalId:g[0].id,commanderSquad:{kind:'infantry',count:30},squads:[{kind:'archers',count:100,generalId:g[1].id}]});const before=structuredClone(current),candidate=advanceWar(current,aiAction(current.domestic.war.battle)),storage={setItem(){throw Error('quota');}};
 assert.throws(()=>persistCandidate(current,candidate,storage),/保存失败/);assert.deepEqual(current,before);let saved;storage.setItem=(k,v)=>{saved=JSON.parse(v);};const next=persistCandidate(current,candidate,storage);assert.equal(next.saveRevision,current.saveRevision+1);assert.deepEqual(saved.domestic.war.battle,next.domestic.war.battle);assert.throws(()=>persistCandidate(current,candidate,storage),/已更新/);validateSave(next);
});
