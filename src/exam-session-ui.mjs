import {openHistoricalProfile} from './historical-profile-ui.mjs';
import {officialArt,officialAvatar} from './official-art.mjs';
const esc=s=>String(s??'—').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const stats=[['politics','政务'],['leadership','统率'],['intelligence','智力'],['martial','武力'],['integrity','清廉'],['loyalty','忠诚'],['age','年龄'],['experience','经验']];

export function openExamSession(state,root,onSelect,onClose){
 const people=[...state.domestic.personnel.candidates];
 const dialog=document.createElement('dialog');
 dialog.className='pm-picker exam-session';dialog.setAttribute('aria-label','制举候选人才');
 const selectedIds=new Set();
 let edictOpen=false;
 let completed=false,cleaned=false,focusedId=null,page=0,query='',sort='';
 dialog.innerHTML=`<header class="pm-picker-header"><div><small>吏部 · 制举选才</small><h2>请陛下择才录用</h2><p>点击人物查看才干，点击下方姓名选择录用；也可打开名册勾选多人。</p></div><div><button data-exam-roster aria-expanded="false" aria-controls="exam-roster">☷ 名册</button><button data-picker-close aria-label="放弃本届并关闭">×</button></div></header><div class="exam-content"><section class="exam-main" aria-label="候选人物"><div class="exam-stage" data-exam-stage></div><nav class="exam-pagination" aria-label="人物翻页"><button data-picker-prev>‹ 上一排</button><span data-picker-page></span><button data-picker-next>下一排 ›</button></nav><section class="exam-detail" data-exam-detail aria-label="人物详情"></section></section><aside id="exam-roster" class="exam-roster" hidden aria-label="候选名册"><header><h3>候选名册</h3><button data-roster-close aria-label="收起名册">×</button></header><div class="exam-filters"><label>查找人才<input data-picker-query type="search" placeholder="输入姓名或文武类型"></label><label>排序<select data-picker-sort><option value="">名册原序</option>${stats.map(([k,n])=>`<option value="${k}">${n}从高到低</option>`).join('')}</select></label></div><div class="exam-table-wrap" data-exam-table></div><footer class="exam-roster-footer"><span>勾选与人物同步 · 可同时录用多人</span><button data-roster-done>确定选择</button></footer></aside></div><footer class="pm-picker-footer"><button data-exam-selected>尚未选择人才</button><span data-picker-count role="status" aria-live="polite"></span><div><button data-picker-cancel>放弃本届</button><button class="exam-confirm" data-exam-confirm disabled>确认录用</button></div></footer>`;
 root.append(dialog);
 const choose=id=>{focusedId=id;if(selectedIds.has(id))selectedIds.delete(id);else selectedIds.add(id);const index=people.findIndex(o=>o.id===id);page=Math.floor(index/6);render();};
 const render=()=>{
  const pages=Math.max(1,Math.ceil(people.length/6));page=Math.max(0,Math.min(page,pages-1));
  dialog.querySelector('[data-exam-stage]').innerHTML=people.slice(page*6,page*6+6).map(o=>`<div class="exam-person ${selectedIds.has(o.id)?'is-selected':''}" data-exam-person="${esc(o.id)}" ><img tabindex="0" role="button" data-exam-preview="${esc(o.id)}" aria-label="查看${esc(o.name)}才干" src="${esc(officialArt(o)?.full)}" alt="${esc(o.name)}立绘"><span role="button" tabindex="0" data-exam-choose="${esc(o.id)}" aria-pressed="${selectedIds.has(o.id)}" title="选择或取消录用">${selectedIds.has(o.id)?'✓ ':''}${esc(o.name)}</span><small>${esc(o.role??'本朝新秀')}</small></div>`).join('');
  dialog.querySelector('[data-picker-page]').textContent=`第 ${page+1} / ${pages} 页 · 共 ${people.length} 人`;
  dialog.querySelector('[data-picker-prev]').disabled=page===0;dialog.querySelector('[data-picker-next]').disabled=page===pages-1;
  const person=people.find(o=>o.id===focusedId)??people[page*6];
  dialog.querySelector('[data-exam-detail]').innerHTML=person?`<div class="exam-identity"><button class="exam-profile-avatar" data-exam-profile="${esc(person.id)}" aria-label="查看${esc(person.name)}人物详情"><img src="${esc(officialAvatar(person))}" alt=""></button><div><h3><button class="exam-profile-name" data-exam-profile="${esc(person.id)}" title="查看人物详情">${esc(person.name)}</button></h3><span>${esc(person.role??'本朝新秀')}</span><p>年龄 ${esc(person.age)} · 经验 ${esc(person.experience)}</p></div></div><dl>${stats.slice(0,6).map(([k,n])=>`<div><dt>${n}</dt><dd>${esc(person[k])}</dd></div>`).join('')}</dl>`:'<p>点击上方人物，查看才干并选择录用人选。</p>';
  let rows=people.filter(o=>`${o.name} ${o.role??''}`.includes(query));
  if(sort)rows=rows.toSorted((a,b)=>(b[sort]??-1)-(a[sort]??-1));
  dialog.querySelector('[data-exam-table]').innerHTML=`<table><thead><tr><th>选择</th><th>姓名</th>${stats.map(([,n])=>`<th>${n}</th>`).join('')}</tr></thead><tbody>${rows.map(o=>`<tr class="${selectedIds.has(o.id)?'is-selected':''}"><td><input type="checkbox" data-exam-check="${esc(o.id)}" aria-label="选择${esc(o.name)}" ${selectedIds.has(o.id)?'checked':''}></td><th><button data-exam-locate="${esc(o.id)}"><img src="${esc(officialAvatar(o))}" alt="">${esc(o.name)}</button></th>${stats.map(([k])=>`<td>${esc(o[k])}</td>`).join('')}</tr>`).join('')||'<tr><td colspan="10">没有符合条件的人才</td></tr>'}</tbody></table>`;
  dialog.querySelector('[data-exam-selected]').textContent=selectedIds.size?`已选 ${selectedIds.size} 人 · 查看`:'尚未选择人才';
  dialog.querySelector('[data-exam-selected]').disabled=!selectedIds.size;
  dialog.querySelector('[data-exam-confirm]').disabled=!selectedIds.size;
  dialog.querySelectorAll('[data-exam-preview]').forEach(b=>b.onclick=()=>{focusedId=b.dataset.examPreview;render();});
  dialog.querySelectorAll('[data-exam-choose]').forEach(b=>b.onclick=()=>choose(b.dataset.examChoose));
  dialog.querySelectorAll('[data-exam-preview],[data-exam-choose]').forEach(b=>b.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();b.click();}});
  dialog.querySelectorAll('[data-exam-profile]').forEach(b=>b.onclick=e=>{e.stopPropagation();const p=people.find(o=>o.id===b.dataset.examProfile);openHistoricalProfile(p.id,root,p);});
  dialog.querySelectorAll('[data-exam-check]').forEach(b=>b.onchange=()=>choose(b.dataset.examCheck));
  dialog.querySelectorAll('[data-exam-locate]').forEach(b=>b.onclick=()=>{focusedId=b.dataset.examLocate;page=Math.floor(people.findIndex(o=>o.id===focusedId)/6);render();const p=people.find(o=>o.id===focusedId);openHistoricalProfile(p.id,root,p);});
 };
 const roster=show=>{dialog.querySelector('.exam-roster').hidden=!show;dialog.classList.toggle('has-roster',show);dialog.querySelector('[data-exam-roster]').setAttribute('aria-expanded',String(show));if(show)dialog.querySelector('[data-picker-query]').focus();else dialog.querySelector('[data-exam-roster]').focus();};
 dialog.querySelector('[data-exam-roster]').onclick=()=>roster(dialog.querySelector('.exam-roster').hidden);
 dialog.querySelector('[data-roster-close]').onclick=()=>roster(false);
 dialog.querySelector('[data-roster-done]').onclick=()=>roster(false);
 dialog.querySelector('[data-picker-query]').oninput=e=>{query=e.target.value.trim();render();};
 dialog.querySelector('[data-picker-sort]').onchange=e=>{sort=e.target.value;render();};
 dialog.querySelector('[data-picker-prev]').onclick=()=>{page--;render();};dialog.querySelector('[data-picker-next]').onclick=()=>{page++;render();};
 dialog.querySelector('[data-exam-selected]').onclick=()=>{const ids=[...selectedIds];const i=ids.indexOf(focusedId);focusedId=ids[(i+1)%ids.length];page=Math.floor(people.findIndex(o=>o.id===focusedId)/6);render();};
 dialog.querySelector('[data-exam-confirm]').onclick=()=>{
  if(!selectedIds.size||edictOpen)return;
  edictOpen=true;
  const ids=[...selectedIds];
  const names=ids.map(id=>people.find(o=>o.id===id).name);
  dialog.className='exam-edict';
  dialog.setAttribute('aria-label','制举录用圣旨');
  dialog.innerHTML=`<article class="edict-scroll"><div class="edict-copy"><div class="edict-heading"><h2>圣旨</h2><p>奉天承运　皇帝诏曰</p></div><p class="edict-opening">今科制举，诸士才识可嘉。<br>兹录用下列贤才，入朝听用：</p><ul class="edict-names ${names.length>9?'is-many':''}" aria-label="本届录用名单">${names.map(name=>`<li>${esc(name)}</li>`).join('')}</ul><div class="edict-closing"><p>望尔等恪尽职守，辅弼朝政。</p><p class="edict-end">钦此</p><div class="edict-seal-site" aria-label="待御印"><img class="edict-seal-mark" src="assets/examinations/exam-imperial-imprint.png" alt="皇帝之宝篆文朱印"><img class="edict-stamp" src="assets/examinations/exam-imperial-seal.png" alt="" aria-hidden="true"><span data-seal-label>待御印</span></div></div></div></article><div class="edict-actions"><button type="button" data-edict-seal><img aria-hidden="true" class="edict-button-icon" src="assets/examinations/exam-imperial-seal.png" alt="">用印</button><p data-edict-status role="status" aria-live="polite">加盖御印后，本届制举结束</p></div>`;
  const button=dialog.querySelector('[data-edict-seal]');
  const status=dialog.querySelector('[data-edict-status]');
  button.onclick=async()=>{
   if(button.disabled)return;
   button.disabled=true;
   status.textContent='御印落下，钦定贤才……';
   dialog.classList.add('is-stamping');
   // The impact, ink impression and lift all run at the reserved seal position.
   // Commit only after the complete motion and a pause to read the impression.
   await new Promise(resolve=>setTimeout(resolve,2200));
   if(!dialog.isConnected)return;
   try{onSelect(ids);completed=true;close();}
   catch(e){dialog.classList.remove('is-stamping');button.disabled=false;status.textContent=e.message;}
  };
  button.focus();
 };
 function cleanup(){if(cleaned)return;cleaned=true;dialog.remove();if(!completed)onClose?.();}
 function close(){dialog.close();cleanup();}
 dialog.querySelectorAll('[data-picker-close],[data-picker-cancel]').forEach(b=>b.onclick=close);
 dialog.oncancel=e=>{if(edictOpen){e.preventDefault();return;}if(!dialog.querySelector('.exam-roster').hidden){e.preventDefault();roster(false);}};
 dialog.onclose=cleanup;render();dialog.showModal();return dialog;
}
