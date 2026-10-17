import {worldKitSummary,ENABLED_KITS} from './troop-kit-world.mjs';
import {TROOP_KITS} from './troop-kits.mjs';
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function kitMilitaryReport(d,countryId,selectedId,tab){
 const rows=worldKitSummary(d,countryId),country=d.countries.find(c=>c.id===countryId),kits=TROOP_KITS.filter(k=>ENABLED_KITS.includes(k.id)),selected=rows.find(r=>r.id===selectedId);
 const title=`<div class="civil-detail-title"><small>兵部 · ${esc(country.name)}</small><h2>${selected?esc(selected.name)+'军事表':'兵员与套装军备'}</h2>${selected?'<button data-back-country>返回全国军务</button>':''}</div>`;
 const link=r=>r.id==='central'?'<button data-central>中央</button>':countryId===d.playerCountryId?`<button data-province="${esc(r.id)}">${esc(r.name)}</button>`:esc(r.name);
 const display=selected?[selected]:rows,total=rows.reduce((n,r)=>n+r.soldiers.total,0),used=rows.reduce((n,r)=>n+r.soldiers.used,0);
 return title+`<div class="civil-metrics"><div class="civil-metric"><small>全国士兵</small><strong>${total.toLocaleString()}<i>人</i></strong></div><div class="civil-metric"><small>出战占用</small><strong>${used.toLocaleString()}<i>人</i></strong></div></div><div class="civil-table military-table report-table"><table><thead><tr><th>驻地</th><th>士兵 / 占用 / 可用</th><th>训练</th>${kits.map(k=>`<th>${k.name}装备<br>库存 / 占用 / 可用</th>`).join('')}</tr></thead><tbody>${display.map(r=>`<tr><th>${link(r)}</th><td>${r.soldiers.total} / ${r.soldiers.used} / ${r.soldiers.available}</td><td>${r.training}</td>${kits.map(k=>`<td>${r.kits[k.id].total} / ${r.kits[k.id].used} / ${r.kits[k.id].available}</td>`).join('')}</tr>`).join('')}</tbody></table></div><p class="civil-note">完整兵种装备按人份统计；中央已从来源州兵籍扣除，不重复计兵。出战占用不可再调拨，生还携装返回原驻地。</p>`;
}
