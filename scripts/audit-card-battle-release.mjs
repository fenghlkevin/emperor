import {Worker,isMainThread,parentPort,workerData} from 'node:worker_threads';
import fs from 'node:fs';import crypto from 'node:crypto';
import {configuredBaseline,configuredBattle,CONFIGURATIONS} from './card-battle-configured-fixture.mjs';
import {CARD_CATALOG} from '../src/card-battle-data.mjs';
import {createAuditTelemetry} from './card-battle-audit-telemetry.mjs';
import {fixture,ROSTERS} from '../scripts/card-battle-balance-fixture.mjs';
import {CARD_RULES,CARD_DEFINITIONS,HISTORICAL_CARDS,cardAI,actCardsMutable,validateCards,personSeed} from '../src/card-battle.mjs';
const styles=['martial','intelligence','command'];
const args=Object.fromEntries(process.argv.slice(2).map(x=>x.replace(/^--/,'').split('=')));
const count=+(args.pairs??1000),domain=workerData?.domain??args.domain??'release-heldout-20261022-A';
const summarize=(values)=>{const n=values.length,mean=values.reduce((a,b)=>a+b,0)/n,sd=Math.sqrt(values.reduce((a,b)=>a+(b-mean)**2,0)/Math.max(1,n-1)),err=1.96*sd/Math.sqrt(n);return {mean,ci95:[Math.max(0,mean-err),Math.min(1,mean+err)]};};
function run(job){
 const configured=job.configuration?configuredBaseline(job.configuration,job.rotation):null;
 const firstScores=[],homeScores=[],rounds=[],deployed=new Set();let draws=0,actions=0,states=0;const telemetry=job.telemetry?createAuditTelemetry():null;
 for(let i=0;i<job.pairs;i++){
  const seed=personSeed(domain+':'+job.id+':'+i),seeds={home:personSeed(seed+':A'),enemy:personSeed(seed+':B')},profileSeed=personSeed(seed+':people');let pairFirst=0,pairHome=0;
  for(const first of ['home','enemy']){
   const opts={...job.opts,roster:ROSTERS[job.roster],roster2:ROSTERS[job.roster2??job.roster],hero:job.hero,training:job.training??60,profileSeed,seeds,first};
   if(job.person!=null)opts.people=[HISTORICAL_CARDS[job.person]];
   const b=configured?configuredBattle(configured,{first,seeds}).b:fixture(opts),c=b.cards;
   if(job.ablate){const chosen=Object.values(c.catalog).find(x=>x.side==='enemy'&&x.historicalDefinitionId===HISTORICAL_CARDS[job.person].person_id);const d=structuredClone(chosen.definition);d.tags=[];d.enter=[];d.death=[];c.personCatalog[chosen.personId]=d;chosen.definition=d;chosen.tags=[];c.definitionHash=personSeed(JSON.stringify([c.rulesSnapshot,c.definitionCatalog,c.personCatalog]));}
   for(const side of ['home','enemy']){const p=c.players[side];if(p.hand.length!==(side===first?3:5)||p.hand.length+p.deck.length!==(side===first?30:31)||!p.hand.some(id=>c.catalog[id].front&&c.catalog[id].cost===1))throw Error('opening invariant '+job.id);}
   telemetry?.startGame(b);let steps=0;while(!b.result&&steps++<2500){const a=cardAI(b,{policy:job.policy??'balanced'}),pre=telemetry?.beforeAction(b,a);actCardsMutable(b,a);telemetry?.afterAction(b,pre);if(a.type==='play'&&c.catalog[a.id].historicalDefinitionId)deployed.add(c.catalog[a.id].historicalDefinitionId);}
   if(!b.result)throw Error('stalled '+job.id);telemetry?.finishGame(b,{pair:i,seed,profileSeed,seeds});if(i%50===0){validateCards(b);states++;}
   const home=b.result==='victory'?1:b.result==='defeat'?0:.5;pairHome+=home/2;pairFirst+=(first==='home'?home:1-home)/2;draws+=b.result==='draw';actions+=steps;rounds.push(b.round);
  }
  firstScores.push(pairFirst);homeScores.push(pairHome);
 }
 rounds.sort((a,b)=>a-b);return {...job,...(configured?{configuredBaseline:configured.state,configuredCommand:configured.command}:{}),seedDomain:domain,games:job.pairs*2,first:summarize(firstScores),home:summarize(homeScores),draws,rounds:{median:rounds[Math.floor(rounds.length*.5)],p90:rounds[Math.floor(rounds.length*.9)],max:rounds.at(-1)},actions,validatedFinalStates:states,deployed:[...deployed],...(telemetry?{telemetry:telemetry.result()}:{})};
}
if(!isMainThread){parentPort.on('message',job=>{try{parentPort.postMessage({ok:true,result:run(job)});}catch(e){parentPort.postMessage({ok:false,error:e.stack,job});}});}else{
 let jobs=[],section=args.section??'matrix';
 if(section==='final-person'){const person=HISTORICAL_CARDS.findIndex(p=>p.person_id==='manual-1509');jobs.push({id:'manual-1509-final-mirror',roster:'mixed_1800',hero:'intelligence',person,pairs:count});}
 if(section==='configured')for(const configuration of Object.keys(CONFIGURATIONS))for(const rotation of [0,5])jobs.push({id:`configured-${configuration}-${rotation}`,configuration,rotation,pairs:count});
 if(section==='matrix')for(const roster of Object.keys(ROSTERS))for(const training of [20,60,90])for(const hero of styles)jobs.push({id:`${roster}-${training}-${hero}`,roster,training,hero,pairs:count});
 if(section==='policies')for(const roster of ['mixed_1800','cavalry_1800','ranged_1800','exotic_1800','reserve_3600'])for(const policy of ['aggressive','control'])for(const hero of styles)jobs.push({id:`${roster}-${policy}-${hero}`,roster,hero,policy,pairs:count});
 if(section==='people')for(let person=0;person<HISTORICAL_CARDS.length;person++)for(const ablate of [false,true])jobs.push({id:`${HISTORICAL_CARDS[person].person_id}-${ablate?'skill-ablation':'mirror'}`,roster:'mixed_1800',hero:styles[person%3],person,ablate,pairs:count});
 if(section==='advantages'){for(const roster of ['mixed_1800','cavalry_1800','heavy_1800'])for(const hero of styles)jobs.push({id:`training-${roster}-${hero}`,roster,hero,training:90,opts:{training2:60},pairs:count});for(const roster of ['mixed_600','reserve_3600'])for(const hero of styles)jobs.push({id:`army-${roster}-${hero}`,roster,roster2:'mixed_1800',hero,pairs:count});}
 if(args.cases){
  const selected=args.cases.split(',').filter(Boolean),known=new Set(jobs.map(job=>job.id));
  if(!selected.length||selected.some(id=>!known.has(id)))throw Error('Unknown audit case: '+args.cases);
  jobs=jobs.filter(job=>selected.includes(job.id));
 }
 if(!jobs.length)throw Error('Unknown section');
 if(args.telemetry==='true')jobs=jobs.map(job=>({...job,telemetry:true}));
 const sourceFiles=['src/card-battle.mjs','src/card-battle-data.mjs','src/card-battle-weapons.mjs','src/card-battle-secrets.mjs','src/card-battle-landmarks.mjs','scripts/card-battle-balance-fixture.mjs','scripts/card-battle-configured-fixture.mjs','scripts/card-battle-audit-telemetry.mjs','scripts/audit-card-battle-release.mjs'],sources=Object.fromEntries(sourceFiles.map(p=>[p,crypto.createHash('sha256').update(fs.readFileSync(new URL('../'+p,import.meta.url))).digest('hex')]));
 const rows=[],workers=[],start=Date.now(),pool=Math.min(+(args.workers??3),jobs.length);let next=0;
 await new Promise((resolve,reject)=>{for(let i=0;i<pool;i++){const w=new Worker(new URL(import.meta.url),{workerData:{domain}});workers.push(w);w.on('error',reject);w.on('message',m=>{if(!m.ok)return reject(Error(m.error));if(m.result.seedDomain!==domain)return reject(Error('worker seed domain mismatch'));rows.push(m.result);if(args.out)fs.writeFileSync(args.out+'.checkpoint.json',JSON.stringify({status:'running',version:CARD_CATALOG.version,domain,section,completed:rows.length,total:jobs.length,pairsPerCase:count,rows},null,2)+'\n');console.log(`${rows.length}/${jobs.length} ${m.result.id} first=${(100*m.result.first.mean).toFixed(2)}% home=${(100*m.result.home.mean).toFixed(2)}% round=${m.result.rounds.median}`);if(next<jobs.length)w.postMessage(jobs[next++]);else if(rows.length===jobs.length)resolve();});w.postMessage(jobs[next++]);}});
 await Promise.all(workers.map(w=>w.terminate()));rows.sort((a,b)=>a.id.localeCompare(b.id));const results={version:CARD_CATALOG.version,date:new Date().toISOString(),section,domain,pairsPerCase:count,sources,rules:CARD_RULES,method:'Production cardAI + actCardsMutable; paired fixed A/B random streams, swapped first player. Each independent pair also varies equal ability-gated fixed person profiles. CI is paired normal 95%; draws score 0.5. Controller is heuristic, not a human or optimal policy.',acceptance:{target:[0.47,0.53],passed:rows.every(r=>r.first.mean>=0.47&&r.first.mean<=0.53),failedCases:rows.filter(r=>r.first.mean<0.47||r.first.mean>0.53).map(r=>r.id),note:'Point-estimate gate only; inspect per-case confidence intervals. Base matrix does not establish configured decks/weapons/secrets/landmarks coverage.'},games:rows.reduce((n,r)=>n+r.games,0),elapsedSeconds:(Date.now()-start)/1000,rows};
 if(args.out)fs.writeFileSync(args.out,JSON.stringify(results,null,2)+'\n');console.log(JSON.stringify({section,games:results.games,range:[Math.min(...rows.map(r=>r.first.mean)),Math.max(...rows.map(r=>r.first.mean))],mean:rows.reduce((n,r)=>n+r.first.mean,0)/rows.length,elapsedSeconds:results.elapsedSeconds}));
}
