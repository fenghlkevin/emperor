import {inviteEnvoy,arrivedEnvoy} from './envoy-visits.mjs';
import {holdRitual,RITUAL_COST} from './disasters.mjs';
import {ritualReport} from './ritual-ui.mjs';
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function openEnvoyPlanner(initial,root,onCommit,onClose){
 let state=initial,tab='envoy',selected='',receipt=null;
 const d=document.createElement('dialog');d.className='domestic-dialog ink-mode revenue-dialog general-dialog rites-planner-dialog';d.setAttribute('aria-label','礼部奏请外交');root.append(d);d.onclose=()=>{d.remove();onClose?.();};
 function draw(){
  const countries=state.domestic.countries.filter(c=>c.id!==state.domestic.playerCountryId&&c.provinceIds.length),v=state.envoyVisit;
  if(v)selected=v.countryId;
  if(!countries.some(c=>c.id===selected))selected=countries[0]?.id||'';
  const country=countries.find(c=>c.id===selected),visitor=state.domestic.countries.find(c=>c.id===v?.countryId);
  if(receipt){
   d.innerHTML=`<article class="general-receipt edict-page ink-scroll"><header class="general-result-header"><span>礼部 / 奉旨回执</span><button data-close aria-label="关闭回执">×</button></header><div class="general-result-content"><div class="general-result-heading"><div class="general-receipt-seal" aria-hidden="true">礼</div><div><span class="general-result-status">奉旨办理 · 已保存</span><h1>${esc(receipt.title)}</h1></div></div><section class="general-result-details" aria-label="执行结果"><p role="status">${esc(receipt.message)}</p></section></div><footer class="general-receipt-actions"><button data-close>返回朝堂</button><button class="primary" data-continue>继续礼部议事 →</button></footer></article>`;
   d.querySelectorAll('[data-close]').forEach(b=>b.onclick=()=>d.close());d.querySelector('[data-continue]').onclick=()=>{receipt=null;draw();};return;
  }
  const ritual=tab==='ritual',active=state.domestic.disasters.ritualUntil>state.turn;
  const itinerary=v?`${esc(visitor.name)}使臣${arrivedEnvoy(state)?'已抵京，请退朝后前往礼明殿接见。':'将于下一旬抵京，请先结束本旬。'}`:'本旬发出国书，下一旬使臣抵达；退朝后前往礼明殿会面。';
  d.innerHTML=`<header class="civil-header general-header"><div class="general-brand"><span class="general-seal">礼部<br>尚书</span><div><small>典礼祀事 · 通使修好</small><h1>礼部议事</h1></div></div><div class="general-header-end">国库 <b>${state.stats.treasury.toLocaleString('zh-CN')}</b> 两<button class="close" aria-label="关闭">×</button></div></header><nav class="general-nav" aria-label="礼部事项"><button data-rites-tab="envoy" ${!ritual?'aria-current="page"':''}><span>使</span>遣使通邦</button><button data-rites-tab="ritual" ${ritual?'aria-current="page"':''}><span>祀</span>祭祀祈福</button><p>修礼明德<br>协和万邦</p></nav><div class="general-body ink-scroll"><div class="general-page-heading"><h2>${ritual?'祭祀祈福':'遣使通邦'}</h2><p>选择事项 · 核阅旨意 · 奉旨办理</p></div><div class="general-workspace"><form id="rites-planner-command" class="general-main">${ritual?ritualReport(state):`<div class="general-section-title"><small>通使 · 外交国家</small><h3>选择通邦之国</h3><p>点击国家查看本次国书，再于右侧确认颁发。</p></div><div class="rites-country-list" role="group" aria-label="选择外交国家">${countries.map(c=>`<button type="button" ${v?'disabled':''} data-country="${esc(c.id)}" aria-pressed="${selected===c.id}"><strong>${esc(c.name)}</strong><small>${c.provinceIds.length} 州 <span>${selected===c.id?'已选定':'选择 →'}</span></small></button>`).join('')||'<p>暂无可邀请国家。</p>'}</div>`}</form><aside class="general-detail"><div class="general-section-title"><small>拟定旨意</small><h3>${ritual?'祭祀确认':'国书确认'}</h3><p>核阅本次安排后颁旨执行</p></div><div class="general-preview" data-preview aria-live="polite">${ritual?`举行祭祀，支出 ${RITUAL_COST.toLocaleString('zh-CN')} 两；未来12旬本国各城灾害概率降低40%。`:v?itinerary:country?`向${esc(country.name)}颁发国书，邀请使臣下一旬入京。`:'暂无可邀请国家。'}</div><p role="status" data-status>${ritual?(active?'祈福生效中，无需重复举行。':'确认后执行并自动保存。'):itinerary}</p><button class="primary" type="submit" form="rites-planner-command" data-execute ${ritual?active?'disabled':'':v||!country?'disabled':''}>${ritual?'举行祭祀 · 1,200 两':v?'已登记使臣行程':'颁发国书'}</button><p class="general-note">${ritual?'祈福效果不叠加':'国书颁发后，使臣下一旬抵京'}<br>奉旨办理 · 自动存档</p></aside></div></div><div class="civil-footer">礼部 · 典礼通使册<span>宣政殿奏事 · 礼明殿会宾</span></div>`;
  d.querySelector('.close').onclick=()=>d.close();
  d.querySelectorAll('[data-rites-tab]').forEach(b=>b.onclick=()=>{tab=b.dataset.ritesTab;draw();});
  d.querySelectorAll('[data-country]').forEach(b=>b.onclick=()=>{selected=b.dataset.country;draw();d.querySelector(`[data-country="${selected}"]`)?.focus();});
  d.querySelector('form').onsubmit=e=>{e.preventDefault();const button=d.querySelector('[data-execute]');if(button.disabled)return;button.disabled=true;try{const result=ritual?holdRitual(state):{state:inviteEnvoy(state,selected),message:`已向${country.name}颁发国书。使臣将于下一旬抵京，请退朝后前往礼明殿接见。`};onCommit(result.state);state=result.state;receipt={title:ritual?'祭祀礼成':'国书已颁',message:result.message+'，已保存。'};draw();}catch(error){d.querySelector('[data-status]').textContent=error.message;button.disabled=false;}};
 }
 draw();d.showModal();return d;
}
