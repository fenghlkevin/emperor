import {officeId,NOBILITY} from './personnel-actions.mjs';
import {officeRegister,OFFICIAL_ATTRIBUTES} from './personnel.mjs';
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function openPersonnel(state,root){
 const offices=officeRegister(state.domestic).map(o=>{const person=state.domestic.justice.officials.find(p=>officeId(p)===o.id&&p.status==='serving');return {...o,attributes:{...o.attributes,...Object.fromEntries(OFFICIAL_ATTRIBUTES.map(([key])=>[key,person?.[key]??null])),name:person?.name??null,nobility:person?NOBILITY[person.nobilityLevel??0]:null,loyalty:person?person.loyalty+'%':null}};}),dialog=document.createElement('dialog');
 let scope='all',query='';dialog.className='domestic-dialog ink-mode personnel-dialog';dialog.setAttribute('aria-label','吏部侍郎官职表');root.append(dialog);dialog.onclose=()=>dialog.remove();
 dialog.innerHTML=`<header class="civil-header"><div><small>吏部侍郎 · 官制</small><h1>官职表<span>中枢列职，州郡分司</span></h1></div><button class="close" aria-label="关闭">×</button></header><div class="personnel-body ink-scroll"><div class="personnel-heading"><div><span class="eyebrow">天下官制</span><h2>百官职掌</h2><p>中央职位与本国各州地方职位</p></div><label class="personnel-search">查找职位<input type="search" placeholder="输入官职或州名" aria-label="查找官职或州名" maxlength="80"></label></div><div class="personnel-filters" role="group" aria-label="职位范围">${[['all','全部职位'],['central','中央职位'],['local','地方职位']].map(([id,label])=>`<button data-scope="${id}" aria-pressed="${id==='all'}">${label}<span>${offices.filter(o=>id==='all'||o.scope===id).length}</span></button>`).join('')}</div><p class="civil-note">中央职位固定列册；各州刺史、将军随本国辖区生成。任职与刑部、吏部尚书名册同步；在押、处斩、释放或外调的大臣不再任职，未录属性以“—”显示。</p><div class="personnel-results" aria-live="polite"></div><div class="civil-table report-table personnel-table"><table><thead><tr><th scope="col">职位</th><th scope="col">所属</th>${OFFICIAL_ATTRIBUTES.map(([,name])=>`<th scope="col">${name}</th>`).join('')}</tr></thead><tbody></tbody></table></div><p class="personnel-empty" hidden>未找到匹配的职位。</p></div><div class="civil-footer">吏部勘录<span>官职名册 · 刑部名册同步</span></div>`;
 function refresh(){
  const filtered=offices.filter(o=>(scope==='all'||o.scope===scope)&&o.name.includes(query));
  dialog.querySelector('tbody').innerHTML=filtered.map(o=>`<tr data-position="${o.id}" data-kind="${o.scope}"><th scope="row">${esc(o.name)}</th><td>${esc(o.scope==='central'?o.department:'地方 · '+o.department)}</td>${OFFICIAL_ATTRIBUTES.map(([key])=>`<td data-attribute="${key}">${o.attributes[key]===null?'—':esc(o.attributes[key])}</td>`).join('')}</tr>`).join('');
  dialog.querySelector('.personnel-results').textContent=`共 ${filtered.length} 个职位`;
  dialog.querySelector('.personnel-empty').hidden=filtered.length!==0;
  dialog.querySelectorAll('[data-scope]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.scope===scope)));
 }
 dialog.querySelector('.close').onclick=()=>dialog.close();
 dialog.querySelector('input').oninput=e=>{query=e.target.value.trim();refresh();};
 dialog.querySelectorAll('[data-scope]').forEach(b=>b.onclick=()=>{scope=b.dataset.scope;refresh();});
 refresh();dialog.showModal();return dialog;
}
