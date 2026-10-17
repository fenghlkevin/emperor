import {completeTravel,celebrateTravel} from './travel.mjs';
import {advance,leaveRoom} from './game.mjs';
import {settleProgress} from './imperial-progress.mjs';
import {settleReignResult} from './reign-result.mjs';

export function finishTravel(state){
 const result=completeTravel(state),s=result.state;
 if(s.stats.life>0){
  if(result.kind==='tour')while(s.turn<result.returnTurn&&s.stats.life>0&&!s.domestic.collapse?.pending)advance(s);
  else leaveRoom(s);
 }
 s.scene='palace';s.travel.history[0].completedTurn=s.turn;
 result.message+=celebrateTravel(s);
 result.message+=s.stats.life===0?'寿元已尽，本朝终结。':result.kind==='tour'?'已推进至下一月上旬，途中各旬事务照常结算。':'已推进一个行动阶段。';
 s.travel.history[0].message=result.message;
 settleProgress(s);settleReignResult(s);return result;
}
