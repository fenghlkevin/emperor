import {foodForecast,quoteRelief,executeRelief,GRAIN_PRICE} from './food-relief.mjs';
import {DISASTERS} from './disasters.mjs';
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fmt=n=>Number(n).toLocaleString('zh-CN',{maximumFractionDigits:2});
const table=(headers,rows)=>`<div class="civil-table report-table"><table><thead><tr>${headers.map(h=>`<th>${h}</th>`).join('')}</tr></thead><tbody>${rows.map(r=>`<tr>${r.map(v=>`<td>${v}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
export function openFoodRelief(initial,root,onCommit,onClose,onReturn){
 let state=initial,kind='purchase',targetId,sourceId,amount=200,message='',justCommitted=false,requestId=state.domestic.foodRelief.nextId;
 const owned=()=>state.domestic.provinces.filter(p=>p.countryId===state.domestic.playerCountryId);
 const d=document.createElement('dialog');d.className='domestic-dialog ink-mode revenue-dialog relief-dialog';d.setAttribute('aria-label','户部粮食救济');root.append(d);d.onclose=()=>{d.remove();onClose?.();};
 const command=()=>({id:requestId,kind,targetId,sourceId,amount});
 function draw(){
  const provinces=owned();targetId=provinces.some(p=>p.id===targetId)?targetId:provinces[0].id;
  sourceId=provinces.some(p=>p.id===sourceId&&p.id!==targetId)?sourceId:provinces.find(p=>p.id!==targetId)?.id;
  const target=provinces.find(p=>p.id===targetId),f=foodForecast(target,state.turn),last=target.foodRelief.lastSettlement;
  const options=list=>list.map(p=>`<option value="${p.id}">${esc(p.name)}</option>`).join('');
  d.innerHTML=`<header class="civil-header"><div><small>户部尚书 · 粮食救济</small><h1>${kind==='purchase'?'购粮拨入':'州际调粮'}<span>国库 ${fmt(state.stats.treasury)} 两 · 第${state.turn}旬</span></h1></div><div><button data-return-revenue>返回户部理财</button><button class="close" aria-label="关闭">×</button></div></header><div class="revenue-body ink-scroll"><p>${kind==='purchase'?`试行规则：国库按${GRAIN_PRICE}两/石向外部购粮，立即入目标州仓，不扣外国粮食。每州每旬最多购买三旬口粮，首次成功购买时锁定额度。`:'试行规则：本国不同州之间立即调粮，运费0两、损耗0石。调出后须留足下旬口粮扣除预计农业产量的净缺口。'}</p><p class="civil-note">现金补助只增加地方现金，不自动变粮。救济不消除灾害或追溯撤销损失；后续足粮停止缺粮惩罚，既有民生损失按建筑规则恢复。</p><form><label>调入州<select data-food-target aria-label="调入州">${options(provinces)}</select></label>${kind==='transfer'?`<label>调出州<select data-food-source aria-label="调出州">${options(provinces.filter(p=>p.id!==targetId))}</select></label>`:''}<label>粮食数量 / 石<input data-food-amount aria-label="粮食数量" type="number" min="1" max="1000000000000" step="1" value="${Number.isFinite(amount)?amount:''}"></label></form><div data-food-preview aria-live="polite"></div><h3>${esc(target.name)}购粮额度与供粮</h3><p data-food-quota>本旬额度 ${fmt(f.purchaseLimit)} 石 · 已购 ${fmt(f.purchased)} 石 · 剩余 ${fmt(f.purchaseRemaining)} 石 · ${f.quotaLocked?'首次购买时已锁定':'首次成功购买时锁定'}</p><p class="civil-note">${last?`最近供粮：第${last.turn}旬，产粮${fmt(last.produced)}石，陈粮耗损${fmt(last.storageLoss??0)}石，需粮${fmt(last.need)}石，实际供给${fmt(last.consumed)}石，缺口${fmt(last.shortfall)}石。`:'尚无供粮结算记录。'}</p><p class="civil-note" data-grain-storage>本州安全周转储备 ${fmt(f.protectedStock)} 石（${f.protectedTurns}旬口粮）；超出部分每旬损耗8%，下旬预计陈粮损耗 ${fmt(f.storageLoss)} 石。新粮当旬不损耗，建义仓可增加安全储备，最高36旬口粮。</p><h3>各州缺粮预估</h3>${table(['州郡','实有粮 / 石','下旬产粮 / 石','口粮 / 石每旬','下旬缺口 / 石','库存可供 / 旬','可调出 / 石','灾情'],provinces.map(p=>{const q=foodForecast(p,state.turn);return [esc(p.name),fmt(q.grain),fmt(q.produced),fmt(q.need),fmt(q.shortfall),q.stockTurns===null?'无口粮压力':fmt(q.stockTurns),fmt(q.transferable),q.disaster?DISASTERS.find(([key])=>key===q.disaster.kind)[1]:'无'];}))}<p class="civil-note">缺口按当前人口、已启用开发面积和农业产出预估，已计陈粮耗损，不含未来灾害、祥瑞及人口变化。库存可供旬数只用库存除以口粮，不等于净缺粮时间。</p><details><summary>最近救济记录</summary>${state.domestic.foodRelief.history.slice(0,15).map(r=>`<p>第${r.turn}旬 · ${r.kind==='purchase'?'外部购粮':esc(state.domestic.provinces.find(p=>p.id===r.sourceId)?.name)+'调粮'} → ${esc(state.domestic.provinces.find(p=>p.id===r.targetId)?.name)} · ${fmt(r.amount)}石 · 支银${fmt(r.cost)}两</p>`).join('')||'<p>尚无救济记录。</p>'}</details></div><div class="revenue-command"><div><span data-food-cost></span><small data-food-balance></small><p role="status" data-food-status></p></div><div class="relief-command-buttons">${justCommitted?'<button type="button" data-food-continue>继续救济</button>':''}<button type="button" class="primary" data-food-execute>${justCommitted?'本次已保存':'确认并保存'}</button></div></div><div class="civil-tabs"><button data-food-tab="purchase" class="${kind==='purchase'?'active':''}">购粮拨入</button><button data-food-tab="transfer" class="${kind==='transfer'?'active':''}">州际调粮</button></div><div class="civil-footer">户部粮食救济<span>立即入仓 · 下次旬结算供粮</span></div>`;
  d.querySelector('[data-food-target]').value=targetId;const from=d.querySelector('[data-food-source]');if(from)from.value=sourceId??'';
  d.querySelector('.close').onclick=()=>d.close();
  d.querySelector('[data-return-revenue]').onclick=()=>{d.onclose=null;d.close();d.remove();onReturn(state);};
  d.querySelectorAll('[data-food-tab]').forEach(b=>b.onclick=()=>{kind=b.dataset.foodTab;justCommitted=false;message='';requestId=state.domestic.foodRelief.nextId;draw();});
  d.querySelector('[data-food-target]').onchange=e=>{targetId=e.target.value;justCommitted=false;message='';draw();};
  if(from)from.onchange=e=>{sourceId=e.target.value;justCommitted=false;message='';updateQuote();};
  d.querySelector('[data-food-amount]').oninput=e=>{amount=e.target.value===''?NaN:Number(e.target.value);justCommitted=false;message='';updateQuote();};
  d.querySelector('[data-food-continue]')?.addEventListener('click',()=>{justCommitted=false;message='';draw();});
  d.querySelector('form').onsubmit=e=>{e.preventDefault();d.querySelector('[data-food-execute]').click();};
  d.querySelector('[data-food-execute]').onclick=()=>{
   const b=d.querySelector('[data-food-execute]');if(b.disabled)return;b.disabled=true;
   try{const result=executeRelief(state,command());onCommit(result.state);state=result.state;requestId=state.domestic.foodRelief.nextId;message=result.message;justCommitted=true;draw();}
   catch(error){d.querySelector('[data-food-status]').textContent=error.message;b.disabled=false;}
  };updateQuote();
 }
 function updateQuote(){
  const button=d.querySelector('[data-food-execute]'),status=d.querySelector('[data-food-status]');
  if(justCommitted){
   const r=state.domestic.foodRelief.history[0];button.disabled=true;
   d.querySelector('[data-food-cost]').textContent=`本次支出${fmt(r.cost)}两 · 已保存`;
   d.querySelector('[data-food-balance]').textContent=`执行后国库${fmt(r.treasuryAfter)}两`;
   d.querySelector('[data-food-preview]').innerHTML=`<h3>已执行</h3><p>调入州存粮 ${fmt(r.targetBefore)} → ${fmt(r.targetAfter)} 石。</p>${r.sourceId?`<p>调出州存粮 ${fmt(r.sourceBefore)} → ${fmt(r.sourceAfter)} 石；运费0两，损耗0石。</p>`:''}`;
   status.textContent=message;return;
  }
  try{const q=quoteRelief(state,command());button.disabled=justCommitted||!q.canAfford;d.querySelector('[data-food-cost]').textContent=`支银${fmt(q.cost)}两 · 成功消耗1体力`;
   d.querySelector('[data-food-balance]').textContent=`执行后国库${fmt(q.treasuryAfter)}两`;
   d.querySelector('[data-food-preview]').innerHTML=`<h3>执行后预估</h3><p>调入州存粮 ${fmt(q.targetBefore)} → ${fmt(q.targetAfter)} 石；下旬预计缺口 ${fmt(q.shortfallBefore)} → ${fmt(q.shortfallAfter)} 石。</p>${q.sourceId?`<p>调出州存粮 ${fmt(q.sourceBefore)} → ${fmt(q.sourceAfter)} 石；须留 ${fmt(q.sourceForecast.retain)} 石，最多可调 ${fmt(q.sourceForecast.transferable)} 石。运费0两，损耗0石。</p>`:''}`;
   status.textContent=!q.canAfford?'国库不足，请减少购粮数量':message||'请核对数量，确认后立即入仓并保存。';
  }catch(error){button.disabled=true;d.querySelector('[data-food-cost]').textContent='请核对本次救济';d.querySelector('[data-food-balance]').textContent='';d.querySelector('[data-food-preview]').innerHTML='';status.textContent=message?`${message} ${error.message}`:error.message;}
 }
 draw();d.showModal();return d;
}
