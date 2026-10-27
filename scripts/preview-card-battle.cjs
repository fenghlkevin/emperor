const {app,BrowserWindow}=require('electron'),path=require('node:path'),fs=require('node:fs'),crypto=require('node:crypto');
const {attachRuntimeDiagnostics}=require('../desktop-runtime.cjs'),{previewBootstrap}=require('./card-battle-preview-bootstrap.cjs');
// A worktree-specific temporary profile: recover preview actions without touching a real save.
const slot=crypto.createHash('sha256').update(path.resolve(__dirname,'..')).digest('hex').slice(0,12);
app.setPath('userData',`/private/tmp/emperor-card-preview-${slot}`);
const log=(event,details={})=>{try{fs.mkdirSync(app.getPath('userData'),{recursive:true});fs.appendFileSync(path.join(app.getPath('userData'),'preview.log'),JSON.stringify({at:new Date().toISOString(),event,...details})+'\n');}catch(e){console.error(e.message);}};
process.on('SIGINT',()=>{log('process-stop',{reason:'SIGINT'});app.quit();});
process.on('SIGTERM',()=>{log('process-stop',{reason:'SIGTERM'});app.quit();});
app.whenReady().then(async()=>{
 const w=new BrowserWindow({width:1440,height:1000,title:'军阵卡牌 · 原型还原试玩',webPreferences:{sandbox:true,contextIsolation:true,nodeIntegration:false,backgroundThrottling:false}});
 const diagnostics=attachRuntimeDiagnostics(app,w,{onRecoveryFailed:logPath=>{console.error('CARD_PREVIEW_RECOVERY_FAILED '+logPath);log('recovery-failed');}});
 w.on('unresponsive',()=>log('window-unresponsive'));w.on('responsive',()=>log('window-responsive'));
 app.on('child-process-gone',(_e,details)=>log('child-process-gone',details));
 w.webContents.on('console-message',({level,message})=>{if(level==='error')console.error(message);else if(message.startsWith('CARD_PREVIEW_')){console.log(message);log('preview-status',{message});}});
 w.webContents.on('did-finish-load',()=>w.webContents.executeJavaScript(previewBootstrap({showcase:process.argv.includes('--showcase')})).catch(e=>{console.error(e);log('bootstrap-error',{message:e.message});}));
 w.on('page-title-updated',event=>event.preventDefault());
 console.log('CARD_PREVIEW_DIAGNOSTICS '+diagnostics.logPath);await w.loadFile(path.join(__dirname,'../index.html'));
 if(process.argv.includes('--compare')){const comparison=new BrowserWindow({width:1500,height:900,title:'军阵卡牌 · 原型与实机对照',webPreferences:{sandbox:true,contextIsolation:true,nodeIntegration:false}});await comparison.loadFile(path.join(__dirname,'../docs/card-battle-ui-comparison.html'));w.focus();}
});
app.on('window-all-closed',()=>app.quit());
