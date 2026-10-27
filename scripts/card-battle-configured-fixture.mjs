import {newGame,validateSave} from '../src/game.mjs';
import {beginWar,generals,borderingCountries} from '../src/war.mjs';
import {attachCards,validateCards} from '../src/card-battle.mjs';
import {tacticDefinitions,tacticCopyLimit} from '../src/card-battle-tactics.mjs';
// Construct through the real expedition allocator so weapon gear and commander
// sources are reserved by production rules, never inserted into a mock catalog.
export const CONFIGURATIONS=Object.freeze({
 weapons:{cardWeapons:{version:1,counts:{arsenal_blade:1,arsenal_spear:1}}},
 secrets:{cardSecrets:{version:1,counts:{secret_ambush:1,secret_watch:1}}},
 landmarks:{cardLandmarks:{version:1,counts:{field_camp:1,rally_post:1}}},
 combined:{cardWeapons:{version:1,counts:{arsenal_blade:1,arsenal_spear:1}},cardSecrets:{version:1,counts:{secret_ambush:1,secret_watch:1}},cardLandmarks:{version:1,counts:{field_camp:1,rally_post:1}}}
});
export function configuredBaseline(configuration='combined',rotation=0){
 if(!Object.hasOwn(CONFIGURATIONS,configuration))throw Error('Unknown configured fixture');
 const initial=newGame('最终配置验收'),g=generals(initial.domestic);
 const command={id:initial.domestic.war.nextId,kind:'war',kitVersion:1,battleMode:'cards',targetId:borderingCountries(initial.domestic)[0].id,generalId:g[0].id,commanderSquad:{kind:'cavalry',count:100},squads:[{kind:'infantry',count:200,generalId:g[1].id},{kind:'spears',count:100,generalId:g[2].id}],...structuredClone(CONFIGURATIONS[configuration])};
 const preview=beginWar(initial,command).domestic.war.battle;
 const slots=Object.values(preview.cards.catalog).filter(x=>x.side==='home'&&x.type==='tactic'&&x.definitionId!=='coin').length;
 const ids=Object.keys(tacticDefinitions).sort(),counts={},limit=tacticCopyLimit(slots);
 for(let i=0;i<slots;i++){const id=ids[(i+rotation)%ids.length];counts[id]=(counts[id]??0)+1;if(counts[id]>limit)throw Error('Fixture exceeds copy limit');}
 command.cardTactics={version:1,counts};
 const state=beginWar(initial,command);validateSave(state);
 return {configuration,rotation,initial,state,command,scope:'Real asymmetric expedition baseline; swapping first seat measures order bias, not equal-army or human deck strength.'};
}
export function configuredBattle(baseline,{first='home',seeds={home:17,enemy:19}}={}){
 const state=structuredClone(baseline.state),b=state.domestic.war.battle;
 attachCards(b,{first,seeds});validateCards(b);validateSave(state);return {state,b};
}
