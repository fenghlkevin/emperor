const {app,BrowserWindow}=require('electron');
const fs=require('node:fs'),path=require('node:path');
app.setPath('userData','/private/tmp/emperor-art-gallery');
app.whenReady().then(async()=>{try{
 const w=new BrowserWindow({show:false,width:1600,height:1200,webPreferences:{sandbox:true,contextIsolation:true}});
 await w.loadFile(path.join(__dirname,'../docs/official-art/gallery.html'));
 const pages=await w.webContents.executeJavaScript(`(async()=>{
 const cards=[...document.querySelectorAll('article')];
 const random=${process.argv.includes('--random')};
 if(random)cards.forEach(c=>{if(!c.querySelector('small').textContent.startsWith('random-'))c.remove()});
 document.querySelector('main').style.gridTemplateColumns='repeat(5,1fr)';
 document.querySelectorAll('img').forEach(i=>{i.loading='eager';i.style.height='200px'});
 await Promise.all([...document.images].map(i=>i.decode().catch(()=>{})));
 return Math.ceil(document.documentElement.scrollHeight/1100);
 })()`);
 for(let i=0;i<pages;i++){
  await w.webContents.executeJavaScript(`window.scrollTo(0,${i*1100})`);
  await new Promise(r=>setTimeout(r,150));
  const file='/private/tmp/official-art-'+(process.argv.includes('--random')?'random-':'all-')+i+'.png';
  fs.writeFileSync(file,(await w.webContents.capturePage()).toPNG());console.log(file);
 }
 app.exit(0);
}catch(e){console.error(e);app.exit(1)}});
