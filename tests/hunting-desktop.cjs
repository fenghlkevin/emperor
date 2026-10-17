const {app,BrowserWindow}=require('electron');
const path=require('node:path'),fs=require('node:fs');
app.setPath('userData','/private/tmp/emperor-hunting-test');
app.whenReady().then(async()=>{
 const w=new BrowserWindow({show:false,width:1600,height:1050,webPreferences:{contextIsolation:true,nodeIntegration:false,sandbox:true}});
 const out=path.join(__dirname,'../outputs/hunting');fs.mkdirSync(out,{recursive:true});
 const errors=[];w.webContents.on('console-message',event=>{if(event.level==='error'||/error|violat|refused/i.test(event.message)){errors.push(event.message);console.error('renderer:',event.message);}});
 try{
  await w.loadFile(path.join(__dirname,'../index.html'));
  await w.webContents.executeJavaScript(`(async()=>{const {newGame,SAVE_KEY}=await import('./src/game.mjs');const s=newGame('围猎验收');s.phase=1;s.turn=19;s.stats.health=60;localStorage.setItem(SAVE_KEY,JSON.stringify(s));})()`);
  await w.loadFile(path.join(__dirname,'../index.html'));
  await new Promise(r=>setTimeout(r,100));await w.webContents.executeJavaScript(`if(!document.querySelector('#continue'))throw Error('continue missing');document.querySelector('#continue').click();document.querySelector('[data-entry="rest"]').click();document.querySelector('.zichen-npc.left').click();if(!document.querySelector('[data-hunting]'))throw Error('left attendant menu missing');`);
  fs.writeFileSync(path.join(out,'attendant.png'),(await w.webContents.capturePage()).toPNG());errors.length=0;
  await w.webContents.executeJavaScript(`document.querySelector('[data-hunting]').click()`);
  for(let i=0;i<100;i++){if(await w.webContents.executeJavaScript(`Boolean(document.querySelector('[data-start]')&&!document.querySelector('[data-start]').disabled)`))break;await new Promise(r=>setTimeout(r,100));}
  await w.webContents.executeJavaScript(`if(document.querySelector('[data-start]').disabled)throw Error('assets not ready');`);
  fs.writeFileSync(path.join(out,'ready.png'),(await w.webContents.capturePage()).toPNG());
  await w.webContents.executeJavaScript(`window.huntOriginalRandom=Math.random;window.huntSpawnIndex=0;Math.random=()=>[0,8,10,27,2][Math.min(window.huntSpawnIndex++,4)]/36+.001;document.querySelector('[data-start]').click()`);
  await new Promise(r=>setTimeout(r,1600));
  fs.writeFileSync(path.join(out,'hunting.png'),(await w.webContents.capturePage()).toPNG());await w.webContents.executeJavaScript(`void(Math.random=window.huntOriginalRandom)`);
  // Real pointer input at an opaque animal pixel and transparent background.
  const point=await w.webContents.executeJavaScript(`(()=>{const c=document.querySelector('.hunt-targets'),r=c.getBoundingClientRect(),x=110,y=660;if(c.getContext('2d').getImageData(x,y,1,1).data[3]===0)throw Error('expected boar body pixel missing');return {x:r.x+x/c.width*r.width,y:r.y+y/c.height*r.height};})()`);
  w.webContents.sendInputEvent({type:'mouseDown',x:Math.round(point.x),y:Math.round(point.y),button:'left',clickCount:1});w.webContents.sendInputEvent({type:'mouseUp',x:Math.round(point.x),y:Math.round(point.y),button:'left',clickCount:1});
  await new Promise(r=>setTimeout(r,40));
  await w.webContents.executeJavaScript(`if(+document.querySelector('[data-score]').textContent===0)throw Error('opaque animal click missed');if(document.querySelector('[data-arrows]').textContent!=='29 / 30')throw Error('arrow not consumed');`);
  // Exhaust the remaining arrows through the background; exactly one settlement.
  await w.webContents.executeJavaScript(`(()=>{const c=document.querySelector('.hunt-targets'),r=c.getBoundingClientRect();for(let i=0;i<29;i++)c.dispatchEvent(new PointerEvent('pointerdown',{button:0,clientX:r.x+5,clientY:r.y+r.height*.25,bubbles:true}));if(!document.querySelector('[data-return]'))throw Error('no arrow-exhaustion result');const s=JSON.parse(localStorage.getItem('emperor.save.v1'));if(s.stats.life!==2152||s.stats.health!==80||s.stats.energy!==200)throw Error('wrong settlement '+JSON.stringify(s.stats));window.testSaved=s;})()`);
  fs.writeFileSync(path.join(out,'result.png'),(await w.webContents.capturePage()).toPNG());
  await w.webContents.executeJavaScript(`document.querySelector('[data-return]').click()`);await new Promise(r=>setTimeout(r,100));await w.webContents.executeJavaScript(`if(document.querySelector('.hunting-dialog')||document.querySelector('.zichen-dialog'))throw Error('dialogs leaked');const s=JSON.parse(localStorage.getItem('emperor.save.v1'));if(s.phase!==2||s.stats.life!==2152)throw Error('room phase or duplicate reward');`);
  // Save failure and retry, Escape settles once, actual elapsed timeout.
  console.log('PASS: left attendant → hunting, decoded assets, opaque pixel hit, 30-arrow finish, saved rewards, room phase, dialog cleanup');
  await w.webContents.executeJavaScript(`(async()=>{const {openHunting}=await import('./src/hunting-ui.mjs');const {persistCandidate}=await import('./src/persistence.mjs');window.retryState=structuredClone(window.testSaved);window.retryCount=0;window.retryWrites=0;window.retryDialog=openHunting(window.retryState,document.querySelector('#app'),candidate=>{window.retryCount++;window.retryState=persistCandidate(window.retryState,candidate,{setItem(){if(window.retryCount===1)throw Error('full');window.retryWrites++;}});},()=>{});})()`);
  await new Promise(r=>setTimeout(r,200));
  await w.webContents.executeJavaScript(`document.querySelector('[data-start]').click();document.querySelector('.hunting-dialog').dispatchEvent(new Event('cancel',{cancelable:true}));if(!document.querySelector('[data-retry]')||window.retryState.stats.life!==2152)throw Error('failed save published state');document.querySelector('[data-retry]').click();if(window.retryState.stats.life!==2144||window.retryWrites!==1)throw Error('retry saved wrong result');document.querySelector('[data-exit]').click();`);
  await new Promise(r=>setTimeout(r,100));
  console.log('PASS: Escape ends hunt, storage failure retains pending result, retry commits once');
  if(!process.argv.includes('--visual')){
  await w.webContents.executeJavaScript(`(async()=>{const {openHunting}=await import('./src/hunting-ui.mjs');window.timeoutCount=0;window.timeoutDialog=openHunting(window.testSaved,document.querySelector('#app'),()=>{window.timeoutCount++;},()=>{});})()`);
  await new Promise(r=>setTimeout(r,200));
  await w.webContents.executeJavaScript(`document.querySelector('[data-start]').click()`);
  console.log('Running real 60-second timeout check…');
  await new Promise(r=>setTimeout(r,60500));
  await w.webContents.executeJavaScript(`if(window.timeoutCount!==1||!document.querySelector('[data-return]')||!document.querySelector('.hunt-panel').textContent.includes('时辰已到'))throw Error('timeout did not settle once');document.querySelector('[data-return]').click();`);
  await new Promise(r=>setTimeout(r,100));
  console.log('PASS: real 60-second timeout settles once without shots');
  }
  for(const [width,height]of [[900,700],[1440,900]]){
   w.setSize(width,height);await w.webContents.executeJavaScript(`(async()=>{const {openHunting}=await import('./src/hunting-ui.mjs');window.small=openHunting(window.testSaved,document.querySelector('#app'),()=>{},()=>{});})()`);await new Promise(r=>setTimeout(r,200));
   await w.webContents.executeJavaScript(`(()=>{const d=document.querySelector('.hunting-dialog'),r=d.getBoundingClientRect();if(r.width>innerWidth||r.height>innerHeight||d.scrollWidth>d.clientWidth+1)throw Error('hunt overflow');d.close();})()`);
  }
  const huntErrors=errors.filter(m=>!/Refused to apply inline style/.test(m));if(huntErrors.length)throw Error(huntErrors.join('\n'));
  console.log('PASS: 900px and 1440px responsive layouts, no hunting errors; existing palace inline-style CSP warnings recorded');app.exit(0);
 }catch(e){console.error(e);console.error(await w.webContents.executeJavaScript('document.body.innerText.slice(0,1200)'));fs.writeFileSync(path.join(out,'failure.png'),(await w.webContents.capturePage()).toPNG());app.exit(1);}
});
