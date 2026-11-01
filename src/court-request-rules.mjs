import {localAuthority} from './local-autonomy.mjs';
import {courtReportBook} from './court-report-events.mjs';
// Cancellation happens during settlement, never during read-only agenda generation.
export function reconcileCourtRequests(d,turn){
 for(const [book,authority] of [[d.governance.petitions,'civil'],[d.governance.militaryPetitions,'military']])for(const row of book?.items??[]){
  if(!['pending','deferred'].includes(row.status))continue;
  const p=d.provinces.find(p=>p.id===row.provinceId);
  const reason=!p||p.countryId!==d.playerCountryId?'本州已不属朝廷':!localAuthority(d,p)[authority]?'地方授权已收回或承办官员不在任':authority==='civil'&&p.construction?.project?.building===row.building?'同类工程已经开工':'';
  if(!reason)continue;
  Object.assign(row,{status:'cancelled',decidedTurn:turn,reason:`奏请失效：${reason}`});
  d.governance.records.unshift({turn,provinceId:row.provinceId,cost:0,reason:row.reason});d.governance.records=d.governance.records.slice(0,100);
 }
}
export function acknowledgeDeferredRequest(state,item){
 const book=item.requestKind==='military'?state.domestic.governance.militaryPetitions:state.domestic.governance.petitions;
 if(!item.archiveKey||book?.items.find(row=>row.id===item.requestId)?.status!=='deferred')throw Error('待决请旨不能标记已阅');
 const next=structuredClone(state),reports=courtReportBook(next.domestic);
 reports.read=[...new Set([...reports.read,item.archiveKey])].slice(-2048);
 return next;
}
