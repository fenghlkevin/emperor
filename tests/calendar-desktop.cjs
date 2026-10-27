const {app,BrowserWindow}=require('electron');
const path=require('node:path');
app.setPath('userData','/private/tmp/emperor-calendar-profile');
app.whenReady().then(async()=>{
 const w=new BrowserWindow({show:false,width:1360,height:900});
 try{
 await w.loadFile(path.join(__dirname,'../index.html'));
 const result=await w.webContents.executeJavaScript(`(async()=>{
 localStorage.clear();document.querySelector('#new-dynasty').click();
 document.querySelector('#name').value='胤禛';document.querySelector('#era-name').value='雍正';document.querySelector('#create').requestSubmit();
 const text=document.querySelector('.reign').textContent;
 if(!text.includes('雍正元年正月上旬 · 卯时 · 早朝'))throw Error(text);
 const {readSave}=await import('./src/persistence.mjs');
 return text;
 })()`);
 console.log(result);app.exit(0);
 }catch(error){console.error(error);app.exit(1);}
});
