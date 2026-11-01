import {setQuantityLimits} from './quantity-controls.mjs';
import {militaryTroopArt,militaryScene} from './military-art.mjs';
import {TROOP_KITS} from './troop-kits.mjs';
import {worldKitSummary} from './troop-kit-world.mjs';
import {planCentralTransfers} from './central-military-transfers.mjs';
import {commitOperation} from './operation-result.mjs';
import {militaryPage} from './military-page.mjs';
import {courtBlock} from './emperor.mjs';
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function openCentralTransfers(state,root,onCommit,onClose,options={}){
 let direction=options.direction??'out',drafts={},stage='draft',command=null,busy=false,error='';
 const d=document.createElement('dialog');d.className='court-play-dialog court-personnel court-garrison central-transfers';root.append(d);d.onclose=()=>{d.remove();onClose?.();};
 const rows=worldKitSummary(state.domestic),central=rows.find(r=>r.id==='central'),locals=rows.filter(r=>r.id!=='central');
 const draft=id=>drafts[id]??={selected:false,soldiers:0,quantities:{}};
 const read=()=>({id:state.domestic.troopKits.nextId,direction,rows:locals.filter(r=>draft(r.id).selected).map(r=>({provinceId:r.id,soldiers:draft(r.id).soldiers,quantities:{...draft(r.id).quantities}}))});
 function draw(){
 let preview;try{preview=planCentralTransfers(state,read());}catch{}
 d.innerHTML=`<header class="personnel-scene-header"><div><h1>兵员与军备调拨</h1></div><button data-transfer-close>关闭</button></header><div class="personnel-scene-body"><section class="personnel-scene-main"><div class="transfer-direction"><button data-transfer-direction="out" aria-pressed="${direction==='out'}">中央下发地方</button><button data-transfer-direction="in" aria-pressed="${direction==='in'}">地方收归中央</button></div><div class="garrison-map-frame transfer-list">${stage==='confirm'?`<section class="military-review">${militaryScene('transfer')}<h2>调拨核定</h2>${preview.lines.map(l=>`<p>${esc(l)}</p>`).join('')}</section>`:locals.map(row=>{const v=draft(row.id),available=direction==='out'?central:row;return `<details data-transfer-row="${row.id}" ${v.selected?'open':''}><summary>${militaryTroopArt('infantry')}<label><input type="checkbox" data-transfer-select="${row.id}" ${v.selected?'checked':''}>${esc(row.name)}</label><small>地方空闲兵员 ${row.soldiers.available} · 可用装备 ${Object.values(row.kits).reduce((n,k)=>n+k.available,0)} 人份</small></summary><button data-transfer-fill="${row.id}">${direction==='out'?'按驻军缺口补装':'收回富余装备'}</button><div class="transfer-fields"><label class="transfer-troop-card">${militaryTroopArt('infantry')}<span>兵员 / 人</span><input type="number" min="0" step="1" data-transfer-amount="soldiers" data-province="${row.id}" aria-label="${esc(row.name)}调拨兵员" value="${v.soldiers}"><small>来源可用 ${available.soldiers.available}</small></label>${TROOP_KITS.map(k=>`<label class="transfer-troop-card">${militaryTroopArt(k.id)}<span>${k.name}</span><input type="number" min="0" step="1" data-transfer-amount="${k.id}" data-province="${row.id}" aria-label="${esc(row.name)}${k.name}调拨数量" value="${v.quantities[k.id]??0}"><small>来源可用 ${available.kits[k.id].available}</small></label>`).join('')}</div></details>`;}).join('')}</div></section><aside class="personnel-scene-side"><div class="personnel-scene-detail">${militaryScene('transfer')}<small class="court-kicker">大将军 · 中央调度</small><h2>${direction==='out'?'下发地方':'收归中央'}</h2><p data-military-fact>中央空闲兵员 ${central.soldiers.available} 人</p><p data-military-fact>中央可用装备 ${Object.values(central.kits).reduce((n,k)=>n+k.available,0)} 人份</p><p data-military-fact>勾选多个州，直接填写兵员与各兵种装备，可单独调兵、调装或一同调拨。</p><p data-military-fact>出战占用不可调拨；地方军队须收回中央后才能解散。</p><p data-military-fact data-transfer-summary aria-live="polite"></p></div><footer class="personnel-decision">${stage==='confirm'?'<button data-transfer-edit>返回调整</button><button class="court-vermilion" data-transfer-seal>落印发令</button>':'<button class="court-vermilion" data-transfer-review>核定全部调拨 →</button>'}<p role="status" data-transfer-error>${esc(error)}</p></footer></aside></div>`;
 const update=()=>{try{const q=planCentralTransfers(state,read()),n=read().rows.length;d.querySelector('[data-transfer-summary]').textContent=`共 ${n} 州 · 调拨后中央空闲兵员 ${worldKitSummary(q.state.domestic)[0].soldiers.available} 人`;d.querySelector('[data-transfer-review]')?.removeAttribute('disabled');}catch(e){d.querySelector('[data-transfer-summary]').textContent=e.message;const b=d.querySelector('[data-transfer-review]');if(b)b.disabled=true;}};
 d.querySelector('[data-transfer-close]').onclick=()=>d.close();
 d.querySelectorAll('[data-transfer-direction]').forEach(b=>{b.disabled=stage==='confirm';b.onclick=()=>{direction=b.dataset.transferDirection;drafts={};error='';draw();};});
 d.querySelectorAll('[data-transfer-select]').forEach(i=>i.onchange=()=>{draft(i.dataset.transferSelect).selected=i.checked;d.querySelector(`[data-transfer-row="${i.dataset.transferSelect}"]`).open=i.checked;update();});
 d.querySelectorAll('[data-transfer-amount]').forEach(i=>i.oninput=()=>{const v=draft(i.dataset.province),n=i.value===''?NaN:Number(i.value);if(i.dataset.transferAmount==='soldiers')v.soldiers=n;else v.quantities[i.dataset.transferAmount]=n;v.selected=true;d.querySelector(`[data-transfer-select="${i.dataset.province}"]`).checked=true;update();});
 d.querySelectorAll('[data-transfer-fill]').forEach(b=>b.onclick=()=>{
 const row=locals.find(r=>r.id===b.dataset.transferFill),v=draft(row.id);v.selected=true;v.quantities={};
 let needed=direction==='out'?Math.max(0,row.soldiers.available+(Number.isSafeInteger(v.soldiers)?v.soldiers:0)-Object.values(row.kits).reduce((n,k)=>n+k.available,0)):Math.max(0,Object.values(row.kits).reduce((n,k)=>n+k.available,0)-Math.max(0,row.soldiers.available-(Number.isSafeInteger(v.soldiers)?v.soldiers:0)));
 for(const k of TROOP_KITS){
  const others=locals.filter(r=>r.id!==row.id&&draft(r.id).selected).reduce((n,r)=>n+(draft(r.id).quantities[k.id]||0),0);
  const available=direction==='out'?Math.max(0,central.kits[k.id].available-others):row.kits[k.id].available;
  const n=Math.min(needed,available);v.quantities[k.id]=n;needed-=n;
 }
 error=needed?`尚缺装备 ${needed} 人份，请由户部采办或手动调整。`:'';draw();
 });
 d.querySelector('[data-transfer-review]')?.addEventListener('click',()=>{try{const reason=courtBlock(state);if(reason)throw Error(reason);command=read();planCentralTransfers(state,command);stage='confirm';error='';draw();}catch(e){d.querySelector('[data-transfer-error]').textContent=e.message;}});
 d.querySelector('[data-transfer-edit]')?.addEventListener('click',()=>{stage='draft';draw();});
 d.querySelector('[data-transfer-seal]')?.addEventListener('click',()=>{if(busy)return;busy=true;try{const reason=courtBlock(state);if(reason)throw Error(reason);commitOperation(onCommit,planCentralTransfers(state,command).state);d.close();}catch(e){d.querySelector('[data-transfer-error]').textContent=e.message;busy=false;}});
 militaryPage(d,'兵员与军备调拨');
 setQuantityLimits(d,input=>{
  if(!input.matches('[data-transfer-amount]'))return;
  const id=input.dataset.province,key=input.dataset.transferAmount,row=direction==='out'?central:locals.find(r=>r.id===id);
  const stock=key==='soldiers'?row.soldiers.available:row.kits[key].available;
  const others=direction==='out'?locals.filter(r=>r.id!==id&&draft(r.id).selected).reduce((n,r)=>n+((key==='soldiers'?draft(r.id).soldiers:draft(r.id).quantities[key])||0),0):0;
  return Math.max(0,stock-others);
 });update();
 }
 draw();d.showModal();return d;
}
