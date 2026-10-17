import test from 'node:test';
import assert from 'node:assert/strict';
import {newGame,validateSave,advance} from '../src/game.mjs';

import {settleBuildingEffects,welfareValue,changeWelfare,commerceMultiplier,protectedGrainLoss,newRecruitTraining,buildingMarginal} from '../src/building-effects.mjs';
import {settleDomestic,outputFor,provinceBudget,countrySummary} from '../src/domestic.mjs';
import {settleConstruction,startConstruction} from '../src/construction.mjs';
import {executeKitCommand} from '../src/troop-kit-world.mjs';
import {settlePersonnel} from '../src/personnel-actions.mjs';
import {disasterRisk,settleDisasters} from '../src/disasters.mjs';
import {buildingEffectsReport} from '../src/building-effects-ui.mjs';
import {persistCandidate} from '../src/persistence.mjs';
const city=s=>s.domestic.provinces[0];
const save=s=>validateSave(JSON.parse(JSON.stringify(s)));
function fixture(){const s=newGame('民生帝'),p=city(s);for(const k in p.buildings)p.buildings[k]=0;for(const k of ['stability','security','activity','fitness','loyalty'])p.welfare[k]=50;p.buildingEffects.baselineActivity=50;p.buildingEffects.baselineWalls=0;p.buildingEffects.baselineDefense=30;p.welfare.defense=30;return s;}

test('B01 fractional recovery survives reload and shortages pause temple recovery',()=>{
 let s=fixture(),p=city(s);p.buildings.temples=1;
 for(let t=2;t<=5;t++){settleBuildingEffects(p,t,true,false);s.turn=t;s=save(s);p=city(s);}
 assert.equal(welfareValue(p,'stability'),51);assert.equal(p.welfare.stability,51);assert.equal(p.buildingEffects.carry.stability,0);
 settleBuildingEffects(p,6,false,false);assert.equal(welfareValue(p,'stability'),51);assert.equal(p.buildingEffects.last.gains.stability,0);
 const snapshot=JSON.stringify(p);settleBuildingEffects(p,6,true,false);assert.equal(JSON.stringify(p),snapshot);
});

test('B02 caps recovery, clamps metrics, and clears fractions at zero or one hundred',()=>{
 for(const n of [8,100]){const p=city(fixture());p.buildings.temples=n;settleBuildingEffects(p,2,true,false);assert.equal(welfareValue(p,'stability'),52);assert.equal(buildingMarginal(p,'temples',2),0);}
 const p=city(fixture());p.welfare.security=99;p.buildingEffects.carry.security=90;p.buildings.yamen=8;settleBuildingEffects(p,2,true,false);assert.equal(p.welfare.security,100);assert.equal(p.buildingEffects.carry.security,0);
 changeWelfare(p,'security',-1000);assert.equal(welfareValue(p,'security'),0);changeWelfare(p,'security',.25);changeWelfare(p,'security',-4);assert.equal(welfareValue(p,'security'),0);assert.equal(p.buildingEffects.carry.security,0);
});

test('B03 market applies once to commerce and tax, preserves other industries, and affects the next production period',()=>{
 const s=fixture(),p=city(s);p.buildings.markets=8;
 const original=Object.fromEntries(['agriculture','pastoral','commerce','industry'].map(k=>[k,outputFor(p,k)]));const baseTax=provinceBudget(p,s.domestic.countries[0]).tax;
 for(let t=2;t<=6;t++)settleBuildingEffects(p,t,true,false);
 assert.equal(welfareValue(p,'activity'),60);assert.equal(commerceMultiplier(p),1+10/600);
 assert.equal(outputFor(p,'commerce'),Math.round(original.commerce*(1+10/600)));
 for(const k of ['agriculture','pastoral','industry'])assert.equal(outputFor(p,k),original[k]);
 const taxable=original.agriculture*.7+original.pastoral*4+outputFor(p,'commerce')+original.industry*.8;assert.equal(provinceBudget(p,s.domestic.countries[0]).tax,Math.round(taxable*p.budget.taxRate));assert.ok(provinceBudget(p,s.domestic.countries[0]).tax>baseTax);
 assert.equal(commerceMultiplier(p,6),1+8/600);assert.equal(commerceMultiplier(p,7),1+10/600);
});

test('B04 central and delegated recruitment share fitness-based training and do not retrain old troops',()=>{
 let s=fixture();const d=s.domestic,source=d.provinces.find(p=>p.id===d.centralArmy.sourceProvinceId);
 for(const p of d.provinces.filter(p=>p.countryId==='sheng'))p.population.total=Object.values(p.population.professions).reduce((a,b)=>a+b,0);
 source.population.total+=100;source.welfare.fitness=80;source.buildingEffects.carry.fitness=0;d.centralArmy.soldiers=100;d.centralArmy.training=60;
 assert.equal(newRecruitTraining(source),16);s=executeKitCommand(s,{id:s.domestic.troopKits.nextId,kind:'recruit',sourceId:'central',amount:100}).state;assert.equal(s.domestic.centralArmy.training,38);
 const q=fixture(),p=city(q);p.welfare.fitness=80;for(const k of ['stability','security','loyalty'])p.welfare[k]=70;p.population.professions.soldiers=100;p.military.training=80;q.domestic.personnel.delegations=[p.id];p.construction.project={building:'markets',progress:0,startedTurn:1};
 settlePersonnel(q.domestic,2,()=>.9,q.stats);assert.equal(p.population.professions.soldiers,200);assert.equal(p.military.training,48);
 const old=p.military.training;p.buildings.trainingGrounds=8;settleBuildingEffects(p,3,true,false);assert.equal(p.military.training,old);
});

test('B05 granaries protect only disaster grain losses with downward rounding',()=>{
 const p=city(fixture());p.buildings.granaries=10;assert.equal(protectedGrainLoss(p,101,2),50);assert.equal(protectedGrainLoss(p,0,2),0);
 const a=fixture(),b=structuredClone(a);city(a).buildings.granaries=10;city(b).buildings.granaries=0;
 let seed;for(let n=1;n<1000;n++){const c=structuredClone(a);c.domestic.disasters.seed=n;settleDisasters(c.domestic,2);if(c.domestic.disasters.history.some(r=>r.provinceId==='hebei')){seed=n;break;}}
 assert.ok(seed);a.domestic.disasters.seed=b.domestic.disasters.seed=seed;settleDisasters(a.domestic,2);settleDisasters(b.domestic,2);
 const ea=a.domestic.disasters.history.find(r=>r.provinceId==='hebei'),eb=b.domestic.disasters.history.find(r=>r.provinceId==='hebei');
 assert.equal(ea.grainLoss,Math.floor(eb.grainLoss/2));assert.equal(ea.grainSaved,ea.rawGrainLoss-ea.grainLoss);assert.equal(ea.cashLoss,eb.cashLoss);assert.equal(city(a).welfare.stability,city(b).welfare.stability);
});

test('B06 walls preserve the old baseline and activate only after completion, without reload stacking',()=>{
 let s=fixture(),p=city(s);p.buildings.walls=3;p.buildingEffects.baselineWalls=3;
 s=startConstruction(s,p.id,'walls').state;p=city(s);p.construction.project.progress=5;settleConstruction(s.domestic,2);
 assert.equal(p.buildings.walls,4);assert.equal(p.welfare.defense,30);settleBuildingEffects(p,2,true,false);assert.equal(p.welfare.defense,30);
 s.turn=2;s=save(s);p=city(s);settleBuildingEffects(p,3,true,false);assert.equal(p.welfare.defense,35);s.turn=3;assert.equal(city(save(save(s))).welfare.defense,35);
});

test('B07 every new building is excluded on its completion turn and included the next turn',()=>{
 for(const [building,metric]of [['temples','stability'],['yamen','security'],['markets','activity'],['trainingGrounds','fitness'],['palaces','loyalty']]){
 let s=fixture();s=startConstruction(s,'hebei',building).state;const p=city(s),initial=welfareValue(p,metric);p.construction.project.progress=({temples:4,yamen:5,markets:3,trainingGrounds:4,palaces:9}[building])-1;
 settleConstruction(s.domestic,2);settleBuildingEffects(p,2,true,false);assert.equal(welfareValue(p,metric),initial);
 settleBuildingEffects(p,3,true,false);assert.equal(welfareValue(p,metric),initial+(building==='palaces'?.1:.25));assert.equal(p.buildingEffects.last.counts[building],1);
 }
});

test('B08 palace loyalty accumulates tenths only when fed and disaster-free',()=>{
 let s=fixture(),p=city(s);p.buildings.palaces=1;
 for(let t=2;t<=11;t++){settleBuildingEffects(p,t,true,false);s.turn=t;s=save(s);p=city(s);}
 assert.equal(welfareValue(p,'loyalty'),51);settleBuildingEffects(p,12,false,false);settleBuildingEffects(p,13,true,true);assert.equal(welfareValue(p,'loyalty'),51);
});

test('settlement recovers after food penalties, risk uses pre-recovery values in the same turn, and repeated settlement is inert',()=>{
 const s=fixture(),p=city(s);p.buildings.temples=8;p.buildings.yamen=8;p.buildings.palaces=1;p.welfare.grainReserve=0;p.economy.agriculture.productivity=0;s.domestic.disasters.lastTurn=100;
 const old=p.welfare.stability;settleDomestic(s.domestic,2);assert.equal(welfareValue(p,'stability'),old-2);assert.equal(p.buildingEffects.last.fed,false);assert.equal(p.buildingEffects.last.gains.loyalty,0);
 const risk=disasterRisk(s.domestic,p,2).human;assert.ok(disasterRisk(s.domestic,p,3).human<risk);
 const snapshot=JSON.stringify(s);settleDomestic(s.domestic,2);assert.equal(JSON.stringify(s),snapshot);
});

test('delegation skips buildings with no marginal recovery benefit',()=>{
 const s=fixture(),p=city(s);for(const key of ['temples','yamen','markets','trainingGrounds'])p.buildings[key]=8;
 p.buildings.walls=0;p.welfare.defense=100;p.buildings.granaries=2;s.domestic.personnel.delegations=[p.id];
 settlePersonnel(s.domestic,2,()=>.9,s.stats);assert.equal(p.construction.project.building,'granaries');
});

test('legacy migration preserves state and establishes neutral commerce and defense baselines',()=>{
 const old=newGame('旧建物帝');old.turn=40;for(const p of old.domestic.provinces)delete p.buildingEffects;
 const before=structuredClone(old),loaded=save(old);assert.equal(city(loaded).buildingEffects.lastTurn,40);assert.equal(city(loaded).buildingEffects.last,null);assert.equal(commerceMultiplier(city(loaded)),1);
 assert.deepEqual(city(loaded).welfare,city(before).welfare);assert.deepEqual(city(loaded).buildings,city(before).buildings);assert.equal(countrySummary(loaded.domestic).income,countrySummary(before.domestic).income);assert.deepEqual(save(loaded),loaded);
});

test('invalid fractional state, baselines, completion marks and future settlement are rejected',()=>{
 const s=fixture();for(const change of [p=>p.buildingEffects.version=2,p=>p.buildingEffects.carry.security=100,p=>p.buildingEffects.carry.activity=-1,p=>p.buildingEffects.baselineActivity=101,p=>p.buildingEffects.lastTurn=2,p=>delete p.buildingEffects.carry.loyalty,p=>p.buildingEffects.pending={building:'toString',completedTurn:1,effectiveTurn:2}]){const bad=structuredClone(s);change(city(bad));assert.throws(()=>save(bad));}
});

test('failed save of a full turn publishes no recovery, and retry does not double gains',()=>{
 const initial=fixture();city(initial).buildings.temples=1;initial.domestic.disasters.lastTurn=100;
 const candidate=structuredClone(initial);advance(candidate);const before=JSON.stringify(initial),draft=JSON.stringify(candidate);
 assert.throws(()=>persistCandidate(initial,candidate,{setItem(){throw Error('quota');}}),/保存失败/);assert.equal(JSON.stringify(initial),before);assert.equal(JSON.stringify(candidate),draft);
 const next=persistCandidate(initial,candidate,{setItem(){}});assert.equal(welfareValue(city(next),'stability'),50.25);const restored=save(next),snapshot=JSON.stringify(restored);settleDomestic(restored.domestic,2);assert.equal(JSON.stringify(restored),snapshot);
});

test('effect report displays fractional gains, caps, delayed activation and combat limitation',()=>{
 const s=fixture(),p=city(s);p.buildings.temples=8;p.buildings.palaces=1;settleBuildingEffects(p,2,true,false);
 const html=buildingEffectsReport(p,2);assert.match(html,/当前收益已封顶/);assert.match(html,/0.1/);assert.match(html,/尚不影响战棋伤害/);assert.match(html,/缺粮暂停/);
});
