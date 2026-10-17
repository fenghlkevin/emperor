import {governorProfile} from './governance.mjs';
import {openHistoricalProfile,historicalProfile} from './historical-profile-ui.mjs';
import {officialArt,officialAvatar} from './official-art.mjs';
import {PERSONNEL_TABS,NOBILITY,executePersonnel,servingOfficials,officeId} from './personnel-actions.mjs';
import {openPersonnelPicker} from './personnel-picker-ui.mjs';
import {officeRegister} from './personnel.mjs';
import {ACTIVE_HISTORICAL_PEOPLE as HISTORICAL_PEOPLE,historicalChance} from './exam.mjs';

const esc=s=>String(s??'—').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const titles={assign:'官职调动',dismiss:'官员外调',honor:'加官封爵',delegate:'地方委任',exam:'制举选才',profiles:'人物名册'};
const subtitles={assign:'量才授职，各尽其能。',dismiss:'审慎外调，详察去留。',honor:'加官进爵，恩赏有度。',delegate:'分治四方，安民兴业。',exam:'广开言路，择天下英才。',profiles:'历代名录，知人善任。'};
const seals={assign:'调',dismiss:'遣',honor:'赏',delegate:'任',exam:'举',profiles:'录'};
const abilities=[['intelligence','智力'],['martial','武力'],['leadership','统率'],['politics','政务'],['integrity','清廉'],['loyalty','忠诚'],['age','年龄'],['experience','经验']];
const rank=o=>o?.rank?`${10-o.rank}品`:'未授品';
const fmt=n=>n==null?'—':Number(n).toLocaleString();
const portrait=(o,large=false)=>{const src=large?officialArt(o)?.full:officialAvatar(o);return src?`<img class="${large?'pm-portrait':'pm-avatar'}" src="${esc(src)}" alt="${large?esc(o.name)+'立绘':''}" ${large?'':'loading="lazy"'}>`:'<span class="pm-avatar pm-placeholder" aria-hidden="true">人</span>';};
const scores=(o,historical=false)=>`<dl class="pm-scores">${(historical?abilities.slice(0,5):abilities).map(([k,n])=>`<div><dt>${n}</dt><dd ${k==='loyalty'&&o?.[k]!=null&&o[k]<50?'class="pm-low"':''}>${esc(o?.[k])}</dd></div>`).join('')}</dl>`;
const assignmentScores=o=>`<dl class="pm-scores">${[['politics','政务'],['leadership','统率'],['integrity','清廉'],['loyalty','忠诚']].map(([k,n])=>`<div><dt>${n}</dt><dd class="${k==='loyalty'&&o?.[k]<50?'pm-low':''}">${esc(o?.[k])}</dd></div>`).join('')}</dl><details class="pm-extra-scores"><summary>更多属性 · 智力 / 武力 / 年龄 / 经验</summary>${scores(o)}<dl class="pm-scores"><div><dt>品级</dt><dd>${rank(o)}</dd></div><div><dt>爵位</dt><dd>${NOBILITY[o?.nobilityLevel??0]}</dd></div></dl></details>`;
const personCell=(o,attribute='data-select-person',selected=false)=>o?`<button type="button" class="pm-person" ${attribute}="${esc(o.id)}" aria-pressed="${selected}">${portrait(o)}<span>${esc(o.name)}<small>${esc(o.office??o.role??o.dynasty)}</small></span></button>`:'<span class="pm-muted">虚位待贤</span>';
const table=(head,rows,cls='')=>`<div class="pm-table-wrap ${cls}"><table class="pm-table"><thead><tr>${head.map(h=>`<th scope="col">${h}</th>`).join('')}</tr></thead><tbody>${rows||`<tr><td colspan="${head.length}"><div class="pm-empty">暂无记录</div></td></tr>`}</tbody></table></div>`;

export function openPersonnelMinister(state,root,onCommit,onClose){
 const dialog=document.createElement('dialog');
 dialog.className='domestic-dialog ink-mode personnel-minister-dialog';
 dialog.setAttribute('aria-label','吏部尚书');root.append(dialog);
 dialog.onclose=()=>{dialog.remove();onClose?.();};
 let tab='assign',message='',pending=null,page=0,query='',officeScope='all',selectedOffice='',candidateId='',selectedProvince='',profileQuery='',profileRole='all',profilePage=0,selectedProfile='',honorKind='rank';
 const selections={};
 function selectedPerson(people){const o=people.find(o=>o.id===selections[tab])??people[0];selections[tab]=o?.id;return o;}
 function identity(o,label='官员详情'){
  if(!o)return '<div class="pm-empty">暂无可选官员</div>';
  return `<div class="pm-detail-heading"><small>${label}</small><h3>${esc(o.name)}</h3><p>${esc(o.office??o.dynasty??'待命')} · ${esc(o.role??rank(o))}</p></div><figure class="pm-identity">${portrait(o,true)}</figure>${['dismiss','honor'].includes(tab)?assignmentScores(o):scores(o,tab==='profiles')}<button type="button" class="pm-text-button" data-profile="${esc(historicalProfile(o)?.id??o.id)}">查看完整档案 <span aria-hidden="true">↗</span></button>`;
 }
 function peopleRoster(people,extraHeads,extraCells){return table(['官员','现任官职',...extraHeads],people.map(o=>`<tr class="${selections[tab]===o.id?'is-selected':''}"><th scope="row">${personCell(o,'data-select-person',selections[tab]===o.id)}</th><td>${esc(o.office)}</td>${extraCells(o)}</tr>`).join(''));}
 function draw(){
  const scrollTop=dialog.querySelector('.personnel-minister-body')?.scrollTop??0;
  const d=state.domestic,p=d.personnel,people=servingOfficials(d),offices=officeRegister(d);
  let main='',detail='';
  const selected=['dismiss','honor'].includes(tab)?selectedPerson(people):null;
  if(tab==='assign'){
   const filtered=offices.filter(o=>(officeScope==='all'||o.scope===officeScope)&&`${o.name} ${people.find(x=>officeId(x)===o.id)?.name??''}`.includes(query));
   const pages=Math.max(1,Math.ceil(filtered.length/14));page=Math.min(page,pages-1);
   const visible=filtered.slice(page*14,page*14+14);
   const office=offices.find(o=>o.id===selectedOffice)??visible[0]??offices[0];selectedOffice=office?.id??'';
   const incumbent=people.find(o=>officeId(o)===office?.id);
   const candidate=people.find(o=>o.id===candidateId&&officeId(o)!==office?.id);candidateId=candidate?.id??'';
   main=`<div class="pm-filters"><label>查找职位或官员<input data-search value="${esc(query)}" placeholder="官职 / 州名 / 姓名"></label><label>官职范围<select data-office-scope>${[['all','全部官职'],['central','中央官职'],['local','地方官职']].map(([id,n])=>`<option value="${id}" ${officeScope===id?'selected':''}>${n}</option>`).join('')}</select></label></div>${table(['官职','现任官员','政务','统率','忠诚'],visible.map(o=>{const person=people.find(x=>officeId(x)===o.id);return `<tr class="${office?.id===o.id?'is-selected':''}"><th scope="row"><button type="button" class="pm-office" data-pick="${esc(o.id)}" aria-pressed="${office?.id===o.id}">${esc(o.name)}<small>${esc(o.department)}</small></button></th><td>${personCell(person)}</td><td>${esc(person?.politics)}</td><td>${esc(person?.leadership)}</td><td class="${person?.loyalty<50?'pm-low':''}">${esc(person?.loyalty)}</td></tr>`;}).join(''),'appointment-table')}<div class="personnel-pagination"><span>共 ${filtered.length} 职</span><button data-prev ${page===0?'disabled':''}>上一页</button><span>${page+1} / ${pages}</span><button data-next ${page+1>=pages?'disabled':''}>下一页</button></div>`;
   detail=`<div class="pm-detail-heading"><small>第一步 · 选择职位</small><h3>${esc(office?.name??'暂无职位')}</h3><p>现任 · ${esc(incumbent?.name??'虚位待贤')}</p></div><form data-assign><input type="hidden" name="officeId" value="${esc(office?.id??'')}"><input type="hidden" name="officialId" value="${esc(candidateId)}"><div class="pm-choose-heading"><small>第二步 · 选择任职大臣</small><button type="button" data-open-picker ${people.length&&office?'':'disabled'}>${candidate?'重新选人':'打开选任名册'}</button></div>${candidate?`<figure class="pm-identity">${portrait(candidate,true)}<figcaption>${esc(candidate.name)} · ${esc(candidate.office)}</figcaption></figure>${assignmentScores(candidate)}`:'<div class="pm-assignment-empty"><span aria-hidden="true">选</span><h4>尚未选择人选</h4><p>打开名册，查找姓名、筛选待命官员，或按能力排序后选任。</p></div>'}<p class="pm-note">调任忠诚增加5，上限100；原任转为待命。</p><button class="primary" ${!candidate||!office?'disabled':''}>拟定调令</button></form>`;
  }
  if(tab==='dismiss'){
   main=peopleRoster(people,['忠诚'],o=>`<td class="${o.loyalty<50?'pm-low':''}">${o.loyalty}</td>`);
   detail=`${identity(selected,'外调奏章')}<div class="pm-warning"><strong>外调后无法返回中央</strong><p>散官外调将永久移出官员名册，请详加考虑。</p></div><button class="primary" data-dismiss="${esc(selected?.id??'')}" ${selected?'':'disabled'}>拟定外调</button>`;
  }
  if(tab==='honor'){
   main=peopleRoster(people,['品级','爵位','忠诚'],o=>`<td>${rank(o)}</td><td>${NOBILITY[o.nobilityLevel??0]}</td><td class="${o.loyalty<50?'pm-low':''}">${o.loyalty}</td>`);
   const level=selected?.[honorKind==='rank'?'rank':'nobilityLevel']??0,max=honorKind==='rank'?9:6;
   detail=`${identity(selected,'恩赏详情')}<div class="pm-segment" aria-label="恩赏类型"><button data-honor-kind="rank" aria-pressed="${honorKind==='rank'}">加官</button><button data-honor-kind="nobility" aria-pressed="${honorKind==='nobility'}">封爵</button></div><div class="pm-promotion"><small>晋升预览</small><p>${honorKind==='rank'?rank(selected):NOBILITY[level]} <span aria-hidden="true">→</span> ${level>=max?'已达最高等级':honorKind==='rank'?`${9-level}品`:NOBILITY[level+1]+'爵'}</p></div><p class="pm-note">${level>=max?'此项已达最高等级。':`赏银 ${fmt((level+1)*100)} 两 · 忠诚增加10，上限100。`}</p><button class="primary" data-honor="${honorKind}" data-id="${esc(selected?.id??'')}" ${!selected||level>=max?'disabled':''}>确认${honorKind==='rank'?'加官':'封爵'}</button>`;
  }
  if(tab==='delegate'){
   const provinces=d.provinces.filter(x=>x.countryId===d.playerCountryId),province=provinces.find(x=>x.id===selectedProvince)??provinces[0];selectedProvince=province?.id??'';
   main=`<form data-governance-budget><label>全国预算/旬 <input name="budget" type="number" min="0" max="1000000" value="${d.governance.budget}" required></label><label>国库保留线 <input name="reserve" type="number" min="0" max="1000000" value="${d.governance.reserve}" required></label><button>保存预算</button></form>`+table(['州郡','兵员','训练','在建','委任'],provinces.map(x=>`<tr class="${x.id===selectedProvince?'is-selected':''}"><th scope="row"><button class="pm-office" data-province="${esc(x.id)}" aria-pressed="${x.id===selectedProvince}">${esc(x.name)}</button></th><td>${fmt(x.population.professions.soldiers)}</td><td>${x.military.training}</td><td>${x.construction.project?'施工中':'无'}</td><td><span class="pm-badge ${p.delegations.includes(x.id)?'is-on':''}">${p.delegations.includes(x.id)?'已委任':'亲理'}</span></td></tr>`).join(''));
   detail=province?`<div class="pm-detail-heading"><small>地方详情</small><h3>${esc(province.name)}</h3><p>${p.delegations.includes(province.id)?'地方已委任 · 每旬自动治理':'尚未委任 · 由陛下亲理'}</p></div><div class="pm-province-art" aria-hidden="true"><span>治一方水土<br>安一方黎民</span></div><dl class="pm-scores"><div><dt>人口</dt><dd>${fmt(province.population.total)}</dd></div><div><dt>兵员</dt><dd>${fmt(province.population.professions.soldiers)}</dd></div><div><dt>训练</dt><dd>${province.military.training}</dd></div><div><dt>在建</dt><dd>${province.construction.project?'施工中':'无'}</dd></div></dl><p>任职治理：${esc(governorProfile(d,province).name)} · 能力${governorProfile(d,province).ability} · 清廉${governorProfile(d,province).integrity} · 损耗${Math.round(governorProfile(d,province).lossRate*100)}%</p>${province.occupation?`<p>战后治理：${province.occupation.settled?'已安定':'待安定；须任命刺史，驻军至少'+Math.ceil(province.population.total*.003)+'人'}</p>`:''}<details><summary>最近治理原因</summary>${d.governance.records.filter(r=>r.provinceId===province.id).slice(0,5).map(r=>`<p>第${r.turn}旬：${esc(r.reason)}</p>`).join('')||'尚无记录'}</details><h4>托管事项</h4><ul class="pm-rules"><li><strong>救济与建设</strong><span>缺粮优先购粮；灾时保粮停建；民生不足优先衙门、寺庙及恢复民忠的行宫，再开发农业和补齐设施。</span></li><li><strong>练兵</strong><span>训练目标80，练兵100两。</span></li></ul><p class="pm-note">全国每旬预算${fmt(state.domestic.governance.budget)}两；保留国库${fmt(state.domestic.governance.reserve)}两。优先缺粮州，清廉影响治理损耗。预算修改从下次自动治理生效。</p><button class="primary" data-delegate="${esc(province.id)}" aria-pressed="${p.delegations.includes(province.id)}">${p.delegations.includes(province.id)?'收回委任':'委任治理'}</button>`:'<div class="pm-empty">暂无本国州郡</div>';
  }
  if(tab==='exam'){
   main=`<section class="pm-exam-banner"><div><small>全国制举</small><h3>${p.examTurn!==null?'诏令已颁 · 下旬揭榜':p.candidates.length?'金榜已揭 · 恭候选用':'开科取士，广纳贤才'}</h3><p>每届 500 两 · 下旬呈报 5–15 名候选</p></div><button class="primary" data-exam ${p.examTurn!==null||p.candidates.length?'disabled':''}>${p.examTurn!==null?'筹备中':'颁布诏令'}</button></section>`;
   if(p.candidates.length)main=`<section class="pm-exam-banner"><div><small>全国制举</small><h3>候选已齐备 · 退朝后举行制举</h3><p>将自动占用一个工作阶段，消耗1点体力；可选择多人统一录用，确认后进入下一阶段。</p></div></section>`;
   detail=`<div class="pm-detail-heading"><small>制举章程</small><h3>求贤若渴</h3><p>名士与本朝新秀同榜</p></div><div class="pm-province-art" aria-hidden="true"><span>不拘一格<br>以选贤才</span></div>`;
   detail+=`<details class="pm-rule-details"><summary>制举规则</summary><p>原作名士共 ${HISTORICAL_PEOPLE.length} 人。每届500两，下旬呈报5–15名，含百家姓随机姓名的本朝新秀。皇帝魅力与智力共同影响名士出现概率，当前每个可出名士的名额概率为 ${Math.round(historicalChance(state.stats)*100)}%；每届至少一名随机新秀。随机新秀各项能力不超过原作名士对应最高值的95%。</p></details>`;
  }
  if(tab==='profiles'){
   const rows=HISTORICAL_PEOPLE.filter(o=>(profileRole==='all'||o.role===profileRole)&&`${o.name} ${o.dynasty} ${o.tags.join(' ')}`.includes(profileQuery));
   const pages=Math.max(1,Math.ceil(rows.length/25));profilePage=Math.min(profilePage,pages-1);
   const visible=rows.slice(profilePage*25,profilePage*25+25),person=visible.find(o=>o.id===selectedProfile)??visible[0];selectedProfile=person?.id??'';
   main=`<div class="pm-filters"><label>查找人物、朝代或特点<input data-profile-search value="${esc(profileQuery)}" placeholder="如：岳飞、宋、奸臣"></label><label>文武类型<select data-profile-role>${[['all','全部'],['文职','文职'],['武将','武将']].map(([id,n])=>`<option value="${id}" ${profileRole===id?'selected':''}>${n}</option>`).join('')}</select></label></div><p class="pm-catalog-count">历代人物 · 共 ${rows.length} 人</p><div class="pm-catalog">${visible.map(o=>`<button class="pm-catalog-person ${o.id===selectedProfile?'is-selected':''}" data-catalog-select="${esc(o.id)}" aria-pressed="${o.id===selectedProfile}">${portrait(o)}<span><strong>${esc(o.name)}</strong><small>${esc(o.dynasty)} · ${esc(o.role)}</small><small>${esc(o.tags.join(' · '))}</small></span></button>`).join('')||'<div class="pm-empty">未找到人物</div>'}</div><div class="personnel-pagination"><button data-profile-prev ${profilePage===0?'disabled':''}>上一页</button><span>${profilePage+1} / ${pages}</span><button data-profile-next ${profilePage+1>=pages?'disabled':''}>下一页</button></div>`;
   detail=person?`${identity(person,'人物详情')}<h4>人物简介</h4><p class="pm-biography">${esc(person.biography??'暂无简介')}</p><p class="pm-note">${esc(person.characterTraits?.join(' · ')??'性格未录')}<br>${esc(person.ratingMethod??person.ratingStatus)}</p><details class="pm-rule-details"><summary>属性说明</summary><p>智力评估谋略与学识，武力只表示个人武勇；统率与政务单独列出。每人保存独立属性与逐项史事依据；资料有限处按本人记录保守设计。完整档案可查看性格、评定依据与来源。</p></details>`:'<div class="pm-empty">未找到人物</div>';
  }
  dialog.innerHTML=`<header class="civil-header pm-header"><div class="pm-brand"><span class="pm-seal" aria-hidden="true">吏<br>部</span><h1>选贤任能</h1><small>吏部尚书 · 铨选</small></div><div class="pm-header-end"><span>国库 <b>${fmt(state.stats.treasury)}</b> 两</span><button class="close" aria-label="关闭">×</button></div></header><nav class="pm-nav" aria-label="吏部事务">${PERSONNEL_TABS.map(([id])=>`<button data-tab="${id}" ${tab===id?'aria-current="page"':''}><span aria-hidden="true">${seals[id]}</span>${titles[id]}</button>`).join('')}<button class="pm-history-trigger" data-history>吏部纪事 <span aria-hidden="true">↗</span></button><small class="pm-motto">为国选贤<br>以才佐治</small></nav><div class="personnel-minister-body"><div class="pm-page-heading"><h2>${titles[tab]}</h2><p>${subtitles[tab]}</p></div><p class="pm-status" role="status">${esc(message)}</p>${pending?`<section class="personnel-confirm" role="alert" aria-label="政令确认"><span class="pm-small-seal" aria-hidden="true">令</span><div><h3>敬奏皇上</h3><p>${esc(pending.text)}</p></div><div class="pm-confirm-actions"><button data-cancel>取消</button><button class="primary" data-confirm>确认${pending.command.kind==='dismiss'?'外调':'执行'}</button></div></section>`:''}<div class="pm-workspace"><section class="pm-main" aria-label="${titles[tab]}名册">${main}</section><aside class="pm-detail ink-scroll" aria-label="详情与操作">${detail}</aside></div><details class="pm-history"><summary>吏部纪事 · ${p.history.length} 则</summary><div>${p.history.map(x=>`<p>${esc(x)}</p>`).join('')||'<p>暂无记录</p>'}</div></details></div><footer class="civil-footer"><span>为国选贤 · 以才佐治</span><span>在朝 ${people.length} 人 · 待选 ${p.candidates.length} 人</span></footer>`;
  bind(people,offices);
  dialog.querySelector('.personnel-minister-body').scrollTop=scrollTop;
 }
 function bind(people,offices){
  const click=(selector,fn)=>dialog.querySelectorAll(selector).forEach(b=>b.onclick=()=>fn(b));
  const change=(selector,fn)=>dialog.querySelector(selector)?.addEventListener('change',fn);
  click('.close',()=>dialog.close());
  click('[data-tab]',b=>{tab=b.dataset.tab;message='';pending=null;draw();dialog.querySelector('.personnel-minister-body').scrollTop=0;dialog.querySelector(`[data-tab="${tab}"]`).focus();});
  click('[data-history]',()=>{const h=dialog.querySelector('.pm-history');h.open=!h.open;if(h.open)h.scrollIntoView({block:'nearest',behavior:'smooth'});});
  click('[data-profile]',b=>{const id=b.dataset.profile;openHistoricalProfile(id,root,people.find(o=>o.id===id)??state.domestic.personnel.candidates.find(o=>o.id===id));});
  click('[data-select-person]',b=>{if(tab==='assign'){const person=people.find(o=>o.id===b.dataset.selectPerson);if(person)openHistoricalProfile(historicalProfile(person)?.id??person.id,root,person);return;}else selections[tab]=b.dataset.selectPerson;pending=null;draw();showDetailOnSmallScreen();});
  click('[data-pick]',b=>{selectedOffice=b.dataset.pick;pending=null;draw();showDetailOnSmallScreen();});
  change('[data-search]',e=>{query=e.target.value.trim();page=0;draw();});
  change('[data-office-scope]',e=>{officeScope=e.target.value;page=0;draw();});
  click('[data-prev]',()=>{page--;draw();});click('[data-next]',()=>{page++;draw();});
  click('[data-open-picker]',()=>openPersonnelPicker({root,people,office:offices.find(o=>o.id===selectedOffice),selectedId:candidateId,onSelect:id=>{candidateId=id;pending=null;draw();showDetailOnSmallScreen();},onClose:()=>dialog.querySelector('[data-open-picker]')?.focus({preventScroll:true})}));
  dialog.querySelector('[data-assign]')?.addEventListener('submit',e=>{e.preventDefault();if(!candidateId)return;const f=new FormData(e.target),command={kind:'assign',officeId:f.get('officeId'),officialId:f.get('officialId')};selectedOffice=command.officeId;candidateId=command.officialId;pending={command,text:`任命${people.find(o=>o.id===command.officialId)?.name}为${offices.find(o=>o.id===command.officeId)?.name}，原任转为待命。`};draw();focusConfirmation();});
  click('[data-dismiss]',b=>{pending={command:{kind:'dismiss',officialId:b.dataset.dismiss},text:`${people.find(o=>o.id===b.dataset.dismiss)?.name}外调后，再也不能回中央。将永久移出官员名册，请详加考虑。`};draw();focusConfirmation();});
  click('[data-cancel]',()=>{pending=null;draw();});click('[data-confirm]',()=>run(pending.command));
  click('[data-honor-kind]',b=>{honorKind=b.dataset.honorKind;draw();});
  click('[data-honor]',b=>run({kind:'honor',officialId:b.dataset.id,honor:b.dataset.honor}));
  click('[data-province]',b=>{selectedProvince=b.dataset.province;draw();showDetailOnSmallScreen();});
  dialog.querySelector('[data-governance-budget]')?.addEventListener('submit',e=>{e.preventDefault();const f=new FormData(e.target);run({kind:'governanceBudget',budget:Number(f.get('budget')),reserve:Number(f.get('reserve'))});});
  click('[data-delegate]',b=>run({kind:'delegate',provinceId:b.dataset.delegate,enabled:!state.domestic.personnel.delegations.includes(b.dataset.delegate)}));
  click('[data-exam]',()=>run({kind:'exam'}));
  change('[data-profile-search]',e=>{profileQuery=e.target.value.trim();profilePage=0;draw();});
  change('[data-profile-role]',e=>{profileRole=e.target.value;profilePage=0;draw();});
  click('[data-profile-prev]',()=>{profilePage--;draw();});click('[data-profile-next]',()=>{profilePage++;draw();});
  click('[data-catalog-select]',b=>{selectedProfile=b.dataset.catalogSelect;draw();showDetailOnSmallScreen();});
 }
 function showDetailOnSmallScreen(){if(matchMedia('(max-width:800px)').matches)dialog.querySelector('.pm-detail')?.scrollIntoView({block:'start',behavior:'smooth'});}
 function focusConfirmation(){dialog.querySelector('[data-cancel]')?.focus();}
 function run(c){try{const result=executePersonnel(state,{...c,id:state.domestic.personnel.nextId});onCommit(result.state);state=result.state;message=result.message;pending=null;}catch(e){message=e.message;}draw();dialog.querySelector('.pm-status')?.scrollIntoView({block:'nearest'});}
 draw();dialog.showModal();return dialog;
}
