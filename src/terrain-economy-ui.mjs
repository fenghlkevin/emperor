import {geographicProfile} from './province-geography.mjs';
import {TERRAIN_SECTORS,economicTerrain,terrainRule,terrainLandLimit,industryLandLimit,industryLandAvailable} from './terrain-economy.mjs';
const esc=s=>s.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const names={agriculture:'农业',pastoral:'牧业',commerce:'商业',industry:'工业'};
const fmt=n=>n.toLocaleString('zh-CN');
export function terrainEconomyMarkup(p){
 const geography=geographicProfile(p.id),r=terrainRule(p),bonus=Object.entries(r.bonus).map(([k,n])=>`${names[k]}产出＋${Math.round(n*100)}%`).join('、');
 const legacy=p.terrainCapacity&&(p.terrainCapacity.legacyLand>Math.floor(p.area*r.land)||TERRAIN_SECTORS.some((k,i)=>p.terrainCapacity.legacySectors[k]>Math.floor(p.cityCapacity.land*r.shares[i])));
 return `<section class="civil-note" data-terrain-economy><strong>地形：${economicTerrain(p)} · ${bonus}</strong>${geography?`<p data-geography-description>${esc(geography.description)}</p>`:''}<p>地理总面积${fmt(p.area)}亩 · 地形可开发比例${Math.round(r.land*100)}% · 最终土地上限${fmt(terrainLandLimit(p))}亩 · 当前已解锁${fmt(p.cityCapacity.land)}亩。扩城在最终上限内解锁土地。</p><p>${TERRAIN_SECTORS.map((k,i)=>`${names[k]}用地≤${Math.round(r.shares[i]*100)}%（上限${fmt(industryLandLimit(p,k))}亩，余量${fmt(industryLandAvailable(p,k))}亩）`).join('；')}。</p><p>四业共用土地，比例是各业上限，不要求固定分配；各业上限不可同时用满。特色加成已计入实际产量，人手不足仍按用工比例减产。${legacy?'旧档既有土地及在建项目保留；超出比例的产业不能继续增加，扩城后按新比例计算。':''}</p></section>`;
}
