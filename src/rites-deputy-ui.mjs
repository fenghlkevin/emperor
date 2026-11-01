import {diplomaticMap,fitDiplomaticMap} from './court-diplomacy-ui.mjs';
import {fitMapLabels} from './map-labels.mjs';
import {openRitesHelp} from './rites-help-ui.mjs';
import {commitOperation} from './operation-result.mjs';
import {militaryPage} from './military-page.mjs';
import {spyCost,spyEligible,executeSpy} from './espionage.mjs';
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function ritesDeputyMarkup(s,countryId){const d=s.domestic;return `<p class="governance-scope">万邦图鉴 · 未经谍报的信息以 *** 表示</p><div class="foreign-cards">${d.countries.filter(c=>c.id!==d.playerCountryId&&c.provinceIds.length&&(!countryId||c.id===countryId)).map(c=>{const r=d.diplomacy.find(r=>r.countryIds.includes(c.id)&&r.countryIds.includes(d.playerCountryId)),q=d.espionage?.reports[c.id];return `<section class="foreign-card"><h2>⚑ ${esc(c.name)}</h2><p>邦交：${esc(({none:'常态',ally:'盟好',hostile:'敌对'})[r?.relation]??r?.relation??'常态')} · 友善 ${r?.friendship??50}</p><small>${q?`第 ${q.turn} 旬情报快照 · 距今 ${s.turn-q.turn} 旬，非实时`:'尚无情报快照'}</small><div class="foreign-stats">${[['treasury','钱库','两','treasury'],['grain','粮仓','石','treasury'],['soldiers','部队','人','registers'],['weapons','兵器套装','套','registers'],['population','人口','人','registers'],['provinces','州郡','州','building'],['prestige','国威','','accounts']].map(([k,n,u,art])=>`<div><div class="governance-art governance-art--${art}" aria-hidden="true"></div><span>${n}</span><strong>${q?`${Number(q[k]).toLocaleString('zh-CN')}${u}`:'***'}</strong></div>`).join('')}</div></section>`;}).join('')}</div>`;}
export function openRitesDeputy(state,root,onClose,options={}){
 const countries=state.domestic.countries.filter(c=>c.id!==state.domestic.playerCountryId&&c.provinceIds.length);
 let selected=options.countryId??'',scope='world';
 const d=document.createElement('dialog');d.className='court-play-dialog court-atlas rites-deputy-atlas';d.setAttribute('aria-label','礼部侍郎·万邦图鉴');root.append(d);
 const resize=()=>{const svg=d.querySelector('svg');fitDiplomaticMap(svg,scope);fitMapLabels(svg,'.diplomatic-map text',el=>el.dataset.diplomaticCountry===selected?2:0);};
 const choose=id=>{if(!countries.some(c=>c.id===id))return;selected=id;draw();};
 function draw(){d.innerHTML=`<header class="atlas-header"><h1>礼部侍郎 · 万邦图鉴</h1><button class="court-dialog-close" data-close aria-label="关闭查阅">关闭 ×</button><span class="atlas-court-status">第${state.turn}旬</span></header><div class="atlas-layout rites-deputy-layout"><section class="atlas-paper rites-map-paper"><div class="diplomatic-header-controls"><select data-scope aria-label="地图范围">${[['world','天下'],['east','东亚'],['west','西方'],['south','南海']].map(([id,n])=>`<option value="${id}" ${scope===id?'selected':''}>${n}</option>`).join('')}</select><select data-country aria-label="查阅国家"><option value="">选择国家</option>${countries.map(c=>`<option value="${esc(c.id)}" ${selected===c.id?'selected':''}>${esc(c.name)}</option>`).join('')}</select></div><div class="diplomatic-map-frame">${diplomaticMap(state.domestic,selected,scope)}</div></section><aside class="rites-deputy-detail" aria-live="polite"><button data-help aria-label="情报说明">？</button>${selected?ritesDeputyMarkup(state,selected):'<div class="rites-deputy-empty"><span>邦</span><h2>点选地图中的国家</h2><p>查阅邦交与情报</p></div>'}</aside></div>`;
 d.querySelector('[data-close]').onclick=()=>d.close();d.querySelector('[data-country]').onchange=e=>choose(e.target.value);d.querySelector('[data-scope]').onchange=e=>{scope=e.target.value;draw();};d.querySelector('[data-help]').onclick=()=>openRitesHelp(root,'情报说明','点击疆域或国名查看该国资料。未经皇城司秘谍取得的内部信息显示为 ***。成功谍报保存完成当旬的快照，标明旬数及距今时间，不随对方国家实时更新。');
 d.querySelectorAll('[data-diplomatic-country]').forEach(el=>{el.onclick=()=>choose(el.dataset.diplomaticCountry);el.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();choose(el.dataset.diplomaticCountry);}};});requestAnimationFrame(resize);
 }
 window.addEventListener('resize',resize);d.onclose=()=>{window.removeEventListener('resize',resize);d.remove();onClose?.();};draw();d.showModal();return d;
}
export function openEspionage(state,root,onCommit,onClose){
 let s=state,missionPage=0,historyPage=0,message='',country='',official='',kind='foreign';
 const d=document.createElement('dialog');d.className='court-play-dialog court-personnel military-spy';d.setAttribute('aria-label','皇城司使·发布密令');root.append(d);d.onclose=()=>{d.remove();onClose?.();};
 const pager=(type,page,rows,data)=>{return rows.length?`<label class="ministry-item-picker">${type==='missions'?'选择执行人员':'选择谍报记录'}<select data-spy-select="${type}" aria-label="${type==='missions'?'选择执行人员':'选择谍报记录'}">${rows.map((r,i)=>`<option value="${i}" ${page===i?'selected':''}>${esc(type==='missions'?(data.justice.officials.find(o=>o.id===r.officialId)?.name??'秘谍'):String(r).slice(0,35))}</option>`).join('')}</select></label>`:'';};
 function render(){const data=s.domestic,e=data.espionage,eligible=spyEligible(data),countries=data.countries.filter(c=>c.id!==data.playerCountryId&&c.provinceIds.length),missions=e?.missions??[],history=e?.history??[],missionPages=Math.max(1,missions.length),historyPages=Math.max(1,history.length);missionPage=Math.min(missionPage,missionPages-1);historyPage=Math.min(historyPage,historyPages-1);if(!countries.some(c=>c.id===country))country=countries[0]?.id??'';if(!eligible.some(o=>o.id===official))official=eligible[0]?.id??'';
 d.innerHTML=`<header><h1>皇城司 · 发布密令</h1><button data-close>关闭 ×</button></header><div class="personnel-scene-body"><section class="personnel-scene-main"><section class="spy-missions"><h2>执行中的密令</h2>${missions.length?missions.slice(missionPage,missionPage+1).map(m=>`<article><p>${esc(data.justice.officials.find(o=>o.id===m.officialId)?.name)} → ${m.kind==='counterspy'?'国内反谍查奸':esc(data.countries.find(c=>c.id===m.countryId)?.name)}</p><p>剩余 ${Math.max(0,m.due-s.turn)} 旬 · 已支 ${m.cost} 两</p><button data-recall="${m.id}">召回</button></article>`).join(''):'<p>暂无执行中的密令</p>'}${pager('missions',missionPage,missions,data)}</section><section class="spy-history"><h2>谍报记录</h2>${history.length?history.slice(historyPage,historyPage+1).map(h=>`<p>${esc(h)}</p>`).join(''):'<p>暂无谍报记录</p>'}${pager('history',historyPage,history,data)}</section></section><aside class="personnel-scene-side"><div class="personnel-scene-detail"><h2>御前密令</h2><p>皇城司直属皇帝。对外刺探九旬后返回，费用按距离从1000两起算；失败友善降低10。国内反谍查奸三旬后复命，支银1000两；发现可疑官员交刑部核查。成功率随智力提高；召回进度作废，费用不退。</p><form id="military-spy-form"><label>密令类型<select name="kind" aria-label="密令类型"><option value="foreign" ${kind==='foreign'?'selected':''}>对外刺探敌情</option><option value="counterspy" ${kind==='counterspy'?'selected':''}>对内反谍查奸</option></select></label><label ${kind==='counterspy'?'hidden':''}>目标国家<select name="countryId" aria-label="秘谍目标国家">${countries.map(c=>`<option value="${esc(c.id)}" ${country===c.id?'selected':''}>${esc(c.name)}</option>`).join('')}</select></label><label>待命官员<select name="officialId" aria-label="秘谍待命官员" ${eligible.length?'':'disabled'}>${eligible.length?eligible.map(o=>`<option value="${esc(o.id)}" ${official===o.id?'selected':''}>${esc(o.name)} · 智力${o.intelligence}</option>`).join(''):'<option value="">暂无空闲待命官员</option>'}</select></label></form><p data-military-fact data-spy-cost>派遣支银 ${kind==='counterspy'?1000:country?spyCost(data,country):0} 两</p><p data-military-fact>国库 ${s.stats.treasury.toLocaleString()} 两</p></div><footer class="personnel-decision"><p role="status">${esc(message)}</p><button type="submit" form="military-spy-form" class="court-vermilion" ${eligible.length&&(kind==='counterspy'||country)?'':'disabled'}>颁发密令</button></footer></aside></div>`;
 d.querySelector('[data-close]').onclick=()=>d.close();
 const act=c=>{try{const next=executeSpy(s,c);commitOperation(onCommit,next);s=next;message=c.kind==='recall'?'秘谍已召回，费用不退。':c.kind==='counterspy'?'查奸密令已颁，三旬后复命。':'秘谍已派遣，九旬后复命。';render();}catch(error){d.querySelector('[role=status]').textContent=error.message;}};
 d.querySelector('form').onsubmit=event=>{event.preventDefault();act(Object.fromEntries(new FormData(event.target)));};
 d.querySelector('[name=kind]').onchange=event=>{kind=event.target.value;render();};
 d.querySelector('[name=countryId]').onchange=event=>{country=event.target.value;d.querySelector('[data-spy-cost]').textContent=`派遣支银 ${spyCost(data,country)} 两`;};
 d.querySelector('[name=officialId]').onchange=event=>{official=event.target.value;};
 d.querySelectorAll('[data-recall]').forEach(b=>b.onclick=()=>act({kind:'recall',id:Number(b.dataset.recall)}));
 d.querySelectorAll('[data-spy-select]').forEach(el=>el.onchange=()=>{if(el.dataset.spySelect==='missions')missionPage=Number(el.value);else historyPage=Number(el.value);render();});
 d.querySelectorAll('[data-spy-page]').forEach(b=>b.onclick=()=>{if(b.dataset.spyPage==='missions')missionPage+=Number(b.dataset.step);else historyPage+=Number(b.dataset.step);render();});militaryPage(d,'皇城司 · 发布密令');const help=d.querySelector('.military-help');if(help){help.setAttribute('aria-label','皇城司职掌与密令说明');help.onclick=()=>openRitesHelp(root,'皇城司职掌与密令说明','皇城司直属皇帝。对外刺探敌情，九旬后返回，费用按距离从1000两起算；失败友善降低10。对内反谍查奸，三旬后复命，支银1000两，排查现有谋逆与不忠线索并移交刑部。成功率随智力提高；召回进度作废，费用不退。情报结果可召副使查阅，外国快照同步记入万邦图鉴。');}
 }
 render();d.showModal();return d;
}

export function imperialReportsMarkup(state){
 const e=state.domestic.espionage;
 return `<p class="governance-scope">皇城司 · 直属皇帝 · 内外密报</p><p>执行中密令 ${e?.missions.length??0} 道；已获外国情报 ${Object.keys(e?.reports??{}).length} 国</p><div class="spy-report-history">${e?.history.length?e.history.map(h=>`<p>${esc(h)}</p>`).join(''):'<p>暂无密报。请召皇城司使发布密令，待人员复命后查阅。</p>'}</div>`;
}
export function openImperialReports(state,root,onClose){
 let page=0,country='';
 const d=document.createElement('dialog');d.className='court-play-dialog court-personnel military-spy imperial-reports';d.setAttribute('aria-label','皇城司副使·查阅密报');root.append(d);
 function draw(){
  const e=state.domestic.espionage,history=e?.history??[],countries=state.domestic.countries.filter(c=>c.id!==state.domestic.playerCountryId&&c.provinceIds.length);
  if(!country)country=countries.find(c=>e?.reports[c.id])?.id??countries[0]?.id??'';
  d.innerHTML=`<header><h1>皇城司 · 查阅密报</h1><button data-close>关闭 ×</button></header><div class="personnel-scene-body"><section class="personnel-scene-main"><h2>万邦情报</h2><label>查阅国家<select data-report-country aria-label="密报国家">${countries.map(c=>`<option value="${esc(c.id)}" ${country===c.id?'selected':''}>${esc(c.name)}</option>`).join('')}</select></label>${country?ritesDeputyMarkup(state,country):'<p>暂无外国情报</p>'}<button data-atlas>展开万邦图鉴</button></section><aside class="personnel-scene-side"><div class="personnel-scene-detail"><h2>内外复命记录</h2><p data-military-fact>直属皇帝 · 执行中密令 ${e?.missions.length??0} 道</p>${history.length?`<label>选择密报<select data-report-history aria-label="选择密报">${history.map((h,i)=>`<option value="${i}" ${i===page?'selected':''}>${esc(h)}</option>`).join('')}</select></label><p data-military-fact>${esc(history[page])}</p>`:'<p data-military-fact>暂无密报。请召皇城司使发布密令，待人员复命后查阅。</p>'}</div></aside></div>`;
  d.querySelector('[data-close]').onclick=()=>d.close();
  d.querySelector('[data-report-country]').onchange=event=>{country=event.target.value;draw();};
  d.querySelector('[data-report-history]')?.addEventListener('change',event=>{page=Number(event.target.value);draw();});
  d.querySelector('[data-atlas]').onclick=()=>openRitesDeputy(state,root,null,{countryId:country});
  militaryPage(d,'皇城司 · 查阅密报');
 }
 d.onclose=()=>{d.remove();onClose?.();};draw();d.showModal();return d;
}
