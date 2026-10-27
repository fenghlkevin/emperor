import {createCardBattlePreview} from './card-battle-preview-state.mjs';
import {attachCards,actCardsMutable} from '../src/card-battle.mjs';
import {validateSave} from '../src/game.mjs';

// Explicit isolated practice fixture using real armies and card definitions.
// All visible enhancements/negative states are applied by formal spell actions.
export function createCardBattleEffectsPreview(){
 const state=createCardBattlePreview(),b=state.domestic.war.battle;
 b.command.cardTactics={version:1,counts:{fortify:2,assault:2,brace:2,pin:2,dispel:2,precision:2}};
 attachCards(b,{first:'home'});const c=b.cards;
 // Equip the practice opponent with one existing freeze order if its normal
 // commander package lacks it; preserve card count, IDs and all real army sources.
 if(!Object.values(c.catalog).some(x=>x.side==='enemy'&&x.definitionId==='pin')){
  const x=Object.values(c.catalog).find(x=>x.side==='enemy'&&x.type==='tactic'&&x.definitionId!=='coin'),d=c.definitionCatalog.pin;
  Object.assign(x,{definitionId:d.id,name:d.name,cost:d.cost,definition:structuredClone(d)});
 }
 actCardsMutable(b,{type:'mulligan',ids:[]});c.ply=19;b.round=10;b.targetName='特效演示';
 for(const side of ['home','enemy']){
  const p=c.players[side],pool=[...p.hand,...p.deck],people=pool.filter(id=>c.catalog[id].type==='general'),troops=pool.filter(id=>c.catalog[id].type==='troop');
  p.board=[people[0],...troops.slice(0,2)];if(p.board.some(id=>!id))throw Error('演示缺少正式军阵卡');
  p.hand=p.hand.filter(id=>!p.board.includes(id));p.deck=p.deck.filter(id=>!p.board.includes(id));p.mana=p.maxMana=10;p.ownTurn=10;
  for(const id of p.board)Object.assign(c.catalog[id],{ready:true,rushing:false,enteredPly:1,played:++c.sequence});
 }
 const cast=(side,definitionId,target)=>{
  if(c.turn!==side)throw Error('演示施法回合无效');const p=c.players[side],id=[...p.hand,...p.deck].find(id=>c.catalog[id].definitionId===definitionId);
  if(!id)throw Error('演示缺少技能牌 '+definitionId);p.hand=p.hand.filter(v=>v!==id);p.deck=p.deck.filter(v=>v!==id);p.hand.push(id);actCardsMutable(b,{type:'play',id,target});
 };
 const h=c.players.home.board,e=c.players.enemy.board;
 cast('home','fortify',h[0]);cast('home','brace',h[1]);actCardsMutable(b,{type:'end'});
 cast('enemy','pin',h[0]);actCardsMutable(b,{type:'end'});
 cast('home','assault',h[0]);cast('home','dispel',e[0]);cast('home','pin',e[0]);
 const p=c.players.home,pool=[...p.hand,...p.deck],ids=['fortify','assault','brace','pin','dispel'].map(def=>pool.find(id=>c.catalog[id].definitionId===def));
 if(ids.some(id=>!id))throw Error('演示缺少待施放技能牌');p.hand=ids;p.deck=pool.filter(id=>!ids.includes(id));p.mana=p.maxMana=10;
 b.log.push('特效演示：己方左一有增益＋冻结，敌方左一有沉默＋冻结；手牌可继续叠加。演示对手只交令。');
 validateSave(state);return state;
}
