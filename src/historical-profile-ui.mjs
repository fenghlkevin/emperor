import {GROWTH_KEYS,GROWTH_LABELS,abilityCap} from './official-growth.mjs';
import {officialArt,officialAvatar} from './official-art.mjs';
import {PRISON_PERSONALITIES} from './personality-rules.mjs';
import {ACTIVE_HISTORICAL_PEOPLE as HISTORICAL_PEOPLE} from './exam.mjs';
const esc=s=>String(s??'—').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function historicalProfile(person){return HISTORICAL_PEOPLE.find(p=>p.id===(person.id?.replace(/^recruit-/,'')))??null;}
export function profileButton(person){const source=historicalProfile(person);const avatar=officialAvatar(person);return source||avatar?`<button type="button" class="profile-name" data-profile="${esc(source?.id??person.id)}">${avatar?`<img class="official-avatar" src="${avatar}" alt="" loading="lazy">`:""}${esc(person.name)} <small>简介</small></button>`:esc(person.name);}
export function openHistoricalProfile(id,root,person=null){const historical=HISTORICAL_PEOPLE.find(p=>p.id===id);const p=person?{...historical,...person}:historical;if(!p)return;const art=officialArt(p);const modal=document.createElement('dialog');modal.className='historical-profile-dialog governance-dialog profile-scroll';modal.setAttribute('aria-label',`${p.name}人物简介`);
 const attributes=[['intelligence','智力'],['martial','武力'],['leadership','统率'],['politics','政务'],['integrity','清廉']];
 const traits=[...(p.characterTraits??[]),PRISON_PERSONALITIES[p.personality]?.name].filter(Boolean);
 const identity=[p.dynasty,p.role].filter(Boolean).join(' · ');
 const biography=p.biography??(p.generated?'经制举入仕的本朝人才。':`${p.name}，本朝官员${p.office&&p.office!=='待命'?'，现任'+p.office:''}。`);
 modal.innerHTML=`<header class="governance-header"><h2>${esc(p.name)} · 人物档案</h2><button class="close" aria-label="关闭人物简介">关闭 ×</button></header>${art?.full?`<figure class="official-identity-art"><img class="beauty-preview-trigger" src="${esc(art.full)}" alt="${esc(p.name)}全身立绘" role="button" tabindex="0" aria-label="查看${esc(p.name)}的完整立绘" title="点击查看完整立绘"><figcaption><strong>${esc(p.name)}</strong>${identity?`<span>${esc(identity)}</span>`:''}${p.office?`<span>${esc(p.office)}</span>`:''}</figcaption></figure>`:''}<dl class="profile-current-info">${[['年龄',p.age==null?null:p.age+'岁'],['经验',p.experience],['忠诚',p.loyalty==null?null:p.loyalty+'%']].filter(([,value])=>value!=null).map(([label,value])=>`<div><dt>${label}</dt><dd>${esc(value)}</dd></div>`).join('')}</dl><section class="profile-abilities"><h3>人物能力 <small>当前 / 成长上限</small></h3><dl class="profile-scores" data-personal-caps>${attributes.map(([key,label])=>`<div><dt>${label}</dt><dd>${esc(p[key]??'—')} <small>/ ${abilityCap(person??p,key)}</small></dd><meter min="0" max="100" value="${Number.isFinite(p[key])?p[key]:0}" aria-label="${label}"></meter></div>`).join('')}</dl></section><section class="profile-story"><h3>人物简介</h3><p class="profile-biography">${esc(biography)}</p></section>${traits.length?`<section class="profile-character"><h3>人物性格</h3><p class="profile-tags">${traits.map(t=>`<span>${esc(t)}</span>`).join('')}</p>${p.personalityBasis?`<p>${esc(p.personalityBasis)}</p>`:''}</section>`:''}${p.tags?.length?`<p class="profile-features">${p.tags.map(esc).join(' · ')}</p>`:''}`;
 const body=document.createElement('div');body.className='official-profile-layout';
 const copy=document.createElement('section');copy.className='official-profile-copy';copy.setAttribute('aria-label','人物资料');
 const figure=modal.querySelector('.official-identity-art');
 if(figure)body.append(figure);
 for(const child of [...modal.children]){if(child.tagName!=='HEADER'&&child!==body)copy.append(child);}
 body.append(copy);modal.append(body);
 const portrait=modal.querySelector('.official-identity-art>img');
 let preview=null;
 const openPortrait=()=>{
  if(preview?.open)return;
  preview=document.createElement('dialog');preview.className='beauty-preview official-portrait-preview';
  preview.setAttribute('aria-label',`${p.name} · 立绘预览`);
  preview.innerHTML='<button type="button" class="beauty-preview-close" aria-label="关闭立绘预览" autofocus>×</button><figure><img><figcaption></figcaption></figure>';
  const image=preview.querySelector('img');image.src=art.full;image.alt=`${p.name}全身立绘`;
  preview.querySelector('figcaption').textContent=p.name;
  preview.querySelector('button').onclick=()=>preview.close();
  preview.onclick=event=>{if(event.target===preview)preview.close();};
  preview.addEventListener('close',()=>{preview.remove();preview=null;if(portrait.isConnected&&modal.open)portrait.focus();},{once:true});
  document.body.append(preview);preview.showModal();
 };
 if(portrait){
  portrait.onclick=openPortrait;
  portrait.onkeydown=event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();event.stopPropagation();openPortrait();}};
 }
 root.append(modal);modal.querySelector('.close').onclick=()=>modal.close();modal.onclose=()=>{preview?.close();modal.remove();};modal.showModal();return modal;
}
export function profilesTable({query='',role='all',page=0}={}){
 const rows=HISTORICAL_PEOPLE.filter(p=>(role==='all'||p.role===role)&&`${p.name} ${p.dynasty} ${p.tags.join(' ')}`.includes(query));
 const pages=Math.max(1,Math.ceil(rows.length/25));page=Math.min(page,pages-1);
 return {page,pages,html:`<h2>历代人物名册</h2><p>智力评估谋略与学识，武力只表示个人武勇；统率与政务单独列出。点姓名查看简介及依据。每人保存独立属性与逐项史事依据；资料有限处按本人记录保守设计。</p><div class="profiles-filter"><label>查找人物、朝代或特点<input data-profile-search value="${esc(query)}" placeholder="如：岳飞、宋、奸臣"></label><label>文武类型<select data-profile-role>${[['all','全部'],['文职','文职'],['武将','武将']].map(([id,label])=>`<option value="${id}" ${role===id?'selected':''}>${label}</option>`).join('')}</select></label></div><p>共 ${rows.length} 人</p><div class="civil-table report-table"><table><thead><tr><th>人物</th><th>朝代</th><th>类型</th><th>特点 / 性格</th><th>智力</th><th>武力</th><th>统率</th><th>政务</th><th>清廉</th><th>评定方式</th></tr></thead><tbody>${rows.slice(page*25,page*25+25).map(p=>`<tr><th>${profileButton(p)}</th><td>${esc(p.dynasty)}</td><td>${esc(p.role)}</td><td>${esc(p.tags.join('、'))}<br><small>${esc(p.characterTraits?.join('、')??'未录')}</small></td>${['intelligence','martial','leadership','politics','integrity'].map(k=>`<td>${p[k]}</td>`).join('')}<td>${esc(p.ratingMethod??p.ratingStatus)}</td></tr>`).join('')||'<tr><td colspan="10">未找到人物</td></tr>'}</tbody></table></div><div class="personnel-pagination"><button data-profile-prev ${page===0?'disabled':''}>上页</button><span>${page+1} / ${pages}</span><button data-profile-next ${page+1>=pages?'disabled':''}>下页</button></div>`};
}
