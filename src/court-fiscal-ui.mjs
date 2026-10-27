import {balanced} from './development-balance.mjs';
import {quoteDisasterSubsidy} from './disasters.mjs';
import {quoteProvinceResources} from './province-resources.mjs';
import {CENSUS_COST,quoteRevenue} from './revenue.mjs';
import {countrySummary} from './domestic.mjs';
import {courtFiscalPlan} from './court-fiscal.mjs';
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fmt=n=>Number(n).toLocaleString('zh-CN');
export const COURT_FISCAL_KINDS=[['tax','赋','核定赋税'],['subsidy','惠','中央补助'],['census','籍','招纳流民入籍']];
export function fiscalControls(state,p,kind,edits){
 if(['tax','subsidy'].includes(kind))return localFiscalControls(state,p,kind,edits);
 if(kind!=='census')throw Error('请选择有效的财政事项');
 let quote,error='';try{quote=quoteRevenue(state,{kind:'census'});}catch(e){error=e.message;}
 const added=quote?.changes.find(r=>r.provinceId===p.id)?.added??0;
 return `<section class="fiscal-local-command"><h3 class="atlas-section-title">招纳流民入籍</h3><p class="fiscal-local-help">${balanced(state.domestic)?'按实际空缺岗位安置，优先安排现有空闲劳力；费用按实际人数计算。':'全国统一办理一次 · 按各州人口的1%招纳，受容量限制。'}${error?esc(error):''}</p><div class="fiscal-local-result"><small>${esc(p.name)}人口 · 当前 → 入籍后</small><strong>${fmt(p.population.total)} <span>→</span> ${fmt(p.population.total+added)}</strong><p>本州新增 <b>+${fmt(added)} 人</b></p></div><div class="fiscal-draft-changes" data-fiscal-draft></div><div data-fiscal-outlook></div></section>`;
}

function localFiscalControls(state,p,kind,edits){
 const tax=kind==='tax',value=edits[p.id]??(tax?Math.round(p.budget.taxRate*100):0);
 return `<section class="fiscal-local-command" data-fiscal-province="${esc(p.id)}"><h3 class="atlas-section-title">${tax?'核定赋税':'中央补助'}</h3><div class="fiscal-local-baseline">${tax?`<span>当前税率 <strong>${Math.round(p.budget.taxRate*100)}%</strong></span>`:`<span>本州人口 <strong>${fmt(p.population.total)} 人</strong></span><span>生活水平 <strong>${fmt(p.status.livingStandard)} / 100</strong></span>`}</div><label class="atlas-amount">${tax?'拟定税率 / %':'补助金额 / 两'}<div><button data-fiscal-step="${tax?-1:-100}" aria-label="${tax?'降低1个百分点':'减少100两'}">−</button><input data-fiscal-value type="number" aria-label="${esc(p.name)}${tax?'拟定税率':'补助银两'}" min="0" max="${tax?50:1000000000}" step="1" value="${Number.isFinite(value)?value:''}"><button data-fiscal-step="${tax?1:100}" aria-label="${tax?'提高1个百分点':'增加100两'}">＋</button></div></label><div data-fiscal-outlook></div><div class="fiscal-draft-changes" data-fiscal-draft></div></section>`;
}
function updateLocalFiscalPreview(root,state,kind,edits,plan){
 const p=state.domestic.provinces.find(p=>p.id===root.querySelector('[data-fiscal-province]')?.dataset.fiscalProvince);if(!p)return;
 const outlook=root.querySelector('[data-fiscal-outlook]'),row=plan?.changes.find(r=>r.provinceId===p.id);
 if(kind==='subsidy'){
  const after=row?.after??p.status.livingStandard;
  const relief=row?.disaster??quoteDisasterSubsidy(p,state.turn,0);
  outlook.innerHTML=`${relief?`<div class="fiscal-local-result"><small>本州剩余灾期</small><strong>${relief.before} <span>→</span> ${relief.after} <em>旬</em></strong></div><p class="fiscal-local-disaster">灾期 ${relief.before} → ${relief.after} 旬 · 生活水平不变 <span title="赈灾所需${fmt(relief.minimum)}两；每州每旬最多缩短1旬，至少保留1旬。受灾期间补助不增加生活水平。">?</span></p>`:`<div class="fiscal-local-result"><small>本州生活水平</small><strong>${fmt(p.status.livingStandard)} <span>→</span> ${fmt(after)} <em>/ 100</em></strong></div>`}${plan?`<p class="fiscal-local-total">合计拨款 <b>${fmt(plan.cost)} 两</b> · 国库余额 ${fmt(plan.treasuryAfter)} 两</p>`:''}`;
 }else{
  const rate=edits[p.id]??Math.round(p.budget.taxRate*100);
  if(!Number.isSafeInteger(rate)||rate<0||rate>50){outlook.innerHTML='<p class="atlas-warning">税率须为0–50的整数。</p>';return;}
  const before=quoteProvinceResources(p,{turn:state.turn+1}),after=quoteProvinceResources(p,{turn:state.turn+1,grainTaxRate:rate/100,cashTaxRate:rate/100});
  outlook.innerHTML=`<div class="fiscal-local-result"><small>本州每旬税收 · 当前 → 拟定</small><p><span>粮赋</span><b>${fmt(before.grain.tax)} → ${fmt(after.grain.tax)} 石</b></p><p><span>工商银税</span><b>${fmt(before.cash.tax)} → ${fmt(after.cash.tax)} 两</b></p></div>${balanced(state.domestic)?'<p class="atlas-warning">税压逐旬积累并抑制产出、生活与民心；降税后仍需时间恢复。</p>':rate>25?`<p class="atlas-warning">高于25%：逐旬损害民忠与安定。${rate>30?'高于30%还会降低生活水平。':''}</p>`:''}`;
 }
}
export function updateFiscalPreview(root,state,kind,edits){
 const changes=root.querySelector('[data-fiscal-draft]'),outlook=root.querySelector('[data-fiscal-outlook]');if(!changes||!outlook)return;
 let plan;try{plan=courtFiscalPlan(state,kind,edits);}catch{plan=null;}
 const owned=countrySummary(state.domestic).provinces;
 const rows=Object.entries(edits).filter(([id,v])=>kind==='tax'?v!==Math.round(owned.find(p=>p.id===id)?.budget.taxRate*100):v!==0);
 const selected=root.querySelector('[data-fiscal-province]')?.dataset.fiscalProvince,current=rows.find(([id])=>id===selected);
 changes.innerHTML=['tax','subsidy'].includes(kind)&&rows.length?`<small>拟定 ${rows.length} 州 · 尚未颁旨</small><div class="fiscal-draft-picker"><select data-fiscal-draft-select aria-label="选择已拟定州郡"><option value="">选择拟定州郡</option>${rows.map(([id,v])=>`<option value="${esc(id)}" ${id===selected?'selected':''}>${esc(owned.find(p=>p.id===id)?.name??id)} · ${Number.isSafeInteger(v)?fmt(v):'待核'}${kind==='tax'?'%':'两'}</option>`).join('')}</select>${current?`<button data-fiscal-clear="${esc(selected)}" aria-label="撤回${esc(owned.find(p=>p.id===selected)?.name??selected)}安排">撤回 ×</button>`:''}</div>`:'';

 if(['tax','subsidy'].includes(kind)){updateLocalFiscalPreview(root,state,kind,edits,plan);return;}
 if(!plan){try{courtFiscalPlan(state,kind,edits);}catch(e){outlook.innerHTML=`<p class="atlas-warning">${esc(e.message)}</p>`;}return;}
 outlook.innerHTML=`<div class="fiscal-census-summary"><p><span>全国招纳</span><strong>+${fmt(plan.addedPopulation)} 人</strong></p><p><span>一次性费用</span><strong>${fmt(plan.cost)} 两</strong></p><p><span>办理后国库</span><b>${fmt(plan.treasuryAfter)} 两</b></p></div>`;
}
