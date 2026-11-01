import {setQuantityLimits,affordableMaximum} from './quantity-controls.mjs';
import {militaryTroopArt,militaryScene} from './military-art.mjs';
import {openCentralTransfers} from './central-military-transfers-ui.mjs';
import {recruitmentCapacity} from './recruitment-capacity.mjs';
import {militaryPage} from './military-page.mjs';
import {localMapRegions,territoryView} from './territory-atlas.mjs';
import {territoryPath as currentTerritoryPath} from './campaign-map.mjs';
import {draftControls} from './manpower-ui.mjs';
import {commitOperation} from './operation-result.mjs';
import {militarySupport} from './military-support.mjs';
import {atlasBase,atlasLandClip,atlasBorders} from './atlas-base.mjs';
import {militaryRequestControls,bindMilitaryRequests} from './local-policy-ui.mjs';
import {courtMilitaryFeedback} from './court-military-feedback.mjs';
import {TROOP_KITS,kitProductionAllowed} from './troop-kits.mjs';
import {worldKitSummary,executeKitCommand,quoteKitCommand,centralKitProductionAllowed} from './troop-kit-world.mjs';
import {courtGarrisonPlan} from './court-garrison.mjs';
import {sprites} from './battle-sprite-data.mjs';
import {courtBlock} from './emperor.mjs';
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const names={inventory:'点检军营',purchase:'采办兵装',recruit:'募兵入营',dismiss:'遣兵还乡',transfer:'兵装调动'};
export function openCourtGarrison(initial,root,onCommit,onClose,options={}){
 if(options.kind==='transfer')return openCentralTransfers(initial,root,onCommit,onClose,options);
 let state=initial,kind=options.kind??'inventory',source='central',target='hebei',picking='source',kit='infantry',quantities={},amount=100,soldiers=100,stage='draft',draft=null,receipt=null,error='',busy=false,draftRates={};
 const d=document.createElement('dialog');d.className='court-play-dialog court-personnel court-garrison';d.setAttribute('aria-label','兵部军营舆图');root.append(d);d.onclose=()=>{d.remove();onClose?.();};
 const rows=()=>worldKitSummary(state.domestic),province=id=>state.domestic.provinces.find(p=>p.id===(id==='central'?state.domestic.centralArmy.sourceProvinceId:id));
 const command=()=>({kind,sourceId:source,...(kind==='transfer'?{targetId:target,soldiers,quantities:{...quantities}}:kind==='purchase'?{quantities:{...quantities}}:{amount,draftRates})});
 const troopArt=k=>{const s=sprites[k],f=s.walk[0];return `<svg viewBox="${f.join(' ')}" aria-hidden="true"><image href="${s.asset}" width="${s.width}" height="${s.height}"/></svg>`;};
 function propose(){try{const reason=courtBlock(state);if(reason)throw Error(reason);draft=courtGarrisonPlan(state,command());error='';stage='confirm';draw();}catch(e){error=e.message;d.querySelector('[data-garrison-error]').textContent=error;}}
 function map(){return `<svg class="garrison-map" viewBox="${territoryView(localMapRegions(state.domestic)).join(' ')}" aria-label="本国驻军舆图">${atlasBase('garrison-atlas',{domestic:state.domestic})}${localMapRegions(state.domestic).map(g=>{const p=province(g.id),owned=p.countryId===state.domestic.playerCountryId;return `<path ${atlasLandClip('garrison-atlas',g)} d="${currentTerritoryPath(g)}" data-garrison-depot="${g.id}" tabindex="${owned?0:-1}" role="button" aria-label="${esc(p.name)}" class="${g.id===source?'is-source':''} ${kind==='transfer'&&g.id===target?'is-target':''} ${owned?'':'is-foreign'}"/>`;}).join('')}${atlasBorders('garrison-atlas',state.domestic)}${localMapRegions(state.domestic).map(g=>`<text data-garrison-depot="${g.id}" role="button" tabindex="0" x="${g.center[0]}" y="${-g.center[1]}">${g.name}</text>`).join('')}</svg>`;}
 function draw(){
 if(['purchase','recruit','dismiss'].includes(kind))source='central';
 d.dataset.garrisonStage=stage;d.dataset.garrisonKind=kind;
 const row=rows().find(r=>r.id===source)??rows()[0];source=row.id;const selected=TROOP_KITS.find(k=>k.id===kit),stock=row.kits[kit],allowed=kitProductionAllowed(province(source),kit),totalKits=Object.values(row.kits).reduce((n,k)=>n+k.available,0),short=Math.max(0,row.soldiers.available-totalKits);
 const military=courtMilitaryFeedback(state);
 const capacity=kind==='recruit'?recruitmentCapacity(state,source,draftRates):null;
 const amountLimit=capacity?.max??(kind==='dismiss'?row.soldiers.available:null);
 if(amountLimit!==null)amount=Math.max(amountLimit?1:0,Math.min(amountLimit,Number.isFinite(amount)?Math.floor(amount):0));
 let detail=`<small class="court-kicker">${kind==='purchase'?'户部采办 · 中央武库':row.name+'驻地 · 训练 '+row.training}</small><h2>${names[kind]}</h2>${kind==='inventory'&&military?`<section data-military-feedback><h3>第${military.turn}旬 · ${esc(military.title)}</h3>${military.lines.map(line=>`<p>${esc(line)}</p>`).join('')}</section>`:''}<div class="garrison-strength"><p>兵员 ${row.soldiers.total} · 出战占用 ${row.soldiers.used}</p><strong>可出战 ${row.soldiers.available} 人</strong><p>各兵种可用套装合计 ${totalKits} 套 · 总量缺口 ${short} 套</p></div>`;
 if(kind==='purchase')detail+=`<section class="garrison-purchase-summary" aria-live="polite"><h3>统一收入中央武库</h3><p>中央空闲兵员 ${row.soldiers.available.toLocaleString()} 人<br>各兵种可用套装合计 ${totalKits.toLocaleString()} 套</p><small>每套供对应兵种一人使用；具体编队仍受各兵种库存限制。</small><p data-purchase-summary>选择左侧兵装数量</p></section><p>各兵种可直接填写数量，一次核定、统一入库。</p>`;
 if(kind==='transfer')detail+=`<p data-military-fact>调出 ${esc(row.name)} → 调入 ${esc(rows().find(r=>r.id===target)?.name??'请选择')}</p><label>调兵 / 人<input data-garrison-soldiers type="number" min="0" step="1" value="${soldiers}"></label><label>携${selected.name}装备 / 人份<input data-garrison-quantity type="number" min="0" step="1" value="${quantities[kit]??0}"></label>`;
 if(kind==='recruit'||kind==='dismiss')detail+=`<p>${kind==='recruit'?'招募每人需4两，新兵编入中央禁军；兵装须另行采办。':'退伍将士安排返乡或赴各州安置；兵装留库，招募费用不退还。'}</p><label>人数<input data-garrison-amount type="number" min="${amountLimit===0?0:1}" ${amountLimit!==null?`max="${amountLimit}"`:""} step="1" value="${amount}"></label>${kind==='recruit'?draftControls(state.domestic,state.domestic.provinces.filter(p=>source==='central'?p.countryId===state.domestic.playerCountryId:p.id===source),draftRates):''}`;
 if(capacity)detail+=`<section class="garrison-recruit-capacity" aria-live="polite"><h3>最多可募 ${capacity.max.toLocaleString()} 人</h3><p>入伍后编入中央禁军，驻${esc(province(source).name)}。</p><p>各州空闲劳力共 ${capacity.idle.toLocaleString()} 人</p>${capacity.industry?`<p>募足上限需从各业征调 ${capacity.industry.toLocaleString()} 人。</p>`:''}<small>可募人数取决于兵源、国库余银和驻地容纳人数。</small></section>`;
 if(kind==='dismiss')detail+=`<section class="garrison-recruit-capacity" aria-live="polite"><h3>最多可退伍 ${amountLimit.toLocaleString()} 人</h3><p>仅限未出战的中央禁军。</p><p>兵装留库，招募费用不退还。</p><details><summary>返乡与安置</summary><p>有原籍记录者，在原籍仍属本国且可接收时优先返乡；原岗位有空缺时复业。其余人员按各州接收余量安排，暂无去处者留在京城。</p></details></section>`;
 if(kind==='inventory'&&source!=='central'&&stage==='draft')detail+=militaryRequestControls(state,province(source));
 let controls=kind==='inventory'?'':'<button class="court-vermilion" data-garrison-review>拟定军令 →</button>';
 if(stage==='draft'&&['inventory','recruit'].includes(kind)){const support=militarySupport(state,source);if(support.available)detail+=`<details class="garrison-support" ${kind==='recruit'?'open':''}><summary>本营建议可养 ${support.recommended.toLocaleString()}人 · 现有${support.current.toLocaleString()}人</summary><p>全国常规预计钱 ${support.cashNet>=0?'+':''}${support.cashNet}两/旬 · 官粮 ${support.grainNet>=0?'+':''}${support.grainNet}石/旬</p>${support.reasons.map(r=>`<p>${esc(r)}</p>`).join('')}<small>${esc(support.assumptions)}</small></details>`;}
 if(stage==='confirm'){detail=`<small class="court-kicker">${kind==='purchase'?'户部核定':'兵部御批'}</small><h2>${names[kind]}核定</h2><section class="military-confirm-notes">${draft.lines.map(l=>`<p>${esc(l)}</p>`).join('')}</section><h3>支银 ${draft.cost.toLocaleString()} 两</h3><p>来源空闲兵员 ${draft.before.soldiers.available} → ${draft.after.soldiers.available}</p>${draft.targetAfter?`<p>调入空闲兵员 ${draft.targetBefore.soldiers.available} → ${draft.targetAfter.soldiers.available}</p>`:''}${draft.economy?.after.available?`<details class="garrison-recruit-outlook" open><summary>扩军后 · 下旬全国预计收支</summary><p>钱：${draft.economy.after.cash.net>=0?'+':''}${draft.economy.after.cash.net}两（原${draft.economy.before.cash.net}两）</p><p>官粮：${draft.economy.after.grain.net>=0?'+':''}${draft.economy.after.grain.net}石（原${draft.economy.before.grain.net}石）</p><small class="military-confirm-notes">招募费${draft.cost}两即时支出，已从预测期初扣除；下旬净额不再重复扣。含现行地方治理等已安排支出，与草稿常规预算口径不同；非长期可养保证。</small></details>`:draft.economy?`<p>${esc(draft.economy.after.reason)}</p>`:''}<p>执行消耗1体力、2健康、3快乐。</p>`;controls=`<p class="atlas-confirm-risk">${esc(draft.warning)}</p><div class="personnel-seal-actions"><button data-garrison-edit>再斟酌</button><button class="court-vermilion" data-garrison-seal>落印发令</button></div>`;}
 if(stage==='receipt'){detail=`<small class="court-kicker">军营复奏</small><h2>军令已办</h2>${receipt.lines.map(l=>`<p>${esc(l)}</p>`).join('')}<p>本营现有空闲兵员 ${row.soldiers.available} 人，训练 ${row.training}。</p><p>${esc(receipt.warning)}</p>`;controls='<button class="court-vermilion" data-garrison-edit>继续点营 →</button>';}
 d.innerHTML=`<header class="personnel-scene-header"><div><small class="court-kicker">兵 部 · 军 营 与 武 库</small><h1>军营与武库</h1></div><button class="court-dialog-close" data-garrison-close>收图 ×</button></header><nav class="personnel-scene-views">${Object.entries(names).filter(([id])=>id===kind).map(([id,n])=>`<button data-garrison-kind="${id}" aria-pressed="${id===kind}" ${stage==='confirm'?'disabled':''}>${n}</button>`).join('')}</nav><div class="personnel-scene-body"><section class="personnel-scene-main"><div class="garrison-map-frame">${map()}<button data-garrison-depot="central" class="garrison-central">中央禁军${source==='central'?' · 当前来源':''}</button></div><p class="garrison-map-note">${kind==='transfer'?`点地图选择${picking==='source'?'调出':'调入'}驻地；可切换中央禁军。`:'点州名或疆域查看本营，中央单列，避免与京城驻军重复。'}</p><div class="garrison-depots" aria-label="本国全部驻地">${rows().map(r=>`<button data-garrison-depot="${r.id}" aria-pressed="${r.id===source}">${esc(r.name)}</button>`).join('')}</div><div class="garrison-kit-rack">${TROOP_KITS.map(k=>`<button data-garrison-kit="${k.id}" aria-pressed="${kit===k.id}">${troopArt(k.id)}<b>${k.name}</b><small>可用 ${row.kits[k.id].available}</small>${quantities[k.id]>0?`<em>拟令 ${quantities[k.id]}</em>`:''}</button>`).join('')}</div><details class="garrison-ledger"><summary>精查全国军备与实际军令</summary>${rows().map(r=>`<p>${esc(r.name)}：兵员 ${r.soldiers.total} / 占用 ${r.soldiers.used} / 空闲 ${r.soldiers.available}；训练${r.training}</p>`).join('')}${state.domestic.troopKits.history.map(h=>`<p>第${h.turn}旬 · ${h.lines.map(esc).join('；')}</p>`).join('')}</details></section><aside class="personnel-scene-side"><div class="personnel-scene-detail">${detail}</div><footer class="personnel-decision">${controls}<p role="status" data-garrison-error>${esc(error)}</p><small>国库 ${state.stats.treasury.toLocaleString()} 两 · 第${state.turn}旬</small></footer></aside></div>`;
 // Keep one visible selector per choice; reserve the main panel for the map.
 const main=d.querySelector('.personnel-scene-main'),side=d.querySelector('.personnel-scene-detail');
 const depots=document.createElement('label');depots.className='garrison-depot-picker';depots.innerHTML=`驻地<select aria-label="选择军营驻地" ${stage==='confirm'?'disabled':''}>${rows().map(r=>`<option value="${r.id}" ${r.id===source?'selected':''}>${esc(r.name)}</option>`).join('')}</select>`;
 main.prepend(depots);depots.querySelector('select').onchange=e=>{source=e.target.value;quantities={};stage='draft';error='';draw();};
 if(kind==='transfer'){const destination=document.createElement('label');destination.className='garrison-target-picker';destination.innerHTML=`调入<select data-garrison-target aria-label="调入驻地" ${stage==='confirm'?'disabled':''}>${rows().map(r=>`<option value="${r.id}" ${r.id===target?'selected':''}>${esc(r.name)}</option>`).join('')}</select>`;depots.firstChild.textContent='调出';const toolbar=document.createElement('div');toolbar.className='garrison-depot-toolbar';depots.before(toolbar);toolbar.append(depots,destination);destination.querySelector('select').onchange=e=>{target=e.target.value;error='';draw();};}
 const centralEntry=document.createElement('button');centralEntry.className='garrison-central-entry';centralEntry.textContent=kind==='recruit'?'中央禁军 · 全国募兵':'中央禁军';centralEntry.setAttribute('aria-pressed',String(source==='central'));centralEntry.disabled=stage==='confirm';centralEntry.onclick=()=>{source='central';stage='draft';error='';draw();};depots.append(centralEntry);
 d.querySelector('.garrison-central')?.remove();d.querySelector('.garrison-depots')?.remove();d.querySelector('.garrison-kit-rack')?.remove();
 if(kind==='transfer'&&stage==='draft'){
 const picker=document.createElement('label');picker.className='garrison-kit-picker';picker.innerHTML=`兵种<select aria-label="选择兵种">${TROOP_KITS.map(k=>`<option value="${k.id}" ${kit===k.id?'selected':''}>${k.name} · 可用${row.kits[k.id].available}${quantities[k.id]>0?` · 拟令${quantities[k.id]}`:''}</option>`).join('')}</select>`;
 (side.querySelector('.garrison-selected')??side.querySelector('[data-military-fact]')).before(picker);picker.querySelector('select').onchange=e=>{kit=e.target.value;error='';draw();};
 }
 if(kind==='purchase'&&stage==='draft'){
 main.querySelector('.garrison-map-frame').innerHTML=`<section class="garrison-purchase-list" aria-label="全兵种合并采购">${militaryScene('purchase')}<header><h2>中央武库 · 采办兵装</h2><button data-purchase-clear>清空清单</button></header><div class="purchase-kit-cards">${TROOP_KITS.map(k=>{const ok=centralKitProductionAllowed(state.domestic,k.id);return `<article class="purchase-kit-card ${ok?'':'is-locked'}" data-purchase-card="${k.id}" data-selected="${(quantities[k.id]??0)>0}">${militaryTroopArt(k.id)}<div class="purchase-kit-info"><h3>${k.name}</h3><span>${k.price} 两 / 人份</span><small>中央可用 ${row.kits[k.id].available}</small></div><div class="purchase-kit-order"><input data-purchase-kit="${k.id}" aria-label="${k.name}采购数量" type="number" min="0" step="1" value="${quantities[k.id]??0}" ${ok?'':'disabled'}>${ok?`<button data-purchase-add="${k.id}">＋100</button><button data-purchase-fill="${k.id}" title="用${k.name}套装补足中央装备总量缺口，不按出征编队配比补装" ${short===0?'disabled':''}>补缺</button>`:'<span class="purchase-origin-lock">尚未控制稳定产地</span>'}</div></article>`;}).join('')}</div></section>`;
 main.querySelector('.garrison-map-note')?.remove();
 }
 if(stage==='confirm'){
 const facts=Object.entries(draft.command.quantities??{}).filter(([,n])=>n>0);
 main.querySelector('.garrison-map-frame').innerHTML=`<section class="military-review">${militaryScene(kind)}<h2>${names[kind]} · 军令明细</h2><p>${kind==='transfer'?'调出':'驻地'}：${esc(row.name)}${kind==='transfer'?` → ${esc(rows().find(r=>r.id===target)?.name??target)}`:''}</p>${['recruit','dismiss'].includes(kind)?`<p>兵员：${draft.command.amount} 人</p>`:kind==='transfer'?`<p>调拨兵员：${draft.command.soldiers} 人</p>`:''}${facts.length?`<table><thead><tr><th>兵种装备</th><th>数量 / 人份</th><th>${kind==='purchase'?'支银 / 两':'调入驻地'}</th></tr></thead><tbody>${facts.map(([id,n])=>{const k=TROOP_KITS.find(k=>k.id===id);return `<tr><td>${esc(k.name)}</td><td>${n}</td><td>${kind==='purchase'?n*k.price:esc(rows().find(r=>r.id===target)?.name??target)}</td></tr>`;}).join('')}</tbody></table>`:''}${kind==='dismiss'?draft.lines.filter(l=>l.startsWith('安置')).map(l=>`<p>${esc(l)}</p>`).join(''):''}<p>合计支银 ${draft.cost.toLocaleString()} 两</p></section>`;
 }
 if(['purchase','recruit','dismiss'].includes(kind)){
 depots.remove();
 if(kind!=='purchase'&&stage==='draft')main.querySelector('.garrison-map-frame').innerHTML=`<section class="military-review military-enlist-scene">${militaryScene(kind)}<p>${kind==='recruit'?'新兵从各州招募，编入中央禁军。所需兵装由户部另行采办。':'退伍将士由朝廷安排返乡或赴各州安置，所用兵装留存中央武库。'}</p><p>${kind==='recruit'?'优先招募尚未从事农、牧、商、工的百姓。若需扩大兵源，可在下方设置各业征调比例。':'地方驻军须先由大将军调回中央，方可办理退伍。'}</p></section>`;
 main.querySelector('.garrison-map-note')?.remove();
 }
 const ledger=d.querySelector('.garrison-ledger');if(ledger)side.append(ledger);
 bindMilitaryRequests(d,state,onCommit,result=>{state=result.state;d.close();});
 d.querySelector('[data-garrison-close]').onclick=()=>d.close();
 d.querySelectorAll('[data-garrison-kind]').forEach(b=>b.onclick=()=>{kind=b.dataset.garrisonKind;stage='draft';quantities={};error='';picking='source';draw();});
 d.querySelectorAll('[data-garrison-depot]').forEach(b=>{const choose=()=>{if(stage==='confirm'||!rows().some(r=>r.id===b.dataset.garrisonDepot))return;const id=b.dataset.garrisonDepot;if(kind==='transfer'&&picking==='target')target=id;else source=id;stage='draft';error='';draw();};b.onclick=choose;b.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();choose();}};});
 d.querySelectorAll('[data-garrison-kit]').forEach(b=>b.onclick=()=>{if(stage==='confirm')return;kit=b.dataset.garrisonKit;stage='draft';error='';draw();});
 d.querySelectorAll('[data-garrison-pick]').forEach(b=>b.onclick=()=>{picking=b.dataset.garrisonPick;draw();});
 d.querySelector('[data-garrison-quantity]')?.addEventListener('input',e=>{quantities[kit]=e.target.value===''?NaN:Number(e.target.value);});
 d.querySelector('[data-garrison-soldiers]')?.addEventListener('input',e=>{soldiers=e.target.value===''?NaN:Number(e.target.value);});
 d.querySelectorAll('[data-draft-rate]').forEach(e=>e.onchange=()=>{draftRates[e.dataset.draftRate]=Number(e.value);draw();});
 d.querySelector('[data-garrison-amount]')?.addEventListener('input',e=>{amount=e.target.value===''?0:Math.floor(Number(e.target.value));if(amountLimit!==null){amount=Math.max(amountLimit?1:0,Math.min(amountLimit,Number.isFinite(amount)?amount:0));e.target.value=String(amount);}});
 d.oninput=()=>{error='';d.querySelector('[data-garrison-error]').textContent='';};
 if(kind==='inventory'){
 const panel=d.querySelector('.personnel-scene-main');
 panel.querySelector('.garrison-map-frame').innerHTML=`<section class="garrison-overview" aria-label="全部兵种军备"><header><h2>${esc(row.name)} · 全兵种军备</h2><span>装备按人份统计</span></header><div class="garrison-stock-grid">${TROOP_KITS.map(k=>{const stock=row.kits[k.id];return `<article data-garrison-stock="${k.id}">${troopArt(k.id)}<h3>${k.name}</h3><dl><div><dt>库存</dt><dd>${stock.total}</dd></div><div><dt>出战占用</dt><dd>${stock.used}</dd></div><div><dt>可用</dt><dd>${stock.available}</dd></div></dl></article>`;}).join('')}</div></section>`;
 panel.querySelector('.garrison-map-note')?.remove();
 }
 if(capacity){const summary=d.querySelector('.draft-controls>summary');if(summary)summary.textContent=(source==='central'?'全国征兵来源':'本州征兵来源')+' · 产业抽调，优先使用空闲劳力';}
 militaryPage(d,names[kind]);
 setQuantityLimits(d,input=>{
  if(input.matches('[data-purchase-kit]')){
   const id=input.dataset.purchaseKit;
   if(!centralKitProductionAllowed(state.domestic,id))return 0;
   return affordableMaximum(1000000,n=>{try{return quoteKitCommand(state,{kind:'purchase',sourceId:'central',quantities:{...quantities,[id]:n}}).cost<=state.stats.treasury;}catch{return false;}});
  }
  if(input.matches('[data-garrison-soldiers]'))return row.soldiers.available;
  if(input.matches('[data-garrison-quantity]'))return stock.available;
 });
 if(kind==='recruit'){const advanced=d.querySelector('.draft-controls');if(advanced){advanced.open=false;const summary=advanced.querySelector('summary');if(summary)summary.textContent='高级设置 · 产业抽调';}}
 if(amountLimit!==null&&stage==='draft'){const input=d.querySelector('[data-garrison-amount]'),max=document.createElement('button');max.type='button';max.textContent='最多';max.dataset.garrisonMax='';max.setAttribute('aria-label',kind==='dismiss'?'填入当前可遣散上限':'填入当前可募上限');max.disabled=amountLimit===0;max.onclick=()=>{input.value=String(amountLimit);input.dispatchEvent(new Event('input',{bubbles:true}));};input.closest('.military-amount').append(max);const review=d.querySelector('[data-garrison-review]');if(review)review.disabled=amountLimit===0;}

 if(kind==='purchase'&&stage==='draft'){
 const update=()=>{
  const summary=d.querySelector('[data-purchase-summary]'),n=Object.values(quantities).reduce((sum,v)=>sum+v,0),review=d.querySelector('[data-garrison-review]');
  try{
   if(!n&&Object.values(quantities).every(v=>v===0)){summary.textContent=`尚未选择兵装 · 装备总量缺口 ${short.toLocaleString()} 套`;review.disabled=true;return;}
   const q=quoteKitCommand(state,command());
   summary.textContent=`拟购 ${n.toLocaleString()} 人份 · 支银 ${q.cost.toLocaleString()} 两 · 采购后总量缺口 ${Math.max(0,short-n).toLocaleString()} 套 · ${q.canAfford?'余银':'尚缺'} ${Math.abs(q.treasuryAfter).toLocaleString()} 两`;
   review.disabled=!q.canAfford;
  }catch(e){summary.textContent=e.message;review.disabled=true;}
 };
 d.querySelectorAll('[data-purchase-kit]').forEach(input=>input.addEventListener('input',()=>{quantities[input.dataset.purchaseKit]=input.value===''?NaN:Number(input.value);input.closest('[data-purchase-card]').dataset.selected=String(Number(input.value)>0);update();}));
 d.querySelectorAll('[data-purchase-fill]').forEach(button=>button.onclick=()=>{const id=button.dataset.purchaseFill,others=Object.entries(quantities).filter(([key])=>key!==id).reduce((sum,[,v])=>sum+(Number.isSafeInteger(v)&&v>0?v:0),0);quantities[id]=Math.max(0,short-others);draw();});
 d.querySelectorAll('[data-purchase-add]').forEach(button=>button.onclick=()=>{const id=button.dataset.purchaseAdd,current=quantities[id]??0;quantities[id]=(Number.isSafeInteger(current)&&current>=0?current:0)+100;draw();});
 d.querySelector('[data-purchase-clear]').onclick=()=>{quantities={};draw();};
 update();
 }

 d.querySelector('[data-garrison-review]')?.addEventListener('click',propose);
 d.querySelector('[data-garrison-edit]')?.addEventListener('click',()=>{if(stage==='receipt')quantities={};stage='draft';error='';draw();});
 d.querySelector('[data-garrison-seal]')?.addEventListener('click',()=>{if(busy||stage!=='confirm')return;busy=true;try{const result=executeKitCommand(state,draft.command);state=commitOperation(onCommit,result.state)??result.state;d.close();}catch(e){error=e.message;d.querySelector('[data-garrison-error]').textContent=error;}finally{busy=false;}});
 }
 draw();d.showModal();return d;
}
