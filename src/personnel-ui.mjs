import {examFee} from './difficulty.mjs';
import {officeId} from './personnel-actions.mjs';
import {officeRegister} from './personnel.mjs';
import {officialAvatar} from './official-art.mjs';
import {historicalProfile,openHistoricalProfile} from './historical-profile-ui.mjs';
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const columns=[['politics','政务'],['intelligence','智力'],['leadership','统率'],['martial','武力']];
const scores=[...columns,['integrity','清廉'],['loyalty','忠诚']];
export function openPersonnel(state,root,onClose){
 const offices=officeRegister(state.domestic).map(o=>({...o,person:state.domestic.justice.officials.find(p=>p.status==='serving'&&officeId(p)===o.id)}));
 const dialog=document.createElement('dialog');
 let scope='all',query='',page=0,selected=offices.find(o=>o.person)?.id;const pageSize=9;
 dialog.className='governance-dialog personnel-register';dialog.setAttribute('aria-label','吏部侍郎 · 百官名册');
 dialog.innerHTML=`<header class="governance-header"><h1>吏部侍郎 · 百官名册</h1><button class="close" aria-label="关闭名册">关闭 ×</button></header><div class="personnel-register-content"><section class="personnel-register-main" aria-label="官员名册"><div class="personnel-register-toolbar"><div class="personnel-register-filters" role="group" aria-label="职位范围">${[['all','全部'],['central','中央'],['local','地方']].map(([id,label])=>`<button data-scope="${id}" aria-pressed="${id==='all'}">${label}</button>`).join('')}</div><input type="search" maxlength="80" aria-label="搜索姓名、官职或州名" placeholder="搜索姓名 / 官职 / 州名"></div><div class="personnel-register-table-wrap"><table class="personnel-register-table"><thead><tr><th>姓名</th><th>官职</th>${columns.map(([,label])=>`<th>${label}</th>`).join('')}</tr></thead><tbody></tbody></table><p class="personnel-register-empty" hidden>未找到匹配的人员或职位</p></div><nav class="personnel-register-pages" aria-label="名册分页"><button data-prev>上一页</button><span aria-live="polite"></span><button data-next>下一页</button></nav></section><aside class="personnel-register-detail" aria-label="人物详情"></aside></div>`;
 const filtered=()=>offices.filter(o=>(scope==='all'||o.scope===scope)&&[o.name,o.person?.name,o.department].some(v=>v?.includes(query)));
 function showProfile(person){openHistoricalProfile(historicalProfile(person)?.id??person.id,root,person);}
 function detail(){
  const o=offices.find(o=>o.id===selected),p=o?.person,side=dialog.querySelector('.personnel-register-detail');
  if(!p){side.innerHTML=`<div class="personnel-register-vacant"><h2>${esc(o?.name??'暂无人员')}</h2><p>${o?'虚位待贤':'请选择其他范围或搜索条件'}</p></div>`;return;}
  const avatar=officialAvatar(p);
  side.innerHTML=`<figure>${avatar?`<img src="${esc(avatar)}" alt="${esc(p.name)}头像">`:''}</figure><div class="personnel-register-name"><h2>${esc(p.name)}</h2><button data-profile aria-label="查看${esc(p.name)}详细资料">详情 ↗</button></div><p class="personnel-register-office">${esc(o.name)}</p><dl>${scores.map(([key,label])=>`<div><dt>${label}</dt><dd>${esc(p[key]??'—')}</dd><meter min="0" max="100" value="${Number.isFinite(p[key])?p[key]:0}" aria-label="${label}"></meter></div>`).join('')}</dl>`;
  side.querySelector('[data-profile]').onclick=()=>showProfile(p);
 }
 function draw(){
  const rows=filtered(),pages=Math.max(1,Math.ceil(rows.length/pageSize));page=Math.min(page,pages-1);
  const visible=rows.slice(page*pageSize,(page+1)*pageSize);
  if(!visible.some(o=>o.id===selected))selected=visible.find(o=>o.person)?.id??visible[0]?.id;
  dialog.querySelector('tbody').innerHTML=visible.map(o=>`<tr data-position="${esc(o.id)}" class="${o.id===selected?'is-selected':''}"><th scope="row"><button data-select="${esc(o.id)}" aria-pressed="${o.id===selected}">${esc(o.person?.name??'虚位待贤')}</button>${o.person?`<button class="personnel-register-profile" data-profile-id="${esc(o.id)}" aria-label="查看${esc(o.person.name)}详细资料">↗</button>`:''}</th><td>${esc(o.name)}</td>${columns.map(([key])=>`<td data-attribute="${key}">${esc(o.person?.[key]??'—')}</td>`).join('')}</tr>`).join('');
  dialog.querySelector('.personnel-register-empty').hidden=rows.length!==0;
  dialog.querySelectorAll('[data-scope]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.scope===scope)));
  dialog.querySelectorAll('[data-position]').forEach(row=>row.onclick=e=>{if(e.target.closest('[data-profile-id]'))return;selected=row.dataset.position;draw();dialog.querySelector(`[data-select="${selected}"]`)?.focus({preventScroll:true});});
  dialog.querySelectorAll('[data-profile-id]').forEach(b=>b.onclick=()=>showProfile(offices.find(o=>o.id===b.dataset.profileId).person));

  dialog.querySelector('.personnel-register-pages span').textContent=`${page+1} / ${pages}`;
  dialog.querySelector('[data-prev]').disabled=page===0;dialog.querySelector('[data-next]').disabled=page+1>=pages;
  detail();
 }
 dialog.querySelector('.close').onclick=()=>dialog.close();
 dialog.querySelector('input').oninput=e=>{query=e.target.value.trim();page=0;draw();};
 dialog.querySelectorAll('[data-scope]').forEach(b=>b.onclick=()=>{scope=b.dataset.scope;page=0;draw();});
 dialog.querySelector('[data-prev]').onclick=()=>{page--;draw();};dialog.querySelector('[data-next]').onclick=()=>{page++;draw();};
 dialog.onclose=()=>{dialog.remove();onClose?.();};root.append(dialog);draw();dialog.showModal();return dialog;
}
