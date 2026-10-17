import {refreshSpecialBenefits} from './special-buildings.mjs';
import {changeWelfare,welfareValue} from './building-effects.mjs';
import {governorProfile} from './governance.mjs';
export function occupyProvince(d,targetId,turn,conquerorId=d.playerCountryId,provinceId=null,allowCapital=false){
 const target=d.countries.find(c=>c.id===targetId),home=d.countries.find(c=>c.id===conquerorId);
 const p=d.provinces.find(p=>p.countryId===targetId&&(!provinceId||p.id===provinceId));if(!p)return null;
 if(!allowCapital&&(p.id===d.centralArmy.sourceProvinceId||p.id===d.general.capitalProvinceId))throw Error('京城不可按普通州占领');
 target.provinceIds=target.provinceIds.filter(id=>id!==p.id);home.provinceIds.push(p.id);p.countryId=home.id;
 p.status.situation='unrest';changeWelfare(p,'stability',-15);changeWelfare(p,'loyalty',-10);
 p.occupation={version:1,turn,previousOwner:targetId,lastTurn:turn,settled:false};
 for(const o of d.justice.officials.filter(o=>o.provinceId===p.id&&o.status==='serving')){o.positionId=null;o.office='待命';o.provinceId=null;o.plotTurn=null;}
 if(!target.provinceIds.length)for(const r of d.diplomacy.filter(r=>r.countryIds.includes(targetId))){r.relation='none';r.trade.quota=0;Object.assign(r.agreement,{exports:0,imports:0,tribute:0,payerId:null});}
 d.personnel.delegations=d.personnel.delegations.filter(id=>d.provinces.some(p=>p.id===id&&p.countryId===d.playerCountryId));
 refreshSpecialBenefits(d,turn);
 return {provinceId:p.id,name:p.name,previousOwner:targetId,annexed:target.provinceIds.length===0};
}
export function settleOccupation(d,turn){for(const p of d.provinces){const o=p.occupation;if(!o||o.lastTurn>=turn||p.countryId!==d.playerCountryId)continue;o.lastTurn=turn;if(o.settled)continue;
 const gov=governorProfile(d,p),required=Math.ceil(p.population.total*.003),garrison=p.population.professions.soldiers;
 if(gov.id&&garrison>=required){changeWelfare(p,'stability',Math.max(1,Math.round(2*gov.efficiency)));changeWelfare(p,'loyalty',1);if(welfareValue(p,'stability')>=60&&welfareValue(p,'loyalty')>=50){o.settled=true;p.status.situation='stable';}}
 else {changeWelfare(p,'stability',-1);p.status.situation='unrest';}
}}
export function validateOccupation(d,turn=Infinity){for(const p of d.provinces){const o=p.occupation;if(o&& (o.version!==1||!Number.isSafeInteger(o.turn)||o.turn<1||o.turn>turn||!Number.isSafeInteger(o.lastTurn)||o.lastTurn<o.turn||o.lastTurn>turn||!d.countries.some(c=>c.id===o.previousOwner)||typeof o.settled!=='boolean'))throw Error('占领治理记录无效');}}
