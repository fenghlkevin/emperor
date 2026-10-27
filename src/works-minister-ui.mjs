import {quoteShortage} from './action-feedback.mjs';
import {INDUSTRIES} from './economy.mjs';
import {buildingEffectsReport} from './building-effects-ui.mjs';
import {CONSTRUCTION_PLANS,startConstruction} from './construction.mjs';
import {quoteIndustry,executeIndustry,industryOverview} from './industry.mjs';
import {SPECIAL_PLANS,courtSpecialPlan,courtSpecialStatus} from './court-special.mjs';
import {executeSpecial} from './special-buildings.mjs';
import {executeNational} from './national-actions.mjs';
import {projectLaborOverview} from './project-labor.mjs';
import {quoteProjectWork,configureProjectWork,cancelProjectWork,findProject,projectTotal} from './project-work-orders.mjs';
import {commitOperation} from './operation-result.mjs';
import {courtBlock} from './emperor.mjs';
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fmt=n=>Number(n??0).toLocaleString('zh-CN');
export const WORKS_PAGES=[['buildings','普通营建'],['develop','产业开发'],['expand','城州扩建'],['levy-militia','征调民夫'],['release-militia','遣散民夫'],['special','特殊工程'],['schedule','施工调度'],['records','工程记录']];
const HELP={buildings:'普通工程占用现有民夫；遇灾停工，完工下一旬启用。每州同时一项普通工程。',develop:'每亩2两，单笔1—500亩；正常施工1旬，完工下一旬生效。四业共用土地，缺员按实际用工生产。',convert:'等量减少转出产业土地并开发转入产业；总占地不增加，每亩2两，单笔最多500亩。',expand:'扩建提高人口容量和可开发土地，不直接增加人口或产出；新增用地受地形上限限制。',allocate:'同州四业与空闲劳力之间调配，每州每旬一次。不另收银两，消耗一次政务行动。', 'levy-militia':'先用空闲劳力，不足时按所选上限抽调产业人口。士兵与民夫共享各业及四业合计50%的累计抽调上限；会减少产出并增加薪俸和口粮。','release-militia':'只遣散未被工程占用的民夫，优先回原岗位；没有空缺时进入空闲劳力池。',special:'全国同时仅一项特殊工程，每种全地图仅一处。灾情、失地或民夫不足时暂停，竣工下一旬启用，每座维护20两/旬。停建不退款且丢失进度。',schedule:'调整现有工程的施工投入，额外费用按实际施工旬支付；每旬复验人力、钱粮与民心，条件不足自动降档。停建不退已付费用。',records:'逐条查阅工程与产业政令记录，不消耗行动。'};
const stat=(name,n,unit='')=>`<div><small>${name}</small><strong>${fmt(n)}<em>${unit}</em></strong></div>`;
const glyph={tax:'银',expenses:'支',production:'粮',officialRations:'仓',militiaSalaries:'役',supplies:'需'};
function compare(label,before,after,unit='',icon='工'){
 const max=Math.max(1,Math.abs(before),Math.abs(after)),a=Math.abs(before)/max*100,b=Math.abs(after)/max*100;
 return `<article class="wm-compare"><header><span class="wm-glyph" aria-hidden="true">${icon}</span><span>${esc(label)}</span></header><div class="wm-compare-values"><span>${fmt(before)}</span><i aria-hidden="true">→</i><strong>${fmt(after)}<small>${unit}</small></strong></div><svg viewBox="0 0 100 12" preserveAspectRatio="none" role="img" aria-label="${esc(label)}：${fmt(before)}变为${fmt(after)}${unit}"><rect width="${a}" height="4" y="1" fill="#b39c74"/><rect width="${b}" height="4" y="7" fill="#39664e"/></svg></article>`;
}
export function openWorksMinister(initial,root,onCommit,onClose,{kind='buildings',provinceId}={}){
 if(!WORKS_PAGES.some(([id])=>id===kind))throw Error('无效工部事项');
 const state=initial,owned=state.domestic.provinces.filter(p=>p.countryId===state.domestic.playerCountryId);
 let selected=owned.some(p=>p.id===provinceId)?provinceId:owned[0]?.id,building='temples',industry='agriculture',fromIndustry='commerce',area=500,amount=100,targets={},rates={},projectKind='construction',mode=0,duration=1,comfort=false,recordPage=0,busy=false;
 let specialBuilding=state.domestic.specialWorks.project?.building??'shigu';
 const d=document.createElement('dialog');d.className='governance-dialog works-minister-dialog';d.dataset.worksPage=kind;d.setAttribute('aria-label','工部尚书·'+WORKS_PAGES.find(([id])=>id===kind)[1]);
 const p=()=>owned.find(p=>p.id===selected);
 function reset(){targets=Object.fromEntries(INDUSTRIES.map(([, ,job])=>[job,p()?.population.professions[job]??0]));rates={};mode=0;duration=1;comfort=false;}
 reset();
 const select=(attr,values,value)=>`<select ${attr}>${values.map(([id,name])=>`<option value="${esc(id)}" ${String(id)===String(value)?'selected':''}>${esc(name)}</option>`).join('')}</select>`;
 const input=(attr,value,max)=>`<input ${attr} type="number" min="0" ${max?`max="${max}"`:''} step="1" value="${value}" />`;
 const field=(name,control)=>`<label>${name}${control}</label>`;
 function command(){return {id:state.domestic.industryActions.nextId,kind,provinceId:selected,industry,fromIndustry,area,amount,targets,draftRates:rates};}
 function controls(){
  if(kind==='records')return '';
  if(kind==='buildings')return field('建物',select('data-value="building"',Object.entries(CONSTRUCTION_PLANS).map(([id,b])=>[id,b.name]),building));
  if(kind==='special')return field('工程',select('data-value="specialBuilding"',Object.entries(SPECIAL_PLANS).map(([id,b])=>[id,b.name]),specialBuilding));
  if(kind==='schedule')return field('工程',select('data-value="projectKind"',[['construction','普通工程'],['development','产业开发'],['special','特殊工程']],projectKind))+field('投入',select('data-value="mode"',[[0,'常规'],[1,'增派'],[2,'赶工']],mode))+field('期限',select('data-value="duration"',[[1,'1旬'],[2,'2旬'],[3,'3旬']],duration))+field('待遇',select('data-value="comfort"',[['false','常规'],['true','额外补贴']],comfort));
  if(['develop','convert'].includes(kind))return (kind==='convert'?field('转出',select('data-value="fromIndustry"',INDUSTRIES,fromIndustry)):'')+field(kind==='convert'?'转入':'产业',select('data-value="industry"',INDUSTRIES,industry))+field('面积 / 亩',input('data-value="area"',area,500));
  if(kind==='allocate')return INDUSTRIES.map(([,name,job])=>field(name+' / 人',input(`data-target="${job}"`,targets[job]))).join('');
  if(['levy-militia','release-militia'].includes(kind))return field('民夫 / 人',input('data-value="amount"',amount))+(kind==='levy-militia'?INDUSTRIES.map(([,name,job])=>field(name+'抽调上限',select(`data-rate="${job}"`,[0,10,20,30,40,50].map(n=>[n,n+'%']),rates[job]??0))).join(''):'');
  return '';
 }
 function summary(){const a=industryOverview(p(),state.turn),l=projectLaborOverview(state.domestic,p());return `<div class="wm-stats">${stat('国库',state.stats.treasury,'两')}${stat('可用民夫',l.available,'人')}${stat('可用土地',a.land.available,'亩')}${stat('空闲劳力',a.unallocated,'人')}</div>`;}
 function row(a,b){return `<div class="wm-result-row"><span>${esc(a)}</span><strong>${esc(b)}</strong></div>`;}
 function quote(){
  const reason=courtBlock(state);if(reason&&kind!=='records')throw Error(reason);
  if(kind==='records')return null;
  if(kind==='buildings'){const plan=CONSTRUCTION_PLANS[building],r=startConstruction(state,selected,building);return {cost:plan.cost,html:`<div class="wm-chart-grid">${compare('工期',0,plan.turns,'旬','旬')}${compare('建筑',p().buildings[building],p().buildings[building]+1,'座','建')}</div>`,run:()=>r};}
  if(kind==='special'){const project=courtSpecialStatus(state);if(project)return {cost:0,html:row('在建工程',project.name)+row('所在州',project.provinceName)+row('进度',`${project.progress} / ${project.turns}旬`)+row('状态',project.paused?project.reasons.join('、'):'施工中'),cancel:true,run:()=>executeNational(state,courtSpecialPlan(state,{kind:'cancel-special'}).command)};const q=courtSpecialPlan(state,{kind:'special',provinceId:selected,building:specialBuilding});return {...q,html:`<div class="wm-chart-grid">${compare('工期',0,q.turns,'旬','旬')}${compare('民夫需求',0,q.workers,'人','役')}</div>`,run:()=>executeSpecial(state,q.command)};}
  if(kind==='schedule'){const q=quoteProjectWork(state,selected,projectKind,{mode,duration,comfort});return {cost:0,html:`<div class="wm-chart-grid">${compare('施工人手',0,q.workers,'人','役')}${compare('额外支银',0,q.perTurn,'两/旬','银')}${compare('预计工期',q.normalTurns,q.fastTurns,'旬','旬')}</div>`+(q.blockedReason?row('当前状态',q.blockedReason):''),run:()=>configureProjectWork(state,selected,projectKind,{mode,duration,comfort})};}
  const q=quoteIndustry(state,command());if(!q.canAfford)throw Error(quoteShortage(q,WORKS_PAGES.find(([id])=>id===kind)?.[1]??'工部政令'));
  let html='';
  if(kind==='expand')html=`<div class="wm-chart-grid">${compare('人口容量',q.populationBefore.normal,q.populationAfter.normal,'人','户')}${compare('开发土地',q.landBefore.total,q.landAfter.total,'亩','田')}</div>`;
  else if(['levy-militia','release-militia'].includes(kind))html=`<div class="wm-chart-grid wm-impact">${[['tax','银税','两/旬'],['expenses','支出','两/旬'],['production','产粮','石/旬'],['militiaSalaries','民夫薪俸','两/旬']].map(([key,label,unit])=>compare(label,q.impact.before[key],q.impact.after[key],unit,glyph[key])).join('')}</div>`;
  else html=`<div class="wm-chart-grid">${q.outputs.map(i=>compare(i.name,i.before,i.after,i.unit+'/旬',i.name.slice(0,1))).join('')}</div>`+row('生效',`第${q.earliestEffectiveTurn}旬`);
  return {...q,html,run:()=>executeIndustry(state,command())};
 }
 function help(html,title='办理说明'){
 const source=document.createElement('div');source.innerHTML=html;
 const entries=[...source.querySelectorAll('p')].filter(x=>!x.closest('[data-building-effects]')).map(x=>x.outerHTML);
 source.querySelectorAll('tbody tr').forEach(tr=>{const cells=[...tr.children].map(c=>c.textContent);entries.push(`<h3>${esc(cells[0])}</h3><p>${esc(cells[2])}</p><p>${esc(cells[4])}</p>`);});
 const confirmation=source.querySelector('[data-confirm-stop]')?.outerHTML??'';
 let page=0;const h=document.createElement('dialog');h.className='province-help ink-mode wm-help';h.setAttribute('aria-label',title);
 const paint=()=>{h.innerHTML=`<header><h2>${esc(title)}</h2><button aria-label="关闭说明">×</button></header>${entries.length>1?`<select data-help-topic aria-label="选择说明事项">${entries.map((e,i)=>`<option value="${i}" ${page===i?'selected':''}>${esc(e.replace(/<[^>]+>/g,'').slice(0,28))}</option>`).join('')}</select>`:''}<div class="wm-help-copy">${entries[page]??''}</div>${confirmation}`;h.querySelector('header button').onclick=()=>h.close();h.querySelector('[data-help-topic]')?.addEventListener('change',e=>{page=Number(e.target.value);paint();});};
 paint();h.onclose=()=>h.remove();root.append(h);h.showModal();
 }

 function records(){const rows=[...owned.filter(p=>p.construction.project).map(p=>({turn:p.construction.project.startedTurn,message:p.name+' · '+CONSTRUCTION_PLANS[p.construction.project.building].name+' · '+p.construction.project.progress+' / '+CONSTRUCTION_PLANS[p.construction.project.building].turns+'工量'})),...state.domestic.industryActions.history,...state.domestic.specialWorks.history].sort((a,b)=>b.turn-a.turn).flatMap(r=>(String(r.message).match(/[\s\S]{1,100}/g)??['']).map((message,i,parts)=>({...r,message,part:parts.length>1?`${i+1}/${parts.length}`:''})));const r=rows[recordPage];return `<section class="wm-record">${r?`<small>第${r.turn}旬 ${r.part??''}</small><p>${esc(r.message)}</p>`:'<p>暂无工程政令记录</p>'}${rows.length?`<label class="ministry-item-picker">选择工程记录<select data-record-select aria-label="选择全部工程记录">${rows.map((r,i)=>`<option value="${i}" ${recordPage===i?'selected':''}>第${r.turn}旬 · ${esc(r.message.slice(0,28))}</option>`).join('')}</select></label>`:''}</section>`;}
 function update(){if(kind==='special')d.querySelector('.wm-local h2').textContent=SPECIAL_PLANS[specialBuilding].name;const preview=d.querySelector('[data-preview]'),button=d.querySelector('[data-execute]');try{const q=quote();preview.innerHTML=q.html;button.disabled=false;button.textContent=q.cancel?'停建工程':'确认颁旨';d.querySelector('[data-cost]').textContent=q.cancel?'停建不退已付费用':`支银 ${fmt(q.cost)} 两 · 余银 ${fmt(state.stats.treasury-q.cost)} 两`;d.querySelector('[data-error]').textContent='';}catch(e){preview.innerHTML='';button.disabled=true;d.querySelector('[data-cost]').textContent='';d.querySelector('[data-error]').textContent=e.message;}const stop=d.querySelector('[data-stop]');if(stop)stop.hidden=kind!=='schedule'||!findProject(state.domestic,p(),projectKind)||projectKind==='special';}
 function draw(){const title=WORKS_PAGES.find(([id])=>id===kind)[1],art=['special','buildings','expand'].includes(kind)?'building':kind==='records'?'registers':'plans';
 d.innerHTML=`<header class="governance-header"><h1>工部 · ${title}</h1><button aria-label="关闭">关闭 ×</button></header><div class="wm-body"><section class="wm-scene"><div class="governance-art governance-art--${art}"></div><div class="wm-place">${field('州郡',select('data-province',owned.map(p=>[p.id,p.name]),selected))}<button data-help aria-label="办理说明">？</button></div>${owned.length?summary():''}<div class="wm-local">${kind==='buildings'?Object.entries(CONSTRUCTION_PLANS).map(([id,b])=>stat(b.name,p()?.buildings[id],'座')).join(''):kind==='special'?`<h2>${esc(SPECIAL_PLANS[specialBuilding].name)}</h2>`:kind==='schedule'?`<h2>施工调度</h2>`:`<h2>${esc(title)}</h2>`}</div></section><section class="wm-command">${kind==='records'?records():`<form class="wm-fields">${controls()}</form><section class="wm-preview" data-preview aria-live="polite"></section><footer class="wm-order"><strong data-cost></strong><p data-error role="status"></p><div><button class="wm-stop" data-stop ${kind==='schedule'?'':'hidden'}>停建工程</button><button class="court-vermilion" data-execute>确认颁旨</button></div></footer>`}</section></div>`;
 d.querySelector('.governance-header button').onclick=()=>d.close();d.querySelector('[data-help]').onclick=()=>help(`<p>${esc(HELP[kind])}</p>${kind==='special'?`<p>${esc(SPECIAL_PLANS[specialBuilding].effect)}</p>`:kind==='buildings'?buildingEffectsReport(p(),state.turn):['levy-militia','release-militia'].includes(kind)?(()=>{try{return quoteIndustry(state,command()).impactLines.map(x=>`<p>${esc(x)}</p>`).join('')}catch{return ''}})():''}<p>颁旨按原有规则消耗行动、健康与快乐。</p>`);
 d.querySelector('[data-province]').onchange=e=>{selected=e.target.value;reset();draw();};
 d.querySelector('form')?.addEventListener('submit',e=>{e.preventDefault();d.querySelector('[data-execute]').click();});
 d.querySelectorAll('[data-value],[data-target],[data-rate]').forEach(el=>el.addEventListener(el.tagName==='SELECT'?'change':'input',()=>{const key=el.dataset.value,v=el.type==='number'?(el.value===''?NaN:Number(el.value)):el.value;if(el.dataset.target)targets[el.dataset.target]=v;else if(el.dataset.rate)rates[el.dataset.rate]=Number(v);else {switch(key){case 'building':building=v;break;case 'industry':industry=v;break;case 'fromIndustry':fromIndustry=v;break;case 'area':area=v;break;case 'amount':amount=v;break;case 'specialBuilding':specialBuilding=v;break;case 'projectKind':projectKind=v;break;case 'mode':mode=Number(v);break;case 'duration':duration=Number(v);break;case 'comfort':comfort=v==='true';break;}}update();}));
 d.querySelector('[data-record-select]')?.addEventListener('change',e=>{recordPage=Number(e.target.value);draw();});
 d.querySelectorAll('[data-page]').forEach(b=>b.onclick=()=>{recordPage+=Number(b.dataset.page);draw();});
 function commit(run){if(busy)return;busy=true;try{const r=run();commitOperation(onCommit,r.state);d.close();}catch(e){d.querySelector('[data-error]').textContent=e.message;}finally{busy=false;}}
 d.querySelector('[data-execute]')?.addEventListener('click',()=>{try{const q=quote();if(q.cancel){help(`<p>${esc(HELP.special)}</p><button data-confirm-stop>确认停建</button>`,'停建核阅');root.querySelector('[data-confirm-stop]').onclick=e=>{const h=e.target.closest('dialog');commit(q.run);h.close();};}else commit(q.run);}catch(e){d.querySelector('[data-error]').textContent=e.message;}});
 d.querySelector('[data-stop]')?.addEventListener('click',()=>{help('<p>停建后已付费用不退，释放后续民夫占用。</p><button data-confirm-stop>确认停建</button>','停建核阅');root.querySelector('[data-confirm-stop]').onclick=e=>{const h=e.target.closest('dialog');commit(()=>cancelProjectWork(state,selected,projectKind,state.domestic.industryActions.nextId));h.close();};});
 if(kind!=='records')update();
 }
 root.append(d);d.onclose=()=>{d.remove();onClose?.();};draw();d.showModal();return d;
}
