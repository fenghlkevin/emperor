import assert from 'node:assert/strict';import fs from 'node:fs';
import{fixture,ROSTERS}from'./card-battle-balance-fixture.mjs';
import{cardAI,actCardsMutable,validateCards,personSeed}from'../src/card-battle.mjs';
const other=s=>s==='home'?'enemy':'home';
function normalize(b,swap=false){
 const side=s=>swap?other(s):s,c=b.cards,ids={},counts={};
 for(const x of Object.values(c.catalog)){const key=[side(x.side),x.unitId?.replace(/^(home|enemy)-/,''),x.definitionId].join('/');counts[key]=(counts[key]??0)+1;ids[x.id]=key+'/'+counts[key];}
 const token=id=>ids[id]??id,players={};
 for(const s of ['home','enemy']){const p=c.players[s];players[side(s)]={...Object.fromEntries(['hero','armor','mana','maxMana','fatigue','ownTurn','powerUsed','heroDamage','discount','rng'].map(k=>[k,p[k]])),skill:p.skill.kind,...Object.fromEntries(['hand','deck','board','grave'].map(k=>[k,p[k].map(token)])),reserve:Object.fromEntries(Object.entries(p.reserve).map(([id,n])=>[id.replace(/^(home|enemy)-/,''),n])),gaps:p.gaps.map(id=>id.replace(/^(home|enemy)-/,''))};}
 const cards=Object.values(c.catalog).map(x=>({id:token(x.id),...Object.fromEntries(['attack','hp','maxHp','ready','rushing','tags','buffAttack','buffHealth','tempAttack','lossPeak','played','frozen','silenced','attackedPly','enteredPly','count','training'].map(k=>[k,x[k]]))})).sort((a,b)=>a.id.localeCompare(b.id));
 return {state:{turn:side(c.turn),first:side(c.first),round:b.round,phase:c.phase,ply:c.ply,sequence:c.sequence,players,cards,result:b.result==='draw'?'draw':b.result?side(b.result==='victory'?'home':'enemy'):null},action:a=>({type:a.type,id:a.id?token(a.id):undefined,target:a.target?token(a.target):undefined})};
}
let steps=0;for(let i=0;i<120;i++){
 const roster=Object.values(ROSTERS)[i%8],hero=['martial','intelligence','command'][i%3],training=[20,60,90][Math.floor(i/8)%3],seeds={home:personSeed('identity:'+i+':a'),enemy:personSeed('identity:'+i+':b')},a=fixture({roster,hero,training,first:'home',seeds,profileSeed:i}),b=fixture({roster,hero,training,first:'enemy',seeds:{home:seeds.enemy,enemy:seeds.home},profileSeed:i});
 actCardsMutable(a,cardAI(a));actCardsMutable(b,cardAI(b));let n=0;
 while(true){const x=normalize(a),y=normalize(b,true);assert.deepEqual(x.state,y.state,'identity swap state '+i+'/'+n);if(a.result)break;const aa=cardAI(a),bb=cardAI(b);assert.deepEqual(x.action(aa),y.action(bb),'identity swap action '+i+'/'+n);actCardsMutable(a,aa);actCardsMutable(b,bb);if(++n>2500)throw Error('stalled');steps++;}
 validateCards(a);validateCards(b);
}
const out={date:'2026-10-22',seedDomain:'identity-replay-v5',pairedReplays:120,games:240,mirroredActionSteps:steps,checks:['Identical card profiles and troops, exchanged player labels and independent A/B streams','Every public game state and AI action mirrors exactly after both mulligans','Hero, armor, mana, all zones, reserve, real losses, fatigue, buffs and outcome match','Both final saves pass production card-state validation'],passed:true};
const path=process.argv.find(x=>x.startsWith('--out='))?.slice(6);if(path)fs.writeFileSync(path,JSON.stringify(out,null,2)+'\n');console.log(JSON.stringify(out));
