const {app,BrowserWindow}=require('electron');
const path=require('node:path'),fs=require('node:fs');
app.setPath('userData',`/private/tmp/emperor-dialogue-${process.pid}`);
app.whenReady().then(async()=>{
 const w=new BrowserWindow({show:false,width:1200,height:800,webPreferences:{sandbox:true,backgroundThrottling:false}});
 const run=js=>w.webContents.executeJavaScript(`(async()=>{${js}})()`);
 try{
  await w.loadFile(path.join(__dirname,'../index.html'));
  await run(`const {createPlayableGame}=await import('./src/game.mjs');const s=createPlayableGame('永乐','大明');s.phase=2;localStorage.setItem('emperor.save.v1',JSON.stringify(s));`);
  await w.reload();await new Promise(r=>w.webContents.once('did-finish-load',r));
  await run(`document.querySelector('.opening-skip')?.click();document.querySelector('#continue').click();document.querySelector('[data-entry=court]').click();`);
  for(const [width,height] of [[1200,800],[780,760],[390,700]]){
   w.setSize(width,height);await new Promise(r=>setTimeout(r,150));
   await run(`const d=document.querySelector('dialog[open].palace-dialogue');if(!d||!d.textContent.includes('今日早朝已毕'))throw Error('attendant notice missing');const im=d.querySelector('img');await im.decode();if(!im.naturalWidth)throw Error('portrait failed');const r=d.getBoundingClientRect();if(r.left<0||r.right>innerWidth+1||r.bottom>innerHeight+1||d.scrollWidth>d.clientWidth+1)throw Error('dialog overflow');if(!d.querySelector('[data-attendant-dismiss]'))throw Error('acknowledge missing');`);
   fs.writeFileSync(`/private/tmp/emperor-dialogue-${width}.png`,(await w.webContents.capturePage()).toPNG());
  }
  w.setSize(1200,800);
  await run(`document.querySelector('[data-attendant-dismiss]').click();if(document.querySelector('dialog[open]'))throw Error('notice did not close');document.querySelector('[data-palace-advance]').click();if(!document.querySelector('dialog.palace-dialogue [data-cancel-time]'))throw Error('time notice not decorated');document.querySelector('[data-cancel-time]').click();if(JSON.parse(localStorage.getItem('emperor.save.v1')).phase!==2)throw Error('cancel advanced time');document.querySelector('[data-palace-advance]').click();document.querySelector('[data-confirm-time]').click();if(JSON.parse(localStorage.getItem('emperor.save.v1')).phase!==3)throw Error('time did not advance');const {palaceDialogueMarkup}=await import('./src/palace-dialogue.mjs');if(palaceDialogueMarkup('读取进度','<p>存档</p>')!==null)throw Error('save tool decorated');for(const title of ['安寝至明','确认退朝','外臣抵京','出行候驾','礼明殿','御前禀报'])if(!palaceDialogueMarkup(title,'<p>陛下</p>').includes('御前内侍'))throw Error('missing notice '+title);`);
  console.log('PASS: attendant portrait, three viewport layouts, acknowledgement, time cancel/confirm, notice routing, save tool isolation.');app.exit(0);
 }catch(e){console.error(e);app.exit(1);}
});
