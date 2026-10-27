import {openCourtJustice} from './court-justice-ui.mjs';
import {petitionText,petitionSeal} from './petition-text.mjs';
import {decideLocalMilitaryPetition} from './local-military-petitions.mjs';
import {decideLocalPetition} from './local-petitions.mjs';
import {canOfficeNavigate} from './court-office-access.mjs';
import {visibleCourtAgenda,readArchived,archivePetition,restorePetitions} from './court-petition-preferences.mjs';
const courtAgenda=s=>visibleCourtAgenda(s,globalThis.localStorage);
const allCourtAgenda=s=>rawCourtAgenda(s,{archived:readArchived(s,globalThis.localStorage),limit:Infinity});
import {courtAgenda as rawCourtAgenda,courtSpeaker,courtOverview} from './court-agenda.mjs';
import {CENTRAL_OFFICES} from './personnel.mjs';
import {officialArt} from './official-art.mjs';
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fmt=n=>n.toLocaleString('zh-CN');
function memorialTitle(title){
 const text=String(title),parts=text.match(/^(.*?)(专项请旨|请旨|地方官位空缺|地方复奏|履约复奏|履约不足)$/);
 return parts?`<span>${esc(parts[1])}</span><span>${esc(parts[2])}</span>`:esc(text);
}
export function courtDeskMarkup(s){
 const agenda=courtAgenda(s),all=allCourtAgenda(s),q=courtOverview(s);
 return `<div class="court-inscription" aria-hidden="true"><span>宣 政 殿</span><small>一言定国策 · 一念系苍生</small></div><div class="court-corner"><span class="court-live-dot"></span>群臣候旨</div><section class="court-desk" aria-label="御案"><div class="court-desk-heading"><div class="court-desk-actions">${all.length>agenda.length?`<button data-court-all>全部待办 <span>${all.length}</span></button>`:''}${readArchived(s,globalThis.localStorage).length?'<button data-court-restore>查看已收奏折</button>':''}</div><button id="next" class="court-leave">退朝 <span>→</span></button></div><div class="court-memorials" data-court-count="${Math.max(1,agenda.length)}">${agenda.length?'':'<div class="court-quiet"><span>群臣候旨</span><strong>暂无待决要事</strong><small>可传召群臣、察看舆图，或由陛下决定退朝。</small></div>'}${agenda.map((a,i)=>`<button class="court-memorial ${a.urgent?'is-urgent':''}" data-court-petition="${a.id}"><span class="memorial-number">${['壹','贰','叁'][i]}</span><span class="memorial-seal">${a.seal}</span><span class="memorial-title">${memorialTitle(a.title)}</span><small>${CENTRAL_OFFICES.find(o=>o.id===a.office)?.name}呈</small><span class="memorial-open">展开奏折 ↗</span></button>`).join('')}<button class="court-atlas-object" aria-label="山河图" data-court-atlas><strong>山河图</strong></button></div></section>`;
}
function dialog(root,className,label,onClose){const d=document.createElement('dialog');d.className=`court-play-dialog ${className}`;d.setAttribute('aria-label',label);root.append(d);d.onclose=()=>{d.remove();onClose?.();};return d;}
function closeThen(d,fn){d.onclose=()=>d.remove();d.close();d.remove();fn();}
const task=(icon,title,note,action,extra={})=>({icon,title,note,action,...extra});
export function officeTasks(id){
 if(id==='personnel-deputy')return [task('人','人物名册','','personnel-profiles'),task('册','查阅百官名册','','office-report')];
 if(id==='war-deputy')return [task('册','查阅军务精册','','register'),task('兵','查阅军籍图鉴','','office-report')];
 if(id==='justice-deputy')return [task('囚','查阅天牢','在押人员与收押记录','justice-prison'),task('册','查阅刑部簿册','待决与在押人数','office-report')];
 if(id.endsWith('-deputy'))return [task('册','查阅本部资料','只读查阅，办理事项请召主管尚书','office-report')];
 if(id==='prime-minister')return [task('政','国政汇总','核对钱粮、委任与工程总况','office-report'),task('册','查阅簿册','查阅全国内政、州郡与各项簿册','domestic-register'),task('奏','协调本旬呈奏','按事项召见主管部门办理','petition')];
 if(id==='revenue-minister')return [task('仓','察看钱粮','查看各州粮食产出、粮赋与工商银税','atlas-grain'),task('粮','粮食购买','向盟国购买现有粮食，银粮双方入账','food-purchase'),task('惠','中央补助','支用国库改善各州百姓生活','subsidy'),task('赋','核定赋税','逐州调整后续税率','tax'),task('籍','招纳流民入籍','全国办理，预览费用、新增人口与后续收支','census')];
 if(id==='rites-minister')return [task('邦','展图通邦','世界图选国、核阅国约与颁发国书','diplomacy'),task('祀','祭祀祈福','查阅既有祈福典礼与礼部精册','register')];
 if(id==='justice-minister')return [task('查','设置调查经费','','justice-funding'),task('断','审理待决案件','','justice'),task('狱','在押案件裁决','','justice-sentence'),task('赦','特赦','','justice-amnesty')];
 if(id==='personnel-minister')return [task('任','官职任命','','personnel'),task('赏','加官封爵','','personnel-honor'),task('遣','官员外调','','personnel-dismiss'),task('治','地方治理','','personnel-delegate'),task('银','治理预算','','personnel-budget'),task('举','开科求贤','','personnel-exam'),task('学','翰林院研习','','personnel-hanlin')];
 if(id==='works-minister')return [task('建','普通营建','','works-buildings'),task('田','产业开发','','works-develop'),task('城','城州扩建','','works-expand'),task('役','征调民夫','','works-levy-militia'),task('归','遣散民夫','','works-release-militia'),task('工','特殊工程','','works-special'),task('调','施工调度','','works-schedule'),task('册','工程记录','','works-records')];
 if(id==='central-general')return [task('训','训练与卫戍','中央训练、长期计划和京城守备','register'),task('册','查阅军务汇总','只读核对兵籍和训练总况','office-report')];
 if(id==='war-minister')return [
  task('兵','点检各营','','garrison',{category:'军情查阅'}),task('谍','秘谍','排查待命官员，派遣谍报或召回','espionage',{category:'军情查阅'}),
  task('募','募兵入营','','garrison-recruit',{category:'兵员管理'}),task('遣','遣兵还乡','','garrison-dismiss',{category:'兵员管理'}),
  task('备','采办军装','按真实驻地采办完整装备','garrison-purchase',{category:'军备调度'}),task('调','兵装调动','','garrison-transfer',{category:'军备调度'}),
  task('阵','点将布阵','边境图选敌，点将配装出征','campaign',{category:'征战整军'}),task('复','战后恢复','优先整军，实付补员、兵装与训练费用','army-recovery',{category:'征战整军'})
 ];
 return [task('议',id==='personnel-minister'?'选贤任能':id==='justice-minister'?'察吏断狱':'通使邻邦',id==='personnel-minister'?'考察官员、任命与科举':id==='justice-minister'?'查阅案情，决定调查与处置':'颁发国书，筹备接见外臣','register'),task('图','察看山河','查阅各州实情','atlas-grain')];
}
export function openCourtAudience(s,root,officeId,onNavigate,onClose){
 const office=CENTRAL_OFFICES.find(o=>o.id===officeId);if(!office)return;
 const person=courtSpeaker(s,officeId),art=person?officialArt(person):null,d=dialog(root,'court-audience',`${office.name}奏事`,onClose),tasks=officeTasks(officeId).filter(t=>canOfficeNavigate(officeId,t.action));
 const matching=courtAgenda(s).find(a=>a.office===officeId),summary=matching?.summary??'臣已将本部事务备齐，请陛下垂询。';
 d.innerHTML=`<button class="court-dialog-close" data-court-close aria-label="返回朝堂">收起 ×</button><figure class="court-audience-person">${art?`<img src="${esc(art.full??art.court??art.avatar)}" alt="${esc(person.name)}" draggable="false">`:'<span class="acting-seal">署 理</span>'}<figcaption>${esc(office.department)} · ${esc(office.name)}</figcaption></figure><section class="court-audience-copy"><small class="court-kicker">宣政殿 · 召见</small><h1>${esc(person?.name??'署理官候旨')}<small>${esc(office.name)}</small></h1><blockquote>“${esc(summary)}”</blockquote><div class="court-audience-tasks">${tasks.map((t,i)=>`${t.category&&t.category!==tasks[i-1]?.category?`<h3 class="court-task-category">${esc(t.category)}</h3>`:officeId==='revenue-minister'&&i===0?'<h3>办理事项</h3>':''}<button data-court-task="${i}" data-court-action="${t.action}"><span>${t.icon}</span><div><strong>${t.title}</strong><small>${t.note}</small></div><b>↗</b></button>`).join('')}</div><p class="court-reading-note">听奏、查阅不耗行动；颁旨后依原规则消耗体力、健康与快乐。</p></section>`;
 d.querySelector('[data-court-close]').onclick=()=>d.close();
 d.querySelectorAll('[data-court-task]').forEach(b=>b.onclick=()=>closeThen(d,()=>onNavigate(tasks[Number(b.dataset.courtTask)].action,{office:officeId})));
 if(['personnel-minister','personnel-deputy'].includes(officeId)){d.classList.add('personnel-audience');d.querySelector('.court-reading-note').remove();d.querySelector('blockquote').remove();}
 if(['war-minister','war-deputy'].includes(officeId)){d.classList.add('military-audience');d.querySelector('blockquote').remove();d.querySelector('.court-reading-note').remove();d.querySelector('[data-court-close]').textContent='关闭 ×';}
 if(officeId==='works-minister'){d.classList.add('works-audience');d.querySelector('blockquote').remove();d.querySelector('.court-reading-note').remove();}
 if(['justice-minister','justice-deputy'].includes(officeId)){d.classList.add('justice-audience');d.querySelector('blockquote').remove();d.querySelector('.court-reading-note').remove();}
 d.showModal();return d;
}
export function openCourtPetition(s,root,id,onNavigate,onClose,onCommit,{archived=false}={}){
 const a=(archived?rawCourtAgenda(s,{limit:Infinity}):allCourtAgenda(s)).find(a=>a.id===id);if(!a)return;
 if(a.id==='justice')return openCourtJustice(s,root,onCommit,onClose,{view:'investigate'});
 const person=courtSpeaker(s,a.office),d=dialog(root,'court-petition',a.title,onClose);
 const category=a.id.split(':')[0],note=({capital:'须先处理朝廷去留，不能直接办结收折。',war:'军情须先处理；留待再议不会消除来敌。',deficit:'收折不改变财政；国库降至不足一旬或新增欠债时另报。',works:'正常施工进度可在州图查阅，新的停工和竣工另报。','works-complete':'竣工复奏可收起，实际建筑与次旬启用不受影响。',special:'日常进度可在长工程御案查阅，新的停工、分段完工和竣工另报。','special-complete':'竣工复奏可收起，工程仍按实际启用旬生效。',governance:'收折不会撤回地方委任；同一暂缓不反复催奏，处置情况变化时再报。','diplomatic-receipt':'收起本次复奏不改变国约或已入账款项；后续异常履约另报。','military-result':'收起战报不改变战果、伤亡或归营；新的战后结果另报。'})[category]??'收折只整理御案，不消除灾情或缺粮；缺粮下旬、灾情发生变化时会再报。';
 d.classList.add('petition-redesign','petition-folded');d.dataset.urgent=String(Boolean(a.urgent));
 d.innerHTML=`<section><header class="petition-heading"><div class="petition-meta"><small class="court-kicker">${a.urgent?'急奏 · 即刻呈阅':'本旬奏事 · 御前呈阅'}</small><span>第${petitionText(s.turn)}旬</span></div><h1>${esc(a.title)}</h1><span class="petition-seal" aria-label="${petitionSeal(a)}奏折">${petitionSeal(a)}</span><div class="petition-office"><span>${esc(CENTRAL_OFFICES.find(o=>o.id===a.office).name)}</span><i></i><small>谨具奏闻 · 伏候圣裁</small></div></header><article class="petition-document"><p class="petition-salute">臣${esc(person?.name??'署理官')}谨奏</p><p class="petition-fact">${petitionText(a.summary)}</p><p class="petition-signature">为此谨奏<br>伏乞圣鉴<br><span>第${petitionText(s.turn)}旬　具奏</span></p></article></section><footer class="petition-review"><div class="petition-review-label"><span>御 批</span><small>请陛下裁定</small></div><div class="petition-decisions"><button class="court-vermilion" data-court-follow>${['capital','war'].includes(a.id)||a.action==='register'?'召兵部议事':a.action==='tax'?'传户部核定赋税':a.action==='personnel-delegate'?(a.id.startsWith('local-vacancy:')?'核阅地方官职与授权':'核阅地方治理与授权'):a.action==='diplomacy'?'展开国图，核查履约':a.action==='special'?'核查长工程御案':a.action==='garrison'?'移驾军营，点检兵装':'铺开舆图，亲察此事'} <span>→</span></button><button data-court-defer>留待再议</button>${['capital','war'].includes(a.id)?'':'<button data-court-archive>已阅，收起此折</button>'}</div><small class="court-reading-note">${esc(note)}<span data-court-archive-error role="status"></span></small></footer>`;
 if(archived){
  d.querySelector('.petition-decisions').innerHTML='<button data-petition-return>收起奏折，返回簿册</button>';
  d.querySelector('.court-reading-note').textContent='此折已收存，查阅不改变处置情况。';
  d.querySelector('[data-petition-return]').onclick=()=>d.close();
  d.showModal();return d;
 }
 d.querySelector('[data-court-defer]').onclick=()=>d.close();
 d.querySelector('[data-court-archive]')?.addEventListener('click',()=>{try{archivePetition(s,a,globalThis.localStorage);d.close();}catch(e){d.querySelector('[data-court-archive-error]').textContent=e.message;}});
 if(a.action==='local-petition'){
  const decisions=d.querySelector('.petition-decisions');
  decisions.innerHTML=`<button class="court-vermilion" data-local-approve>${a.requestKind==='military'?'御批：复验并执行军务':'御批：拨银并复验开工'}</button><button data-local-reject>御批：驳回</button><button data-local-later>留待再议</button>`;
  d.querySelector('.court-reading-note').textContent='此为皇帝专项批复。条件不足时保留暂缓，不扣款；尚书与宰相不代行批准。';
  const status=document.createElement('p');status.setAttribute('role','status');decisions.after(status);
  d.querySelector('[data-local-later]').onclick=()=>d.close();
  for(const [selector,approve] of [['[data-local-approve]',true],['[data-local-reject]',false]])d.querySelector(selector).onclick=()=>{try{if(!onCommit)throw Error('当前查阅入口不支持御批');const result=(a.requestKind==='military'?decideLocalMilitaryPetition:decideLocalPetition)(s,{id:a.requestId,approve});if(onCommit(result.state)===false)throw Error('批复未保存，请重试');d.close();}catch(error){status.textContent=error.message;}};
  d.showModal();return d;
 }
 d.querySelector('[data-court-follow]').onclick=()=>closeThen(d,()=>onNavigate(a.action,{office:a.office,provinceId:a.provinceId,countryId:a.countryId}));d.showModal();return d;
}
export function openCourtRoster(s,root,onSelect,onClose){
 const d=dialog(root,'court-summons','传召群臣',onClose);
 d.innerHTML=`<header><small class="court-kicker">殿前传旨</small><h1>陛下欲召见何人？</h1><button class="court-dialog-close" data-court-close aria-label="收起传召">收起 ×</button></header><div class="court-summons-people">${CENTRAL_OFFICES.map(o=>{const p=courtSpeaker(s,o.id),art=p?officialArt(p):null;return `<button data-court-summon="${o.id}">${art?`<img src="${esc(art.avatar)}" alt="" loading="lazy">`:'<span>署</span>'}<strong>${esc(p?.name??'署理')}</strong><small>${o.name}</small></button>`;}).join('')}</div>`;
 d.querySelector('[data-court-close]').onclick=()=>d.close();d.querySelectorAll('[data-court-summon]').forEach(b=>b.onclick=()=>closeThen(d,()=>onSelect(b.dataset.courtSummon)));d.showModal();return d;
}

export function restoreCourtPetitions(s,root,onClose){const d=dialog(root,'court-petition','已收奏折',onClose),hidden=readArchived(s,globalThis.localStorage),items=rawCourtAgenda(s,{limit:Infinity}).filter(a=>hidden.includes(a.archiveKey));d.innerHTML=`<button class="court-dialog-close" data-court-close>关闭 ×</button><section><h1>已收奏折</h1>${items.map(a=>`<button class="petition-archive-entry" data-petition-read="${esc(a.id)}"><strong>${esc(a.title)}</strong><span>${esc(a.summary)}</span></button>`).join('')||'<p>此前收起的事项已变化或不再需要呈报。</p>'}<button data-court-restore-all>重新放回御案</button><p data-court-restore-error role="status"></p></section>`;d.querySelector('[data-court-close]').onclick=()=>d.close();d.querySelectorAll('[data-petition-read]').forEach(b=>b.onclick=()=>closeThen(d,()=>openCourtPetition(s,root,b.dataset.petitionRead,undefined,()=>restoreCourtPetitions(s,root,onClose),undefined,{archived:true})));d.querySelector('[data-court-restore-all]').onclick=()=>{try{restorePetitions(s,globalThis.localStorage);d.close();}catch(e){d.querySelector('[data-court-restore-error]').textContent=e.message;}};d.showModal();return d;}

export function openAllCourtPetitions(s,root,onNavigate,onClose,onCommit){const d=dialog(root,'court-pending-list','全部待办',onClose);d.innerHTML=`<header><h1>全部待办</h1><button data-list-close aria-label="关闭待办">×</button></header><div>${allCourtAgenda(s).map(a=>`<button data-list-petition="${esc(a.id)}"><strong>${esc(a.title)}</strong><span>${esc(a.summary)}</span></button>`).join('')}</div>`;d.querySelector('[data-list-close]').onclick=()=>d.close();d.querySelectorAll('[data-list-petition]').forEach(b=>b.onclick=()=>closeThen(d,()=>openCourtPetition(s,root,b.dataset.listPetition,onNavigate,onClose,onCommit)));d.showModal();return d;}
