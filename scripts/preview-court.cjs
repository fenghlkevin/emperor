// Playable preview with its own save directory. Normal game progress is untouched.
const {app,BrowserWindow,ipcMain}=require('electron');
const path=require('node:path');
const {attachRuntimeDiagnostics}=require('../desktop-runtime.cjs');
app.setPath('userData',path.join(app.getPath('temp'),'emperor-court-preview-v1'));
app.whenReady().then(async()=>{
 const w=new BrowserWindow({title:'皇帝 · 朝堂交互试玩',width:1440,height:1000,minWidth:900,minHeight:680,backgroundColor:'#211f1b',autoHideMenuBar:true,webPreferences:{preload:path.join(__dirname,'../preload.cjs'),sandbox:true,contextIsolation:true,nodeIntegration:false}});
 attachRuntimeDiagnostics(app,w);
 ipcMain.on('emperor:quit',event=>{if(BrowserWindow.fromWebContents(event.sender)===w)app.quit();});
 w.webContents.setWindowOpenHandler(()=>({action:'deny'}));w.webContents.on('will-navigate',e=>e.preventDefault());
 try{
  await w.loadFile(path.join(__dirname,'../index.html'));
  await w.webContents.executeJavaScript(`(async()=>{if(!localStorage.getItem('emperor.save.v1')){const {createPlayableGame}=await import('./src/game.mjs');const s=createPlayableGame('朝堂试玩');s.scene='court';localStorage.setItem('emperor.save.v1',JSON.stringify(s));}})()`);
  await w.loadFile(path.join(__dirname,'../index.html'));
  await w.webContents.executeJavaScript(`document.querySelector('#continue')?.click();`);
  w.setTitle('皇帝 · 朝堂交互试玩');w.show();w.focus();console.log('朝堂试玩已打开；存档目录：'+app.getPath('userData'));
 }catch(e){console.error(e);app.quit();}
});
app.on('window-all-closed',()=>app.quit());
