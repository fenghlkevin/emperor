export const OPENING_DURATION = 30000;
export const OPENING_SHOTS = [
  {title:'紫禁初晓', text:'九重宫阙开，万象待新君。'},
  {title:'宫门启御', text:'承社稷之重，临天下之广。'},
  {title:'百官朝贺', text:'文武列班，恭迎新君。'},
  {title:'诏告天下', text:'敬天法祖，勤政爱民。'},
  {title:'皇 帝', text:'一朝登九五，万事系苍生。'},
];
const clamp=x=>Math.max(0,Math.min(1,x));
const ease=x=>{x=clamp(x);return x*x*(3-2*x);};
const ASSETS='assets/cinematics/';

// Timeline controls the individual cutout layers, including the officials' upper bodies.
export function paintOpening(film,seconds,reduced=false){
  const t=Math.max(0,Math.min(30,seconds));
  film.dataset.time=t.toFixed(2);
  const phase=t<5?0:t<12?1:t<19?2:t<25?3:4;
  film.dataset.phase=String(phase);
  const set=(key,value)=>film.style.setProperty(key,String(value));
  set('--hall',ease((t-4.5)/1.5));
  set('--gate',ease((t-5.3)/4));
  set('--cloud-x',`${reduced?0:t*1.8}%`);
  set('--cloud-y',`${reduced?0:Math.sin(t*.5)*6}px`);
  set('--emperor',ease((t-9)/2));
  set('--court',ease((t-10.5)/2));
  const bow=reduced?0:Math.pow(Math.max(0,Math.sin((t-12)/7*Math.PI)),2)*(t>=12&&t<19?1:0);
  set('--bow',`${bow*33}deg`);
  set('--bow-scale',1-bow*.16);
  set('--robe',`${reduced?0:Math.sin(t*1.2)*.35}deg`);
  set('--scroll',ease((t-19)/1.2)*(1-ease((t-24)/1)));
  set('--scroll-open',ease((t-19.5)/1.5));
  set('--title',ease((t-25)/1.8));
  set('--ink',ease((t-25.6)/1.4));
  set('--seal',ease((t-27.5)/.5));
  set('--progress',t/30);
  set('--fade',ease(t/.9)*(1-ease((t-29.3)/.7)));
  const caption=film.querySelector('.opening-caption');
  const shot=OPENING_SHOTS[phase];
  caption.querySelector('span').textContent=shot.title;
  caption.querySelector('p').textContent=shot.text;
}

function createMusic(){
  const Context=window.AudioContext||window.webkitAudioContext;
  if(!Context)return null;
  const ctx=new Context();
  let timer,step=0;
  const notes=[146.83,220,293.66,329.63,293.66,220,196,146.83,196,220,293.66,440,329.63,293.66,220,196];
  const pluck=()=>{
    const now=ctx.currentTime,f=notes[step++%notes.length];
    for(const harmonic of [1,2,3]){
      const osc=ctx.createOscillator(),gain=ctx.createGain();
      osc.type='sine';osc.frequency.value=f*harmonic;
      gain.gain.setValueAtTime(.0001,now);gain.gain.exponentialRampToValueAtTime(.065/harmonic,now+.015);gain.gain.exponentialRampToValueAtTime(.0001,now+1.7);
      osc.connect(gain);gain.connect(ctx.destination);osc.start(now);osc.stop(now+1.8);
    }
    if(step%4===1){
      const drum=ctx.createOscillator(),gain=ctx.createGain();
      drum.frequency.setValueAtTime(110,now);drum.frequency.exponentialRampToValueAtTime(36,now+.4);
      gain.gain.setValueAtTime(.12,now);gain.gain.exponentialRampToValueAtTime(.0001,now+.8);
      drum.connect(gain);gain.connect(ctx.destination);drum.start(now);drum.stop(now+.9);
    }
  };
  return {async start(){await ctx.resume();pluck();timer=setInterval(pluck,700);},stop(){clearInterval(timer);void ctx.close();}};
}

export function playOpening({duration=OPENING_DURATION}={}) {
  if(document.querySelector('.opening-cinematic'))return;
  const previous=document.activeElement;
  const film=document.createElement('dialog');
  film.className='opening-cinematic';
  film.setAttribute('aria-label','皇帝 · 登基序章');
  const courtiers=Array.from({length:8},(_,i)=>{
    const row=Math.floor(i/2),right=i%2;
    return `<div class="opening-courtier" data-row="${row}" data-side="${right}"><img class="courtier-lower" src="${ASSETS}dos-courtier-v1.png" alt=""><img class="courtier-upper" src="${ASSETS}dos-courtier-v1.png" alt=""></div>`;
  }).join('');
  const bosses=Array.from({length:25},()=>'<i></i>').join('');
  film.innerHTML=`<div class="opening-stage">
    <div class="opening-palace"><img src="assets/scenes/palace/sketch-palace-color.png" alt="晨曦中的宫城"><div class="opening-dawn"></div><div class="opening-cloud cloud-far"></div><div class="opening-cloud cloud-near"></div><div class="opening-prologue"><span>宫 廷 纪 事</span><p>江山如画，世事如棋。</p><p>今朝承大统，执笔续春秋。</p></div></div>
    <div class="opening-hall"><img class="opening-hall-art" src="${ASSETS}dos-throne-hall-v1.png" alt="金殿御座"><div class="opening-sunbeam"></div><img class="opening-emperor" src="${ASSETS}dos-emperor-v1.png" alt="新君临朝">${courtiers}<div class="opening-incense incense-left"></div><div class="opening-incense incense-right"></div><div class="opening-curtain curtain-left"></div><div class="opening-curtain curtain-right"></div><div class="opening-gate gate-left"><div>${bosses}</div><b>◉</b></div><div class="opening-gate gate-right"><div>${bosses}</div><b>◉</b></div></div>
    <div class="opening-edict"><div class="edict-paper"><span>奉 天 承 运</span><h2>皇帝诏曰</h2><p>朕承大统，夙夜惟勤。<br>当亲贤远佞，修政安民。<br>愿与天下，共启新朝。</p><b>御</b></div></div>
    <div class="opening-title"><div class="opening-title-rule"></div><small>江 山 入 卷 · 王 朝 待 启</small><h1>皇 帝</h1><span class="opening-title-seal">受命<br>于天</span><p>一朝登九五，万事系苍生。</p></div>
    <div class="opening-grain"></div><div class="opening-caption"><span></span><p></p></div>
  </div><div class="opening-controls"><button class="opening-audio" aria-pressed="false">开启配乐</button><button class="opening-skip" autofocus>跳过片头 <kbd>Esc</kbd></button></div><div class="opening-progress"><div></div></div>`;
  document.body.append(film);
  const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
  let frame,done=false,music=null;
  const finish=()=>{if(done)return;done=true;cancelAnimationFrame(frame);music?.stop();film.close();film.remove();if(previous?.isConnected)previous.focus();};
  film.querySelector('.opening-skip').onclick=finish;
  film.querySelector('.opening-audio').onclick=async e=>{
    const button=e.currentTarget;
    if(music){music.stop();music=null;button.textContent='开启配乐';button.setAttribute('aria-pressed','false');}
    else{music=createMusic();if(music){await music.start();button.textContent='关闭配乐';button.setAttribute('aria-pressed','true');}}
  };
  film.addEventListener('cancel',e=>{e.preventDefault();finish();});
  film.showModal();
  const start=performance.now();
  const tick=now=>{
    const elapsed=now-start;
    if(elapsed>=duration){finish();return;}
    paintOpening(film,elapsed/duration*30,reduced);
    frame=requestAnimationFrame(tick);
  };
  tick(start);
  return finish;
}
