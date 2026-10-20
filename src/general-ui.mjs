import {commitOperation} from './operation-result.mjs';
import {compactHeaderNavigation} from './compact-header-nav.mjs';
const generalTabs=GENERAL_TABS.filter(([id])=>id!=='transfer');
import {ENABLED_KITS,worldKitDepot} from './troop-kit-world.mjs';
import {TROOP_KITS} from './troop-kits.mjs';
import {GENERAL_TABS,quoteGeneral,executeGeneral,centralTrainingEffect} from './general.mjs';
import {militarySummary} from './military.mjs';
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fmt=n=>n.toLocaleString('zh-CN');
export function openGeneral(initial,root,onCommit,onClose){
 let state=initial,tab='train',receipt=null,id=initial.domestic.general.nextId;
 const d=document.createElement('dialog');d.className='domestic-dialog ink-mode revenue-dialog general-dialog';d.setAttribute('aria-label','大将军军务');root.append(d);d.onclose=()=>{d.remove();onClose?.();};
 const seals={train:'练',ongoing:'训',security:'卫',transfer:'调'};
 const provinces=()=>state.domestic.provinces.filter(p=>p.countryId===state.domestic.playerCountryId);
 function command(){return {id,kind:tab,enabled:d.querySelector('[data-enabled]')?.checked,};}
 function draw(){
  const a=state.domestic.centralArmy,g=state.domestic.general,capital=provinces().find(p=>p.id===g.capitalProvinceId),summary=militarySummary(state.domestic);
  if(receipt){
   const rows=receipt.lines.map(line=>{const match=line.match(/^(.+?)[：:]\s*(\d+)\s*→\s*(\d+)(.*)$/);return match?`<li class="general-result-metric"><span>${esc(match[1])}</span><div><del>${match[2]}</del><span class="general-result-arrow">→</span><strong>${match[3]}</strong><b>+${Number(match[3])-Number(match[2])}</b></div><small>${esc(match[4]||'即时生效')}</small></li>`:`<li>${esc(line)}</li>`;}).join('');
   d.innerHTML=`<article class="general-receipt edict-page ink-scroll"><header class="general-result-header"><span>大将军府 / 军令回执</span><button data-close aria-label="关闭回执">×</button></header><div class="general-result-content"><div class="general-result-heading"><div class="general-receipt-seal" aria-hidden="true">令</div><div><span class="general-result-status">军令已执行</span><h1>${esc(receipt.title)}</h1><p class="general-receipt-intro">军令已下，诸军奉行。</p></div></div><section class="general-result-details" aria-label="执行结果"><h2>执行结果 <span>即时生效</span></h2><ul>${rows}</ul></section><div class="general-result-record"><span>军令第 ${receipt.id} 号</span><span>已入军务册 · 已自动保存</span></div></div><footer class="general-receipt-actions"><button data-close>返回朝堂</button><button class="primary" data-continue>继续军务 <span>→</span></button></footer></article>`;
   d.querySelector('[data-continue]').onclick=()=>{receipt=null;id=state.domestic.general.nextId;draw();};d.querySelectorAll('[data-close]').forEach(b=>b.onclick=()=>d.close());return;
  }
  const descriptions={train:`基础训练10点，按当前大将军能力预计提高${centralTrainingEffect(state.domestic,10).gain}点，最终最高100。确认前核对实际增量。`,ongoing:`开启后按当前大将军能力每旬预计提高${centralTrainingEffect(state.domestic,2).gain}点，并维持既定训练保底，最终最高100。无中央士兵时自动停止。`,security:`派中央士兵检视京城内外，将${capital.name}的治安值提高10，最高100。`,transfer:'将中央士兵和军备拨入本国地方。可单独调兵或调军备；跨州调兵同步迁移军籍人口，全国总人口和兵员保持不变。'};
  const gear=worldKitDepot(state.domestic,'central').stock,arms=TROOP_KITS.filter(k=>ENABLED_KITS.includes(k.id)).map(k=>[k.id,k.name+'装备','人份']);
  let form='';
  if(tab==='ongoing')form=`<label class="general-toggle"><input type="checkbox" data-enabled ${g.ongoing?'':'checked'}>开启长期训练<span>每旬精进，常备不懈</span></label><p>当前计划：${g.ongoing?'已开启':'已停止'}${g.ongoing?` · 维持训练值至少 ${g.trainingFloor}`:''}</p>`;

  const title=GENERAL_TABS.find(([k])=>k===tab)[1];

  d.innerHTML=`<header class="civil-header general-header"><div class="general-brand"><span class="general-seal">大将<br>军府</span><div><small>中枢军务 · 统领诸军</small><h1>整军经武</h1></div></div><div class="general-header-end">全国兵员 <b>${fmt(summary.soldiers)}</b> 人<button class="close" aria-label="关闭">×</button></div></header><nav class="general-nav" aria-label="军务事项">${generalTabs.map(([k,n])=>`<button data-general-tab="${k}" ${tab===k?'aria-current="page"':''}><span>${seals[k]}</span>${n}</button>`).join('')}<p>修我戈矛<br>与子同仇</p></nav><div class="general-body ink-scroll"><div class="general-overview"><span>中央士兵 <b>${fmt(a.soldiers)}<i> 人</i></b></span><span>训练值 <b>${a.training}<i> / 100</i></b></span><span>京城治安 <b>${capital.welfare.security}<i> / 100</i></b></span><span>长期训练 <b>${g.ongoing?'已开启':'已停止'}</b></span></div><div class="general-workspace"><form class="general-main"><div class="general-section-title"><small>军务 · ${seals[tab]}</small><h3>${tab==='transfer'?'兵甲调拨':title}</h3><p>${descriptions[tab]}</p></div>${form}</form><aside class="general-detail"><div class="general-section-title"><small>拟定军令</small><h3>军令确认</h3><p>核阅本次变更后颁令执行</p></div><div class="general-preview" data-preview aria-live="polite"></div><p role="status" data-status></p><button class="primary" data-execute>颁令执行</button><details class="general-kit-stock"><summary>中央军备参考</summary>${arms.map(([k,n,u])=>`<div><span>${n}</span><b>${fmt(gear[k])}<small> ${u}</small></b></div>`).join('')}</details><p class="general-note">军令即时生效 · 自动存档<br>本次军务不扣国库</p></aside></div></div><div class="civil-footer">大将军府 · 军务册<span>中央统军 · 地方协防</span></div>`;
  d.querySelector('.close').onclick=()=>d.close();d.querySelector('form').onsubmit=e=>{e.preventDefault();d.querySelector('[data-execute]').click();};
  d.querySelector('.general-nav>p')?.remove();compactHeaderNavigation(d,'.general-nav');
  d.querySelector('.general-header').append(d.querySelector('.general-header-end'));
  d.querySelectorAll('[data-general-tab]').forEach(b=>b.onclick=()=>{if(!generalTabs.some(([id])=>id===b.dataset.generalTab))throw Error('资源调拨由兵部核办');tab=b.dataset.generalTab;id=state.domestic.general.nextId;draw();});
  d.querySelectorAll('.general-body input,.general-body select').forEach(el=>{el.oninput=preview;el.onchange=preview;});
  d.querySelector('[data-execute]').onclick=()=>{const b=d.querySelector('[data-execute]');if(b.disabled)return;b.disabled=true;try{const result=executeGeneral(state,command());commitOperation(onCommit,result.state);state=result.state;d.close();}catch(e){d.querySelector('[data-status]').textContent=e.message;b.disabled=false;}};
  preview();
 }
 function preview(){const b=d.querySelector('[data-execute]');try{const c=command(),q=quoteGeneral(state,c);d.querySelector('[data-preview]').textContent=q.lines.join('；');d.querySelector('[data-status]').textContent='确认后立即执行并自动保存。';b.disabled=false;}catch(e){b.disabled=true;d.querySelector('[data-status]').textContent=e.message;d.querySelector('[data-preview]').textContent='';}}
 draw();d.showModal();return d;
}
