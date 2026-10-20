import {national,famine} from './helpers/national.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import {newGame} from '../src/game.mjs';
import {settleDomestic} from '../src/domestic.mjs';
import {postTreasury} from '../src/finance.mjs';
import {turnEconomyReport} from '../src/turn-economy-report.mjs';
import {turnEconomyMarkup} from '../src/turn-economy-report-ui.mjs';

test('reading reports never mutates a new game or invents actual receipts',()=>{
 const s=newGame('旬报'),before=JSON.stringify(s),r=turnEconomyReport(s);
 assert.equal(r.current,null);assert.equal(r.previous,null);
 assert.equal(r.forecast.turn,s.turn+1);assert.equal(r.provinces.length,10);
 assert.match(turnEconomyMarkup(s),/尚无完整收付记录/);
 assert.equal(JSON.stringify(s),before);
});
test('actual cash includes one-off payments and separates unpaid obligations',()=>{
 const s=newGame('旬报'),d=s.domestic;
 postTreasury(d,d.playerCountryId,{turn:s.turn,income:10,expense:10030,allowDebt:true,key:'report-test',reason:'测试'});
 const r=turnEconomyReport(s);
 assert.equal(r.current.income,10);assert.equal(r.current.paid,10010);
 assert.equal(r.current.debtAdded,20);assert.equal(r.current.closing,0);
 assert.equal(r.current.opening+r.current.net,r.current.closing);
});
test('national reserves cover a province with no local production',()=>{
 const s=newGame('旬报'),p=s.domestic.provinces.find(p=>p.id==='hebei');
 p.population.professions.farmers=0;
 const r=turnEconomyReport(s),local=r.provinces.find(p=>p.id==='hebei');
 assert.equal(local.forecast.shortfall,0);assert.ok(r.forecast.grain.opening>0);
 assert.ok(r.forecast.grain.shortfall>=local.forecast.shortfall);
});
test('old supply snapshots keep their turn and cannot be modified through reports',()=>{
 const s=newGame('旬报');settleDomestic(s.domestic,2);s.turn=3;
 const before=JSON.stringify(s),r=turnEconomyReport(s);
 assert.equal(r.provinces[0].supply.turn,2);assert.equal(r.previous.turn,2);
 r.provinces[0].supply.produced=0;r.provinces[0].professions.farmers=0;
 assert.equal(JSON.stringify(s),before);
 assert.match(turnEconomyMarkup(s),/全国库存和流水统一记账/);
});
test('future production uses activation date and UI escapes province names',()=>{
 const s=newGame('旬报'),p=s.domestic.provinces[0];
 p.name='<img onerror=bad>';p.economy.agriculture.developedArea+=500;
 p.development.activation={industry:'agriculture',area:500,effectiveTurn:s.turn+2};
 const pending=turnEconomyReport(s).provinces[0].forecast.produced;
 p.development.activation.effectiveTurn=s.turn+1;
 assert.ok(turnEconomyReport(s).provinces[0].forecast.produced>pending);
 const html=turnEconomyMarkup(s,'forecast');assert.ok(!html.includes('<img onerror'));
 assert.match(html,/&lt;img onerror/);
});
