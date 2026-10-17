import {executePersonnel} from './personnel-actions.mjs';
import {spendEnergy} from './emperor.mjs';
import {leaveRoom} from './game.mjs';

export function examReady(state){
 return state.scene==='palace'&&state.phase>=1&&state.phase<5&&state.stats.life>0&&state.stats.energy>0&&state.domestic.personnel.candidates.length>0;
}
export function finishExam(state,candidateIds){
 if(!examReady(state))throw Error('制举须在退朝后的工作阶段举行，且体力充足');
 const ids=Array.isArray(candidateIds)?candidateIds:[candidateIds];
 if(!ids.length)throw Error('请至少选择一名人才');
 if(new Set(ids).size!==ids.length||ids.some(id=>!state.domestic.personnel.candidates.some(o=>o.id===id)))throw Error('候选名单无效');
 let next=state;
 for(const candidateId of ids){
  next=executePersonnel(next,{kind:'hire',candidateId,id:next.domestic.personnel.nextId}).state;
 }
 next.domestic.personnel.candidates=[];
 spendEnergy(next);
 leaveRoom(next);
 return next;
}

export function cancelExam(state){
 if(!examReady(state))throw Error('当前无法结束制举');
 const next=structuredClone(state);
 next.domestic.personnel.candidates=[];
 next.domestic.personnel.examTurn=null;
 next.domestic.personnel.history.unshift(`第${next.turn}旬：本届制举未录用人才，已结束。`);
 next.domestic.personnel.history=next.domestic.personnel.history.slice(0,100);
 spendEnergy(next);
 leaveRoom(next);
 return next;
}
