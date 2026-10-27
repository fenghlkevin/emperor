import {buildEndingAssessment,plainInscription} from './ending-assessment.mjs';
export const ENDING_SCENES={
 '寿元已尽':{title:'宫灯长寂',art:0,effect:'candle',tone:'dusk'},
 '禅让':{title:'传玺归闲',art:1,effect:'seal',tone:'gold'},
 '升仙':{title:'功成归天',art:'ascension',effect:'cloud',tone:'jade'},
 '病逝':{title:'雨歇深宫',art:2,effect:'rain',tone:'blue'},
 '遇刺':{title:'惊驾成殇',art:3,effect:'storm',tone:'iron'},
 '服毒':{title:'一盏长辞',art:4,effect:'smoke',tone:'plum'},
 '亡国':{title:'故国烟尘',art:5,effect:'embers',tone:'ember'}
};
const esc=t=>String(t??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const ENDING_ART={ascension:new URL('../assets/endings/ascension-v1.png',import.meta.url).href,atlas:new URL('../assets/endings/reign-scenes-v1.png',import.meta.url).href};
export function playEnding(state,{onFinish=()=>{},sample=false,writeInterval=105}={}){
 const existing=document.querySelector('.ending-cinematic');if(existing)return null;
 const result=state.reignResult;if(!result)throw Error('尚未生成本朝终评');
 const assessment=result.assessment??buildEndingAssessment(state,result),scene=ENDING_SCENES[result.reason]??ENDING_SCENES['寿元已尽'];
 const film=document.createElement('dialog');film.className=`ending-cinematic ending-tone-${scene.tone}`;film.dataset.reason=result.reason;film.dataset.profile=assessment.id;film.dataset.effect=scene.effect;film.setAttribute('aria-label',`${result.reason}结局演出`);
 const artwork=scene.art==='ascension'?`<img class="ending-art" src="${ENDING_ART.ascension}" alt="帝王远望云海天阙">`:`<svg class="ending-art" viewBox="${scene.art%3*200} ${Math.floor(scene.art/3)*100} 200 100" preserveAspectRatio="xMidYMid slice" role="img" aria-label="${scene.title}"><image href="${ENDING_ART.atlas}" width="600" height="200" preserveAspectRatio="none"/></svg>`;
 film.innerHTML=`<div class="ending-world">${artwork}<div class="ending-light"></div><div class="ending-haze"></div><canvas aria-hidden="true"></canvas>${scene.effect==='seal'?'<div class="ending-seal" aria-hidden="true">传国之玺</div>':''}</div><header class="ending-header"><span>皇 帝 <small>宫廷纪事</small></span><span>${esc(plainInscription(result.reason))}终章</span></header><section class="ending-scroll"><small class="ending-kicker">太史公曰</small><h1>${scene.title}</h1><div class="ending-biography" tabindex="0" aria-label="竖排史官评传 可横向滚动阅览"><p aria-label="${esc(assessment.text)}"></p></div><div class="ending-verdict" hidden><span>${assessment.id==='zhou'?'史鉴':'史称'}</span><strong>${esc(assessment.title)}</strong><em>${esc(assessment.verdict)}</em></div></section><footer class="ending-footer"><div><small>${sample?'隔离演示 不改变游戏存档':`${esc(plainInscription(result.name))}本朝史卷`}</small><div class="ending-controls"><button data-ending-pause>暂停观景</button><button data-ending-replay>重览</button><button data-ending-complete>直接阅全文</button><button data-ending-start hidden>回卷首</button></div></div><button data-ending-finish autofocus>查阅本朝终评 →</button></footer>`;
 const previous=document.activeElement;document.body.append(film);film.showModal();
 const paragraph=film.querySelector('.ending-biography p'),viewport=film.querySelector('.ending-biography'),verdict=film.querySelector('.ending-verdict'),completeButton=film.querySelector('[data-ending-complete]'),startButton=film.querySelector('[data-ending-start]');
 const characters=Array.from(assessment.text),reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
 let written=0,inkTime=0,time=0,last=performance.now(),paused=false,done=false,frame;
 function writeOne(){if(written>=characters.length)return;const span=document.createElement('span');span.className='ending-ink';span.textContent=characters[written++];span.setAttribute('aria-hidden','true');paragraph.append(span);const rect=span.getBoundingClientRect();if(rect.left<viewport.getBoundingClientRect().left+3)viewport.scrollLeft-=parseFloat(getComputedStyle(paragraph).lineHeight);if(written===characters.length){verdict.hidden=false;completeButton.hidden=true;startButton.hidden=false;}}
 function complete(){while(written<characters.length)writeOne();paragraph.querySelectorAll('.ending-ink').forEach(el=>el.classList.add('is-dry'));}
 function togglePause(value){paused=value;film.querySelector('[data-ending-pause]').textContent=paused?'继续观景':'暂停观景';for(const a of film.querySelector('.ending-world').getAnimations({subtree:true})){paused?a.pause():a.play();}}
 function replay(){paragraph.replaceChildren();written=0;inkTime=0;time=0;viewport.scrollLeft=0;verdict.hidden=true;completeButton.hidden=false;startButton.hidden=true;togglePause(false);for(const a of film.querySelector('.ending-world').getAnimations({subtree:true}))a.currentTime=0;if(reduced)complete();}
 function dispose(){if(done)return;done=true;cancelAnimationFrame(frame);resize.disconnect();observer.disconnect();film.remove();if(previous?.isConnected)previous.focus();}
 function finish(){if(done)return;dispose();onFinish();}
 film.querySelector('[data-ending-pause]').onclick=()=>togglePause(!paused);film.querySelector('[data-ending-replay]').onclick=replay;completeButton.onclick=complete;startButton.onclick=()=>{viewport.scrollLeft=0;};film.querySelector('[data-ending-finish]').onclick=finish;
 film.addEventListener('cancel',e=>{e.preventDefault();finish();});film.addEventListener('close',()=>{if(!done)finish();});
 const canvas=film.querySelector('canvas'),ctx=canvas.getContext('2d');let width=1,height=1;const resize=new ResizeObserver(()=>{width=canvas.width=Math.max(1,film.clientWidth);height=canvas.height=Math.max(1,film.clientHeight);});resize.observe(film);
 const observer=new MutationObserver(()=>{if(!film.isConnected)dispose();});observer.observe(document.body,{childList:true});
 const vapor=document.createElement('canvas');vapor.width=768;vapor.height=256;const vc=vapor.getContext('2d');for(let i=0;i<55;i++){const x=i*137%768,y=100+Math.sin(i*1.7)*50,r=25+i*37%85,g=vc.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,'rgba(205,215,204,.12)');g.addColorStop(1,'rgba(205,215,204,0)');vc.fillStyle=g;vc.fillRect(x-r,y-r,r*2,r*2);}vc.globalCompositeOperation='destination-in';const feather=vc.createLinearGradient(0,0,0,256);for(const [n,c]of [[0,'transparent'],[.3,'#000'],[.65,'#000'],[1,'transparent']])feather.addColorStop(n,c);vc.fillStyle=feather;vc.fillRect(0,0,768,256);
 function atmosphere(){ctx.clearRect(0,0,width,height);if(reduced)return;const t=time/1000;
 ctx.save();ctx.globalCompositeOperation='screen';for(let layer=0;layer<3;layer++){const span=width*1.5,offset=((t*[12,-18,26][layer])%span+span)%span;ctx.globalAlpha=scene.effect==='cloud'?.3:scene.effect==='smoke'?.5:.16;for(let tile=-1;tile<2;tile++)ctx.drawImage(vapor,tile*span+offset-span*.5,height*[.3,.5,.68][layer],span,height*.3);}ctx.restore();
 if(['rain','storm'].includes(scene.effect)){ctx.strokeStyle='rgba(187,211,225,.25)';ctx.lineWidth=.8;for(let i=0;i<90;i++){const x=((i*7919)%1000)/1000*width+(t*70)%120,y=(((i*3571)%1000)/1000*height+t*(180+i%6*25))%height;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x-7,y+20);ctx.stroke();}}
 else if(scene.effect==='embers'){for(let i=0;i<52;i++){const x=(i*137%1000)/1000*width+Math.sin(t+i)*17,y=height-((i*47+t*(16+i%7))%height);ctx.fillStyle=`rgba(238,${125+i%50},62,${.2+i%5*.1})`;ctx.beginPath();ctx.arc(x,y,1+i%3*.4,0,Math.PI*2);ctx.fill();}}
 else{for(let i=0;i<24;i++){ctx.fillStyle='rgba(232,208,150,.3)';ctx.beginPath();ctx.arc(i*719%1000/1000*width,height-(i*137+t*7)%height,.6+i%3*.3,0,Math.PI*2);ctx.fill();}}
 }
 function tick(now){if(done)return;const dt=Math.min(80,now-last);last=now;if(!paused){time+=dt;inkTime+=dt;while(inkTime>=writeInterval&&written<characters.length){inkTime-=writeInterval;writeOne();}atmosphere();}frame=requestAnimationFrame(tick);}
 if(reduced)complete();frame=requestAnimationFrame(tick);
 return {finish,dispose,complete,replay,element:film};
}
