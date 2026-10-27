import {writeFileSync} from 'node:fs';
import {createPlayableGame,validateSave,sleepUntilNextTurn} from '../src/game.mjs';
import {countrySummary} from '../src/domestic.mjs';
import {nationalFoodForecast} from '../src/national-resources.mjs';
import {executePersonnel} from '../src/personnel-actions.mjs';
import {executeIndustry,quoteIndustry} from '../src/industry.mjs';
import {startConstruction} from '../src/construction.mjs';
import {autoDefense} from '../src/foreign-strategy.mjs';
import {defaultKitDefensePlan} from '../src/kit-defense.mjs';
import {spendEnergy} from '../src/emperor.mjs';
import {cityLand} from '../src/city-capacity.mjs';
import {industryLandAvailable} from '../src/terrain-economy.mjs';
const long=process.argv.includes('--long'),seedArg=process.argv.find(a=>a.startsWith('--seed=')),seeds=seedArg?[+seedArg.split('=')[1]]:[1,7,41];
const report={date:'2026-10-26',mode:long?'360-turn':'108-turn',method:'Production candidate engine, foreign economy/disasters/war active. Rest each turn. Default policy leaves delegation enabled. Leisure policy builds/develops every 18 turns and holds an exam every 36. Actions spend court energy; no free wins, treasury injections or disabled strategy. Real defense AI used for threats. Paired seed with separate exam/disaster domains; remaining ambient randomness seeded per run.',runs:[],errors:[]};
const home=s=>s.domestic.countries.find(c=>c.id===s.domestic.playerCountryId);
function stats(s){const q=countrySummary(s.domestic,undefined,s.turn),f=nationalFoodForecast(s.domestic,s.turn+1);return {turn:s.turn,cash:home(s).fiscal.treasury,debt:home(s).fiscal.debt,net:q.net,grain:home(s).fiscal.grain,foodNeed:f.need,foodShortfall:f.shortfall,living:q.livingStandard,stability:q.welfare.stability,provinces:q.provinces.length,life:s.stats.life,central:s.domestic.centralArmy.soldiers};}
const out=new URL(`../docs/design/difficulty-runtime-${long?'360':'108'}-${seeds.join('-')}.json`,import.meta.url),save=()=>writeFileSync(out,JSON.stringify(report,null,2)+'\n');
for(const tier of ['novice','standard','veteran'])for(const seed of seeds)for(const policy of ['default','leisure']){
 const oldRandom=Math.random;let n=seed;Math.random=()=>((n=Math.imul(n,1664525)+1013904223>>>0)/4294967296);
 let s=createPlayableGame('推演','大晟',{difficulty:tier,seed});const row={tier,seed,policy,opening:stats(s),samples:[],orders:[],blocked:[],firstDebt:null,firstFoodShortfall:null,defenses:[],ended:null};report.runs.push(row);
 try{for(let step=1;step<=(long?360:108);step++){
  if(s.domestic.strategy.pending?.defender===s.domestic.playerCountryId){const before=s.domestic.centralArmy.soldiers;const r=autoDefense(s,defaultKitDefensePlan(s,Math.floor(before*.5)));s=r.state;row.defenses.push({turn:s.turn,before,after:s.domestic.centralArmy.soldiers,title:r.receipt.title});}
  if(s.domestic.collapse.pending||s.domestic.collapse.ended||s.stats.life<=0){row.ended={turn:s.turn,reason:s.domestic.collapse.pending?'capital crisis':'reign ended'};break;}
  const order=(kind,fn)=>{try{const result=fn();s=result.state;spendEnergy(s,true);row.orders.push({turn:s.turn,kind,cash:home(s).fiscal.treasury});}catch(e){row.blocked.push({turn:s.turn,kind,error:e.message});}};
  if(policy==='leisure'&&home(s).fiscal.treasury>15000){
   if(step%36===1){if(s.domestic.personnel.candidates.length)order('hire',()=>executePersonnel(s,{id:s.domestic.personnel.nextId,kind:'hire',candidateId:s.domestic.personnel.candidates[0].id}));if(s.domestic.personnel.candidates.length)order('clear',()=>executePersonnel(s,{id:s.domestic.personnel.nextId,kind:'clear'}));order('exam',()=>executePersonnel(s,{id:s.domestic.personnel.nextId,kind:'exam'}));}
   if(step%18===0){const ps=s.domestic.provinces.filter(p=>p.countryId===s.domestic.playerCountryId&&!p.disaster);const p=ps.find(p=>!p.development.project&&cityLand(p).available>=500&&industryLandAvailable(p,'commerce')>=500);if(p)order('develop',()=>executeIndustry(s,{id:s.domestic.industryActions.nextId,kind:'develop',provinceId:p.id,industry:'commerce',area:500}));const b=ps.find(p=>!p.construction.project);if(b)order('build',()=>startConstruction(s,b.id,step%36===0?'granaries':'markets'));}
  }
  s=sleepUntilNextTurn(s);const z=stats(s);if(z.debt&&!row.firstDebt)row.firstDebt=s.turn;if(z.foodShortfall&&!row.firstFoodShortfall)row.firstFoodShortfall=s.turn;
  if(step%36===0){s=validateSave(JSON.parse(JSON.stringify(s)));row.samples.push(z);save();console.log(JSON.stringify({tier,seed,policy,...z}));}
 }
 row.final=stats(s);validateSave(s);
 if(tier==='novice'&&(row.firstDebt||row.firstFoodShortfall||row.ended))throw Error('Leisure acceptance failed: debt, food shortfall or forced ending');
 }catch(e){row.error=e.stack;report.errors.push({tier,seed,policy,error:e.message});}finally{Math.random=oldRandom;save();}
}
console.log(JSON.stringify({output:out.pathname,errors:report.errors}));if(report.errors.length)process.exitCode=1;
