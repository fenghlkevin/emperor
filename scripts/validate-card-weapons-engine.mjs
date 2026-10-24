import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {performance} from 'node:perf_hooks';
import {validateSave} from '../src/game.mjs';
import {attachCards,cardAI,legalCardActions,actCardsMutable,validateCards} from '../src/card-battle.mjs';
import {finishWar} from '../src/war.mjs';
import {worldKitDepot} from '../src/troop-kit-world.mjs';
import {weaponLossForSource} from '../src/card-battle-weapons.mjs';
const path=process.argv[2];if(!path)throw Error('Usage: node scripts/validate-card-weapons-engine.mjs docs/fixtures/card-weapons-engine-base.json');
const bytes=readFileSync(path),initial=validateSave(JSON.parse(bytes)),start=performance.now(),cases=[];
if(initial.domestic.war.battle?.cards.rulesVersion!==4||initial.domestic.war.battle.result)throw Error('Need a fresh isolated weapon battle fixture');
for(const seed of [917711,930337,104729,1299709])for(const first of ['home','enemy']){
 const s=structuredClone(initial),b=s.domestic.war.battle;attachCards(b,{first,seed,seeds:{home:seed^0x175,enemy:seed^0x9b71}});const before=Object.fromEntries([...new Set(b.units.map(u=>u.sourceId))].map(id=>[id,structuredClone(worldKitDepot(s.domestic,id))]));
 let actions=0,weaponPlays=0,heroAttacks=0;
 while(!b.result&&actions<1200){const a=cardAI(b);if(!legalCardActions(b).some(x=>JSON.stringify(x)===JSON.stringify(a)))throw Error('AI produced illegal action');if(a.type==='hero-attack')heroAttacks++;if(a.type==='play'&&b.cards.catalog[a.id]?.type==='weapon')weaponPlays++;actCardsMutable(b,a);validateCards(b);actions++;}
 if(!b.result)throw Error('Battle did not finish');const result=finishWar(s);validateSave(result.state);
 for(const [sourceId,old]of Object.entries(before)){const next=worldKitDepot(result.state.domestic,sourceId),units=b.units.filter(u=>u.sourceId===sourceId),extra=weaponLossForSource(b,sourceId);if(old.soldiers-next.soldiers!==units.reduce((n,u)=>n+u.dead,0))throw Error('Manpower mismatch');for(const kind of Object.keys(old.stock)){const dead=units.filter(u=>u.kind===kind&&u.equipped!==false).reduce((n,u)=>n+u.dead,0);if(old.stock[kind]-next.stock[kind]!==dead+(extra[kind]??0))throw Error('Actual kit loss mismatch');}}
 cases.push({seed,first,result:b.result,actions,weaponPlays,heroAttacks,homeDead:result.receipt.report.home.dead,kitLoss:result.receipt.report.kitLoss});
}
process.stdout.write(JSON.stringify({date:new Date().toISOString(),purpose:'Functional smoke only; asymmetric campaign fixture, not a 47–53% balance matrix or real desktop play evidence.',fixtureSha256:createHash('sha256').update(bytes).digest('hex'),rulesVersion:4,weaponCatalogVersion:1,weaponAiVersion:1,elapsedSeconds:(performance.now()-start)/1000,cases},null,2)+'\n');
