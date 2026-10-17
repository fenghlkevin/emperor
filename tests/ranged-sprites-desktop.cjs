const {app,BrowserWindow}=require('electron'),fs=require('node:fs'),path=require('node:path');
app.setPath('userData',`/private/tmp/emperor-ranged-art-${process.pid}`);
app.whenReady().then(async()=>{
 const timeout=setTimeout(()=>app.exit(1),30000),w=new BrowserWindow({show:false,width:1100,height:700,webPreferences:{sandbox:true,contextIsolation:true,backgroundThrottling:false}});
 const run=c=>w.webContents.executeJavaScript(`(async()=>{${c}})()`),pause=ms=>new Promise(r=>setTimeout(r,ms));
 try{await w.loadFile(path.join(__dirname,'../index.html'));
 await run(`const {piece,playSprite}=await import('./src/battle-sprites.mjs');document.body.innerHTML='<svg style="background:#c0b390;width:100%;height:600px" viewBox="0 0 600 300">'+['archers','crossbows'].map((kind,i)=>'<g transform="translate('+(170+i*250)+',240) scale(2)">'+piece({id:kind,kind,side:'home',facing:0})+'</g>').join('')+'</svg>';window.framesSeen={};window.stops=[];for(const el of document.querySelectorAll('.unit-sprite')){framesSeen[el.dataset.spriteKind]=new Set();stops.push(playSprite(el,'attack'));}window.sampling=setInterval(()=>document.querySelectorAll('.unit-sprite').forEach(el=>framesSeen[el.dataset.spriteKind].add(el.dataset.frame)),15);`);
 await pause(1100);await run(`clearInterval(sampling);for(const [kind,frames]of Object.entries(framesSeen))if(frames.size!==8)throw Error(kind+' only '+frames.size+' frames');for(const el of document.querySelectorAll('.unit-sprite')){const r=el.querySelector('[data-sprite-clip]');if(el.getAttribute('viewBox')!==['x','y','width','height'].map(k=>r.getAttribute(k)).join(' '))throw Error('clip mismatch');}stops.forEach(stop=>stop());const {playSprite}=await import('./src/battle-sprites.mjs');window.stops=[...document.querySelectorAll('.unit-sprite')].map(el=>playSprite(el,'attack'));`);
 await pause(560);await run('await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));');fs.writeFileSync('/private/tmp/emperor-ranged-sprites.png',(await w.webContents.capturePage()).toPNG());
 await run('stops.forEach(stop=>stop());');console.log('弓弩图集实际播放通过：两种各8帧射击，裁切随帧一致，停止清理');clearTimeout(timeout);app.exit(0);
 }catch(e){console.error(e);clearTimeout(timeout);app.exit(1);}
});
