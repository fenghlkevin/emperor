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
 return `<section class="works-register"><h3>营造进度与民夫</h3><div class="rd-summary">${stat('现有民夫',l.capacity,'人')}${stat('工程基础占用',l.reserved,'人')}${stat('可用民夫',l.available,'人')}${stat('民夫缺员',l.shortage,'人')}</div><div class="rd-jobs">${[['construction','普通工程'],['development','开垦与产业'],['expansion','城州扩建'],['special','特殊工程']].map(([kind,label])=>{const r=findProject(d,p,kind),total=r?projectTotal(kind,r):1;const name=r?(kind==='construction'?CONSTRUCTION_PLANS[r.building]?.name:kind==='special'?SPECIAL_PLANS[r.building]?.name:kind==='expansion'?'城州扩建':`${r.area}亩产业开发`):'暂无在建项目';return `<div><span>${label}</span><strong>${esc(name)}</strong><meter min="0" max="${total}" value="${r?.progress??0}" aria-label="${label}完成进度"></meter><small>${r?`${fmt(r.progress)} / ${fmt(total)} 工量`:'无工程占用'}</small></div>`;}).join('')}</div></section>`;
}
export function worksDeputyMarkup(state){
 const q=countrySummary(state.domestic,undefined,state.turn),ps=q.provinces,ls=ps.map(p=>projectLaborOverview(state.domestic,p));
 const cards=[['building','在建普通工程',ps.filter(p=>p.construction.project).length,'项','在建产业开发',ps.filter(p=>p.development.project).length,'项'],['plans','特殊工程',Number(Boolean(state.domestic.specialWorks.project)),'项','辖州',ps.length,'州'],['registers','现有民夫',ls.reduce((n,l)=>n+l.capacity,0),'人','工程基础占用',ls.reduce((n,l)=>n+l.reserved,0),'人']];
 return `<p class="rd-scope">工部侍郎 · 州郡营造图鉴</p><a href="#works-records" data-works-records>查阅工程记录</a><section class="rd-national">${cards.map(([art,a,n,u,b,m,v])=>`<div><div class="governance-art governance-art--${art}" aria-hidden="true"></div>${stat(a,n,u)}${stat(b,m,v)}</div>`).join('')}</section><nav class="rd-provinces" aria-label="选择州郡">${ps.map((p,i)=>`<a href="#rd-${esc(p.id)}" data-rd-link="${esc(p.id)}" ${i===0?'aria-current="page"':''}>${esc(p.name)}</a>`).join('')}</nav>${ps.map((p,i)=>provinceRegisterMarkup(state,p,q.country,i,{worksOnly:true}).replace('<div class="rd-summary">',`${worksDetail(state,p)}<h3>州郡营造资料</h3><div class="rd-summary">`)).join('')}${ps.length?'':'<p>当前暂无本国州郡。</p>'}<p class="rd-note">各州列出营造进度、民夫、全部普通建筑、特殊建筑、土地与四业开发资料。民夫基础占用为各项目常规人手合计；赶工另按当旬调度核定。营造与调配人手之事，请召工部尚书面议。</p>`;
}
export function openWorksDeputy(state,root,onClose){
 const d=document.createElement('dialog');d.className='governance-dialog revenue-deputy-dialog works-deputy-dialog';d.setAttribute('aria-label','工部侍郎·州郡营造图鉴');
 d.innerHTML=`<header class="governance-header"><h1>工部 · 州郡营造</h1><button aria-label="关闭查阅">关闭 ×</button></header><div class="governance-content rd-content">${worksDeputyMarkup(state)}</div>`;
 d.querySelector('button').onclick=()=>d.close();d.querySelector('[data-works-records]').onclick=e=>{e.preventDefault();openWorksRecords(state,root);};d.querySelectorAll('[data-rd-link]').forEach(a=>a.onclick=e=>{e.preventDefault();d.querySelectorAll('[data-rd-province]').forEach(s=>s.hidden=s.dataset.rdProvince!==a.dataset.rdLink);d.querySelectorAll('[data-rd-link]').forEach(x=>{if(x===a)x.setAttribute('aria-current','page');else x.removeAttribute('aria-current');});});
 d.onclose=()=>{d.remove();onClose?.();};root.append(d);d.showModal();return d;
}

export function worksRecords(state){
 const d=state.domestic;
 return [...d.provinces.filter(p=>p.countryId===d.playerCountryId).flatMap(p=>['construction','development','expansion','special'].flatMap(kind=>{
  const r=findProject(d,p,kind);if(!r)return [];
  const name=kind==='construction'?CONSTRUCTION_PLANS[r.building]?.name:kind==='special'?SPECIAL_PLANS[r.building]?.name:kind==='expansion'?'城州扩建':'产业开发';
  return [{turn:r.startedTurn,message:`${p.name} · ${name} · 已施工 ${fmt(r.progress)} / ${fmt(projectTotal(kind,r))} 旬`}];
 })),...(d.industryActions?.history??[]),...(d.specialWorks?.history??[])].sort((a,b)=>b.turn-a.turn);
}
export function openWorksRecords(state,root,onClose){
 const rows=worksRecords(state);let page=0;
 const d=document.createElement('dialog');d.className='governance-dialog works-records-dialog';d.setAttribute('aria-label','工部侍郎·工程记录');
 function draw(){const r=rows[page];
 d.innerHTML=`<header class="governance-header"><h1>工部侍郎 · 工程记录</h1><button aria-label="关闭查阅">关闭 ×</button></header><div class="works-records-content"><p>查阅在建进度与历次工程政令；历史记录保留当时的工期和支出。</p><article aria-live="polite">${r?`<small>第${fmt(r.turn)}旬</small><p>${esc(r.message)}</p>`:'<p>暂无工程记录。</p>'}</article><nav aria-label="翻阅工程记录"><button data-prev ${page===0?'disabled':''}>上一条</button><span>${rows.length?page+1:0} / ${rows.length}</span><button data-next ${page>=rows.length-1?'disabled':''}>下一条</button></nav></div>`;
 d.querySelector('header button').onclick=()=>d.close();d.querySelector('[data-prev]').onclick=()=>{page--;draw();};d.querySelector('[data-next]').onclick=()=>{page++;draw();};
 }
 d.onclose=()=>{d.remove();onClose?.();};root.append(d);draw();d.showModal();return d;
}
