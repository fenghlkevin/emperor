// Read-only audit of CURRENT guards; this does not implement hero replacement.
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {performance} from 'node:perf_hooks';
import {validateSave} from '../src/game.mjs';
import {createCardTutorial,tutorialGuide,advanceCardTutorial} from '../src/card-battle-tutorial.mjs';
const started=performance.now(),path=process.argv[2]??'docs/fixtures/card-landmarks-engine-base.json',bytes=readFileSync(path),base=JSON.parse(bytes);validateSave(base);
const b=base.domestic.war.battle,home=b.units.find(u=>u.side==='home'&&u.commander),candidate=b.units.find(u=>u.side==='home'&&!u.commander&&u.cardPersonId!==home.cardPersonId),checks=[];
function reject(label,state,mutate){const next=structuredClone(state);mutate(next.domestic.war.battle);let error;try{validateSave(next);}catch(e){error=e.message;}if(!error)throw Error('Unexpected acceptance: '+label);checks.push({label,rejected:true,error});}
reject('rewrite original commander person ID to another actually participating officer',base,b=>b.units.find(u=>u.id===home.id).cardPersonId=candidate.cardPersonId);
reject('flip commander flags to another participating physical unit',base,b=>{b.units.find(u=>u.id===home.id).commander=false;b.units.find(u=>u.id===candidate.id).commander=true;});
reject('retarget spare-weapon allocation to a different actual source',base,b=>b.command.weaponAllocation.home.sourceId=b.command.weaponAllocation.enemy.sourceId);
reject('rewrite an existing secret to a newly chosen officer identity',base,b=>Object.values(b.cards.catalog).find(x=>x.side==='home'&&x.type==='secret').secretSource.personId=candidate.cardPersonId);
reject('rewrite an existing landmark to a newly chosen officer identity',base,b=>Object.values(b.cards.catalog).find(x=>x.side==='home'&&x.type==='landmark').landmarkSource.personId=candidate.cardPersonId);
let course=createCardTutorial({lesson:'weapons'});for(let i=0;i<30&&(course.step!==5||course.game.domestic.war.battle.cards.turn!=='home');i++)course=advanceCardTutorial(course,tutorialGuide(course).action);
const wounded=course.game.domestic.war.battle,p=wounded.cards.players.home;if(!p.heroDamage||!wounded.units.find(u=>u.side==='home'&&u.commander).dead)throw Error('Need actual counterattack casualty');
reject('erase cumulative hero damage while keeping actual wounded escort',course.game,b=>b.cards.players.home.heroDamage=0);
console.log(JSON.stringify({date:new Date().toISOString(),purpose:'Current rule6 structural constraints and actual rule4 counterattack damage audit only; no proposed hero replacement implementation or acceptance.',command:'node scripts/audit-card-hero-replacement-compatibility.mjs '+path,fixture:path,fixtureSha256:createHash('sha256').update(bytes).digest('hex'),rulesVersion:b.cards.rulesVersion,originalCommander:{unitId:home.id,sourceId:home.sourceId,personId:home.cardPersonId},realCandidate:{unitId:candidate.id,sourceId:candidate.sourceId,personId:candidate.cardPersonId},actualCounterattack:{hero:p.hero,heroDamage:p.heroDamage,dead:wounded.units.find(u=>u.side==='home'&&u.commander).dead},checks,elapsedSeconds:(performance.now()-started)/1000},null,2));
