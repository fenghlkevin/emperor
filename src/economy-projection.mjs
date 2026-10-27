import {settleJustice} from './justice.mjs';
import {settleDomestic} from './domestic.mjs';
import {settlePersonnel} from './personnel-actions.mjs';

// Scenario projection on a private copy. Explicit RNG prevents an open report
// from consuming the real game's random stream or generating random rewards.
export function projectScheduledEconomy(state){
 if(state.domestic.war?.battle||state.domestic.collapse?.pending)
  return {available:false,reason:'战场或迁都尚待处理，不能可靠推演下一旬。'};
 const next=structuredClone(state),turn=state.turn+1,d=next.domestic;
 const home=d.countries.find(c=>c.id===d.playerCountryId),openingCash=home.fiscal.treasury;
 const openingGrain=home.fiscal.grain;
 next.turn=turn;
 settleJustice(d,turn);
 settleDomestic(d,turn);
 settlePersonnel(d,turn,()=>.5,next.stats);
 const row=home.ledger.find(r=>!r.legacy&&r.turn===turn);
 const provinces=d.provinces.filter(p=>p.countryId===d.playerCountryId).map(p=>({id:p.id,name:p.name,supplied:p.foodRelief.lastSettlement?.consumed??0,
  resource:p.resourceSettlement?.turn===turn?structuredClone(p.resourceSettlement):null}));
 const closingGrain=home.fiscal.grain;
 const entries=row?.entries.map(e=>({...e}))??[];
 return {available:true,turn,cash:{opening:openingCash,income:row?.income??0,paid:row?.expenditure??0,
  net:home.fiscal.treasury-openingCash,closing:home.fiscal.treasury,debtAdded:row?.debtAdded??0},
  grain:{opening:openingGrain,closing:closingGrain,net:closingGrain-openingGrain},provinces,entries,
  assumptions:'含现行确定性灾情、调查、常规收支、外交履约与地方治理；不含未批准政令、随机宫廷奖励、新战事及其领土变化。'};
}
