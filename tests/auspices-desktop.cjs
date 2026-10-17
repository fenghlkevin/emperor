const {app,BrowserWindow}=require('electron');const path=require('node:path');const fs=require('node:fs');app.setPath('userData','/private/tmp/emperor-auspices-test');
app.whenReady().then(async()=>{const w=new BrowserWindow({show:false,width:1440,height:1000,webPreferences:{sandbox:true,contextIsolation:true,nodeIntegration:false}});try{
 await w.loadFile(path.join(__dirname,'../index.html'));
 await w.webContents.executeJavaScript(`(async()=>{const {newGame}=await import('./src/game.mjs');const {settleAuspices}=await import('./src/auspices.mjs');const s=newGame('祥瑞帝');s.turn++;settleAuspices(s,()=>0);localStorage.setItem('emperor.save.v1',JSON.stringify(s));})()`);
 await w.reload();await w.webContents.executeJavaScript(`document.querySelector('#continue').click();if(!document.querySelector('[aria-label="祥瑞喜报"]').textContent.includes('+1,800'))throw Error('喜报未显示奖励');`);
 await new Promise(r=>setTimeout(r,350));
 fs.mkdirSync(path.join(__dirname,'../outputs/auspices'),{recursive:true});fs.writeFileSync(path.join(__dirname,'../outputs/auspices/central-gold.png'),(await w.webContents.capturePage()).toPNG());
 await w.webContents.executeJavaScript(`document.querySelector('[data-ack-auspice]').click()`);await new Promise(r=>setTimeout(r,80));
 await w.reload();await w.webContents.executeJavaScript(`document.querySelector('#continue').click();if(document.querySelector('[aria-label="祥瑞喜报"]'))throw Error('重复通知');if(JSON.parse(localStorage.getItem('emperor.save.v1')).stats.treasury!==11800)throw Error('重复发奖');`);
 for(let i=0;i<12;i++){
 await w.webContents.executeJavaScript(`(async()=>{const {newGame}=await import('./src/game.mjs');const {settleAuspices}=await import('./src/auspices.mjs');const s=newGame('祥瑞帝');s.turn++;let rolls=[0,(${i}+.1)/12,0];settleAuspices(s,()=>rolls.shift());localStorage.setItem('emperor.save.v1',JSON.stringify(s));})()`);
 await w.reload();await w.webContents.executeJavaScript(`document.querySelector('#continue').click()`);
 await w.webContents.executeJavaScript(`(async()=>{const img=document.querySelector('.auspice-art img');await img.decode();if(img.naturalWidth<500)throw Error('插图尺寸不足');const box=img.getBoundingClientRect(),dialog=document.querySelector('.auspice-dialog').getBoundingClientRect();if(box.left<dialog.left||box.right>dialog.right)throw Error('插图越界');})()`);
 if(i===0||i===4){await new Promise(r=>setTimeout(r,200));fs.writeFileSync(path.join(__dirname,'../outputs/auspices/'+(i===0?'central-gold':'local-harvest')+'.png'),(await w.webContents.capturePage()).toPNG());}
 }
 await w.setSize(390,844);await w.webContents.executeJavaScript(`(async()=>{const img=document.querySelector('.auspice-art img');await img.decode();if(document.querySelector('.auspice-dialog').scrollWidth>document.querySelector('.auspice-dialog').clientWidth+2)throw Error('窄屏横向溢出');})()`);
 console.log('12 种祥瑞插图加载、宽窄屏布局、通知及存档验收通过');app.exit(0);
 }catch(e){console.error(e);app.exit(1);}});
