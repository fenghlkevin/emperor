import {personDeathSegments,applyDeathVisualEvent} from './card-battle-person-death-presentation.mjs';
import {randomBattleArt} from './card-battle-random-art.mjs';
import {compactPersonText} from './card-battle-person-copy.mjs';
import {battlePersonArt} from './card-battle-person-art.mjs';
import {personPresentation,personMotifMarkup} from './card-battle-person-presentations.mjs';
import {fieldOccupancy,landmarkTargets} from './card-battle-landmarks.mjs';
import {landmarkArt} from './card-battle-landmark-art.mjs';
import {canArmSecret} from './card-battle-secrets.mjs';
import {secretArt,sealedSecretArt} from './card-battle-secret-art.mjs';
import {secretZoneMarkup,secretResponseSegments,applySecretVisualEvent} from './card-battle-secret-presentation.mjs';
import {legalHeroAttacks,heroAttackPreview} from './card-battle-weapons.mjs';
import {weaponArt} from './card-battle-weapon-art.mjs';
import {createCardDrag} from './card-battle-drag.mjs';
import {cardStateEffectMarkup} from './card-battle-status-effects.mjs';
import {openCardHistory} from './card-battle-history-ui.mjs';
import {openBattleDeck} from './card-battle-deck-ui.mjs';
import {cardStatuses,statBreakdown,effectNotice} from './card-battle-status.mjs';
import {applyCardArt} from './card-battle-art.mjs';
import {createCardSkillEffects} from './card-battle-skill-effects.mjs';
import {cardRegionalArt} from './card-battle-cultures.mjs';
import {troopNames,cardAI,legalCardActions,cardDeaths,cardAttackStatus,legalCardAttacks,legalCardTargets,legalPowerTargets,cardCost,attackPreview,cardText,keywordNames,battlePerson,HISTORICAL_CARDS} from './card-battle.mjs';
import {drawCardBattle as drawLegacy} from './card-battle-ui-legacy.mjs';
import {OFFICIAL_ART,officialAvatar} from './official-art.mjs';
import {advanceWar,finishWar} from './war.mjs';
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const other=s=>s==='home'?'enemy':'home',unit=x=>x.type==='troop'||x.type==='general';

export function drawCardBattle(dialog,getState,commit,onFinish,options={}){
 if((getState().domestic.war.battle.cards.rulesVersion??1)<3)return drawLegacy(dialog,getState,commit,onFinish);
 let drag=null;
 let selection=null,swaps=new Set(),notice='',auto=false,busy=false,retreat=false,disposed=false,timer=null,rate=1,gallery=false,deckOpen=false,search='',galleryPage=0,presentation=null,pendingAction=null;
 const animations=new Set(),ghosts=new Set(),battle=()=>presentation??getState().domestic.war.battle;
 dialog.classList.add('card-battle-dialog');dialog.setAttribute('aria-label','军阵卡牌战场');
 function stop(){drag?.dispose();disposed=true;clearTimeout(timer);for(const a of animations)a.cancel();for(const g of ghosts)g.remove();animations.clear();ghosts.clear();dialog.classList.remove('card-battle-dialog');dialog.removeEventListener('keydown',onKey);dialog.removeEventListener('cancel',onCancel);}
 dialog.addEventListener('close',stop,{once:true});dialog.addEventListener('keydown',onKey);dialog.addEventListener('cancel',onCancel);
 function onCancel(e){if(selection||gallery){e.preventDefault();selection=null;gallery=false;render();dialog.focus();}}
 function onKey(e){if(e.key==='Escape'&&(selection||gallery)){e.preventDefault();selection=null;gallery=false;render();}else if(e.key.toLowerCase()==='e'&&!/INPUT|TEXTAREA|SELECT/.test(e.target.tagName)){e.preventDefault();dialog.querySelector('[data-end]')?.click();}}
 const fieldCards=(b,side)=>[...b.cards.players[side].board,...(b.cards.players[side].landmarks??[])].sort((a,z)=>(b.cards.catalog[a].played??0)-(b.cards.catalog[z].played??0));
 const landmarkStatus=(b,x)=>`${x.uses}次 · ${x.landmarkReadyTurn>b.cards.players[x.side].ownTurn?'冷却'+(x.landmarkReadyTurn-b.cards.players[x.side].ownTurn):'可发动'}`;
 const deckTypes=(c,ids)=>{const out={troop:0,general:0,tactic:0};for(const id of ids)out[c.catalog[id].type]=(out[c.catalog[id].type]??0)+1;return `兵牌${out.troop} · 人物${out.general} · 计策${out.tactic}${out.weapon?'、武器'+out.weapon:''}${out.secret?'、奥秘'+out.secret:''}${out.landmark?'、地标'+out.landmark:''}`;};
 const avatar=p=>cardRegionalArt(p.portraitId)?.src??OFFICIAL_ART[p.portraitId]?.avatar??officialAvatar({id:p.personId,name:p.name})??'';
 const node=id=>[...dialog.querySelectorAll('[data-card],[data-hero],[data-own-secret]')].find(e=>e.dataset.card===id||e.dataset.ownSecret===id||e.dataset.hero+'-hero'===id);
 const position=e=>{if(!e)return null;const a=e.getBoundingClientRect(),s=dialog.querySelector('.cb-stage').getBoundingClientRect();return {x:a.left-s.left,y:a.top-s.top,w:a.width,h:a.height};};
 const duration=ms=>matchMedia('(prefers-reduced-motion: reduce)').matches?0:ms/(rate*(auto?1.8:1));
 async function animate(el,frames,ms,extra={}){if(!el||disposed)return;const a=el.animate(frames,{duration:duration(ms),easing:'cubic-bezier(.2,.7,.2,1)',...extra});animations.add(a);try{await a.finished;}catch{}finally{animations.delete(a);a.cancel();}}
 const applyArt=applyCardArt;
 function safeMarkup(el){const copy=el.cloneNode(true);for(const node of [copy,...copy.querySelectorAll('[style]')])node.removeAttribute('style');return copy.outerHTML;}
 function ghost(html,rect,className=''){if(!rect)return null;const el=document.createElement('div');el.className='cb-fx-ghost '+className;el.style.cssText=`left:${rect.x}px;top:${rect.y}px;width:${rect.w}px;height:${rect.h}px`;el.innerHTML=html;applyArt(el);dialog.querySelector('.cb-stage').append(el);ghosts.add(el);return el;}
 function removeGhost(el){el?.remove();ghosts.delete(el);}
 function targetId(event,b){return event.target==='hero'?other(event.side??b.cards.turn)+'-hero':event.target;}
 async function playback(before,after,snapshots,action){
  const events=after.cards.events??[],jobs=[],segments=secretResponseSegments(after),secretIndices=new Set(segments.flatMap(s=>s.indices)),deathSegments=personDeathSegments(after),deathIndices=new Set(deathSegments.flatMap(s=>s.indices));
  const old=key=>snapshots.get(key)?.rect,newRect=key=>position(node(key))??old(key);
  const fxLayer=dialog.querySelector('.cb-stage');if(!fxLayer)return;
  const skillEffects=createCardSkillEffects({stage:fxLayer,animate,ghost,removeGhost,position,node,track:el=>ghosts.add(el),isDisposed:()=>disposed,cardFace:x=>card(x,'hand')});
  const skill=await skillEffects.begin(before,after,action,snapshots);
  if(disposed)return;if(skill)jobs.push(skill.done);
  let strike=null;
  if(action.type==='end')await animate(dialog.querySelector('[data-end]'),[{filter:'brightness(1)'},{filter:'brightness(1.8) drop-shadow(0 0 24px #a7f4ce)',offset:.45},{filter:'brightness(1)'}],440);
  if(action.type==='attack'||action.type==='hero-attack'){
   const actorKey=action.type==='hero-attack'?before.cards.turn+'-hero':action.id,target=action.target==='hero'?other(before.cards.turn)+'-hero':action.target,start=old(actorKey),end=newRect(target),record=snapshots.get(actorKey);
   if(start&&end&&record){
    const el=ghost(record.html,start,'cb-fx-attacker'+(action.type==='hero-attack'?' cb-fx-hero':'')),current=node(actorKey);if(current)current.style.visibility='hidden';
    const dx=end.x+end.w/2-start.x-start.w/2,dy=end.y+end.h/2-start.y-start.h/2,dead=action.type==='hero-attack'?after.cards.players[before.cards.turn].hero<=0:!after.cards.players[before.cards.turn].board.includes(action.id);
    fxLayer.dataset.attackPhase='windup';
    jobs.push(skillEffects.impact(start,'charge'));
    await animate(el,[{transform:'translate(0,0) scale(1)'},{transform:`translate(${-dx*.045}px,${-dy*.045}px) scale(1.08)`,filter:'brightness(1.2) drop-shadow(0 0 10px #f3cd84)'}],300);
    if(disposed)return;
    if(segments.length){
     const visual=structuredClone(before);
     for(const segment of segments){
      const x=after.cards.catalog[segment.id],seal=before.cards.catalog[x.id].secretSeal,source=old(seal)??old(x.id)??position(dialog.querySelector('[data-secret-zone="'+x.side+'"]')),rect={x:fxLayer.clientWidth*.43,y:fxLayer.clientHeight*.29,w:fxLayer.clientWidth*.13,h:fxLayer.clientWidth*.182};
      const face=ghost(card(x,'hand'),source??rect,'cb-fx-secret-reveal');const caption=document.createElement('b');caption.className='cb-secret-reveal-caption';caption.textContent=(x.side==='home'?'我方':'敌方')+'奥秘揭示';face?.append(caption);fxLayer.dataset.secretPhase='reveal';
      if(face&&source)await animate(face,[{opacity:0,transform:'scaleX(.15)'},{opacity:1,transform:`translate(${rect.x-source.x}px,${rect.y-source.y}px) scale(${rect.w/source.w},${rect.h/source.h})`}],260,{fill:'forwards'});
      if(disposed)return;if(face){face.style.left=rect.x+'px';face.style.top=rect.y+'px';face.style.width=rect.w+'px';face.style.height=rect.h+'px';}
      visual.cards.players[x.side].secrets=visual.cards.players[x.side].secrets.filter(id=>id!==x.id);paintSecretZones(visual);
      await animate(face,[{opacity:1,transform:'scale(1)'},{opacity:1,transform:'scale(1)'}],1050);if(disposed)return;
      for(const index of segment.indices){const event=events[index];applySecretVisualEvent(visual,event);const target=event.target??event.id,rect=target===actorKey?start:newRect(target);if(['damage','armor','shield','death'].includes(event.type)&&rect)jobs.push(skillEffects.impact(rect,event.type==='armor'||event.type==='shield'?'shield':'clash',event.type==='armor'?'护甲 +'+event.amount:event.type==='damage'?'伏击 −'+event.amount:''));}
      revealImpact(visual);const v=visual.cards.catalog[action.id],hp=el.querySelector('.cb-health');if(v&&hp)hp.firstChild.textContent=Math.max(0,v.hp);if(v)el.classList.toggle('has-shield',v.tags.includes('shield'));
      await animate(face,[{opacity:1},{opacity:0,transform:'translateY(-12px) scale(.96)'}],180);removeGhost(face);
     }
     fxLayer.dataset.secretPhase='resolved';
    }
    if(events.some(e=>e.type==='secret-stop')){fxLayer.dataset.attackPhase='secret-stop';const label=document.createElement('b');label.className='cb-secret-stop-notice';label.textContent='攻击中止';label.style.left=start.x+start.w/2+'px';label.style.top=start.y+start.h/2+'px';fxLayer.append(label);ghosts.add(label);jobs.push(animate(label,[{opacity:0},{opacity:1,offset:.15},{opacity:1,offset:.7},{opacity:0}],800).finally(()=>removeGhost(label)));strike={el,current,dx:0,dy:0,dead:true,trail:null,actorKey};}
    else{
    // Keep the trail on screen through contact, with the same timings for both armies.
    const trail=document.createElement('i');trail.className='cb-attack-trail '+before.cards.turn;
    trail.style.cssText=`left:${start.x+start.w/2}px;top:${start.y+start.h/2}px;width:${Math.hypot(dx,dy)}px;--angle:${Math.atan2(dy,dx)}rad`;
    fxLayer.append(trail);ghosts.add(trail);
    fxLayer.dataset.attackPhase='travel';
    const travel=animate(el,[{transform:`translate(${-dx*.045}px,${-dy*.045}px) scale(1.08)`},{transform:`translate(${dx*.9}px,${dy*.9}px) scale(1.1)`}],500,{easing:'cubic-bezier(.42,0,.7,1)',fill:'forwards'});
    const attacker=before.cards.catalog[action.id]??{};
    if(['archers','crossbows','horse-archers'].includes(attacker.kind))await Promise.all([travel,projectile(start,end,'arrow',500)]);else await travel;
    if(disposed)return;
    el.style.transform=`translate(${dx*.9}px,${dy*.9}px) scale(1.1)`;
    fxLayer.dataset.attackPhase='impact';
    strike={el,current,dx,dy,dead,trail,actorKey};
    jobs.push(skillEffects.impact(end,'clash'));
    jobs.push(animate(trail,[{opacity:.9},{opacity:.6,offset:.4},{opacity:0}],650).finally(()=>removeGhost(trail)));
    }
   }
  }
  if(action.type==='play'&&after.cards.catalog[action.id]?.type==='secret'){
   const x=after.cards.catalog[action.id],side=x.side,slots=[...dialog.querySelectorAll('[data-secret-zone="'+side+'"] [data-secret-slot]')],index=before.cards.players[side].secrets.length,end=position(slots[index]),record=side==='home'?snapshots.get(x.id):null,start=record?.rect??position(dialog.querySelector('.cb-backhand i:last-of-type'));
   if(start&&end){const flying=ghost(side==='home'?record.html:'<span class="cb-hidden-card" aria-label="敌方未知奥秘">'+sealedSecretArt()+'</span>',start,'cb-fx-secret-back');fxLayer.dataset.secretPhase='set-windup';await animate(flying,[{opacity:1,transform:'translate(0,0)'},{opacity:1,transform:`translate(${end.x-start.x}px,${end.y-start.y}px) scale(${end.w/start.w},${end.h/start.h})`}],450);removeGhost(flying);}fxLayer.dataset.secretPhase='set-impact';
  }
  if(action.type==='play'&&after.cards.catalog[action.id]?.type==='weapon'){
   const x=after.cards.catalog[action.id],record=snapshots.get(action.id),slot=dialog.querySelector('[data-equipped-weapon="'+x.side+'"]'),start=record?.rect??position(dialog.querySelector('.cb-backhand i:last-of-type')),end=position(slot);
   if(start&&end){const flying=ghost(record?.html??card(x,'hand'),start,'cb-fx-weapon');fxLayer.dataset.weaponPhase='equip-windup';await animate(flying,[{opacity:1,transform:'translate(0,0)'},{opacity:1,transform:`translate(${end.x-start.x}px,${end.y-start.y}px) scale(${end.w/start.w},${end.h/start.h})`}],450);removeGhost(flying);}
   fxLayer.dataset.weaponPhase='equip-impact';
  }
  if(action.type==='play'&&after.cards.catalog[action.id]?.type==='landmark'){
   const x=after.cards.catalog[action.id],record=snapshots.get(x.id),current=node(x.id),start=record?.rect??position(dialog.querySelector('.cb-backhand i:last-of-type')),end=position(current);if(current)current.style.visibility='hidden';fxLayer.dataset.landmarkPhase='deploy-windup';if(start&&end){const flying=ghost(record?.html??card(x,'hand'),start,'cb-fx-landmark');await animate(flying,[{transform:'translate(0,0)'},{transform:`translate(${end.x-start.x}px,${end.y-start.y}px) scale(${end.w/start.w},${end.h/start.h})`}],450,{transformOrigin:'top left'});removeGhost(flying);}if(current)current.style.visibility='';fxLayer.dataset.landmarkPhase='impact';
  }
  if(action.type==='landmark-use'){
   fxLayer.dataset.landmarkPhase='use-windup';const from=old(action.id),to=newRect(action.target);await animate(node(action.id),[{filter:'brightness(1)'},{filter:'brightness(1.8) drop-shadow(0 0 12px #e8d49b)'}],220);await projectile(from,to,'order',400);fxLayer.dataset.landmarkPhase='impact';
  }
  if(action.type==='landmark-remove'){
   const current=node(action.id),record=snapshots.get(action.id);fxLayer.dataset.landmarkPhase='remove-windup';if(current)current.style.visibility='hidden';if(record){const leaving=ghost(record.html,record.rect,'cb-fx-landmark');await animate(leaving,[{opacity:1},{opacity:0,transform:'translateY(20px) scale(.85)'}],400);removeGhost(leaving);}fxLayer.dataset.landmarkPhase='impact';
  }
  if(disposed)return;
  if(deathSegments.length){
   // Replay committed values only; each banner precedes its own actual benefit.
   const visual=structuredClone(before),shown=new Set(),history=after.cards.history?.entries.at(-1)?.events??[];
   for(const [index,event] of events.entries()){
    const segment=deathSegments.find(s=>s.indices.includes(index));
    if(segment&&!shown.has(segment.id)){shown.add(segment.id);await skill?.done;if(disposed)return;await skillEffects.death(segment,snapshots);if(disposed)return;}
    applyDeathVisualEvent(visual,history[index]);
    revealImpact(visual);
    if(event.type==='death'&&strike?.actorKey===event.id){removeGhost(strike.el);removeGhost(strike.trail);strike=null;}
    if(segment){
     const target=event.target??(event.type==='draw'||event.type==='burn'?null:segment.side+'-hero'),rect=target?newRect(target):position(dialog.querySelector('.cb-deck.'+segment.side));
     if(event.type==='draw'&&event.side==='home'){const current=node(event.id);if(current)current.style.visibility='';}
     if(rect)jobs.push(skillEffects.impact(rect,event.type==='heal'?'heal':event.type==='armor'?'shield':event.type==='draw'||event.type==='burn'?'draw':'clash',event.type==='draw'?'抽牌':event.type==='burn'?'手牌已满':event.amount?('+'+event.amount):''));
    }
   }
   // Triggers with no emitted benefit (e.g. a filtered empty deck) still get one performance.
   for(const segment of deathSegments)if(!shown.has(segment.id)){await skill?.done;if(disposed)return;await skillEffects.death(segment,snapshots);if(disposed)return;}
  }
  if(deathSegments.length)fxLayer.dataset.deathPhase='resolved';
  revealImpact(after);
  for(const [eventIndex,event]of events.entries()){
   if(secretIndices.has(eventIndex)||deathIndices.has(eventIndex))continue;
   if(event.type==='death'&&deathSegments.some(s=>s.id===event.id))continue;
   if(event.type==='play'&&!['weapon','secret','landmark'].includes(after.cards.catalog[event.id].type)){
    let record=snapshots.get(event.id);const end=newRect(event.id);if(!record&&event.side==='enemy'){const source=position(dialog.querySelector('.cb-backhand i:last-of-type')),el=node(event.id);if(source)record={html:el?safeMarkup(el):card(after.cards.catalog[event.id],'hand'),rect:source};}if(record&&end&&unit(after.cards.catalog[event.id])){
     const el=ghost(record.html,record.rect,'cb-fx-deploy'),morph=ghost(card(after.cards.catalog[event.id],'board'),record.rect,'cb-fx-morph'),current=node(event.id);if(current)current.style.visibility='hidden';const a=record.rect;
     const motion=[{transform:'translate(0,0) rotate(-4deg)'},{transform:`translate(${end.x-a.x}px,${end.y-a.y-48}px) scale(${end.w/a.w},${end.h/a.h}) rotate(0deg)`,offset:.72},{transform:`translate(${end.x-a.x}px,${end.y-a.y}px) scale(${end.w/a.w},${end.h/a.h})`,offset:1}];
     const full=motion.map((f,i)=>({...f,opacity:i<2?1:0})),battleFace=motion.map((f,i)=>({...f,opacity:i===0?0:i===1?.7:1}));
     jobs.push(Promise.all([animate(el,full,620,{transformOrigin:'top left'}),animate(morph,battleFace,620,{transformOrigin:'top left'})]).then(()=>{removeGhost(el);removeGhost(morph);if(current)current.style.visibility='';if(!disposed)return Promise.all([skillEffects.land(end),animate(current,[{filter:'brightness(1.4)'},{filter:'brightness(1)'}],400)]);}).finally(()=>{removeGhost(el);removeGhost(morph);if(current)current.style.visibility='';}));
    }else if(record&&!skill){const el=ghost(record.html,record.rect,'cb-fx-tactic');jobs.push(animate(el,[{transform:'translateY(0)',opacity:1},{transform:'translateY(-100px) scale(.85)',opacity:0}],330).finally(()=>removeGhost(el)));if(event.target){const destination=event.target==='hero'?other(event.side)+'-hero':event.target;jobs.push(projectile(record.rect,newRect(destination),'order'));}}
   }
   if(event.type==='draw'&&event.side==='enemy'){const start=position(dialog.querySelector('.cb-deck.enemy')),end=position(dialog.querySelector('.cb-backhand i:last-of-type'));if(start&&end){const el=ghost('<i class="cb-hidden-card"><span>令</span></i>',end,'cb-fx-draw');jobs.push(animate(el,[{transform:`translate(${start.x-end.x}px,${start.y-end.y}px) scale(.6) rotate(12deg)`,opacity:0},{transform:'translate(0,0) scale(1) rotate(0deg)',opacity:1}],300).finally(()=>removeGhost(el)));}}
   if(event.type==='draw'&&event.side==='home'){
    const current=node(event.id),end=position(current),start=position(dialog.querySelector('.cb-deck.home'));if(current&&end&&start){current.style.visibility='hidden';const el=ghost(safeMarkup(current),end,'cb-fx-draw');jobs.push(animate(el,[{transform:`translate(${start.x-end.x}px,${start.y-end.y}px) scale(.35) rotate(16deg)`,opacity:0},{transform:'translate(0,0) scale(1) rotate(0deg)',opacity:1}],300).finally(()=>{removeGhost(el);current.style.visibility='';}));}
   }
   if(event.type==='damage'||event.type==='heal'||event.type==='armor'||event.type==='buff'){
    const key=event.target,retaliation=!!strike&&key===strike.actorKey,rect=retaliation?position(strike.el):newRect(key),el=retaliation?strike.el:node(key),positive=event.type!=='damage',amount=event.amount??((event.attack??0)+(event.health??0));
    if(event.type!=='buff'&&rect&&(amount||event.armor)){const text=document.createElement('span');text.className='cb-float '+(positive?'positive':'negative');text.textContent=event.armor&&!amount?'护甲吸收':(positive?'+':'−')+Math.abs(amount);text.style.cssText=`left:${rect.x+rect.w*(retaliation?.12:.5)}px;top:${rect.y+rect.h*(retaliation?.72:.3)}px`;fxLayer.append(text);ghosts.add(text);jobs.push(animate(text,[{transform:'translate(-50%,8px) scale(.7)',opacity:0},{transform:'translate(-50%,-10px) scale(1.1)',opacity:1,offset:.25},{transform:'translate(-50%,-55px) scale(1)',opacity:0}],1100).finally(()=>removeGhost(text)));}
    if(el)jobs.push(animate(el,retaliation?[{filter:'brightness(1)'},{filter:'brightness(1.5) sepia(.5)',offset:.35},{filter:'brightness(1)'}]:positive?[{filter:'brightness(1)'},{filter:'brightness(1.8) drop-shadow(0 0 14px #80d8b0)',offset:.4},{filter:'brightness(1)'}]:[{transform:'translateX(0)'},{transform:'translateX(-5px)',filter:'sepia(1) saturate(4)',offset:.3},{transform:'translateX(5px)',offset:.6},{transform:'translateX(0)',filter:'none'}],520));
   }
   if(event.type==='death'){
    const record=snapshots.get(event.id);if(record){if(action.type==='attack'&&event.id===action.id)continue;const el=ghost(record.html,record.rect,'cb-fx-death');const hp=el.querySelector('.cb-health');if(hp)hp.firstChild.textContent='0';jobs.push(animate(el,[{opacity:1,filter:'brightness(1.3)'},{opacity:.7,transform:'translateY(5px) rotate(4deg)',offset:.35},{opacity:0,transform:'translateY(30px) scale(.82) rotate(7deg)',filter:'sepia(1) blur(5px)'}],700).finally(()=>removeGhost(el)));}
   }
   const applied=effectNotice(event,before,after),appliedRect=newRect(event.target);
   if(applied&&appliedRect){
    const label=document.createElement('div');label.className='cb-applied-effect '+(event.type==='freeze'?'frozen':event.type==='silence'?'silenced':'enhanced');label.textContent=applied;
    label.style.cssText=`left:${appliedRect.x+appliedRect.w/2}px;top:${appliedRect.y+appliedRect.h*.62}px`;fxLayer.append(label);ghosts.add(label);
    jobs.push(animate(label,[{opacity:0,transform:'translate(-50%,8px)'},{opacity:1,transform:'translate(-50%,0)',offset:.1},{opacity:1,offset:.8},{opacity:0,transform:'translate(-50%,-12px)'}],1700).finally(()=>removeGhost(label)));
   }
   if(event.type==='weapon-break'){const rect=position(dialog.querySelector('[data-equipped-weapon="'+event.side+'"]'));if(rect)jobs.push(skillEffects.impact(rect,'clash','武器毁损'));}
   if(event.type==='shield')jobs.push(animate(node(event.target),[{boxShadow:'0 0 0 0 #ffe29c'},{boxShadow:'0 0 0 24px #ffe29c00',offset:.8},{boxShadow:'none'}],300));
   if(event.type==='turn'){
    const text=document.createElement('div');text.className='cb-turn-banner';text.innerHTML=`<small>第 ${after.round} 回合</small><strong>${event.side==='home'?'我军行动':'敌军行动'}</strong>`;fxLayer.append(text);ghosts.add(text);jobs.push(animate(text,[{opacity:0,transform:'translate(-50%,-50%) scaleX(.4)'},{opacity:1,transform:'translate(-50%,-50%) scaleX(1)',offset:.2},{opacity:1,offset:.7},{opacity:0,transform:'translate(-50%,-50%) scaleX(1.12)'}],950).finally(()=>removeGhost(text)));
   }
  }
  if(strike){
   const {el,current,dx,dy,dead}=strike;
   jobs.push((async()=>{
    const hp=after.cards.catalog[action.id]?.hp,badge=el.querySelector('.cb-health');if(badge)badge.firstChild.textContent=Math.max(0,hp);
    await animate(el,[{transform:`translate(${dx*.9}px,${dy*.9}px) scale(1.1)`},{transform:`translate(${dx*.9}px,${dy*.9}px) scale(1.06)`}],220);
    if(disposed)return;fxLayer.dataset.attackPhase='recover';
    await animate(el,[{transform:`translate(${dx*.9}px,${dy*.9}px) scale(1.06)`,opacity:1},{transform:dead?`translate(${dx*.9}px,${dy*.9+30}px) scale(.82)`:'translate(0,0) scale(1)',opacity:dead?0:1}],500);
   })().finally(()=>{removeGhost(el);if(current&&!dead)current.style.visibility='';}));
  }
  await Promise.all(jobs);
 }
 // The save is already committed. Only the visible values wait for contact.
 function revealImpact(after){
  paintSecretZones(after);
  for(const side of ['home','enemy']){const slot=dialog.querySelector('[data-equipped-weapon="'+side+'"]');if(slot){const x=after.cards.catalog[after.cards.players[side].weapon];slot.innerHTML=equipmentContent(side,after);slot.dataset.weaponCard=x?.id??'';slot.classList.toggle('empty',!x);slot.setAttribute('aria-label',x?x.name+'，'+x.attack+'攻击，'+x.durability+'耐久':'未装备武器');}}
  for(const side of ['home','enemy']){
   const p=after.cards.players[side],flag=dialog.querySelector(`[data-hero-flag="${side}"]`),portrait=node(side+'-hero');
   if(flag){flag.querySelector('b').textContent=Math.max(0,p.hero);flag.setAttribute('aria-label',flag.querySelector('strong').textContent+'，生命'+Math.max(0,p.hero));let armor=flag.querySelector('.cb-armor');if(p.armor&&!armor){armor=document.createElement('i');armor.className='cb-armor';flag.append(armor);}if(armor){if(p.armor)armor.textContent='盾 '+p.armor;else armor.remove();}}
   if(portrait)portrait.setAttribute('aria-label',portrait.getAttribute('aria-label').replace(/生命-?\d+/,'生命'+Math.max(0,p.hero)));
  }
  for(const el of dialog.querySelectorAll('.cb-row [data-card]')){
   const x=after.cards.catalog[el.dataset.card];if(!x)continue;if(x.type==='landmark'){if(!after.cards.players[x.side].landmarks.includes(x.id)){el.style.visibility='hidden';continue;}el.querySelector('.cb-landmark-meter').textContent=landmarkStatus(after,x);el.classList.toggle('landmark-ready',landmarkTargets(after,x.id).length>0);el.classList.toggle('landmark-cooling',x.landmarkReadyTurn>after.cards.players[x.side].ownTurn);el.setAttribute('aria-label',x.name+'，'+landmarkStatus(after,x));continue;}
   if(!after.cards.players[x.side].board.includes(x.id)){el.style.visibility='hidden';continue;}
   for(const [cls,value]of [['cb-health',Math.max(0,x.hp)],['cb-attack',x.attack]]){const badge=el.querySelector('.'+cls);if(badge)badge.firstChild.textContent=value;}
   el.querySelector('.cb-health')?.classList.toggle('hurt',x.hp<x.maxHp);el.setAttribute('aria-label',el.getAttribute('aria-label').replace(/生命-?\d+/,'生命'+Math.max(0,x.hp)).replace(/攻击\d+/,'攻击'+x.attack));
   el.classList.toggle('has-shield',x.tags.includes('shield'));el.classList.toggle('frozen',x.frozen);paintStatuses(el,x);
  }
 }
 async function projectile(from,to,kind,ms=450){if(!from||!to||disposed)return;const el=document.createElement('i');el.className='cb-projectile '+kind;const dx=to.x+to.w/2-from.x-from.w/2,dy=to.y+to.h/2-from.y-from.h/2;el.style.cssText=`left:${from.x+from.w/2}px;top:${from.y+from.h/2}px;--angle:${Math.atan2(dy,dx)}rad`;dialog.querySelector('.cb-stage').append(el);ghosts.add(el);try{await animate(el,[{transform:'translate(0,0) rotate(var(--angle))',opacity:1},{transform:`translate(${dx}px,${dy}px) rotate(var(--angle))`,opacity:1}],ms,{easing:'ease-in'});}finally{removeGhost(el);}}
 async function step(action){
  if(disposed||busy||gallery)return;busy=true;clearTimeout(timer);const before=battle(),snapshots=new Map();
  for(const el of dialog.querySelectorAll('[data-card],[data-hero]'))snapshots.set(el.dataset.card??el.dataset.hero+'-hero',{html:safeMarkup(el),rect:position(el)});
  for(const el of dialog.querySelectorAll('[data-secret-slot]'))snapshots.set(el.dataset.ownSecret??el.dataset.secretSeal??el.dataset.secretSlot,{html:safeMarkup(el),rect:position(el)});
  try{
   const next=options.advance?options.advance(getState(),action):advanceWar(getState(),action);commit(next);const after=getState().domestic.war.battle;
   selection=null;swaps.clear();notice='';retreat=false;pendingAction=action.type;
   // Preserve the pre-hit board and hero life, without delaying or changing the saved result.
   presentation=structuredClone(after);presentation.result=before.result;presentation.log=[...before.log];
   for(const side of ['home','enemy']){
    const p=presentation.cards.players[side],old=before.cards.players[side];p.hero=old.hero;p.armor=old.armor;if(after.command.weaponAllocation){p.weapon=old.weapon;if(old.weapon)presentation.cards.catalog[old.weapon]=structuredClone(before.cards.catalog[old.weapon]);}
    if(old.landmarks){p.landmarks=[...old.landmarks,...(p.landmarks??[]).filter(id=>!old.landmarks.includes(id))];p.ownTurn=old.ownTurn;for(const id of old.landmarks)presentation.cards.catalog[id]=structuredClone(before.cards.catalog[id]);}
    if(old.secrets){p.secrets=[...old.secrets];for(const x of Object.values(before.cards.catalog).filter(x=>x.type==='secret'))presentation.cards.catalog[x.id]=structuredClone(x);}
    p.board=[...old.board,...p.board.filter(id=>!old.board.includes(id))];
    for(const id of old.board)presentation.cards.catalog[id]=structuredClone(before.cards.catalog[id]);
   }
   render();presentation=null;
   for(const event of after.cards.events??[])if(event.type==='draw'&&event.side==='home'){const el=node(event.id);if(el)el.style.visibility='hidden';}
   await playback(before,after,snapshots,action);
  }
  catch(e){notice=e.message;auto=false;}
  finally{presentation=null;pendingAction=null;busy=false;if(!disposed)render();}
 }
 function statusMarkup(x){
  const list=cardStatuses(x);if(!list.length)return '';
  const shown=list.length>3?list.slice(0,2):list;
  return `<span class="cb-card-state"><span class="cb-state-visual" aria-hidden="true">${cardStateEffectMarkup(x)}</span><span class="cb-statuses" aria-label="当前状态：${esc(list.map(s=>s.description).join('；'))}">${shown.map(s=>`<span class="cb-status ${s.tone}" data-status="${s.key}">${esc(s.label)}</span>`).join('')}${shown.length<list.length?`<span class="cb-status more">另${list.length-shown.length}项</span>`:''}</span></span>`;
 }
 function paintStatuses(el,x){
  const face=el.querySelector('.cb-card-surface');if(!face)return;
  face.querySelector('.cb-card-state')?.remove();face.insertAdjacentHTML('beforeend',statusMarkup(x));
  el.dataset.statuses=cardStatuses(x).map(s=>s.key).join(' ');el.setAttribute('aria-description',cardStatuses(x).map(s=>s.description).join('；'));
  el.classList.toggle('silenced',!!x.silenced);
  el.querySelector('.cb-attack')?.classList.toggle('enhanced',x.attack>x.printedAttack);
  el.querySelector('.cb-attack')?.classList.toggle('weakened',x.attack<x.printedAttack);
  el.querySelector('.cb-health')?.classList.toggle('enhanced',x.maxHp>x.printedHp);
 }
 function feedback(text){notice=text;render();}
 function card(x,zone='board',definition=null){
  if(x.type==='landmark'){const b=battle(),ready=landmarkTargets(b,x.id).length>0,hand=zone==='hand';return `<button class="cb-card landmark ${zone} ${x.side} ${ready?'landmark-ready':''} ${x.landmarkReadyTurn>b.cards.players[x.side].ownTurn?'landmark-cooling':''} ${selection?.id===x.id?'selected':''}" data-card="${esc(x.id)}" aria-label="${esc(x.name+'，'+landmarkStatus(b,x)+'，'+x.definition.text)}"><span class="cb-card-surface">${hand?'<i class="cb-cost">'+cardCost(b,x.id)+'</i>':''}<strong>${esc(x.name)}</strong><div class="cb-art">${landmarkArt(x.definitionId)}</div>${hand?'<div class="cb-card-copy"><small>'+esc(x.definition.text)+'</small></div>':''}<b class="cb-landmark-meter">${esc(landmarkStatus(b,x))}</b></span></button>`;} 
  if(x.type==='secret'&&x.side==='enemy'&&!x.secretRevealed)return '<span class="cb-hidden-card" aria-label="敌方未知奥秘">'+sealedSecretArt()+'</span>';
  const b=battle(),c=b.cards,d=definition??x.definition,compact=zone==='board',person=x.personId?b.cardPeople[x.personId]:null;
  const selected=selection?.id===x.id||swaps.has(x.id),status=compact&&x.side==='home'?cardAttackStatus(b,x.id):null,ready=status?.code==='ready',cost=definition?d.cost:cardCost(b,x.id);
  const combatArt=battlePersonArt(person?.historicalDefinitionId??definition?.person_id??x.historicalDefinitionId)??(!person?.historicalDefinitionId?randomBattleArt(person?.portraitId):null);
  const text=x.silenced?'已沉默：原有关键词与专属技能已移除':cardText(d),art=combatArt?.src??(person?(cardRegionalArt(person.portraitId)?.src??OFFICIAL_ART[person.portraitId]?.full??avatar(person)):(definition?.art?.full??definition?.art?.avatar));
  const regional=person&&cardRegionalArt(person.portraitId),scene=!!art&&!regional&&!combatArt,artAttrs=art?`${scene?' data-portrait-scene=""':''}${combatArt?' data-battle-person-art="'+combatArt.personId+'"':''} data-portrait-art="${esc(art)}"${regional?` data-portrait-tile="${regional.x},${regional.y}"`:''}`:'';
  const noRules=unit(x)&&!d.skill&&!(d.tags?.length||d.enter?.length||d.death?.length);
  const classes=`cb-card ${noRules?'no-rules':''} ${x.type==='weapon'?'weapon':x.type==='secret'?'secret':unit(x)?'troop':'tactic'} ${d.type==='general'?'person':''} ${zone} ${zone==='gallery-card'?'cb-gallery-card':''} ${x.side??'home'} ${selected?'selected':''} ${ready?'ready':''} ${zone==='hand'&&c.phase==='play'&&cost>c.players.home.mana?'unaffordable':''} ${(x.tags??[]).includes('shield')?'has-shield':''} ${x.frozen?'frozen':''} ${x.silenced?'silenced':''} ${(x.tags??[]).includes('stealth')?'stealthed':''}`;
  const personId=person?.historicalDefinitionId??definition?.person_id,personStyle=personPresentation(personId);
  const personAttrs=personStyle?` data-person-presentation="${personId}" data-person-theme="${personStyle.theme}"`:'';
  const attrs=definition?`data-definition="${esc(d.id)}"`:`data-card="${esc(x.id)}"`,state=status?`data-attack-state="${status.code}"`:'';
  const label=esc(x.name+(compact?'':'，'+cost+'费')+(unit(x)?'，攻击'+x.attack+'，生命'+x.hp:'')+'，'+[status?.label,text,...cardStatuses(x).map(s=>s.description)].filter(Boolean).join('，'));
  const costBadge=compact?'':`<i class="cb-cost">${cost}</i>`;
  const seal=d.type==='spell'?'<i class="cb-order-seal">'+({precision:'矢',fire:'攻',execute:'追',arrows:'箭',barrage:'阵',brace:'守',assault:'勇',fortify:'备',dispel:'扰',pin:'牵',supply:'粮',heal:'整',coin:'令'}[d.id]??'策')+'</i>':'';
  const faceText=x.silenced?'已沉默':compactPersonText(d);
  const copy=compact||noRules?'':`<div class="cb-card-copy">${d.skill?`<b>${esc(d.skill)}</b>`:''}<small>${esc(faceText)}</small></div>`;
  const values=x.type==='weapon'?`<b class="cb-attack">${x.attack}<em>攻</em></b><b class="cb-health cb-durability">${x.durability}<em>耐</em></b>`:unit(x)?`<b class="cb-attack ${x.attack>x.printedAttack?'enhanced':x.attack<x.printedAttack?'weakened':''}" aria-label="攻击：每次造成的伤害">${x.attack}<em>攻</em></b><b class="cb-health ${x.hp<x.maxHp?'hurt':''} ${x.maxHp>x.printedHp?'enhanced':''}" aria-label="生命：归零时退场">${x.hp}<em>命</em></b>`:'';
  const rest=status?`<span class="cb-rest ${ready?'available':''}" aria-hidden="true">${status.label}</span>`:'';
  return `<button class="${classes}" ${attrs} ${state} ${personAttrs} aria-label="${label}" ><span class="cb-card-surface">${costBadge}<strong>${esc(x.name)}</strong><div class="cb-art troop-${esc(d.type==='weapon'?'arsenal-'+d.kitKind:d.type==='secret'?'order-'+d.id:x.kind??(d.type==='spell'?d.id:'infantry'))}"${artAttrs}>${x.type==='weapon'?weaponArt(d.kitKind):x.type==='secret'?secretArt(d.id):unit(x)?'<span class="cb-living-art" aria-hidden="true"></span>':''}${compact?'<span class="cb-art-atmosphere" aria-hidden="true"><i></i><i></i><i></i></span>':''}${seal}${personStyle?'<span class="cb-person-card-mark">'+personMotifMarkup(personId)+'</span>':''}</div>${copy}${values}${compact?statusMarkup(x):''}${rest}</span></button>`;
 }
 function powerIcon(kind){
  const paths=kind==='command'?'<path d="M8 36l10-8 9 6-4 10-10 2zm48 0l-10-8-9 6 4 10 10 2z"/><path d="M21 34l9-9q3-2 6 0l8 9-7 12H27z" fill="#eacb84"/><path d="M28 14h8m-4-4v8" fill="none" stroke-width="3"/>':kind==='intelligence'?'<path d="M18 12h31v37H18z" fill="#d4ae65"/><path d="M15 12q-6 0-6 6v27q0 6 7 6h29q8 0 8-6H21q-7 0-7-6V15q0-3 4-3z" fill="#b58a48"/><path d="M25 22h17M25 29h17M25 36h11" fill="none" stroke="#f9e2ad" stroke-width="2"/>':'<path d="M15 8l8 6 23 29-5 5-26-29zM49 8l-8 6-23 29 5 5 26-29z"/><path d="M13 42l12 11m14 0 12-11M10 54l8-8m36 8-8-8" fill="none" stroke-width="4"/>';
  return '<svg class="cb-power-icon" viewBox="0 0 64 64" aria-hidden="true">'+paths+'</svg>';
 }
 function equipmentContent(side,b=battle()){const p=b.cards.players[side],x=b.cards.catalog[p.weapon];return x?`${weaponArt(x.definition.kitKind)}<small>${esc(x.name)}</small><b>${x.attack}攻／${x.durability}耐</b>`:'<small>备用武器</small><span>未装备</span>';}
 function equipment(side){const b=battle(),p=b.cards.players[side],x=b.cards.catalog[p.weapon];return !b.command.weaponAllocation?'':`<button class="cb-weapon-slot ${x?'':'empty'}" data-equipped-weapon="${side}" data-weapon-card="${x?.id??''}" aria-label="${x?esc(x.name)+'，'+x.attack+'攻击，'+x.durability+'耐久':'未装备武器'}" title="点击查看装备来源与耐久">${equipmentContent(side,b)}</button>`;}
 function forecast(b,target){return selection?.mode==='hero-attack'?heroAttackPreview(b,target):attackPreview(b,selection.id,target);}
 function hero(side){
  const b=battle(),c=b.cards,p=c.players[side],u=b.units.find(u=>u.side===side&&u.commander),person=battlePerson(b,u),personStyle=personPresentation(person.historicalDefinitionId),combatArt=battlePersonArt(person.historicalDefinitionId)??(!person.historicalDefinitionId?randomBattleArt(person.portraitId):null),combatPortrait=combatArt?.src??avatar(person),personAttrs=personStyle?`data-person-presentation="${person.historicalDefinitionId}" data-person-theme="${personStyle.theme}"`:'',manual=c.turn==='home'&&c.phase==='play'&&!auto&&!busy;
  return `<div class="cb-command ${side}">${equipment(side)}${b.command.secretAllocation?'<div class="cb-secret-zone" data-secret-zone="'+side+'" aria-label="'+(side==='home'?'我方':'敌方')+'奥秘区">'+secretZoneMarkup(b,side)+'</div>':''}<button class="cb-portrait ${side==='home'&&manual&&legalHeroAttacks(b).length?'weapon-ready':''} ${side==='home'&&selection?.mode==='hero-attack'?'weapon-selected':''}" data-hero="${side}" ${personAttrs} ${combatArt?`data-battle-person-art="${combatArt.personId}"`:''} aria-label="${side==='home'?'我方':'敌方'}主将 ${esc(person.name)}，生命${p.hero}" title="${esc(person.name)} · 亲卫${u.count}/${u.initial}人 · ${esc(p.skill.text)}">${cardRegionalArt(person.portraitId)?`<span class="cb-regional-portrait" role="img" aria-label="${esc(person.name)}" data-portrait-art="${esc(avatar(person))}" data-portrait-tile="${cardRegionalArt(person.portraitId).x},${cardRegionalArt(person.portraitId).y}"></span>`:`<img src="${esc(combatPortrait)}" alt="${esc(person.name)}">`}<span class="cb-portrait-rim"></span>${personStyle?'<span class="cb-person-hero-mark">'+personMotifMarkup(person.historicalDefinitionId)+'</span>':''}</button><button class="cb-hero-banner ${person.name.length>3?'long-name':''}" data-hero-flag="${side}" aria-label="${esc(person.name)}，生命${p.hero}"><strong>${esc(person.name)}</strong><small>生命</small><b>${Math.max(0,p.hero)}</b>${p.armor?`<i class="cb-armor" title="护甲先承受伤害">盾 ${p.armor}</i>`:''}</button>${side==='home'?`<button class="cb-power ${selection?.mode==='power'?'selected':''}" data-power ${!manual||p.mana<2||p.powerUsed?'disabled':''} aria-label="${esc(p.skill.name)}，2军令，${esc(p.skill.text)}" title="${esc(p.skill.text)}">${powerIcon(p.skill.kind)}<strong>${p.skill.name}</strong><i>2</i></button>`:''}</div>`;
 }
 function render(){
  if(disposed)return;if(!drag?.starting)drag?.cancel('refresh',false);clearTimeout(timer);const b=battle();if(!b)return;const c=b.cards,p=c.players.home,e=c.players.enemy,manual=c.turn==='home'&&c.phase==='play'&&!auto&&!busy&&!gallery&&!deckOpen;
  const legal=selection?.mode==='landmark-use'?landmarkTargets(b,selection.id):selection?.mode==='hero-attack'?legalHeroAttacks(b):selection?.mode==='attack'?legalCardAttacks(b,selection.id):selection?.mode==='play'?legalCardTargets(b,selection.id):selection?.mode==='power'?legalPowerTargets(b):[];
  const hasAction=legalCardActions(b).some(a=>a.type!=='end');
  const hint=notice||(c.phase==='mulligan'?'保留前锋；选择要替换的其他起手牌':selection?.mode==='play'?'选择高亮目标 · 右键或 Esc 取消':selection?.mode==='power'?'选择主将技的高亮目标':selection?'选择高亮的敌方目标 · 攻击不消耗军令':b.result?'战斗结束，请结算战果':busy?'军令执行中…':manual&&!hasAction?'本回合暂无可执行操作，点击右侧结束回合':c.turn==='enemy'?'敌军正在行动…':b.log.at(-1));
  dialog.dataset.busy=String(busy);
  dialog.innerHTML=`<div class="cb-stage cb-v3 cb-prototype ${busy?'busy':''}" data-motion-rate="${rate}"><header class="cb-header"><div class="cb-title-plaque"><small>御前军阵 · 卡牌交锋</small><h1>${esc(b.targetName)}之战</h1></div><div class="cb-backhand" aria-label="敌方${e.hand.length}张隐藏手牌">${e.hand.map(()=>'<i><span>令</span></i>').join('')}<small>敌军手牌 ${e.hand.length}</small></div><div class="cb-header-tools"><button data-battle-history ${busy?'disabled':''}>交战记录</button><button data-battle-deck ${busy?'disabled':''}>本场牌组</button><button data-gallery>人物牌册 <small>100</small></button><button data-speed title="调整动画速度" ${busy?'disabled':''}>动效 ${rate===1?'正常':'快速'}</button><button data-close>保存离场 ×</button></div></header>${hero('enemy')}<aside class="cb-round"><small>当前战局</small><strong>第 ${b.round} 回合</strong><span>${c.turn==='home'?'我军行动':'敌军行动'}</span><button data-auto ${c.phase!=='play'||!!b.result?'disabled':''}>${auto?'停止自动':'自动战斗'}</button></aside><main class="cb-field">${['enemy','home'].map(side=>`<section class="cb-row ${side}" aria-label="${side==='home'?'我军':'敌军'}部队">${fieldCards(b,side).map(id=>card(c.catalog[id])).join('')}${Array.from({length:7-fieldOccupancy(c.players[side])},(_,i)=>`<div class="cb-slot" data-slot="${side}-${i}"><span>阵</span></div>`).join('')}</section>`).join('')}</main><aside class="cb-actions"><button class="cb-end ${pendingAction==='end'?'ending':''}" data-end ${!manual?'disabled':''}><span>结束回合</span></button><button data-retreat ${!manual?'disabled':''}>${retreat?'确认撤军':'撤军'}</button>${retreat?'<button data-cancel-retreat>继续作战</button>':''}<small>敌军军令 ${e.mana}/${e.maxMana}</small></aside><div class="cb-deck enemy" title="敌方剩余牌库${e.deck.length}张"><span>军阵</span><b>${e.deck.length}</b></div>${hero('home')}<div class="cb-hint" role="status">${esc(hint)}${selection?'<button data-cancel-selection>取消</button>':''}</div><footer class="cb-table"><div class="cb-hand" aria-label="我方手牌">${p.hand.map(id=>card(c.catalog[id],'hand')).join('')}</div><div class="cb-mana"><strong>军令 ${p.mana}/${p.maxMana}</strong><div>${Array.from({length:10},(_,i)=>`<i class="${i<p.mana?'lit':i<p.maxMana?'spent':'locked'}" aria-hidden="true"></i>`).join('')}</div><small>牌库 ${p.deck.length} · 手牌 ${p.hand.length}/10</small><small class="cb-deck-types" title="剩余牌库构成；按随机洗牌顺序抽取">${deckTypes(c,p.deck)}</small></div></footer><div class="cb-deck home" title="我方剩余牌库${p.deck.length}张"><span>军阵</span><b>${p.deck.length}</b></div><details class="cb-ledger"><summary>军情 · 兵粮与将领</summary><p>费用、攻、命为本场锁定数值；实际兵员在下表统计。攻击不消耗军令，受伤不降低攻击。</p><p>我方剩余牌库：${deckTypes(c,p.deck)}；随机抽取，不保证连续抽到不同类型。人物须随本场部队参战。</p><p>整备补给${b.command.supply?.grain??0}石；卡牌回合不额外推进旬或扣军粮。</p>${b.units.filter(u=>u.side==='home').map(u=>`<p><b>${esc(battlePerson(b,u).name)}</b> · ${esc(u.name)}：${u.count}/${u.initial}人，训练${u.training}${u.commander?' · 主将亲卫':' · 预备兵'+(p.reserve[u.id]??0)+'人'}</p>`).join('')}<p>护卫阻挡普通攻击；突袭登场只能攻击部队；护甲盾抵挡一次伤害。治疗卡片不复活实际阵亡兵员。</p>${b.log.slice(-5).map(t=>`<p>${esc(t)}</p>`).join('')}</details><aside class="cb-inspect" hidden></aside><div class="cb-attack-preview" data-attack-preview hidden aria-live="polite"></div><svg class="cb-aim" aria-hidden="true"><defs><marker id="cb-aim-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0,0 L10,5 L0,10 Z"/></marker></defs><path data-aim-line/></svg>${c.phase==='mulligan'?`<div class="cb-overlay cb-mulligan"><small>${c.first==='home'?'先手 · 3张起手':'后手 · 4张起手＋调兵令'}</small><h2>部署先锋</h2><p>前锋保证首回合可出牌。普通部队下个己方回合攻击；有突袭可立即攻击敌方部队。</p><button data-mulligan ${busy?'disabled':''}>开始交战${swaps.size?' · 替换'+swaps.size+'张':''}</button></div>`:''}${b.result?`<div class="cb-overlay cb-result ${b.result}"><i class="cb-victory-seal">${b.result==='victory'?'捷':b.result==='draw'?'和':'收'}</i><small>御前军报</small><h2>${b.result==='victory'?'大获全胜':b.result==='draw'?'双方收兵':'鸣金收兵'}</h2><p>我军阵亡${b.units.filter(u=>u.side==='home').reduce((n,u)=>n+u.dead,0)}人，生还士兵与装备按真实来源归营。</p><button data-result-history ${busy?'disabled':''}>查看交战记录</button><button data-settle ${busy?'disabled':''}>结算战果</button></div>`:''}${gallery?galleryMarkup():''}</div>`;
  applyArt(dialog);
  const handCards=[...dialog.querySelectorAll('.cb-hand>.cb-card')],middle=(handCards.length-1)/2,overlap=handCards.length>1?`min(0px,calc((100% - ${handCards.length*14.642857}cqh - 24px) / ${handCards.length-1}))`:'0px';handCards.forEach((el,i)=>{const t=middle?(i-middle)/middle:0;el.style.setProperty('--fan-angle',(t*Math.min(9,handCards.length*1.5))+'deg');el.style.setProperty('--fan-y',(t*t*7)+'px');el.style.setProperty('--fan-overlap',overlap);});
  const idleTime=performance.now()/1000;dialog.querySelectorAll('.cb-card.board').forEach((el,i)=>el.style.setProperty('--idle-phase',(-((idleTime+i*.73)%8))+'s'));
  dialog.querySelector('[data-close]').onclick=()=>dialog.close();
  dialog.querySelector('[data-speed]').onclick=()=>{if(busy)return;rate=rate===1?2:1;render();};
  dialog.querySelector('[data-auto]').onclick=()=>{auto=!auto;selection=null;if(busy){dialog.querySelector('[data-auto]').textContent=auto?'停止自动':'自动战斗';return;}render();};
  dialog.querySelector('[data-end]').onclick=()=>step({type:'end'});
  dialog.querySelectorAll('[data-battle-history],[data-result-history]').forEach(button=>button.onclick=()=>{if(busy)return;auto=false;selection=null;deckOpen=true;clearTimeout(timer);render();const viewer=openCardHistory(b);options.onAuxiliaryDialog?.(viewer);viewer.addEventListener('close',()=>{deckOpen=false;if(!disposed){render();dialog.querySelector(b.result?'[data-result-history]':'[data-battle-history]')?.focus();}},{once:true});});
  dialog.querySelector('[data-battle-deck]').onclick=()=>{if(busy)return;auto=false;selection=null;deckOpen=true;clearTimeout(timer);render();const viewer=openBattleDeck(b,{sourceNames:Object.fromEntries(getState().domestic.provinces.map(p=>[p.id,p.name]))});options.onAuxiliaryDialog?.(viewer);viewer.addEventListener('close',()=>{deckOpen=false;if(!disposed)render();},{once:true});};
  dialog.querySelector('[data-gallery]').onclick=()=>{if(busy)return;gallery=true;selection=null;render();};
  dialog.querySelector('[data-power]')?.addEventListener('click',()=>{if(p.skill.kind==='intelligence')step({type:'power'});else if(!legalPowerTargets(b).length)feedback('当前没有可使用主将技的目标。');else{selection=selection?.mode==='power'?null:{mode:'power'};notice='';render();}});
  dialog.querySelector('[data-retreat]').onclick=()=>{if(retreat)step({type:'retreat'});else{retreat=true;render();}};
  dialog.querySelector('[data-cancel-retreat]')?.addEventListener('click',()=>{retreat=false;render();});
  dialog.querySelector('[data-cancel-selection]')?.addEventListener('click',()=>{selection=null;notice='';render();});
  dialog.querySelector('[data-mulligan]')?.addEventListener('click',()=>step({type:'mulligan',ids:[...swaps]}));
  dialog.querySelector('[data-settle]')?.addEventListener('click',()=>{if(busy)return;if(options.onResult){stop();options.onResult();return;}try{const result=finishWar(getState());commit(result.state);stop();onFinish(result.receipt);}catch(e){feedback(e.message);}});
  for(const el of dialog.querySelectorAll('[data-card]')){
   const id=el.dataset.card;if(legal.includes(id))el.classList.add('target');el.onmouseenter=()=>{if(['attack','hero-attack'].includes(selection?.mode)&&legal.includes(id)){const f=forecast(b,id),box=dialog.querySelector('[data-attack-preview]');box.textContent=`本次攻击${f.damage} · 对方预计剩${f.targetLife}命 · 反击${f.retaliation} · 我方预计剩${f.attackerLife}命`;box.hidden=false;}else inspect(id);};el.onmouseleave=()=>{if(c.catalog[id].type!=='landmark')dialog.querySelector('.cb-inspect').hidden=true;dialog.querySelector('[data-attack-preview]').hidden=true;};el.onfocus=()=>inspect(id);el.onblur=()=>{if(c.catalog[id].type!=='landmark')dialog.querySelector('.cb-inspect').hidden=true;};
   el.onclick=()=>{
    if(busy||gallery)return;
    if(c.phase==='mulligan'&&p.hand.includes(id)){if(c.catalog[id].front||c.catalog[id].definitionId==='coin'){feedback('前锋与调兵令固定保留，可替换其他起手牌。');return;}swaps.has(id)?swaps.delete(id):swaps.add(id);notice='';render();return;}
    if(!manual){feedback(auto?'电脑正在指挥，点击停止自动后接管。':'现在是敌方回合，请等待对方结束。');return;}
    if(selection&&(selection.mode==='play'||selection.mode==='power'||selection.mode==='landmark-use')&&legal.includes(id)){submitTarget(id);return;}
    if(p.landmarks?.includes(id)){if(!landmarkTargets(b,id).length){inspect(id);notice='地标仍在冷却，或没有符合条件的友方目标。';dialog.querySelector('.cb-hint').textContent=notice;return;}selection=selection?.id===id?null:{mode:'landmark-use',id};notice='';render();return;}
    if(p.hand.includes(id)){
     const x=c.catalog[id];if(cardCost(b,id)>p.mana){feedback(`军令不足：需要${cardCost(b,id)}点，剩余${p.mana}点。已就绪部队的攻击不消耗军令。`);return;}if(x.type==='secret'&&!canArmSecret(b,x)){feedback('同名奥秘尚在场，或奥秘区已满。');return;}if((unit(x)||x.type==='landmark')&&fieldOccupancy(p)>=7){feedback('战场7格已满，部队与设施共享场位；请先腾出位置。');return;}
     if(x.definition.enter.some(f=>f.target)){
      if(legalCardTargets(b,id).length){selection={mode:'play',id};notice='';render();}else if(unit(x))step({type:'play',id});else feedback('当前没有符合这张计策要求的合法目标。');
     }else step({type:'play',id});
    }else if(p.board.includes(id)){const status=cardAttackStatus(b,id);if(status.code==='ready'){selection=selection?.id===id?null:{mode:'attack',id};notice='';render();}else feedback(status.reason);}
    else if(selection)submitTarget(id);else feedback('先选择一支己方可攻击的部队，或一张需要目标的牌。');
   };
  }
  for(const el of dialog.querySelectorAll('[data-hero]')){
   const side=el.dataset.hero,correct=selection?.mode==='power'&&p.skill.kind==='command'?side==='home':side==='enemy';
   if(correct&&legal.includes('hero'))el.classList.add('target');el.onmouseenter=()=>{if(['attack','hero-attack'].includes(selection?.mode)&&correct&&legal.includes('hero')){const f=forecast(b,'hero'),box=dialog.querySelector('[data-attack-preview]');box.textContent=`本次攻击${f.damage} · 敌将预计剩${f.targetLife}命 · 主将基础攻击0，无反击${b.cards.players.enemy.secrets?.length?'；存在未知奥秘，实际伤害以揭示后为准':''}`;box.hidden=false;}};el.onmouseleave=()=>dialog.querySelector('[data-attack-preview]').hidden=true;el.onclick=()=>{if(busy)return;if(side==='home'&&manual&&(!selection||selection.mode==='hero-attack')&&!!b.command.weaponAllocation){if(!p.weapon){feedback('先装备手牌中的武器，再选择主将攻击。');return;}if(!legalHeroAttacks(b).length){feedback('本回合主将已攻击，或当前没有合法目标。');return;}selection=selection?.mode==='hero-attack'?null:{mode:'hero-attack'};notice='';render();return;}if(selection&&correct)submitTarget('hero');else if(selection)feedback('请选择高亮的合法目标。');else feedback('选择一支己方可攻击部队，再选择敌方主将。');};
  }
  bindSecretSlots();
  for(const slot of dialog.querySelectorAll('[data-equipped-weapon]')){slot.onclick=()=>{if(busy)return;if(slot.dataset.weaponCard)inspect(slot.dataset.weaponCard);else feedback('尚未装备武器：从手牌出牌，或拖到己方主将装备。');};}
  for(const flag of dialog.querySelectorAll('[data-hero-flag]')){const portrait=dialog.querySelector('[data-hero="'+flag.dataset.heroFlag+'"]');if(portrait.classList.contains('target'))flag.classList.add('target');flag.onclick=()=>portrait.click();}
  function submitTarget(target){if(!manual)return;if(!legal.includes(target)){const forecast=selection?.mode==='hero-attack'?{code:'ready'}:selection?.mode==='attack'?cardAttackStatus(b,selection.id):null;feedback(forecast?.code==='ready'?'请选择高亮目标：有护卫时先攻击护卫，突袭当回合不能攻击主将。':'这个目标不符合技能要求。');return;}const action={type:selection.mode==='landmark-use'?'landmark-use':selection.mode==='hero-attack'?'hero-attack':selection.mode==='attack'?'attack':selection.mode==='play'?'play':'power',...(selection.id&&selection.mode!=='hero-attack'?{id:selection.id}:{}),target};step(action);}
  dialog.querySelector('.cb-stage').oncontextmenu=e=>{e.preventDefault();if(selection){selection=null;notice='';render();}};
  dialog.querySelector('.cb-stage').onpointermove=e=>{
   const line=dialog.querySelector('[data-aim-line]');if(!selection||c.phase!=='play'){line.setAttribute('d','');return;}const start=position(selection.mode==='power'?dialog.querySelector('[data-power]'):node(selection.mode==='hero-attack'?'home-hero':selection.id)),r=dialog.querySelector('.cb-stage').getBoundingClientRect();if(!start)return;const x=start.x+start.w/2,y=start.y+start.h/2,tx=e.clientX-r.left,ty=e.clientY-r.top;line.setAttribute('d',`M${x},${y} Q${x},${(y+ty)/2} ${tx},${ty}`);
  };
  options.decorate?.({dialog,busy,battle:b});
  if(gallery)bindGallery();
  if(!busy&&!gallery&&!deckOpen&&!options.isPaused?.()&&!b.result&&c.phase==='play'&&(c.turn==='enemy'||auto))timer=setTimeout(()=>step(options.opponentAction?options.opponentAction(b):cardAI(b)),auto?160:600);
 }
 function bindSecretSlots(){for(const slot of dialog.querySelectorAll('[data-secret-slot]')){slot.onclick=()=>{if(busy)return;if(slot.dataset.ownSecret)inspect(slot.dataset.ownSecret);else feedback(slot.classList.contains('empty')?'奥秘空位：可从手牌布置己方奥秘。':'敌方未知奥秘：只有触发时才会揭示内容。');};}}
 function paintSecretZones(b){for(const side of ['home','enemy']){const zone=dialog.querySelector('[data-secret-zone="'+side+'"]');if(zone)zone.innerHTML=secretZoneMarkup(b,side);}bindSecretSlots();}
 function inspect(id){
  const lb=battle(),lx=lb.cards.catalog[id];if(lx?.type==='landmark'){if(busy)return;dialog.querySelector('.cb-inspect').classList.add('cb-landmark-inspect');const box=dialog.querySelector('.cb-inspect'),source=getState().domestic.provinces.find(p=>p.id===lx.landmarkSource.sourceId)?.name??(lx.landmarkSource.sourceId==='central'?'中央军阵':lx.landmarkSource.sourceId),active=lb.cards.players.home.landmarks?.includes(id);box.hidden=false;box.innerHTML=`<button data-landmark-inspect-close>关闭详情 ×</button><small>军阵地标 · ${lx.cost}军令</small><h3>${esc(lx.name)}</h3><p>${esc(lx.definition.text)}</p><p>${esc(landmarkStatus(lb,lx))} · 与部队共享7格</p><p>来源：${esc(source)} · ${esc(battlePerson(lb,lb.units.find(u=>u.id===lx.landmarkSource.unitId)).name)}；既有营地／号令位置，不新增建筑、兵员或装备。</p>${active&&lb.cards.turn==='home'&&!auto?'<button data-landmark-remove>撤下设施（剩余次数作废）</button>':''}`;box.querySelector('[data-landmark-inspect-close]').onclick=()=>box.hidden=true;box.querySelector('[data-landmark-remove]')?.addEventListener('click',()=>{if(!busy)step({type:'landmark-remove',id});});return;} 
  dialog.querySelector('.cb-inspect').classList.remove('cb-landmark-inspect');
  const sb=battle(),sx=sb.cards.catalog[id];if(sx?.type==='secret'){if(busy||sx.side!=='home')return;const box=dialog.querySelector('.cb-inspect');box.hidden=false;box.innerHTML=`<small>己方奥秘 · ${sx.cost}军令</small><h3>${esc(sx.name)}</h3><p>${esc(sx.definition.text)}</p><p>来源：${esc(sx.secretSource.sourceId==='central'?'中央亲卫军阵':(getState().domestic.provinces.find(p=>p.id===sx.secretSource.sourceId)?.name??sx.secretSource.sourceId)+'亲卫军阵')} · ${esc(battlePerson(sb,sb.units.find(u=>u.id===sx.secretSource.unitId)).name)}；已部署军阵的军令，不额外占兵员或装备。</p>`;return;}

  const wb=battle(),wx=wb.cards.catalog[id];if(wx?.type==='weapon'){const box=dialog.querySelector('.cb-inspect'),s=wb.cards.weaponSupplies[id];box.hidden=false;box.innerHTML=`<small>武器 · ${wx.cost}军令</small><h3>${esc(wx.name)}</h3><p>${wx.attack}攻击／${wx.durability}耐久；每回合攻击一次。</p><p>来源：${esc(s.sourceId==='central'?'中央备用军备':s.sourceId)} · ${esc(troopNames[wx.definition.kitKind])}完整套装1人份；不占士兵。</p><p>${wb.cards.players[wx.side].heroAttackUsed?'主将本回合已攻击；更换武器不刷新次数。':'装备后可在己方回合攻击，反击由主将承受。'}</p>`;return;}
  if(busy||gallery||selection)return;const b=battle(),x=b.cards.catalog[id],d=x.definition,effects=cardStatuses(x),stats=statBreakdown(x),u=b.units.find(u=>u.id===x.unitId),box=dialog.querySelector('.cb-inspect');
  box.innerHTML=`<small>${d.type==='general'?'人物卡':unit(x)?'部队卡':'计策'} · ${cardCost(b,id)}费</small><h3>${esc(x.name)}</h3>${d.skill?`<b>${esc(d.skill)}</b>`:''}<p>${esc(x.silenced?'已沉默：原有关键词与专属技能已移除':cardText(d))}</p>${unit(x)?`<p>攻击 ${x.attack} · 生命 ${Math.max(0,x.hp)}/${x.maxHp}</p>${effects.length?`<section class="cb-status-detail"><b>当前生效</b><ul>${effects.map(s=>`<li class="${s.tone}">${esc(s.description)}</li>`).join('')}</ul><p>${esc(stats.attack)}<br>${esc(stats.health)}</p></section>`:''}<p>实际生还${x.count-cardDeaths(x)}/${x.count}人 · 训练${x.training}</p>`:''}${d.source?`<p>${esc(d.source.dynasty??'')} · ${esc(d.design_basis??d.source.biography)}</p><small>${esc(d.evidence_status)}</small>`:''}${u?`<small>来源：${esc(u.name)} · ${esc(battlePerson(b,u).name)}</small>`:''}${x.type==='general'?'<small>随任命与部队参战，离场不代表人物死亡</small>':''}`;
  box.hidden=false;const rect=(node(id).querySelector('.cb-card-surface')??node(id)).getBoundingClientRect(),stage=dialog.querySelector('.cb-stage').getBoundingClientRect(),width=box.offsetWidth,right=rect.right-stage.left+16,left=rect.left-stage.left-width-16;box.style.left=Math.max(8,Math.min(stage.width-width-8,right+width<=stage.width-8?right:left))+'px';box.style.top=Math.max(12,Math.min(stage.height-box.offsetHeight-18,rect.top-stage.top))+'px';
 }
 function galleryMarkup(){
  const list=HISTORICAL_CARDS.filter(d=>!search||[d.name,d.skill,d.source?.dynasty,d.ui_archetype].some(t=>t?.includes(search))),pages=Math.max(1,Math.ceil(list.length/12));galleryPage=Math.min(galleryPage,pages-1);
  return `<section class="cb-gallery" role="dialog" aria-modal="true" aria-label="人物牌册"><header><div><small>御前人物录 · 军阵人物</small><h2>百人牌册</h2><p>可查阅全部人物卡。已招募、任命且率领部队的人物，才会加入本场军阵。</p></div><label>检索人物<input data-card-search value="${esc(search)}" placeholder="姓名、朝代、技能" aria-label="检索人物卡"></label><button data-gallery-close aria-label="关闭人物牌册">关闭 ×</button></header><div class="cb-gallery-grid">${list.slice(galleryPage*12,galleryPage*12+12).map(d=>card({id:d.id,name:d.name,type:'general',attack:d.attack,hp:d.health,maxHp:d.health,tags:d.tags},'gallery-card',d)).join('')}</div><footer><button data-gallery-prev ${galleryPage===0?'disabled':''}>上一页</button><span>共${list.length}人 · 第${galleryPage+1}/${pages}页</span><button data-gallery-next ${galleryPage===pages-1?'disabled':''}>下一页</button></footer><aside data-gallery-detail><strong>点击人物卡查看生平依据与技能详情</strong></aside></section>`;
 }
 function bindGallery(){
  dialog.querySelector('[data-gallery-close]').onclick=()=>{gallery=false;render();};dialog.querySelector('[data-gallery-prev]').onclick=()=>{galleryPage--;render();};dialog.querySelector('[data-gallery-next]').onclick=()=>{galleryPage++;render();};
  dialog.querySelector('[data-card-search]').oninput=e=>{search=e.target.value;galleryPage=0;render();const input=dialog.querySelector('[data-card-search]');input.focus();input.setSelectionRange(search.length,search.length);};
  for(const el of dialog.querySelectorAll('[data-definition]'))el.onclick=()=>{const d=HISTORICAL_CARDS.find(d=>d.id===el.dataset.definition),p=personPresentation(d.person_id);dialog.querySelector('[data-gallery-detail]').innerHTML=`<strong>${esc(d.name)} · ${d.cost}费 ${d.attack}攻／${d.health}命 · ${esc(d.skill)}</strong><p>${esc(cardText(d))}</p><small>${esc(d.source?.dynasty??'')} · ${esc(d.design_basis)} · ${esc(d.evidence_status)}</small>${p?`<p>${esc(p.motif)} · 原创演出台词（非史料引文）：${esc(p.enterLine)} ${esc(p.skillLine)}</p>`:''}`;};
 }
 drag=createCardDrag(dialog,{
  intent(el){const b=battle(),c=b.cards,p=c.players.home;if(disposed||busy||auto||gallery||deckOpen||options.isPaused?.()||b.result||c.phase!=='play'||c.turn!=='home')return null;const heroSource=el.dataset.hero??el.dataset.heroFlag,id=el.dataset.card,mode=heroSource==='home'&&!!b.command.weaponAllocation?'hero-attack':el.hasAttribute('data-power')?'power':p.hand.includes(id)?'play':p.landmarks?.includes(id)?'landmark-use':p.board.includes(id)?'attack':null;if(!mode)return null;
   const actions=legalCardActions(b).filter(a=>a.type===mode&&(mode==='power'||mode==='hero-attack'||a.id===id));let reason='';
   if(!actions.length){if(mode==='hero-attack')reason=p.weapon?'本回合主将已攻击，或当前没有合法目标。':'请先装备武器。';else if(mode==='landmark-use')reason='地标仍在冷却或没有符合条件的友方目标。';else if(mode==='attack')reason=cardAttackStatus(b,id).reason;else if(mode==='play')reason=cardCost(b,id)>p.mana?`军令不足：需要${cardCost(b,id)}点，剩余${p.mana}点。`:(unit(c.catalog[id])||c.catalog[id]?.type==='landmark')&&fieldOccupancy(p)>=7?'战场7格已满，部队与设施共享场位；请先腾出位置。':'当前没有符合这张牌要求的合法目标。';else reason='军令不足或本回合主将技已使用。';}
   return {id,mode,actions,reason,ownHero:mode==='power'&&p.skill.kind==='command',secret:mode==='play'&&c.catalog[id]?.type==='secret',weapon:mode==='play'&&c.catalog[id]?.type==='weapon',troop:mode==='play'&&(unit(c.catalog[id])||c.catalog[id]?.type==='landmark')};
  },
  begin(item){selection=item.reason?null:{mode:item.mode,...(item.id?{id:item.id}:{})};notice=item.reason||'拖到高亮目标后松开；空白处松开或 Esc 取消。';render();if(item.actions.some(a=>!a.target))dialog.querySelectorAll(item.secret?'[data-secret-zone="home"],[data-hero="home"]':item.weapon?'[data-hero="home"],[data-equipped-weapon="home"]':item.troop?'.cb-row.home':'.cb-field').forEach(el=>el.classList.add('cb-drop-zone'));},
  drop(item,el){selection=null;if(disposed||busy)return;const b=battle(),c=b.cards;if(c.turn!=='home'||c.phase!=='play'||auto||gallery||deckOpen||options.isPaused?.()){render();return;}
   const cardEl=el?.closest('[data-card]'),heroEl=el?.closest('[data-hero],[data-hero-flag]'),side=heroEl?.dataset.hero??heroEl?.dataset.heroFlag,target=cardEl?.dataset.card??(side===(item.ownHero?'home':'enemy')?'hero':null);
   const action=dialog.contains(el)?item.actions.find(a=>a.target?target===a.target:!!el?.closest(item.secret?'[data-secret-zone="home"],[data-hero="home"],[data-hero-flag="home"]':item.weapon?'[data-hero="home"],[data-hero-flag="home"],[data-equipped-weapon="home"]':item.troop?'.cb-row.home':'.cb-field')):null;
   if(action){step(action);return;}notice=item.reason||(['attack','hero-attack'].includes(item.mode)?'已取消：请选择高亮敌军；护卫会阻挡攻击，突袭当回合不能攻击主将。':'已取消：请拖到高亮的合法场位或目标。');render();dialog.focus();
  },
  cancelled(reason){selection=null;notice=reason==='resize'?'窗口大小已变化，拖拽已取消，资源未消耗。':'拖拽已取消，资源未消耗。';if(!disposed){render();dialog.focus();}}
 });
 render();return {refresh:render,dispose:stop};
}
