import {attachCards,cardAI,actCardsMutable} from '../src/card-battle.mjs';
import {newGame} from '../src/game.mjs';
import {beginWar,generals,borderingCountries} from '../src/war.mjs';
// All five troop types come from the new game's actual soldiers and equipment.
// Commander's cavalry escort is separate from both cavalry troop squads.
export function createCardBattlePreview(){
 const state=newGame('军阵试玩');state.scene='court';const g=generals(state.domestic);
 const result=beginWar(state,{id:state.domestic.war.nextId,kitVersion:1,battleMode:'cards',kind:'war',targetId:borderingCountries(state.domestic)[0].id,generalId:g[0].id,commanderSquad:{kind:'cavalry',count:100},squads:[
  {kind:'spears',count:200,generalId:g[3].id},
  {kind:'archers',count:100,generalId:g[2].id},
  {kind:'heavy-cavalry',count:80,generalId:g[5].id},
  {kind:'cavalry',count:160,generalId:g[4].id},
  {kind:'infantry',count:300,generalId:g[1].id},
 ]});attachCards(result.domestic.war.battle,{first:'home'});return result;
}

// A real, legally played mid-game view for comparing the two card faces.
export function createCardBattleShowcase(attempt=0){
 const state=createCardBattlePreview();let b=state.domestic.war.battle,best=b,bestScore=-1;
 for(let i=0;i<380&&!b.result;i++){
  const c=b.cards,p=c.players.home,e=c.players.enemy;
  if(c.phase==='play'&&b.round>=3&&b.round<=9&&c.turn==='home'&&p.hand.length>=2&&p.board.length&&e.board.length&&p.mana>=2&&p.board.some(id=>c.catalog[id].ready&&!c.catalog[id].frozen)&&p.hand.some(id=>c.catalog[id].type!=='tactic'&&c.catalog[id].cost<=p.mana)){
   const same=p.hand.some(id=>p.board.some(bid=>c.catalog[id].definitionId===c.catalog[bid].definitionId));
   const score=(p.hand.length>=4?80:0)+(p.board.length+e.board.length)*2+p.board.filter(id=>c.catalog[id].type==='general').length*5+Math.min(5,p.hand.length)*4+p.hand.filter(id=>c.catalog[id].type!=='tactic').length*6+(same?40:0);
   if(score>bestScore){bestScore=score;best=structuredClone(b);}
  }
  actCardsMutable(b,cardAI(b));
 }
 if(bestScore<0){if(attempt<8)return createCardBattleShowcase(attempt+1);throw Error('未能取得可操作的中局示例');}
 state.domestic.war.battle=best;return state;
}
