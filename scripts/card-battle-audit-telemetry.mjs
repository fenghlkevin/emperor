// Optional observer for production-engine audits. It never selects or mutates actions.
import {cardCost} from '../src/card-battle.mjs';
const opposite=side=>side==='home'?'enemy':'home';
const boardState=(c,p)=>({units:p.board.length,attack:p.board.reduce((n,id)=>n+c.catalog[id].attack,0),health:p.board.reduce((n,id)=>n+Math.max(0,c.catalog[id].hp),0)});
export function createAuditTelemetry({turnLimit=6,traceLimit=2}={}){
 const turns={},traces=[];let game;
 const rowFor=(position,ownTurn)=>turns[position+':'+ownTurn]??={position,ownTurn,reached:0,completed:0,deployments:0,tactics:0,coinUses:0,powers:0,attacks:0,manaSpent:0,manaUnused:0,boardUnits:0,boardAttack:0,boardHealth:0,heroLife:0,armor:0,plays:{}};
 function startGame(b){game={first:b.cards.first,seen:new Set(),trace:[]};}
 function beforeAction(b,action){
  if(!game)throw Error('Audit telemetry requires startGame');
  const c=b.cards,side=c.turn,p=c.players[side],x=c.catalog[action.id];
  if(c.phase!=='play')return null;
  return {side,position:side===game.first?'first':'second',ownTurn:p.ownTurn,ply:c.ply,action:action.type,id:action.id,targetId:action.target,definitionId:x?.definitionId,type:x?.type,cost:action.type==='play'?cardCost(b,action.id):action.type==='power'?2:0,name:x?.name??(action.type==='power'?p.skill.name:action.type),target:action.target==='hero'?(action.type==='power'&&p.skill.kind==='command'?side:opposite(side))+'-hero':c.catalog[action.target]?.name??null};
 }
 function afterAction(b,pre){
  if(!pre||pre.ownTurn>turnLimit)return;
  const c=b.cards,p=c.players[pre.side],row=rowFor(pre.position,pre.ownTurn),key=pre.position+':'+pre.ownTurn;
  if(!game.seen.has(key)){game.seen.add(key);row.reached++;}
  row.manaSpent+=pre.cost;
  if(pre.action==='play'){
   row.plays[pre.definitionId]=(row.plays[pre.definitionId]??0)+1;
   if(pre.definitionId==='coin')row.coinUses++;else if(pre.type==='tactic')row.tactics++;else row.deployments++;
  }else if(pre.action==='power')row.powers++;else if(pre.action==='attack')row.attacks++;
  // A terminal partial turn is kept out of end-of-turn means. Record the actor,
  // not cards.turn, because end has already handed initiative to the opponent.
  if(pre.action==='end'){
   const board=boardState(c,p);row.completed++;row.manaUnused+=p.mana;row.boardUnits+=board.units;row.boardAttack+=board.attack;row.boardHealth+=board.health;row.heroLife+=p.hero;row.armor+=p.armor;
  }
  if(pre.ownTurn<=4&&traces.length<traceLimit)game.trace.push({...pre,manaAfter:p.mana,board:boardState(c,p),heroLife:p.hero,enemyHeroLife:c.players[opposite(pre.side)].hero});
 }
 function finishGame(b,meta={}){
  if(!b.result)throw Error('Cannot finish telemetry for an unfinished battle');
  const home=b.result==='victory'?1:b.result==='defeat'?0:.5,firstScore=game.first==='home'?home:1-home;
  if(firstScore===0&&traces.length<traceLimit)traces.push({...meta,first:game.first,result:b.result,round:b.round,firstScore,opening:game.trace});
  game=null;
 }
 function result(){return {turnLimit,notes:'Counts aggregate by initiative position and own turn. End-state totals include completed turns only; divide by completed. Action totals include terminal partial turns; divide by reached. Traces are reproducible examples of first-player losses, not causal estimates.',turns:Object.values(turns).sort((a,b)=>a.ownTurn-b.ownTurn||a.position.localeCompare(b.position)),traces};}
 return {startGame,beforeAction,afterAction,finishGame,result};
}
