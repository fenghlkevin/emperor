const {app,BrowserWindow}=require('electron');
const path=require('node:path'),fs=require('node:fs');
app.setPath('userData',`/private/tmp/emperor-works-simple-${process.pid}`);
app.whenReady().then(async()=>{
 const w=new BrowserWindow({show:true,width:1440,height:1000,webPreferences:{sandbox:true,contextIsolation:true,nodeIntegration:false}});
 const run=code=>w.webContents.executeJavaScript(`(async()=>{${code}})()`);
 try{
 await w.loadFile(path.join(__dirname,'../index.html'));
 await run(`document.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true}));const {createPlayableGame}=await import('./src/game.mjs');window.s=createPlayableGame('简化工部');for(const p of s.domestic.provinces){p.disaster=null;p.population.professions.militia=2000;}window.openWorks=(await import('./src/works-minister-ui.mjs')).openWorksMinister;window.open=()=>openWorks(s,document.body,next=>{s=next;return next},()=>{},{kind:'buildings'});window.d=open();`);
 await run(`if(/执行时长|补贴|增派|赶工/.test(d.textContent))throw Error('仍有旧控件');d.querySelector('[data-choice=rush][data-option=true]').click();d.querySelector('[data-execute]').click();if(!s.domestic.provinces[0].construction.project.workOrder.rush)throw Error('未加急开工');if(!d.isConnected)d=open();if(!d.querySelector('[data-stop]')||d.querySelector('[data-stop]').hidden)throw Error('无停建');`);
 await new Promise(r=>setTimeout(r,300));fs.writeFileSync('/private/tmp/works-simple.png',(await w.webContents.capturePage()).toPNG());
 await run(`d.querySelector('[data-choice=rush][data-option=false]').click();d.querySelector('[data-execute]').click();if(s.domestic.provinces[0].construction.project.workOrder.rush)throw Error('未取消加急');if(!d.isConnected)d=open();d.querySelector('[data-stop]').click();document.querySelector('[data-confirm-stop]').click();if(s.domestic.provinces[0].construction.project)throw Error('停建失败');`);
 console.log('PASS: 开工、持续加急、恢复常规、停建');app.exit(0);
 }catch(e){console.error(e);app.exit(1);}
});
