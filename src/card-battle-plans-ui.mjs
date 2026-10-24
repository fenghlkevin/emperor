import {battlePlans,saveBattlePlan,deleteBattlePlan} from './card-battle-plan-data.mjs';
import {inspectBattlePlan} from './card-battle-plans.mjs';
import {commitOperation} from './operation-result.mjs';
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function openBattlePlans({kind,getState,commit,formation,onLoad}){
 const d=document.createElement('dialog');d.className='cb-deck-dialog cb-plans-dialog';d.setAttribute('aria-label','常用军阵方案');document.body.append(d);let selected=null,name='',notice='';
 function act(fn){try{fn();}catch(e){notice=e.message;}draw();}
 function persist(next){commitOperation(commit,next);}
 function draw(){
  const plans=battlePlans(getState(),kind),inspection=selected===null?null:inspectBattlePlan(getState(),kind,selected,formation);
  d.innerHTML=`<header><div><small>${kind==='campaign'?'出征':'守城'} · 常用军阵</small><h2>常用方案</h2><p>保存布阵与计策选择。载入先核对当前兵员、装备与将领，不提前扣费。</p></div><button data-plans-close>关闭 ×</button></header><nav><label>方案名称 <input data-plan-name maxlength="40" value="${esc(name)}" aria-label="方案名称"></label><button data-plan-save>另存当前草案</button><button data-plan-overwrite ${selected===null?'disabled':''}>覆盖选中方案</button><button data-plan-delete ${selected===null?'disabled':''}>删除选中方案</button></nav><p role="status" data-plan-status>${esc(notice)}</p><section class="cb-plan-list">${plans.map(p=>`<button data-plan-id="${p.id}" aria-pressed="${p.id===selected}">${esc(p.name)} · ${p.formation.squads.length}子队 · ${p.formation.cardTactics?'自选计策':'自动计策'}</button>`).join('')||'<p>尚无常用方案，可先保存当前草案。</p>'}</section>${inspection?`<section class="cb-deck-statistics"><h3>${esc(inspection.name)}</h3>${inspection.errors.length?`<ul>${inspection.errors.map(e=>`<li>${esc(e)}</li>`).join('')}</ul>`:'<p>当前兵员、装备、来源与将领校验通过。载入后仍需核阅落印。</p>'}<button data-plan-load ${inspection.errors.length?'disabled':''}>载入到草案</button></section>`:''}<footer>最多保存20个方案。方案随本次游戏存档保存；不保存军令、伤害、牌序或临时人物副本。</footer>`;
  d.querySelector('[data-plans-close]').onclick=()=>d.close();d.querySelector('[data-plan-name]').oninput=e=>name=e.target.value;
  for(const el of d.querySelectorAll('[data-plan-id]'))el.onclick=()=>{selected=Number(el.dataset.planId);name=plans.find(p=>p.id===selected).name;notice='';draw();};
  d.querySelector('[data-plan-save]').onclick=()=>act(()=>{persist(saveBattlePlan(getState(),{name,kind,formation}));notice='已保存当前草案。';});
  d.querySelector('[data-plan-overwrite]').onclick=()=>act(()=>{persist(saveBattlePlan(getState(),{id:selected,name,kind,formation}));notice='已覆盖选中方案。';});
  d.querySelector('[data-plan-delete]').onclick=()=>act(()=>{persist(deleteBattlePlan(getState(),selected));selected=null;name='';notice='已删除方案。';});
  d.querySelector('[data-plan-load]')?.addEventListener('click',()=>{try{const latest=inspectBattlePlan(getState(),kind,selected,formation);if(latest.errors.length){notice=latest.errors.join('；');draw();return;}onLoad(latest.formation);d.close();}catch(e){notice=e.message;draw();}});
 }
 d.addEventListener('close',()=>d.remove(),{once:true});draw();d.showModal();return d;
}
