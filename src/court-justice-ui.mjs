import {admittedPopulation} from './city-capacity.mjs';
import {commitOperation} from './operation-result.mjs';
import {courtJusticeCases,courtJusticePlan} from './court-justice.mjs';
import {executeJustice} from './justice.mjs';
import {courtOccupant} from './court-actors.mjs';
import {officialArt} from './official-art.mjs';
import {courtBlock} from './emperor.mjs';
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function openCourtJustice(initial,root,onCommit,onClose,{view='funding',office='justice-minister',readOnly=false}={}){
 readOnly=readOnly||office==='justice-deputy';
 if(readOnly&&view!=='prison')throw Error('刑部侍郎仅查阅天牢；裁决请召刑部尚书。');
 const officeName=readOnly?'刑部侍郎':'刑部尚书';
 let state=initial,index=0,draft=null,error='',busy=false,amount=initial.domestic.justice.funding;
 const d=document.createElement('dialog');d.className='court-play-dialog court-atlas justice-simple justice-scroll';d.setAttribute('aria-label',officeName);root.append(d);d.onclose=()=>{d.remove();onClose?.();};
 function draw(){
  const cases=courtJusticeCases(state,view);index=Math.max(0,Math.min(index,cases.length-1));const o=cases[index]?.official;
  const title={funding:'设置调查经费',prison:'天牢',amnesty:'特赦',investigate:'刑部奏报'}[view];
  let body='',buttons='';
  if(draft){body=`<h2>请陛下裁决${['imprison','reinstate'].includes(draft.command.kind)?` <span class="justice-order-seal">${draft.command.kind==='imprison'?'收押':'启用'}</span>`:''}</h2><p>${esc(draft.message)}</p>${draft.cost?`<p>支银 ${draft.cost.toLocaleString()} 两</p>`:''}${draft.command.kind==='execute'?'<p>处斩后不可复生。</p>':''}`;buttons='<button data-case-edit>返回修改</button><button class="court-vermilion" data-case-seal>确认颁旨</button>';}
  else if(view==='funding'){body=`<label class="atlas-amount">调查经费 / 两每旬<div><button data-step="-100" aria-label="减少100两">−</button><input data-case-funding aria-label="调查经费" type="number" min="0" max="10000" step="1" value="${Number.isFinite(amount)?amount:''}"><button data-step="100" aria-label="增加100两">＋</button></div></label><p>每旬拨付，设为 0 停止调查。</p>`;buttons='<button class="court-vermilion" data-case-propose="funding">拟旨预览 →</button>';}
  else if(view==='amnesty'){const added=state.domestic.provinces.filter(p=>p.countryId===state.domestic.playerCountryId).reduce((n,p)=>n+admittedPopulation(p,Math.max(1,Math.floor(p.population.total*.005))),0);body=`<h2>特赦天下</h2><p>归籍人口 +${added.toLocaleString()} 人</p><p>各州治安 −5 · 不释放天牢官员</p>`;buttons=`<button class="court-vermilion" data-case-propose="amnesty" ${state.domestic.justice.lastAmnesty===state.turn?'disabled':''}>${state.domestic.justice.lastAmnesty===state.turn?'本旬已特赦':'拟旨预览 →'}</button>`;}
  else if(o){const art=officialArt(o),province=state.domestic.provinces.find(p=>p.id===o.provinceId),scores=[['智力',o.intelligence],['武力',o.martial],['统率',o.leadership],['政务',o.politics],['清廉',o.integrity],['经验',o.experience]];
   body=`<div class="justice-person-sheet">${art?.full?`<figure class="justice-person-art justice-scene-${view==='prison'?'prison':'hearing'}"><img src="${esc(art.full)}" alt="${esc(o.name)}立绘"></figure>`:''}<article class="justice-person-info"><small class="justice-person-status">${view==='prison'?'天牢在押':'密查呈报 · 待裁决'}</small><h2>${esc(o.name)}</h2><p class="justice-person-office">${esc(o.office)}${province?' · '+esc(province.name):''}</p><div class="justice-person-basics"><span>年龄 <b>${esc(o.age??'—')}</b> 岁</span><span>忠诚 <b>${o.loyalty}%</b></span></div><dl class="justice-person-scores">${scores.map(([label,value])=>`<div><dt>${label}</dt><dd>${esc(value??'—')}</dd></div>`).join('')}</dl><p class="justice-person-fact">${view==='prison'?`第 ${o.prison?.admittedTurn??'—'} 旬收押 · 已服刑 ${o.prison?.servedTurns??0} 旬 · 原职已撤`:`第 ${o.discoveredTurn} 旬查出异心，候旨处置`}</p></article></div><label class="justice-pages ministry-item-picker">选择案件<select data-case-select aria-label="选择全部案件">${cases.map((c,i)=>`<option value="${i}" ${i===index?'selected':''}>${esc(c.official.name)}</option>`).join('')}</select></label>`;buttons=`${view==='investigate'?'<button data-case-propose="dismiss">不予处理</button>':'<button data-case-propose="reinstate">重新启用</button>'}<button data-case-propose="${view==='prison'?'release':'imprison'}">${view==='prison'?'释放为民':'收押天牢'}</button><button class="court-vermilion" data-case-propose="execute">处斩</button>`;}
  else body=`<h2>${view==='prison'?'天牢暂无在押官员':'奏报已处理完毕'}</h2>`;
  if(readOnly)buttons='';
  d.classList.toggle('justice-funding-page',view==='funding'&&!draft);
  d.classList.toggle('justice-compact-command',view==='amnesty');
  d.classList.toggle('justice-prison-page',view==='prison');
  d.classList.toggle('justice-has-person',Boolean(o)&&!draft&&['investigate','prison'].includes(view));
  d.innerHTML=`<header class="atlas-header"><div><small class="court-kicker">${officeName}</small><h1>${title}</h1></div><button class="court-dialog-close" data-case-close>关闭 ×</button></header><section class="justice-simple-content">${body}</section><footer class="justice-simple-footer">${view==='funding'?`<small>国库 ${state.stats.treasury.toLocaleString()} 两</small>`:''}<p role="status" data-case-error>${esc(error)}</p><div class="atlas-confirm-actions">${buttons}</div></footer>`;
  if(d.classList.contains('justice-has-person')){const details=document.createElement('section');details.className='justice-case-details';for(const selector of ['.justice-person-basics','.justice-person-scores','.justice-person-fact']){const el=d.querySelector(selector);if(el)details.append(el);}d.querySelector('.justice-simple-footer').prepend(details);}
  if(d.classList.contains('justice-funding-page')){const content=d.querySelector('.justice-simple-content'),controls=document.createElement('section');controls.className='justice-funding-controls';while(content.firstChild)controls.append(content.firstChild);const minister=courtOccupant(state.domestic,'justice-minister'),art=minister&&officialArt(minister);content.innerHTML=`<figure class="justice-funding-scene">${art?.full?`<img src="${esc(art.full)}" alt="${esc(minister.name)}刑部尚书">`:''}</figure><div class="justice-funding-caption"><h2>刑部密查</h2><p>${minister?esc(minister.name)+' · 刑部尚书':'刑部署理'}</p></div>`;controls.insertAdjacentHTML('afterbegin',`<h2>拨银察吏</h2><p class="justice-funding-current">现行经费 ${state.domestic.justice.funding.toLocaleString()} 两 / 旬</p>`);controls.insertAdjacentHTML('beforeend','<dl class="justice-funding-outlook"><div><dt>本次拨付</dt><dd data-funding-cost></dd></div><div><dt>拨付后国库</dt><dd data-funding-balance></dd></div></dl>');d.querySelector('.justice-simple-footer').prepend(controls);}
  function updateFunding(){const cost=d.querySelector('[data-funding-cost]'),balance=d.querySelector('[data-funding-balance]');if(!cost)return;const valid=Number.isSafeInteger(amount)&&amount>=0&&amount<=10000;cost.textContent=valid?amount.toLocaleString()+' 两':'—';const short=valid&&amount>state.stats.treasury;balance.previousElementSibling.textContent=short?'国库缺额':'拨付后国库';balance.textContent=valid?Math.abs(state.stats.treasury-amount).toLocaleString()+' 两':'—';}
  updateFunding();
  d.querySelector('[data-case-close]').onclick=()=>d.close();
  d.querySelector('[data-case-funding]')?.addEventListener('input',e=>{amount=e.target.value===''?NaN:Number(e.target.value);error='';d.querySelector('[data-case-error]').textContent='';updateFunding();});
  d.querySelectorAll('[data-step]').forEach(b=>b.onclick=()=>{amount=Math.max(0,Math.min(10000,(Number.isFinite(amount)?amount:0)+Number(b.dataset.step)));draw();});
  d.querySelector('[data-case-select]')?.addEventListener('change',e=>{index=Number(e.target.value);error='';draw();});
  d.querySelectorAll('[data-page]').forEach(b=>b.onclick=()=>{index+=Number(b.dataset.page);draw();});
  d.querySelector('[data-case-edit]')?.addEventListener('click',()=>{draft=null;error='';draw();});
  d.querySelectorAll('[data-case-propose]').forEach(b=>b.onclick=()=>{try{if(readOnly)throw Error('查阅不办理裁决，请召见刑部尚书。');const reason=courtBlock(state);if(reason)throw Error(reason);draft=courtJusticePlan(state,{kind:b.dataset.casePropose,...(b.dataset.casePropose==='funding'?{amount}:{officialId:o?.id})});error='';}catch(e){error=e.message;}draw();});
  d.querySelector('[data-case-seal]')?.addEventListener('click',()=>{if(readOnly||busy||!draft)return;busy=true;try{const result=executeJustice(state,draft.command);state=commitOperation(onCommit,result.state)??result.state;draft=null;error='';if(view==='investigate'&&courtJusticeCases(state).length)draw();else d.close();}catch(e){error=e.message;d.querySelector('[data-case-error]').textContent=error;}finally{busy=false;}});
 }
 draw();d.showModal();return d;
}
