import {executeKitCommand} from './troop-kit-world.mjs';
export function planCentralTransfers(state,{id,direction,rows}){
 if(id!==state.domestic.troopKits.nextId)throw Error('军务已更新，请重新核定');
 if(!['out','in'].includes(direction)||!Array.isArray(rows)||!rows.length)throw Error('请选择调拨方向及地方');
 if(new Set(rows.map(r=>r.provinceId)).size!==rows.length)throw Error('调拨地方重复');
 let next=state;const lines=[];
 for(const row of rows){
  if(row.provinceId==='central')throw Error('请选择地方驻军');
  const command={kind:'transfer',id:next.domestic.troopKits.nextId,sourceId:direction==='out'?'central':row.provinceId,targetId:direction==='out'?row.provinceId:'central',soldiers:row.soldiers,quantities:row.quantities};
  if(!Number.isSafeInteger(row.soldiers)||row.soldiers<0||!row.soldiers&&!Object.values(row.quantities??{}).some(n=>n>0))throw Error('所选地方须填写兵员或装备数量');
  const result=executeKitCommand(next,command);next=result.state;lines.push(...result.receipt.lines);
 }
 return {state:next,lines};
}
