import {officeAbility,officeAbilityBasis} from './office-ability.mjs';
import {hanlinEffect,hanlinEligible,hanlinAttributeStep,HANLIN_FEE,HANLIN_ABILITY_CAP} from './hanlin.mjs';
import {GROWTH_KEYS,STUDY_KEYS,GROWTH_LABELS,abilityCap} from './official-growth.mjs';
import {assignmentEffectComparison} from './central-office-effects.mjs';
import {examSelection,ACTIVE_HISTORICAL_PEOPLE} from './exam.mjs';
import {commitOperation} from './operation-result.mjs';
import {localPolicyControls,bindLocalPolicyControls} from './local-policy-ui.mjs';
import {courtGovernanceFeedback} from './court-governance-feedback.mjs';
import {servingOfficials,officeId,NOBILITY,executePersonnel} from './personnel-actions.mjs';
import {officeRegister} from './personnel.mjs';
import {courtPersonnelPlan,personnelSeat} from './court-personnel.mjs';
import {officialArt,officialAvatar} from './official-art.mjs';
import {openHistoricalProfile,historicalProfile} from './historical-profile-ui.mjs';
import {governorProfile} from './governance.mjs';
import {courtBlock} from './emperor.mjs';
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fmt=n=>Number(n).toLocaleString('zh-CN');
const titles={assign:'官职任命',honor:'加官封爵',dismiss:'官员外调',delegate:'地方治理',budget:'治理预算',exam:'开科求贤',hanlin:'翰林院研习',profiles:'人物名册'};
const officeOrder=['prime-minister','central-general','personnel-minister','personnel-deputy','revenue-minister','revenue-deputy','rites-minister','rites-deputy','war-minister','war-deputy','justice-minister','works-minister','works-deputy'];
const orderedOffices=d=>officeRegister(d).sort((a,b)=>(officeOrder.indexOf(a.id)<0?999:officeOrder.indexOf(a.id))-(officeOrder.indexOf(b.id)<0?999:officeOrder.indexOf(b.id)));
const dimensions=[['politics','政务'],['leadership','统率'],['intelligence','智力'],['martial','武力'],['integrity','清廉'],['loyalty','忠诚']];
const rules={assign:['选择官位和人选后拟旨，再确认颁旨。原任转为待命，调出官位会空缺；调任忠诚最多增加5。','岗位能力按该官职的实际规则计算，清廉与忠诚单独生效。能力差值为拟任相对现任的变化。'],honor:['加官与封爵分别晋升一级，赏银按当前等级计算。忠诚最多增加10，并增加后续俸禄；拟旨后展示实际钱粮变化。'],dismiss:['外调会永久移出在朝名册，无法返回中央。请在御批页核对人员及风险后确认。'],delegate:['州牧与将军分别处理勾选的日常事务。缺官、缺少资源或超出授权时暂停并上奏。','全国预算、国库保留线与本州上限同时生效。保留线不保证常规结算后的余额。','锁定的职业不会被自动治理调整；无法保粮时须复奏。扩军、跨州调动和重大工程须另请旨。'],budget:['全国预算限制每旬自动治理支出，国库保留线同时生效。修改从下次治理生效；常规财政结算仍可能使余额低于保留线。'],exam:['开科支银500两，下旬揭榜；退朝后的工作阶段举行制举，可选择多人统一录用。','候选名额与名士概率由揭榜时的在职官员和皇帝能力核定。每届至少一名本朝新秀。'],hanlin:[`仅没有官职、没有辖区且未执行密查的待命官员可研习。每个实际研习旬支银${HANLIN_FEE}两。`,'基础每6旬积累1经验；所选能力70以下约18旬增加1点，70以上约36旬增加1点。侍郎只增加进度。',`研习不突破个人潜力与${HANLIN_ABILITY_CAP}点培养上限；清廉、忠诚不可研习。缺钱、保留线不足、尚书空缺或名额不足时暂停且不扣费。`,'换科与出院保留进度，获任官职即停止研习；经验与本科目均封顶后不再收费。'],profiles:['名册使用游戏收录的人物资料。点击详情可查阅人物生平、性格、当前能力与个人成长上限。']};
export function openCourtPersonnel(initial,root,onCommit,onClose,options={}){
 const officeTitle=options.office==='personnel-deputy'?'吏部侍郎':'吏部尚书';const view=options.view??'assign';if(!titles[view])throw Error('未知吏部事项');
 let state=initial,selectedId=null,office='prime-minister',province=options.provinceId,stage='draft',draft=null,error='',busy=false,query='',filter='all',scope='central',page=0,officePage=0,provincePage=0,studyAttribute='intelligence',studyPersonId=null,budget=initial.domestic.governance.budget,reserve=initial.domestic.governance.reserve,child=null;
 const dialog=document.createElement('dialog');dialog.className='governance-dialog court-personnel personnel-office-scroll';dialog.setAttribute('aria-label',`${officeTitle} · ${titles[view]}`);root.append(dialog);
 const breakpoint=matchMedia('(max-width:700px)');const onBreakpoint=()=>{page=0;officePage=0;provincePage=0;draw();};breakpoint.addEventListener('change',onBreakpoint);
 dialog.onclose=()=>{breakpoint.removeEventListener('change',onBreakpoint);child?.close();dialog.remove();onClose?.();};
 const people=()=>servingOfficials(state.domestic),owned=()=>state.domestic.provinces.filter(p=>p.countryId===state.domestic.playerCountryId);
 const pageSize=()=>matchMedia('(max-width:700px)').matches?3:6;
 const avatar=p=>p?`<img src="${esc(officialAvatar(p)??'')}" alt="${esc(p.name)}头像">`:'<span class="personnel-empty-seat">虚位</span>';
 const full=p=>p?`<img src="${esc(officialArt(p)?.full??'')}" alt="${esc(p.name)}立绘">`:'';
 function popup(title,lines){
  child?.close();const box=document.createElement('dialog');child=box;box.className='personnel-help-dialog';box.setAttribute('aria-label',title);let helpPage=0;const entries=lines.length?lines:['暂无记录。'];
  const paint=()=>{box.innerHTML=`<header><h2>${esc(title)}</h2><button data-help-close aria-label="关闭说明">×</button></header>${entries.length>1?`<select data-help-topic aria-label="选择说明事项">${entries.map((t,i)=>`<option value="${i}" ${helpPage===i?'selected':''}>${esc(t.length>32?t.slice(0,32)+'…':t)}</option>`).join('')}</select>`:''}<div class="personnel-help-copy"><p>${esc(entries[helpPage])}</p></div>`;box.querySelector('[data-help-close]').onclick=()=>box.close();box.querySelector('[data-help-topic]')?.addEventListener('change',e=>{helpPage=Number(e.target.value);paint();});};
  box.onclose=()=>{box.remove();if(child===box)child=null;};root.append(box);paint();box.showModal();
 }
 function propose(command){try{const reason=courtBlock(state);if(reason)throw Error(reason);draft=courtPersonnelPlan(state,command);stage='confirm';error='';draw();}catch(e){error=e.message;showError();}}
 function showError(){dialog.querySelector('[data-personnel-error]').textContent=error;}
 function pagination(current,total,kind){
  if(kind==='people')return `<label class="ministry-item-picker">选择人选<select data-personnel-pick aria-label="选择全部人选">${peopleForPicker.map(p=>`<option value="${esc(p.id)}" ${p.id===selectedId?'selected':''}>${esc(p.name)} · ${esc(p.office??'待命')}</option>`).join('')}</select></label>`;
  if(kind==='offices'){const rows=orderedOffices(state.domestic).filter(o=>scope==='central'?o.scope==='central':o.provinceId===province);return `<label class="ministry-item-picker">选择官位<select data-office-pick aria-label="选择全部官位">${rows.map(o=>`<option value="${o.id}" ${o.id===office?'selected':''}>${esc(o.name)}</option>`).join('')}</select></label>`;}
  return `<label class="ministry-item-picker">选择州郡<select data-province-pick aria-label="选择全部州郡">${owned().map(p=>`<option value="${p.id}" ${p.id===province?'selected':''}>${esc(p.name)}</option>`).join('')}</select></label>`;
 }
 let peopleForPicker=[];
 function roster(rows){
  const filtered=rows.filter(p=>(filter==='all'||(filter==='waiting')===!officeId(p))&&`${p.name} ${p.office??''} ${p.dynasty??''}`.includes(query));
  peopleForPicker=filtered;const selectedIndex=filtered.findIndex(p=>p.id===selectedId);if(selectedIndex>=0)page=Math.floor(selectedIndex/pageSize());const count=Math.ceil(filtered.length/pageSize());page=Math.min(page,Math.max(0,count-1));const visible=filtered.slice(page*pageSize(),(page+1)*pageSize());
  if(!filtered.some(p=>p.id===selectedId))selectedId=visible[0]?.id;
  return `<section class="personnel-gallery"><div class="personnel-gallery-tools"><input data-personnel-search type="search" value="${esc(query)}" placeholder="搜索姓名 / 官职" aria-label="搜索人选">${view==='assign'||view==='honor'||view==='dismiss'?`<div>${[['all','全部'],['waiting','待命'],['serving','在任']].map(([id,label])=>`<button data-personnel-filter="${id}" aria-pressed="${filter===id}">${label}</button>`).join('')}</div>`:''}</div><div class="personnel-portraits">${visible.map(p=>`<button ${view==='hanlin'?'data-hanlin-person':'data-personnel-person'}="${esc(p.id)}" aria-pressed="${p.id===selectedId}">${avatar(p)}<strong>${esc(p.name)}</strong><small>${esc(p.office??p.dynasty??'待命')}</small>${['assign','honor','dismiss'].includes(view)?`<span class="personnel-card-scores">${dimensions.map(([key,label])=>`<span data-card-attribute="${key}"><span>${label}</span><b>${esc(p[key]??'—')}</b></span>`).join('')}</span>`:''}</button>`).join('')||'<p class="personnel-no-results">暂无符合条件的人选</p>'}</div>${pagination(page,count,'people')}</section>`;
 }
 function scores(person,incumbent){return `<div class="personnel-ability-lines">${dimensions.map(([key,label])=>{const v=person?.[key],delta=Number.isFinite(v)&&Number.isFinite(incumbent?.[key])?v-incumbent[key]:null;return `<div><span>${label}</span><meter min="0" max="100" value="${v??0}" aria-label="${label}"></meter><b>${v??'—'}</b><small class="${delta>0?'is-better':delta<0?'is-worse':''}">${delta==null?'':delta>0?'+'+delta:delta}</small></div>`;}).join('')}</div>`;}
 function identity(p){return `<div class="personnel-office-identity">${p?avatar(p):''}<div><h2>${esc(p?.name??'暂无人选')}</h2><p>${esc(p?.office??p?.dynasty??'')}</p>${p?'<button data-personnel-profile>详情 ↗</button>':''}</div></div>`;}
 function draw(){
  dialog.dataset.personnelPage=view;dialog.dataset.personnelStage=stage;
  const all=people(),eligible=view==='hanlin'?hanlinEligible(state.domestic):view==='profiles'?ACTIVE_HISTORICAL_PEOPLE:all;
  let main='',side='',footer='';const rosterHtml=['assign','honor','dismiss','hanlin','profiles'].includes(view)?roster(eligible):'';
  const person=eligible.find(p=>p.id===selectedId);province??=owned()[0]?.id;
  if(view==='hanlin'&&studyPersonId!==selectedId){studyPersonId=selectedId;studyAttribute=state.domestic.personnel.hanlin?.students.find(r=>r.officialId===selectedId)?.attribute??'intelligence';}
  if(stage==='confirm'){
   main=`<section class="personnel-office-confirm-art">${person?full(person):`<img src="assets/${view==='exam'?'examinations/exam-gongyuan.png':'scenes/governance/sketch-governance-scenes-v1.png'}" alt="${titles[view]}">`}<h2>${esc(person?.name??titles[view])}</h2></section>`;
   side=`<section class="personnel-confirm"><h2>请陛下落旨</h2><p>${esc(draft.message)}</p><strong>支银 ${fmt(draft.cost)} 两</strong><p>国库 ${fmt(draft.treasuryBefore)} → ${fmt(draft.treasuryAfter)} 两</p><p>预计旬结余 ${fmt(draft.netBefore)} → ${fmt(draft.netAfter)} 两</p>${draft.personBefore&&draft.personAfter?`<p>忠诚 ${draft.personBefore.loyalty} → ${draft.personAfter.loyalty}</p>`:''}</section>`;
   footer=`${draft.warning?`<p class="atlas-confirm-risk">${esc(draft.warning)}</p>`:''}<div class="personnel-seal-actions"><button data-personnel-edit>再斟酌</button><button class="court-vermilion" data-personnel-seal>落印颁旨</button></div>`;
  }else if(view==='assign'){
   const officeSize=pageSize();const offices=orderedOffices(state.domestic).filter(o=>scope==='central'?o.scope==='central':o.provinceId===province),count=Math.ceil(offices.length/officeSize);officePage=Math.min(officePage,Math.max(0,count-1));
   if(!offices.some(o=>o.id===office))office=offices[0]?.id;const current=personnelSeat(state.domestic,office).incumbent;
   main=`<section class="personnel-seats"><header><span>拟任官位</span><div><select data-personnel-scope aria-label="官位范围"><option value="central" ${scope==='central'?'selected':''}>中央</option><option value="local" ${scope==='local'?'selected':''}>地方</option></select>${scope==='local'?`<select data-personnel-province-select aria-label="选择州郡">${owned().map(p=>`<option value="${p.id}" ${p.id===province?'selected':''}>${esc(p.name)}</option>`).join('')}</select>`:''}</div></header><div class="personnel-office-seals">${offices.slice(officePage*officeSize,officePage*officeSize+officeSize).map(o=>`<button data-personnel-office="${o.id}" aria-pressed="${office===o.id}"><strong>${esc(o.name)}</strong><small>${esc(personnelSeat(state.domestic,o.id).incumbent?.name??'虚位待贤')}</small></button>`).join('')}${Array.from({length:officeSize-offices.slice(officePage*officeSize,officePage*officeSize+officeSize).length},()=>'<span class="personnel-office-placeholder" aria-hidden="true"></span>').join('')}</div>${pagination(officePage,count,'offices')}</section><div class="personnel-comparison"><figure>${current?avatar(current):'<span>虚位待贤</span>'}<figcaption>现任 · ${esc(current?.name??'空缺')}</figcaption></figure><div class="personnel-vacancy"><h2>${esc(personnelSeat(state.domestic,office).office?.name)}</h2><span>→</span></div><figure>${avatar(person)}<figcaption>拟任 · ${esc(person?.name??'未选')}</figcaption></figure></div>${rosterHtml}`;
   const effect=assignmentEffectComparison(state.domestic,office,person);
   side=identity(person)+scores(person,current)+`<p class="personnel-office-effect" data-office-ability>岗位能力 ${current?officeAbility(current,office):'空缺'} → ${person?officeAbility(person,office):'未选'} <button data-effect-help aria-label="岗位能力说明">？</button></p>${effect?'<button class="personnel-inline-help" data-office-effect>任职影响 ？</button>':''}`;
   footer=`<button class="court-vermilion" data-personnel-propose="assign" ${person&&office?'':'disabled'}>拟定任命 →</button>`;
  }else if(view==='honor'||view==='dismiss'){
   main=`<figure class="personnel-office-large-portrait">${full(person)}<figcaption>${esc(person?.name??'暂无人选')}</figcaption></figure>${rosterHtml}`;side=identity(person)+scores(person);
   const rank=person?.rank??0,nobility=person?.nobilityLevel??0;
   side+=view==='honor'?`<p>${rank?10-rank+'品':'未授品'} · ${NOBILITY[nobility]}</p>`:'<p class="personnel-office-danger">外调后永久离开中央</p>';
   footer=view==='dismiss'?`<button class="court-vermilion" data-personnel-propose="dismiss" ${person?'':'disabled'}>拟定外调 →</button>`:`<div class="personnel-honor-options"><button class="court-vermilion" data-personnel-honor="rank" ${!person||rank>=9?'disabled':''}>加官 <small>${rank>=9?'已达最高':fmt((rank+1)*100)+'两'}</small></button><button class="court-vermilion" data-personnel-honor="nobility" ${!person||nobility>=6?'disabled':''}>封爵 <small>${nobility>=6?'已达最高':fmt((nobility+1)*100)+'两'}</small></button></div>`;
  }else if(view==='delegate'){
   const provinceSize=matchMedia('(max-width:700px)').matches?2:6;const provinces=owned(),count=Math.ceil(provinces.length/provinceSize);provincePage=Math.min(provincePage,Math.max(0,count-1));const p=provinces.find(p=>p.id===province),g=p?governorProfile(state.domestic,p):null;
   main=`<section class="personnel-province-directory"><h2>地方州郡</h2><div class="personnel-local-seats">${provinces.slice(provincePage*provinceSize,(provincePage+1)*provinceSize).map(p=>{const g=governorProfile(state.domestic,p),person=all.find(o=>o.id===g.id);return `<button data-personnel-province="${p.id}" aria-pressed="${province===p.id}">${avatar(person)}<strong>${esc(p.name)}</strong><small>${esc(g.name)}</small><b>${state.domestic.personnel.delegations.includes(p.id)?'已授权':'亲理'}</b></button>`;}).join('')}</div>${pagination(provincePage,count,'provinces')}<div class="personnel-local-illustration" aria-hidden="true"></div></section>`;
   side=p?`<h2>${esc(p.name)}</h2><p>${g.active?esc(g.name):'州牧空缺'} · 治理能力 ${g.ability}</p><div class="personnel-governor-facts"><span>民忠 <b>${Math.round(p.welfare.loyalty)}</b></span><span>清廉 <b>${g.integrity}</b></span><span>损耗 <b>${Math.round(g.lossRate*100)}%</b></span></div>${localPolicyControls(state,p)}<button data-feedback>最近治理记录 ？</button>`:'<h2>暂无本国州郡</h2>';
   if(p&&p.resourceRulesVersion!==1)footer=`<button class="court-vermilion" data-personnel-propose="delegate">${state.domestic.personnel.delegations.includes(province)?'收回地方委任':'委任地方治理'} →</button>`;
  }else if(view==='budget'){
   main='<section class="personnel-office-illustration"><h2>全国治理预算</h2><div aria-hidden="true"></div></section>';
   side=`<h2>全国预算</h2><label class="personnel-budget-field">每旬预算 / 两<input data-personnel-budget type="number" min="0" max="1000000" value="${budget}"></label><label class="personnel-budget-field">国库保留 / 两<input data-personnel-reserve type="number" min="0" max="1000000" value="${reserve}"></label><p>现行预算 ${fmt(state.domestic.governance.budget)} 两 / 旬</p><p>现行保留 ${fmt(state.domestic.governance.reserve)} 两</p>`;
   footer='<button class="court-vermilion" data-personnel-propose="governanceBudget">拟定全国预算 →</button>';
  }else if(view==='exam'){
   const p=state.domestic.personnel,e=examSelection(state.domestic,state.stats);
   main='<section class="personnel-exam-stage"><img src="assets/examinations/exam-gongyuan.png" alt="贡院会场"></section>';
   side=`<h2>${p.candidates.length?'金榜已揭':p.examTurn!==null?'制举筹备中':'开科求贤'}</h2><dl class="personnel-exam-facts"><div><dt>本届费用</dt><dd>500 两</dd></div><div><dt>预计名额</dt><dd>${e.minCount}–${e.maxCount} 人</dd></div><div><dt>名士概率</dt><dd>${Math.round(e.historicalChance*100)}%</dd></div><div><dt>尚书加额</dt><dd>${e.extra} 人</dd></div></dl><p>${p.candidates.length?`${p.candidates.length} 名候选待选`:p.examTurn!==null?`第 ${p.examTurn} 旬呈报`:'预计下旬揭榜'}</p>`;
   footer=p.candidates.length?'<button class="court-vermilion" data-personnel-exam-retire>退朝，举行制举 →</button>':`<button class="court-vermilion" data-personnel-propose="exam" ${p.examTurn!==null?'disabled':''}>${p.examTurn!==null?'候下旬揭榜':'拟诏开科 →'}</button>`;
  }else if(view==='hanlin'){
   const e=hanlinEffect(state.domestic),students=state.domestic.personnel.hanlin?.students??[],row=students.find(r=>r.officialId===person?.id);
   if(!STUDY_KEYS.includes(studyAttribute))studyAttribute='intelligence';
   main=`<section class="hanlin-study"><header><h2>在院 ${students.length} / ${e.capacity} 人</h2><button data-hanlin-history>研习记录 ？</button></header>${rosterHtml}${person?`<h3>${esc(person.name)} · 经验 ${person.experience??0}</h3><table class="personnel-study-table"><thead><tr><th>能力</th><th>当前</th><th>个人上限</th><th>培养上限</th><th>进度</th></tr></thead><tbody>${GROWTH_KEYS.map(key=>`<tr><th>${GROWTH_LABELS[key]}</th><td>${person[key]??0}</td><td>${abilityCap(person,key)}</td><td>${STUDY_KEYS.includes(key)?Math.min(HANLIN_ABILITY_CAP,abilityCap(person,key)):'—'}</td><td>${STUDY_KEYS.includes(key)?(person[key]??0)>=Math.min(HANLIN_ABILITY_CAP,abilityCap(person,key))?'已封顶':`${person.studyProgress?.abilities[key]??0}/${hanlinAttributeStep(person,key)}`:'不可研习'}</td></tr>`).join('')}</tbody></table>`:'<p>暂无待命官员</p>'}</section>`;
   side=identity(person)+`<p>每旬费用 ${HANLIN_FEE} 两 / 人</p><p>侍郎进度加成 ＋${e.rate-100}%</p><label>研习科目<select class="hanlin-course" data-hanlin-attribute>${STUDY_KEYS.map(key=>`<option value="${key}" ${key===studyAttribute?'selected':''}>${GROWTH_LABELS[key]}</option>`).join('')}</select></label>${row?'<button data-hanlin-stop>停止研习</button>':''}`;
   footer=`<button class="court-vermilion" data-personnel-propose="hanlin-enroll" ${person&&e.capacity?'':'disabled'}>${row?'调整研习科目':'拟旨入院研习'} →</button>`;
  }else if(view==='profiles'){
   main=`<figure class="personnel-office-large-portrait">${full(person)}</figure>${rosterHtml}`;side=identity(person)+scores(person);footer=`<button class="court-vermilion" data-personnel-profile ${person?'':'disabled'}>查看人物档案 ↗</button>`;
  }
  dialog.oninput=()=>{error='';showError();};
  dialog.innerHTML=`<header class="governance-header personnel-scene-header"><h1>${officeTitle} · ${titles[view]}</h1><button class="court-dialog-close" data-personnel-close aria-label="返回朝堂">关闭 ×</button></header><div class="personnel-office-meta"><span>国库 ${fmt(state.stats.treasury)} 两 · 第 ${state.turn} 旬</span><button data-personnel-help aria-label="${titles[view]}说明">？</button></div><div class="personnel-scene-body"><section class="personnel-scene-main">${main}</section><aside class="personnel-scene-side"><div class="personnel-scene-detail">${side}</div><footer class="personnel-decision">${footer}<p data-personnel-error role="status">${esc(error)}</p></footer></aside></div>`;
  if(view==='delegate'&&stage==='draft'){
   const form=dialog.querySelector('[data-local-policy]');if(form){form.querySelector('h3')?.remove();form.querySelectorAll('p:not([role=status])').forEach(p=>p.remove());const locks=form.querySelector('details');if(locks){locks.open=true;locks.querySelector('summary').textContent='锁定职业';}const save=form.querySelector('button');save.classList.add('court-vermilion');dialog.querySelector('.personnel-decision').prepend(save);save.setAttribute('form','personnel-local-policy');form.id='personnel-local-policy';}
   // Bind before moving the save button so form change and validation share the original path.
   if(form){const save=dialog.querySelector('.personnel-decision>button[form]');form.append(save);bindLocalPolicyControls(dialog,state,onCommit,result=>{state=result.state;dialog.close();});dialog.querySelector('.personnel-decision').prepend(save);}
  }
  bind(person);
 }
 function bind(person){
  const click=(selector,fn)=>dialog.querySelectorAll(selector).forEach(b=>b.onclick=()=>fn(b));
  click('[data-personnel-close]',()=>dialog.close());click('[data-personnel-help]',()=>{
   const lines=[...rules[view]];
   if(view==='exam'){const e=examSelection(state.domestic,state.stats);lines.push(`当前吏部${e.source.name}：额外${e.extra}名，名士概率${Math.round(e.historicalChance*100)}%，高能力新秀选拔概率${Math.round(e.highChance*1000)/10}%。`);}
   if(view==='hanlin'){const e=hanlinEffect(state.domestic);lines.push(`尚书${e.minister.name}主持，当前${e.capacity}个名额；侍郎${e.deputy.name}提供${e.rate-100}%进度加成。`);if(person)lines.push(`${person.name}：经验研习进度${person.studyProgress?.experience??0} / 600。`);}
   popup(titles[view]+'说明',lines);
  });
  click('[data-personnel-profile]',()=>{if(person)openHistoricalProfile(historicalProfile(person)?.id??person.id,root,person);});
  click('[data-effect-help]',()=>popup('岗位能力',[officeAbilityBasis(office)]));click('[data-office-effect]',()=>{const e=assignmentEffectComparison(state.domestic,office,person);if(e)popup('任职实际影响',[`现任：${e.before}`,`拟任：${e.after}`]);});
  click('[data-feedback]',()=>{const f=courtGovernanceFeedback(state,province);popup('最近治理记录',f?[`第${f.turn}旬支银${fmt(f.cost)}两`,...f.reasons]:[]);});
  click('[data-hanlin-history]',()=>popup('最近研习记录',(state.domestic.personnel.hanlin?.history??[]).map(r=>`第${r.turn}旬：${r.message}`)));
  for(const [selector,set] of [['[data-personnel-pick]',v=>{selectedId=v;}],['[data-office-pick]',v=>{office=v;const rows=orderedOffices(state.domestic).filter(o=>scope==='central'?o.scope==='central':o.provinceId===province);officePage=Math.floor(rows.findIndex(o=>o.id===v)/pageSize());}],['[data-province-pick]',v=>{province=v;provincePage=Math.floor(owned().findIndex(p=>p.id===v)/(matchMedia('(max-width:700px)').matches?2:6));}]])dialog.querySelector(selector)?.addEventListener('change',e=>{set(e.target.value);error='';draw();});
  click('[data-page]',b=>{const step=Number(b.dataset.step);if(b.dataset.page==='people')page+=step;else if(b.dataset.page==='offices')officePage+=step;else provincePage+=step;draw();});
  click('[data-personnel-person],[data-hanlin-person]',b=>{selectedId=b.dataset.personnelPerson??b.dataset.hanlinPerson;studyAttribute=state.domestic.personnel.hanlin?.students.find(r=>r.officialId===selectedId)?.attribute??'intelligence';error='';draw();});
  click('[data-personnel-filter]',b=>{filter=b.dataset.personnelFilter;page=0;draw();});
  dialog.querySelector('[data-personnel-search]')?.addEventListener('input',e=>{query=e.target.value;page=0;const start=e.target.selectionStart;draw();const input=dialog.querySelector('[data-personnel-search]');input.focus();input.setSelectionRange(start,start);});
  click('[data-personnel-office]',b=>{office=b.dataset.personnelOffice;draw();});
  dialog.querySelector('[data-personnel-scope]')?.addEventListener('change',e=>{scope=e.target.value;officePage=0;draw();});
  dialog.querySelector('[data-personnel-province-select]')?.addEventListener('change',e=>{province=e.target.value;officePage=0;draw();});
  click('[data-personnel-province]',b=>{province=b.dataset.personnelProvince;draw();});
  click('[data-personnel-honor]',b=>propose({kind:'honor',officialId:selectedId,honor:b.dataset.personnelHonor}));
  dialog.querySelector('[data-personnel-budget]')?.addEventListener('input',e=>budget=e.target.value===''?NaN:Number(e.target.value));dialog.querySelector('[data-personnel-reserve]')?.addEventListener('input',e=>reserve=e.target.value===''?NaN:Number(e.target.value));
  dialog.querySelector('[data-hanlin-attribute]')?.addEventListener('change',e=>studyAttribute=e.target.value);click('[data-hanlin-stop]',()=>propose({kind:'hanlin-stop',officialId:selectedId}));
  click('[data-personnel-propose]',b=>{const kind=b.dataset.personnelPropose;propose(kind==='assign'?{kind,officialId:selectedId,officeId:office}:kind==='dismiss'?{kind,officialId:selectedId}:kind==='delegate'?{kind,provinceId:province,enabled:!state.domestic.personnel.delegations.includes(province)}:kind==='governanceBudget'?{kind,budget,reserve}:kind==='hanlin-enroll'?{kind,officialId:selectedId,attribute:studyAttribute}:{kind});});
  click('[data-personnel-edit]',()=>{stage='draft';error='';draw();});
  click('[data-personnel-seal]',()=>{if(busy||stage!=='confirm')return;busy=true;try{const result=executePersonnel(state,draft.command);state=commitOperation(onCommit,result.state)??result.state;dialog.close();}catch(e){error=e.message;showError();}finally{busy=false;}});
  click('[data-personnel-exam-retire]',()=>{if(!options.onRetire)return;dialog.onclose=()=>{breakpoint.removeEventListener('change',onBreakpoint);dialog.remove();};dialog.close();options.onRetire();});
 }
 if(view==='assign')officePage=Math.floor(orderedOffices(initial.domestic).filter(o=>o.scope==='central').findIndex(o=>o.id===office)/pageSize());
 draw();dialog.showModal();return dialog;
}
