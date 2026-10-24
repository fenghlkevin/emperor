import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {performance} from 'node:perf_hooks';
import {validateSave} from '../src/game.mjs';
import {attachCards,cardAI,legalCardActions,actCardsMutable,validateCards} from '../src/card-battle.mjs';
import {finishDefense} from '../src/foreign-strategy.mjs';
import {worldKitDepot} from '../src/troop-kit-world.mjs';
import {weaponLossForSource} from '../src/card-battle-weapons.mjs';
const path=process.argv[2];if(!path)throw Error('Usage: node scripts/validate-card-defense-landmarks.mjs docs/fixtures/card-defense-landmarks-bases.json');
const bytes=readFileSync(path),bases=JSON.parse(bytes),start=performance.now(),cases=[];
if(Object.keys(bases).sort().join(',')!=='central,hebei,tubo-core')throw Error('Need three actual commander-source fixtures');
for(const source of ['central','hebei','tubo-core']){const initial=validateSave(bases[source]);if(initial.domestic.war.battle?.cards.rulesVersion!==6||initial.domestic.war.battle.command.landmarkAllocation.home.sourceId!==source||initial.domestic.war.battle.result)throw Error('Need fresh sourced landmark defenses');
for(const seed of [324161,6700417])for(const first of ['home','enemy']){
 const s=structuredClone(initial),b=s.domestic.war.battle;attachCards(b,{first,seed,seeds:{home:seed^0x175,enemy:seed^0x9b71}});const before=Object.fromEntries([...new Set(b.units.map(u=>u.sourceId))].map(id=>[id,structuredClone(worldKitDepot(s.domestic,id))]));
 let actions=0,weaponPlays=0,heroAttacks=0,landmarkPlays=0,landmarkUses=0;
 while(!b.result&&actions<1200){const a=cardAI(b);if(!legalCardActions(b).some(x=>JSON.stringify(x)===JSON.stringify(a)))throw Error('AI produced illegal action');if(a.type==='hero-attack')heroAttacks++;if(a.type==='play'&&b.cards.catalog[a.id]?.type==='weapon')weaponPlays++;actCardsMutable(b,a);validateCards(b);landmarkPlays+=b.cards.events.filter(e=>e.type==='landmark-deploy').length;landmarkUses+=b.cards.events.filter(e=>e.type==='landmark-use').length;actions++;}
 if(!b.result)throw Error('Battle did not finish');const result=finishDefense(s);validateSave(result.state);
 for(const [sourceId,old]of Object.entries(before)){const next=worldKitDepot(result.state.domestic,sourceId),units=b.units.filter(u=>u.sourceId===sourceId),extra=weaponLossForSource(b,sourceId);if(old.soldiers-next.soldiers!==units.reduce((n,u)=>n+u.dead,0))throw Error('Manpower mismatch');for(const kind of Object.keys(old.stock)){const dead=units.filter(u=>u.kind===kind&&u.equipped!==false).reduce((n,u)=>n+u.dead,0);if(old.stock[kind]-next.stock[kind]!==dead+(extra[kind]??0))throw Error('Actual kit loss mismatch');}}
 cases.push({source,seed,first,result:b.result,actions,weaponPlays,heroAttacks,landmarkPlays,landmarkUses,homeDead:b.units.filter(u=>u.side==='home').reduce((n,u)=>n+u.dead,0),kitLoss:result.receipt.defenseDetails.kitLoss});
}
}
process.stdout.write(JSON.stringify({date:new Date().toISOString(),purpose:'Functional smoke only; asymmetric multi-source defense landmark fixtures, not a 47–53% balance matrix or real desktop play evidence.',fixtureSha256:createHash('sha256').update(bytes).digest('hex'),rulesVersion:6,landmarkCatalogVersion:1,landmarkAiVersion:1,weaponCatalogVersion:1,weaponAiVersion:1,elapsedSeconds:(performance.now()-start)/1000,cases},null,2)+'\n');
