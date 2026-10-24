import {cardText} from './card-battle.mjs';
import {personPresentation} from './card-battle-person-presentations.mjs';
// Original performance lines, keyed by catalog identity. Never dispatch rules here.
export const PERSON_DEATH_LINES=Object.freeze({
 'cbdb-28093':'此简留后，接续军谋。',
 'original-57':'战斧虽歇，守阵勿退。',
 'original-59':'守备之令，托付诸军。',
 'original-62':'留此谏简，安顿伤疲。',
 'manual-1518':'老将退阵，坚壁仍存。'
});
export function personDeathSegments(after){
 const events=after.cards.events??[],history=after.cards.history?.entries.at(-1)?.events??[],segments=[];
 for(const [index,event] of events.entries()){
  if(event.type!=='death')continue;
  const card=after.cards.catalog[event.id],person=after.cardPeople?.[card?.personId],id=person?.historicalDefinitionId;
  if(!PERSON_DEATH_LINES[id]||card.silenced||!card.definition.death.length||!personPresentation(id))continue;
  const indices=[];
  for(let i=index+1;i<events.length;i++){
   const cause=history[i]?.cause;
   if([cause,...(cause?.parents??[])].some(c=>c?.kind==='death'&&c.source?.id===card.id))indices.push(i);
  }
  // Even a capped heal or full hand is a real trigger; never infer effects from the name.
  segments.push({id:card.id,personId:id,side:card.side,name:person.name,skill:card.definition.skill,profile:personPresentation(id),line:PERSON_DEATH_LINES[id],description:cardText({tags:[],enter:[],death:card.definition.death}),kind:card.definition.death.some(f=>f.op==='heal')?'heal':card.definition.death.some(f=>f.op==='draw')?'draw':'shield',deathIndex:index,indices});
 }
 return segments;
}

// Apply recorded public snapshots to a disposable visual copy only. No rules,
// RNG, soldier bookkeeping or effect arithmetic is replayed by this observer.
export function applyDeathVisualEvent(visual,record){
 const id=record?.subject?.id,stats=record?.after,c=visual.cards;
 if(!id||!stats)return;
 if(id.endsWith('-hero')){const p=c.players[id.slice(0,-5)];if(p){p.hero=stats.hp;p.armor=stats.armor;}return;}
 const x=c.catalog[id];if(!x||!['troop','general'].includes(x.type))return;
 for(const key of ['attack','hp','maxHp','tags','frozen','silenced','tempAttack'])if(stats[key]!==undefined)x[key]=structuredClone(stats[key]);
 x.buffHealth=x.maxHp-x.printedHp;x.buffAttack=x.attack-x.printedAttack-x.tempAttack;
 const p=c.players[x.side];
 if(stats.zone==='grave'){p.board=p.board.filter(v=>v!==id);if(!p.grave.includes(id))p.grave.push(id);}
 else if(stats.zone==='board'&&!p.board.includes(id))p.board.push(id);
}
