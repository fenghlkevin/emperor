import test from 'node:test';
import assert from 'node:assert/strict';
import {newGame,validateSave,advance} from '../src/game.mjs';
import {palaceAction,spendEnergy} from '../src/emperor.mjs';
import {educateRoyal} from '../src/dynasty.mjs';
import {companyBond,educationBond,activeHarmony,BOND_RULES} from '../src/harem-bonds.mjs';
import {succeedDynasty,executeNational} from '../src/national-actions.mjs';
import {settleReignResult} from '../src/reign-result.mjs';
import {pendingRoyalEvent} from '../src/royal-events.mjs';

function fixture(specialty='园艺',personality='独立洒脱'){
 const s=newGame('情缘验收');s.turn=40;s.harem.portraitSeed=1;s.stats.health=100;s.stats.happiness=90;
 const p=s.harem.members[0];const kinds= specialty==='医理'?['care','longevity']:specialty==='琴学'?['harmony','longevity']:specialty==='诗赋'?['advice','longevity']:specialty==='诗书'?['education','longevity']:['longevity'];Object.assign(p,{specialty,personality,hiddenTraits:{version:1,source:'historical',kinds},experience:60,bond:{visits:6,lastVisitTurn:39,lastEventTurn:0,lifeGranted:0}});
 s.harem.streak=1;return s;
}
function trigger(kind,s=fixture()){
 for(let seed=1;seed<2000;seed++){
  const n=structuredClone(s);n.harem.portraitSeed=seed;
  companyBond(n,n.harem.members[0]);
  if(n.harem.bonds.history[0]?.kind===kind)return n;
 }
 throw Error(`未能触发${kind}`);
}
test('legacy saves start with no inferred relationship or retrospective rewards',()=>{
 let s=newGame('旧档');delete s.harem.bonds;s.harem.members[0].experience=100;
 const before=s.stats.life;s=validateSave(JSON.parse(JSON.stringify(s)));
 assert.equal(s.stats.life,before);assert.equal(s.harem.bonds.lifeGranted,0);assert.equal(s.harem.members[0].bond,undefined);
 for(let i=0;i<5;i++){
  s.turn++;s.harem.streak=1;companyBond(s,s.harem.members[0]);
 }
 assert.equal(s.harem.members[0].bond.visits,5);assert.deepEqual(s.harem.bonds.history,[]);
});
test('an unused legacy ledger follows the initialized dynasty without carrying old rewards',()=>{
 const s=newGame('旧朝兼容');s.turn=101;s.dynasty.reignStartTurn=50;
 const n=validateSave(JSON.parse(JSON.stringify(s)));assert.equal(n.harem.bonds.reignStartTurn,50);assert.equal(n.harem.bonds.lifeGranted,0);
 const used=trigger('longevity');used.dynasty.reignStartTurn=20;assert.throws(()=>validateSave(used),/后宫/);
});
test('longevity changes actual lifespan, records its source, and survives save/load',()=>{
 const s=fixture(),n=trigger('longevity',s),p=n.harem.members[0];
 assert.equal(n.stats.life,s.stats.life+3);assert.equal(n.harem.bonds.lifeGranted,3);assert.equal(p.bond.lifeGranted,3);
 assert.match(n.harem.bonds.history[0].message,/寿元增加3/);assert.equal(pendingRoyalEvent(n),undefined);
 assert.deepEqual(validateSave(JSON.parse(JSON.stringify(n))),n);
});
test('legacy bond popups are silently retired while real royal notices and earned benefits remain',()=>{
 const s=trigger('longevity'),life=s.stats.life;
 s.harem.royalNoticeSequence=2;s.harem.royalNotices=[
  {id:1,kind:'harem-bond',message:s.harem.bonds.history[0].message,turn:s.turn,availableTurn:s.turn},
  {id:2,kind:'birth',message:'皇嗣降生',turn:s.turn,availableTurn:s.turn}
 ];
 assert.equal(pendingRoyalEvent(s).kind,'birth');
 const loaded=validateSave(JSON.parse(JSON.stringify(s)));
 assert.deepEqual(loaded.harem.royalNotices.map(e=>e.kind),['birth']);assert.equal(loaded.stats.life,life);assert.equal(loaded.harem.bonds.history.length,1);
});
test('the real company action applies the reward once and preserves its input snapshot',t=>{
 t.mock.method(Math,'random',()=>.99);const s=fixture();s.harem.streak=0;
 let result;for(let seed=1;seed<2000;seed++){
  const x=structuredClone(s);x.harem.portraitSeed=seed;const next=palaceAction(x,'company',{id:x.harem.members[0].id});
  if(next.state.harem.bonds.history[0]?.kind==='longevity'){result=next;break;}
 }
 assert.ok(result);assert.equal(result.state.stats.life,s.stats.life+3);assert.match(result.message,/寿元增加3/);
 assert.equal(s.harem.members[0].bond.visits,6);assert.equal(s.harem.bonds.lifeGranted,0);
 assert.doesNotThrow(()=>validateSave(JSON.parse(JSON.stringify(result.state))));
});
test('medical hidden trait supplies health care and extra longevity; no trait no medical event',()=>{
 const s=fixture('医理');s.stats.health=70;const n=trigger('care',s);
 assert.equal(n.stats.health,78);assert.equal(n.stats.life,s.stats.life+4);
 assert.equal(n.harem.bonds.history[0].kind,'care');
 const plain=fixture();for(let seed=1;seed<=40;seed++){const x=structuredClone(plain);x.harem.portraitSeed=seed;companyBond(x,x.harem.members[0]);assert.notEqual(x.harem.bonds.history[0]?.kind,'care');}
});
test('repeated company retains costs and cannot farm relationship or reward even after work',t=>{
 t.mock.method(Math,'random',()=>.99);
 const n=trigger('longevity'),id=n.harem.members[0].id,before=n.stats.life;
 let s=palaceAction(n,'company',{id}).state;
 assert.equal(s.stats.life,before-2);assert.equal(s.harem.members[0].bond.visits,n.harem.members[0].bond.visits);
 spendEnergy(s,true);s=palaceAction(s,'company',{id}).state;
 assert.equal(s.harem.bonds.history.length,1);assert.equal(s.harem.bonds.lifeGranted,3);
});
test('per-person and global cooldowns block events on subsequent turns',()=>{
 for(const scope of ['person','global']){
  const s=fixture();if(scope==='person')s.harem.members[0].bond.lastEventTurn=s.turn-17;else s.harem.bonds.lastEventTurn=s.turn-5;
  for(let seed=1;seed<=30;seed++){const n=structuredClone(s);n.harem.portraitSeed=seed;assert.equal(companyBond(n,n.harem.members[0]),'');assert.equal(n.harem.bonds.lastAttemptTurn,0);}
 }
});
test('deterministic event rolls survive reload; swapping people cannot reroll in the same turn',()=>{
 const s=fixture();companyBond(s,s.harem.members[0]);
 const p={...structuredClone(s.harem.members[0]),id:'second',bond:{visits:6,lastVisitTurn:39,lastEventTurn:0,lifeGranted:0}};s.harem.members.push(p);
 assert.equal(companyBond(s,p),'');assert.equal(s.harem.bonds.lastAttemptTurn,40);
 const snapshot=fixture();const a=palaceAction(snapshot,'company',{id:snapshot.harem.members[0].id});
 // Pregnancy randomness is held constant separately; hidden events use the saved seed.
 const copy=JSON.parse(JSON.stringify(snapshot));companyBond(copy,copy.harem.members[0]);
 const again=JSON.parse(JSON.stringify(snapshot));companyBond(again,again.harem.members[0]);
 assert.deepEqual(copy.harem.bonds,again.harem.bonds);assert.equal(snapshot.harem.members[0].bond.visits,6);assert.ok(a.state);
});
test('life rewards respect both grant caps and current life limit, without resurrection',()=>{
 const s=fixture();s.harem.members[0].bond.lifeGranted=11;s.harem.bonds.lifeGranted=71;
 const n=trigger('longevity',s);assert.equal(n.stats.life,s.stats.life+1);assert.equal(n.harem.bonds.lifeGranted,72);assert.equal(n.harem.members[0].bond.lifeGranted,12);
 const full=fixture();full.stats.life=full.stats.lifeLimit;assert.equal(companyBond(full,full.harem.members[0]),'');
 const near=fixture();near.stats.life=near.stats.lifeLimit-1;assert.equal(trigger('longevity',near).stats.life,near.stats.lifeLimit);
 for(const ended of ['zero','result','reason']){
  const dead=fixture('医理');if(ended==='zero')dead.stats.life=0;else if(ended==='result')dead.reignResult={};else dead.dynasty.endReason='禅让';
  const before=dead.stats.life;assert.equal(companyBond(dead,dead.harem.members[0]),'');assert.equal(dead.stats.life,before);
 }
});
test('global life cap holds across many partners and turns',()=>{
 const s=fixture();for(let i=0;i<16;i++)s.harem.members.push({...structuredClone(s.harem.members[0]),id:`partner-${i}`,bond:{visits:6,lastVisitTurn:39,lastEventTurn:0,lifeGranted:0}});
 const before=s.stats.life;
 for(let t=40;t<1000;t++){s.turn=t;s.harem.streak=1;const p=s.harem.members[t%s.harem.members.length];companyBond(s,p);}
 assert.equal(s.harem.bonds.lifeGranted,BOND_RULES.reignLifeCap);assert.equal(s.stats.life,before+BOND_RULES.reignLifeCap);
 assert.ok(s.harem.members.every(p=>p.bond.lifeGranted<=BOND_RULES.personLifeCap));
});
test('harmony reduces real court mood cost, expires, and ceases for absent or cold-palace partner',()=>{
 const s=trigger('harmony',fixture('琴学')),before=s.stats.happiness;spendEnergy(s,true);assert.equal(s.stats.happiness,before-2);
 const n=validateSave(JSON.parse(JSON.stringify(s)));assert.ok(activeHarmony(n));
 n.harem.members[0].inColdPalace=true;assert.equal(activeHarmony(n),false);n.harem.members[0].inColdPalace=false;
 n.turn=s.turn+6;assert.equal(activeHarmony(n),false);const mood=n.stats.happiness;spendEnergy(n,true);assert.equal(n.stats.happiness,mood-3);
 n.turn=s.turn;n.harem.members=[];assert.equal(activeHarmony(n),false);
});
test('advice relieves actual health and mood only when the ruler needs it',()=>{
 const s=fixture('诗赋');s.stats.health=60;s.stats.happiness=50;const n=trigger('advice',s);
 assert.equal(n.stats.health,64);assert.equal(n.stats.happiness,56);
});
test('education rewards the actual child through the existing teaching action and respects caps',()=>{
 const s=fixture('诗书');s.harem.children.push({id:'daughter',name:'明珠',age:8,gender:'女',motherId:s.harem.members[0].id,status:'palace'});
 let n;for(let seed=1;seed<2000;seed++){
  const x=structuredClone(s);x.harem.portraitSeed=seed;educateRoyal(x,'daughter');if(x.harem.bonds.history[0]?.kind==='education'){n=x;break;}
 }
 assert.ok(n);assert.equal(n.domestic.royalFamily.find(p=>p.id==='daughter').learning,8);assert.equal(n.dynasty.parenting,3);
 assert.throws(()=>educateRoyal(n,'daughter'),/本旬/);assert.doesNotThrow(()=>validateSave(JSON.parse(JSON.stringify(n))));
 const capped=structuredClone(s);capped.harem.portraitSeed=n.harem.portraitSeed;const c={id:'daughter',name:'明珠',motherId:s.harem.members[0].id,learning:99};educationBond(capped,c);assert.equal(c.learning,100);
 const commandState=structuredClone(s);commandState.harem.portraitSeed=n.harem.portraitSeed;
 const result=executeNational(commandState,{id:commandState.domestic.stateDevelopment.nextId,kind:'educate',personId:'daughter'});
 assert.equal(result.state.stats.treasury,commandState.stats.treasury-200);assert.match(result.message,/教子有方/);assert.equal(result.state.domestic.royalFamily.find(p=>p.id==='daughter').learning,8);
 assert.equal(commandState.harem.bonds.history.length,0);assert.doesNotThrow(()=>validateSave(result.state));
});
test('cold palace, new encounters and unqualified mothers cannot earn hidden events',()=>{
 const s=fixture('医理');s.harem.members[0].inColdPalace=true;assert.equal(companyBond(s,s.harem.members[0]),'');
 const stranger=structuredClone(s.harem.members[0]);stranger.inColdPalace=false;assert.equal(companyBond(s,stranger),'');
 s.harem.members[0].inColdPalace=false;s.harem.members[0].specialty='园艺';s.harem.members[0].hiddenTraits.kinds=['longevity'];assert.equal(educationBond(s,{motherId:s.harem.members[0].id,learning:0}), '');
});
test('loading invalid relationship, benefit, effect and history fields is rejected',()=>{
 const original=trigger('harmony',fixture('琴学'));
 for(const corrupt of [s=>s.harem.bonds.lifeGranted=73,s=>s.harem.bonds.lastAttemptTurn=s.turn+1,s=>s.harem.bonds.version=2,s=>s.harem.bonds.harmony.untilTurn++,s=>s.harem.bonds.history[0].kind='invented',s=>s.harem.members[0].bond.visits=-1,s=>s.harem.members[0].bond.lifeGranted=13]){
  const s=structuredClone(original);corrupt(s);assert.throws(()=>validateSave(s),/后宫/);
 }
});
test('succession resets hidden benefits, relationship history and caps for the new ruler',()=>{
 const s=trigger('longevity');const heir=s.domestic.royalFamily.find(p=>p.countryId===s.domestic.playerCountryId&&p.age>=16);assert.ok(heir);
 s.dynasty.heirId=heir.id;s.stats.life=0;settleReignResult(s);const n=succeedDynasty(s);
 const loaded=validateSave(JSON.parse(JSON.stringify(n)));assert.equal(loaded.harem.bonds.lifeGranted,0);assert.equal(loaded.harem.bonds.reignStartTurn,s.turn);assert.deepEqual(loaded.harem.bonds.history,[]);assert.equal(loaded.harem.bonds.harmony,null);
});
test('ordinary turn advancement preserves earned benefits and does not replay rewards',()=>{
 const s=trigger('longevity'),life=s.stats.life,count=s.harem.bonds.history.length;advance(s);
 assert.equal(s.stats.life,life-1);assert.equal(s.harem.bonds.history.length,count);assert.doesNotThrow(()=>validateSave(JSON.parse(JSON.stringify(s))));
});
