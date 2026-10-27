import {tacticDefinitions,tacticCopyLimit,normalizeTacticSelection} from './card-battle-tactics.mjs';
import {cardText} from './card-battle.mjs';
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function openTacticDraft(defaultBattle,selection,onApply){
 const defaults={};for(const x of Object.values(defaultBattle.cards.catalog))if(x.side==='home'&&x.type==='tactic'&&x.definitionId!=='coin')defaults[x.definitionId]=(defaults[x.definitionId]??0)+1;
 const slots=Object.values(defaults).reduce((a,b)=>a+b,0),limit=tacticCopyLimit(slots),d=document.createElement('dialog');d.className='cb-deck-dialog cb-tactic-dialog';d.setAttribute('aria-label','计策配牌');document.body.append(d);
 let automatic=selection===undefined,counts=structuredClone(selection?.counts??defaults);
 function draw(){
  d.innerHTML=`<header><div><small>出征草案 · 计策配牌</small><h2>为本场选择${slots}张计策</h2><p>每种最多${limit}张。部队与人物由布阵决定；调兵令是后手额外牌。此处不扣军粮、不占用装备。</p></div><button data-tactic-cancel>取消 ×</button></header><nav><button data-tactic-auto>使用自动配置</button><span data-tactic-mode>${automatic?'自动配置':'自选计策'}</span></nav><p data-tactic-status role="status"></p><main class="cb-tactic-grid">${Object.values(tacticDefinitions).map(x=>`<label class="cb-tactic-option"><strong>${esc(x.name)} · ${x.cost}费</strong><p>${esc(cardText(x))}</p><span>张数 <input type="number" inputmode="numeric" min="0" max="${limit}" step="1" value="${esc(counts[x.id]??0)}" data-tactic-count="${x.id}" aria-label="${esc(x.name)}张数"></span></label>`).join('')}</main><footer><button data-tactic-apply>应用到草案</button><p>只修改本次草案。落印时按当前部队、人物与库存重新校验。</p></footer>`;
  d.querySelector('[data-tactic-cancel]').onclick=()=>d.close();
  d.querySelector('[data-tactic-auto]').onclick=()=>{automatic=true;counts=structuredClone(defaults);draw();};
  for(const input of d.querySelectorAll('[data-tactic-count]'))input.oninput=()=>{counts[input.dataset.tacticCount]=input.value===''?NaN:Number(input.value);automatic=false;update();};
  d.querySelector('[data-tactic-apply]').onclick=()=>{try{const normalized=normalizeTacticSelection({version:1,counts},slots);onApply(automatic?undefined:normalized);d.close();}catch(e){d.querySelector('[data-tactic-status]').textContent=e.message;}};
  update();
 }
 function update(){
  const total=Object.values(counts).reduce((n,x)=>n+x,0);let error='';
  try{normalizeTacticSelection({version:1,counts},slots);}catch(e){error=e.message;}
  d.querySelector('[data-tactic-status]').textContent=`已配 ${Number.isFinite(total)?total:'待核'} / ${slots}张`+(error?' · '+error:' · 可应用');
  d.querySelector('[data-tactic-apply]').disabled=!!error;d.querySelector('[data-tactic-mode]').textContent=automatic?'自动配置':'自选计策';
 }
 d.addEventListener('close',()=>d.remove(),{once:true});draw();d.showModal();return d;
}
