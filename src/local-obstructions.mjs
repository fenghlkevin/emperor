import {CONSTRUCTION_PLANS} from './construction.mjs';
// Count only consecutive actual attempts, never previews or repeated calls in a turn.
export function trackLocalObstruction(d,p,turn,building,blocked){
 if(p.resourceRulesVersion!==1)return 0;
 const rows=d.governance.obstructions??=[],old=rows.find(r=>r.provinceId===p.id);
 d.governance.obstructions=rows.filter(r=>r.provinceId!==p.id);
 if(!blocked)return 0;
 const streak=old?.building===building&&old.lastTurn===turn?old.streak:old?.building===building&&old.lastTurn===turn-1?Math.min(3,old.streak+1):1;
 d.governance.obstructions.push({provinceId:p.id,building,lastTurn:turn,streak});return streak;
}
export function validateLocalObstructions(d,turn){
 const rows=d.governance.obstructions;if(rows===undefined)return;
 if(!Array.isArray(rows)||rows.length>d.provinces.length||new Set(rows.map(r=>r.provinceId)).size!==rows.length)throw Error('地方受阻记录无效');
 for(const r of rows)if(!d.provinces.some(p=>p.id===r.provinceId)||!Object.hasOwn(CONSTRUCTION_PLANS,r.building)||!Number.isSafeInteger(r.lastTurn)||r.lastTurn<1||r.lastTurn>turn||!Number.isSafeInteger(r.streak)||r.streak<1||r.streak>3)throw Error('地方受阻记录无效');
}
