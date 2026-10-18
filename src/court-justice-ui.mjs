import {courtJusticeCases,courtJusticePlan} from './court-justice.mjs';
import {executeJustice} from './justice.mjs';
import {officialArt} from './official-art.mjs';
import {courtBlock} from './emperor.mjs';
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function openCourtJustice(initial,root,onCommit,onClose){
 let state=initial,view='investigate',selected=null,stage='draft',draft=null,receipt=null,error='',busy=false,amount=initial.domestic.justice.funding||100;
 const d=document.createElement('dialog');d.className='court-play-dialog court-personnel court-justice';d.setAttribute('aria-label','刑部听案席');root.append(d);d.onclose=()=>{d.remove();onClose?.();};
 function propose(p){try{const reason=courtBlock(state);if(reason)throw Error(reason);draft=courtJusticePlan(state,p);stage='confirm';error='';draw();}catch(e){error=e.message;showError();}}
 function showError(){d.querySelector('[data-case-error]').textContent=error;}
 function draw(){
  const cases=courtJusticeCases(state,view),row=cases.find(c=>c.official.id===selected)??cases[0];selected=row?.official.id??null;const o=row?.official,art=o&&officialArt(o)?.full;
  let main='',detail='',buttons='';
  if(view==='amnesty'){
   main=`<section class="justice-amnesty"><span>赦</span><h2>赦令归籍</h2><p>百姓归籍与州郡治安之间，由陛下权衡。</p><div class="justice-states">${state.domestic.provinces.filter(p=>p.countryId===state.domestic.playerCountryId).map(p=>`<article><b>${esc(p.name)}</b><p>人口 ${p.population.total.toLocaleString()} 人</p><small>归籍 +${Math.max(1,Math.floor(p.population.total*.005))} 人 · 治安 −5（最低0）</small></article>`).join('')}</div></section>`;
   detail='<small class="court-kicker">赦令不等于释放囚臣</small><h2>天下特赦</h2><p>按既有规则增加各州总人口，同时降低治安。天牢中的官员仍须逐案裁决。</p>';buttons=`<button class="court-vermilion" data-case-propose="amnesty" ${state.domestic.justice.lastAmnesty===state.turn?'disabled':''}>${state.domestic.justice.lastAmnesty===state.turn?'本旬已颁赦':'拟定赦令 →'}</button>`;
  }else{
   main=`<div class="justice-dossiers">${cases.map(c=>`<button data-case="${esc(c.official.id)}" aria-pressed="${selected===c.official.id}"><span>${view==='prison'?'囚':view==='history'?'结':'案'}</span><b>${esc(c.official.name)}</b><small>${esc(c.official.office)}</small></button>`).join('')||'<p class="justice-empty">'+(view==='prison'?'天牢暂无在押官员。':view==='history'?'暂无已结案记录。':'尚无已发现的官员案卷。可拨付密查经费；不会凭空生成罪证。')+'</p>'}</div><section class="justice-hearing">${art?`<img src="${esc(art)}" alt="${esc(o.name)}立绘">`:''}<article><small class="court-kicker">${view==='prison'?'天牢复核':'案卷核阅'}</small><h2>${esc(o?.name??'候报')}</h2><p>${esc(row?.evidence??'查阅不消耗资源；密查由真实官员忠诚与刑部能力判定。')}</p>${row?.prison?`<p>入狱第${row.prison.admittedTurn}旬 · 已服刑${row.prison.servedTurns}旬</p><p>${esc(row.personality.name)}：${esc(row.prison.lastReason)}；累计忠诚 ${row.prison.totalDelta>=0?'+':''}${row.prison.totalDelta}</p>${o.status==='imprisoned'?`<strong>下旬预计忠诚 ${row.delta>=0?'+':''}${row.delta}</strong>`:''}`:''}</article></section>`;
   detail=`<small class="court-kicker">${view==='prison'?'在押复核':view==='history'?'结案存照':'刑部密查'}</small><h2>${esc(o?.name??'待呈案卷')}</h2>${o?`<p>${esc(o.office)} · 忠诚 ${o.loyalty}%</p><p>当前状态：${esc({serving:'在任，已发现',imprisoned:'在押',executed:'已处斩',released:'已释放为民',rebel:'已叛逃'}[o.status])}</p>`:''}`;
   if(view==='investigate')detail+=`<details class="justice-funding" open><summary>密查经费 · 当前每旬 ${state.domestic.justice.funding} 两</summary><p>拨付当下执行一次密查，后续每旬再扣同额。设为0停止后续调查。</p><label>两 <input data-case-funding type="number" min="0" max="10000" step="1" value="${amount}"></label><button data-case-propose="funding">预览调查拨款</button></details>`;
   if(o&&view!=='history')buttons=`<div class="personnel-seal-actions">${o.status==='imprisoned'?'<button data-case-propose="release">释放为民</button>':'<button data-case-propose="imprison">收押天牢</button>'}<button class="court-vermilion" data-case-propose="execute">拟旨处斩</button></div>`;
  }
  if(stage==='confirm'){detail=`<small class="court-kicker">刑部御批</small><h2>请陛下裁决</h2><p>颁行后：${esc(draft.message)}</p><h3>支银 ${draft.cost.toLocaleString()} 两</h3><p>国库 ${state.stats.treasury.toLocaleString()} → ${(state.stats.treasury-draft.cost).toLocaleString()} 两</p>${draft.newCases.length?`<p>本次发现 ${draft.newCases.length} 名官员，颁旨后呈上真实案卷。</p>`:''}`;buttons=`<p class="atlas-confirm-risk">${esc(draft.warning)}</p><div class="personnel-seal-actions"><button data-case-edit>再斟酌</button><button class="court-vermilion" data-case-seal>落印颁旨</button></div>`;}
  if(stage==='receipt'){detail=`<small class="court-kicker">执行事实</small><h2>刑部复奏</h2><p>${esc(receipt.message)}</p><p>${esc(receipt.warning)}</p>${receipt.newCases.length?`<p>已呈 ${receipt.newCases.length} 份真实案卷，请继续核阅。</p>`:''}`;buttons='<button class="court-vermilion" data-case-edit>继续核阅 →</button>';}
  d.innerHTML=`<header class="personnel-scene-header"><div><small class="court-kicker">刑 部 · 听 案 席</small><h1>核实案卷，慎断生死。</h1></div><button class="court-dialog-close" data-case-close>收席 ×</button></header><nav class="personnel-scene-views">${[['investigate','密查案卷'],['prison','天牢复核'],['amnesty','天下特赦'],['history','已结案卷']].map(([id,label])=>`<button data-case-view="${id}" aria-pressed="${view===id}" ${stage==='confirm'?'disabled':''}>${label}</button>`).join('')}</nav><div class="personnel-scene-body"><section class="personnel-scene-main">${main}<details class="justice-history"><summary>精查刑部原始记录</summary>${state.domestic.justice.history.map(h=>`<p>${esc(h)}</p>`).join('')||'<p>暂无记录</p>'}</details></section><aside class="personnel-scene-side"><div class="personnel-scene-detail">${detail}</div><footer class="personnel-decision">${buttons}<p role="status" data-case-error>${esc(error)}</p><small>国库 ${state.stats.treasury.toLocaleString()} 两 · 第${state.turn}旬</small></footer></aside></div>`;
  d.querySelector('[data-case-close]').onclick=()=>d.close();
  d.querySelectorAll('[data-case-view]').forEach(b=>b.onclick=()=>{view=b.dataset.caseView;stage='draft';error='';draw();});
  d.querySelectorAll('[data-case]').forEach(b=>b.onclick=()=>{selected=b.dataset.case;stage='draft';error='';draw();});
  d.querySelector('[data-case-funding]')?.addEventListener('input',e=>{amount=e.target.value===''?NaN:Number(e.target.value);});
  d.querySelectorAll('[data-case-propose]').forEach(b=>b.onclick=()=>propose({kind:b.dataset.casePropose,...(b.dataset.casePropose==='funding'?{amount}:{officialId:selected})}));
  d.querySelector('[data-case-edit]')?.addEventListener('click',()=>{stage='draft';error='';draw();});
  d.querySelector('[data-case-seal]')?.addEventListener('click',()=>{if(busy||stage!=='confirm')return;busy=true;try{const result=executeJustice(state,draft.command);state=onCommit(result.state)??result.state;receipt={...draft,message:result.message};stage='receipt';error='';draw();}catch(e){error=e.message;showError();}finally{busy=false;}});
 }
 draw();d.showModal();return d;
}
