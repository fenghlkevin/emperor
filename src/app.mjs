import {battleReady,isMarching} from './campaign-march.mjs';
import {openGarden} from './garden-ui.mjs';
import {openMedical} from './medical-ui.mjs';
import {palaceAction} from './emperor.mjs';
import {captureCourtReports} from './court-agenda.mjs';
import {palaceDialogueMarkup} from './palace-dialogue.mjs';
import './quantity-controls.mjs';
import {openConstruction} from './construction-ui.mjs';
import {palaceDashboard} from './palace-dashboard.mjs';
import {courtAgenda as palaceAgenda} from './court-agenda.mjs';
import {openGameEditor} from './game-editor-ui.mjs';
import {difficultyChoices,openDifficulty} from './difficulty-ui.mjs';
import {difficultyLabel} from './difficulty.mjs';
import {playEnding} from './ending-cinematic.mjs';
import {playOpening} from './opening-cinematic.mjs';
import {openArmyRecovery} from './army-recovery-ui.mjs';
import {enableDevelopmentBalance} from './new-dynasty-balance.mjs';
import './accelerating-steppers.mjs';
import {openWorksMinister} from './works-minister-ui.mjs';
import {openEspionage} from './rites-deputy-ui.mjs';
import {enableOfficialProduction} from './official-production.mjs';
import {initializeNewLocalAutonomy} from './local-autonomy.mjs';
import {assertOfficeNavigation,openOfficeReport} from './court-office-access.mjs';
import {initializeResourceEconomy} from './province-resources.mjs';
import {openTurnEconomyReport} from './turn-economy-report-ui.mjs';
import {openCourtHonors} from './court-honors-ui.mjs';
import {openCourtSpecial} from './court-special-ui.mjs';
import {openCourtRoyal} from './court-royal-ui.mjs';
import {openCourtCampaign} from './court-campaign-ui.mjs';
import {openCentralTransfers} from './central-military-transfers-ui.mjs';
import {openCourtGarrison} from './court-garrison-ui.mjs';
import {openCourtNegotiation} from './court-negotiation-ui.mjs';
import {openCourtDiplomacy} from './court-diplomacy-ui.mjs';
import {openCourtJustice} from './court-justice-ui.mjs';
import {openCourtPersonnel} from './court-personnel-ui.mjs';
import {openAllCourtPetitions,courtDeskMarkup,openCourtAudience,openCourtPetition,openCourtRoster,restoreCourtPetitions} from './court-play-ui.mjs';
import {openFoodRelief} from './food-relief-ui.mjs';
import {openCourtAtlas} from './court-atlas-ui.mjs';
import {visibleCourtAgenda} from './court-petition-preferences.mjs';
const courtAgenda=s=>visibleCourtAgenda(s,localStorage);
import {openKitOffice} from './kit-office-ui.mjs';
import {readSlots,writeSlot} from './save-slots.mjs';
import {openChronicle} from './ending-ui.mjs';
const warEmergency=s=>s.domestic.collapse?.pending||battleReady(s)||s.domestic.strategy?.pending?.defender===s.domestic.playerCountryId;
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
import {emperorPanel,openPalace,refreshEmperorVitals} from './emperor-ui.mjs';
import {spendEnergy,courtBlock} from './emperor.mjs';
import {openEnvoyPlanner} from './envoy-planner-ui.mjs';
import {arrivedEnvoy} from './envoy-visits.mjs';
import {openWar} from './war-ui.mjs';
import {examReady,finishExam,cancelExam} from './exam-session.mjs';
import {openExamSession} from './exam-session-ui.mjs';
import {openJustice} from './justice-ui.mjs';
import {openRites} from './rites-ui.mjs';
import {openGeneral} from './general-ui.mjs';
import {openRevenue} from './revenue-ui.mjs';
import {openPersonnel} from './personnel-ui.mjs';
import {openDomestic} from './domestic-ui.mjs';

import { SAVE_KEY, buildings, officials, createPlayableGame, validateSave, dateLabel, advance, phaseLabel, roomBlock, leaveRoom, resolveExhaustion, sleepUntilNextTurn } from './game.mjs';
const PANEL_PREFERENCE_KEY='emperor.ui.panel-collapsed';
function readPanelPreference(){try{return localStorage.getItem(PANEL_PREFERENCE_KEY)==='true';}catch{return false;}}
const root=document.querySelector('#app'); let state=null; let showLabels=true; let emperorCollapsed=readPanelPreference(); let status='';let courtCleanup=null;let selectedCourtOffice=null;let sidebarCleanup=null;
const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function readSave(){ try { const raw=localStorage.getItem(SAVE_KEY); return raw?validateSave(JSON.parse(raw)):null; } catch (e) { status='本地存档无法读取，可导入备份或创建新角色。'; return null; } }
function save(){return transition(()=>{});}
function replaceGame(next){try{next=validateSave(next);enableDevelopmentBalance(next.domestic,next.turn);enableOfficialProduction(next.domestic,next.turn);next.saveRevision=state?.saveRevision??0;state=persistCandidate(state,next,localStorage);status='已自动存档';render();}catch(e){status=e.message;modal('无法保存',`<p>${escape(e.message)}</p>`);}}
function login(){selectedCourtOffice=null;state=null;sidebarCleanup?.();sidebarCleanup=null;courtCleanup?.();courtCleanup=null; const existing=readSave(); root.innerHTML=`<main class="login"><div class="cover"><div class="login-art"><img src="assets/scenes/palace/sketch-palace-color.png" alt="彩色宫城"></div><div class="title-lockup"><h1 class="game-logo"><img src="assets/brand/emperor-logo.png" alt="皇帝" width="1254" height="1254" fetchpriority="high"></h1><p>山河入卷 · 万象待启</p></div><div class="cover-caption">一城烟雨，一世江山。</div></div><section class="login-panel"><div class="eyebrow">开启你的王朝</div><h1>江山，始于此刻。</h1><p>入主宫阙，召见群臣。<br>在时光流转中，写下你的帝王纪事。</p><button id="new-dynasty" class="primary">开启王朝 →</button>${existing?`<button id="continue">继续 · ${escape(existing.name)} / ${escape(dateLabel(existing.turn,existing.eraName??existing.name))}</button>`:''}<button id="save-list">读取进度</button><button id="import">导入存档</button><button id="quit">退出游戏</button><small>单机游玩 · 进度自动保存于本机</small><div role="status">${escape(status)}</div></section></main>`;
root.querySelector('#new-dynasty').onclick=()=>{const d=modal('开启王朝',`<form id="create"><label for="name">君主名号</label><input id="name" maxlength="16" required placeholder="请输入名号" autocomplete="off"><label for="country-name">国号</label><input id="country-name" maxlength="16" required placeholder="如：汉、唐、大明" autocomplete="off"><label for="era-name">年号</label><input id="era-name" maxlength="16" required placeholder="如：永乐、雍正" autocomplete="off">${difficultyChoices()}<button class="primary">开始新朝 →</button></form>`);d.querySelector('#name').focus();d.querySelector('#create').onsubmit=e=>{e.preventDefault();const name=d.querySelector('#name').value.trim();if(!name){d.querySelector('#name').setCustomValidity('请输入君主名号');d.querySelector('#name').reportValidity();return;}const countryName=d.querySelector('#country-name').value.trim();if(!countryName){d.querySelector('#country-name').setCustomValidity('请输入国号');d.querySelector('#country-name').reportValidity();return;}const game=createPlayableGame(name,countryName,{difficulty:d.querySelector('[name=difficulty]:checked').value});game.eraName=d.querySelector('#era-name').value.trim();if(!game.eraName)return;replaceGame(game);};d.querySelectorAll('#name,#country-name').forEach(input=>input.oninput=e=>e.target.setCustomValidity(''));}; root.querySelector('#continue')?.addEventListener('click',()=>{state=existing;enableDevelopmentBalance(state.domestic,state.turn);enableOfficialProduction(state.domestic,state.turn);render();});root.querySelector('#import').onclick=importSave;root.querySelector('#save-list').onclick=openSaves;root.querySelector('#quit').onclick=quitGame; }
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
 if(state.scene!=='court')selectedCourtOffice=null;
 courtCleanup?.();courtCleanup=null;
 const palace=state.scene==='palace';const atmosphere=palaceAtmosphere(state);const entries=palace?buildings:officials;
 root.innerHTML=`<main class="game ${palace?'is-palace':'is-court'}"><header class="topbar"><div class="brand">${palace?'':'<button class="court-tools-toggle" data-court-tools aria-label="打开起居菜单" aria-expanded="false">☰</button>'}<img class="brand-icon" src="assets/brand/emperor-icon.png" alt="" width="40" height="40">皇帝 <span>宫廷纪事</span></div><div class="top-stats"><button class="difficulty-entry" data-difficulty aria-label="查看难度与休养援助">${difficultyLabel(state)}</button><span data-national-silver title="全国共用银两，收入与支出均直接计入国库">银两 <b>${state.domestic.countries.find(c=>c.id===state.domestic.playerCountryId).fiscal.treasury.toLocaleString()}</b> 两</span><span data-national-grain title="全国共用存粮，口粮、军粮与赈济均从此支取">粮食 <b>${state.domestic.countries.find(c=>c.id===state.domestic.playerCountryId).fiscal.grain.toLocaleString()}</b> 石</span>${palace?'':'<button class="court-accounts-entry" data-court-overview aria-label="查阅国计旬报" title="国计旬报"><span aria-hidden="true">▤</span></button>'}<span>♜ 威望 <b>${state.stats.prestige} / 500</b></span></div><div class="reign"><span class="date">${escape(dateLabel(state.turn,state.eraName??state.name))} · ${phaseLabel(state)}</span><small>${escape(state.name)}</small></div></header><aside class="sidebar" ${palace?'':'hidden'}><nav>${palace?'<button id="domestic"><span>▤</span>六部</button>':'<button data-scene="palace"><span>⌂</span>退朝<i>›</i></button>'}<button id="saves"><span>▥</span>${palace?'典藏':'存档'}</button><button id="game-editor"><span>✎</span>编辑器</button><button id="chronicle">本朝纪事${state.endings?.criticalTurns||state.endings?.advicePending?' · 待议':''}</button>${state.reignResult?'<button id="reign-result">本朝终评</button>':''}</nav>${emperorPanel(state,emperorCollapsed)}<div class="sidebar-note"><span>山河无恙</span><p>一砖一瓦，皆为江山。<br>一言一行，皆入史册。</p></div><button class="home-button" id="exit">返回首页</button><button id="quit">退出游戏</button></aside><div class="workspace ${palace?'':'court-workspace'} "><section class="scene ${state.scene} ${palace&&state.phase===5?'is-night':''}" aria-label="${palace?'皇宫建筑':'朝堂人物'}">${palace?palaceArtwork(state):'<img src="assets/scenes/court/sketch-court-background-urban-v9.png" alt="彩色朝堂群臣" draggable="false">'}${entries.map(e=>{const blocked=palace&&Boolean(roomBlock(state,e.id));const hideName=palace&&state.phase===5&&blocked;return `<button class="hotspot ${palace&&e.id==='court'&&!blocked?'selected':''} ${blocked?'is-unavailable':''} ${showLabels?'labeled':''}" data-entry="${e.id}" aria-label="${e.name}" ${hideName?'':`title="${e.name} · ${e.description??''}"`}><svg class="outline" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true"><path d="${palace?palaceOutline(e.id).path:COURT_OUTLINES[e.id].path}"/></svg><span${hideName?' hidden':''}>${e.name}${e.id==='liming'&&arrivedEnvoy(state)?' · 外臣候见':''}</span></button>`;}).join('')}<div class="scene-heading" ${palace?`title="${atmosphere.label} · ${atmosphere.description}"`: ''}><h1>${palace?'皇城':'宣政殿'}</h1><p>${palace?atmosphere.label+' · '+atmosphere.description:'文武列班 · 恭候圣裁'}</p>${palace?`<button id="labels">${showLabels?'隐藏地点':'显示地点'}</button>`:''}</div><footer><span>⊙ ${palace?'点击宫殿进入':'点击人物召见'}</span><span role="status">${escape(status||'进度自动保存')}</span></footer></section>${palace?palaceDashboard(state):courtDeskMarkup(state)}</div></main>`;

 if(palace){const shortcuts=root.querySelector('.emperor-actions');root.querySelector('.sidebar').insertBefore(shortcuts,root.querySelector('#exit'));}
 entries.forEach(e=>{
  const el=root.querySelector(`[data-entry="${e.id}"]`),bounds=palace?palaceOutline(e.id):COURT_OUTLINES[e.id];
  Object.assign(el.style,{left:`${bounds.x}%`,top:`${bounds.y}%`,width:`${bounds.w}%`,height:`${bounds.h}%`});
  if(!palace)el.style.clipPath=bounds.clip;
  if(palace){
   const hidePreview=()=>{const preview=root.querySelector('.palace-building-preview');if(preview)preview.hidden=true;};
   const showPreview=()=>{const preview=root.querySelector('.palace-building-preview');if(!preview)return;preview.dataset.room=e.id;preview.querySelector('h3').textContent=e.name;preview.querySelector('[data-building-description]').textContent=e.description;preview.querySelector('[data-building-note]').textContent=roomBlock(state,e.id)||'宫门已开 · 点击宫殿即可进入';preview.hidden=false;};
   el.onpointerenter=showPreview;el.onfocus=showPreview;el.onpointerleave=hidePreview;el.onblur=hidePreview;
  }
  el.onclick=()=>{if(!palace)selectedCourtOffice=e.id;root.querySelectorAll('.hotspot.selected').forEach(b=>b.classList.remove('selected'));el.classList.add('selected');if(palace){root.querySelector('.palace-building-preview').hidden=true;openEntry(e);}else summonCourt(e.id);};
 });
 if(palace){
  const workspace=root.querySelector('.workspace'),scene=root.querySelector('.scene.palace');
  workspace.append(scene.querySelector('.scene-heading'));
  workspace.append(scene.querySelector('footer'));
  root.querySelector('[data-palace-dashboard-toggle]').onclick=e=>{
   const panel=root.querySelector('.palace-dashboard'),collapsed=panel.classList.toggle('is-collapsed');
   root.querySelector('#palace-dashboard-content').hidden=collapsed;
   const button=e.currentTarget;button.setAttribute('aria-expanded',String(!collapsed));button.setAttribute('aria-label',(collapsed?'展开':'收起')+'今日要务');button.textContent=collapsed?'展开 ＋':'收起 −';
   try{localStorage.setItem('emperor.palace-dashboard.collapsed',String(collapsed));}catch{}
  };
  root.querySelector('[data-palace-labels]').onclick=()=>{showLabels=!showLabels;render();};
  root.querySelector('[data-palace-home]').onclick=()=>{workspace.classList.remove('map-detail');workspace.classList.toggle('map-overview');};
  root.querySelector('[data-palace-zoom]').onclick=()=>{workspace.classList.remove('map-overview');workspace.classList.toggle('map-detail');};
  root.querySelectorAll('[data-palace-room]').forEach(b=>b.onclick=()=>openEntry(buildings.find(e=>e.id===b.dataset.palaceRoom)));
  root.querySelectorAll('[data-palace-agenda]').forEach(b=>b.onclick=()=>{const id=b.dataset.palaceAgenda;if(warEmergency(state)){openEntry({id:'war-minister'});return;}const reason=roomBlock(state,'court');if(reason){modal('请于早朝办理',`<p>${escape(reason)}</p>`);return;}if(!transition(next=>{next.scene='court';}))return;render();openCourtPetition(state,root,id,navigateCourt,()=>render(),(next,{read=false}={})=>commitGame(next,{court:!read,exhaustion:!read}));});
  root.querySelector('[data-palace-report]').onclick=()=>{if(warEmergency(state)){openEntry({id:'war-minister'});return;}openTurnEconomyReport(state,root,()=>render());};
  root.querySelector('[data-palace-advance]').onclick=()=>{
   if(warEmergency(state)){openEntry({id:'war-minister'});return;}
   if(state.phase===0||state.phase===5){openEntry(buildings.find(e=>e.id===(state.phase===0?'court':'dragon')));return;}
   const d=modal('内侍请旨',`<p>陛下，眼下是${escape(phaseLabel(state))}。可要稍歇片刻，待到下一时辰？未办的事务仍会留候，此次等候不会恢复体力。</p><button data-cancel-time>暂留此刻</button><button class="primary" data-confirm-time>稍候片刻</button>`);
   d.querySelector('[data-cancel-time]').onclick=()=>d.close();
   d.querySelector('[data-confirm-time]').onclick=()=>{d.close();if(transition(next=>leaveRoom(next)))render();};
  };
  const count=palaceAgenda(state,{limit:Infinity}).length;
  const target=root.querySelector('[data-entry="court"] span');
  if(count&&target&&!roomBlock(state,'court'))target.insertAdjacentHTML('beforeend',`<b class="palace-event-count">${count}</b>`);
 }
 if(!palace){courtCleanup=mountCourtActors(root.querySelector('.scene.court'),state.domestic);if(selectedCourtOffice)root.querySelector(`[data-entry="${selectedCourtOffice}"]`)?.classList.add('selected','is-summoned');}
 root.querySelector('#reign-result')?.addEventListener('click',()=>{const heir=!state.domestic.collapse?.ended&&state.domestic.royalFamily.find(p=>p.id===state.dynasty.heirId&&p.status==='palace'&&p.age>=16&&p.age<80);const report=modal('本朝终评',reignMarkup(state.reignResult,escape)+'<button data-replay-ending>重观结局演出</button>'+(heir?`<button data-succeed-dynasty>由${escape(heir.name)}继位，继续经营</button>`:''));report.classList.add('reign-dialog');report.querySelector('[data-replay-ending]').onclick=()=>playEnding(state);report.querySelector('[data-succeed-dynasty]')?.addEventListener('click',()=>{try{const next=succeedDynasty(state);commitGame(next,{exhaustion:false});report.close();render();}catch(e){modal('继位未完成',`<p>${escape(e.message)}</p>`);}});});
 root.querySelectorAll('[data-official]').forEach(button=>{
  const person=root.querySelector(`[data-entry="${button.dataset.official}"]`);
  button.onclick=()=>person.click();
  button.onpointerenter=button.onfocus=()=>person.classList.add('is-focused');
  button.onpointerleave=button.onblur=()=>person.classList.remove('is-focused');
 });
 if(!palace){
  root.querySelector('[data-court-tools]').onclick=e=>{const sidebar=root.querySelector('.sidebar');sidebar.hidden=!sidebar.hidden;e.currentTarget.setAttribute('aria-expanded',String(!sidebar.hidden));if(!sidebar.hidden)fitSidebar();};
  root.querySelector('[data-court-all]')?.addEventListener('click',()=>openAllCourtPetitions(state,root,navigateCourt,()=>render(),(next,{read=false}={})=>commitGame(next,{court:!read,exhaustion:!read})));
  root.querySelector('[data-court-restore]')?.addEventListener('click',()=>restoreCourtPetitions(state,root,()=>render()));
  root.querySelectorAll('[data-court-petition]').forEach(b=>b.onclick=()=>openCourtPetition(state,root,b.dataset.courtPetition,navigateCourt,()=>render(),(next,{read=false}={})=>commitGame(next,{court:!read,exhaustion:!read})));
  root.querySelector('[data-court-atlas]').onclick=()=>navigateCourt('atlas-grain',{overview:true});
  root.querySelector('[data-court-overview]').onclick=()=>{if(warEmergency(state)){openEntry({id:'war-minister'});return;}openTurnEconomyReport(state,root,()=>render());};
 }
 root.querySelector('#chronicle').onclick=()=>{if(warEmergency(state)){openEntry({id:'war-minister'});return;}openChronicle(state,root,next=>commitGame(next,{exhaustion:false}),()=>render());};
 fitSidebar();
 root.querySelector('[data-emperor-toggle]').onclick=()=>{emperorCollapsed=!emperorCollapsed;try{localStorage.setItem(PANEL_PREFERENCE_KEY,String(emperorCollapsed));}catch{}const panel=root.querySelector('.emperor-panel'),button=panel.querySelector('[data-emperor-toggle]');panel.classList.toggle('is-collapsed',emperorCollapsed);panel.querySelector('#emperor-details').hidden=emperorCollapsed;button.setAttribute('aria-expanded',String(!emperorCollapsed));button.setAttribute('aria-label',(emperorCollapsed?'展开':'收起')+'天子起居');button.innerHTML=`<span aria-hidden="true">${emperorCollapsed?'＋':'−'}</span>`;};
 root.querySelector('[data-sleep-next-turn]')?.addEventListener('click',()=>{
 const d=modal('安寝至明',`<div class="sleep-notice-copy"><small>天子起居 · 内侍请旨</small><p>陛下，寝殿已备妥。此刻安寝，便一觉睡到下一旬早朝，本旬余下的事就暂且搁下了。</p><p class="sleep-notice-note">安睡一夜，最多可恢复150体力、增加10健康、5快乐；独寝不额外损耗寿元，过旬自然减1。各部旬末收支照常办理，陛下若还有要事，不妨办妥再歇。</p></div><div class="sleep-notice-actions"><button data-cancel-sleep autofocus>暂不安寝</button><button class="primary" data-confirm-sleep>就寝吧</button></div>`);
 d.classList.add('sleep-notice');d.setAttribute('aria-label','安寝至明确认');
 d.querySelector('[data-cancel-sleep]').onclick=()=>d.close();
 d.querySelector('[data-confirm-sleep]').onclick=()=>{d.close();if(transition(next=>sleepUntilNextTurn(next))){status='已完成独寝恢复，进入下一回合';render();}};
 });root.querySelector('[data-quick-sleep]').onclick=()=>openEntry(buildings.find(e=>e.id==='dragon'));root.querySelector('[data-quick-harem]').onclick=()=>openEntry(buildings.find(e=>e.id==='harem'));root.querySelectorAll('[data-scene]').forEach(b=>b.onclick=()=>{if(warEmergency(state)){openEntry({id:'war-minister'});return;}if(b.dataset.scene===state.scene)return;if(b.dataset.scene==='court'){openEntry(buildings.find(e=>e.id==='court'));return;}requestCourtDismiss();});root.querySelector('#labels')?.addEventListener('click',()=>{showLabels=!showLabels;render();});root.querySelector('#next')?.addEventListener('click',()=>{if(warEmergency(state)){openEntry({id:'war-minister'});return;}if(state.scene==='court'){requestCourtDismiss();}else openEntry(buildings.find(e=>e.id==='dragon'));});root.querySelector('#domestic')?.addEventListener('click',()=>openDomestic(state,root,{onSubsidy:openProvinceSubsidy,onIndustry:openIndustryReport}));root.querySelector('#saves').onclick=openSaves;root.querySelector('#game-editor').onclick=()=>openGameEditor(state,next=>{const saved=commitGame(next,{exhaustion:false});render();return saved;});root.querySelector('#quit').onclick=quitGame;root.querySelector('[data-difficulty]').onclick=()=>openDifficulty(state,root,next=>{const saved=commitGame(next,{exhaustion:false});render();return saved;});root.querySelector('#exit').onclick=()=>{if(save())login();};
 if(state.reignResult)return;if(!warEmergency(state)&&showTravelNotice())return;
 if(showExamNotice())return;
 if(showRoyalNotice())return;
 if(warEmergency(state)){status='前线战事未平，恭请陛下召见兵部尚书，主持军务。';root.querySelector('.workspace footer [role=status]').textContent=status;return;}if(showAuspice())return;
 const visit=arrivedEnvoy(state);if(visit&&!visit.notified){const country=state.domestic.countries.find(c=>c.id===visit.countryId);const notice=modal('外臣抵京',`<p>启奏陛下：${escape(country.name)}使臣已抵京，现于礼明殿恭候召见。</p><p>陛下退朝后，可移驾礼明殿，召见来使。</p><button class="primary" data-ack-arrival>朕知道了</button>`);notice.setAttribute('aria-label','外臣抵京通知');notice.querySelector('[data-ack-arrival]').onclick=()=>notice.close();notice.onclose=()=>{if(state.envoyVisit===visit)transition(next=>{next.envoyVisit.notified=true;});notice.remove();};}
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
 const notice=modal('举行制举',`<div class="auspice-report"><div class="auspice-art"><img src="assets/examinations/exam-gongyuan.png" alt="士子云集贡院，考官查验名册并引导入场"></div><div class="auspice-copy"><h3>制举已备，请陛下选才</h3><p>贡院士子云集，吏部奉诏筹备制举，天下英才已齐备。退朝后便可开考，占用一个时辰，耗费1点体力。</p><p>待陛下择定英才、颁旨录用，本届制举便告结束，时辰随之推移。若此时离席或罢考，便会错过本届选才，仍耗费1点体力和一个时辰。</p></div></div><button class="primary" data-begin-exam>举行制举</button>`);
 notice.setAttribute('aria-label','举行制举通知');
 notice.classList.add('exam-notice');
 notice.querySelector('.modal-heading small').textContent='吏部 · 制举呈报';
  let handled=false;
 const cancel=()=>{try{commitGame(cancelExam(state));queueMicrotask(()=>render());}catch(e){modal('制举未结束',`<p>${escape(e.message)}</p><button data-retry-exam>返回制举</button>`).querySelector('[data-retry-exam]').onclick=()=>render();}};
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
 const notice=modal('内廷呈报',`<div class="auspice-report"${art.src?'':' style="grid-template-columns:1fr"'}>${art.src?`<div class="auspice-art"><img src="${art.src}" alt="${art.alt}"></div>`:''}<div class="auspice-copy"><small>${escape(dateLabel(event.turn,state.eraName??state.name))} · 宫中纪事</small><h3>${ROYAL_EVENT_TITLES[event.kind]}</h3><p>${escape(event.message)}</p><div class="royal-event-note">${art.note}</div></div></div><button class="primary" data-ack-royal>朕知道了</button>`);
 notice.classList.add('auspice-dialog','royal-event-dialog');notice.dataset.kind=event.kind;notice.setAttribute('aria-label',ROYAL_EVENT_TITLES[event.kind]);
 notice.querySelector('[data-ack-royal]').onclick=()=>notice.close();
 notice.onclose=()=>{notice.remove();const ok=transition(next=>{next.harem.royalNotices=next.harem.royalNotices.filter(e=>e.id!==event.id);});if(ok)render();};
 return true;
}
function showAuspice(){
 const record=state.auspices?.history.find(r=>!r.notified);if(!record)return false;
 const event=auspiceDefinition(state,record.kind),province=state.domestic.provinces.find(p=>p.id===record.provinceId),place=province?.name??'中央';
 const notice=modal('祥瑞呈报',`<div class="auspice-report"><div class="auspice-art"><img src="assets/auspices/${event.id}.png" alt="${event.title}插图"></div><div class="auspice-copy"><small>${escape(dateLabel(record.turn,state.eraName??state.name))} · ${escape(place)}喜报</small><h3>${event.title}</h3><p>启奏陛下：${escape(province?province.name+'地方奏报，':'')}${event.story}</p><div class="auspice-reward"><span>${escape(place)} · ${event.label}</span><strong>+${record.amount.toLocaleString('zh-CN')} <small>${event.unit}</small></strong></div><p class="auspice-applied">已计入${province?'地方':'中央'}实有资源</p></div></div><button class="primary" data-ack-auspice>朕知道了</button>`);
 notice.classList.add('auspice-dialog');notice.setAttribute('aria-label','祥瑞喜报');notice.querySelector('[data-ack-auspice]').onclick=()=>notice.close();notice.onclose=()=>{const ok=transition(next=>{next.auspices.history.find(r=>r.turn===record.turn).notified=true;});notice.remove();if(ok)render();};return true;
}
function requestCourtDismiss(){
 if(state.scene!=='court')return;
 if(root.querySelector('.court-dismiss-confirm[open]'))return;
 const d=modal('确认退朝',`<p>陛下是否结束今日朝议，退朝回宫？</p><div class="court-dismiss-actions"><button data-cancel-dismiss autofocus>继续听政</button><button class="primary" data-confirm-dismiss>退朝吧</button></div>`);
 d.classList.add('court-dismiss-confirm');d.setAttribute('aria-label','确认退朝');
 d.querySelector('[data-cancel-dismiss]').onclick=()=>d.close();
 d.querySelector('[data-confirm-dismiss]').onclick=()=>{d.querySelector('[data-confirm-dismiss]').disabled=true;d.close();if(state.scene!=='court')return;if(warEmergency(state)){openEntry({id:'war-minister'});return;}if(transition(next=>leaveRoom(next)))render();};
}
function modal(title,content){const dialog=document.createElement('dialog');const dialogue=palaceDialogueMarkup(title,content);if(dialogue)dialog.classList.add('palace-dialogue');dialog.setAttribute('aria-label',title);dialog.innerHTML=dialogue??`<div class="modal-heading"><div><small>皇城纪事</small><h2>${escape(title)}</h2></div><button class="close" aria-label="关闭">×</button></div>${content}`;root.append(dialog);dialog.querySelector('.close').onclick=()=>dialog.close();dialog.querySelector('[data-attendant-dismiss]')?.addEventListener('click',()=>dialog.close());dialog.onclose=()=>dialog.remove();dialog.showModal();return dialog;}
function confirmDialog(title,content,action){const d=modal(title,`<p>${escape(content)}</p><button class="primary" id="confirm">确认</button>`);d.querySelector('#confirm').onclick=()=>{d.close();action();};}
function commitGame(next,{court=false,exhaustion=true}={}){
 const alreadyEnded=Boolean(state?.reignResult);
 let collapsed=false;
 const committed=persistCandidate(state,next,localStorage,draft=>{captureCourtReports(draft);if(court)spendEnergy(draft,true);if(exhaustion)collapsed=resolveExhaustion(draft);});
 if(state?.turn!==committed.turn||state?.scene!==committed.scene||committed.scene!=='court')selectedCourtOffice=null;
 state=committed;refreshEmperorVitals(root,state);const silver=root.querySelector('[data-national-silver] b');if(silver)silver.textContent=state.stats.treasury.toLocaleString('zh-CN');status=collapsed?'体力耗尽晕倒，已进入下一回合，体力回满，健康与快乐各减少10，额外损失15寿元。':'已自动存档';
 if(!alreadyEnded&&committed.reignResult)setTimeout(()=>{if(state!==committed)return;render();playEnding(state,{onFinish:()=>root.querySelector('#reign-result')?.click()});},0);
 else if(collapsed)queueMicrotask(()=>render());
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
function openProvinceOperation(options,open){
 const back=()=>{render();options.onReturn?.(state);};
 const blocked=warEmergency(state)?'陛下，军情紧急，还请先召见兵部尚书，定夺战事。':state.scene!=='court'?roomBlock(state,'court'):courtBlock(state);
 if(blocked){const notice=modal('御前禀报',`<p>${escape(blocked)}</p>`);notice.addEventListener('close',back,{once:true});return;}
 if(state.scene!=='court'){if(!transition(next=>{next.scene='court';})){back();return;}render();}
 const reason=courtBlock(state);if(reason){const notice=modal('御前禀报',`<p>${escape(reason)}</p>`);notice.addEventListener('close',back,{once:true});return;}
 open(back);
}
function openProvinceSubsidy(provinceId,onReturn){
 const options={tab:'subsidy',provinceId,scoped:true,onReturn};
 openProvinceOperation(options,back=>openRevenue(state,root,next=>commitGame(next,{court:true}),back,options));
}
function openIndustryReport(options={}){
 openProvinceOperation(options,back=>{
  if(options.onReturn&&options.provinceId)openConstruction(state,root,next=>commitGame(next,{court:true}),back,{...options,scoped:true});
  else openWorksMinister(state,root,next=>commitGame(next,{court:true}),back,{kind:options.tab??'develop',provinceId:options.provinceId});
 });
}
function summonCourt(id){
 if(warEmergency(state)){openEntry({id:'war-minister'});return;}
 selectedCourtOffice=id;
 for(const menu of root.querySelectorAll('.court-audience')){menu.onclose=()=>menu.remove();menu.close();menu.remove();}
 openCourtAudience(state,root,id,navigateCourt,()=>{
  if(selectedCourtOffice!==id)return;
  selectedCourtOffice=null;
  root.querySelectorAll('.scene.court .is-summoned,.scene.court .selected').forEach(actor=>actor.classList.remove('is-summoned','selected'));
 });
}
function navigateCourt(action,options={}){
 const back=()=>{render();if(state.scene!=='court'||warEmergency(state))return;
  if(options.petitionId){openCourtPetition(state,root,options.petitionId,navigateCourt,()=>render(),(next,{read=false}={})=>commitGame(next,{court:!read,exhaustion:!read}));return;}
  if(selectedCourtOffice===options.office)summonCourt(options.office);
 };
 if(options.office){try{assertOfficeNavigation(options.office,action);}catch(error){modal('职掌范围',`<p>${escape(error.message)}</p>`);return;}}
 if(warEmergency(state)){openEntry({id:'war-minister'});return;}
 if(action==='domestic-register'){openDomestic(state,root,{onSubsidy:openProvinceSubsidy,onIndustry:openIndustryReport,onClose:back});return;}
 if(action==='espionage'){openEspionage(state,root,next=>commitGame(next,{court:true}),back);return;}
 if(action==='justice-prison'&&options.office==='justice-deputy'){openOfficeReport(state,root,options.office,back,{view:'prison'});return;}
 if(action==='office-report'){openOfficeReport(state,root,options.office,back);return;}
 if(action==='honors'){openCourtHonors(state,root,next=>commitGame(next,{court:next.stats.life>0,exhaustion:next.stats.life>0}),back,()=>{render();root.querySelector('#reign-result')?.click();});return;}
 if(options.office==='works-minister'&&['atlas-build','industry','special','register'].includes(action)){openWorksMinister(state,root,next=>commitGame(next,{court:true}),back,{kind:({'atlas-build':'buildings',industry:'develop',special:'special',register:'records'})[action],provinceId:options.provinceId});return;}
 if(action.startsWith('works-')){openWorksMinister(state,root,next=>commitGame(next,{court:true}),back,{kind:action.slice(6),provinceId:options.provinceId});return;}
 if(action==='special'){openCourtSpecial(state,root,next=>commitGame(next,{court:true}),back);return;}
 if(action==='royal'){openCourtRoyal(state,root,next=>commitGame(next,{court:true}),back);return;}
 if(['general-train','general-ongoing','general-security'].includes(action)){openGeneral(state,root,next=>commitGame(next,{court:true}),()=>summonCourt('central-general'),{tab:action.slice(8)});return;}
 if(action==='army-recovery'){openArmyRecovery(state,root,next=>commitGame(next,{court:true}),back);return;}
 if(action==='campaign'&&state.domestic.war?.battle){openEntry({id:'war-minister'});return;}
 if(action==='campaign'){openCourtCampaign(state,root,next=>commitGame(next,{court:true}),back,()=>openEntry({id:'war-minister'}),{savePlans:next=>commitGame(next,{exhaustion:false})});return;}
 if(['garrison-distribute','garrison-collect','garrison-transfer'].includes(action)){openCentralTransfers(state,root,next=>commitGame(next,{court:true}),back,{direction:action==='garrison-collect'?'in':'out'});return;}
 if(['garrison','garrison-purchase','garrison-recruit','garrison-dismiss','garrison-transfer'].includes(action)){openCourtGarrison(state,root,next=>commitGame(next,{court:true}),back,{kind:action==='garrison'?'inventory':action.slice(9)});return;}
 if(action==='diplomacy'){openCourtDiplomacy(state,root,next=>commitGame(next,{court:true}),back,{countryId:options.countryId,onMeet:()=>{if(transition(next=>leaveRoom(next))){render();openEntry({id:'liming',ritesOnly:true});}}});return;}
 if(action==='register'&&options.office==='revenue-minister'){openOfficeReport(state,root,options.office,back);return;}
 if(action==='register'&&options.office==='war-deputy'){openKitOffice(state,root,next=>commitGame(next,{court:true}),back,{tab:'inventory',savePlans:next=>commitGame(next,{exhaustion:false})});return;}
 if(action==='register'&&options.office==='rites-minister'){openEnvoyPlanner(state,root,commitRites,back,{tab:'ritual'});return;}
 if(['justice','justice-funding','justice-prison','justice-sentence','justice-amnesty'].includes(action)){openCourtJustice(state,root,next=>commitGame(next,{court:true}),back,{view:({'justice-funding':'funding','justice-prison':'prison','justice-sentence':'prison','justice-amnesty':'amnesty'})[action]??'investigate',office:options.office??'justice-minister',readOnly:options.office==='justice-deputy'});return;}
 if(['personnel','personnel-honor','personnel-dismiss','personnel-budget','personnel-delegate','personnel-exam','personnel-hanlin'].includes(action)){openCourtPersonnel(state,root,next=>commitGame(next,{court:true}),back,{office:options.office,provinceId:options.provinceId,view:({'personnel-honor':'honor','personnel-dismiss':'dismiss','personnel-budget':'budget','personnel-hanlin':'hanlin','personnel-delegate':'delegate','personnel-exam':'exam'})[action]??'assign',onRetire:()=>{if(warEmergency(state)){openEntry({id:'war-minister'});return;}requestCourtDismiss();}});return;}
 if(action==='food-purchase'){openFoodRelief(state,root,next=>commitGame(next,{court:true}),back);return;}
 if(action.startsWith('atlas-')){openCourtAtlas(state,root,next=>commitGame(next,{court:true}),back,{office:options.office,tab:action.slice(6),provinceId:options.provinceId,fiscalKind:options.fiscalKind,overview:options.overview});return;}
 if(action==='petition'){const first=courtAgenda(state)[0];if(first)openCourtPetition(state,root,first.id,navigateCourt,back,(next,{read=false}={})=>commitGame(next,{court:!read,exhaustion:!read}));return;}
 if(['tax','subsidy','census'].includes(action)){openCourtAtlas(state,root,next=>commitGame(next,{court:true}),back,{office:options.office,tab:'finance',fiscalKind:action,provinceId:options.provinceId});return;}
 if(action==='purchase'){openKitOffice(state,root,next=>commitGame(next,{court:true}),back,{tab:'purchase',savePlans:next=>commitGame(next,{exhaustion:false})});return;}
 if(action==='industry'){openIndustryReport({tab:'develop'});return;}
 openEntry(officials.find(o=>o.id===options.office)??{id:options.office});
}
function openEntry(e){if(e.id==='medical'){openMedical(state,root,next=>commitGame(next,{exhaustion:false}),()=>render());return;}if(warEmergency(state)){if(state.scene!=='court'){if(!transition(next=>{next.scene='court';}))return;render();}openWar(state,root,commitWar,()=>render(),{savePlans:next=>commitGame(next,{exhaustion:false})});return;}if(e.id==='prime-minister'){summonCourt(e.id);return;}if(e.id==='personnel-deputy'){summonCourt(e.id);return;}if(e.id?.endsWith('-deputy')){openOfficeReport(state,root,e.id,()=>render());return;}if(state.scene==='palace'||['dragon','harem'].includes(e.id)){const blocked=roomBlock(state,e.id);if(blocked){modal('内侍禀报',`<p>${escape(blocked)}</p>`);return;}}if(state.scene==='court'&&['dragon','harem'].includes(e.id)){if(!transition(next=>leaveRoom(next)))return;render();}if(e.id==='garden'){const before=state.stats;if(transition(next=>Object.assign(next,palaceAction(next,'garden').state))){status=`游园已毕，健康增加${state.stats.health-before.health}，快乐增加${state.stats.happiness-before.happiness}，体力减少${before.energy-state.stats.energy}。`;render();openGarden(root,status);}return;}if(state.scene==='palace'&&!['court','liming'].includes(e.id)){const turn=state.turn,phase=state.phase;let acted=false;const commit=next=>{const saved=commitPalace(next);acted=true;return saved;};const close=()=>{if(['rest','harem','dragon'].includes(e.id)&&!acted)render();else closeRoom(turn,phase);};if(e.id==='rest')openZichen(state,root,commit,close);else openPalace(state,root,e,commit,close);return;}if(e.id==='court'){if(transition(next=>{next.scene='court';}))render();return;}if(!warEmergency(state)&&(state.scene==='court'||['court','liming'].includes(e.id))&&courtBlock(state)){modal('御前禀报',`<p>${escape(courtBlock(state))}</p>`);return;}if(e.id==='prime-minister'){openNational(state,root,next=>commitGame(next,{court:next.stats.life>0,exhaustion:next.stats.life>0}),()=>render());return;}if(e.id==='war-minister'){openWar(state,root,commitWar,()=>render(),{savePlans:next=>commitGame(next,{exhaustion:false})});return;}if(e.id==='personnel-minister'){summonCourt(e.id);return;}if(e.id==='works-minister'){summonCourt(e.id);return;}if(e.id==='justice-minister'){openJustice(state,root,next=>{commitGame(next,{court:true});},()=>render());return;}if(e.id==='liming'){const visit=arrivedEnvoy(state);if(!visit){const turn=state.turn,phase=state.phase;const notice=modal('礼明殿',`<p>${state.envoyVisit?'启禀陛下，国书已送出，外臣将于下一旬抵京。还请稍候。':'启禀陛下，眼下尚无外臣候见。若欲会见某国使臣，可在早朝召见礼部尚书，议定邦国，颁发国书相邀。'}</p>`);notice.onclose=()=>{notice.remove();closeRoom(turn,phase);};return;}const turn=state.turn,phase=state.phase;openCourtNegotiation(state,root,commitRites,()=>closeRoom(turn,phase));return;}if(e.id==='rites-minister'){openEnvoyPlanner(state,root,commitRites,()=>render());return;}if(e.id==='central-general'){if(!transition(next=>{next.visits[e.id]=(Number(next.visits[e.id])||0)+1;}))return;openGeneral(state,root,next=>{commitGame(next,{court:true});},()=>render());return;}if(e.id==='revenue-minister'){if(!transition(next=>{next.visits[e.id]=(Number(next.visits[e.id])||0)+1;}))return;openRevenue(state,root,next=>{commitGame(next,{court:true});root.querySelector('.top-stats b').textContent=state.stats.treasury.toLocaleString('zh-CN');},()=>render());return;}if(e.id==='personnel-deputy'){if(!transition(next=>{next.visits[e.id]=(Number(next.visits[e.id])||0)+1;}))return;openPersonnel(state,root);return;}if(['revenue-deputy','war-deputy','works-deputy','rites-deputy'].includes(e.id)){if(!transition(next=>{next.visits[e.id]=(Number(next.visits[e.id])||0)+1;}))return;openDomestic(state,root,{onSubsidy:openProvinceSubsidy,onIndustry:openIndustryReport,mode:e.id==='rites-deputy'?'diplomacy':e.id==='works-deputy'?'works':e.id==='war-deputy'?'military':'domestic'});return;}if(!transition(next=>{next.visits[e.id]=(Number(next.visits[e.id])||0)+1;}))return;const d=modal(e.name,`<p>${escape(e.description)}</p><div class="module-state">此处暂无事务候旨，陛下可往别处走走。</div>${e.id==='court'?'<button class="primary" id="enter-court">进入朝堂</button>':''}`);d.querySelector('#enter-court')?.addEventListener('click',()=>{d.close();if(transition(next=>{next.scene='court';}))render();});}
function exportSave(){const blob=new Blob([JSON.stringify(state,null,2)],{type:'application/json'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=`emperor-turn-${state.turn}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
function importSave(){const input=document.createElement('input');input.type='file';input.accept='.json,application/json';input.hidden=true;document.body.append(input);input.oncancel=()=>input.remove();input.onchange=async()=>{try{const file=input.files[0];if(!file)return;if(file.size>MAX_SAVE_BYTES)throw new Error('存档文件过大');const imported=validateSave(JSON.parse(await file.text()));openSlotPicker('选择导入位置',imported);}catch(e){modal('无法导入',`<p>${escape(e.message)}</p>`);}finally{input.remove();}};input.click();}
login();
playOpening();

function slotName(i){return i===0?'自动存档':`手动存档 ${String(i).padStart(2,'0')}`;}
function slotRows(slots,action){return slots.map((s,i)=>`<article><div><strong>${slotName(i)}${s?' · '+escape(s.data.name):' · 空'}</strong>${s?`<p>${escape(s.label||'')} ${escape(dateLabel(s.data.turn,s.data.eraName??s.data.name))} · ${new Date(s.at).toLocaleString('zh-CN')}</p>`:'<p>暂无进度</p>'}</div><button data-slot="${i}" ${action==='读取'&&!s?'disabled':''}>${action}</button></article>`).join('');}
function openSlotPicker(title,data,label=''){
 try{const slots=readSlots(localStorage),importing=title==='选择导入位置';
 const d=modal(title,`<p>${importing?'选择导入进度的存档位置，导入后可在进度列表读取。':'选择手动存档位置。'}</p><div class="save-list">${slotRows(slots,importing?'导入此处':'保存此处')}</div>`);d.classList.add('saves-dialog');
 if(!importing)d.querySelector('[data-slot="0"]').disabled=true;
 d.querySelectorAll('[data-slot]').forEach(b=>b.onclick=()=>{const i=Number(b.dataset.slot);const store=()=>{try{writeSlot(localStorage,i,data,label);document.querySelectorAll('dialog[open]').forEach(x=>x.close());if(!state)login();openSaves();}catch(e){modal('无法保存',`<p>${escape(e.message)}</p>`);}};if(slots[i])confirmDialog('覆盖存档',`确定覆盖${slotName(i)}中的 ${slots[i].data.name}（${escape(dateLabel(slots[i].data.turn,slots[i].data.eraName??slots[i].data.name))}）？`,store);else store();});
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
