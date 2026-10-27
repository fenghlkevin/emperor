import {courtJusticeCases} from './court-justice.mjs';
import {officialArt} from './official-art.mjs';
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const scenes={pending:'assets/scenes/justice/sketch-justice-hearing-v1.png',prison:'assets/scenes/justice/sketch-justice-prison-v1.png'};
const tabs=[['pending','待决案卷'],['prison','天牢在押'],['history','已结记录']];
const statuses={released:'释放为民',executed:'已处斩',rebel:'已叛离'};
const stat=(label,n,unit='人')=>`<div class="rd-stat"><small>${label}</small><strong>${Number(n).toLocaleString('zh-CN')}<em>${unit}</em></strong></div>`;
function records(state){return {pending:courtJusticeCases(state).map(r=>r.official),prison:courtJusticeCases(state,'prison').map(r=>r.official),history:courtJusticeCases(state,'history').map(r=>r.official)};}
function personCard(person,kind){
 const art=officialArt(person),status=kind==='prison'?'天牢在押':kind==='pending'?'已查实 · 待裁决':statuses[person.status];
 const fact=kind==='prison'?`第 ${person.prison?.admittedTurn??'—'} 旬收押 · 已服刑 ${person.prison?.servedTurns??0} 旬`:kind==='pending'?`第 ${person.discoveredTurn??'—'} 旬密查呈报`:person.prison?`收押记录：第 ${person.prison.admittedTurn} 旬`:'刑部留档';
 return `<article class="jd-person" data-jd-person="${esc(person.id)}"><figure>${art?.full?`<img src="${esc(art.full)}" alt="${esc(person.name)}立绘" loading="lazy">`:'<span aria-hidden="true">册</span>'}</figure><div><small class="jd-seal">${esc(status)}</small><h3>${esc(person.name)}</h3><p>${kind==='pending'?'现任':'原任'} · ${esc(person.office)}</p><dl><div><dt>年龄</dt><dd>${esc(person.age??'—')} 岁</dd></div><div><dt>忠诚</dt><dd>${esc(person.loyalty)}%</dd></div><div><dt>政务</dt><dd>${esc(person.politics??'—')}</dd></div><div><dt>经验</dt><dd>${esc(person.experience??'—')}</dd></div></dl><p class="jd-fact">${esc(fact)}</p></div></article>`;
}
export function justiceDeputyMarkup(state,{view='pending'}={}){
 const rows=records(state),current=tabs.some(([id])=>id===view)?view:'pending';
 return `<p class="rd-scope">刑部侍郎 · 刑狱案卷图鉴</p><section class="rd-national jd-national"><div><img class="jd-scene" src="${scenes.pending}" alt="刑部听案厅">${stat('已查实待决',rows.pending.length)}${stat('调查经费',state.domestic.justice.funding,'两 / 旬')}</div><div><img class="jd-scene" src="${scenes.prison}" alt="天牢监舍">${stat('天牢在押',rows.prison.length)}${stat('本旬',state.turn,'旬')}</div><div><div class="governance-art governance-art--registers" aria-hidden="true"></div>${stat('已结留档',rows.history.length)}${stat('刑部记事',state.domestic.justice.history.length,'条')}</div></section><nav class="rd-provinces" aria-label="选择刑部案卷">${tabs.map(([id,title])=>`<a href="#jd-${id}" data-jd-tab="${id}" ${id===current?'aria-current="page"':''}>${title} · ${rows[id].length}</a>`).join('')}</nav>${tabs.map(([id,title])=>`<section id="jd-${id}" class="jd-register" data-jd-register="${id}" ${id===current?'':'hidden'}><header><h2>${title}</h2><small>实录 ${rows[id].length} 人</small></header>${rows[id].length?`<div class="jd-people">${rows[id].map(p=>personCard(p,id)).join('')}</div>`:`<div class="jd-empty"><img src="${scenes[id==='prison'?'prison':'pending']}" alt=""><div><span aria-hidden="true">${id==='prison'?'囚':'卷'}</span><h3>${id==='prison'?'天牢暂无在押官员':id==='pending'?'暂无待决案件':'暂无已结记录'}</h3><p>${id==='prison'?'收押后，人员与服刑记录将在此入册。':id==='pending'?'密查查实的未决案件将在此呈列。':'释放、处斩与叛离人员按现有存档留册。'}</p></div></div>`}${id==='history'&&state.domestic.justice.history.length?`<details class="jd-history"><summary>翻阅刑部记事 · ${state.domestic.justice.history.length} 条</summary>${state.domestic.justice.history.map(line=>`<p>${esc(line)}</p>`).join('')}</details>`:''}</section>`).join('')}<p class="rd-note">本页查阅刑部实录；拨款、收押、释放与裁决由刑部尚书呈办。</p>`;
}
export function openJusticeDeputy(state,root,onClose,options={}){
 const d=document.createElement('dialog');d.className='governance-dialog revenue-deputy-dialog justice-deputy-dialog';d.setAttribute('aria-label','刑部侍郎·刑狱案卷图鉴');
 d.innerHTML=`<header class="governance-header"><h1>刑部 · 刑狱案卷</h1><button aria-label="关闭查阅">关闭 ×</button></header><div class="governance-content rd-content">${justiceDeputyMarkup(state,options)}</div>`;
 d.querySelector('button').onclick=()=>d.close();
 d.querySelectorAll('[data-jd-tab]').forEach(a=>a.onclick=e=>{e.preventDefault();d.querySelectorAll('[data-jd-register]').forEach(s=>s.hidden=s.dataset.jdRegister!==a.dataset.jdTab);d.querySelectorAll('[data-jd-tab]').forEach(link=>{if(link===a)link.setAttribute('aria-current','page');else link.removeAttribute('aria-current');});});
 d.onclose=()=>{d.remove();onClose?.();};root.append(d);d.showModal();return d;
}
