import {courtJusticeCases} from './court-justice.mjs';
import {palacePetitionReady} from './local-petitions.mjs';
import {localPolicy,localAuthority} from './local-autonomy.mjs';
import {courtMilitaryFeedback} from './court-military-feedback.mjs';
import {courtFiscalFeedback} from './court-fiscal-feedback.mjs';
import {countrySummary} from './domestic.mjs';
import {foodForecast} from './food-relief.mjs';
import {activeDisaster,DISASTERS} from './disasters.mjs';
import {CONSTRUCTION_PLANS} from './construction.mjs';
import {courtOccupant} from './court-actors.mjs';
import {courtGovernanceFeedback} from './court-governance-feedback.mjs';
import {courtDiplomaticFeedback} from './court-diplomatic-feedback.mjs';
import {SPECIAL_PLANS} from './special-buildings.mjs';
import {courtSpecialStatus} from './court-special.mjs';

// Derived from current facts. Reading the court never creates events or spends a turn.
export function courtAgenda(s,{archived=[],limit=3}={}){
 const d=s.domestic,q=countrySummary(d,undefined,s.turn),items=[];
 const add=(id,seal,title,summary,office,action,provinceId,urgent=false)=>items.push({id,seal,title,summary,office,action,provinceId,urgent});
 if(d.collapse?.pending)add('capital','急','京城失守','朝廷去留，须由陛下亲决。','war-minister','campaign',null,true);
 else if(d.war?.battle||d.strategy.pending?.defender===d.playerCountryId)add('war','急','边关军报','军情已至，先定守御，再议国政。','war-minister','campaign',null,true);
 const justiceCases=courtJusticeCases(s);
 if(justiceCases.length){add('justice','案','刑部待决奏章',`密查发现${justiceCases.length}名官员有异心，请陛下裁决。`,'justice-minister','justice',null,true);items.at(-1).incident=justiceCases.map(c=>c.official.id+':'+c.official.discoveredTurn).sort().join(',');}
 const forecasts=q.provinces.map(p=>({p,f:foodForecast(p,s.turn,s.turn+1,s.domestic)}));
 const hungryRows=forecasts.filter(x=>x.f.shortfall>0).sort((a,b)=>b.f.shortfall-a.f.shortfall);
 const hungry=hungryRows[0];if(hungry)add('food','赈','全国粮务告急',`下旬全国预计缺粮${hungry.f.national.shortfall.toLocaleString('zh-CN')}石，需统一购粮供给各州。`,'revenue-minister','atlas-grain',hungry.p.id,true);
 const fiscal=courtFiscalFeedback(s);
 const debtNotice=fiscal?.turn===s.turn&&fiscal.debtAdded>0,shortRun=q.net<0&&q.country.fiscal.treasury<=Math.abs(q.net)*3;
 if(shortRun||debtNotice)add('deficit','赋','国用渐紧',`${fiscal?`第${fiscal.turn}旬常规实收${fiscal.income}两、实付${fiscal.paid}两、欠支转国债${fiscal.debtAdded}两。`:''}当前预计每旬${q.net<0?'短支':'结余'}${Math.abs(q.net).toLocaleString('zh-CN')}两，宜核定赋税与支用。`,'revenue-minister','tax');
 if(shortRun||debtNotice)items.at(-1).incident=debtNotice?`欠支:${fiscal.turn}:${fiscal.debtAdded}`:`短支:${q.country.fiscal.treasury<=Math.abs(q.net)?'不足一旬':'不足三旬'}`;
 const disasters=q.provinces.filter(p=>activeDisaster(p,s.turn));
 disasters.forEach((disaster,i)=>{const event=activeDisaster(disaster,s.turn),f=foodForecast(disaster,s.turn,s.turn+1,s.domestic),remaining=event.endTurn-s.turn;
 add(i?`disaster:${disaster.id}`:'disaster','灾',`${disaster.name}有灾`,`地方报${DISASTERS.find(([id])=>id===event.kind)?.[1]??'灾情'}，按现行灾期还持续${remaining}旬。${f.shortfall>0?`下旬预计缺粮${f.shortfall}石，须优先全国购粮；国库不足则如实保留全国缺粮风险。`:'现有存粮及预计产粮足够下旬口粮，无须重复赈粮。'}灾中暂停新建，现有工程待灾退后恢复；灾势无法立即消退，可知悉收折，待灾期结束并逐旬观察。`,'revenue-minister','atlas-grain',disaster.id,f.shortfall>0);
 items.at(-1).incident=`${disaster.id}:${event.kind}:${event.startTurn}:${event.endTurn}:缺粮${f.shortfall}`;
 });
 const military=courtMilitaryFeedback(s);
 if(military?.turn===s.turn)add('military-result','军','战后归营复奏',`第${military.turn}旬：${military.lines.join('；')}`,'war-minister','garrison');
 for(const row of d.governance.petitions?.items??[]){if(!['pending','deferred'].includes(row.status)||row.building==='palaces'&&!palacePetitionReady(d,s.turn))continue;const p=d.provinces.find(p=>p.id===row.provinceId);if(!p||p.countryId!==d.playerCountryId)continue;
  add(`local-request:${row.id}`,'请',`${p.name}${CONSTRUCTION_PLANS[row.building].name}专项请旨`,`${row.reason}。申请专项拨银${row.cost}两，不占日常委任额度；批准时重新检查口粮、授权、保留线与施工民夫。`,'prime-minister','local-petition',p.id);
  items.at(-1).requestId=row.id;items.at(-1).incident=`${row.id}:${row.status}:${row.reason}`;
 }
 for(const row of d.governance.militaryPetitions?.items??[]){if(!['pending','deferred'].includes(row.status)||row.building==='palaces'&&!palacePetitionReady(d,s.turn))continue;const p=d.provinces.find(p=>p.id===row.provinceId);if(!p||p.countryId!==d.playerCountryId)continue;const c=row.command,target=d.provinces.find(p=>p.id===c.targetId);
  add(`local-military:${row.id}`,'请',`${p.name}${c.kind==='recruit'?'扩军':'跨州军务'}请旨`,`${row.reason}。${c.kind==='recruit'?`申请增募${c.amount}人，拨银${row.cost}两`:`申请调往${target?.name??c.targetId}：士兵${c.soldiers}人，兵装${Object.values(c.quantities).reduce((n,v)=>n+v,0)}份`}；批准前复验两州口粮、军权与可用兵员资源。`,'prime-minister','local-petition',p.id);
  Object.assign(items.at(-1),{requestId:row.id,requestKind:'military',incident:`${row.id}:${row.status}:${row.reason}`});
 }
 for(const p of q.provinces.filter(p=>p.resourceRulesVersion===1&&d.personnel.delegations.includes(p.id))){const policy=localPolicy(p),authority=localAuthority(d,p),missing=[...(policy.civil&&!authority.civil?['州牧']:[]),...(policy.military&&!authority.military?['将军']:[])];if(!missing.length)continue;
  add(`local-vacancy:${p.id}`,'任',`${p.name}地方官位空缺`,`${missing.join('、')}不在任，对应自动决策已暂停；基础生产与已生效工程按原规则运行。请补任官员或收回对应授权。`,'personnel-minister','personnel-delegate',p.id);items.at(-1).incident=`${p.id}:${missing.join(',')}`;
 }
 const governedRows=q.provinces.map(p=>({p,f:courtGovernanceFeedback(s,p.id)})).filter(x=>x.f?.turn===s.turn&&x.f.reasons.some(r=>/暂缓|缺粮|兴建|开发|补齐地方设施/.test(r))).sort((a,b)=>b.f.cost-a.f.cost);
 governedRows.forEach((governed,i)=>{add(i?`governance:${governed.p.id}`:'governance','治',`${governed.p.name}地方复奏`,`第${governed.f.turn}旬实支${governed.f.cost}两：${governed.f.reasons.join('；')}`,'personnel-minister','personnel-delegate',governed.p.id);items.at(-1).incident=`${governed.p.id}:${governed.f.reasons.map(r=>r.replace(/缺粮\d+石/g,'缺粮待处理')).join('；')}`;});
 const receipts=courtDiplomaticFeedback(s).filter(r=>r.turn===s.turn&&(r.shortfall||r.kind==='tribute'||d.diplomacy.find(a=>a.countryIds.includes(d.playerCountryId)&&a.countryIds.includes(r.countryId))?.agreement.settledTurns===1));
 receipts.forEach((receipt,i)=>{add(i?`diplomatic-receipt:${receipt.countryId}:${receipt.kind}`:'diplomatic-receipt','邦',`${receipt.name}${receipt.shortfall?'履约不足':'履约复奏'}`,`第${receipt.turn}旬：${receipt.summary}。${receipt.shortfall?'不足额已按现行规则影响友善。':'钱款已按实际结算入账。'}`,'rites-minister','diplomacy');items.at(-1).countryId=receipt.countryId;items.at(-1).incident=`${receipt.countryId}:${receipt.kind}:${receipt.turn}`;});
 const special=courtSpecialStatus(s);
 if(special&&(special.paused||special.startedTurn===s.turn||special.progress>0&&SPECIAL_PLANS[special.building].segmentTurns&&special.progress%SPECIAL_PLANS[special.building].segmentTurns===0))add('special','工',`${special.provinceName}${special.name}${special.paused?'停工':'在建'}`,`已施工${special.progress}/${special.turns}旬；${special.paused?`当前因${special.reasons.join('、')}暂停。${special.reasons.includes('灾情')?'灾退后可自动续建，无须重复开工。':''}${special.reasons.includes('民伕不足')?'须补足现有民伕才能续建。':''}${special.reasons.includes('失地')?'须恢复工地权属才能续建。':''}可核查工地，或先核阅停建代价再决定。`:'工期按旬推进，全线竣工下一旬启用。'}`,'works-minister','special',special.provinceId,special.paused);
 if(special&&items.at(-1)?.id==='special')items.at(-1).incident=`${special.id}:${special.startedTurn}:${special.paused?special.reasons.join('、'):'施工'}:${special.paused?'':special.startedTurn===s.turn?'开工':special.progress}`;
 for(const p of q.provinces){const b=p.buildingEffects?.pending;if(b?.completedTurn===s.turn)add(`works-complete:${p.id}`,'工',`${p.name}${CONSTRUCTION_PLANS[b.building].name}竣工`,`第${b.completedTurn}旬完工，第${b.effectiveTurn}旬启用；可在州图查验实际建筑。`,'works-minister','atlas-build',p.id);for(const b of p.specialBuildings.filter(b=>b.ruleVersion===1&&b.completedTurn===s.turn))add(`special-complete:${p.id}:${b.id}`,'工',`${p.name}${b.name}竣工`,`第${b.completedTurn}旬完工，第${b.effectiveTurn}旬启用；可在长工程御案查验。`,'works-minister','special',p.id);}
 const projects=q.provinces.filter(p=>p.construction.project&&(p.construction.project.startedTurn===s.turn||activeDisaster(p,s.turn)));
 projects.forEach((project,i)=>{const r=project.construction.project,plan=CONSTRUCTION_PLANS[r.building];add(i?`works:${project.id}`:'works','工',`${project.name}${plan.name}${activeDisaster(project,s.turn)?'停工':'开工'}`,`已施工${r.progress}/${plan.turns}旬，遇灾暂停，完工下一旬收益生效。`,'works-minister','atlas-build',project.id);items.at(-1).incident=`${project.id}:${r.building}:${r.startedTurn}:${activeDisaster(project,s.turn)?`灾停:${project.disaster.startTurn}`:'开工'}`;});
 return items.map(a=>({...a,archiveKey:JSON.stringify([a.id.split(':')[0],a.provinceId??null,a.countryId??null,a.incident??a.summary,...(a.id.split(':')[0]==='food'?[s.turn]:[])])})).filter(a=>['capital','war','justice'].includes(a.id)||!archived.includes(a.archiveKey)).sort((a,b)=>Number(b.urgent)-Number(a.urgent)).slice(0,limit);
}
export function courtSpeaker(s,office){return courtOccupant(s.domestic,office);}
export function courtOverview(s){const q=countrySummary(s.domestic,undefined,s.turn);return {provinces:q.provinces.length,net:q.net,grain:q.grainReserve,treasury:q.country.fiscal.treasury,debt:q.country.fiscal.debt};}
