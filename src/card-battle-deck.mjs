import {compactPersonText} from './card-battle-person-copy.mjs';
import {cardText,cardAttributeBreakdown} from './card-battle.mjs';
import {beginWar} from './war.mjs';
import {beginDefense} from './foreign-strategy.mjs';
import {TROOP_KITS} from './troop-kits.mjs';
// Preview runs the real battle constructor on a private copy, including fixed people.
// The caller commits nothing; opening/closing this page cannot reserve or spend resources.
export function previewCampaignDeck(state,command){return beginWar(structuredClone(state),{...structuredClone(command),battleMode:'cards'}).domestic.war.battle;}
export function previewDefenseDeck(state,plan){return beginDefense(structuredClone(state),{deployment:{...structuredClone(plan),battleMode:'cards'}}).domestic.war.battle;}
export function battleDeckView(b,{remaining=false,query='',type='',kind='',cost=''}={}){
 const c=b.cards,p=c.players.home;
 // Creation IDs precede reserve-generated cards. This reconstructs old battles too.
 const original=Object.values(c.catalog).filter(x=>x.side==='home'&&x.definitionId!=='coin').sort((a,b)=>Number(a.id.split('-').at(-1))-Number(b.id.split('-').at(-1))).slice(0,c.rulesSnapshot.deckSize??30);
 const cards=remaining?p.deck.map(id=>c.catalog[id]):original;
 const rows=cards.map(x=>{
  const supply=c.weaponSupplies?.[x.id],u=b.units.find(u=>u.id===(x.unitId??x.secretSource?.unitId??x.landmarkSource?.unitId)),person=x.personId?b.cardPeople?.[x.personId]:null;
  return {attributes:cardAttributeBreakdown(b,x),id:x.id,definitionId:x.definitionId,name:x.name,type:x.type,kind:x.kind??x.definition.kitKind??'',kindName:TROOP_KITS.find(k=>k.id===(x.kind??x.definition.kitKind))?.name??'',cost:x.cost,attack:x.printedAttack??(x.type==='weapon'?x.attack:null),durability:x.definition.durability??null,health:x.printedHp??null,text:cardText(x.definition),faceText:compactPersonText(x.definition),skill:x.definition.skill??'',personId:x.personId??null,personName:person?.name??u?.general?.name??'',portraitId:person?.portraitId??null,artCulture:u?.artCulture??null,artRegion:u?.artRegion??null,sourceId:x.landmarkSource?.sourceId??x.secretSource?.sourceId??supply?.sourceId??u?.sourceId??null,uses:x.definition.uses??null,sourceName:x.type==='landmark'?'主将军阵设施':x.type==='secret'?'主将军阵军令':x.type==='weapon'?'备用完整兵种套装':u?.name??'',count:x.count??0,training:x.training??null};
 }).sort((a,b)=>a.cost-b.cost||a.name.localeCompare(b.name,'zh-CN')||a.id.localeCompare(b.id,undefined,{numeric:true}));
 const types={troop:0,general:0,tactic:0,weapon:0,secret:0,landmark:0},curve={},kinds={};
 for(const x of rows){types[x.type]++;curve[x.cost]=(curve[x.cost]??0)+1;if(x.kind)kinds[x.kind]=(kinds[x.kind]??0)+1;}
 const q=query.trim().toLowerCase(),filtered=rows.filter(x=>(!type||x.type===type)&&(!kind||x.kind===kind)&&(cost===''||x.cost===Number(cost))&&(!q||[x.name,x.personName,x.personId,x.kindName,x.skill,x.text].some(v=>String(v??'').toLowerCase().includes(q))));
 // No catalog, enemy data, RNG state, or positions in the shuffled deck escape here.
 return {remaining,total:rows.length,types,curve,kinds,rows:filtered};
}
