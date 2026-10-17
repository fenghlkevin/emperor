const {app,BrowserWindow}=require('electron');
const path=require('node:path');
const fs=require('node:fs');
app.setPath('userData','/private/tmp/emperor-map-audit');
app.whenReady().then(async()=>{
 const w=new BrowserWindow({show:false,width:1600,height:1050,webPreferences:{sandbox:true,contextIsolation:true,nodeIntegration:false}});
 try{
  await w.webContents.session.clearStorageData();
  await w.loadFile(path.join(__dirname,'../index.html'));
  await w.webContents.executeJavaScript(`document.querySelector('#name').value='地图验收';document.querySelector('#create').requestSubmit();document.querySelector('[data-scene="court"]').click();document.querySelector('[data-entry="revenue-deputy"]').click();`);
  await new Promise(r=>setTimeout(r,300));
  fs.writeFileSync('/private/tmp/emperor-map-audit.png',(await w.webContents.capturePage()).toPNG());
  await w.webContents.executeJavaScript(`(()=>{
   const labels=[...document.querySelectorAll('text.realm-name,text.province-name')].map(el=>({id:el.dataset.country||el.dataset.province,province:!!el.dataset.province}));
   if(labels.length!==43||document.querySelectorAll('path.realm').length!==34)throw Error('地图数量不完整');
   for(const item of labels){document.querySelector('text['+(item.province?'data-province':'data-country')+'="'+item.id+'"]').dispatchEvent(new MouseEvent('click',{bubbles:true}));if(!document.querySelector('.civil-detail-title h2'))throw Error('地名无法打开:'+item.id);document.querySelector('[data-fold]').click();}
  })()`);
  console.log('地图专项验收通过：34国、十州和43个地名入口。');app.exit(0);
 }catch(e){console.error(e);app.exit(1);}
});
