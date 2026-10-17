const {app,BrowserWindow}=require('electron');
const fs=require('node:fs');
const path=require('node:path');
app.whenReady().then(async()=>{
 const w=new BrowserWindow({show:false,width:1440,height:1000,webPreferences:{contextIsolation:true}});
 try{
 await w.loadFile(path.join(__dirname,'../index.html'));
 const source=fs.readFileSync(path.join(__dirname,'../src/app.mjs'),'utf8');
 const content=source.match(/const notice=modal\('举行制举',`([^`]+)`\)/)[1];
 await w.webContents.executeJavaScript(`(()=>{const d=document.createElement('dialog');d.className='exam-notice';d.innerHTML='<div class="modal-heading"><div><small>吏部 · 制举呈报</small><h2>举行制举</h2></div><button class="close">×</button></div>'+${JSON.stringify(content)};document.body.append(d);d.showModal();})()`);
 for(const width of [1440,900,390]){
 w.setSize(width,900);
 await w.webContents.executeJavaScript(`(async()=>{await document.querySelector('.exam-notice img').decode();await new Promise(r=>setTimeout(r,120));const d=document.querySelector('.exam-notice'),r=d.getBoundingClientRect();if(r.right>innerWidth+1||r.bottom>innerHeight+1||d.scrollWidth>d.clientWidth+1)throw Error('通知面板溢出 '+JSON.stringify({width:innerWidth,right:r.right,bottom:r.bottom,height:innerHeight,scroll:d.scrollWidth,client:d.clientWidth}));if(innerWidth>1000&&r.width<1000)throw Error('桌面通知仍过窄');})()`);
 fs.writeFileSync(`/private/tmp/exam-notice-${width}.png`,(await w.webContents.capturePage()).toPNG());
 }
 console.log('制举通知1440/900/390布局验证通过');app.exit(0);
 }catch(e){console.error(e);app.exit(1);}
});
