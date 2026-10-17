const {app,BrowserWindow}=require('electron');
const path=require('node:path'),fs=require('node:fs');
app.setPath('userData','/private/tmp/emperor-dos-migration-ui');
app.whenReady().then(async()=>{
 const w=new BrowserWindow({show:false,width:1360,height:950,webPreferences:{sandbox:true,contextIsolation:true,nodeIntegration:false,backgroundThrottling:false}});
 try{
  await w.webContents.session.clearStorageData();await w.loadFile(path.join(__dirname,'../index.html'));
  await w.webContents.executeJavaScript(`(async()=>{const {newGame,SAVE_KEY}=await import('./src/game.mjs');const s=newGame('旧档迁移验收');delete s.emperorRulesVersion;Object.assign(s.stats,{energy:8,maxEnergy:10,charm:50,talent:50,wisdom:55,martial:50});s.phase=1;localStorage.setItem(SAVE_KEY,JSON.stringify(s));localStorage.setItem('emperor.panel.collapsed','false');})()`);
  await w.reload();await new Promise(r=>setTimeout(r,500));
  console.log(await w.webContents.executeJavaScript(`(async()=>{
   document.querySelector('#continue').click();
   const panel=document.querySelector('.emperor-panel');if(panel.classList.contains('is-collapsed'))panel.querySelector('[data-emperor-toggle]').click();
   const text=panel.textContent;if(!text.includes('160')||!text.includes('200')||!text.includes('275')||!text.includes('/ 500'))throw Error('迁移后主面板数值错误');
   document.querySelector('[data-entry="study"]').click();const d=document.querySelector('.study-dialog');
   await Promise.all([...d.querySelectorAll('img')].map(i=>i.decode()));await new Promise(r=>setTimeout(r,100));
   const s=JSON.parse(localStorage.getItem('emperor.save.v1'));
   if(s.emperorRulesVersion!==1||s.stats.energy!==120||s.stats.wisdom<276||s.stats.wisdom>279)throw Error('旧档首次修习或迁移落盘错误');d.close();await new Promise(r=>setTimeout(r,100));
   return '旧档继续游戏、主面板500制、首次修习扣40并迁移落盘通过';
  })()`));
  const before=await w.webContents.executeJavaScript(`localStorage.getItem('emperor.save.v1')`);
  await w.reload();await new Promise(r=>setTimeout(r,400));
  await w.webContents.executeJavaScript(`document.querySelector('#continue').click();if(!document.querySelector('.emperor-panel'))throw Error('继续后面板缺失')`);await new Promise(r=>setTimeout(r,300));
  const after=await w.webContents.executeJavaScript(`localStorage.getItem('emperor.save.v1')`);
  if(JSON.parse(before).stats.energy!==JSON.parse(after).stats.energy||JSON.parse(before).stats.wisdom!==JSON.parse(after).stats.wisdom)throw Error('重载重复迁移');
  fs.mkdirSync(path.join(__dirname,'../outputs/dos-rules'),{recursive:true});
  fs.writeFileSync(path.join(__dirname,'../outputs/dos-rules/migrated-panel.png'),(await w.webContents.capturePage()).toPNG());
  w.setSize(920,720);await new Promise(r=>setTimeout(r,100));
  const layout=await w.webContents.executeJavaScript(`({width:document.documentElement.scrollWidth,viewport:innerWidth})`);if(layout.width>layout.viewport)throw Error('小窗口水平溢出');
  console.log('重载不重复换算、小窗口布局通过');app.exit(0);
 }catch(error){console.error(error);app.exit(1);}
});
