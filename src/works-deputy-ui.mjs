import {countrySummary} from './domestic.mjs';
import {provinceRegisterMarkup} from './revenue-deputy-ui.mjs';
import {projectLaborOverview} from './project-labor.mjs';
import {findProject,projectTotal} from './project-work-orders.mjs';
import {CONSTRUCTION_PLANS} from './construction.mjs';
import {SPECIAL_PLANS} from './special-buildings.mjs';
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fmt=n=>Number(n??0).toLocaleString('zh-CN');
const stat=(label,n,unit)=>`<div class="rd-stat"><small>${label}</small><strong>${fmt(n)}<em>${unit}</em></strong></div>`;
function worksDetail(state,p){
 const d=state.domestic,l=projectLaborOverview(d,p);
 return `<section class="works-register"><h3>营造进度与民夫</h3><div class="rd-summary">${stat('现有民夫',l.capacity,'人')}${stat('工程基础占用',l.reserved,'人')}${stat('可用民夫',l.available,'人')}${stat('民夫缺员',l.shortage,'人')}</div><div class="rd-jobs">${[['construction','普通工程'],['development','开垦与产业'],['special','特殊工程']].map(([kind,label])=>{const r=findProject(d,p,kind),total=r?projectTotal(kind,r):1;const name=r?(kind==='construction'?CONSTRUCTION_PLANS[r.building]?.name:kind==='special'?SPECIAL_PLANS[r.building]?.name:`${r.area}亩产业开发`):'暂无在建项目';return `<div><span>${label}</span><strong>${esc(name)}</strong><meter min="0" max="${total}" value="${r?.progress??0}" aria-label="${label}完成进度"></meter><small>${r?`${fmt(r.progress)} / ${fmt(total)} 工量`:'无工程占用'}</small></div>`;}).join('')}</div></section>`;
}
export function worksDeputyMarkup(state){
 const q=countrySummary(state.domestic,undefined,state.turn),ps=q.provinces,ls=ps.map(p=>projectLaborOverview(state.domestic,p));
 const cards=[['building','在建普通工程',ps.filter(p=>p.construction.project).length,'项','在建产业开发',ps.filter(p=>p.development.project).length,'项'],['plans','特殊工程',Number(Boolean(state.domestic.specialWorks.project)),'项','辖州',ps.length,'州'],['registers','现有民夫',ls.reduce((n,l)=>n+l.capacity,0),'人','工程基础占用',ls.reduce((n,l)=>n+l.reserved,0),'人']];
 return `<p class="rd-scope">工部侍郎 · 州郡营造图鉴</p><section class="rd-national">${cards.map(([art,a,n,u,b,m,v])=>`<div><div class="governance-art governance-art--${art}" aria-hidden="true"></div>${stat(a,n,u)}${stat(b,m,v)}</div>`).join('')}</section><nav class="rd-provinces" aria-label="选择州郡">${ps.map((p,i)=>`<a href="#rd-${esc(p.id)}" data-rd-link="${esc(p.id)}" ${i===0?'aria-current="page"':''}>${esc(p.name)}</a>`).join('')}</nav>${ps.map((p,i)=>provinceRegisterMarkup(state,p,q.country,i,{worksOnly:true}).replace('<div class="rd-summary">',`${worksDetail(state,p)}<h3>州郡营造资料</h3><div class="rd-summary">`)).join('')}${ps.length?'':'<p>当前暂无本国州郡。</p>'}<p class="rd-note">各州列出营造进度、民夫、全部普通建筑、特殊建筑、土地与四业开发资料。民夫基础占用为各项目常规人手合计；赶工另按当旬调度核定。本页只读，建设与人口调配由工部尚书办理。</p>`;
}
export function openWorksDeputy(state,root,onClose){
 const d=document.createElement('dialog');d.className='governance-dialog revenue-deputy-dialog works-deputy-dialog';d.setAttribute('aria-label','工部侍郎·州郡营造图鉴');
 d.innerHTML=`<header class="governance-header"><h1>工部 · 州郡营造</h1><button aria-label="关闭查阅">关闭 ×</button></header><div class="governance-content rd-content">${worksDeputyMarkup(state)}</div>`;
 d.querySelector('button').onclick=()=>d.close();d.querySelectorAll('[data-rd-link]').forEach(a=>a.onclick=e=>{e.preventDefault();d.querySelectorAll('[data-rd-province]').forEach(s=>s.hidden=s.dataset.rdProvince!==a.dataset.rdLink);d.querySelectorAll('[data-rd-link]').forEach(x=>{if(x===a)x.setAttribute('aria-current','page');else x.removeAttribute('aria-current');});});
 d.onclose=()=>{d.remove();onClose?.();};root.append(d);d.showModal();return d;
}
