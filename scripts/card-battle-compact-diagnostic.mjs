// Diagnostic fixtures only. Production sources and saved battles are never modified.
import {CARD_RULES,cardAI,actCardsMutable,validateCards,personSeed} from '../src/card-battle.mjs';
import {fixture,ROSTERS} from './card-battle-balance-fixture.mjs';
export function compactDiagnosticFixture(options,compactPenalty){
 const original=CARD_RULES.compactPenalty;
 try{CARD_RULES.compactPenalty=compactPenalty;return fixture(options);}
 finally{CARD_RULES.compactPenalty=original;}
}
const summary=xs=>{const mean=xs.reduce((a,b)=>a+b,0)/xs.length,variance=xs.reduce((s,x)=>s+(x-mean)**2,0)/Math.max(1,xs.length-1),error=1.96*Math.sqrt(variance/xs.length);return {mean,ci95:[mean-error,mean+error]};};
export function compareCompactPenalty({training,hero,pairs,domain}){
 const id=`mixed_600-${training}-${hero}`,baseline=[],removed=[],difference=[];let actions=0;
 for(let i=0;i<pairs;i++){
  const seed=personSeed(domain+':'+id+':'+i),seeds={home:personSeed(seed+':A'),enemy:personSeed(seed+':B')},profileSeed=personSeed(seed+':people'),scores=[];
  for(const compactPenalty of [true,false]){
   let score=0;
   for(const first of ['home','enemy']){
    const b=compactDiagnosticFixture({roster:ROSTERS.mixed_600,training,hero,profileSeed,seeds,first},compactPenalty);
    let steps=0;while(!b.result&&steps++<2500)actCardsMutable(b,cardAI(b));
    if(!b.result)throw Error('Unfinished battle '+id+':'+i);validateCards(b);actions+=steps;
    const home=b.result==='victory'?1:b.result==='defeat'?0:.5;score+=(first==='home'?home:1-home)/2;
   }
   scores.push(score);
  }
  baseline.push(scores[0]);removed.push(scores[1]);difference.push(scores[1]-scores[0]);
 }
 return {id,pairs,games:pairs*4,baseline:summary(baseline),withoutCompactPenalty:summary(removed),pairedChange:summary(difference),actions};
}
