const {app,BrowserWindow}=require('electron');
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {attachRuntimeDiagnostics}=require('../desktop-runtime.cjs');
app.setPath('userData','/private/tmp/emperor-renderer-recovery-test');
const deadline=setTimeout(()=>{console.error('恢复测试超时');app.exit(1)},30000);
app.whenReady().then(async()=>{
 const w=new BrowserWindow({show:false,webPreferences:{sandbox:true}});
 const {logPath}=attachRuntimeDiagnostics(app,w);
 try{
  await w.webContents.session.clearStorageData();
  await w.loadFile(path.join(__dirname,'../index.html'));
  const saved=await w.webContents.executeJavaScript(`(()=>{document.querySelector('#new-dynasty').click();document.querySelector('#name').value='恢复验收';document.querySelector('#create').requestSubmit();return localStorage.getItem('emperor.save.v1');})()`);
  const reloaded=new Promise(resolve=>w.webContents.once('did-finish-load',resolve));
  w.webContents.forcefullyCrashRenderer();await reloaded;
  assert.equal(await w.webContents.executeJavaScript(`localStorage.getItem('emperor.save.v1')`),saved);
  assert.equal(await w.webContents.executeJavaScript(`!!document.querySelector('#continue')`),true);
  const events=fs.readFileSync(logPath,'utf8');assert.match(events,/render-process-gone/);assert.match(events,/recover-renderer/);
  console.log('强制渲染进程崩溃后自动重载、保留原存档和诊断日志通过');clearTimeout(deadline);app.exit(0);
 }catch(error){console.error(error);clearTimeout(deadline);app.exit(1)}
});
