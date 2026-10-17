import {courtAgenda,courtSpeaker,courtOverview} from './court-agenda.mjs';
import {CENTRAL_OFFICES} from './personnel.mjs';
import {officialArt} from './official-art.mjs';
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fmt=n=>n.toLocaleString('zh-CN');
export function courtDeskMarkup(s){
 const agenda=courtAgenda(s),q=courtOverview(s);
 return `<div class="court-inscription" aria-hidden="true"><span>宣 政 殿</span><small>一言定国策 · 一念系苍生</small></div><div class="court-corner"><span class="court-live-dot"></span>群臣候旨<button data-court-overview>国库 ${fmt(q.treasury)} 两 · ${q.net>=0?'盈':'缺'} ${fmt(Math.abs(q.net))}/旬</button></div><section class="court-desk" aria-label="御案"><div class="court-desk-heading"><span>御 案</span><small>本旬呈奏 · ${agenda.length}件</small><button data-court-roster aria-label="传召群臣">传召群臣 <span>↗</span></button></div><div class="court-memorials">${agenda.map((a,i)=>`<button class="court-memorial ${a.urgent?'is-urgent':''}" data-court-petition="${a.id}"><span class="memorial-number">${['壹','贰','叁'][i]}</span><span class="memorial-seal">${a.seal}</span><span class="memorial-title">${esc(a.title)}</span><small>${CENTRAL_OFFICES.find(o=>o.id===a.office)?.name}呈</small><span class="memorial-open">展开奏折 ↗</span></button>`).join('')}<button class="court-atlas-object" data-court-atlas><span class="atlas-fold" aria-hidden="true">山 河</span><strong>展开舆图</strong><small>察州情 · 调钱粮 · 兴营造</small></button></div><div class="court-desk-footer"><span>点殿中人物召见，或展开案上奏折</span><button id="next" class="court-leave">今日退朝 <span>→</span></button></div></section>`;
}
function dialog(root,className,label,onClose){const d=document.createElement('dialog');d.className=`court-play-dialog ${className}`;d.setAttribute('aria-label',label);root.append(d);d.onclose=()=>{d.remove();onClose?.();};return d;}
function closeThen(d,fn){d.onclose=()=>d.remove();d.close();d.remove();fn();}
const task=(icon,title,note,action,extra={})=>({icon,title,note,action,...extra});
function officeTasks(id){
 if(id==='revenue-minister')return [task('仓','察看钱粮','在舆图上选州，购粮或调拨','atlas-grain'),task('赋','核定赋税','逐州调整后续税率','tax'),task('籍','整顿户籍','查阅户籍与原有财政政令','register')];
 if(id==='works-minister')return [task('建','择地营建','在州图中选建物，预览工期','atlas-build'),task('田','兴修产业','开发土地与调配职业','industry'),task('工','呈上工部簿册','查阅特殊工程与完整营建记录','register')];
 if(id==='war-minister'||id==='central-general')return [task('兵','点检各营','地图察看兵籍，发令调拨','atlas-army'),task('备','采办军装','按兵种购入完整装备','purchase'),task('令','议定军务',id==='central-general'?'训练驻军与长期练兵':'配装出征，或处置当前战事','register')];
 if(id==='prime-minister')return [task('奏','听本旬奏事','展开御案上首份奏折','petition'),task('图','察看天下','钱粮、军营与地方营建','atlas-grain'),task('政','议定国策','宗室、立储、功业与国政','register')];
 if(id.endsWith('deputy'))return [task('图','察看州情','在舆图上选州查阅','atlas-grain'),task('册','呈上簿册','查阅本部完整原始记录','register')];
 return [task('议',id==='personnel-minister'?'选贤任能':id==='justice-minister'?'察吏断狱':'通使邻邦',id==='personnel-minister'?'考察官员、任命与科举':id==='justice-minister'?'查阅案情，决定调查与处置':'颁发国书，筹备接见外臣','register'),task('图','察看山河','查阅各州实情','atlas-grain')];
}
export function openCourtAudience(s,root,officeId,onNavigate,onClose){
 const office=CENTRAL_OFFICES.find(o=>o.id===officeId);if(!office)return;
 const person=courtSpeaker(s,officeId),art=person?officialArt(person):null,d=dialog(root,'court-audience',`${office.name}奏事`,onClose),tasks=officeTasks(officeId);
 const matching=courtAgenda(s).find(a=>a.office===officeId),summary=matching?.summary??'臣已将本部事务备齐，请陛下垂询。';
 d.innerHTML=`<button class="court-dialog-close" data-court-close aria-label="返回朝堂">收起 ×</button><figure class="court-audience-person">${art?`<img src="${esc(art.full??art.court??art.avatar)}" alt="${esc(person.name)}" draggable="false">`:'<span class="acting-seal">署 理</span>'}<figcaption>${esc(office.department)} · ${esc(office.name)}</figcaption></figure><section class="court-audience-copy"><small class="court-kicker">宣政殿 · 召见</small><h1>${esc(person?.name??'署理官候旨')}<small>${esc(office.name)}</small></h1><blockquote>“${esc(summary)}”</blockquote><div class="court-audience-tasks">${tasks.map((t,i)=>`<button data-court-task="${i}" data-court-action="${t.action}"><span>${t.icon}</span><div><strong>${t.title}</strong><small>${t.note}</small></div><b>↗</b></button>`).join('')}</div><p class="court-reading-note">听奏、查阅不耗行动；颁旨后依原规则消耗体力、健康与快乐。</p></section>`;
 d.querySelector('[data-court-close]').onclick=()=>d.close();
 d.querySelectorAll('[data-court-task]').forEach(b=>b.onclick=()=>closeThen(d,()=>onNavigate(tasks[Number(b.dataset.courtTask)].action,{office:officeId})));
 d.showModal();return d;
}
export function openCourtPetition(s,root,id,onNavigate,onClose){
 const a=courtAgenda(s).find(a=>a.id===id);if(!a)return;
 const person=courtSpeaker(s,a.office),d=dialog(root,'court-petition',a.title,onClose);
 d.innerHTML=`<button class="court-dialog-close" data-court-close aria-label="收起奏折">收折 ×</button><div class="petition-binding" aria-hidden="true"></div><section><small class="court-kicker">${a.urgent?'急 奏':'本 旬 奏 事'}</small><h1>${esc(a.title)}</h1><p class="petition-salute">臣${esc(person?.name??'署理官')}谨奏</p><p class="petition-fact">${esc(a.summary)}</p><p class="petition-signature">${esc(CENTRAL_OFFICES.find(o=>o.id===a.office).name)} · 据本旬实情呈报</p><div class="petition-decisions"><button class="court-vermilion" data-court-follow>${a.action==='register'?'召兵部议事':a.action==='tax'?'传户部核定赋税':'铺开舆图，亲察此事'} <span>→</span></button><button data-court-defer>留待再议</button></div><small class="court-reading-note">留待再议不会消除风险；展开奏折本身不耗行动。</small></section>`;
 d.querySelector('[data-court-close]').onclick=d.querySelector('[data-court-defer]').onclick=()=>d.close();
 d.querySelector('[data-court-follow]').onclick=()=>closeThen(d,()=>onNavigate(a.action,{office:a.office,provinceId:a.provinceId}));d.showModal();return d;
}
export function openCourtRoster(s,root,onSelect,onClose){
 const d=dialog(root,'court-summons','传召群臣',onClose);
 d.innerHTML=`<header><small class="court-kicker">殿前传旨</small><h1>陛下欲召见何人？</h1><button class="court-dialog-close" data-court-close aria-label="收起传召">收起 ×</button></header><div class="court-summons-people">${CENTRAL_OFFICES.map(o=>{const p=courtSpeaker(s,o.id),art=p?officialArt(p):null;return `<button data-court-summon="${o.id}">${art?`<img src="${esc(art.avatar)}" alt="" loading="lazy">`:'<span>署</span>'}<strong>${esc(p?.name??'署理')}</strong><small>${o.name}</small></button>`;}).join('')}</div>`;
 d.querySelector('[data-court-close]').onclick=()=>d.close();d.querySelectorAll('[data-court-summon]').forEach(b=>b.onclick=()=>closeThen(d,()=>onSelect(b.dataset.courtSummon)));d.showModal();return d;
}
