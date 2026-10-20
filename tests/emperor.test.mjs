import test from 'node:test';import assert from 'node:assert/strict';
import {newGame,validateSave,advance,resolveExhaustion} from '../src/game.mjs';
import {BEAUTIES,BEAUTY_REGIONS,CULTURES} from '../src/beauties.mjs';
import {RANKS,palaceAction,spendEnergy,courtBlock} from '../src/emperor.mjs';
import {settlePersonnel} from '../src/personnel-actions.mjs';
test('archived adult roster stays save-compatible across all map regions and ranks',()=>{assert.ok(BEAUTIES.length>=1000);assert.equal(new Set(BEAUTIES.map(p=>p.id)).size,BEAUTIES.length);assert.equal(new Set(BEAUTIES.map(p=>p.name)).size,BEAUTIES.length);assert.equal(RANKS.length,100);assert.equal(new Set(RANKS).size,100);for(const r of BEAUTY_REGIONS)assert.ok(BEAUTIES.some(p=>p.regionId===r.id));assert.ok(BEAUTIES.every(p=>p.age>=18&&p.dress&&p.personality&&p.specialty&&Object.hasOwn(CULTURES,p.culture)));});
test('exhaustion blocks work and recovers fully with the DOS lifespan penalty',()=>{const s=newGame('帝');s.stats.energy=1;spendEnergy(s);assert.equal(s.stats.energy,0);assert.match(courtBlock(s),/体力耗尽/);assert.throws(()=>spendEnergy(s,true));assert.throws(()=>palaceAction(s,'study'));assert.equal(palaceAction(s,'sleep').state.stats.energy,200);assert.equal(resolveExhaustion(s),true);assert.equal(s.turn,2);assert.equal(s.stats.energy,200);assert.equal(s.stats.life,2129);});
test('training changes only its ability and energy; mood and health need rest',t=>{t.mock.method(Math,'random',()=>.99);let s=newGame('帝');for(const [kind,key]of [['study','wisdom'],['music','charm'],['theatre','talent'],['martial','martial']]){const before=s.stats[key],energy=s.stats.energy;s=palaceAction(s,kind).state;assert.equal(s.stats[key],before+4);assert.equal(s.stats.energy,energy-40);}s.stats.happiness=19;assert.match(courtBlock(s),/快乐/);s=palaceAction(s,'company',{id:s.harem.members[0].id}).state;assert.equal(courtBlock(s),'');s.stats.health=19;assert.match(courtBlock(s),/健康/);s=palaceAction(s,'sleep').state;assert.equal(courtBlock(s),'');s.stats.wisdom=499;assert.equal(palaceAction(s,'study').state.stats.wisdom,500);});
test('companion recovery uses appearance, experience and rank; repeated visits cost life',t=>{t.mock.method(Math,'random',()=>.99);const s=newGame('帝');s.stats.energy=1;const weak=structuredClone(s),strong=structuredClone(s);Object.assign(weak.harem.members[0],{appearance:45,experience:0});Object.assign(strong.harem.members[0],{appearance:80,experience:90});assert.ok(palaceAction(strong,'company',{id:strong.harem.members[0].id}).state.stats.energy>palaceAction(weak,'company',{id:weak.harem.members[0].id}).state.stats.energy);let n=s;for(let i=0;i<5;i++)n=palaceAction(n,'company',{id:n.harem.members[0].id}).state;assert.equal(n.stats.health,s.stats.health);assert.equal(n.stats.life,s.stats.life-30);assert.equal(palaceAction(n,'sleep').state.harem.streak,0);});
test('admission respects occupied ranks and supports untitled retainers',()=>{let s=palaceAction(newGame('帝'),'encounter').state;assert.throws(()=>palaceAction(s,'admit',{rank:0}));s=palaceAction(s,'admit',{rank:null}).state;assert.equal(s.harem.members.length,2);assert.equal(s.harem.members[1].rank,null);s=palaceAction(s,'rank',{id:s.harem.members[1].id,rank:99}).state;assert.equal(s.harem.members[1].rank,99);assert.deepEqual(validateSave(JSON.parse(JSON.stringify(s))),s);});
test('legacy migration and corrupt extended saves',()=>{const s=newGame('帝');delete s.harem;for(const k of ['energy','maxEnergy','life','lifeLimit','happiness','charm','talent','wisdom','martial','age'])delete s.stats[k];const migrated=validateSave(s);assert.equal(migrated.stats.energy,200);const bad=structuredClone(migrated);bad.stats.energy=Infinity;assert.throws(()=>validateSave(bad));bad.stats.energy=1;bad.harem.members[0].age=12;assert.throws(()=>validateSave(bad));});
test('court changes cost one energy and degrade happiness and health',()=>{const s=newGame('帝');spendEnergy(s,true);assert.equal(s.stats.energy,199);assert.equal(s.stats.happiness,72);assert.equal(s.stats.health,98);advance(s);assert.equal(s.stats.health,98);assert.equal(s.stats.energy,199);assert.equal(s.stats.life,2159);});
test('charm and wisdom increase historical appearances across deterministic exam samples',()=>{const frequency=skill=>{let total=0,count=0;for(let seed=1;seed<=80;seed++){const s=newGame('帝');s.domestic.personnel.examTurn=2;let x=seed;settlePersonnel(s.domestic,2,()=>{x=(x*1664525+1013904223)>>>0;return x/4294967296;},{wisdom:skill,charm:skill});for(const p of s.domestic.personnel.candidates){total+=!p.generated;count++;}}return total/count;};assert.ok(frequency(500)>frequency(0)+.2);});
test('cold palace preserves rank, blocks company and appointment, and restores across saves',()=>{let s=newGame('帝');const id=s.harem.members[0].id;s=palaceAction(s,'cold-palace',{id}).state;assert.equal(s.harem.members[0].rank,0);assert.equal(s.harem.members[0].inColdPalace,true);assert.throws(()=>palaceAction(s,'company',{id}),/召回/);assert.throws(()=>palaceAction(s,'rank',{id,rank:1}),/召回/);s=validateSave(JSON.parse(JSON.stringify(s)));s=palaceAction(s,'restore',{id}).state;s=palaceAction(s,'rank',{id,rank:1}).state;assert.equal(s.harem.members[0].rank,1);assert.equal(s.harem.members[0].inColdPalace,false);});
test('legacy saves receive empty child roster and validate child records',()=>{const s=newGame('帝');delete s.harem.children;delete s.harem.members[0].inColdPalace;validateSave(s);assert.deepEqual(s.harem.children,[]);s.harem.children.push({name:'皇女',gender:'女',age:2,motherId:s.harem.members[0].id});assert.doesNotThrow(()=>validateSave(s));s.harem.children[0].age=-1;assert.throws(()=>validateSave(s),/子女/);});

test('one-click entry rank uses vacant basic titles without granting a high rank',async()=>{const {entryConsortRank}=await import('../src/emperor.mjs');const s=newGame('册封');const basic=RANKS.indexOf('美人');assert.equal(entryConsortRank(s),basic);s.harem.members.push({id:'occupied-basic',rank:basic,inColdPalace:true});assert.equal(entryConsortRank(s),basic+1);for(let rank=basic+1;rank<RANKS.length;rank++)s.harem.members.push({id:'occupied-'+rank,rank});assert.equal(entryConsortRank(s),null);});

test('night-time dismissal deletes random candidates and permanently excludes famous candidates',async()=>{const {ACTIVE_BEAUTIES}=await import('../src/beauties.mjs');const {ensurePortrait}=await import('../src/beauty-portrait.mjs');const {encounter}=await import('../src/emperor.mjs');for(const famous of [false,true]){let s=newGame('遣出验收');s.phase=5;const base=famous?ACTIVE_BEAUTIES.find(p=>p.id!==s.harem.members[0].id):BEAUTIES.find(p=>p.origin==='原创'&&p.regionId==='sheng');s.harem.encounter=ensurePortrait({...base,rank:null,...(famous?{}:{randomBeauty:true})},'dismiss-test');const original=structuredClone(s),id=base.id,before=s.stats.energy;s=palaceAction(s,'dismiss').state;assert.equal(s.harem.encounter,null);assert.equal(s.harem.members.length,1);assert.equal(s.stats.energy,before);assert.ok(s.harem.seen.includes(id));assert.equal(original.harem.encounter.id,id);if(famous){assert.ok(s.harem.dismissed.includes(id));const ordinary=BEAUTIES.find(p=>p.origin==='原创'&&p.regionId==='sheng');s.harem.seen=BEAUTIES.filter(p=>![id,ordinary.id].includes(p.id)).map(p=>p.id);assert.notEqual(encounter(s).id,id);s.harem.encounter=null;}else assert.equal(s.harem.dismissed,undefined);validateSave(JSON.parse(JSON.stringify(s)));assert.throws(()=>palaceAction(s,'dismiss'),/尚无待选/);}});


test('consorts start adult with no experience, age annually, and learn through company',t=>{
 t.mock.method(Math,'random',()=>.99);
 assert.ok(BEAUTIES.every(p=>p.age===18&&p.experience===0));
 let s=newGame('成长验收');
 s=palaceAction(s,'encounter').state;
 assert.equal(s.harem.members[0].age,18);
 const encounterAge=s.harem.encounter.age;assert.ok(encounterAge>=18);
 for(let i=0;i<35;i++)advance(s);
 assert.equal(s.harem.members[0].age,18);
 assert.equal(s.harem.encounter.age,encounterAge);
 advance(s);
 assert.equal(s.harem.members[0].age,19);
 assert.equal(s.harem.encounter.age,encounterAge+1);
 const id=s.harem.members[0].id;
 s.stats.energy=1;s.stats.maxEnergy=500;
 const novice=palaceAction(s,'company',{id}).state;
 assert.equal(novice.harem.members[0].experience,1);
 const experienced=structuredClone(s);experienced.stats.maxEnergy=500;experienced.harem.members[0].experience=100;
 assert.ok(palaceAction(experienced,'company',{id}).state.stats.energy>novice.stats.energy);
 const capped=palaceAction(experienced,'company',{id}).state;
 assert.equal(capped.harem.members[0].experience,100);
 assert.equal(validateSave(JSON.parse(JSON.stringify(novice))).harem.members[0].age,19);
});
