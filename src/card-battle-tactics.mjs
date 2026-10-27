import {CARD_CATALOG} from './card-battle-data.mjs';
export const TACTIC_CONFIGURATION_VERSION=1;
export const tacticDefinitions=Object.fromEntries(CARD_CATALOG.cards.filter(d=>d.type==='spell').map(d=>[d.id,d]));
export function armyCardCount(total,r){return total?Math.min(r.troopCap+(r.reserveDeckGrowth??0),Math.min(r.troopCap,Math.max(1,Math.floor(total/(r.compactArmy?25:r.unitSize))))+(r.reserveDeckGrowth?Math.floor(Math.max(0,total-1800)/900):0)):0;}
export function tacticCopyLimit(slots,definitions=tacticDefinitions){const n=Object.values(definitions).filter(d=>d.type==='spell'&&d.id!=='coin').length;return Math.max(2,Math.ceil(slots/n));}
export function normalizeTacticSelection(selection,slots,definitions=tacticDefinitions){
 if(selection===undefined)return undefined;
 const fail=message=>{throw Error('配牌无效：'+message);};
 if(!Number.isSafeInteger(slots)||slots<0||slots>30)fail('牌库容量');
 if(!selection||typeof selection!=='object'||Array.isArray(selection)||selection.version!==TACTIC_CONFIGURATION_VERSION||Object.keys(selection).some(k=>!['version','counts'].includes(k))||!selection.counts||typeof selection.counts!=='object'||Array.isArray(selection.counts))fail('配置版本或格式');
 const limit=tacticCopyLimit(slots,definitions),counts={};let total=0;
 for(const [id,count]of Object.entries(selection.counts)){
  if(!Object.hasOwn(definitions,id)||definitions[id].type!=='spell'||id==='coin')fail('不可配置的计策 '+id);
  if(!Number.isSafeInteger(count)||count<0||count>limit)fail('每种计策限0至'+limit+'张');
  total+=count;
 }
 if(total!==slots)fail('当前军阵需'+slots+'张计策，已配'+total+'张；请重新配牌');
 for(const id of Object.keys(definitions).sort())if(selection.counts[id])counts[id]=selection.counts[id];
 return {version:TACTIC_CONFIGURATION_VERSION,counts};
}
export const tacticSelectionIds=selection=>Object.entries(selection.counts).flatMap(([id,n])=>Array(n).fill(id));
