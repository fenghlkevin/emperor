import {randomBattleArt} from './card-battle-random-art.mjs';
import {battleDefinitionArt} from './card-battle-person-art.mjs';
import {personPresentation,personMotifMarkup} from './card-battle-person-presentations.mjs';
import {landmarkArt} from './card-battle-landmark-art.mjs';
import {secretArt} from './card-battle-secret-art.mjs';
import {weaponArt} from './card-battle-weapon-art.mjs';
import {battleDeckView} from './card-battle-deck.mjs';
import {applyCardArt} from './card-battle-art.mjs';
import {OFFICIAL_ART} from './official-art.mjs';
import {cardRegionalArt} from './card-battle-cultures.mjs';
import {TROOP_KITS} from './troop-kits.mjs';
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const labels={troop:'部队',general:'人物',tactic:'计策',weapon:'武器',secret:'奥秘',landmark:'地标'};
export function openBattleDeck(b,{prebattle=false,sourceNames={}}={}){
 const d=document.createElement('dialog');d.className='cb-deck-dialog';d.setAttribute('aria-label','本场牌组');document.body.append(d);
 let filters={remaining:false,query:'',type:'',kind:'',cost:''};
 function draw(){
  const view=battleDeckView(b,filters),all=battleDeckView(b,{remaining:filters.remaining});
  d.innerHTML=`<header><div><small>军阵 · 本场牌组</small><h2>${filters.remaining?'战中剩余牌库':'战前完整构成'} · ${view.total}张</h2><p>${prebattle?'出征草案预览，落印时校验并锁定。':'本场锁定构成；剩余牌库按费用整理。'}不展示抽牌顺序。调兵令为后手额外牌，不计入30张。</p></div><button data-deck-close aria-label="关闭本场牌组">关闭 ×</button></header><nav>${prebattle?'':`<button data-deck-mode="full" aria-pressed="${!filters.remaining}">完整构成</button><button data-deck-mode="remaining" aria-pressed="${filters.remaining}">剩余牌库</button>`}<label>检索<input data-deck-query value="${esc(filters.query)}" placeholder="卡名、人物、技能" aria-label="检索本场牌组"></label><label>类型<select data-deck-type><option value="">全部类型</option>${Object.entries(labels).map(([k,n])=>`<option value="${k}" ${filters.type===k?'selected':''}>${n}</option>`).join('')}</select></label><label>兵种<select data-deck-kind><option value="">全部兵种</option>${TROOP_KITS.filter(k=>all.kinds[k.id]).map(k=>`<option value="${k.id}" ${filters.kind===k.id?'selected':''}>${esc(k.name)}</option>`).join('')}</select></label><label>费用<select data-deck-cost><option value="">全部费用</option>${Object.keys(all.curve).sort((a,b)=>a-b).map(k=>`<option value="${k}" ${filters.cost===k?'selected':''}>${k}费</option>`).join('')}</select></label></nav><section class="cb-deck-statistics"><p data-deck-counts>部队 ${view.types.troop} · 人物 ${view.types.general} · 计策 ${view.types.tactic} · 武器 ${view.types.weapon} · 奥秘 ${view.types.secret} · 地标 ${view.types.landmark} · 当前显示 ${view.rows.length}张</p><div class="cb-deck-curve" aria-label="费用分布">${Object.entries(all.curve).sort(([a],[b])=>a-b).map(([cost,n])=>`<span><i data-curve-height="${Math.max(3,n*4)}"></i><b>${cost}费</b><small>${n}张</small></span>`).join('')}</div><p>兵种构成：${Object.entries(all.kinds).map(([k,n])=>esc(TROOP_KITS.find(t=>t.id===k)?.name??k)+' '+n+'张').join(' · ')||'无部队牌'}；人物：${all.rows.filter(x=>x.type==='general').map(x=>esc(x.personName||x.name)).join('、')||'无'}</p></section><main class="cb-deck-grid">${view.rows.map(x=>{
   const personStyle=personPresentation(x.type==='general'&&x.definitionId.startsWith('person_')?x.definitionId.slice(7):null);
   const combatArt=battleDefinitionArt(x.definitionId)??(x.type==='general'&&!x.definitionId.startsWith('person_')?randomBattleArt(x.portraitId):null);
   const regional=cardRegionalArt(x.portraitId),art=combatArt?.src??regional?.src??OFFICIAL_ART[x.portraitId]?.full??OFFICIAL_ART[x.portraitId]?.avatar;
   return `<article class="cb-deck-entry ${x.type==='weapon'?'weapon':x.type==='secret'?'secret':x.type==='landmark'?'landmark':''}" data-deck-entry="${esc(x.id)}" ${personStyle?`data-person-theme="${personStyle.theme}" data-person-presentation="${personStyle.id}"`:''}><div title="${esc(x.text)}" class="cb-deck-face cb-card ${x.type==='tactic'?'tactic':x.type==='general'?'person':''}"><span class="cb-deck-cost">${x.cost}费</span><h3>${esc(x.name)}</h3><div class="cb-art troop-${esc(x.type==='weapon'?'arsenal-'+x.kind:x.kind||x.definitionId)}" ${art?`data-portrait-art="${esc(art)}"${combatArt?` data-battle-person-art="${combatArt.personId}"`:''}${regional?` data-portrait-tile="${regional.x},${regional.y}"`:''}`:''}>${x.type==='landmark'?landmarkArt(x.definitionId):x.type==='weapon'?weaponArt(x.kind):x.type==='secret'?secretArt(x.definitionId):personStyle?'<span class="cb-person-card-mark">'+personMotifMarkup(personStyle.id)+'</span>':''}</div><p>${esc(x.skill)} ${esc(x.faceText)||'普通部队'}</p>${x.attack===null?'':`<strong>${x.attack}攻 / ${x.type==='weapon'?x.durability+'耐':x.health+'命'}</strong>`}</div><p>${labels[x.type]}${x.kindName?' · '+esc(x.kindName):''}</p>${x.sourceId?`<p>来源：${esc(sourceNames[x.sourceId]??(x.sourceId==='central'?'中央禁军':x.sourceId))} · ${esc(x.sourceName)}<br>${x.type==='weapon'?'备用完整套装1人份；不额外占兵员':x.type==='landmark'?'已部署主将军阵设施；不额外占兵员或装备':x.type==='secret'?'已部署主将军阵军令；不额外占兵员或装备':x.count+'人 · 训练'+x.training+' · '+esc(x.personName)}</p>`:'<p>随本场军阵配置的计策</p>'}</article>`;
  }).join('')||'<p class="cb-deck-empty">没有符合条件的卡牌。</p>'}</main><footer>本页只读。查看、筛选与关闭均不支出兵员、装备或军粮。</footer>`;
  applyCardArt(d);for(const bar of d.querySelectorAll('[data-curve-height]'))bar.style.height=bar.dataset.curveHeight+'px';
  d.querySelector('[data-deck-close]').onclick=()=>d.close();
  for(const el of d.querySelectorAll('[data-deck-mode]'))el.onclick=()=>{filters.remaining=el.dataset.deckMode==='remaining';draw();};
  d.querySelector('[data-deck-query]').oninput=e=>{filters.query=e.target.value;const start=e.target.selectionStart;draw();const input=d.querySelector('[data-deck-query]');input.focus();input.setSelectionRange(start,start);};
  for(const key of ['type','kind','cost'])d.querySelector('[data-deck-'+key+']').onchange=e=>{filters[key]=e.target.value;draw();d.querySelector('[data-deck-'+key+']').focus();};
 }
 d.addEventListener('close',()=>d.remove(),{once:true});draw();d.showModal();d.querySelector('[data-deck-close]').focus();return d;
}
