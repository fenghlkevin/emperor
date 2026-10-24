import {writeFileSync} from 'node:fs';
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {newGame,validateSave} from '../src/game.mjs';
import {startCampaign,beginDefense,finishDefense} from '../src/foreign-strategy.mjs';
import {relationBetween} from '../src/diplomacy.mjs';
import {quoteKitDefense,validateKitDefense,kitDefenseSources} from '../src/kit-defense.mjs';
import {generals,advanceWar} from '../src/war.mjs';
import {attachCards,actCardsMutable,cardAI,legalCardActions,validateCards} from '../src/card-battle.mjs';
import {worldKitDepot} from '../src/troop-kit-world.mjs';
import {kitAvailability} from '../src/troop-kits.mjs';
import {weaponLossForSource} from '../src/card-battle-weapons.mjs';
import {previewDefenseDeck,battleDeckView} from '../src/card-battle-deck.mjs';
import {canonicalBattleFormation} from '../src/card-battle-plan-data.mjs';
function setup(sourceId='hebei'){
 const state=newGame('守城武器'),d=state.domestic;state.turn=37;relationBetween(d,'sheng','tubo').relation='defense';startCampaign(d,'xi','hebei',37);const g=generals(d),plan={kitVersion:1,battleMode:'cards',generalId:g[0].id,commander:{sourceId,kind:'cavalry',count:37,equipped:true},squads:[{sourceId:'hebei',kind:'infantry',count:73,equipped:true,generalId:g[1].id},{sourceId:'central',kind:'spears',count:137,equipped:true,generalId:g[2].id}],cardWeapons:{version:1,counts:{arsenal_blade:1,arsenal_spear:1}}};return {state,plan};
}
function assertSettlement(initial,s){const b=s.domestic.war.battle,before=structuredClone(s.domestic),r=finishDefense(s);for(const source of new Set(b.units.map(u=>u.sourceId))){const old=worldKitDepot(before,source),next=worldKitDepot(r.state.domestic,source),units=b.units.filter(u=>u.sourceId===source),extra=weaponLossForSource(b,source);assert.equal(old.soldiers-next.soldiers,units.reduce((n,u)=>n+u.dead,0));for(const kind of Object.keys(old.stock))assert.equal(old.stock[kind]-next.stock[kind],units.filter(u=>u.kind===kind&&u.equipped!==false).reduce((n,u)=>n+u.dead,0)+(extra[kind]??0));assert.equal(kitAvailability(next).soldiers.used,0);}
 for(const side of ['home','enemy'])for(const kind of Object.keys(r.receipt.defenseDetails.kitLoss[side]))assert.equal(r.receipt.defenseDetails.kitLoss[side][kind],b.units.filter(u=>u.side===side&&u.kind===kind&&u.equipped!==false).reduce((n,u)=>n+u.dead,0)+[...new Set(b.units.filter(u=>u.side===side).map(u=>u.sourceId))].reduce((n,id)=>n+(weaponLossForSource(b,id)[kind]??0),0));
 assert.throws(()=>finishDefense(r.state));validateSave(r.state);return r;}
for(const source of ['central','hebei','tubo-core'])test(`${source} commander weapons use only that actual depot and preview matches launch`,()=>{
 const {state,plan}=setup(source),before=structuredClone(state),q=quoteKitDefense(state,plan),preview=previewDefenseDeck(state,plan),n=beginDefense(state,{deployment:plan}),b=n.domestic.war.battle;assert.deepEqual(state,before);assert.deepEqual(preview.cards,b.cards);assert.equal(b.cards.rulesVersion,4);assert.equal(b.command.weaponAllocation.home.sourceId,source);assert.equal(battleDeckView(b).total,30);assert.equal(battleDeckView(b).types.weapon,2);
 for(const row of Object.values(b.cards.weaponSupplies))assert.ok(kitDefenseSources(state.domestic).some(f=>f.sourceId===row.sourceId)||row.sourceId===state.domestic.strategy.pending.attack.sourceId);
 for(const f of q.forces){const r=worldKitDepot(n.domestic,f.sourceId).reservations[b.command.kitBattleId];assert.equal(r.squads.reduce((n,u)=>n+u.count,0),f.soldiers);assert.equal(r.extraKits?.infantry??0,f.sourceId===source?1:0);assert.equal(r.extraKits?.spears??0,f.sourceId===source?1:0);}validateSave(n);
});
test('spare kits cannot be borrowed from central, double-used by troops, or allocated to hex mode',()=>{
 const {state,plan}=setup(),before=structuredClone(state),stock=worldKitDepot(state.domestic,'hebei').stock;stock.infantry=73;assert.throws(()=>quoteKitDefense(state,plan),/装备不足/);assert.throws(()=>beginDefense(state,{deployment:plan}),/装备不足/);assert.equal(state.domestic.war.battle,undefined);stock.infantry=before.domestic.troopKits.depots.hebei.stock.infantry;assert.throws(()=>beginDefense(state,{deployment:{...plan,battleMode:undefined}}),/仅用于卡牌/);
 const noWeapons=beginDefense(state,{deployment:{...plan,cardWeapons:{version:1,counts:{}}}});assert.equal(noWeapons.domestic.war.battle.cards.rulesVersion,3);validateSave(noWeapons);
});
test('militia commander can use a real spare kit without outfitting its soldiers or creating manpower',()=>{
 const {state,plan}=setup();plan.commander={sourceId:'hebei',kind:'infantry',count:37,equipped:false};plan.squads=[];for(const k of Object.keys(worldKitDepot(state.domestic,'hebei').stock))worldKitDepot(state.domestic,'hebei').stock[k]=0;worldKitDepot(state.domestic,'hebei').stock.infantry=1;plan.cardWeapons.counts={arsenal_blade:1};const n=beginDefense(state,{deployment:plan}),b=n.domestic.war.battle,r=worldKitDepot(n.domestic,'hebei').reservations[b.command.kitBattleId];assert.equal(r.extraKits.infantry,1);assert.equal(r.squads[0].equipped,false);assert.equal(r.squads[0].count,37);validateSave(n);
});
test('source, allocation, extra occupancy and deployment tampering are rejected by formal defense validation',()=>{
 const {state,plan}=setup(),n=beginDefense(state,{deployment:plan});for(const mutate of [b=>b.command.weaponAllocation.home.sourceId='central',b=>b.command.cardWeapons.counts.arsenal_spear=0,b=>b.command.weaponAllocation.enemy.selection.counts={arsenal_blade:2},b=>b.command.deployment.commander.sourceId='central']){const bad=structuredClone(n);mutate(bad.domestic.war.battle);assert.throws(()=>validateKitDefense(bad.domestic,bad.domestic.war.battle));}
 const bad=structuredClone(n),b=bad.domestic.war.battle;worldKitDepot(bad.domestic,'hebei').reservations[b.command.kitBattleId].extraKits.infantry++;assert.throws(()=>validateKitDefense(bad.domestic,b),/武器|占用/);
});
test('weapon draft canonicalization preserves selection without adding hidden combat state',()=>{const {plan}=setup('tubo-core'),f=canonicalBattleFormation('defense',{...plan,mana:10});assert.deepEqual(f.cardWeapons,plan.cardWeapons);assert.equal(f.commander.sourceId,'tubo-core');assert.equal(f.mana,undefined);});
test('replacement and retreat settle real allied spare kits exactly once and no extra soldiers',()=>{
 const {state,plan}=setup('tubo-core');let n=beginDefense(state,{deployment:plan}),b=n.domestic.war.battle;attachCards(b,{first:'home',seed:917711});n=advanceWar(n,{type:'mulligan',ids:[]});b=n.domestic.war.battle;const c=b.cards,p=c.players.home,weapons=Object.values(c.catalog).filter(x=>x.side==='home'&&x.type==='weapon');p.mana=p.maxMana=10;for(const x of weapons){for(const z of ['hand','deck'])p[z]=p[z].filter(id=>id!==x.id);p.hand.push(x.id);}for(const x of weapons)n=advanceWar(n,{type:'play',id:x.id});n=advanceWar(n,{type:'retreat'});b=n.domestic.war.battle;assert.equal(b.result,'defeat');assert.equal(weaponLossForSource(b,'tubo-core').infantry,1);assertSettlement(state,n);
});
test('twelve seeded formal defense games finish with per-source manpower and kit conservation',()=>{
 const cases=[];let plays=0,attacks=0;for(const source of ['central','hebei','tubo-core'])for(const seed of [104729,1299709])for(const first of ['home','enemy']){const {state,plan}=setup(source),n=beginDefense(state,{deployment:plan}),b=n.domestic.war.battle;attachCards(b,{first,seed,seeds:{home:seed^0x175,enemy:seed^0x9b71}});let steps=0;while(!b.result&&steps<1200){const a=cardAI(b);assert.ok(legalCardActions(b).some(x=>JSON.stringify(x)===JSON.stringify(a)));if(a.type==='hero-attack')attacks++;if(a.type==='play'&&b.cards.catalog[a.id]?.type==='weapon')plays++;actCardsMutable(b,a);validateCards(b);steps++;}assert.ok(b.result,source+' '+seed+' '+first);const r=assertSettlement(state,n);cases.push({source,seed,first,result:b.result,steps,kitLoss:r.receipt.defenseDetails.kitLoss});}assert.ok(plays>0);assert.ok(attacks>0);if(process.env.CARD_DEFENSE_WEAPON_EVIDENCE)writeFileSync(process.env.CARD_DEFENSE_WEAPON_EVIDENCE,JSON.stringify({date:new Date().toISOString(),purpose:'Functional source/identity/ledger checks only; asymmetric defense fixture, not balance evidence.',rulesVersion:4,weaponAllocationVersion:1,weaponAiVersion:1,plays,attacks,cases},null,2)+'\n');
});
