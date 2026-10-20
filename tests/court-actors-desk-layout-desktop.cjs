const {app,BrowserWindow}=require('electron');
const fs=require('node:fs'),path=require('node:path');
const {waitForSelector}=require('./helpers/wait-for-selector.cjs');
app.setPath('userData',`/private/tmp/emperor-court-play-${process.pid}`);
app.whenReady().then(async()=>{
 const timer=setTimeout(()=>{console.error('朝堂体验验收超时');app.exit(1);},120000),w=new BrowserWindow({show:false,width:1440,height:1000,webPreferences:{sandbox:true,contextIsolation:true,nodeIntegration:false,backgroundThrottling:false}});
 const run=c=>w.webContents.executeJavaScript(`(async()=>{const waitForSelector=${waitForSelector.toString()};${c}})()`);
 const shot=async n=>{await run('await Promise.all([...document.querySelectorAll(".court-play-dialog img")].map(i=>i.decode()));await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));');fs.writeFileSync(`/private/tmp/emperor-court-play-${n}.png`,(await w.webContents.capturePage()).toPNG());};
 w.webContents.on('render-process-gone',(_e,d)=>{console.error('renderer',d);app.exit(1);});
 try{
  await w.loadFile(path.join(__dirname,'../index.html'));
  await run(`document.querySelector('#new-dynasty').click();document.querySelector('#name').value='御案试玩';document.querySelector('#country-name').value='大明';if(document.querySelector('#era-name'))document.querySelector('#era-name').value='承平';document.querySelector('#create').requestSubmit();document.querySelector('[data-scene=court]').click();await waitForSelector('.scene.court[data-court-ready=true],.scene.court[data-court-ready=fallback]');if(document.querySelectorAll('[data-court-petition]').length>3)throw Error('御案呈奏缺失');window.before=localStorage.getItem('emperor.save.v1');`);await shot('court');
  for(const [width,height,name] of [[1440,1000,'actors-desk-wide'],[900,680,'actors-desk-small'],[390,760,'actors-desk-mobile']]){w.setSize(width,height);await new Promise(r=>setTimeout(r,220));await run(`const scene=document.querySelector('.scene.court').getBoundingClientRect(),desk=document.querySelector('.court-desk').getBoundingClientRect(),rear=desk.top+(desk.height>=260?43:23);for(const b of document.querySelectorAll('.court-person:not(.is-vacant)')){const r=b.getBoundingClientRect(),scale=Math.max(scene.width/1448,scene.height/1086),horizon=scene.top+200*scale+(scene.height-1086*scale)*.42;const expected=(r.bottom-horizon)*111/160;if(Math.abs(r.height-expected)>1)throw Error('人物与门口武士的透视比例不一致 '+b.dataset.entry);if(r.bottom>rear-8&&rear<scene.bottom)throw Error('人物仍被御案遮挡 '+b.dataset.entry);if(r.top<scene.top)throw Error('人物上移越界');}const b=document.querySelector('[data-entry="prime-minister"]'),r=b.getBoundingClientRect();document.querySelector('.scene.court').dispatchEvent(new PointerEvent('pointermove',{clientX:r.x+r.width/2,clientY:r.y+r.height*.18,bubbles:true}));if(!b.classList.contains('is-actor-hover'))throw Error('人物悬停未同步');`);await shot(name);}
  await run(`document.querySelector('[data-entry="prime-minister"]').click();if(!document.querySelector('.court-audience[open]'))throw Error('上移后召见失败');`);
  console.log('门口武士透视校准、前排避开御案、边界、悬停及召见通过');clearTimeout(timer);app.exit(0);
 }catch(e){console.error(e);clearTimeout(timer);app.exit(1);}
});
