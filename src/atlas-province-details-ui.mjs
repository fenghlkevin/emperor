import {CONSTRUCTION_PLANS} from './construction.mjs';
import {SPECIAL_PLANS} from './special-buildings.mjs';
import {provinceOverview,openIndicatorHelp,openProvinceGeography} from './province-overview-ui.mjs';
const escapeHtml=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function atlasProvinceProjects(state,p){
 const rows=[],construction=p.construction?.project,development=p.development?.project,special=state.domestic.specialWorks?.project;
 if(construction){const plan=CONSTRUCTION_PLANS[construction.building];rows.push({kind:'地方营建',name:plan?.name??'营建工程',progress:construction.progress,total:plan?.turns??1});}
 if(development)rows.push({kind:'产业开发',name:({agriculture:'农业',pastoral:'牧业',commerce:'商业',industry:'工业'})[development.industry]??'土地开发',progress:development.progress,total:1});
 if(special?.provinceId===p.id){const plan=SPECIAL_PLANS[special.building];rows.push({kind:'特殊工程',name:plan?.name??'特殊工程',progress:special.progress,total:plan?.turns??1});}
 return rows;
}
function openProjectSheet(root,p,rows){
 const d=document.createElement('dialog');d.className='court-play-dialog atlas-projects';d.setAttribute('aria-label',p.name+'当前工程');
 d.innerHTML=`<header><small>州县工程簿</small><h2>${escapeHtml(p.name)} · 当前工程</h2><button data-close-projects>返回州县详情 ×</button></header><div class="atlas-project-list">${rows.map(r=>`<article><small>${escapeHtml(r.kind)}</small><h3>${escapeHtml(r.name)}</h3><div><span>已完成工量</span><b>${r.progress} / ${r.total} 旬</b></div><meter min="0" max="${r.total}" value="${r.progress}" aria-label="${escapeHtml(r.name)}施工进度"></meter></article>`).join('')}</div>`;
 d.querySelector('[data-close-projects]').onclick=()=>d.close();d.onclose=()=>d.remove();root.append(d);d.showModal();return d;
}
export function openAtlasProvinceDetails(state,root,provinceId,onClose){
 let id=provinceId,selectedSection=0;
 function fit(){const sheet=d.querySelector('.province-sheet');if(!sheet||!d.open)return;sheet.style.zoom='1';const css=getComputedStyle(d),height=d.clientHeight-parseFloat(css.paddingTop)-parseFloat(css.paddingBottom);for(let i=0;i<3;i++){const h=sheet.getBoundingClientRect().height;if(h<=height)break;sheet.style.zoom=String((Number(sheet.style.zoom)||1)*height/h*.99);}}
 const d=document.createElement('dialog');d.className='court-play-dialog atlas-province-details';d.setAttribute('aria-label','州县详细信息');root.append(d);
 function draw(){
  const p=state.domestic.provinces.find(p=>p.id===id),country=state.domestic.countries.find(c=>c.id===p?.countryId);if(!p||!country){d.close();return;}
  d.innerHTML=provinceOverview(state,p,country);
  const projects=atlasProvinceProjects(state,p),summary=d.querySelector('.province-project');
  summary.classList.add('atlas-project-summary');summary.innerHTML=`<span>当前工程：${projects.length?projects.length+' 项':'无'}</span>${projects.length?'<button data-atlas-projects>查看工程 →</button>':''}`;
  summary.querySelector('[data-atlas-projects]')?.addEventListener('click',()=>openProjectSheet(root,p,projects));
  const back=d.querySelector('[data-back-country]');back.textContent='← 返回山河图';back.onclick=()=>d.close();
  d.querySelector('.province-sheet-footer>div')?.remove();
  const columns=d.querySelector('.province-columns'),sections=[...columns.children],nav=document.createElement('nav');nav.className='atlas-detail-sections';nav.setAttribute('aria-label','州县详情分类');
  nav.innerHTML=['民生秩序','人口产业','钱粮建设'].map((label,i)=>`<button data-detail-section="${i}" aria-pressed="${i===selectedSection}">${label}</button>`).join('');columns.before(nav);
  sections.forEach((section,i)=>section.classList.toggle('is-active',i===selectedSection));nav.querySelectorAll('button').forEach(b=>b.onclick=()=>{selectedSection=Number(b.dataset.detailSection);sections.forEach((section,i)=>section.classList.toggle('is-active',i===selectedSection));nav.querySelectorAll('button').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));fit();});
  d.querySelectorAll('[data-neighbor]').forEach(b=>b.onclick=()=>{const ps=state.domestic.provinces.filter(x=>x.countryId===p.countryId),i=ps.findIndex(x=>x.id===id);id=ps[(i+Number(b.dataset.neighbor)+ps.length)%ps.length].id;draw();});
  d.querySelectorAll('[data-indicator]').forEach(b=>b.onclick=()=>openIndicatorHelp(root,b.dataset.indicator,p,state.turn+1));
  d.querySelector('[data-province-geography]')?.addEventListener('click',()=>openProvinceGeography(root,p));
  requestAnimationFrame(fit);
 }
 const observer=new ResizeObserver(()=>requestAnimationFrame(fit));observer.observe(d);
 d.onclose=()=>{observer.disconnect();d.remove();onClose?.(id);};draw();d.showModal();fit();document.fonts.ready.then(fit);return d;
}
