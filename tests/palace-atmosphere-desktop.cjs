const {app,BrowserWindow}=require('electron');
const path=require('node:path'),fs=require('node:fs');
app.setPath('userData','/private/tmp/emperor-season-profile');
app.whenReady().then(async()=>{
const w=new BrowserWindow({show:false,width:1440,height:1000,webPreferences:{contextIsolation:true,nodeIntegration:false,sandbox:true}});
try{
await w.loadFile(path.join(__dirname,'../index.html'));
await w.webContents.executeJavaScript('localStorage.clear()');
await w.loadFile(path.join(__dirname,'../index.html'));
const result=await w.webContents.executeJavaScript(`(async()=>{
 const {palaceArtwork}=await import('./src/palace-atmosphere.mjs');
 localStorage.clear();document.querySelector('#name').value='四时帝';document.querySelector('#create').requestSubmit();
 const scene=document.querySelector('.scene.palace');
 const layers=[];
 for(let season=0;season<4;season++)for(let phase=0;phase<6;phase++){
 scene.querySelector('.palace-artwork').outerHTML=palaceArtwork({turn:1+season*9,phase});
 const image=scene.querySelector('.palace-season-image');await image.decode();
 if(image.naturalWidth<1000)throw Error('missing seasonal image');
 const art=scene.querySelector('.palace-artwork');if(getComputedStyle(art).pointerEvents!=='none')throw Error('blocked hotspots');
 layers.push(getComputedStyle(image).filter);
 }
 if(new Set(layers).size!==6)throw Error('expected six lighting states');
 scene.querySelector('.palace-artwork').outerHTML=palaceArtwork({turn:28,phase:5});
 await scene.querySelector('.palace-season-image').decode();
 const target=scene.querySelector('[data-entry="court"]'),r=target.getBoundingClientRect();
 if(!document.elementFromPoint(r.x+r.width/2,r.y+r.height/2)?.closest('[data-entry="court"]'))throw Error('hotspot obscured');
 return '24 seasonal/daylight combinations loaded, six distinct lighting states, hotspots accessible';
})()`);
console.log(result);
const out=path.join(__dirname,'../outputs/palace-atmosphere');fs.mkdirSync(out,{recursive:true});
for(const [name,turn,phase]of [['winter-night',28,5],['spring-dawn',1,0],['summer-noon',10,2],['autumn-dusk',19,4]]){
 await w.webContents.executeJavaScript(`(()=>{const s=JSON.parse(localStorage.getItem('emperor.save.v1'));s.turn=${turn};s.phase=${phase};s.scene='palace';localStorage.setItem('emperor.save.v1',JSON.stringify(s));})()`);
 await w.loadFile(path.join(__dirname,'../index.html'));
 await w.webContents.executeJavaScript(`(async()=>{document.querySelector('#continue').click();await document.querySelector('.palace-season-image').decode();await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));})()`);
 if(phase===2)await w.webContents.executeJavaScript(`(()=>{
 const court=document.querySelector('[data-entry="court"]');
 if(!court.classList.contains('is-unavailable'))throw Error('expected court closed after morning');
 court.classList.add('selected');
 const outline=getComputedStyle(court.querySelector('.outline'));
 if(outline.display==='none'||outline.opacity!=='1')throw Error('selected daytime court contour hidden');
 if(getComputedStyle(court.querySelector('span')).pointerEvents!=='auto')throw Error('building label cannot trigger hover');
 court.classList.remove('selected');
 })()`);
 if(phase===5)await w.webContents.executeJavaScript(`(()=>{
 const court=document.querySelector('[data-entry="court"]');
 if(court.classList.contains('selected'))throw Error('closed court selected at night');
 if(getComputedStyle(court.querySelector('.outline')).display!=='none')throw Error('closed court outline visible at night');
 if(!court.querySelector('span').hidden)throw Error('closed court label visible at night');
 for(const id of ['dragon','harem']){
 const entry=document.querySelector('[data-entry="'+id+'"]');
 if(entry.classList.contains('is-unavailable')||entry.querySelector('span').hidden)throw Error('night resting entry unavailable');
 }
 })()`);
 await new Promise(r=>setTimeout(r,100));
 fs.writeFileSync(path.join(out,name+'.png'),(await w.webContents.capturePage()).toPNG());
}
app.exit(0);
}catch(e){console.error(e);app.exit(1);}
});
