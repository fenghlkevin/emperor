import {turnEconomyReport} from './turn-economy-report.mjs';
import {projectScheduledEconomy} from './economy-projection.mjs';
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fmt=n=>Number(n).toLocaleString('zh-CN');
const table=(head,rows)=>`<div class="civil-table"><table><thead><tr>${head.map(h=>`<th scope="col">${h}</th>`).join('')}</tr></thead><tbody>${rows.map(row=>`<tr>${row.map(v=>`<td>${v}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
export function turnEconomyMarkup(state,view='actual') {
 const r=turnEconomyReport(state),f=r.forecast;
 if(view==='forecast')return `<h2>下旬常规预测 · 第${f.turn}旬</h2>${table(['预计收入 / 两','预计应支 / 两','常规结余 / 两'],[[fmt(f.income),fmt(f.due),fmt(f.net)]])}<h3>全国粮食预测</h3>${table(['期初粮','农牧粮赋入库','供粮需求','仓损','预计缺口','预计余粮'],[[f.grain.opening,f.grain.produced,f.grain.need,f.grain.storageLoss,f.grain.shortfall,f.grain.closing].map(fmt)])}<h3>各州供粮预测</h3>${table(['州郡','农牧粮赋入全国粮库','供粮需求','预计缺口'],r.provinces.map(p=>[esc(p.name),...[p.forecast.produced,p.forecast.need,p.forecast.shortfall].map(fmt)]))}<p class="civil-note">全国钱粮共用。农牧粮赋统一入库后供给各州；全国缺粮时按需求比例分配。预测不含未来随机灾害与事件。</p>`;
 const row=r.current;
 return `<h2>本旬实际收付 · 第${r.turn}旬</h2>${row?table(['期初国库','实际收入','实际支出','现金净变动','当前期末','新增债务'],[[row.opening,row.income,row.paid,row.net,row.closing,row.debtAdded].map(fmt)]):'<p>本旬尚无完整收付记录；不把预测当作实绩。</p>'}<p class="civil-note">当前国库${fmt(r.treasury)}两，国债${fmt(r.debt)}两。本旬交易仍可能继续；应付未付单列为债务。</p>${r.previous?`<p>最近已结束的记账旬：第${r.previous.turn}旬，现金净变动${fmt(r.previous.net)}两。</p>`:''}<h3>各州最近供粮记录</h3>${table(['州郡','结算旬','需粮','统一分配','缺口'],r.provinces.map(p=>p.supply?[esc(p.name),p.supply.turn,...[p.supply.need,p.supply.consumed,p.supply.shortfall].map(fmt)]:[esc(p.name),'尚未结算','—','—','—']))}<p class="civil-note">各州只记录产出、需求与实际供给，全国库存和流水统一记账。旧制历史供粮记录保留原旬序。</p>`;
}
export function turnLaborMarkup(state) {
 const rows=turnEconomyReport(state).provinces;
 return `<h3>人口与劳动力 · 试行比例75%</h3>${table(['州郡','总人口','劳动上限','非劳动力','已分配岗位','可调劳力','既有超额岗位'],rows.map(p=>[esc(p.name),...[p.labor.total,p.labor.capacity,p.labor.nonLabor,p.labor.assigned,p.labor.available,p.labor.overCapacity].map(fmt)]))}<h3>产业岗位与实际用工</h3>${table(['州郡','产业','实际人数','满员需求','空岗'],rows.flatMap(p=>Object.entries(p.staffing).map(([key,q])=>[esc(p.name),({agriculture:'农业',pastoral:'牧业',commerce:'商业',industry:'工业'})[key],fmt(q.workers),fmt(q.required),fmt(q.vacant)])))}<p class="civil-note">开发完成后从空闲劳力安排对应人口；空岗不产出。征兵、征民夫可按选择抽调产业人口，确认前预览钱粮减产与开支。非劳动力不能直接征兵。既有超额岗位保留并提示，可调配回落，不能继续扩张超额。试行比例为保留默认开局职业而选择，后续统一平衡。</p>`;
}
export function turnResourceMarkup(state,view){
 if(state.domestic.resourceRulesVersion!==1)return '';
 const rows=turnEconomyReport(state).provinces;
 return `<h3>${view==='forecast'?'下旬预计':'最近实际'}民间生产与官府粮食</h3>${table(['州郡','旬序','民间产粮','民间口粮','农牧粮赋入仓','官府口粮','赈济需求','实际/预计缺口'],rows.map(p=>{
  const q=view==='forecast'?p.resourceForecast:p.resourceActual;
  return q?[esc(p.name),q.turn,...[q.production.produced,q.civilian.need,q.grain.tax,q.grain.officialNeed,q.grain.reliefNeed,q.grain.shortfall].map(fmt)]:[esc(p.name),'尚未结算','—','—','—','—','—','—'];
 }))}<p class="civil-note">民间先自给，农牧粮赋才入官仓；官府只承担军民夫口粮和实际赈济需求，不重复扣全人口口粮。农牧不再重复折银征税。</p>`;
}
export function turnGrainMarkup(state) {
 const r=turnEconomyReport(state),p=r.grainPeriod;
 return `<h3>全国粮食实际流水</h3>${p?table(['期初','实际入库','实际出库','净变动','当前期末'],[[p.opening,p.income,p.expense,p.net,p.closing].map(fmt)]):'<p>本旬尚无粮食流水。</p>'}<p>全国存粮 ${fmt(r.grain)} 石。流水包含农牧粮赋、供粮、仓损、购粮、灾损与事件；旧档合并以当时总库存为基线，历史流水不补造。</p>`;
}
export function scheduledEconomyMarkup(state){
 const p=projectScheduledEconomy(state);
 if(!p.available)return `<h3>已知事项收支推演</h3><p>${esc(p.reason)}</p>`;
 return `<h3>已知事项收支推演 · 第${p.turn}旬</h3>${table(['国库期初','预计实收','预计实付','现金净变动','预计期末','新增债务'],[[p.cash.opening,p.cash.income,p.cash.paid,p.cash.net,p.cash.closing,p.cash.debtAdded].map(fmt)])}${table(['全国存粮期初','预计期末','净变动'],[[p.grain.opening,p.grain.closing,p.grain.net].map(fmt)])}<p class="civil-note">${esc(p.assumptions)}</p><details><summary>核对预计执行事项</summary>${table(['事项','入银','付银','欠支转债'],p.entries.map(e=>[esc(e.reason),fmt(e.income),fmt(e.expenditure),fmt(e.debtAdded)]))}</details>`;
}
export function turnOfficialMarkup(state,view){
 if(state.domestic.officialEffectsVersion!==1)return '';
 const rows=turnEconomyReport(state).provinces.map(p=>({p,q:view==='forecast'?p.resourceForecast:p.resourceActual})).filter(x=>x.q?.officers&&x.q?.officialImpact);
 if(!rows.length)return '<p class="civil-note">尚无官员归因实绩；此前没有记录的加成不补造。</p>';
 const percent=n=>`${n>=0?'+':''}${Math.round(n*1000)/10}%`;
 const training=state.domestic.general.trainingEffect,trainingNote=view==='actual'&&training?`<p>最近中央训练实绩 · 第${training.turn}旬：大将军${esc(training.source.name)}（能力${training.source.ability}），训练${training.before}→${training.after}，实际+${training.delta}；基础增量${training.baseGain}，官效后${training.gain}、本次增量上限${training.gainCap}，既定训练保底${training.floor}另计。调任不改写此记录。</p>`:'';
 return `<details class="official-effect-details"><summary>${view==='forecast'?'下旬官员效果与来源':'实际官员效果与来源'}</summary><p>州牧只作用本州生产，户部作用征收效率与损耗；每项来源只计一次。生产与征收调整各限±10%，征收损耗最高5%。将军、宰相、侍郎不叠通用增产。</p>${table(['州郡','基础产粮','生产增减','最终产粮','效率后农牧粮赋','征收损耗','官仓实入'],rows.map(({p,q})=>[esc(p.name),fmt(q.officialImpact.baseProduction),fmt(q.officialImpact.productionDelta),fmt(q.production.produced),fmt(q.officialImpact.grainAssessed),fmt(q.officialImpact.grainLoss),fmt(q.grain.tax)]))}${table(['州郡','钱税基额','效率后征收','损耗','国库实入'],rows.map(({p,q})=>[esc(p.name),fmt(q.officialImpact.cashBase),fmt(q.officialImpact.cashAssessed),fmt(q.officialImpact.cashLoss),fmt(q.cash.tax)]))}${rows.map(({p,q})=>`<p>${esc(p.name)} · 第${q.turn}旬：${q.officers.sources.map(o=>`${esc(o.name)}（${o.active?(o.role==='governor'?'本州州牧':'户部尚书'):'空缺，无加成'}，能力${o.ability}、清廉${o.integrity}）`).join('；')}。生产${percent(q.officers.productionRate)}，征收${percent(q.officers.collectionRate)}，损耗${Math.round(q.officers.lossRate*1000)/10}%。</p>`).join('')}${trainingNote}${centralActivityMarkup(state)}<p>实绩保存当旬官员身份与结果，后续调任不重写历史；预测依据当前在任官员，尚不包含未来随机变化。</p></details>`;
}
export function openTurnEconomyReport(state,root,onClose) {
 const d=document.createElement('dialog');d.className='court-play-dialog court-atlas turn-economy-report economy-album';
 d.setAttribute('aria-label','国计旬报');let view='actual',page=0;root.append(d);
 d.onclose=()=>{d.remove();onClose?.();};
 function draw(){
  const r=turnEconomyReport(state),forecast=view==='forecast',cash=forecast?r.forecast:r.current;
  const source=document.createElement('div');source.innerHTML=`${forecast?scheduledEconomyMarkup(state):''}${turnEconomyMarkup(state,view)}${turnResourceMarkup(state,view)}${turnOfficialMarkup(state,view)}${forecast?'':turnGrainMarkup(state)}${turnLaborMarkup(state)}`;
  const notes=[...source.querySelectorAll('p')].flatMap(p=>p.textContent.match(/[\s\S]{1,140}/g)??[]);
  const pages=[];
  for(const t of source.querySelectorAll('table')){
   const labels=[...t.querySelectorAll('thead th')].map(h=>h.textContent);
   let heading=t.parentElement.previousElementSibling;while(heading&&!/^H[23]$/.test(heading.tagName))heading=heading.previousElementSibling;
   for(const row of t.querySelectorAll('tbody tr')){
    const values=[...row.children].map(c=>c.textContent);
    for(let i=0;i<labels.length;i+=4)pages.push({title:heading?.textContent??'钱粮明细',fields:labels.slice(i,i+4).map((label,j)=>[label,values[i+j]]),row:labels[0]==='州郡'?values[0]:''});
   }
  }
  page=Math.min(page,pages.length);const detail=pages[page-1];
  const stat=(name,value,unit='两')=>`<div><small>${name}</small><strong>${value==null?'—':fmt(value)}<em>${unit}</em></strong></div>`;
  d.innerHTML=`<header class="atlas-header"><h1>国计旬报</h1><button class="court-dialog-close" data-close aria-label="关闭旬报">收起 ×</button></header><nav class="economy-tabs"><button data-view="actual" aria-pressed="${!forecast}">本旬实绩</button><button data-view="forecast" aria-pressed="${forecast}">下旬预计</button><span>第 ${forecast?r.forecast.turn:r.turn} 旬</span><button data-help aria-label="钱粮记账说明">？</button></nav><section class="economy-leaf">${page===0?`<div class="economy-pictures"><article><div class="economy-art economy-art-treasury" aria-hidden="true"></div><h2>国库</h2>${stat('现银',r.treasury)}${stat('国债',r.debt)}</article><article><div class="economy-art economy-art-accounts" aria-hidden="true"></div><h2>${forecast?'预计收支':'实际收付'}</h2>${stat(forecast?'预计收入':'实收',cash?.income)}${stat(forecast?'预计应支':'实付',forecast?cash?.due:cash?.paid)}${stat('净额',cash?.net)}</article><article><div class="economy-art economy-art-grain" aria-hidden="true"></div><h2>粮仓</h2>${stat('全国存粮',r.grain,'石')}${stat(forecast?'预计期末':'本旬出库',forecast?r.forecast.grain.closing:r.grainPeriod?.expense,'石')}</article></div>`:`<h2>${esc(detail.title)}</h2>${detail.row?`<p class="economy-province">${esc(detail.row)}</p>`:''}<div class="economy-fields">${detail.fields.map(([k,v])=>`<div><small>${esc(k)}</small><strong>${esc(v??'—')}</strong></div>`).join('')}</div>`}</section><footer class="economy-pagination"><button data-page="0" ${page===0?'disabled':''}>概览</button><div><button data-page="${page-1}" aria-label="上一页" ${page===0?'disabled':''}>‹</button><select data-leaf aria-label="选择账页"><option value="0">钱粮概览</option>${pages.map((p,i)=>`<option value="${i+1}" ${page===i+1?'selected':''}>${i+2} · ${esc(p.title)}${p.row?' · '+esc(p.row):''}</option>`).join('')}</select><button data-page="${page+1}" aria-label="下一页" ${page===pages.length?'disabled':''}>›</button></div><span class="economy-page-count">${page+1} / ${pages.length+1}</span></footer>`;
  d.querySelectorAll('[data-close]').forEach(b=>b.onclick=()=>d.close());
  d.querySelectorAll('[data-view]').forEach(b=>b.onclick=()=>{view=b.dataset.view;page=0;draw();});
  d.querySelector('[data-leaf]').onchange=e=>{page=Number(e.target.value);draw();};
  d.querySelectorAll('[data-page]').forEach(b=>b.onclick=()=>{page=Number(b.dataset.page);draw();});
  d.querySelector('[data-help]').onclick=()=>{
   let n=0;const help=document.createElement('dialog');help.className='economy-help';help.setAttribute('aria-label','钱粮记账说明');d.append(help);
   const text=['实绩记录已发生的收付；预计按当前安排推演，不含未来随机事件。查阅不消耗资源，也不推进时间。',...notes];
   function show(){help.innerHTML=`<h2>钱粮记账说明</h2><p>${esc(text[n])}</p><footer><button data-prev ${n===0?'disabled':''}>‹</button><span>${n+1} / ${text.length}</span><button data-next ${n===text.length-1?'disabled':''}>›</button><button data-done>知道了</button></footer>`;help.querySelector('[data-prev]').onclick=()=>{n--;show();};help.querySelector('[data-next]').onclick=()=>{n++;show();};help.querySelector('[data-done]').onclick=()=>help.close();}help.onclose=()=>help.remove();show();help.showModal();
  };
 }
 draw();d.showModal();return d;
}

export function centralActivityMarkup(state){
 const d=state.domestic,home=d.countries.find(c=>c.id===d.playerCountryId),rows=[];
 for(const r of d.governance.records.filter(r=>r.reason.startsWith('宰相')).slice(0,5))rows.push(`第${r.turn}旬：${r.reason}`);
 for(const r of d.personnel.history.filter(r=>r.includes('制举揭榜')).slice(0,3))rows.push(r);
 for(const r of d.foodRelief.history.filter(r=>r.procurement).slice(0,3))rows.push(`第${r.turn}旬：户部侍郎${r.procurement.source.name}采购${r.amount}石，实付${r.cost}两，优惠率${Math.round(r.procurement.discountRate*1000)/10}%、损耗率${Math.round(r.procurement.lossRate*1000)/10}%`);
 for(const p of d.provinces.filter(p=>p.countryId===d.playerCountryId))for(const r of p.projectLabor?.allocations??[]){const e=r.laborEffect;if(e?.source.id&&r.kind!=='development')rows.push(`第${p.projectLabor.turn}旬：${p.name}工部侍郎${e.source.name}调度，基础民夫${e.baseWorkers}→${e.workers}人，本次实际投入${r.speed?r.granted:0}人`);}
 for(const r of home.ledger.filter(r=>!r.legacy).slice(0,2))for(const e of r.entries.filter(e=>e.reason.includes('兵部尚书')))rows.push(`第${r.turn}旬：${e.reason}`);
 for(const r of d.troopKits?.history.filter(r=>r.kind==='recruit').slice(0,3)??[])for(const line of r.lines.filter(line=>line.includes('兵部侍郎')))rows.push(`第${r.turn}旬：${line}`);
 return `<details><summary>中央官员最近办事实绩</summary>${rows.length?rows.map(line=>`<p>${esc(line)}</p>`).join(''):'<p>尚无办事实绩；过去未记录的效果不补造。</p>'}</details>`;
}
