import test from 'node:test';
import assert from 'node:assert/strict';
import {newGame} from '../src/game.mjs';
import {treasuryShortage,resourceShortage,quoteShortage} from '../src/action-feedback.mjs';
import {courtGarrisonPlan} from '../src/court-garrison.mjs';
import {executeKitCommand} from '../src/troop-kit-world.mjs';
import {executePersonnel} from '../src/personnel-actions.mjs';
import {executeJustice} from '../src/justice.mjs';
import {holdRitual} from '../src/disasters.mjs';
import {startConstruction} from '../src/construction.mjs';
import {executeIndustry} from '../src/industry.mjs';
import {executeRevenue,CENSUS_COST} from '../src/revenue.mjs';
import {executeSpy} from '../src/espionage.mjs';
import {postTreasury} from '../src/finance.mjs';
import {courtSpecialPlan} from '../src/court-special.mjs';
import {campaignSupply} from '../src/military-costs.mjs';

const fixture=(cash=0)=>{const s=newGame('六部提示');s.scene='court';s.domestic.countries.find(c=>c.id===s.domestic.playerCountryId).fiscal.treasury=cash;s.stats.treasury=cash;return s;};
function rejected(run){try{run();assert.fail('expected rejection');}catch(e){assert.notEqual(e.code,'ERR_ASSERTION');assert.doesNotMatch(e.message,/NaN|undefined|Infinity/);return e.message;}}
const money=(message)=>{assert.match(message,/国库.*不足/);assert.match(message,/需[\d,]+两/);assert.match(message,/现有[\d,]+两/);assert.match(message,/缺[\d,]+两/);};
test('shortage formatter gives exact cost, available and deficit with units',()=>{assert.equal(treasuryShortage(20000,10000,'募兵5,000人'),'国库不足：募兵5,000人需20,000两，现有10,000两，缺10,000两。');assert.equal(quoteShortage({cost:100,treasuryAfter:-75}),'国库不足：本次办理需100两，现有25两，缺75两。');assert.match(resourceShortage('编队','刀盾兵装备',300,200,'人份'),/需300人份，现有200人份，缺100人份/);});
test('military recruitment matches the reported 5000-person case and does not mutate state',()=>{const s=fixture(10000),before=JSON.stringify(s);assert.equal(rejected(()=>courtGarrisonPlan(s,{kind:'recruit',sourceId:'central',amount:5000,draftRates:{}})),treasuryShortage(20000,10000,'募兵5,000人'));assert.equal(JSON.stringify(s),before);});
for(const [name,run] of [
 ['兵部采购',s=>executeKitCommand(s,{id:s.domestic.troopKits.nextId,kind:'purchase',sourceId:'central',quantities:{infantry:1}})],
 ['兵部秘谍',s=>{Object.assign(s.domestic.justice.officials[0],{positionId:null,provinceId:null,office:'待命'});return executeSpy(s,{countryId:'japan',officialId:s.domestic.justice.officials[0].id});}],
 ['户部入籍',s=>executeRevenue(s,{id:s.domestic.fiscalActions.nextId,kind:'census'})],
 ['吏部封爵',s=>executePersonnel(s,{id:s.domestic.personnel.nextId,kind:'honor',officialId:s.domestic.justice.officials[0].id,honor:'nobility'})],
 ['吏部科举',s=>executePersonnel(s,{id:s.domestic.personnel.nextId,kind:'exam'})],
 ['刑部经费',s=>executeJustice(s,{id:s.domestic.justice.nextId,kind:'funding',amount:1000})],
 ['礼部祭祀',s=>holdRitual(s)],
 ['工部营建',s=>startConstruction(s,'hebei','temples')],
 ['工部特殊工程',s=>{s.stats.talent=1000;return courtSpecialPlan(s,{kind:'special',provinceId:'hebei',building:'shigu'});}],
 ['工部扩城',s=>executeIndustry(s,{id:s.domestic.industryActions.nextId,kind:'expand',provinceId:'hebei'})],
 ['共用财政入账',s=>postTreasury(s.domestic,s.domestic.playerCountryId,{turn:s.turn,expense:100,reason:'开科取士',key:'feedback-test'})],
])test(name+' reports actual treasury numbers',()=>{money(rejected(()=>run(fixture())));});
test('campaign identifies silver and grain shortages separately',()=>{let s=fixture();s.domestic.resourceRulesVersion=1;money(rejected(()=>campaignSupply(s.domestic,100)));s=fixture(100000);s.domestic.resourceRulesVersion=1;s.domestic.countries.find(c=>c.id===s.domestic.playerCountryId).fiscal.grain=0;assert.match(rejected(()=>campaignSupply(s.domestic,100)),/全国官粮不足.*需1石.*现有0石.*缺1石/);});
