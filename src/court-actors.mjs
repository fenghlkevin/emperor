import {CENTRAL_OFFICES} from './personnel.mjs';
import {officialArt,officialPortraitKey} from './official-art.mjs';
// Formation coordinates: horizontal center and foot depth, in scene percentages.
// Paired ranks follow the floor perspective towards the doorway.
export const COURT_ACTOR_SLOTS={
 'works-deputy':[28,46],'works-minister':[36,46],
 'justice-minister':[64,46],'justice-deputy':[72,46],
 'war-deputy':[22,59],'war-minister':[32,59],
 'rites-minister':[68,59],'rites-deputy':[78,59],
 'revenue-deputy':[14,72],'revenue-minister':[28,72],
 'personnel-minister':[72,72],'personnel-deputy':[86,72],
 'prime-minister':[22,84],'central-general':[78,84]
};
export function courtOccupant(domestic,officeId){return domestic.justice.officials.find(p=>p.status==='serving'&&(p.positionId===undefined?p.id:p.positionId)===officeId)??null;}
export function courtActorRecords(domestic){return CENTRAL_OFFICES.map(office=>{
 const person=courtOccupant(domestic,office.id),portraitKey=person?officialPortraitKey(person):null;
 const baseArt=person?officialArt(person):null;
 // The court uses its dedicated portrait, never the personal full-body artwork.
 const art=baseArt;
 return {office,person,slot:COURT_ACTOR_SLOTS[office.id],art,portraitKey};
});}
// Background-space calibration (1448 × 1086): floor lines converge near y=200;
// a doorway guard stands at y=360, with hat-to-sole height about 111 px.
// Equal-height people on a level floor obey h / (footY - horizonY) = constant.
export function courtPerspective(width,height,imageWidth=1448,imageHeight=1086){
 const scale=Math.max(width/imageWidth,height/imageHeight);
 const cropY=(height-imageHeight*scale)*.42; // Matches object-position: center 42%.
 const horizon=200/1086*imageHeight*scale+cropY;
 return {horizon,bodyHeight:foot=>(foot-horizon)*111/160};
}
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
 const controller=new AbortController(),actors=[],records=courtActorRecords(domestic);let disposed=false,loaded=false,frame=0;
 if(records.some(r=>r.person&&!r.art?.court)){scene.querySelector(':scope>img').src='assets/scenes/court/sketch-court-emperor-pov-v7.png';scene.dataset.courtReady='fallback';return ()=>{};}
 scene.classList.add('has-court-actors');scene.dataset.courtReady='loading';
 const caption=document.createElement('span');caption.className='court-person-caption';caption.hidden=true;caption.setAttribute('aria-hidden','true');scene.append(caption);
 function syncCaption(){const actor=actors.find(a=>a.button.matches('.is-actor-hover,.is-focused,:focus-visible'))??actors.find(a=>a.button.classList.contains('selected'));caption.hidden=!actor;if(!actor)return;const [office,name]=actor.button.getAttribute('aria-label').split(' · ');caption.replaceChildren();const role=document.createElement('small'),person=document.createElement('strong');role.textContent=office;person.textContent=name;caption.append(role,person);const [center,foot,height]=actor.displaySlot??actor.slot;caption.style.top=`${foot-height*.05}%`;const half=caption.offsetWidth/2;const x=scene.clientWidth*center/100;caption.style.left=`${Math.max(half+8,Math.min(scene.clientWidth-half-8,x))}px`;}
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
 function paint(){if(disposed||!loaded)return;const bounds=scene.getBoundingClientRect();if(!bounds.width||!bounds.height)return;
  // Anchor the back row to the doorway floor and fit the formation before the desk.
  // The desk's rear edge is below its transparent upper margin.
  const desk=scene.parentElement.querySelector('.court-desk')?.getBoundingClientRect();
  const rear=desk?desk.top+(desk.height>=260?43:23):bounds.bottom;
  const background=scene.querySelector(':scope>img');
  const perspective=courtPerspective(bounds.width,bounds.height,background.naturalWidth||1448,background.naturalHeight||1086);
  const frontFoot=Math.max(...actors.map(a=>a.slot[1]));
  const originalBack=Math.min(...actors.map(a=>a.slot[1])),backFoot=46;
  const visibleFront=Math.min(frontFoot,(rear-bounds.top-14)/bounds.height*100);
  const depth=frontFoot-originalBack;
  const depthScale=depth>0?Math.max(0,(visibleFront-backFoot)/depth):0;
  for(const actor of actors){const {button,canvas,source,slot}=actor;const [center,originalFoot]=slot;const foot=backFoot+(originalFoot-originalBack)*depthScale;const height=perspective.bodyHeight(bounds.height*foot/100)/bounds.height*100;actor.displaySlot=[center,foot,height];
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
 ready.then(()=>{if(disposed)return;loaded=true;paint();scene.dataset.courtReady='true';}).catch(error=>{if(disposed)return;
  disposed=true;controller.abort();observer.disconnect();captionObserver.disconnect();caption.remove();cancelAnimationFrame(frame);
  scene.classList.remove('has-court-actors');scene.style.cursor='';
  scene.querySelector(':scope>img').src='assets/scenes/court/sketch-court-emperor-pov-v7.png';
  for(const {button,html,style,label,title} of originalButtons){button.replaceChildren();button.innerHTML=html;button.setAttribute('style',style??'');button.setAttribute('aria-label',label);button.title=title;button.classList.remove('court-person','is-vacant','is-actor-hover');delete button.dataset.personId;delete button.dataset.portraitKey;}
  scene.dataset.courtReady='fallback';console.error('朝堂立绘加载失败，已恢复群臣场景',error);
 });
 return ()=>{disposed=true;controller.abort();observer.disconnect();captionObserver.disconnect();caption.remove();cancelAnimationFrame(frame);};
}
