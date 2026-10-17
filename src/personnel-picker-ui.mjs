import {officialAvatar} from './official-art.mjs';
import {officeId} from './personnel-actions.mjs';

const esc=s=>String(s??'—').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const columns=[['politics','政务'],['leadership','统率'],['intelligence','智力'],['martial','武力'],['integrity','清廉'],['loyalty','忠诚'],['age','年龄'],['experience','经验']];

// 独立选人名册：只返回选择，不执行政令、不改动存档。
export function openPersonnelPicker({root,people,office,selectedId,onSelect,onClose}){
 const dialog=document.createElement('dialog');
 dialog.className='pm-picker';dialog.setAttribute('aria-label','选择任职大臣');
 let query='',scope='all',sort='',page=0;
 dialog.innerHTML=`<header class="pm-picker-header"><div><small>吏部 · 选任名册</small><h2>由谁担任${esc(office.name)}？</h2><p>先比较人选，再拟定调令。</p></div><button type="button" data-picker-close aria-label="关闭选任名册">×</button></header><div class="pm-picker-filters"><label>查找官员<input type="search" data-picker-query placeholder="输入姓名或现任官职" autocomplete="off"></label><label>任职状态<select data-picker-scope><option value="all">全部官员</option><option value="waiting">待命官员</option><option value="serving">在任官员</option></select></label><label>排列方式<select data-picker-sort><option value="">名册原序</option>${columns.filter(([k])=>k!=='age').map(([k,n])=>`<option value="${k}">${n}从高到低</option>`).join('')}</select></label></div><div class="pm-picker-body"><div data-picker-results></div></div><footer class="pm-picker-footer"><span data-picker-count role="status"></span><div><button data-picker-prev>上一页</button><span data-picker-page></span><button data-picker-next>下一页</button></div><button data-picker-cancel>取消选人</button></footer>`;
 root.append(dialog);
 const render=()=>{
  let rows=people.filter(o=>(scope==='all'||(scope==='waiting')===(!officeId(o)))&&`${o.name} ${o.office}`.includes(query));
  if(sort)rows=rows.toSorted((a,b)=>{
   const av=typeof a[sort]==='number'?a[sort]:-Infinity,bv=typeof b[sort]==='number'?b[sort]:-Infinity;
   return av===bv?0:av>bv?-1:1;
  });
  const pages=Math.max(1,Math.ceil(rows.length/15));page=Math.max(0,Math.min(page,pages-1));
  dialog.querySelector('[data-picker-results]').innerHTML=`<div class="pm-picker-table-wrap"><table class="pm-picker-table"><thead><tr><th scope="col">官员</th><th scope="col">现任官职</th>${columns.map(([,n])=>`<th scope="col">${n}</th>`).join('')}<th scope="col">选任</th></tr></thead><tbody>${rows.slice(page*15,page*15+15).map(o=>{const current=officeId(o)===office.id,avatar=officialAvatar(o);return `<tr class="${o.id===selectedId?'is-selected':''}"><th scope="row"><span class="pm-picker-name">${avatar?`<img src="${esc(avatar)}" alt="">`:''}${esc(o.name)}</span></th><td>${esc(o.office)}</td>${columns.map(([k])=>`<td>${esc(o[k])}</td>`).join('')}<td><button data-pick-official="${esc(o.id)}" ${current?'disabled':''}>${current?'已任此职':o.id===selectedId?'已选 · 选任':'选任'}</button></td></tr>`;}).join('')||'<tr><td colspan="11" class="pm-picker-empty">没有符合条件的官员，请调整搜索或任职筛选。</td></tr>'}</tbody></table></div>`;
  dialog.querySelector('[data-picker-count]').textContent=`共 ${rows.length} 人 · 每页15人`;
  dialog.querySelector('[data-picker-page]').textContent=`${page+1} / ${pages}`;
  dialog.querySelector('[data-picker-prev]').disabled=page===0;
  dialog.querySelector('[data-picker-next]').disabled=page+1>=pages;
  dialog.querySelector('.pm-picker-body').scrollTop=0;
  dialog.querySelectorAll('[data-pick-official]').forEach(b=>b.onclick=()=>{onSelect(b.dataset.pickOfficial);close();});
 };
 const search=e=>{query=e.target.value.trim();page=0;render();};
 dialog.querySelector('[data-picker-query]').addEventListener('input',search);
 dialog.querySelector('[data-picker-query]').addEventListener('change',search);
 dialog.querySelector('[data-picker-scope]').onchange=e=>{scope=e.target.value;page=0;render();};
 dialog.querySelector('[data-picker-sort]').onchange=e=>{sort=e.target.value;page=0;render();};
 dialog.querySelector('[data-picker-prev]').onclick=()=>{page--;render();};
 dialog.querySelector('[data-picker-next]').onclick=()=>{page++;render();};
 dialog.querySelectorAll('[data-picker-close],[data-picker-cancel]').forEach(b=>b.onclick=close);
 function cleanup(){if(!dialog.isConnected)return;dialog.remove();onClose?.();}
 function close(){dialog.close();cleanup();}
 dialog.onclose=cleanup;
 render();dialog.showModal();dialog.querySelector('[data-picker-query]').focus();return dialog;
}
