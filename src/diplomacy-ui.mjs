import {diplomaticRows,RELATION_LABELS,relationBetween,treatyLabel} from './diplomacy.mjs';
import {countrySummary} from './domestic.mjs';
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));const fmt=n=>n.toLocaleString('zh-CN');
const metric=(name,n,unit)=>`<div class="civil-metric"><small>${name}</small><strong>${fmt(n)}<i>${unit}</i></strong></div>`;
export function diplomacyReport(domestic,selectedId,tab){
 const rows=diplomaticRows(domestic),home=domestic.playerCountryId;
 const title=name=>`<div class="civil-detail-title"><small>礼部勘录 · ${esc(domestic.countries.find(c=>c.id===home).name)}</small><h2>${name}</h2></div>`;
 const note='<p class="civil-note">友善度为 0–100；贸易年数、约定额度与累计收入分别登记。外交办理请召见礼部尚书。</p>';
 if(tab!=='detail'){
  const trade=tab==='trade',columns=trade?['国家','贸易年数 / 年','贸易额度 / 两','累计贸易收入 / 两']:['国家','两国关系','友善度','人口 / 人','土地 / 亩'];
  return title(trade?'贸易总表':'外交总表')+`<div class="civil-table report-table diplomacy-table"><table><thead><tr>${columns.map(c=>`<th scope="col">${c}</th>`).join('')}</tr></thead><tbody>${rows.map(({country:c,relationship:r})=>{const s=countrySummary(domestic,c.id),values=trade?[fmt(r.trade.years),fmt(r.trade.quota),fmt(r.trade.income)]:[treatyLabel(r,home),`${r.friendship} / 100`,fmt(s.total),fmt(s.area)];return `<tr data-diplomatic-country="${c.id}"><th scope="row"><button class="province-link" data-country="${c.id}">${esc(c.name)}</button></th>${values.map(v=>`<td>${v}</td>`).join('')}</tr>`;}).join('')}</tbody></table></div>${note}`;
 }
 if(!selectedId||selectedId===home)return title('外交细查')+`<p class="civil-note">请选择地图上的邻邦，查阅两国关系与贸易记录。</p><div class="province-list">${rows.map(({country:c,relationship:r})=>`<button data-country="${c.id}"><b>${esc(c.name)}</b><span>${treatyLabel(r,home)} · 友善度 ${r.friendship}</span></button>`).join('')}</div>`;
 const s=countrySummary(domestic,selectedId),r=relationBetween(domestic,home,selectedId);
 return title(esc(s.country.name)+'外交表')+`<div class="diplomacy-relation"><span>两国关系</span><strong>${treatyLabel(r,home)}</strong></div><div class="civil-metrics">${metric('友善度',r.friendship,'/100')}${metric('贸易年数',r.trade.years,'年')}${metric('贸易额度',r.trade.quota,'两')}${metric('累计贸易收入',r.trade.income,'两')}${metric('人口',s.total,'人')}${metric('土地',s.area,'亩')}</div>${note}`;
}
