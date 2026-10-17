const {app,BrowserWindow}=require('electron');
const fs=require('node:fs'),path=require('node:path');
app.setPath('userData','/private/tmp/emperor-fixed-portrait-qa-profile');
app.whenReady().then(async()=>{
 const start=Number(process.env.PORTRAIT_QA_START||0),limit=Number(process.env.PORTRAIT_QA_COUNT||24);
 const w=new BrowserWindow({width:1800,height:1800,show:false,webPreferences:{contextIsolation:true,nodeIntegration:false,sandbox:true}});
 try{
  await w.loadFile(path.join(__dirname,'../outputs/harem-roster-draft/portraits.html'));
  const result=await w.webContents.executeJavaScript(`(async()=>{
   const all=[...document.querySelectorAll('article')],keep=all.slice(${start},${start+limit});
   document.querySelector('header')?.remove();document.querySelector('h1').remove();document.querySelector('.intro').remove();document.querySelector('input').remove();
   document.body.style.padding='10px';document.body.style.maxWidth='none';
   const grid=document.querySelector('.grid');Object.assign(grid.style,{gridTemplateColumns:'repeat(6,1fr)',gap:'6px',margin:'0'});
   all.forEach(a=>{if(!keep.includes(a))a.remove();else{a.querySelector('.image').style.height='385px';a.querySelector('.body').style.padding='4px';a.querySelector('h2').style.fontSize='15px';a.querySelectorAll('p,details').forEach(p=>p.remove());a.querySelector('img').loading='eager'}});
   await Promise.all(keep.map(a=>a.querySelector('img').decode()));return keep.map(a=>a.textContent.trim());
  })()`);
  const dest=`/private/tmp/harem-portraits-qa-${start}.png`;
  fs.writeFileSync(dest,(await w.webContents.capturePage()).toPNG());console.log(JSON.stringify({file:dest,people:result}));app.exit(0);
 }catch(e){console.error(e);app.exit(1)}
});
