const {app,BrowserWindow}=require('electron');
const path=require('node:path'),fs=require('node:fs');
app.setPath('userData',`/private/tmp/emperor-court-roster-interaction-${process.pid}`);
app.whenReady().then(async()=>{
 const w=new BrowserWindow({show:false,width:1440,height:1000,webPreferences:{sandbox:true,contextIsolation:true,nodeIntegration:false,backgroundThrottling:false}});
 const run=c=>w.webContents.executeJavaScript(`(async()=>{${c}})()`);
 try{
  await w.loadFile(path.join(__dirname,'../index.html'));
  await run(`document.querySelector('#new-dynasty').click();document.querySelector('#name').value='朝班验收';document.querySelector('#country-name').value='大明';document.querySelector('#era-name').value='承平';document.querySelector('#create').requestSubmit();document.querySelector('[data-scene=court]').click();for(let i=0;i<300&&document.querySelector('.court')?.dataset.courtReady!=='true';i++)await new Promise(r=>setTimeout(r,30));if(document.querySelector('.court')?.dataset.courtReady!=='true')throw Error('人物未加载');`);
  for(const [width,height] of [[1440,1000],[900,680],[390,760]]){
   w.setSize(width,height);await new Promise(r=>setTimeout(r,180));
   console.log(await run(`const scene=document.querySelector('.court'),buttons=[...scene.querySelectorAll('.court-person:not(.is-vacant)')];if(buttons.length!==14)throw Error('可交互人物数量错误');const save=JSON.parse(localStorage.getItem('emperor.save.v1'));for(const id of buttons.map(b=>b.dataset.personId)){for(let i=0;i<300&&document.querySelector('.court')?.dataset.courtReady!=='true';i++)await new Promise(r=>setTimeout(r,20));const scene=document.querySelector('.court'),b=[...scene.querySelectorAll('.court-person')].find(b=>b.dataset.personId===id);const r=b.getBoundingClientRect();let point=null;for(const y of [.12,.18,.24,.3]){for(const x of [.5,.4,.6]){const p={clientX:r.left+r.width*x,clientY:r.top+r.height*y,bubbles:true};scene.dispatchEvent(new PointerEvent('pointermove',p));if(b.classList.contains('is-actor-hover')){point=p;break;}}if(point)break;}if(!point)throw Error('头部无法命中 '+b.getAttribute('aria-label'));scene.dispatchEvent(new MouseEvent('click',{...point,detail:1}));const modal=document.querySelector('dialog[open]');if(!modal)throw Error('点击无响应 '+b.getAttribute('aria-label'));const {CENTRAL_OFFICES}=await import('./src/personnel.mjs'),{courtOccupant}=await import('./src/court-actors.mjs');if(!CENTRAL_OFFICES.some(o=>o.id===b.dataset.entry))throw Error('朝班混入非中央官职');const person=courtOccupant(save.domestic,b.dataset.entry);if(!person||person.id!==b.dataset.personId||!b.getAttribute('aria-label').includes(person.name)||!modal.classList.contains('court-audience'))throw Error('人物与召见入口不匹配 '+b.dataset.entry);modal.close();await new Promise(r=>setTimeout(r,10));}return innerWidth+'px：14位中央官员身份、悬停及召见通过';`));
  }
  w.setSize(1440,1000);await new Promise(r=>setTimeout(r,200));fs.writeFileSync('/private/tmp/emperor-court-roster-interaction.png',(await w.webContents.capturePage()).toPNG());app.exit(0);
 }catch(error){console.error(error);app.exit(1);}
});
