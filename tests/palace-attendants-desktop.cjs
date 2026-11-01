const {app,BrowserWindow}=require('electron');
const path=require('node:path'),fs=require('node:fs');
app.setPath('userData',`/private/tmp/emperor-attendants-${process.pid}`);
app.whenReady().then(async()=>{
 const w=new BrowserWindow({show:false,width:1280,height:900,webPreferences:{sandbox:true,backgroundThrottling:false}});
 const run=js=>w.webContents.executeJavaScript(`(async()=>{${js}})()`);
 try{
  await w.loadFile(path.join(__dirname,'../index.html'));
  for(const [key,fn] of [['zichen','openZichen'],['dragon','openDragon'],['theatre','openTheatre'],['study','openStudy'],['martial','openMartial'],['mother','openMother'],['alchemy','openAlchemy']]){
   const result=await run(`const {createPlayableGame}=await import('./src/game.mjs');const {${fn}}=await import('./src/${key}-ui.mjs');const s=createPlayableGame('风格验收','大明');s.phase=2;const root=document.createElement('div');document.body.append(root);const d=${fn}(s,root,()=>{},()=>{});await Promise.all([...d.querySelectorAll('img')].map(im=>im.decode()));await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));if(!d.open)throw Error('scene closed');const imgs=[...d.querySelectorAll('img')];if(!imgs.some(im=>im.getAttribute('src').includes('unified')))throw Error('old art still used');if(imgs.some(im=>!im.naturalWidth))throw Error('art failed');window.attendantPreview={d,root};return imgs.map(im=>[im.getAttribute('src'),im.naturalWidth,im.naturalHeight]);`);
   fs.writeFileSync(`/private/tmp/emperor-attendants-${key}.png`,(await w.webContents.capturePage()).toPNG());
   if(key==='zichen')await run(`const d=window.attendantPreview.d;for(const side of ['left','right']){const b=d.querySelector('.zichen-npc.'+side),r=b.getBoundingClientRect();if(!document.elementFromPoint(r.x+r.width/2,r.y+r.height/2)?.closest('.zichen-npc'))throw Error('NPC hit area blocked');}d.querySelector('[data-view="outing"]').click();if(!d.querySelector('[data-travel="tour"]'))throw Error('outing menu unavailable');d.querySelector('[data-view="hall"]').click();d.querySelector('[data-view="menu"]').click();if(!d.querySelector('[data-view="consorts"]'))throw Error('roster unavailable');`);
   console.log(key,JSON.stringify(result));
   await run(`window.attendantPreview.d.close();window.attendantPreview.root.remove();`);
  }
  console.log('PASS: seven palace scenes load unified art, original NPC interactions work.');app.exit(0);
 }catch(e){console.error(e);app.exit(1);}
});
