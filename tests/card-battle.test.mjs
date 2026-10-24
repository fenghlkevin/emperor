import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {newGame,validateSave} from '../src/game.mjs';
import {beginWar,advanceWar,finishWar,generals,borderingCountries} from '../src/war.mjs';
import {cardAI,actCards,actCardsMutable,legalCardAttacks,legalCardTargets,legalCardActions,validateCards,createFixedCardPerson,registerCardPerson,upgradeCardPerson,validateCardPeople,attachCards,HISTORICAL_CARDS,CARD_DEFINITIONS,cardCost} from '../src/card-battle.mjs';
import {ACTIVE_HISTORICAL_PEOPLE} from '../src/exam.mjs';
import {fixture,ROSTERS} from '../scripts/card-battle-balance-fixture.mjs';
const setup=()=>{const s=newGame('军阵验收'),g=generals(s.domestic);return {before:s,state:beginWar(s,{id:s.domestic.war.nextId,kitVersion:1,battleMode:'cards',kind:'war',targetId:borderingCountries(s.domestic)[0].id,generalId:g[0].id,commanderSquad:{kind:'cavalry',count:37},squads:[{kind:'spears',count:137,generalId:g[1].id},{kind:'heavy-cavalry',count:40,generalId:g[2].id}]})};};
const start=b=>actCardsMutable(b,cardAI(b));
function place(b,side,predicate=()=>true){const c=b.cards,p=c.players[side],id=[...p.deck,...p.hand,...p.grave].find(id=>c.catalog[id].type!=='tactic'&&predicate(c.catalog[id]));assert.ok(id,'fixture has required troop');for(const z of ['deck','hand','grave'])p[z]=p[z].filter(v=>v!==id);p.board.push(id);const x=c.catalog[id];x.played=++c.sequence;x.ready=true;return x;}
function blank(hero='martial'){const b=start(fixture({hero}));for(const side of ['home','enemy']){const p=b.cards.players[side];p.grave.push(...p.board);p.board=[];p.hero=30;p.armor=0;p.mana=p.maxMana=10;}return b;}
function give(b,definition){const p=b.cards.players.home,id=[...p.deck,...p.hand,...p.grave].find(id=>b.cards.catalog[id].definitionId===definition);assert.ok(id,definition+' exists');for(const z of ['deck','hand','grave'])p[z]=p[z].filter(v=>v!==id);p.hand.push(id);return id;}

test('real armies conserve soldiers, fixed people and supply; either seat has a legal one-mana front',()=>{
 const {before,state}=setup(),b=state.domestic.war.battle,c=b.cards;validateSave(state);
 assert.equal(c.rulesVersion,3);assert.equal(c.players.home.hand.length,c.first==='home'?3:5);assert.equal(c.players.enemy.hand.length,c.first==='enemy'?3:5);
 for(const side of ['home','enemy']){const p=c.players[side];assert.equal(p.hand.length+p.deck.length,side===c.first?30:31);assert.ok(p.hand.some(id=>c.catalog[id].front&&c.catalog[id].cost===1));for(const u of b.units.filter(u=>u.side===side&&!u.commander))assert.equal(Object.values(c.catalog).filter(x=>x.unitId===u.id).reduce((n,x)=>n+x.count,0)+p.reserve[u.id],u.initial);}
 assert.equal(b.units.find(u=>u.commander&&u.side==='home').general.id,generals(before.domestic)[0].id);
 const next=advanceWar(state,{type:'mulligan',ids:[]});assert.equal(next.stats.treasury,state.stats.treasury);assert.equal(next.domestic.war.battle.cards.players[c.first].mana,1);assert.equal(next.domestic.war.battle.cards.phase,'play');validateSave(next);
 const profile=Object.values(state.domestic.cardPeople.people).find(p=>p.personId.startsWith('garrison-'));assert.ok(profile);assert.ok(profile.portraitId.startsWith('regional-'));const raw=state.domestic.war.battle.units.find(u=>u.cardPersonId===profile.personId).general;for(const key of ['martial','intelligence','leadership'])assert.equal(profile.abilities[key],raw[key]??35);assert.deepEqual(JSON.parse(JSON.stringify(state)).domestic.cardPeople,state.domestic.cardPeople);
 const bad=structuredClone(state);const card=Object.values(bad.domestic.war.battle.cards.catalog).find(x=>x.type!=='tactic');card.count++;assert.throws(()=>validateSave(bad));
});

test('full production-engine games serialize and preserve exact real loss settlement once',()=>{
 const {before,state}=setup();let b=state.domestic.war.battle;for(let i=0;!b.result&&i<2000;i++){b=actCards(b,cardAI(b));state.domestic.war.battle=b;if(i%17===0)validateSave(JSON.parse(JSON.stringify(state)));}assert.ok(b.result);validateSave(state);
 const dead=b.units.filter(u=>u.side==='home').reduce((n,u)=>n+u.dead,0),result=finishWar(state);assert.equal(result.state.domestic.centralArmy.soldiers,before.domestic.centralArmy.soldiers-dead);assert.equal(result.receipt.report.home.dead,dead);for(const kind of ['spears','cavalry','heavy-cavalry'])assert.equal(result.state.domestic.troopKits.depots.central.stock[kind],before.domestic.troopKits.depots.central.stock[kind]-b.units.filter(u=>u.side==='home'&&u.kind===kind).reduce((n,u)=>n+u.dead,0));assert.throws(()=>finishWar(result.state));validateSave(result.state);
});

test('5 attack removes 5 life, simultaneous retaliation, zero-mana attacks and taunt/rush/stealth',()=>{
 const b=blank(),a=place(b,'home',x=>x.printedAttack>=3),t=place(b,'enemy');a.attack=5;a.hp=10;t.hp=10;t.attack=3;a.tags=[];t.tags=[];b.cards.players.home.mana=0;
 actCardsMutable(b,{type:'attack',id:a.id,target:t.id});assert.equal(t.hp,5);assert.equal(a.hp,7);assert.equal(a.ready,false);assert.equal(b.cards.players.home.mana,0);
 a.ready=true;t.tags=['taunt'];assert.deepEqual(legalCardAttacks(b,a.id),[t.id]);assert.throws(()=>actCards(b,{type:'attack',id:a.id,target:'hero'}));t.tags.push('stealth');assert.ok(!legalCardAttacks(b,a.id).includes(t.id));assert.ok(legalCardAttacks(b,a.id).includes('hero'));a.rushing=true;assert.ok(!legalCardAttacks(b,a.id).includes('hero'));
});

test('all twelve tactics have target validation and damage, buffs, silence, freeze, draw and healing',()=>{
 let b=blank();let id=give(b,'precision');assert.ok(legalCardTargets(b,id).includes('hero'));let hp=b.cards.players.enemy.hero;actCardsMutable(b,{type:'play',id,target:'hero'});assert.equal(b.cards.players.enemy.hero,hp-CARD_DEFINITIONS.precision.enter[0].n);
 b=blank();id=give(b,'fortify');assert.equal(legalCardTargets(b,id).length,0);assert.throws(()=>actCards(b,{type:'play',id}));const friend=place(b,'home'),foe=place(b,'enemy');actCardsMutable(b,{type:'play',id,target:friend.id});assert.equal(friend.attack,friend.printedAttack+2);assert.equal(friend.hp,friend.printedHp+2);
 id=give(b,'dispel');actCardsMutable(b,{type:'play',id,target:foe.id});assert.equal(foe.silenced,true);
 b=blank();const f=place(b,'enemy');id=give(b,'pin');const hand=b.cards.players.home.hand.length;actCardsMutable(b,{type:'play',id,target:f.id});assert.equal(f.frozen,true);assert.equal(b.cards.players.home.hand.length,Math.min(10,hand));actCardsMutable(b,{type:'end'});assert.equal(legalCardAttacks(b,f.id).length,0);actCardsMutable(b,{type:'end'});assert.equal(f.frozen,false);
 b=blank();b.cards.players.home.hero=20;id=give(b,'heal');actCardsMutable(b,{type:'play',id});assert.equal(b.cards.players.home.hero,25);
 b=blank();id=give(b,'supply');const n=b.cards.players.home.hand.length;actCardsMutable(b,{type:'play',id});assert.equal(b.cards.players.home.hand.length,Math.min(10,n+1));
});

test('shield blocks once; permanent and temporary buffs, healing and silence never refund deaths',()=>{
 const b=blank(),a=place(b,'home'),t=place(b,'enemy');a.attack=1;a.tags=[];t.tags=['shield'];const hp=t.hp;actCardsMutable(b,{type:'attack',id:a.id,target:t.id});assert.equal(t.hp,hp);assert.ok(!t.tags.includes('shield'));assert.equal(t.lossPeak,0);
 const initial=a.lossPeak;a.ready=true;b.cards.players.home.mana=10;let id=give(b,'fortify');actCardsMutable(b,{type:'play',id,target:a.id});assert.equal(a.lossPeak,initial);
 id=give(b,'assault');const attack=a.attack;actCardsMutable(b,{type:'play',id,target:a.id});assert.equal(a.attack,attack+CARD_DEFINITIONS.assault.enter[0].a);actCardsMutable(b,{type:'end'});assert.equal(a.attack,attack);
 b.cards.players.enemy.mana=10;const dispel=[...b.cards.players.enemy.hand,...b.cards.players.enemy.deck].find(id=>b.cards.catalog[id].definitionId==='dispel');if(dispel){const p=b.cards.players.enemy;p.deck=p.deck.filter(id=>id!==dispel);if(!p.hand.includes(dispel))p.hand.push(dispel);actCardsMutable(b,{type:'play',id:dispel,target:a.id});assert.ok(a.lossPeak>=initial);assert.equal(a.maxHp,a.printedHp);}
});

test('hero powers, armor, fatigue and hand burn use normal Hearthstone timing',()=>{
 let b=blank('intelligence'),p=b.cards.players.home;const count=p.hand.length;p.armor=1;actCardsMutable(b,{type:'power'});assert.equal(p.hand.length,Math.min(10,count+1));assert.equal(p.hero,29);assert.equal(p.armor,0);assert.equal(p.powerUsed,true);assert.throws(()=>actCards(b,{type:'power'}));
 b=blank();p=b.cards.players.home;p.grave.push(...p.deck);p.deck=[];p.reserve=Object.fromEntries(Object.entries(p.reserve).map(([id,n])=>[id,n]));p.gaps=[];actCardsMutable(b,{type:'end'});actCardsMutable(b,{type:'end'});assert.equal(p.hero,29);assert.equal(p.fatigue,1);
});

test('all 100 current historical identities have complete unique cards and existing art',()=>{
 assert.equal(HISTORICAL_CARDS.length,100);assert.deepEqual([...HISTORICAL_CARDS.map(d=>d.person_id)].sort(),[...ACTIVE_HISTORICAL_PEOPLE.map(d=>d.id)].sort());assert.equal(new Set(HISTORICAL_CARDS.map(d=>d.id)).size,100);
 for(const d of HISTORICAL_CARDS){assert.ok(d.cost>=1&&d.cost<=10);assert.ok(d.skill);for(const file of Object.values(d.art))assert.ok(fs.existsSync(file));const p=createFixedCardPerson({id:'recruit-'+d.person_id,name:d.name,...d.source});assert.equal(p.historicalDefinitionId,d.person_id);assert.equal(p.definitionId,d.id);assert.equal(p.portraitId,d.person_id);}
});

test('each of the 100 historical cards deploys with its own printed skill and resolves legally',()=>{
 for(const d of HISTORICAL_CARDS){const b=fixture(),selected=Object.values(b.cards.catalog).find(x=>x.side==='home'&&x.type==='general'),u=b.units.find(u=>u.id===selected.unitId);u.general={...u.general,id:d.person_id,name:d.name,...d.source};u.cardPersonId=d.person_id;b.cardPeople[d.person_id]=createFixedCardPerson(u.general);attachCards(b,{first:'home'});start(b);const p=b.cards.players.home,id=Object.values(b.cards.catalog).find(x=>x.side==='home'&&x.personId===d.person_id)?.id;assert.ok(id,d.name+' deployment card');for(const z of ['deck','hand','grave'])p[z]=p[z].filter(x=>x!==id);p.hand.push(id);p.mana=p.maxMana=10;const a=place(b,'home'),t=place(b,'enemy');t.hp=Math.max(1,t.maxHp-1);t.lossPeak=1-t.hp/t.maxHp;
 const target=legalCardTargets(b,id)[0];actCardsMutable(b,{type:'play',id,...(target?{target}:{})});assert.ok(p.board.includes(id),d.name);assert.equal(b.cards.catalog[id].definition.skill,d.skill);assert.ok(b.cards.catalog[id].personId===d.person_id);
 }
});

test('random cards are ability gated, use private templates and are fixed across save, office and battle',()=>{
 const d={};for(let i=0;i<500;i++){const person={id:'random-test-'+i,name:'韩景和',role:i%2?'文职':'武将',martial:i%101,intelligence:i*17%101,leadership:i*37%101},a=registerCardPerson(d,person),copy=JSON.parse(JSON.stringify(d)),again=registerCardPerson(copy,{...person,martial:100,intelligence:100,leadership:100});assert.deepEqual(a,again);assert.equal(a.historicalDefinitionId,null);assert.ok(a.templateId.startsWith('random_'));if(person.martial<40){assert.ok(a.definition.attack<=2);assert.ok(!a.definition.tags.includes('rush'));}if(person.role==='文职')assert.ok(a.portraitId.startsWith('random-civil-'));}
});

test('old v1/v2 saves keep their original stats, validation and battle engine',()=>{
 const {state}=setup(),b=state.domestic.war.battle,one=structuredClone(b),two=structuredClone(b);attachCards(one,{rulesVersion:1});attachCards(two,{rulesVersion:2});for(const [id,x]of Object.entries(one.cards.catalog))if(x.type==='troop'){assert.equal(two.cards.catalog[id].hp,x.hp+4);assert.equal(two.cards.catalog[id].attack,x.attack);}delete one.cards.rulesVersion;state.domestic.war.battle=one;validateSave(state);assert.equal(actCards(one,{type:'mulligan',ids:[]}).cards.phase,'play');
});

test('invalid orders, immutable actions and retreat preserve actual soldiers and charge no new supply',()=>{
 const {before,state}=setup(),b=state.domestic.war.battle;assert.throws(()=>actCards(b,{type:'end'}),/起手/);const copy=JSON.stringify(b);assert.throws(()=>actCards(b,{type:'mulligan',ids:['missing']}));assert.equal(JSON.stringify(b),copy);state.domestic.war.battle=actCards(b,{type:'retreat'});const r=finishWar(state);assert.equal(r.state.domestic.centralArmy.soldiers,before.domestic.centralArmy.soldiers);validateSave(r.state);
});

test('card defense preserves local/central/allied soldiers and complete campaign settlement',async()=>{
 const {startCampaign,beginDefense}=await import('../src/foreign-strategy.mjs'),{defaultKitDefensePlan}=await import('../src/kit-defense.mjs'),{relationBetween}=await import('../src/diplomacy.mjs');const s=newGame('军阵守城');s.turn=37;relationBetween(s.domestic,'sheng','tubo').relation='defense';startCampaign(s.domestic,'xi','hebei',s.turn);const n=beginDefense(s,{deployment:{...defaultKitDefensePlan(s),battleMode:'cards'}});validateSave(n);let b=n.domestic.war.battle;for(let i=0;!b.result&&i<2000;i++)b=actCards(b,cardAI(b));assert.ok(b.result);n.domestic.war.battle=b;validateSave(n);const dead=b.units.reduce((n,u)=>n+u.dead,0),pop=d=>d.provinces.reduce((n,p)=>n+p.population.total,0),r=finishWar(n);assert.equal(pop(r.state.domestic),pop(s.domestic)-dead);assert.equal(r.state.domestic.strategy.pending,null);validateSave(r.state);
});

test('real growth upgrades the same fixed template variant outside battle, without rerolling identity',()=>{
 const d={},person={id:'random-growth',name:'韩景和',role:'文职',martial:20,intelligence:80,leadership:40};
 const p=registerCardPerson(d,person),before=structuredClone(p),variant=p.definition.variant;
 person.intelligence=92;person.growthVersion=1;d.war={battle:{}};assert.deepEqual(upgradeCardPerson(d,person,5),before);
 delete d.war.battle;upgradeCardPerson(d,person,6);assert.equal(p.tier,3);assert.equal(p.definition.variant,variant);assert.equal(p.name,before.name);assert.equal(p.portraitId,before.portraitId);assert.equal(p.generationSeed,before.generationSeed);assert.equal(p.personId,before.personId);assert.equal(p.lastGrowthTurn,6);validateCardPeople(d);
 const copy=JSON.parse(JSON.stringify(d));assert.deepEqual(registerCardPerson(copy,person),p);assert.equal(upgradeCardPerson(copy,person,7).revision,1);
});

test('pending battle prevents personnel changes that would invalidate real officer snapshots',async()=>{
 const {executePersonnel}=await import('../src/personnel-actions.mjs'),{state}=setup();assert.throws(()=>executePersonnel(state,{id:state.domestic.personnel.nextId,kind:'dismiss',officialId:generals(state.domestic)[0].id}),/结束当前战斗/);validateSave(state);
});

test('production card catalog matches its review artifact and uses fixed visible cavalry variants',()=>{
 const catalog=JSON.parse(fs.readFileSync(new URL('../docs/card-battle-release-catalog.json',import.meta.url),'utf8'));
 assert.deepEqual(Object.values(CARD_DEFINITIONS),[...catalog.cards,catalog.coin]);assert.equal(catalog.cards.filter(d=>d.type==='troop').length,30);assert.equal(catalog.cards.filter(d=>d.type==='spell').length,12);
 for(const hero of ['martial','intelligence','command']){const b=fixture({roster:ROSTERS.cavalry_1800,hero}),cards=Object.values(b.cards.catalog).filter(x=>x.side==='home'&&x.kind==='cavalry'&&x.definitionId.endsWith('_scout'));
 assert.ok(cards.length);assert.ok(cards.every(x=>x.definitionId===(hero==='martial'?'cavalry_scout':'cavalry_patrol_scout')));for(const x of cards){assert.equal(x.cost,2);assert.ok(x.tags.includes('rush'));assert.equal(x.printedAttack,hero==='martial'?3:2);assert.equal(x.printedHp,hero==='martial'?2:3);}}
});
