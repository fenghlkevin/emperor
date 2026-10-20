const {app,BrowserWindow}=require('electron'),path=require('node:path');
app.setPath('userData',`/private/tmp/emperor-country-name-${process.pid}`);
app.whenReady().then(async()=>{const w=new BrowserWindow({show:false,webPreferences:{sandbox:true,contextIsolation:true,nodeIntegration:false}});try{
 await w.loadFile(path.join(__dirname,'../index.html'));
 await w.webContents.executeJavaScript(`(async()=>{document.querySelector('#new-dynasty').click();document.querySelector('#name').value='朱元璋';document.querySelector('#country-name').value='大明';document.querySelector('#era-name').value='洪武';document.querySelector('#create').requestSubmit();const raw=localStorage.getItem('emperor.save.v1');if(!raw)throw Error('新朝未保存');const s=JSON.parse(raw);if(s.name!=='朱元璋'||s.eraName!=='洪武'||s.domestic.countries.find(c=>c.id==='sheng').name!=='大明')throw Error('国号未正确存档');(await import('./src/domestic-ui.mjs')).openDomestic(s,document.querySelector('#app'));document.querySelector('[data-home]').click();if(!document.querySelector('.civil-detail-title h2').textContent.includes('大明'))throw Error('国家详情未采用国号');})()`);
 console.log('新建国号、年号、君主名号和国家详情验收通过');app.exit(0);
 }catch(e){console.error(e);app.exit(1);}});
