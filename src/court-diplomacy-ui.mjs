import {openRitesHelp} from './rites-help-ui.mjs';
import {commitOperation} from './operation-result.mjs';
import {fitMapLabels} from './map-labels.mjs';
import {courtDiplomaticFeedback} from './court-diplomatic-feedback.mjs';
import {atlasBase,atlasTone,atlasBorders} from './atlas-base.mjs';
import {CAMPAIGN_VIEW} from './domestic.mjs';
import {provinceGeometry,realmGeometry,territoryPath} from './campaign-map.mjs';
import {relationBetween,treatyLabel} from './diplomacy.mjs';
import {inviteEnvoy,arrivedEnvoy} from './envoy-visits.mjs';
import {courtBlock} from './emperor.mjs';
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const mapScopes={world:['天下',CAMPAIGN_VIEW],east:['东亚',[91,-80,89,65]],west:['西方',[-20,-78,105,118]],south:['南海',[89,-25,48,27]]};
// Expand the geographic window to the map panel, keeping a uniform scale.
// A fixed 162:66 clip inside a tall panel cuts northern land across its middle.
export function diplomaticViewport(scope,width,height){
 const [x,y,w,h]=mapScopes[scope][1];
 const ratio=width/height;
 if(!Number.isFinite(ratio)||ratio<=0)return [x,y,w,h];
 const fitW=Math.max(w,h*ratio),fitH=Math.max(h,w/ratio);
 return [x-(fitW-w)/2,y-(fitH-h)/2,fitW,fitH];
}
export function fitDiplomaticMap(svg,scope){
 if(!svg)return;const box=svg.getBoundingClientRect(),view=diplomaticViewport(scope,box.width,box.height);
 svg.setAttribute('viewBox',view.join(' '));
 for(const rect of svg.querySelectorAll('[data-diplomatic-viewport],[data-diplomatic-sea]'))
  ['x','y','width','height'].forEach((key,i)=>rect.setAttribute(key,String(view[i])));
}
export function diplomaticMap(domestic,selected,scope='world'){
 const view=mapScopes[scope][1];
 const regions=[...realmGeometry.map(r=>({...r,owner:domestic.provinces.find(p=>p.id===r.id+'-core')?.countryId,foreign:true})),...provinceGeometry.map(r=>({...r,owner:domestic.provinces.find(p=>p.id===r.id)?.countryId}))];
 const attrs=r=>`data-diplomatic-country="${esc(r.owner)}" class="diplomatic-territory ${r.owner===selected?'is-selected':''} ${r.owner===domestic.playerCountryId?'is-home':''}" tabindex="${r.owner&&r.owner!==domestic.playerCountryId?0:-1}" role="button" aria-pressed="${r.owner===selected}" aria-label="${esc(domestic.countries.find(c=>c.id===r.owner)?.name??r.name)}"`;
 return `<svg class="diplomatic-map" viewBox="${mapScopes[scope][1].join(' ')}" aria-label="通邦世界图"><defs><clipPath id="diplomatic-viewport"><rect data-diplomatic-viewport x="${view[0]}" y="${view[1]}" width="${view[2]}" height="${view[3]}"/></clipPath></defs><g clip-path="url(#diplomatic-viewport)">${atlasBase('diplomatic',{diplomatic:true,domestic})}<g clip-path="url(#diplomatic-land)">${regions.map(r=>`<path ${atlasTone(r)} ${attrs(r)} ${r.foreign?'mask="url(#diplomatic-foreign)"':''} d="${territoryPath(r)}"/>`).join('')}</g>${atlasBorders('diplomatic',domestic)}${[...realmGeometry.map(r=>({...r,owner:domestic.provinces.find(p=>p.id===r.id+'-core')?.countryId})),{name:domestic.countries.find(c=>c.id===domestic.playerCountryId).name,center:[108,34],owner:domestic.playerCountryId}].map(r=>`<text x="${r.center[0]}" y="${-r.center[1]}" ${attrs(r)}>${esc(r.name)}</text>`).join('')}</g></svg>`;
}
export function openCourtDiplomacy(initial,root,onCommit,onClose,options={}){
 let state=initial,selected=options.countryId??initial.envoyVisit?.countryId??initial.domestic.countries.find(c=>c.id!==initial.domestic.playerCountryId&&c.provinceIds.length)?.id,stage='draft',error='',busy=false,scope='world';
 const d=document.createElement('dialog');d.className='court-play-dialog court-atlas court-diplomacy rites-diplomacy';d.setAttribute('aria-label','礼部通邦舆图');root.append(d);const resize=()=>{const svg=d.querySelector('svg');fitDiplomaticMap(svg,scope);fitMapLabels(svg,'.diplomatic-map text',el=>el.dataset.diplomaticCountry===selected?2:el.dataset.diplomaticCountry===state.domestic.playerCountryId?1:0);};window.addEventListener('resize',resize);d.onclose=()=>{window.removeEventListener('resize',resize);d.remove();onClose?.();};
 function draw(){
 const country=state.domestic.countries.find(c=>c.id===selected),r=country&&relationBetween(state.domestic,state.domestic.playerCountryId,selected),v=state.envoyVisit,visitor=v&&state.domestic.countries.find(c=>c.id===v.countryId),arrived=arrivedEnvoy(state);
 let detail=country?`<div class="rites-heading"><h2>${esc(country.name)}</h2><button data-diplomatic-help aria-label="通邦规则说明">？</button></div><dl class="rites-facts"><div><dt>两国关系</dt><dd>${esc(treatyLabel(r,state.domestic.playerCountryId))}</dd></div><div><dt>友善</dt><dd>${r.friendship} / 100</dd></div><div><dt>出口额度</dt><dd>${r.agreement.exports} 两 / 旬</dd></div><div><dt>进口额度</dt><dd>${r.agreement.imports} 两 / 旬</dd></div><div><dt>岁贡</dt><dd>${r.agreement.tribute} 两 / 年</dd></div></dl>`:'<h2>暂无可通使国家</h2>';
 let controls=v?`<p class="atlas-confirm-risk">${esc(visitor.name)}使臣${arrived?'已抵京；退朝后可于礼明殿接见。':`将在第${v.arrivalTurn}旬抵京，尚不能会面。`}</p>${arrived?'<button class="court-vermilion" data-diplomatic-meet>退朝，前往接见 →</button>':'<button disabled>国书行程已登记</button>'}`:`<button class="court-vermilion" data-diplomatic-review ${country?'':'disabled'}>拟定国书 →</button>`;
 if(stage==='confirm'){detail=`<small class="court-kicker">礼部国书</small><h2>邀${esc(country.name)}入觐</h2><p>请贵国遣使，于第${state.turn+1}旬入京。届时于礼明殿核议盟约、互市、和亲与岁贡。</p><button data-diplomatic-help aria-label="国书规则说明">？</button>`;controls='<p class="atlas-confirm-risk">国书确认</p><div class="personnel-seal-actions"><button data-diplomatic-edit>再斟酌</button><button class="court-vermilion" data-diplomatic-seal>落印发出</button></div>';}
 if(stage==='receipt')detail=`<small class="court-kicker">已登记真实行程</small><h2>国书已发</h2><p>${esc(visitor.name)}使臣将于第${v.arrivalTurn}旬抵京。国库 ${state.stats.treasury.toLocaleString()} 两，现行国约保持。</p><p>退朝后结束本旬，等待抵京再会面。</p>`;
 d.innerHTML=`<header class="atlas-header"><h1>展图通邦</h1><button class="court-dialog-close" data-diplomatic-close aria-label="返回朝堂">关闭 ×</button><span class="atlas-court-status">第${state.turn}旬 · 国库 ${state.stats.treasury.toLocaleString()} 两</span></header><div class="atlas-layout rites-layout"><section class="atlas-paper rites-map-paper"><div class="diplomatic-header-controls"><select data-map-scope aria-label="地图范围">${Object.entries(mapScopes).map(([id,[name]])=>`<option value="${id}" ${scope===id?'selected':''}>${name}</option>`).join('')}</select><select data-country-picker aria-label="通使国家" ${stage==='confirm'?'disabled':''}>${state.domestic.countries.filter(c=>c.id!==state.domestic.playerCountryId&&c.provinceIds.length).map(c=>`<option value="${c.id}" ${selected===c.id?'selected':''}>${esc(c.name)}</option>`).join('')}</select></div><div class="diplomatic-map-frame">${diplomaticMap(state.domestic,selected,scope)}</div></section><aside class="rites-operation"><div class="personnel-scene-detail">${detail}</div><footer class="rites-decision personnel-decision">${controls}<p data-diplomatic-error role="status">${esc(error)}</p></footer></aside></div>`;
 d.querySelector('[data-diplomatic-help]')?.addEventListener('click',()=>openRitesHelp(root,'通邦与国书','点选疆域、国名或选择国家查看国约。金色为本国，朱色为所选国家。颁发国书只邀请使臣，不改变条约、友善和国库；使臣下旬抵京，退朝后前往礼明殿会面。已有行程时不能另邀。颁发国书消耗1体力、2健康、3快乐。岁贡付款方：'+(r?.agreement.payerId?state.domestic.countries.find(c=>c.id===r.agreement.payerId)?.name:'无')+'。和亲：'+(r?.agreement.marriages.map(m=>m.name).join('、')||'无')+'。'+courtDiplomaticFeedback(state).filter(f=>f.countryId===selected).map(f=>`第${f.turn}旬：${f.summary}`).join('；')));
 d.querySelector('[data-map-scope]').onchange=e=>{scope=e.target.value;draw();};
 d.querySelector('[data-country-picker]').onchange=e=>{selected=e.target.value;stage='draft';error='';draw();};
 requestAnimationFrame(resize);
 d.querySelector('[data-diplomatic-close]').onclick=()=>d.close();
 d.querySelectorAll('[data-diplomatic-country]').forEach(b=>{const choose=()=>{if(stage==='confirm'||!state.domestic.countries.some(c=>c.id===b.dataset.diplomaticCountry&&c.id!==state.domestic.playerCountryId&&c.provinceIds.length))return;selected=b.dataset.diplomaticCountry;stage='draft';error='';draw();};b.onclick=choose;b.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();choose();}};});
 d.querySelector('[data-diplomatic-review]')?.addEventListener('click',()=>{const reason=courtBlock(state);if(reason){d.querySelector('[data-diplomatic-error]').textContent=reason;return;}stage='confirm';draw();});
 d.querySelector('[data-diplomatic-edit]')?.addEventListener('click',()=>{stage='draft';error='';draw();});
 d.querySelector('[data-diplomatic-seal]')?.addEventListener('click',()=>{if(busy||stage!=='confirm')return;busy=true;try{const next=inviteEnvoy(state,selected);state=commitOperation(onCommit,next)??next;d.close();}catch(e){error=e.message;d.querySelector('[data-diplomatic-error]').textContent=error;}finally{busy=false;}});
 d.querySelector('[data-diplomatic-meet]')?.addEventListener('click',()=>{window.removeEventListener('resize',resize);d.onclose=()=>d.remove();d.close();d.remove();options.onMeet?.();});
 }
 draw();d.showModal();return d;
}
