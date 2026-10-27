import test from 'node:test';
import assert from 'node:assert/strict';
import {newGame} from '../src/game.mjs';
import {governanceSummary,governanceSummaryMarkup} from '../src/court-governance-ui.mjs';

test('treasury scenes follow real reserves and debt independently without mutating the game',()=>{
 const s=newGame('图卷'),c=s.domestic.countries.find(c=>c.id===s.domestic.playerCountryId);
 c.fiscal.treasury=10000000;c.fiscal.debt=0;assert.equal(governanceSummary(s).scene,'rich');
 c.fiscal.treasury=1;assert.equal(governanceSummary(s).scene,'low');
 c.fiscal.treasury=0;c.fiscal.debt=1;assert.equal(governanceSummary(s).scene,'light');
 c.fiscal.debt=10000000;assert.equal(governanceSummary(s).scene,'heavy');
 c.fiscal.treasury=10000000;const mixed=governanceSummary(s);assert.equal(mixed.scene,'rich');assert.equal(mixed.debtState,'heavy');
 const before=JSON.stringify(s),html=governanceSummaryMarkup(s);assert.match(html,/10,000,000/);assert.equal(JSON.stringify(s),before);
 assert.doesNotMatch(html,/<button|<input|<form|style=/);
 c.fiscal.treasury=0;c.fiscal.debt=0;assert.equal(governanceSummary(s).scene,'low');assert.match(governanceSummaryMarkup(s),/暂无余银/);
});
test('settlement uses original non-legacy ledger and never presents forecast as actual',()=>{
 const s=newGame('账录'),c=s.domestic.countries.find(c=>c.id===s.domestic.playerCountryId);
 c.ledger=[];assert.match(governanceSummaryMarkup(s),/本旬尚无结算记录/);
 c.ledger=[{turn:s.turn,legacy:true,income:999,expenditure:888,closingTreasury:111}];assert.equal(governanceSummary(s).actual,null);
 c.ledger=[{turn:s.turn,income:12618,expenditure:21143,closingTreasury:1475}];
 const html=governanceSummaryMarkup(s);assert.match(html,/12,618/);assert.match(html,/21,143/);assert.match(html,/1,475/);
 assert.equal(governanceSummary(s).actual.closingTreasury,1475);
});
test('delegation count is scoped to player territory and construction reflects actual projects',()=>{
 const s=newGame('营造'),q=governanceSummary(s),c=s.domestic.countries.find(c=>c.id===s.domestic.playerCountryId),p=s.domestic.provinces.find(p=>c.provinceIds.includes(p.id));
 s.domestic.personnel.delegations=[p.id,'foreign-province'];assert.equal(governanceSummary(s).delegations,1);
 assert.equal(q.projects,0);assert.match(governanceSummaryMarkup(s),/data-works-state="idle"/);
 p.construction.project={building:'farm',progress:1};assert.equal(governanceSummary(s).projects,1);assert.match(governanceSummaryMarkup(s),/data-works-state="active"/);
 p.construction.project=null;s.domestic.specialWorks.project={building:'test'};assert.match(governanceSummaryMarkup(s),/data-works-state="active"/);
});
