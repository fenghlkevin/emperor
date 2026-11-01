import {battleReady,isMarching,marchSummary} from './campaign-march.mjs';
import {requireProjectLabor} from './project-labor.mjs';
import {addCourtReport} from './court-report-events.mjs';
import {courtJusticeCases} from './court-justice.mjs';
import {previewLocalMilitary} from './local-military-petitions.mjs';
import {constructionPetitionReady} from './local-petitions.mjs';
import {localPolicy,localAuthority} from './local-autonomy.mjs';
import {courtMilitaryFeedback} from './court-military-feedback.mjs';
import {courtFiscalFeedback} from './court-fiscal-feedback.mjs';
import {countrySummary} from './domestic.mjs';
import {foodForecast} from './food-relief.mjs';
import {activeDisaster,DISASTERS} from './disasters.mjs';
import {CONSTRUCTION_PLANS,constructionPlan} from './construction.mjs';
import {courtOccupant} from './court-actors.mjs';
import {courtGovernanceFeedback} from './court-governance-feedback.mjs';
import {courtDiplomaticFeedback} from './court-diplomatic-feedback.mjs';

// Derived from current facts. Reading the court never creates events or spends a turn.
export function courtAgenda(s,{archived=[],limit=3,includeRead=false,groupCompletions=true}={}){
 const d=s.domestic,q=countrySummary(d,undefined,s.turn),items=[];
 const add=(id,seal,title,summary,office,action,provinceId,urgent=false,kind='notice')=>items.push({id,seal,title,summary,office,action,provinceId,urgent,kind:urgent?'urgent':kind});
 if(d.collapse?.pending)add('capital','急','京城失守','朝廷去留，须由陛下亲决。','war-minister','campaign',null,true);
 else if(battleReady(s)||d.strategy.pending?.defender===d.playerCountryId)add('war','急','边关军报','军情已至，先定守御，再议国政。','war-minister','campaign',null,true);
 if(isMarching(s))add('march','军','出征行军奏报',marchSummary(d.war.battle.command.march),'war-minister','campaign',null,false,'request');
 const justiceCases=courtJusticeCases(s);
 if(justiceCases.length){add('justice','案','刑部待决奏章',`密查发现${justiceCases.length}名官员有异心，请陛下裁决。`,'justice-minister','justice',null,true);items.at(-1).incident=justiceCases.map(c=>c.official.id+':'+c.official.discoveredTurn).sort().join(',');}
 const forecasts=q.provinces.map(p=>({p,f:foodForecast(p,s.turn,s.turn+1,s.domestic)}));
 const hungryRows=forecasts.filter(x=>x.f.shortfall>0).sort((a,b)=>b.f.shortfall-a.f.shortfall);
 const hungry=hungryRows[0];if(hungry)add('food','赈','全国粮务告急',`下旬全国预计缺粮${hungry.f.national.shortfall.toLocaleString('zh-CN')}石，需统一购粮供给各州。`,'revenue-minister','atlas-grain',hungry.p.id,true);
 const fiscal=courtFiscalFeedback(s);
 const debtNotice=fiscal?.turn===s.turn&&fiscal.debtAdded>0,shortRun=q.net<0&&q.country.fiscal.treasury<=Math.abs(q.net)*3;
 if(shortRun||debtNotice)add('deficit','赋','国用渐紧',`${fiscal?`第${fiscal.turn}旬常规实收${fiscal.income}两、实付${fiscal.paid}两、欠支转国债${fiscal.debtAdded}两。`:''}当前预计每旬${q.net<0?'短支':'结余'}${Math.abs(q.net).toLocaleString('zh-CN')}两，宜核定赋税与支用。`,'revenue-minister','tax',null,false,'request');
 if(shortRun||debtNotice)items.at(-1).incident=debtNotice?`欠支:${fiscal.turn}:${fiscal.debtAdded}`:`短支:${q.country.fiscal.treasury<=Math.abs(q.net)?'不足一旬':'不足三旬'}`;
 // Current nonurgent disasters live in the atlas. Food emergencies remain urgent.
 const disasters=q.provinces.filter(p=>activeDisaster(p,s.turn)&&foodForecast(p,s.turn,s.turn+1,d).shortfall>0);
 disasters.forEach(disaster=>{const event=activeDisaster(disaster,s.turn);
 add(`disaster:${disaster.id}`,'灾',`${disaster.name}灾中缺粮`,`${DISASTERS.find(([id])=>id===event.kind)?.[1]??'灾情'}尚余${event.endTurn-s.turn}旬。须先补足全国口粮，再安排灾后恢复。`,'revenue-minister','atlas-grain',disaster.id,true);
 items.at(-1).incident=`${disaster.id}:${event.kind}:${event.startTurn}:缺粮`;
 });
 const military=courtMilitaryFeedback(s);
 if(military?.turn===s.turn)add('military-result','军','战后归营复奏',`第${military.turn}旬：${military.lines.slice(0,3).join('；').slice(0,280)}。${military.lines.length>3?'其余伤亡与兵装明细见军营战报。':''}`,'war-deputy','garrison',null,false,'report');
 if(military?.turn===s.turn)items.at(-1).incident=`${military.id}:${military.turn}`;
 for(const row of d.governance.petitions?.items??[]){if(!['pending','deferred'].includes(row.status))continue;const p=d.provinces.find(p=>p.id===row.provinceId);if(!constructionPetitionReady(d,p,s.turn,row.building))continue;
  add(`local-request:${row.id}`,'请',`${p.name}${CONSTRUCTION_PLANS[row.building].name}专项请旨`,`${row.reason}。拟建${CONSTRUCTION_PLANS[row.building].name}，专项拨银${row.cost}两，工期${constructionPlan(d,row.building).turns}旬。${row.status==='deferred'?'目前暂缓，条件恢复后可重新核准。':''}`,'prime-minister','local-petition',p.id,false,'request');
  items.at(-1).requestId=row.id;items.at(-1).incident=`${row.id}:${row.status}:${row.reason}`;
 }
 for(const row of d.governance.militaryPetitions?.items??[]){if(!['pending','deferred'].includes(row.status))continue;const p=d.provinces.find(p=>p.id===row.provinceId);if(!p||p.countryId!==d.playerCountryId||!localAuthority(d,p).military)continue;const c=row.command,target=d.provinces.find(p=>p.id===c.targetId);
  add(`local-military:${row.id}`,'请',`${p.name}${c.kind==='recruit'?'中央增援':'中央转调'}请旨`,`${row.reason}。${c.kind==='recruit'?`请求中央增援${c.amount}人，优先调拨现有兵员，不足再募；费用上限${row.cost}两`:`请求经中央转调至${target?.name??c.targetId}：士兵${c.soldiers}人、兵装${Object.values(c.quantities).reduce((n,v)=>n+v,0)}份`}。`,'prime-minister','local-petition',p.id,false,'request');
  Object.assign(items.at(-1),{requestId:row.id,requestKind:'military',incident:`${row.id}:${row.status}:${row.reason}`});
 }
 for(const p of q.provinces.filter(p=>p.resourceRulesVersion===1&&d.personnel.delegations.includes(p.id))){const policy=localPolicy(p),authority=localAuthority(d,p),missing=[...(policy.civil&&!authority.civil?['州牧']:[]),...(policy.military&&!authority.military?['将军']:[])];if(!missing.length)continue;
  add(`local-vacancy:${p.id}`,'任',`${p.name}地方官位空缺`,`${missing.join('、')}不在任，对应自动决策已暂停；基础生产与已生效工程按原规则运行。请补任官员或收回对应授权。`,'personnel-minister','personnel-delegate',p.id,false,'request');items.at(-1).incident=`${p.id}:${missing.join(',')}`;
 }
 // Only outcomes of explicit imperial decisions deserve a return report.
 const governedRows=q.provinces.map(p=>({p,f:courtGovernanceFeedback(s,p.id)})).filter(x=>x.f?.turn===s.turn);
 governedRows.forEach(({p,f})=>{
  const outcomes=[...new Set(f.reasons.filter(r=>/奉旨|陛下驳回|奏请失效|批准暂缓/.test(r)).map(r=>r.replace(/；.*$/,'')))];
  if(!outcomes.length)return;
  add(`governance:${p.id}`,'治',`${p.name}御批执行复奏`,outcomes.slice(0,2).map(r=>r.length>180?r.slice(0,180)+'…':r).join('。')+'。'+(outcomes.length>2?'其余执行结果见地方治理记录。':''),'personnel-minister','personnel-delegate',p.id,false,'report');
  items.at(-1).incident=`${p.id}:${f.turn}:${outcomes.slice(0,2).map(r=>r.slice(0,180)).join('|')}`;
 });
 const lastTrade=countryId=>(d.courtReports?.events??[]).filter(e=>e.countryId===countryId&&e.action==='diplomacy'&&e.key.includes(':trade:')).at(-1);
 const receipts=courtDiplomaticFeedback(s).filter(r=>r.turn===s.turn&&(r.shortfall||r.kind==='tribute'||lastTrade(r.countryId)?.title.endsWith('履约不足')||d.diplomacy.find(a=>a.countryIds.includes(d.playerCountryId)&&a.countryIds.includes(r.countryId))?.agreement.settledTurns===1));
 receipts.forEach((receipt,i)=>{add(i?`diplomatic-receipt:${receipt.countryId}:${receipt.kind}`:'diplomatic-receipt','邦',`${receipt.name}${receipt.shortfall?'履约不足':'履约复奏'}`,`第${receipt.turn}旬：${receipt.summary}。${receipt.shortfall?'不足额已按现行规则影响友善。':'钱款已按实际结算入账。'}`,'rites-minister','diplomacy',null,false,'report');items.at(-1).countryId=receipt.countryId;items.at(-1).incident=`${receipt.countryId}:${receipt.kind}:${receipt.turn}`;if(receipt.kind==='trade'&&receipt.shortfall&&lastTrade(receipt.countryId)?.title.endsWith('履约不足'))items.at(-1).archiveKey=lastTrade(receipt.countryId).key;});
 // Completion and stop/resume are notices, never daily progress reports.
 for(const p of q.provinces){
  const b=p.buildingEffects?.pending;
  if(b?.completedTurn===s.turn&&!d.courtReports?.events.some(e=>e.turn===s.turn&&e.provinceId===p.id&&e.title===`${p.name}${CONSTRUCTION_PLANS[b.building].name}完成`))add(`works-complete:${p.id}`,'工',`${p.name}${CONSTRUCTION_PLANS[b.building].name}完成`,`工程已完工，第${b.effectiveTurn}旬启用。`,'works-minister','atlas-build',p.id);
  for(const b of p.specialBuildings.filter(b=>b.ruleVersion===1&&b.completedTurn===s.turn))if(!d.courtReports?.events.some(e=>e.turn===s.turn&&e.provinceId===p.id&&e.title===`${p.name}${b.name}完成`))add(`special-complete:${p.id}:${b.id}`,'工',`${p.name}${b.name}完成`,`工程已完工，第${b.effectiveTurn}旬启用。`,'works-minister','special',p.id);
 }
 for(const e of d.courtReports?.events??[]){if(e.provinceId&&!q.provinces.some(p=>p.id===e.provinceId))continue;
  add(e.id??`notice:${e.key}`,'报',e.title,e.summary,e.office,e.action,e.provinceId,false,e.kind);items.at(-1).archiveKey=e.key;items.at(-1).reportTurn=e.turn;if(e.countryId)items.at(-1).countryId=e.countryId;
 }
 // Deferred requests may be acknowledged until their blocking circumstances change.
 for(const a of items.filter(a=>a.action==='local-petition')){
  const book=a.requestKind==='military'?d.governance.militaryPetitions:d.governance.petitions,row=book?.items.find(r=>r.id===a.requestId);
  if(row?.status!=='deferred')continue;
  const p=d.provinces.find(p=>p.id===a.provinceId),home=q.country.fiscal;
  // Re-present a deferred request only when its feasibility changes, not each silver fluctuation.
  const blockers=[Boolean(activeDisaster(p,s.turn)),foodForecast(p,s.turn,s.turn+1,d).shortfall>0,home.treasury-row.cost<d.governance.reserve];
  if(a.requestKind==='military'){try{previewLocalMilitary(s,row.command);blockers.push(false);}catch{blockers.push(true);}}
  else {let laborBlocked=false;try{requireProjectLabor(d,p,'construction',{building:row.building,laborScale:2});}catch{laborBlocked=true;}blockers.push(Boolean(p.construction.project),laborBlocked);}
  a.incident=JSON.stringify([row.id,row.status,row.reason,blockers]);
 }
 const rows=items.map(a=>({...a,archiveKey:a.archiveKey??JSON.stringify([a.id.split(':')[0],a.provinceId??null,a.countryId??null,a.incident??a.summary,...(a.id.split(':')[0]==='food'?[s.turn]:[])])})).filter((a,i,rows)=>rows.findIndex(r=>r.archiveKey===a.archiveKey)===i).filter(a=>includeRead||a.urgent||(!archived.includes(a.archiveKey)&&!(d.courtReports?.read??[]).includes(a.archiveKey))).sort((a,b)=>Number(b.urgent)-Number(a.urgent)||Number(b.kind==='request')-Number(a.kind==='request'));
 return (groupCompletions?mergeCompletionNotices(rows,archived,d.courtReports?.read??[],s.turn):rows).slice(0,limit);
}
// Keep original events as the durable journal; merge only their presentation.
function mergeCompletionNotices(rows,archived,read,turn){
 const category=a=>{
  if(a.kind!=='notice')return null;
  if(a.archiveKey.startsWith('disaster-ended:'))return 'disaster-ended';
  if(a.office!=='works-minister')return null;
  if(/:complete:|:segment:/.test(a.archiveKey)||/^(works-complete|special-complete):/.test(a.id))return 'completion';
  if(/:paused:/.test(a.archiveKey))return 'paused';
  if(/:resumed:/.test(a.archiveKey))return 'resumed';
  return null;
 };
 const labels={completion:['各地工程完工汇奏','告成'],paused:['各地工程停工汇奏','停工'],resumed:['各地工程复工汇奏','复工'],'disaster-ended':['各地灾情结束汇奏','灾期结束']};
 const wasRead=a=>archived.includes(a.archiveKey)||read.includes(a.archiveKey);
 const groups=new Map();
 for(const a of rows){const type=category(a);if(!type)continue;const key=`${type}:${wasRead(a)}`;if(!groups.has(key))groups.set(key,[]);groups.get(key).push(a);}
 return rows.flatMap(a=>{
  const type=category(a);if(!type)return [a];
  const members=groups.get(`${type}:${wasRead(a)}`);
  if(members.length<2)return [a];
  if(a!==members[0])return [];
  const disaster=type==='disaster-ended',[title,outcome]=labels[type];
  return [{...a,id:`${type}-batch:${wasRead(a)?'read':'pending'}`,seal:disaster?'灾':'工',title,provinceId:null,action:disaster?'atlas-grain':'works-records',completionItems:members,
   summary:`各地共${members.length}项${outcome}。`+members.map((r,i)=>`其${i+1}，${r.title}（第${r.reportTurn??turn}旬报）：${r.summary}`).join('') }];
 });
}
export function courtSpeaker(s,office){return courtOccupant(s.domestic,office);}
export function courtOverview(s){const q=countrySummary(s.domestic,undefined,s.turn);return {provinces:q.provinces.length,net:q.net,grain:q.grainReserve,treasury:q.country.fiscal.treasury,debt:q.country.fiscal.debt};}

// Persist notifications at actual state transitions, never merely by opening a page.
export function captureCourtReports(state){
 for(const a of courtAgenda(state,{limit:Infinity,groupCompletions:false})){
  if(!['report','notice'].includes(a.kind))continue;
  addCourtReport(state.domestic,{key:a.archiveKey,id:`history:${a.archiveKey}`,turn:a.reportTurn??state.turn,provinceId:a.provinceId??null,...(a.countryId?{countryId:a.countryId}:{}),kind:a.kind,title:a.title,summary:a.summary,office:a.office,action:a.action});
 }
}
