import {officialArt,officialAvatar} from './official-art.mjs';
import {PRISON_PERSONALITIES} from './personality-rules.mjs';
import {ACTIVE_HISTORICAL_PEOPLE as HISTORICAL_PEOPLE} from './exam.mjs';
const esc=s=>String(s??'—').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function historicalProfile(person){return HISTORICAL_PEOPLE.find(p=>p.id===(person.id?.replace(/^recruit-/,'')))??null;}
export function profileButton(person){const source=historicalProfile(person);const avatar=officialAvatar(person);return source||avatar?`<button type="button" class="profile-name" data-profile="${esc(source?.id??person.id)}">${avatar?`<img class="official-avatar" src="${avatar}" alt="" loading="lazy">`:""}${esc(person.name)} <small>简介</small></button>`:esc(person.name);}
export function openHistoricalProfile(id,root,person=null){const historical=HISTORICAL_PEOPLE.find(p=>p.id===id);const p=historical??person;if(!p)return;const art=officialArt(p);const modal=document.createElement('dialog');modal.className='historical-profile-dialog';modal.setAttribute('aria-label',`${p.name}人物简介`);
 modal.innerHTML=`<header><div><small>${esc(p.dynasty)} · ${esc(p.role)}</small><h2>${esc(p.name)}</h2></div><button class="close" aria-label="关闭人物简介">×</button></header>${art?.full?`<figure class="official-identity-art"><img class="beauty-preview-trigger" src="${art.full}" alt="${esc(p.name)}全身立绘" role="button" tabindex="0" aria-label="放大查看${esc(p.name)}的立绘" title="点击放大立绘"><figcaption>${esc(p.name)}</figcaption></figure>`:""}<p class="profile-tags">${(p.tags??[]).map(esc).join(' · ')}</p><dl class="profile-scores">${[['intelligence','智力'],['martial','武力'],['leadership','统率'],['politics','政务'],['integrity','清廉']].map(([k,label])=>`<div><dt>${label}</dt><dd>${p[k]}</dd></div>`).join('')}</dl>${historical?'<h3>人物性格</h3>':'<h3>本朝新秀</h3>'}<p>${esc(p.characterTraits?.join(' · ')??'未录')} · ${esc(PRISON_PERSONALITIES[p.personality]?.name??'未录')}</p><p>${esc(p.personalityBasis??'经制举入仕的本朝人才。')}</p>${PRISON_PERSONALITIES[p.personality]?`<p>囚禁次旬起，每旬忠诚${PRISON_PERSONALITIES[p.personality].delta>=0?'+':''}${PRISON_PERSONALITIES[p.personality].delta}${PRISON_PERSONALITIES[p.personality].delta>0?`，上限${PRISON_PERSONALITIES[p.personality].ceiling}`:''}；${esc(PRISON_PERSONALITIES[p.personality].reason)}。不追溯改变已服刑的回合。</p>`:''}<h3>人物简介</h3><p class="profile-biography">${esc(p.biography??'本朝制举选出的新秀。')}</p><p class="profile-status">${historical?`${esc(p.biographyStatus)} · ${esc(p.ratingMethod??p.ratingStatus)}`:"本朝人物 · 制举新秀"}</p><div hidden class="profile-design-notes"><details><summary>属性设计依据</summary><p class="profile-basis">${esc(p.ratingBasis??"本朝新秀能力按制举规则生成，各项能力上限为历史人物对应最高值的95%。")}</p></details><p>${historical?"以上为历史表现的游戏化评定，忠诚另由本朝君臣关系决定。":"忠诚由本朝君臣关系决定，可通过任用与历练培养。"}</p>${p.source?`<p><a href="${esc(p.source)}" target="_blank" rel="noopener noreferrer">${esc(p.sourceTitle)}</a></p>`:""}</div>`;
 const body=document.createElement('div');body.className='official-profile-layout';
 const copy=document.createElement('section');copy.className='official-profile-copy';copy.setAttribute('aria-label','人物资料');
 const figure=modal.querySelector('.official-identity-art');
 if(figure)body.append(figure);
 for(const child of [...modal.children]){if(child.tagName!=='HEADER')copy.append(child);}
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
