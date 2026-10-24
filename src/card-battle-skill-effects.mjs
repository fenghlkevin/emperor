import {personDeathSegments} from './card-battle-person-death-presentation.mjs';
import {personPresentation,personMotifMarkup} from './card-battle-person-presentations.mjs';
import {cardText,battlePerson} from './card-battle.mjs';
// Presentation only: consumes committed engine events and never changes battle state.
const other=side=>side==='home'?'enemy':'home';
const impactTypes=new Set(['damage','heal','buff','armor','shield','freeze','silence']);
const tones={fire:'fire',precision:'volley',arrows:'volley',barrage:'volley',execute:'slash',heal:'heal',fortify:'shield',brace:'shield',assault:'buff',pin:'freeze',dispel:'silence',supply:'draw',coin:'command'};
export function createCardSkillEffects({stage,animate,ghost,removeGhost,position,node,track,isDisposed,cardFace}){
 function add(className,rect){const el=document.createElement('div');el.className=className;if(rect){el.style.left=rect.x+'px';el.style.top=rect.y+'px';el.style.width=rect.w+'px';el.style.height=rect.h+'px';}stage.append(el);track(el);return el;}
 function mark(rect,kind,label=''){
  const size=Math.max(78,Math.min(stage.clientWidth*.17,Math.max(rect.w,rect.h)*1.2)),el=add('cb-skill-impact '+kind,{x:rect.x+rect.w/2-size/2,y:rect.y+rect.h/2-size/2,w:size,h:size});
  for(const part of ['aura','ring','core']){const item=document.createElement('i');item.className='cb-skill-'+part;el.append(item);}
  if(label){const text=document.createElement('b');text.textContent=label;el.append(text);}
  const jobs=[animate(el,[{opacity:0,transform:'scale(.45)'},{opacity:1,transform:'scale(1)',offset:.2},{opacity:.9,transform:'scale(1.12)',offset:.55},{opacity:0,transform:'scale(1.38)'}],880)];
  for(let i=0;i<16;i++){const p=document.createElement('i');p.className='cb-skill-particle';el.append(p);const angle=i*Math.PI/8,dist=size*(.38+(i%3)*.09),dx=Math.cos(angle)*dist,dy=Math.sin(angle)*dist;
   jobs.push(animate(p,[{opacity:0,transform:'translate(-50%,-50%) scale(.2)'},{opacity:1,transform:`translate(calc(-50% + ${dx*.25}px),calc(-50% + ${dy*.25}px)) scale(1)`,offset:.2},{opacity:0,transform:`translate(calc(-50% + ${dx}px),calc(-50% + ${dy}px)) rotate(${i*29}deg) scale(.35)`}],780));
  }
  return Promise.all(jobs).finally(()=>removeGhost(el));
 }
 async function missile(from,to,kind){
  if(!from||!to||isDisposed())return;const volley=kind==='volley',count=volley?7:kind==='fire'?5:1,jobs=[];
  for(let i=0;i<count;i++){
   const el=add('cb-skill-missile '+(volley?'volley':kind)),sx=from.x+from.w/2+(i-(count-1)/2)*5,sy=from.y+from.h*.4,tx=to.x+to.w/2+(i-(count-1)/2)*to.w*.09,ty=to.y+to.h*.48+(i%3-1)*6,dx=tx-sx,dy=ty-sy;
   el.style.left=sx+'px';el.style.top=sy+'px';const angle=Math.atan2(dy,dx);
   jobs.push(animate(el,[{opacity:0,transform:`rotate(${angle}rad) scale(.3)`},{opacity:1,transform:`translate(${dx*.15}px,${dy*.15}px) rotate(${angle}rad) scale(1)`,offset:.2},{opacity:1,transform:`translate(${dx}px,${dy}px) rotate(${angle}rad) scale(1.15)`}],volley?360+i*18:380+i*15,{easing:'cubic-bezier(.45,0,.85,.6)'}).finally(()=>removeGhost(el)));
  }
  await Promise.all(jobs);
 }
 // Return after the wind-up; hit reactions can now run alongside the committed events.
 async function begin(before,after,action,snapshots){
  const c=before.cards,side=c.turn,card=action.type==='play'?c.catalog[action.id]:null,power=action.type==='power';
  const sourcePerson=power?battlePerson(before,before.units.find(u=>u.side===side&&u.commander)):card?.personId?before.cardPeople[card.personId]:null,profile=personPresentation(sourcePerson?.historicalDefinitionId);
  if(!power&&(!card||(!card.definition.enter.length&&!profile)))return null;
  const definition=card?.definition,name=power?c.players[side].skill.name:definition.skill??card.name,kind=power?(c.players[side].skill.kind==='command'?'heal':c.players[side].skill.kind==='intelligence'?'draw':'command'):(tones[definition.id]??'buff');
  const banner=add('cb-cast-banner '+kind),caption=document.createElement('small'),title=document.createElement('strong');caption.textContent=(side==='home'?'我军':'敌军')+' · '+(power?'主将技':card.type==='tactic'?'施放计策':definition.enter.length?'登场技能':'人物登场');title.textContent=name;const description=document.createElement('p');description.textContent=power?c.players[side].skill.text:cardText(definition);banner.append(caption,title,description);
  let motif=null;
  if(profile){banner.dataset.personPresentation=profile.id;banner.dataset.personTheme=profile.theme;motif=document.createElement('span');motif.className='cb-person-cinematic';motif.innerHTML=personMotifMarkup(profile.id);banner.prepend(motif);const arrival=document.createElement('small');arrival.className='cb-person-arrival';arrival.textContent=sourcePerson.name+' · '+profile.motif+(power?'':' · '+profile.enterLine);const subtitle=document.createElement('em');subtitle.className='cb-person-subtitle';subtitle.textContent='「'+(power?profile.commandLine:profile.skillLine)+'」';banner.append(arrival,subtitle);}
  const jobs=[animate(banner,[{opacity:0,transform:'translate(-50%,-50%) scaleX(.96)'},{opacity:1,transform:'translate(-50%,-50%) scaleX(1)',offset:.06},{opacity:1,offset:.9},{opacity:0,transform:'translate(-50%,-58%) scaleX(1.05)'}],3300).finally(()=>removeGhost(banner))];
  if(motif){const frames=profile.theme==='council-map'?[{opacity:.2,clipPath:'inset(0 100% 0 0)'},{opacity:1,clipPath:'inset(0 0 0 0)',offset:.45},{opacity:1}]:profile.theme==='supply-granary'?[{opacity:.2,transform:'translateY(12px) scale(.8)'},{opacity:1,transform:'translateY(0) scale(1)',offset:.4},{opacity:.65,transform:'scale(1.08)',offset:.7},{opacity:1,transform:'scale(1)'}]:[{opacity:.2,transform:'skewX(-12deg) translateX(-8px)'},{opacity:1,transform:'skewX(5deg) translateX(0)',offset:.35},{opacity:1,transform:'skewX(-3deg)',offset:.65},{opacity:1,transform:'skewX(0)'}];jobs.push(animate(motif,frames,1900));}
  let origin=position(power?(side==='home'?stage.querySelector('[data-power]'):node(side+'-hero')):node(card.id))??snapshots.get(card?.id)?.rect??position(node(side+'-hero'));
  let windup;
  if(card?.type==='tactic'){
   const record=snapshots.get(card.id),r=record?.rect??position(stage.querySelector('.cb-backhand')),target={x:stage.clientWidth*.435,y:stage.clientHeight*.34,w:stage.clientWidth*.13,h:stage.clientWidth*.13*1.4};
   const face=record?.html??cardFace?.(card)??`<div class="cb-cast-scroll">${name.replace(/[<>&]/g,'')}</div>`;
   const cast=ghost(face,r,'cb-fx-cast-card');if(cast&&r){origin=target;windup=animate(cast,[{opacity:.5,transform:'translate(0,0) scale(.7)'},{opacity:1,transform:`translate(${target.x-r.x}px,${target.y-r.y}px) scale(${target.w/r.w},${target.h/r.h}) rotate(-3deg)`}],350,{fill:'forwards'}).then(()=>{
    if(isDisposed())return;cast.style.left=target.x+'px';cast.style.top=target.y+'px';cast.style.width=target.w+'px';cast.style.height=target.h+'px';
    return animate(cast,[{opacity:1,transform:'rotate(0deg)'},{opacity:1,transform:'rotate(0deg)'}],1900).then(()=>{if(isDisposed())return;jobs.push(animate(cast,[{opacity:1,transform:'scale(1)'},{opacity:1,transform:'scale(1)',offset:.25},{opacity:0,transform:'translateY(-12px) scale(.98)'}],650).finally(()=>removeGhost(cast)));});
   });}
  }
  if(!windup&&origin){const light=add('cb-skill-source '+kind,origin);windup=animate(light,[{opacity:0,transform:'scale(.8)'},{opacity:.8,transform:'scale(1.12)',offset:.2},{opacity:.8,transform:'scale(1.12)',offset:.85},{opacity:0,transform:'scale(1.3)'}],1900).finally(()=>removeGhost(light));}
  await windup;if(isDisposed())return {done:Promise.all(jobs)};
  const flights=[],impacts=[];
  const deathIndices=new Set(personDeathSegments(after).flatMap(s=>s.indices));
  const effects=after.cards.events.filter((e,i)=>impactTypes.has(e.type)&&!deathIndices.has(i)),seen=new Set();
  for(const event of effects){
   const eventKind=event.type==='heal'?'heal':event.type==='armor'||event.type==='shield'?'shield':event.type==='freeze'?'freeze':event.type==='silence'?'silence':event.type==='buff'?'buff':kind;
   const key=event.target+':'+eventKind;if(seen.has(key))continue;seen.add(key);
   const target=position(node(event.target))??snapshots.get(event.target)?.rect;if(!target)continue;
   if(origin&&event.target!==side+'-hero')flights.push(missile(origin,target,eventKind));impacts.push(()=>mark(target,eventKind));
  }
  if(!effects.length||kind==='draw'){
   const target=position(stage.querySelector(kind==='draw'?'.cb-deck.'+side:'.cb-mana'))??origin;
   if(target){if(origin)flights.push(missile(origin,target,kind));impacts.push(()=>mark(target,kind,kind==='draw'?'调度':kind==='command'?'军令':'军令生效'));}
  }
  if(card?.definition.enter.some(f=>f.op==='aoe')&&!effects.length){const target=position(stage.querySelector('.cb-row.'+other(side)));if(target)jobs.push(mark(target,kind));}
  await Promise.all(flights);if(!isDisposed())jobs.push(...impacts.map(hit=>hit()));
  return {done:Promise.all(jobs)};
 }
 async function death(segment,snapshots){
  if(isDisposed())return;
  const {profile}=segment,banner=add('cb-cast-banner cb-person-death-banner '+segment.kind);
  stage.dataset.deathPhase='windup';stage.dataset.deathSource=segment.id;
  banner.dataset.personPresentation=segment.personId;banner.dataset.personTheme=profile.theme;banner.dataset.deathSource=segment.id;
  const motif=document.createElement('span');motif.className='cb-person-cinematic';motif.innerHTML=personMotifMarkup(segment.personId);
  for(const [tag,cls,text] of [['small','','遗计 · '+segment.name],['strong','',segment.skill],['p','',segment.description],['small','cb-person-arrival',profile.motif],['em','cb-person-subtitle','「'+segment.line+'」']]){const el=document.createElement(tag);el.className=cls;el.textContent=text;banner.append(el);}
  banner.prepend(motif);
  const record=snapshots.get(segment.id),leaving=record?ghost(record.html,record.rect,'cb-fx-death cb-fx-person-death'):null;
  const hp=leaving?.querySelector('.cb-health');if(hp)hp.firstChild.textContent='0';
  const departure=leaving?animate(leaving,[{opacity:1,filter:'brightness(1.25)'},{opacity:0,transform:'translateY(-16px) scale(.85)',filter:'sepia(1) blur(3px)'}],350).finally(()=>removeGhost(leaving)):Promise.resolve();
  try{await Promise.all([departure,animate(banner,[{opacity:0,transform:'translate(-50%,-50%) scale(.94)'},{opacity:1,transform:'translate(-50%,-50%) scale(1)',offset:.12},{opacity:1}],1500),animate(motif,[{opacity:.2,transform:'translateY(14px)'},{opacity:1,transform:'translateY(0)',offset:.4},{opacity:1}],1500)]);if(!isDisposed())stage.dataset.deathPhase='impact';}finally{removeGhost(banner);}
 }
 return {begin,death,impact:mark,land:rect=>mark({x:rect.x,y:rect.y+rect.h*.68,w:rect.w,h:rect.h*.32},'deploy')};
}
