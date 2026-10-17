const {app,BrowserWindow}=require('electron');
const path=require('node:path');const fs=require('node:fs');
app.setPath('userData','/private/tmp/emperor-court-proportions-test');
app.whenReady().then(async()=>{const w=new BrowserWindow({show:false,width:1440,height:1000,webPreferences:{sandbox:true,contextIsolation:true,nodeIntegration:false}});try{
await w.webContents.session.clearStorageData();
await w.loadFile(path.join(__dirname,'../index.html'));
await w.webContents.executeJavaScript(`document.querySelector('#name').value='比例验收';document.querySelector('#create').requestSubmit();document.querySelector('[data-scene="court"]').click();`);
for(const [width,height] of [[1440,1000],[1000,720],[760,860]]){
w.setSize(width,height);await new Promise(r=>setTimeout(r,180));
console.log(await w.webContents.executeJavaScript(`(async()=>{const img=document.querySelector('.court>img');await img.decode();const r=img.getBoundingClientRect(),scene=img.parentElement.getBoundingClientRect();if(Math.abs(r.width/r.height-img.naturalWidth/img.naturalHeight)>.005)throw Error('朝堂图像比例失真');if(Math.abs(r.height-scene.height)>2)throw Error('热点平面未对齐');if(document.querySelectorAll('[data-official]').length!==13)throw Error('十三职按钮缺失');if(document.querySelectorAll('.court .hotspot').length!==13)throw Error('朝堂十三职缺失');return {width:innerWidth,height:innerHeight,ratio:r.width/r.height};})()`));
await w.webContents.executeJavaScript(`(()=>{const bounds=()=>['.scene.court','.court>img','#next'].map(selector=>{const r=document.querySelector(selector).getBoundingClientRect();return [r.x,r.y,r.width,r.height]});const before=bounds();document.querySelector('#labels').click();if(getComputedStyle(document.querySelector('.court-office-grid')).visibility!=='hidden')throw Error('名册未收起');if(!document.querySelector('.court-office-grid').inert)throw Error('收起后名册仍可获得焦点');if(JSON.stringify(before)!==JSON.stringify(bounds()))throw Error('收起名册导致画面或退朝按钮移动');document.querySelector('#labels').click();if(JSON.stringify(before)!==JSON.stringify(bounds()))throw Error('展开名册导致布局变化');})()`);
fs.writeFileSync(`/private/tmp/emperor-court-proportions-${width}.png`,(await w.webContents.capturePage()).toPNG());
}
await w.webContents.executeJavaScript(`document.querySelector('[data-entry="personnel-minister"]').click();if(!document.querySelector('.personnel-minister-dialog'))throw Error('召见失效');`);
await w.webContents.executeJavaScript(`document.querySelector('.personnel-minister-dialog .close').click();document.querySelector('#next').click();if(!document.querySelector('.scene.palace'))throw Error('退朝失效');`);
console.log('朝堂比例、三种窗口、十三职按钮、召见与退朝验收通过');app.exit(0);
}catch(e){console.error(e);app.exit(1);}});
