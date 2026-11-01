import {provinceGeometry,realmGeometry} from './campaign-map.mjs';
export const isMarching=s=>Boolean(s.domestic.war?.battle?.command.march&&s.turn<s.domestic.war.battle.command.march.arrivalTurn);
export const battleReady=s=>Boolean(s.domestic.war?.battle&&!isMarching(s));
export function campaignMarch(state,provinceId){
 const d=state.domestic,sourceId=d.centralArmy.sourceProvinceId;
 const center=id=>provinceGeometry.find(p=>p.id===id)?.center??realmGeometry.find(p=>p.id+'-core'===id)?.center;
 const a=center(sourceId),b=center(provinceId);
 if(!a||!b)throw Error('行军州郡坐标缺失');
 // Atlas coordinates are geographic degrees; use great-circle distance, 300 km per ten-day period.
 const rad=n=>n*Math.PI/180,lat=rad(b[1]-a[1]),lon=rad(b[0]-a[0]);
 const h=Math.sin(lat/2)**2+Math.cos(rad(a[1]))*Math.cos(rad(b[1]))*Math.sin(lon/2)**2;
 const distance=Math.max(1,Math.round(6371*2*Math.asin(Math.sqrt(Math.min(1,h))))),turns=Math.max(1,Math.ceil(distance/300));
 return {departureTurn:state.turn,arrivalTurn:state.turn+turns,turns,distance,sourceId,provinceId};
}
export function marchSummary(m){const t=m.arrivalTurn-1;return `路程约${m.distance}公里，行军${m.turns}旬，预计第${Math.floor(t/36)+1}年${Math.floor(t%36/3)+1}月${['上','中','下'][t%3]}旬（第${m.arrivalTurn}旬）开战；届时在朝堂召见兵部尚书指挥。`;}
