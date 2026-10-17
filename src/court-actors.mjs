import {CENTRAL_OFFICES} from './personnel.mjs';
import {officialArt,officialPortraitKey} from './official-art.mjs';
// Percentage of the approved background: center x, foot y and complete body height.
export const COURT_ACTOR_SLOTS={
 'prime-minister':[23,88,47],
 'revenue-deputy':[16.5,77,44],'revenue-minister':[28.8,78,43],
 'war-deputy':[23.2,61,34],'war-minister':[33.3,64,35],
 'works-deputy':[27.5,49,26],'works-minister':[36.9,51,26],
 'central-general':[77,88,48],
 'personnel-minister':[71.2,77,43.5],'personnel-deputy':[83.6,75,42.5],
 'rites-minister':[67,63,35.5],'rites-deputy':[77.4,62,35],
 'justice-minister':[72.2,49.5,26]
};
export function courtOccupant(domestic,officeId){return domestic.justice.officials.find(p=>p.status==='serving'&&(p.positionId===undefined?p.id:p.positionId)===officeId)??null;}
export function courtActorRecords(domestic){return CENTRAL_OFFICES.map(office=>{
 const person=courtOccupant(domestic,office.id),portraitKey=person?officialPortraitKey(person):null;
 const baseArt=person?officialArt(person):null;
 // The court uses its dedicated portrait, never the personal full-body artwork.
 const art=baseArt;
 return {office,person,slot:COURT_ACTOR_SLOTS[office.id],art,portraitKey};
});}
const cache=new Map();
function loadArt(src){if(!cache.has(src))cache.set(src,(async()=>{
 const img=new Image();img.src=src;await img.decode();
 const plane=document.createElement('canvas');plane.width=img.naturalWidth;plane.height=img.naturalHeight;
 const ctx=plane.getContext('2d',{willReadFrequently:true});ctx.drawImage(img,0,0);
 const {data,width,height}=ctx.getImageData(0,0,plane.width,plane.height);
 let left=width,top=height,right=0,bottom=0;
 for(let y=0;y<height;y++)for(let x=0;x<width;x++)if(data[(y*width+x)*4+3]>64){left=Math.min(left,x);right=Math.max(right,x);top=Math.min(top,y);bottom=Math.max(bottom,y);}
 if(right<=left||bottom<=top)throw Error('人物透明轮廓为空');
 return {img,left,top,width:right-left+1,height:bottom-top+1};
})().catch(error=>{cache.delete(src);throw error;}));return cache.get(src);}
export function alphaHit(mask,x,y){if(!mask||x<0||y<0||x>=mask.width||y>=mask.height)return false;return mask.data[(Math.floor(y)*mask.width+Math.floor(x))*4+3]>64;}
export function mountCourtActors(scene,domestic){
 const controller=new AbortController(),actors=[],records=courtActorRecords(domestic);let disposed=false,frame=0;
 if(records.some(r=>r.person&&!r.art?.court)){scene.querySelector(':scope>img').src='assets/sketch-court-emperor-pov-v7.png';scene.dataset.courtReady='fallback';return ()=>{};}
 scene.classList.add('has-court-actors');scene.dataset.courtReady='loading';
 const caption=document.createElement('span');caption.className='court-person-caption';caption.hidden=true;caption.setAttribute('aria-hidden','true');scene.append(caption);
 function syncCaption(){const actor=actors.find(a=>a.button.matches('.is-actor-hover,.is-focused,:focus-visible'))??actors.find(a=>a.button.classList.contains('selected'));caption.hidden=!actor;if(!actor)return;caption.textContent=actor.button.getAttribute('aria-label');const [center,foot,height]=actor.slot;caption.style.top=`${foot-height*.05}%`;const half=caption.offsetWidth/2;const x=scene.clientWidth*center/100;caption.style.left=`${Math.max(half+8,Math.min(scene.clientWidth-half-8,x))}px`;}
 const captionObserver=new MutationObserver(syncCaption);
 scene.addEventListener('focusin',syncCaption,{signal:controller.signal});scene.addEventListener('focusout',()=>queueMicrotask(syncCaption),{signal:controller.signal});
 const originalButtons=records.map(({office})=>{const button=scene.querySelector(`[data-entry="${office.id}"]`);return {button,html:button.innerHTML,style:button.getAttribute('style'),label:button.getAttribute('aria-label'),title:button.title};});
 const ready=Promise.all(records.map(async record=>{
  const {office,person,slot,art,portraitKey}=record,button=scene.querySelector(`[data-entry="${office.id}"]`);
  button.style.clipPath='none';
  button.classList.add('court-person');button.dataset.personId=person?.id??'';button.dataset.portraitKey=portraitKey??'';
  button.setAttribute('aria-label',`${office.name} · ${person?.name??'空缺'}`);
  // The scene caption already names the actor; a native tooltip would duplicate it.
  button.removeAttribute('title');
  button.replaceChildren();
  if(!person){button.classList.add('is-vacant');button.style.pointerEvents='none';return;}
  if(!art?.court)throw Error(`${person.name}朝堂立绘未就绪`);
  const source=await loadArt(art.court);if(disposed)return;
  const canvas=document.createElement('canvas');canvas.className='court-person-canvas';canvas.setAttribute('aria-hidden','true');button.append(canvas);
  captionObserver.observe(button,{attributes:true,attributeFilter:['class']});
  actors.push({button,canvas,source,slot,mask:null});
 }));
 function paint(){if(disposed)return;const bounds=scene.getBoundingClientRect();if(!bounds.width||!bounds.height)return;
  for(const actor of actors){const {button,canvas,source,slot}=actor;const [center,foot,height]=slot;
   const cssHeight=bounds.height*height/100,cssWidth=cssHeight*source.width/source.height;
   Object.assign(button.style,{left:`${center}%`,top:`${foot-height}%`,width:`${cssWidth}px`,height:`${cssHeight}px`,transform:'translateX(-50%)',zIndex:String(Math.round(foot))});
   const scale=Math.min(devicePixelRatio||1,2);canvas.width=Math.max(1,Math.round(cssWidth*scale));canvas.height=Math.max(1,Math.round(cssHeight*scale));
   const ctx=canvas.getContext('2d',{willReadFrequently:true});ctx.drawImage(source.img,source.left,source.top,source.width,source.height,0,0,canvas.width,canvas.height);
   actor.mask=ctx.getImageData(0,0,canvas.width,canvas.height);
  }
  syncCaption();
 }
 const observer=new ResizeObserver(()=>{cancelAnimationFrame(frame);frame=requestAnimationFrame(paint);});observer.observe(scene);
 function pick(event){return [...actors].sort((a,b)=>b.slot[1]-a.slot[1]).find(({canvas,mask})=>{const r=canvas.getBoundingClientRect();return r.width&&r.height&&alphaHit(mask,(event.clientX-r.left)*canvas.width/r.width,(event.clientY-r.top)*canvas.height/r.height);});}
 scene.addEventListener('pointermove',event=>{if(event.target.closest('.scene-heading,footer,#next'))return;const hit=pick(event);for(const a of actors)a.button.classList.toggle('is-actor-hover',a===hit);scene.style.cursor=hit?'pointer':'';},{signal:controller.signal});
 scene.addEventListener('pointerleave',()=>{for(const a of actors)a.button.classList.remove('is-actor-hover');scene.style.cursor='';},{signal:controller.signal});
 scene.addEventListener('click',event=>{
  if(event.detail===0||event.target.closest('.scene-heading,footer,#next'))return;
  event.preventDefault();event.stopImmediatePropagation();pick(event)?.button.click();
 },{capture:true,signal:controller.signal});
 ready.then(()=>{if(disposed)return;paint();scene.dataset.courtReady='true';}).catch(error=>{if(disposed)return;
  disposed=true;controller.abort();observer.disconnect();captionObserver.disconnect();caption.remove();cancelAnimationFrame(frame);
  scene.classList.remove('has-court-actors');scene.style.cursor='';
  scene.querySelector(':scope>img').src='assets/sketch-court-emperor-pov-v7.png';
  for(const {button,html,style,label,title} of originalButtons){button.replaceChildren();button.innerHTML=html;button.setAttribute('style',style??'');button.setAttribute('aria-label',label);button.title=title;button.classList.remove('court-person','is-vacant','is-actor-hover');delete button.dataset.personId;delete button.dataset.portraitKey;}
  scene.dataset.courtReady='fallback';console.error('朝堂立绘加载失败，已恢复群臣场景',error);
 });
 return ()=>{disposed=true;controller.abort();observer.disconnect();captionObserver.disconnect();caption.remove();cancelAnimationFrame(frame);};
}
