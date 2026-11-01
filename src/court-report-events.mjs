import {activeDisaster,DISASTERS} from './disasters.mjs';
import {CONSTRUCTION_PLANS} from './construction.mjs';
import {projectWorkers} from './project-labor.mjs';
import {SPECIAL_PLANS} from './special-buildings.mjs';
// Optional save extension. Reading a court never initializes or changes the journal.
export function courtReportBook(d){return d.courtReports??={version:1,events:[],read:[]};}
export function addCourtReport(d,event){
 const book=courtReportBook(d);
 if(book.events.some(r=>r.key===event.key)||book.read.includes(event.key))return;
 book.events.push(event);
 // Prune read history before dropping an unread notification.
 if(book.events.length>256){const read=book.events.findIndex(r=>book.read.includes(r.key));book.events.splice(read>=0?read:0,1);}
}
const industryNames={agriculture:'农业',pastoral:'牧业',commerce:'商业',industry:'工业'};
export function projectSnapshot(d,turn,{previous=false}={}){
 const rows=[];
 for(const p of d.provinces){
  for(const [kind,r] of [['construction',p.construction?.project],['development',p.development?.project],['expansion',p.cityCapacity?.expansion],['special',d.specialWorks?.project?.provinceId===p.id?d.specialWorks.project:null]]){
   if(!r)continue;
   const key=`${kind}:${r.startedTurn}:${r.building??r.id}`;
   const allocation=p.projectLabor?.allocations.find(a=>a.key===key);
   const last=d.courtReports?.events.filter(e=>e.key.startsWith(`project:${p.id}:${key}:`)&&!e.key.includes(':segment:')).at(-1);
   const reason=previous&&last?(last.key.includes(':paused:')?'停工':''):p.countryId!==(r.ownerId??p.countryId)?'工地失守':activeDisaster(p,turn)?'当地受灾':allocation?.speed===0||(!previous&&kind==='special'&&p.population.professions.militia<projectWorkers(kind,r,d))?'民夫不足':'';
   const name=kind==='construction'?CONSTRUCTION_PLANS[r.building].name:kind==='special'?SPECIAL_PLANS[r.building].name:kind==='expansion'?'扩城':`${industryNames[r.industry]}开发`;
   rows.push({key,kind,provinceId:p.id,ownerId:r.ownerId??p.countryId,name,reason,progress:r.progress,building:r.building});
  }
 }
 return rows;
}
export function recordCourtTransitions(d,turn,before){
 const after=projectSnapshot(d,turn);
 for(const old of before){
  if(old.ownerId!==d.playerCountryId)continue;
  const current=after.find(r=>r.provinceId===old.provinceId&&r.key===old.key),p=d.provinces.find(p=>p.id===old.provinceId);
  let event,summary;
  if(!current){event='complete';summary=old.kind==='expansion'?'扩城已完成，新增人口与土地容量现已生效。':`${old.name}已完工，第${turn+1}旬启用。`;}
  else if(Boolean(current.reason)!==Boolean(old.reason)){event=current.reason?'paused':'resumed';summary=current.reason?`${old.name}因${current.reason}停工。条件恢复后继续施工。`:`${old.name}已复工，继续按原计划施工。`;}
  if(current&&old.kind==='special'){const size=SPECIAL_PLANS[old.building].segmentTurns;if(size&&Math.floor(current.progress/size)>Math.floor(old.progress/size)){const count=Math.floor(current.progress/size);addCourtReport(d,{key:`project:${p.id}:${old.key}:segment:${count}`,turn,provinceId:p.id,kind:'notice',title:`${p.name}${old.name}第${count}段完成`,summary:`第${count}段已完成，第${turn+1}旬启用对应收益，其余工程继续施工。`,action:'special',office:'works-minister'});}}
  if(event)addCourtReport(d,{key:`project:${old.provinceId}:${old.key}:${event}:${turn}`,turn,provinceId:p.id,kind:'notice',title:`${p.name}${old.name}${({complete:'完成',paused:'停工',resumed:'复工'})[event]}`,summary,action:old.kind==='special'?'special':old.kind==='construction'?'atlas-build':'works-records',office:'works-minister'});
 }
 for(const e of d.disasters.history.filter(e=>e.endTurn===turn)){
  const p=d.provinces.find(p=>p.id===e.provinceId);if(p?.countryId!==d.playerCountryId)continue;
  const name=DISASTERS.find(([id])=>id===e.kind)?.[1]??'灾情';
  addCourtReport(d,{key:`disaster-ended:${p.id}:${e.kind}:${e.turn}`,turn,provinceId:p.id,kind:'notice',title:`${p.name}${name}结束`,summary:`本次${name}灾期已结束。${activeDisaster(p,turn)?'当地另有新灾，仍须按当前灾情安排生产与施工。':'地方可恢复正常生产与施工。'}灾后钱粮及民生可在州图查阅。`,action:'atlas-grain',office:'revenue-minister'});
 }
}
export function acknowledgeCourtReport(state,item){
 if(item.urgent||item.kind==='request')throw Error('待决事项须先办理');
 if(!item.archiveKey)throw Error('奏章标识无效');
 if(item.completionItems?.length){
  return item.completionItems.reduce((next,entry)=>acknowledgeCourtReport(next,entry),state);
 }
 const next=structuredClone(state);
 addCourtReport(next.domestic,{key:item.archiveKey,id:`history:${item.archiveKey}`,turn:item.reportTurn??state.turn,provinceId:item.provinceId??null,...(item.countryId?{countryId:item.countryId}:{}),kind:item.kind??'notice',title:item.title,summary:item.summary,action:item.action,office:item.office});
 const book=courtReportBook(next.domestic);
 book.read=[...new Set([...book.read,item.archiveKey])].slice(-2048);

 return next;
}
export function validateCourtReports(d,turn){
 const b=d.courtReports;if(b===undefined)return;
 const validText=(x,n)=>typeof x==='string'&&x.length>0&&x.length<=n;
 if(b.version!==1||!Array.isArray(b.read)||b.read.length>2048||b.read.some(k=>!validText(k,2000))||new Set(b.read).size!==b.read.length||!Array.isArray(b.events)||b.events.length>256)throw Error('奏章记录无效');
 const keys=new Set();for(const e of b.events){if(!validText(e.key,2000)||keys.has(e.key)||!Number.isSafeInteger(e.turn)||e.turn<1||e.turn>turn||(e.provinceId!=null&&!d.provinces.some(p=>p.id===e.provinceId))||!['notice','report'].includes(e.kind)||!validText(e.title,100)||!validText(e.summary,500)||!['special','atlas-build','atlas-grain','works-records','personnel-delegate','diplomacy','garrison'].includes(e.action)||!['works-minister','revenue-minister','personnel-minister','rites-minister','war-deputy'].includes(e.office))throw Error('奏章事件无效');if(e.countryId!==undefined&&!d.countries.some(c=>c.id===e.countryId))throw Error('奏章国家无效');if(e.id!==undefined&&!validText(e.id,2000))throw Error('奏章标识无效');keys.add(e.key);}
}
