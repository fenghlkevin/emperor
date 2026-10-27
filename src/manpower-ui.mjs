import {INDUSTRY_JOBS,industryStaffing} from './industry-labor.mjs';
import {activeDrafts,draftCapacity,cityDraftCapacity} from './manpower.mjs';
import {laborProfile} from './labor.mjs';
const names={farmers:'农人',herders:'牧人',merchants:'商人',workers:'工人'};
export function draftControls(d,provinces,rates={},attribute='data-draft-rate'){
 const format=n=>n.toLocaleString('zh-CN');
 return `<details class="draft-controls" open><summary>抽调产业人口 · 优先使用空闲劳力</summary><p>空闲劳力${format(provinces.reduce((n,p)=>n+laborProfile(p).available,0))}人；四业合计尚可累计抽调${format(provinces.reduce((n,p)=>n+cityDraftCapacity(d,p),0))}人。所选比例为本次最多抽调比例；各业及四业合计在役抽调均不超过50%，士兵与民夫共用额度。</p><div class="industry-targets">${Object.values(INDUSTRY_JOBS).map(job=>`<label>${names[job]}：现有${format(provinces.reduce((n,p)=>n+p.population.professions[job],0))}人，已抽${format(provinces.reduce((n,p)=>n+activeDrafts(d,p,job),0))}人，最多再抽${format(provinces.reduce((n,p)=>n+draftCapacity(d,p,job),0))}人<select ${attribute}="${job}" aria-label="${names[job]}抽调比例">${[0,10,20,30,40,50].map(n=>`<option value="${n}" ${n===(rates[job]??0)?'selected':''}>${n?n+'%上限':'不抽调'}</option>`).join('')}</select></label>`).join('')}</div><p>抽调会减少钱粮产出，并增加军饷/民夫薪俸及官府供粮；确认前请核对实际变化。</p></details>`;
}
export function staffingMarkup(p,turn){
 if(!p.industryLabor)return '';
 const labels={agriculture:'农业',pastoral:'牧业',commerce:'商业',industry:'工业'};
 return `<p class="civil-note" data-staffing>产业实际用工 / 满员需求：${Object.keys(INDUSTRY_JOBS).map(k=>{const q=industryStaffing(p,k,turn);return `${labels[k]}${q.workers.toLocaleString()}/${q.required.toLocaleString()}人（缺${q.vacant.toLocaleString()}人）`;}).join('；')}。缺员按用工比例生产；新人口先进入空闲池，不自动挤占军役人选；已锁定岗位不自动招工，可在产业用工页补缺。</p>`;
}
