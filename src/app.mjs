import {openCourtJustice} from './court-justice-ui.mjs';
import {openCourtPersonnel} from './court-personnel-ui.mjs';
import {courtDeskMarkup,openCourtAudience,openCourtPetition,openCourtRoster} from './court-play-ui.mjs';
import {openCourtAtlas} from './court-atlas-ui.mjs';
import {courtAgenda} from './court-agenda.mjs';
import {openKitOffice} from './kit-office-ui.mjs';
import {readSlots,writeSlot} from './save-slots.mjs';
import {openChronicle} from './ending-ui.mjs';
const warEmergency=s=>s.domestic.collapse?.pending||s.domestic.war?.battle||s.domestic.strategy?.pending?.defender===s.domestic.playerCountryId;
import {succeedDynasty} from './national-actions.mjs';
import {openNational} from './national-ui.mjs';
import {reignMarkup} from './reign-result.mjs';
import {pendingRoyalEvent,ROYAL_EVENT_TITLES,ROYAL_EVENT_ART} from './royal-events.mjs';
import {persistCandidate,MAX_SAVE_BYTES} from './persistence.mjs';
import {mountCourtActors} from './court-actors.mjs';
import {COURT_OUTLINES} from './court-outlines.mjs';
import {palaceOutline} from './palace-outlines.mjs';
import {openZichen} from './zichen-ui.mjs';
import {travelReady,beginTravel,cancelTravel,TRAVEL_RULES} from './travel.mjs';
import {openTravelJourney} from './travel-ui.mjs';
import {auspiceDefinition} from './auspices.mjs';
import {palaceAtmosphere,palaceArtwork} from './palace-atmosphere.mjs';
import {emperorPanel,openPalace} from './emperor-ui.mjs';
import {spendEnergy,courtBlock} from './emperor.mjs';
import {openEnvoyPlanner} from './envoy-planner-ui.mjs';
import {arrivedEnvoy} from './envoy-visits.mjs';
import {openWar} from './war-ui.mjs';
import {examReady,finishExam,cancelExam} from './exam-session.mjs';
import {openExamSession} from './exam-session-ui.mjs';
import {openPersonnelMinister} from './personnel-minister-ui.mjs';
import {openConstruction} from './construction-ui.mjs';
import {openJustice} from './justice-ui.mjs';
import {openRites} from './rites-ui.mjs';
import {openGeneral} from './general-ui.mjs';
import {openRevenue} from './revenue-ui.mjs';
import {openPersonnel} from './personnel-ui.mjs';
import {openDomestic} from './domestic-ui.mjs';

import { SAVE_KEY, buildings, officials, newGame, validateSave, dateLabel, advance, phaseLabel, roomBlock, leaveRoom, resolveExhaustion, sleepUntilNextTurn } from './game.mjs';
const PANEL_PREFERENCE_KEY='emperor.ui.panel-collapsed';
function readPanelPreference(){try{return localStorage.getItem(PANEL_PREFERENCE_KEY)==='true';}catch{return false;}}
const root=document.querySelector('#app'); let state=null; let showLabels=true; let emperorCollapsed=readPanelPreference(); let status='';let courtCleanup=null;let selectedCourtOffice=null;let sidebarCleanup=null;
const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function readSave(){ try { const raw=localStorage.getItem(SAVE_KEY); return raw?validateSave(JSON.parse(raw)):null; } catch (e) { status='本地存档无法读取，可导入备份或创建新角色。'; return null; } }
function save(){return transition(()=>{});}
function replaceGame(next){try{next=validateSave(next);next.saveRevision=state?.saveRevision??0;state=persistCandidate(state,next,localStorage);status='已自动存档';render();}catch(e){status=e.message;modal('无法保存',`<p>${escape(e.message)}</p>`);}}
function login(){state=null;sidebarCleanup?.();sidebarCleanup=null;courtCleanup?.();courtCleanup=null; const existing=readSave(); root.innerHTML=`<main class="login"><div class="cover"><div class="login-art"><img src="assets/sketch-palace-color.png" alt="彩色宫城"></div><div class="title-lockup"><span class="seal">御</span><div class="eyebrow">宫廷纪事</div><h1>皇 帝</h1><p>山河入卷 · 万象待启</p></div><div class="cover-caption">一城烟雨，一世江山。</div></div><section class="login-panel"><div class="eyebrow">开启你的王朝</div><h1>江山，始于此刻。</h1><p>入主宫阙，召见群臣。<br>在时光流转中，写下你的帝王纪事。</p><button id="new-dynasty" class="primary">开启王朝 →</button>${existing?`<button id="continue">继续 · ${escape(existing.name)} / ${dateLabel(existing.turn)}</button>`:''}<button id="save-list">读取进度</button><button id="import">导入存档</button><button id="quit">退出游戏</button><small>单机游玩 · 进度自动保存于本机</small><div role="status">${escape(status)}</div></section></main>`;
root.querySelector('#new-dynasty').onclick=()=>{const d=modal('开启王朝',`<form id="create"><label for="name">君主名号</label><input id="name" maxlength="16" required placeholder="请输入名号" autocomplete="off"><button class="primary">开始新朝 →</button></form>`);d.querySelector('#name').focus();d.querySelector('#create').onsubmit=e=>{e.preventDefault();const name=d.querySelector('#name').value.trim();if(!name){d.querySelector('#name').setCustomValidity('请输入君主名号');d.querySelector('#name').reportValidity();return;}replaceGame(newGame(name));};d.querySelector('#name').oninput=e=>e.target.setCustomValidity('');}; root.querySelector('#continue')?.addEventListener('click',()=>{state=existing;render();});root.querySelector('#import').onclick=importSave;root.querySelector('#save-list').onclick=openSaves;root.querySelector('#quit').onclick=quitGame; }
function fitSidebar(){
 sidebarCleanup?.();
 const sidebar=root.querySelector('.sidebar');
 if(sidebar.hidden)return;
 let content=sidebar.querySelector(':scope > .sidebar-content');
 if(!content){content=document.createElement('div');content.className='sidebar-content';content.append(...sidebar.childNodes);sidebar.append(content);}
 const fit=()=>{
  content.style.zoom='1';
  const available=sidebar.clientHeight;
  const natural=content.offsetHeight;
  content.style.zoom=String(Math.min(1,available/Math.max(1,natural)));
 };
 const resize=new ResizeObserver(fit);
 resize.observe(sidebar);
 const changes=new MutationObserver(fit);
 changes.observe(content,{subtree:true,childList:true,attributes:true,attributeFilter:['hidden','class']});
 sidebarCleanup=()=>{resize.disconnect();changes.disconnect();};
 fit();
 document.fonts.ready.then(()=>{if(content.isConnected)fit();});
}
function render(){
 courtCleanup?.();courtCleanup=null;
 const palace=state.scene==='palace';const atmosphere=palaceAtmosphere(state);const entries=palace?buildings:officials;
 root.innerHTML=`<main class="game ${palace?'':'is-court'}"><header class="topbar"><div class="brand">${palace?'':'<button class="court-tools-toggle" data-court-tools aria-label="打开起居与簿册" aria-expanded="false">☰</button>'}皇帝 <span>宫廷纪事</span></div><div class="top-stats"><span>▧ 国库 <b>${state.stats.treasury.toLocaleString()}</b></span><span>♜ 威望 <b>${state.stats.prestige} / 500</b></span></div><div class="reign"><span class="date">${dateLabel(state.turn)} · ${phaseLabel(state)}</span><small>${escape(state.name)}</small></div></header><aside class="sidebar" ${palace?'':'hidden'}><nav><button data-scene="palace" class="${palace?'active':''}"><span>⌂</span>${palace?'皇城':'退朝'}<i>›</i></button><button data-scene="court" class="${!palace?'active':''}"><span>♜</span>朝堂<i>›</i></button><button id="domestic"><span>◎</span>${palace?'内政':'查阅簿册'}</button><button id="saves"><span>▧</span>存档</button><button id="chronicle">本朝纪事${state.endings?.criticalTurns||state.endings?.advicePending?' · 待议':''}</button>${state.reignResult?'<button id="reign-result">本朝终评</button>':''}</nav>${emperorPanel(state,emperorCollapsed)}<div class="sidebar-note"><span>山河无恙</span><p>一砖一瓦，皆为江山。<br>一言一行，皆入史册。</p></div><button class="home-button" id="exit">返回首页</button><button id="quit">退出游戏</button></aside><div class="workspace ${palace?'':'court-workspace'} "><section class="scene ${state.scene} ${palace&&state.phase===5?'is-night':''}" aria-label="${palace?'皇宫建筑':'朝堂人物'}">${palace?palaceArtwork(state):'<img src="assets/sketch-court-background-urban-v9.png" alt="彩色朝堂群臣" draggable="false">'}${entries.map(e=>{const blocked=palace&&Boolean(roomBlock(state,e.id));const hideName=palace&&state.phase===5&&blocked;return `<button class="hotspot ${palace&&e.id==='court'&&!blocked?'selected':''} ${blocked?'is-unavailable':''} ${showLabels?'labeled':''}" data-entry="${e.id}" aria-label="${e.name}" ${hideName?'':`title="${e.name}"`}><svg class="outline" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true"><path d="${palace?palaceOutline(e.id).path:COURT_OUTLINES[e.id].path}"/></svg><span${hideName?' hidden':''}>${e.name}${e.id==='liming'&&arrivedEnvoy(state)?' · 外臣候见':''}</span></button>`;}).join('')}<div class="scene-heading" ${palace?`title="${atmosphere.label} · ${atmosphere.description}"`: ''}><h1>${palace?'皇城全景':'宣政殿'}</h1><p>${palace?atmosphere.label+' · '+atmosphere.description:'文武列班 · 恭候圣裁'}</p>${palace?`<button id="labels">${showLabels?'隐藏地点':'显示地点'}</button>`:''}</div><footer><span>⊙ ${palace?'点击宫殿进入':'点击人物召见'}</span><span role="status">${escape(status||'进度自动保存')}</span></footer></section>${palace?'':courtDeskMarkup(state)}</div></main>`;

 entries.forEach(e=>{const el=root.querySelector(`[data-entry="${e.id}"]`);const bounds=palace?palaceOutline(e.id):COURT_OUTLINES[e.id];Object.assign(el.style,{left:`${bounds.x}%`,top:`${bounds.y}%`,width:`${bounds.w}%`,height:`${bounds.h}%`});if(!palace)el.style.clipPath=bounds.clip;el.onclick=()=>{if(!palace)selectedCourtOffice=e.id;root.querySelectorAll('.hotspot.selected').forEach(b=>b.classList.remove('selected'));el.classList.add('selected');if(palace)openEntry(e);else summonCourt(e.id);};});
 if(!palace){courtCleanup=mountCourtActors(root.querySelector('.scene.court'),state.domestic);if(selectedCourtOffice)root.querySelector(`[data-entry="${selectedCourtOffice}"]`)?.classList.add('selected');}
 root.querySelector('#reign-result')?.addEventListener('click',()=>{const heir=!state.domestic.collapse?.ended&&state.domestic.royalFamily.find(p=>p.id===state.dynasty.heirId&&p.status==='palace'&&p.age>=16&&p.age<80);const report=modal('本朝终评',reignMarkup(state.reignResult,escape)+(heir?`<button data-succeed-dynasty>由${escape(heir.name)}继位，继续经营</button>`:''));report.classList.add('reign-dialog');report.querySelector('[data-succeed-dynasty]')?.addEventListener('click',()=>{try{const next=succeedDynasty(state);commitGame(next,{exhaustion:false});report.close();render();}catch(e){modal('继位未完成',`<p>${escape(e.message)}</p>`);}});});
 root.querySelectorAll('[data-official]').forEach(button=>{
  const person=root.querySelector(`[data-entry="${button.dataset.official}"]`);
  button.onclick=()=>person.click();
  button.onpointerenter=button.onfocus=()=>person.classList.add('is-focused');
  button.onpointerleave=button.onblur=()=>person.classList.remove('is-focused');
 });
 if(!palace){
  root.querySelector('[data-court-tools]').onclick=e=>{const sidebar=root.querySelector('.sidebar');sidebar.hidden=!sidebar.hidden;e.currentTarget.setAttribute('aria-expanded',String(!sidebar.hidden));if(!sidebar.hidden)fitSidebar();};
  root.querySelectorAll('[data-court-petition]').forEach(b=>b.onclick=()=>openCourtPetition(state,root,b.dataset.courtPetition,navigateCourt,()=>render()));
  root.querySelector('[data-court-atlas]').onclick=()=>navigateCourt('atlas-grain');
  root.querySelector('[data-court-overview]').onclick=()=>navigateCourt('atlas-finance');
  root.querySelector('[data-court-roster]').onclick=()=>openCourtRoster(state,root,summonCourt,()=>render());
 }
 root.querySelector('#chronicle').onclick=()=>{if(warEmergency(state)){openEntry({id:'war-minister'});return;}openChronicle(state,root,next=>commitGame(next,{exhaustion:false}),()=>render());};
 fitSidebar();
 root.querySelector('[data-emperor-toggle]').onclick=()=>{emperorCollapsed=!emperorCollapsed;try{localStorage.setItem(PANEL_PREFERENCE_KEY,String(emperorCollapsed));}catch{}const panel=root.querySelector('.emperor-panel'),button=panel.querySelector('[data-emperor-toggle]');panel.classList.toggle('is-collapsed',emperorCollapsed);panel.querySelector('#emperor-details').hidden=emperorCollapsed;button.setAttribute('aria-expanded',String(!emperorCollapsed));button.innerHTML=`${emperorCollapsed?'展开':'收起'} <span aria-hidden="true">${emperorCollapsed?'＋':'−'}</span>`;};
 root.querySelector('[data-sleep-next-turn]')?.addEventListener('click',()=>{
 const d=modal('安寝至明',`<div class="sleep-notice-copy"><small>天子起居 · 内侍请旨</small><p>陛下此刻安寝，将跳过本旬余下所有阶段，直接进入下一旬早朝。</p><p class="sleep-notice-note">独寝最多恢复150体力、健康增加5；普通睡眠不额外扣寿元，跨旬自然减少1，旬末事务照常结算。尚未办理的事务，请先行处置。</p></div><div class="sleep-notice-actions"><button data-cancel-sleep autofocus>暂不安寝</button><button class="primary" data-confirm-sleep>确认安寝</button></div>`);
 d.classList.add('sleep-notice');d.setAttribute('aria-label','安寝至明确认');
 d.querySelector('[data-cancel-sleep]').onclick=()=>d.close();
 d.querySelector('[data-confirm-sleep]').onclick=()=>{d.close();if(transition(next=>sleepUntilNextTurn(next))){status='已完成独寝恢复，进入下一回合';render();}};
 });root.querySelector('[data-quick-sleep]').onclick=()=>openEntry(buildings.find(e=>e.id==='dragon'));root.querySelector('[data-quick-harem]').onclick=()=>openEntry(buildings.find(e=>e.id==='harem'));root.querySelectorAll('[data-scene]').forEach(b=>b.onclick=()=>{if(warEmergency(state)){openEntry({id:'war-minister'});return;}if(b.dataset.scene===state.scene)return;if(b.dataset.scene==='court'){openEntry(buildings.find(e=>e.id==='court'));return;}if(transition(next=>leaveRoom(next)))render();});root.querySelector('#labels')?.addEventListener('click',()=>{showLabels=!showLabels;render();});root.querySelector('#next')?.addEventListener('click',()=>{if(warEmergency(state)){openEntry({id:'war-minister'});return;}if(state.scene==='court'){if(transition(next=>leaveRoom(next)))render();}else openEntry(buildings.find(e=>e.id==='dragon'));});root.querySelector('#domestic').onclick=()=>openDomestic(state,root,{onIndustry:openIndustryReport});root.querySelector('#saves').onclick=openSaves;root.querySelector('#quit').onclick=quitGame;root.querySelector('#exit').onclick=()=>{if(save())login();};
 if(state.reignResult)return;if(!warEmergency(state)&&showTravelNotice())return;
 if(showExamNotice())return;
 if(showRoyalNotice())return;
 if(warEmergency(state)){status='战争尚未结束 · 召见兵部尚书继续战斗';root.querySelector('.scene footer [role=status]').textContent=status;return;}if(showAuspice())return;
 const visit=arrivedEnvoy(state);if(visit&&!visit.notified){const country=state.domestic.countries.find(c=>c.id===visit.countryId);const notice=modal('外臣抵京',`<p>启奏陛下：${escape(country.name)}使臣已抵京，现于礼明殿恭候召见。</p><p>请退朝返回皇城，进入“礼明殿”进行外交会面。</p><button class="primary" data-ack-arrival>朕知道了</button>`);notice.setAttribute('aria-label','外臣抵京通知');notice.querySelector('[data-ack-arrival]').onclick=()=>notice.close();notice.onclose=()=>{if(state.envoyVisit===visit)transition(next=>{next.envoyVisit.notified=true;});notice.remove();};}
}
function showTravelNotice(){
 const trip=travelReady(state);if(!trip||state.stats.life===0)return false;
 const launch=()=>openTravelJourney(state,root,next=>commitGame(next,{exhaustion:false}),()=>render());
 if(trip.startedTurn!==undefined){launch();return true;}
 const rule=TRAVEL_RULES[trip.kind],place=state.domestic.provinces.find(p=>p.id===trip.provinceId);
 const notice=modal('出行候驾',`<p>${escape(trip.kind==='tour'?`仪仗已备，请陛下起驾前往${place.name}。`:'民服已备，请陛下出京体察民情。')}</p><p>${escape(rule.description)}</p><p data-travel-error role="status"></p><button data-begin-travel class="primary">${trip.kind==='tour'?'起驾巡游':'换服出京'}</button><button data-cancel-travel>取消行程</button>`);
 notice.setAttribute('aria-label','出行候驾');
 notice.querySelector('[data-begin-travel]').onclick=()=>{try{const next=beginTravel(state).state;commitGame(next,{exhaustion:false});notice.close();notice.remove();if(state.stats.life===0)render();else launch();}catch(e){notice.querySelector('[data-travel-error]').textContent=e.message;}};
 notice.querySelector('[data-cancel-travel]').onclick=()=>{try{const result=cancelTravel(state);commitGame(result.state,{exhaustion:false});status=result.message;notice.close();notice.remove();render();}catch(e){notice.querySelector('[data-travel-error]').textContent=e.message;}};
 return true;
}
function showExamNotice(){
 if(!examReady(state)||warEmergency(state))return false;
 const notice=modal('举行制举',`<div class="auspice-report"><div class="auspice-art"><img src="assets/exam-gongyuan.png" alt="士子云集贡院，考官查验名册并引导入场"></div><div class="auspice-copy"><h3>制举已备，请陛下选才</h3><p>贡院士子云集，吏部奉诏筹备制举，天下英才已齐备。退朝后即举行制举，占用当前工作阶段，消耗1点体力。</p><p>选定人才并统一录用后，本届制举结束，自动进入下一阶段。关闭或取消将放弃本届选才，同样消耗1点体力并进入下一阶段。</p></div></div><button class="primary" data-begin-exam>举行制举</button>`);
 notice.setAttribute('aria-label','举行制举通知');
 notice.classList.add('exam-notice');
 notice.querySelector('.modal-heading small').textContent='吏部 · 制举呈报';
  let handled=false;
 const cancel=()=>{if(transition(next=>Object.assign(next,cancelExam(next))))render();};
 const dismiss=begin=>{
  if(handled)return;handled=true;notice.close();notice.remove();
  if(!begin){cancel();return;}
  openExamSession(state,root,id=>{const next=finishExam(state,id);commitGame(next);queueMicrotask(()=>render());},cancel);
 };
 notice.querySelector('[data-begin-exam]').onclick=()=>dismiss(true);
 notice.querySelector('.close').onclick=()=>dismiss(false);
 // Backdrop and panel whitespace are not an explicit decision to abandon the exam.
 notice.onclick=null;
 notice.oncancel=e=>{e.preventDefault();dismiss(false);};
 notice.onclose=()=>dismiss(false);
 return true;
}
function showRoyalNotice(){
 const event=pendingRoyalEvent(state);if(!event)return false;
 const art=ROYAL_EVENT_ART[event.kind];
 const notice=modal('内廷呈报',`<div class="auspice-report"><div class="auspice-art"><img src="${art.src}" alt="${art.alt}"></div><div class="auspice-copy"><small>${dateLabel(event.turn)} · 宫中纪事</small><h3>${ROYAL_EVENT_TITLES[event.kind]}</h3><p>${escape(event.message)}</p><div class="royal-event-note">${art.note}</div></div></div><button class="primary" data-ack-royal>朕知道了</button>`);
 notice.classList.add('auspice-dialog','royal-event-dialog');notice.dataset.kind=event.kind;notice.setAttribute('aria-label',ROYAL_EVENT_TITLES[event.kind]);
 notice.querySelector('[data-ack-royal]').onclick=()=>notice.close();
 notice.onclose=()=>{notice.remove();const ok=transition(next=>{next.harem.royalNotices=next.harem.royalNotices.filter(e=>e.id!==event.id);});if(ok)render();};
 return true;
}
function showAuspice(){
 const record=state.auspices?.history.find(r=>!r.notified);if(!record)return false;
 const event=auspiceDefinition(state,record.kind),province=state.domestic.provinces.find(p=>p.id===record.provinceId),place=province?.name??'中央';
 const notice=modal('祥瑞呈报',`<div class="auspice-report"><div class="auspice-art"><img src="assets/auspices/${event.id}.png" alt="${event.title}插图"></div><div class="auspice-copy"><small>${dateLabel(record.turn)} · ${escape(place)}喜报</small><h3>${event.title}</h3><p>启奏陛下：${escape(province?province.name+'地方奏报，':'')}${event.story}</p><div class="auspice-reward"><span>${escape(place)} · ${event.label}</span><strong>+${record.amount.toLocaleString('zh-CN')} <small>${event.unit}</small></strong></div><p class="auspice-applied">已计入${province?'地方':'中央'}实有资源</p></div></div><button class="primary" data-ack-auspice>朕知道了</button>`);
 notice.classList.add('auspice-dialog');notice.setAttribute('aria-label','祥瑞喜报');notice.querySelector('[data-ack-auspice]').onclick=()=>notice.close();notice.onclose=()=>{const ok=transition(next=>{next.auspices.history.find(r=>r.turn===record.turn).notified=true;});notice.remove();if(ok)render();};return true;
}
function modal(title,content){const dialog=document.createElement('dialog');dialog.innerHTML=`<div class="modal-heading"><div><small>皇城纪事</small><h2>${escape(title)}</h2></div><button class="close" aria-label="关闭">×</button></div>${content}`;root.append(dialog);dialog.querySelector('.close').onclick=()=>dialog.close();dialog.onclose=()=>dialog.remove();dialog.showModal();return dialog;}
function confirmDialog(title,content,action){const d=modal(title,`<p>${escape(content)}</p><button class="primary" id="confirm">确认</button>`);d.querySelector('#confirm').onclick=()=>{d.close();action();};}
function commitGame(next,{court=false,exhaustion=true}={}){
 let collapsed=false;
 const committed=persistCandidate(state,next,localStorage,draft=>{if(court)spendEnergy(draft,true);if(exhaustion)collapsed=resolveExhaustion(draft);});
 state=committed;status=collapsed?'体力耗尽晕倒，已进入下一回合，体力回满、健康增加5，额外损失30寿元。':'已自动存档';
 if(collapsed)queueMicrotask(()=>render());
 return committed;
}
function transition(change){try{const next=structuredClone(state);change(next);commitGame(next,{exhaustion:false});return true;}catch(e){status=e.message;modal('操作未保存',`<p>${escape(e.message)}</p>`);return false;}}
function closeRoom(turn,phase){if(state.turn===turn&&state.phase===phase)transition(next=>leaveRoom(next));render();}
function commitRites(next){return commitGame(next,{court:true});}
function commitPalace(next){return commitGame(next);}
function commitWar(next){
 const finished=next.stats.life>0&&!next.domestic.war?.battle&&!next.domestic.collapse?.pending;
 // Mandatory battle resolution must remain possible when normal office work is
 // blocked: wartime navigation prevents visiting the rooms that restore stats.
 const recovering=Boolean(warEmergency(state)&&courtBlock(next));
 return commitGame(next,{court:finished&&!state.domestic.collapse?.pending&&!recovering,exhaustion:finished});
}
function openIndustryReport(options){
 if(warEmergency(state)){openEntry({id:'war-minister'});return;}
 if(state.scene!=='court'){
  const reason=roomBlock(state,'court');if(reason){modal('请于早朝办理',`<p>${escape(reason)}</p>`);return;}
  if(!transition(next=>{next.scene='court';}))return;render();
 }
 const reason=courtBlock(state);if(reason){modal('暂不能办公',`<p>${escape(reason)}</p>`);return;}
 openConstruction(state,root,next=>commitGame(next,{court:true}),()=>render(),options);
}
function summonCourt(id){
 if(warEmergency(state)){openEntry({id:'war-minister'});return;}
 openCourtAudience(state,root,id,navigateCourt,()=>render());
}
function navigateCourt(action,options={}){
 if(warEmergency(state)){openEntry({id:'war-minister'});return;}
 if(action==='justice'){openCourtJustice(state,root,next=>commitGame(next,{court:true}),()=>render());return;}
 if(['personnel','personnel-delegate','personnel-exam'].includes(action)){openCourtPersonnel(state,root,next=>commitGame(next,{court:true}),()=>render(),{view:action==='personnel-delegate'?'delegate':action==='personnel-exam'?'exam':'assign',onRetire:()=>{if(warEmergency(state)){openEntry({id:'war-minister'});return;}if(transition(next=>leaveRoom(next)))render();}});return;}
 if(action.startsWith('atlas-')){openCourtAtlas(state,root,next=>commitGame(next,{court:true}),()=>render(),{tab:action.slice(6),provinceId:options.provinceId,fiscalKind:options.fiscalKind});return;}
 if(action==='petition'){const first=courtAgenda(state)[0];if(first)openCourtPetition(state,root,first.id,navigateCourt,()=>render());return;}
 if(['tax','census'].includes(action)){openCourtAtlas(state,root,next=>commitGame(next,{court:true}),()=>render(),{tab:'finance',fiscalKind:action,provinceId:options.provinceId});return;}
 if(action==='purchase'){openKitOffice(state,root,next=>commitGame(next,{court:true}),()=>render(),{tab:'purchase'});return;}
 if(action==='industry'){openIndustryReport({tab:'develop'});return;}
 openEntry(officials.find(o=>o.id===options.office)??{id:options.office});
}
function openEntry(e){if(warEmergency(state)){openWar(state,root,commitWar,()=>render());return;}if(state.scene==='palace'||['dragon','harem'].includes(e.id)){const blocked=roomBlock(state,e.id);if(blocked){modal('暂不能进入',`<p>${escape(blocked)}</p>`);return;}}if(state.scene==='court'&&['dragon','harem'].includes(e.id)){if(!transition(next=>leaveRoom(next)))return;render();}if(state.scene==='palace'&&!['court','liming'].includes(e.id)){const turn=state.turn,phase=state.phase;let acted=false;const commit=next=>{commitPalace(next);acted=true;};const close=()=>{if(['rest','harem'].includes(e.id)&&!acted)render();else closeRoom(turn,phase);};if(e.id==='rest')openZichen(state,root,commit,close);else openPalace(state,root,e,commit,close);return;}if(e.id==='court'){if(transition(next=>{next.scene='court';}))render();return;}if(!warEmergency(state)&&(state.scene==='court'||['court','liming'].includes(e.id))&&courtBlock(state)){modal('暂不能办公',`<p>${escape(courtBlock(state))}</p>`);return;}if(e.id==='prime-minister'){openNational(state,root,next=>commitGame(next,{court:next.stats.life>0,exhaustion:next.stats.life>0}),()=>render());return;}if(e.id==='war-minister'){openWar(state,root,commitWar,()=>render());return;}if(e.id==='personnel-minister'){openPersonnelMinister(state,root,next=>{commitGame(next,{court:true});},()=>render());return;}if(e.id==='works-minister'){openConstruction(state,root,next=>{commitGame(next,{court:true});},()=>render());return;}if(e.id==='justice-minister'){openJustice(state,root,next=>{commitGame(next,{court:true});},()=>render());return;}if(e.id==='liming'){if(!e.ritesOnly){const turn=state.turn,phase=state.phase;const menu=modal('礼明殿',`<p>内侍候旨：陛下欲查阅宫中名册，还是接见外臣？</p><button data-inner-roster>召见内侍 · 嫔妃名册</button><button data-envoy-hall>接见外臣</button>`);menu.querySelector('[data-inner-roster]').onclick=()=>{menu.close();openZichen(state,root,commitPalace,()=>closeRoom(turn,phase),{view:'menu',title:'礼明殿'});};menu.querySelector('[data-envoy-hall]').onclick=()=>{menu.close();openEntry({...e,ritesOnly:true});};return;}const visit=arrivedEnvoy(state);if(!visit){const turn=state.turn,phase=state.phase;const notice=modal('礼明殿',`<p>${state.envoyVisit?'国书已发，外臣将于下一旬抵京。请先结束本旬。':'殿中尚无外臣候见。请先在朝堂召见礼部尚书，选择外交国家并颁发国书。'}</p>`);notice.onclose=()=>{notice.remove();closeRoom(turn,phase);};return;}const turn=state.turn,phase=state.phase;openRites(state,root,commitRites,()=>closeRoom(turn,phase));return;}if(e.id==='rites-minister'){openEnvoyPlanner(state,root,commitRites,()=>render());return;}if(e.id==='central-general'){if(!transition(next=>{next.visits[e.id]=(Number(next.visits[e.id])||0)+1;}))return;openGeneral(state,root,next=>{commitGame(next,{court:true});},()=>render());return;}if(e.id==='revenue-minister'){if(!transition(next=>{next.visits[e.id]=(Number(next.visits[e.id])||0)+1;}))return;openRevenue(state,root,next=>{commitGame(next,{court:true});root.querySelector('.top-stats b').textContent=state.stats.treasury.toLocaleString('zh-CN');},()=>render());return;}if(e.id==='personnel-deputy'){if(!transition(next=>{next.visits[e.id]=(Number(next.visits[e.id])||0)+1;}))return;openPersonnel(state,root);return;}if(['revenue-deputy','war-deputy','works-deputy','rites-deputy'].includes(e.id)){if(!transition(next=>{next.visits[e.id]=(Number(next.visits[e.id])||0)+1;}))return;openDomestic(state,root,{onIndustry:openIndustryReport,mode:e.id==='rites-deputy'?'diplomacy':e.id==='works-deputy'?'works':e.id==='war-deputy'?'military':'domestic'});return;}if(!transition(next=>{next.visits[e.id]=(Number(next.visits[e.id])||0)+1;}))return;const d=modal(e.name,`<p>${escape(e.description)}</p><div class="module-state">此处的详细玩法将在后续版本逐项完善。<br>已到访 ${state.visits[e.id]} 次</div>${e.id==='court'?'<button class="primary" id="enter-court">进入朝堂</button>':''}`);d.querySelector('#enter-court')?.addEventListener('click',()=>{d.close();if(transition(next=>{next.scene='court';}))render();});}
function exportSave(){const blob=new Blob([JSON.stringify(state,null,2)],{type:'application/json'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=`emperor-turn-${state.turn}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
function importSave(){const input=document.createElement('input');input.type='file';input.accept='.json,application/json';input.onchange=async()=>{try{const file=input.files[0];if(!file)return;if(file.size>MAX_SAVE_BYTES)throw new Error('存档文件过大');const imported=validateSave(JSON.parse(await file.text()));openSlotPicker('选择导入位置',imported);}catch(e){modal('无法导入',`<p>${escape(e.message)}</p>`);}};input.click();}
login();

function slotName(i){return i===0?'自动存档':`手动存档 ${String(i).padStart(2,'0')}`;}
function slotRows(slots,action){return slots.map((s,i)=>`<article><div><strong>${slotName(i)}${s?' · '+escape(s.data.name):' · 空'}</strong>${s?`<p>${escape(s.label||'')} ${dateLabel(s.data.turn)} · ${new Date(s.at).toLocaleString('zh-CN')}</p>`:'<p>暂无进度</p>'}</div><button data-slot="${i}" ${action==='读取'&&!s?'disabled':''}>${action}</button></article>`).join('');}
function openSlotPicker(title,data,label=''){
 try{const slots=readSlots(localStorage),importing=title==='选择导入位置';
 const d=modal(title,`<p>${importing?'选择导入进度的存档位置，导入后可在进度列表读取。':'选择手动存档位置。'}</p><div class="save-list">${slotRows(slots,importing?'导入此处':'保存此处')}</div>`);d.classList.add('saves-dialog');
 if(!importing)d.querySelector('[data-slot="0"]').disabled=true;
 d.querySelectorAll('[data-slot]').forEach(b=>b.onclick=()=>{const i=Number(b.dataset.slot);const store=()=>{try{writeSlot(localStorage,i,data,label);document.querySelectorAll('dialog[open]').forEach(x=>x.close());if(!state)login();openSaves();}catch(e){modal('无法保存',`<p>${escape(e.message)}</p>`);}};if(slots[i])confirmDialog('覆盖存档',`确定覆盖${slotName(i)}中的 ${slots[i].data.name}（${dateLabel(slots[i].data.turn)}）？`,store);else store();});
 }catch(e){modal('无法保存',`<p>${escape(e.message)}</p>`);}
}
function openSaves(){
 try{
 const slots=readSlots(localStorage);const playing=Boolean(root.querySelector('.game'));const d=modal('读取进度',`<p>1 个自动存档，10 个手动存档。继续读取最近进度。</p>${playing?'<div class="manual-save"><input id="save-label" maxlength="40" placeholder="存档名称（可选）" aria-label="存档名称"><button id="manual-save" class="primary">手动存档</button></div>':''}<div class="save-list">${slotRows(slots,'读取')}</div><button id="export">导出当前存档</button><button id="import">导入存档</button>`);
 d.classList.add('saves-dialog');d.querySelector('#export').disabled=!state&&!readSave();d.querySelector('#export').onclick=()=>{if(state)exportSave();else{const data=readSave();const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=`皇帝-${data.name}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000);}};d.querySelector('#import').onclick=importSave;
 d.querySelector('#manual-save')?.addEventListener('click',()=>openSlotPicker('选择手动存档位置',state,d.querySelector('#save-label').value));
 d.querySelectorAll('[data-slot]').forEach(b=>b.onclick=()=>{try{const next=validateSave(structuredClone(slots[Number(b.dataset.slot)].data));d.close();replaceGame(next);}catch(e){modal('无法读取',`<p>${escape(e.message)}</p>`);}});
 }catch(e){modal('无法读取存档',`<p>${escape(e.message)}</p>`);}
}
function quitGame(){if(state&&!save())return;if(window.emperorDesktop)window.emperorDesktop.quit();else{window.close();status='进度已保存，可关闭此页面退出游戏。';if(state)render();else login();}}
