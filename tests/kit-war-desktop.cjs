const {app,BrowserWindow}=require('electron'),fs=require('node:fs'),path=require('node:path');
app.setPath('userData',`/private/tmp/emperor-kit-war-${process.pid}`);
app.whenReady().then(async()=>{
 const timeout=setTimeout(()=>{console.error('套装出征桌面测试超时');app.exit(1);},60000);
 const w=new BrowserWindow({show:false,width:1440,height:1000,webPreferences:{sandbox:true,contextIsolation:true,nodeIntegration:false,backgroundThrottling:false}});
 const run=c=>w.webContents.executeJavaScript(`(async()=>{${c}})()`),pause=ms=>new Promise(resolve=>setTimeout(resolve,ms));
 try{
  await w.loadFile(path.join(__dirname,'../index.html'));
  await run(`const {newGame}=await import('./src/game.mjs'),{beginWar,generals,borderingCountries}=await import('./src/war.mjs');const s=newGame('套装动画验收');s.scene='court';const g=generals(s.domestic),n=beginWar(s,{id:1,kitVersion:1,kind:'war',targetId:borderingCountries(s.domestic)[0].id,generalId:g[0].id,commanderSquad:{kind:'cavalry',count:37},squads:[{kind:'heavy-cavalry',count:40,generalId:g[1].id},{kind:'spears',count:137,generalId:g[2].id}]});localStorage.setItem('emperor.save.v1',JSON.stringify(n));`);
  await w.reload();await run(`window.launchKitBattle=async()=>{const {openWar}=await import('./src/war-ui.mjs');openWar(JSON.parse(localStorage.getItem('emperor.save.v1')),document.body,next=>localStorage.setItem('emperor.save.v1',JSON.stringify(next)),()=>{});};await window.launchKitBattle();const e=document.querySelector('[data-unit="u0"] .unit-sprite');if(e.dataset.spriteKind!=='heavy-cavalry'||!e.querySelector('image').getAttribute('href').includes('heavy-cavalry'))throw Error('未使用重骑独立图集');const {playSprite,attackDuration}=await import('./src/battle-sprites.mjs');if(attackDuration({kind:'heavy-cavalry'})!==1000)throw Error('重骑攻击时长错误');window.heavy=e;window.first=e.getAttribute('viewBox');window.stopHeavy=playSprite(e,'walk');`);
  await pause(250);await run(`if(window.heavy.getAttribute('viewBox')===window.first)throw Error('重骑骑行动作未推进');window.stopHeavy();window.stopHeavy=(await import('./src/battle-sprites.mjs')).playSprite(window.heavy,'attack');`);
  await pause(450);await run(`if(Number(window.heavy.dataset.frame)<2||window.heavy.dataset.animation!=='attack')throw Error('重骑攻击帧未播放');`);
  fs.writeFileSync('/private/tmp/emperor-kit-heavy-attack.png',(await w.webContents.capturePage()).toPNG());
  await run(`window.stopHeavy();document.querySelector('[data-save-close]').click();`);await pause(80);
  await run(`await window.launchKitBattle();if(!document.querySelector('.battle-dialog'))throw Error('套装战场未能保存续战');const {validateSave}=await import('./src/game.mjs');validateSave(JSON.parse(localStorage.getItem('emperor.save.v1')));`);
  clearTimeout(timeout);console.log('套装出征桌面验收通过：读档续战、真实重骑图集、骑行逐帧、攻击逐帧与时长、关闭重开占用校验');app.exit(0);
 }catch(e){console.error(e);clearTimeout(timeout);app.exit(1);}
});
