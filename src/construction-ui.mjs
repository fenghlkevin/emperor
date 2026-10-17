import {openNational} from './national-ui.mjs';
import {buildingMarginal} from './building-effects.mjs';
import {buildingEffectsReport} from './building-effects-ui.mjs';
import {CONSTRUCTION_PLANS,startConstruction} from './construction.mjs';
import {activeDisaster,DISASTERS} from './disasters.mjs';
import {INDUSTRIES} from './economy.mjs';
import {quoteIndustry,executeIndustry,industryOverview,DEVELOPMENT_COST,DEVELOPMENT_MAX_AREA} from './industry.mjs';
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fmt=n=>Number(n).toLocaleString('zh-CN');
const field=n=>Number.isFinite(n)?n:'';
const table=(heads,rows)=>`<div class="civil-table report-table"><table><thead><tr>${heads.map(h=>`<th>${h}</th>`).join('')}</tr></thead><tbody>${rows.map(r=>`<tr>${r.map(v=>`<td>${v}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
const tabs=[['buildings','普通营建'],['develop','产业开发'],['allocate','职业调配']];
export function openConstruction(initial,root,onCommit,onClose,options={}){
 let state=initial,tab=options.tab??'buildings',selected=options.provinceId,message='',selectedBuilding='temples',industry='agriculture',area=500,targets=null,requestId=state.domestic.industryActions.nextId;
 if(!tabs.some(([key])=>key===tab))tab='buildings';
 const d=document.createElement('dialog');d.className='domestic-dialog ink-mode revenue-dialog industry-dialog';root.append(d);
 d.onclose=()=>{d.remove();onClose?.();};
 const provinces=()=>state.domestic.provinces.filter(p=>p.countryId===state.domestic.playerCountryId);
 const current=()=>provinces().find(p=>p.id===selected)??provinces()[0];
 const resetTargets=()=>{targets=Object.fromEntries(INDUSTRIES.map(([, ,job])=>[job,current().population.professions[job]]));};
 const cityOptions=()=>provinces().map(p=>`<option value="${p.id}" ${p.id===current().id?'selected':''}>${esc(p.name)}</option>`).join('');
 function command(){return {id:requestId,kind:tab,provinceId:current().id,industry,area,targets};}
 function constructionBody(){
  return `<p>每城可同时建造一项普通工程，开工时一次拨款，每个正常旬推进1旬。受灾时保留进度，灾退后自动复工，不重复拨款。产业开发使用独立队列。</p><form><label>城市<select name="provinceId">${cityOptions()}</select></label><label>建物<select name="building">${Object.entries(CONSTRUCTION_PLANS).map(([id,c])=>`<option value="${id}" ${id===selectedBuilding?'selected':''}>${c.name} · ${c.cost} 两 · ${c.turns} 旬</option>`).join('')}</select></label><button class="primary" type="submit">确定开工</button></form><p data-selected-building-effect>${buildingMarginal(current(),selectedBuilding,state.turn)<=0?'当前收益已封顶；继续营建不会增加该项收益。':'新增建筑完工后下一旬启用；具体收益和条件见下方效果表。'}</p><p role="status">${esc(message)}</p><div class="civil-table report-table"><table><thead><tr><th>城市</th><th>工程</th><th>已施工 / 所需旬数</th><th>状态</th><th>灾害剩余</th></tr></thead><tbody>${provinces().map(p=>{const a=activeDisaster(p,state.turn),r=p.construction.project;return `<tr data-construction-city="${p.id}"><th>${esc(p.name)}</th><td>${r?CONSTRUCTION_PLANS[r.building].name:'无'}</td><td>${r?r.progress+' / '+CONSTRUCTION_PLANS[r.building].turns:'—'}</td><td>${a?'受灾停工':r?'施工中':'可开工'}</td><td>${a?DISASTERS.find(([id])=>id===a.kind)[1]+' · '+(a.endTurn-state.turn)+' 旬':'—'}</td></tr>`;}).join('')}</tbody></table></div>${buildingEffectsReport(current(),state.turn)}`;
 }
 function industryBody(){
  const p=current(),s=industryOverview(p,state.turn);
  if(!targets)resetTargets();
  const controls=tab==='develop'?`<label>产业<select data-industry-sector aria-label="开发产业">${INDUSTRIES.map(([key,name])=>`<option value="${key}" ${industry===key?'selected':''}>${name}</option>`).join('')}</select></label><label>开发面积 / 亩<input data-industry-area aria-label="开发面积" type="number" min="1" max="${DEVELOPMENT_MAX_AREA}" step="1" value="${field(area)}"></label>`:
   `<div class="industry-targets">${INDUSTRIES.map(([,name,job])=>`<label>${name}目标人数<input data-industry-target="${job}" aria-label="${name}目标人数" type="number" min="0" max="${p.population.total-p.population.professions.soldiers-p.population.professions.militia}" step="1" value="${field(targets[job])}"></label>`).join('')}</div>`;
  const note=tab==='develop'?`试行规则：每亩${DEVELOPMENT_COST}两，单笔1—${DEVELOPMENT_MAX_AREA}亩，1个正常施工旬完工，完工后下一旬开始增加产出。费用包含雇工，不占用或改变职业人数。受灾不能开工，已有项目暂停。`:
   '同州四业与未分配人口之间调配，每州每旬限一次成功调配；不另收银两，消耗一次政务行动。总人口、士兵与民伕不变，下次旬结算按新职业生产。未分配人口采用游戏简化口径，未区分劳动年龄。';
  return `<p class="civil-note">${note}</p><form><label>州郡<select data-industry-province aria-label="产业州郡">${cityOptions()}</select></label>${controls}</form><div class="civil-metrics">${[['总人口',p.population.total],['士兵',p.population.professions.soldiers],['民伕',p.population.professions.militia],['未分配人口',s.unallocated]].map(([name,n])=>`<div class="civil-metric"><small>${name}</small><strong>${fmt(n)}<i>人</i></strong></div>`).join('')}</div><p class="civil-note">农业 ${fmt(p.population.professions.farmers)} 人 · 牧业 ${fmt(p.population.professions.herders)} 人 · 商业 ${fmt(p.population.professions.merchants)} 人 · 工业 ${fmt(p.population.professions.workers)} 人</p>${table(['产业','已开发 / 容量（亩）','剩余可开发（亩）','职业人数','预计下旬产量'],s.industries.map(i=>[i.name,`${fmt(i.area)} / ${fmt(i.capacity)}`,fmt(i.remaining),fmt(i.workers),`${fmt(i.output)} ${i.unit}`]))}<div data-industry-preview aria-live="polite"></div><p class="civil-note">预测固定当前人口、生产率与税率，不含未来灾害和事件；农业同时形成粮食并用于估算货币税基，不另扣实物粮税。</p><h3>各州产业开发进度</h3>${table(['州郡','开发项目','状态','收益时点'],provinces().map(city=>{const a=industryOverview(city,state.turn),r=a.project;return [esc(city.name),r?`${INDUSTRIES.find(([key])=>key===r.industry)[1]} ${fmt(r.area)}亩`:'无',r?(a.disaster?'受灾停工':'等待正常施工旬'):'无在建开发',r?'正常施工完工后下一旬':a.activation?`第${a.activation.effectiveTurn}旬起增加产出`:'—'];}))}<details><summary>最近产业政令与完工记录</summary>${state.domestic.industryActions.history.slice(0,12).map(r=>`<p>第${r.turn}旬 · ${esc(r.message)}</p>`).join('')||'<p>尚无产业政令。</p>'}</details>`;
 }
 function draw(){
  selected=current().id;
  const title=tabs.find(([key])=>key===tab)[1];d.setAttribute('aria-label',tab==='buildings'?'工部地方建设':`工部${title}`);d.dataset.worksAction=tab;
  d.innerHTML=`<header class="civil-header"><div><small>工部尚书 · 营建与产业</small><h1>${title}<span>国库 ${fmt(state.stats.treasury)} 两 · 第${state.turn}旬</span></h1></div><div><button data-special-works>特殊工程</button><button class="close" aria-label="关闭">×</button></div></header><div class="revenue-body ink-scroll">${tab==='buildings'?constructionBody():industryBody()}</div>${tab==='buildings'?'':`<div class="revenue-command"><div><span data-industry-cost></span><small data-industry-balance></small><p role="status" data-industry-status>${esc(message)}</p></div><button type="button" class="primary" data-industry-execute>${tab==='develop'?'确认开发并保存':'确认调配并保存'}</button></div>`}<div class="civil-tabs">${tabs.map(([key,name])=>`<button data-works-action="${key}" class="${key===tab?'active':''}">${name}</button>`).join('')}</div><div class="civil-footer">工部营建与产业<span>两 / 亩 / 人 · 新增参数为试行规则</span></div>`;
  d.querySelector('[data-special-works]').onclick=()=>{d.onclose=null;d.close();d.remove();openNational(state,root,onCommit,onClose,{tab:'works'});};
  d.querySelector('.close').onclick=()=>d.close();
  d.querySelectorAll('button[data-works-action]').forEach(b=>b.onclick=()=>{tab=b.dataset.worksAction;message='';requestId=state.domestic.industryActions.nextId;draw();});
  if(tab==='buildings'){
    d.querySelector('[name="provinceId"]').onchange=e=>{selected=e.target.value;draw();};
    d.querySelector('[name="building"]').onchange=e=>{selectedBuilding=e.target.value;draw();};
    d.querySelector('form').onsubmit=e=>{e.preventDefault();const c=Object.fromEntries(new FormData(e.target));try{const result=startConstruction(state,c.provinceId,c.building);onCommit(result.state);state=result.state;selected=c.provinceId;message=result.message;draw();}catch(error){d.querySelector('[role="status"]').textContent=error.message;}};return;
  }
  d.querySelector('[data-industry-province]').onchange=e=>{selected=e.target.value;resetTargets();requestId=state.domestic.industryActions.nextId;message='';draw();};
  d.querySelector('[data-industry-sector]')?.addEventListener('change',e=>{industry=e.target.value;updateQuote();});
  d.querySelector('[data-industry-area]')?.addEventListener('input',e=>{area=e.target.value===''?NaN:Number(e.target.value);updateQuote();});
  d.querySelectorAll('[data-industry-target]').forEach(input=>input.oninput=()=>{targets[input.dataset.industryTarget]=input.value===''?NaN:Number(input.value);updateQuote();});
  d.querySelector('form').onsubmit=e=>{e.preventDefault();d.querySelector('[data-industry-execute]').click();};
  d.querySelector('[data-industry-execute]').onclick=()=>{
    const button=d.querySelector('[data-industry-execute]');if(button.disabled)return;button.disabled=true;
    try{const result=executeIndustry(state,command());onCommit(result.state);state=result.state;requestId=state.domestic.industryActions.nextId;message=result.message;resetTargets();draw();}
    catch(error){d.querySelector('[data-industry-status]').textContent=error.message;button.disabled=false;}
  };
  updateQuote();
 }
 function updateQuote(){
  const button=d.querySelector('[data-industry-execute]'),status=d.querySelector('[data-industry-status]'),preview=d.querySelector('[data-industry-preview]');
  try{
    const q=quoteIndustry(state,command());button.disabled=!q.canAfford;
    d.querySelector('[data-industry-cost]').textContent=`本次支出 ${fmt(q.cost)} 两 · 成功消耗1体力`;
    d.querySelector('[data-industry-balance]').textContent=`执行后国库 ${fmt(q.treasuryAfter)} 两`;
    status.textContent=!q.canAfford?'国库不足':message||'请核对预估后确认，查看和取消不消耗资源。';
    preview.innerHTML=`<h3>${tab==='develop'?'完工后收益预估':'调配后下旬预估'}</h3>${table(['产业','当前产量','调整后产量'],q.outputs.map(i=>[i.name,`${fmt(i.before)} ${i.unit}`,`${fmt(i.after)} ${i.unit}`]))}<p>预计州税收 ${fmt(q.taxBefore)} → ${fmt(q.taxAfter)} 两/旬；未分配人口 ${fmt(q.unallocatedBefore)} → ${fmt(q.unallocatedAfter)} 人。</p><p>${tab==='develop'?`无新灾害时最早第${q.earliestCompleteTurn}旬完工，第${q.earliestEffectiveTurn}旬起增加产出。`:`第${q.earliestEffectiveTurn}旬结算按新职业生产。`}</p>`;
  }catch(error){button.disabled=true;d.querySelector('[data-industry-cost]').textContent='请核对本次政令';d.querySelector('[data-industry-balance]').textContent='';status.textContent=message?`${message} ${error.message}`:error.message;preview.innerHTML='';}
 }
 draw();d.showModal();return d;
}
