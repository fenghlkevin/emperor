import {openMilitaryRegister} from './military-register-ui.mjs';
import {countrySummary} from './domestic.mjs';
import {sprites} from './battle-sprite-data.mjs';
import {worldKitSummary} from './troop-kit-world.mjs';
import {TROOP_KITS} from './troop-kits.mjs';
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fmt=n=>Number(n??0).toLocaleString('zh-CN');
const stat=(label,n,unit='人')=>`<div class="rd-stat"><small>${label}</small><strong>${fmt(n)}<em>${unit}</em></strong></div>`;
function kitArt(id){const s=sprites[id];return `<svg class="wd-kit-art" viewBox="${s.walk[0].join(' ')}" aria-hidden="true"><image href="${s.asset}" width="${s.width}" height="${s.height}"/></svg>`;}
function camp(r){
 return `<section class="wd-camp"><h3>${esc(r.name)} · 军籍与军备</h3><div class="rd-summary">${stat('在籍兵员',r.soldiers.total)}${stat('随军出战',r.soldiers.used)}${stat('可用兵员',r.soldiers.available)}${stat('训练',r.training,'/100')}</div><div class="rd-indicators"><div><span>训练程度</span><meter min="0" max="100" value="${r.training}" aria-label="训练程度">${r.training}</meter><b>${r.training}/100</b></div></div><div class="wd-register-title"><h3>军备簿</h3><small>装备按人份计</small></div><div class="wd-kits">${TROOP_KITS.map(k=>{const a=r.kits[k.id];return `<article class="wd-kit ${a.total?'':'is-empty'}" data-kit="${k.id}">${kitArt(k.id)}<div><h4>${k.name}</h4><p class="wd-stock">库存 <strong>${fmt(a.total)}</strong> 份</p>${a.total?'':'<small class="wd-empty">暂无库存</small>'}<p class="wd-available">${a.used?`<span>随军出战 <b>${fmt(a.used)}</b></span>`:''}<span>库中可用 <b>${fmt(a.available)}</b></span></p></div></article>`;}).join('')}</div></section>`;
}
export function warDeputyMarkup(state){
 const q=countrySummary(state.domestic,undefined,state.turn),rows=worldKitSummary(state.domestic),ps=q.provinces;
 const total=rows.reduce((n,r)=>n+r.soldiers.total,0),used=rows.reduce((n,r)=>n+r.soldiers.used,0);
 return `<p class="rd-scope">兵部侍郎 · 州郡军务图鉴</p><section class="rd-national"><div><div class="governance-art governance-art--registers" aria-hidden="true"></div>${stat('全国兵员',total)}${stat('可用兵员',total-used)}</div><div><div class="governance-art governance-art--plans" aria-hidden="true"></div>${stat('辖州',ps.length,'州')}${stat('随军出战',used)}</div><div><div class="governance-art governance-art--accounts" aria-hidden="true"></div>${stat('全国装备',rows.reduce((n,r)=>n+Object.values(r.kits).reduce((v,k)=>v+k.total,0),0),'份')}${stat('随军装备',rows.reduce((n,r)=>n+Object.values(r.kits).reduce((v,k)=>v+k.used,0),0),'份')}</div></section><nav class="rd-provinces" aria-label="选择州郡与中央"><a href="#wd-central" data-rd-link="central" aria-current="page">中央军</a>${ps.map(p=>`<a href="#rd-${esc(p.id)}" data-rd-link="${esc(p.id)}">${esc(p.name)}</a>`).join('')}</nav><section id="wd-central" class="rd-province" data-rd-province="central">${rows.filter(r=>r.id==='central').map(camp).join('')}</section>${ps.map(p=>`<section id="rd-${esc(p.id)}" class="rd-province" data-rd-province="${esc(p.id)}" hidden>${rows.filter(r=>r.id===p.id).map(camp).join('')}</section>`).join('')}<p class="rd-note">兵员与装备均为实有记录；装备按人份统计。中央军已从来源州驻军中扣除，全国兵员不重复计算。随军出战的装备暂不可调拨，生还携装返回原驻地。本页只读。</p>`;
}
export function openWarDeputy(state,root,onClose){
 const d=document.createElement('dialog');d.className='governance-dialog revenue-deputy-dialog war-deputy-dialog';d.setAttribute('aria-label','兵部侍郎·州郡军务图鉴');
 d.innerHTML=`<header class="governance-header"><h1>兵部 · 军籍军备</h1><button aria-label="关闭查阅">关闭 ×</button></header><div class="governance-content rd-content">${warDeputyMarkup(state)}</div>`;
 d.querySelector('button').onclick=()=>d.close();
 const register=document.createElement('button');register.textContent='查阅军务精册';register.dataset.warRegister='';const tools=document.createElement('div');tools.className='wd-register-entry';tools.append(register);d.querySelector('.rd-content').prepend(tools);register.onclick=()=>openMilitaryRegister(state,root,()=>{});d.querySelectorAll('[data-rd-link]').forEach(a=>a.onclick=e=>{e.preventDefault();d.querySelectorAll('[data-rd-province]').forEach(s=>s.hidden=s.dataset.rdProvince!==a.dataset.rdLink);d.querySelectorAll('[data-rd-link]').forEach(x=>{if(x===a)x.setAttribute('aria-current','page');else x.removeAttribute('aria-current');});});
 d.onclose=()=>{d.remove();onClose?.();};root.append(d);d.showModal();return d;
}
