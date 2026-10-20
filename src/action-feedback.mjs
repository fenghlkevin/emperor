// Short, factual rejection messages fit directly beside each ministry's controls.
const fmt=n=>Number(n).toLocaleString('zh-CN');
export function resourceShortage(action,resource,needed,available,unit){
 return `${resource}不足：${action}需${fmt(needed)}${unit}，现有${fmt(available)}${unit}，缺${fmt(Math.max(0,needed-available))}${unit}。`;
}
export const treasuryShortage=(cost,available,action='本次办理')=>resourceShortage(action,'国库',cost,available,'两');
export const quoteShortage=(q,action='本次办理')=>treasuryShortage(q.cost,q.treasuryBefore??(q.cost+q.treasuryAfter),action);
