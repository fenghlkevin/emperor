import {quoteShortage} from './action-feedback.mjs';
import {laborOrganization} from './central-office-effects.mjs';
import {terrainEconomyMarkup} from './terrain-economy-ui.mjs';
import {draftControls,staffingMarkup} from './manpower-ui.mjs';
import {CITY_EXPANSION_COST,CITY_EXPANSION_PEOPLE,CITY_EXPANSION_LAND} from './city-capacity.mjs';
import {commitOperation} from './operation-result.mjs';
import {projectWorkControls,bindProjectWorkControls} from './project-work-ui.mjs';
import {projectLaborOverview} from './project-labor.mjs';
import {productionLaborLimit} from './labor.mjs';
import {openCourtSpecial} from './court-special-ui.mjs';
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
const tabs=[['buildings','普通营建'],['develop','产业开发'],['convert','土地转用'],['expand','城州扩建'],['allocate','产业用工'],['levy-militia','征调民夫'],['release-militia','遣散民夫']];
export function openConstruction(initial,root,onCommit,onClose,options={}){
 let state=initial,tab=options.tab??'buildings',selected=options.provinceId,message='',selectedBuilding='temples',industry='agriculture',fromIndustry='commerce',area=500,amount=100,draftRates={},targets=null,requestId=state.domestic.industryActions.nextId;
 if(!tabs.some(([key])=>key===tab))tab='buildings';
 const d=document.createElement('dialog');d.className='domestic-dialog ink-mode revenue-dialog industry-dialog';root.append(d);
 d.onclose=()=>{d.remove();onClose?.();};
 const provinces=()=>state.domestic.provinces.filter(p=>p.countryId===state.domestic.playerCountryId);
 const current=()=>provinces().find(p=>p.id===selected)??provinces()[0];
 const resetTargets=()=>{targets=Object.fromEntries(INDUSTRIES.map(([, ,job])=>[job,current().population.professions[job]]));};
 const cityOptions=()=>provinces().map(p=>`<option value="${p.id}" ${p.id===current().id?'selected':''}>${esc(p.name)}</option>`).join('');
 function command(){return {id:requestId,kind:tab,provinceId:current().id,industry,fromIndustry,area,targets,amount,draftRates};}
 function laborNote(){if(state.domestic.resourceRulesVersion!==1)return '';const q=projectLaborOverview(state.domestic,current());return `<p class="civil-note">本州民夫${fmt(q.capacity)}人 · 在建工程占用${fmt(q.reserved)}人 · 可用${fmt(q.available)}人${q.shortage?` · 缺员${fmt(q.shortage)}人`:''}。</p><details><summary>劳力占用规则</summary><p>普通工程基础100人，工部侍郎${esc(laborOrganization(state.domestic,'construction',100).source.name)}调度后需${laborOrganization(state.domestic,'construction',100).workers}人；开垦每5亩需1人、最低20人；与特殊工程共池。缺员停工，不自动抽走农民，人数为试行参数。</p></details>`;}
 function constructionBody(){
  return `${laborNote()}<form><label>城市<select name="provinceId">${cityOptions()}</select></label>${current().construction.project?'':`<label>建物<select name="building">${Object.entries(CONSTRUCTION_PLANS).map(([id,c])=>`<option value="${id}" ${id===selectedBuilding?'selected':''}>${c.name} · ${c.cost} 两 · ${c.turns} 旬</option>`).join('')}${state.domestic.resourceRulesVersion===1?'<option value="reclaim">开垦土地 · 按亩计</option>':''}</select></label><button class="primary" type="submit">确定开工</button>`}</form><p data-selected-building-effect ${current().construction.project?'hidden':''}>${buildingMarginal(current(),selectedBuilding,state.turn)<=0?'当前收益已封顶；继续营建不会增加该项收益。':'新增建筑完工后下一旬启用；具体收益和条件见下方效果表。'}</p><p role="status">${esc(message)}</p>${projectWorkControls(state,current(),'construction')}<div class="civil-table report-table"><table><thead><tr><th>城市</th><th>工程</th><th>已施工 / 所需旬数</th><th>状态</th><th>灾害剩余</th></tr></thead><tbody>${provinces().map(p=>{const a=activeDisaster(p,state.turn),r=p.construction.project;return `<tr data-construction-city="${p.id}"><th>${esc(p.name)}</th><td>${r?CONSTRUCTION_PLANS[r.building].name:'无'}</td><td>${r?r.progress+' / '+CONSTRUCTION_PLANS[r.building].turns:'—'}</td><td>${a?'受灾停工':r?'施工中':'可开工'}</td><td>${a?DISASTERS.find(([id])=>id===a.kind)[1]+' · '+(a.endTurn-state.turn)+' 旬':'—'}</td></tr>`;}).join('')}</tbody></table></div><details class="works-effects"><summary>本州建筑收益与条件</summary>${buildingEffectsReport(current(),state.turn)}</details>`;
 }
 function industryBody(){
  const p=current(),s=industryOverview(p,state.turn);
  if(!targets)resetTargets();
  const controls=['develop','convert'].includes(tab)?`${tab==='convert'?`<label>转出产业<select data-industry-from aria-label="转出产业">${INDUSTRIES.map(([key,name])=>`<option value="${key}" ${fromIndustry===key?'selected':''}>${name}</option>`).join('')}</select></label>`:''}<label>${tab==='convert'?'转入产业':'产业'}<select data-industry-sector aria-label="开发产业">${INDUSTRIES.map(([key,name])=>`<option value="${key}" ${industry===key?'selected':''}>${name}</option>`).join('')}</select></label><label>${tab==='convert'?'转用':'开发'}面积 / 亩<input data-industry-area aria-label="开发面积" type="number" min="1" max="${DEVELOPMENT_MAX_AREA}" step="1" value="${field(area)}"></label>`:
   ['levy-militia','release-militia'].includes(tab)?`<label>民夫人数<input data-militia-amount aria-label="民夫人数" type="number" min="1" step="1" value="${amount}"></label>${tab==='levy-militia'?draftControls(state.domestic,[p],draftRates):'<p>只遣散未被在建工程占用的民夫；回到空闲劳力池，在原州且原岗位仍有空缺时优先返岗。</p>'}`:tab==='expand'?`<p>扩建支银${CITY_EXPANSION_COST}两，正常人口容量增加${fmt(CITY_EXPANSION_PEOPLE)}人，可开发土地最多增加${fmt(CITY_EXPANSION_LAND)}亩，确认后生效。</p>`:`<div class="industry-targets">${INDUSTRIES.map(([,name,job])=>`<label>${name}目标人数<input data-industry-target="${job}" aria-label="${name}目标人数" type="number" min="0" max="${productionLaborLimit(p)}" step="1" value="${field(targets[job])}"></label>`).join('')}</div>`;
  const note=['develop','convert'].includes(tab)?`试行规则：每亩${DEVELOPMENT_COST}两，单笔1—${DEVELOPMENT_MAX_AREA}亩，1个正常施工旬完工，完工后下一旬开始增加产出。${state.domestic.resourceRulesVersion===1?'预付费用不重复收取，施工占用现有民夫，与其他工程统一核算；产业招工在完工后下一旬生效。':'费用包含雇工，不占用或改变职业人数。'}受灾不能开工，已有项目暂停。完工后下一旬从空闲劳力安排对应岗位，人不足时保留空岗、按用工比例产出。四业共用土地；开发占用空地，转用将等量减少转出产业土地，总占地不增加。`:tab==='expand'?'扩建提高人口容量和可开发土地，不直接增加总人口或产出，实际新增土地不超过地形可开发土地上限。正常容量内允许自然增长；超载后停止自然增长并承受安定压力，人口迁入受超载上限限制。': ['levy-militia','release-militia'].includes(tab)?'征调先用空闲劳力，不足时按选择抽调产业人口；士兵与民夫共享各业和四业合计50%的累计上限。无一次性征调费，薪俸、军需与官府口粮按现行规则结算。':
   '同州四业与未分配人口之间调配，每州每旬限一次成功调配；不另收银两，消耗一次政务行动。总人口、士兵与民伕不变，下次旬结算按新职业生产。未分配人口采用游戏简化口径，未区分劳动年龄。';
  return `${laborNote()}${['develop','convert'].includes(tab)?projectWorkControls(state,p,'development'):''}<details><summary>施工与调配规则</summary><p class="civil-note">${note}</p></details><form><label>州郡<select data-industry-province aria-label="产业州郡">${cityOptions()}</select></label>${controls}</form><div class="civil-metrics">${[['总人口',p.population.total],['士兵',p.population.professions.soldiers],['民伕',p.population.professions.militia],['可调劳力',s.unallocated]].map(([name,n])=>`<div class="civil-metric"><small>${name}</small><strong>${fmt(n)}<i>人</i></strong></div>`).join('')}</div><p class="civil-note">农业 ${fmt(p.population.professions.farmers)} 人 · 牧业 ${fmt(p.population.professions.herders)} 人 · 商业 ${fmt(p.population.professions.merchants)} 人 · 工业 ${fmt(p.population.professions.workers)} 人</p><p class="civil-note" data-city-capacity>共用土地 ${fmt(s.land.used)} / ${fmt(s.land.total)}亩 · 在建预留${fmt(s.land.reserved)}亩 · 剩余${fmt(s.land.available)}亩；正常人口容量${fmt(s.population.normal)}人 · 超载上限${fmt(s.population.limit)}人${s.population.overload?` · 超载${fmt(s.population.overload)}人，每旬安定−${s.population.pressure}`:''}。</p>${terrainEconomyMarkup(p)}${staffingMarkup(p,state.turn)}${table(['产业','已开发 / 用地上限（亩）','职业人数','实际 / 满员产量'],s.industries.map(i=>[i.name,`${fmt(i.area)} / ${fmt(i.limit)}`,fmt(i.workers),`${fmt(i.output)} / ${fmt(i.fullOutput)} ${i.unit}`]))}<div data-industry-preview aria-live="polite"></div><p class="civil-note">预测含本次预计招工，固定生产率与税率，不含未来灾害和事件；${state.domestic.resourceRulesVersion===1?'农业为民间产粮，先自给再征田赋入官仓，不重复折银征税；钱税来自非农产业。':'农业同时形成粮食并用于估算货币税基，不另扣实物粮税。'}</p><h3>各州产业开发进度</h3>${table(['州郡','开发项目','状态','收益时点'],provinces().map(city=>{const a=industryOverview(city,state.turn),r=a.project;return [esc(city.name),r?`${r.fromIndustry?INDUSTRIES.find(([key])=>key===r.fromIndustry)[1]+' → ':''}${INDUSTRIES.find(([key])=>key===r.industry)[1]} ${fmt(r.area)}亩`:'无',r?(a.disaster?'受灾停工':'等待正常施工旬'):'无在建开发',r?'正常施工完工后下一旬':a.activation?`第${a.activation.effectiveTurn}旬起增加产出`:'—'];}))}<details><summary>最近产业政令与完工记录</summary>${state.domestic.industryActions.history.slice(0,12).map(r=>`<p>第${r.turn}旬 · ${esc(r.message)}</p>`).join('')||'<p>尚无产业政令。</p>'}</details>`;
 }
 function draw(){
  selected=current().id;
  const title=tabs.find(([key])=>key===tab)[1];d.setAttribute('aria-label',tab==='buildings'?'工部地方建设':`工部${title}`);d.dataset.worksAction=tab;
  d.innerHTML=`<header class="civil-header"><div><small>工部尚书 · 营建与产业</small><h1>${title}<span>国库 ${fmt(state.stats.treasury)} 两 · 第${state.turn}旬</span></h1></div><div class="works-header-actions"><nav class="works-switch" aria-label="工部功能">${tabs.map(([key,name])=>`<button data-works-action="${key}" aria-pressed="${key===tab}">${name}</button>`).join('')}</nav><select data-works-switch aria-label="切换工部功能">${tabs.map(([key,name])=>`<option value="${key}" ${key===tab?'selected':''}>${name}</option>`).join('')}</select><button data-special-works>特殊工程</button><button class="close" aria-label="关闭">×</button></div></header><div class="revenue-body ink-scroll">${tab==='buildings'?constructionBody():industryBody()}</div>${tab==='buildings'?'':`<div class="revenue-command"><div><span data-industry-cost></span><small data-industry-balance></small><p role="status" data-industry-status>${esc(message)}</p></div><button type="button" class="primary" data-industry-execute>${tab==='levy-militia'?'确认征调并保存':tab==='release-militia'?'确认遣散并保存':tab==='expand'?'确认扩建并保存':tab==='convert'?'确认转用并保存':tab==='develop'?'确认开发并保存':'确认调配并保存'}</button></div>`}<div class="civil-footer">工部营建与产业<span>两 / 亩 / 人 · 新增参数为试行规则</span></div>`;
  bindProjectWorkControls(d,state,onCommit,result=>{state=result.state;d.close();});
  d.querySelector('[data-special-works]').onclick=()=>{d.onclose=null;d.close();d.remove();openCourtSpecial(state,root,onCommit,onClose);};
  d.querySelector('.close').onclick=()=>d.close();
  d.querySelectorAll('button[data-works-action]').forEach(b=>b.onclick=()=>{tab=b.dataset.worksAction;message='';requestId=state.domestic.industryActions.nextId;draw();});
  d.querySelector('[data-works-switch]').onchange=e=>{tab=e.target.value;message='';requestId=state.domestic.industryActions.nextId;draw();};
  if(tab==='buildings'){
    d.querySelector('[name="provinceId"]').onchange=e=>{selected=e.target.value;draw();};
    const buildingSelect=d.querySelector('[name="building"]');if(buildingSelect)buildingSelect.onchange=e=>{if(e.target.value==='reclaim'){tab='develop';industry='agriculture';message='开垦土地按亩建设，与普通营建共用民夫池。';}else selectedBuilding=e.target.value;draw();};
    d.querySelector('form').onsubmit=e=>{e.preventDefault();const c=Object.fromEntries(new FormData(e.target));try{const result=startConstruction(state,c.provinceId,c.building);commitOperation(onCommit,result.state);state=result.state;d.close();}catch(error){d.querySelector('[role="status"]').textContent=error.message;}};return;
  }
  d.querySelector('[data-industry-province]').onchange=e=>{selected=e.target.value;resetTargets();requestId=state.domestic.industryActions.nextId;message='';draw();};
  d.querySelector('[data-militia-amount]')?.addEventListener('input',e=>{amount=Number(e.target.value);updateQuote();});
  d.querySelectorAll('[data-draft-rate]').forEach(e=>e.onchange=()=>{draftRates[e.dataset.draftRate]=Number(e.value);updateQuote();});
  d.querySelector('[data-industry-from]')?.addEventListener('change',e=>{fromIndustry=e.target.value;updateQuote();});
  d.querySelector('[data-industry-sector]')?.addEventListener('change',e=>{industry=e.target.value;updateQuote();});
  d.querySelector('[data-industry-area]')?.addEventListener('input',e=>{area=e.target.value===''?NaN:Number(e.target.value);updateQuote();});
  d.querySelectorAll('[data-industry-target]').forEach(input=>input.oninput=()=>{targets[input.dataset.industryTarget]=input.value===''?NaN:Number(input.value);updateQuote();});
  d.querySelector('[data-industry-province]').closest('form').onsubmit=e=>{e.preventDefault();d.querySelector('[data-industry-execute]').click();};
  d.querySelector('[data-industry-execute]').onclick=()=>{
    const button=d.querySelector('[data-industry-execute]');if(button.disabled)return;button.disabled=true;
    try{const result=executeIndustry(state,command());commitOperation(onCommit,result.state);state=result.state;d.close();}
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
    status.textContent=!q.canAfford?quoteShortage(q,'工程开工'):message||'请核对预估后确认，查看和取消不消耗资源。';
    preview.innerHTML=['levy-militia','release-militia'].includes(tab)?`<h3>钱粮减产与新增开支预览</h3>${q.impactLines.map(line=>`<p>${esc(line)}</p>`).join('')}`:tab==='expand'?`<p>正常人口容量 ${fmt(q.populationBefore.normal)} → ${fmt(q.populationAfter.normal)}人；超载上限 ${fmt(q.populationBefore.limit)} → ${fmt(q.populationAfter.limit)}人。可开发土地 ${fmt(q.landBefore.total)} → ${fmt(q.landAfter.total)}亩，现有人口不变。</p>${table(['产业','扩建前用地上限 / 亩','扩建后用地上限 / 亩'],q.outputs.map(i=>[i.name,fmt(i.landLimitBefore),fmt(i.landLimitAfter)]))}`:`<h3>${['develop','convert'].includes(tab)?'完工后收益预估':'调配后下旬预估'}</h3>${table(['产业','当前用工→预计用工 / 满员需求','当前产量','调整后实际 / 满员产量'],q.outputs.map(i=>[i.name,`${fmt(i.workersBefore)}→${fmt(i.workersAfter)} / ${fmt(i.requiredAfter)}人`,`${fmt(i.before)} ${i.unit}`,`${fmt(i.after)} / ${fmt(i.fullAfter)} ${i.unit}`]))}<p>预计州税收 ${fmt(q.taxBefore)} → ${fmt(q.taxAfter)} 两/旬；可调劳力 ${fmt(q.unallocatedBefore)} → ${fmt(q.unallocatedAfter)} 人。</p><p>${['develop','convert'].includes(tab)?`无新灾害时最早第${q.earliestCompleteTurn}旬完工，第${q.earliestEffectiveTurn}旬起增加产出。`:`第${q.earliestEffectiveTurn}旬结算按新职业生产。`}</p>`;
  }catch(error){button.disabled=true;d.querySelector('[data-industry-cost]').textContent='请核对本次政令';d.querySelector('[data-industry-balance]').textContent='';status.textContent=message?`${message} ${error.message}`:error.message;preview.innerHTML='';}
 }
 draw();d.showModal();return d;
}
