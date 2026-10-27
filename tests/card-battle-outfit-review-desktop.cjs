const {app,BrowserWindow}=require('electron'),fs=require('node:fs'),path=require('node:path');
app.setPath('userData','/private/tmp/card-outfit-review-'+process.pid);
app.whenReady().then(async()=>{const w=new BrowserWindow({show:false,width:1500,height:1060,webPreferences:{sandbox:true,contextIsolation:true,nodeIntegration:false,backgroundThrottling:false}});try{
const root=path.join(__dirname,'..'),all=JSON.parse(fs.readFileSync(path.join(root,'docs/card-battle-person-cultural-evidence.json'),'utf8')).people;
const existing=JSON.parse(fs.readFileSync(path.join(root,'docs/card-battle-historical-regional-outfit-review.json'),'utf8')).rows;
const done=new Set(existing.map(x=>x.personId)),batch=all.filter(x=>!done.has(x.personId)).slice(0,30),pages=[];
await w.loadFile(path.join(root,'index.html'));await w.webContents.executeJavaScript(`new Promise((resolve,reject)=>{const link=document.createElement('link');link.rel='stylesheet';link.href='./tests/card-battle-outfit-review.css';link.onload=resolve;link.onerror=reject;document.head.append(link);})`);
for(let page=0;page<Math.ceil(batch.length/10);page++){
 const people=batch.slice(page*10,page*10+10).map(x=>({id:x.personId,name:x.name,period:x.period??'原作身份未定',src:'assets/battle/people/'+x.personId+'-battle-v1.png'}));
 await w.webContents.executeJavaScript(`(async()=>{document.body.innerHTML='<main class="outfit-review"></main>';const people=${JSON.stringify(people)};for(const p of people){const f=document.createElement('figure'),label=document.createElement('figcaption'),img=new Image();label.textContent=p.name+' · '+p.period+' · '+p.id;img.src=p.src;f.append(label,img);document.querySelector('main').append(f);await img.decode();if(!img.naturalWidth)throw Error(p.id);}if(document.querySelector('figure:last-child').getBoundingClientRect().bottom>innerHeight)throw Error('review image clipped');if(getComputedStyle(document.querySelector('main')).display!=='grid')throw Error('review layout not loaded');await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));})()`);
 const file='docs/screenshots/card-outfit-review-batch-'+(existing.length+1)+'-page-'+(page+1)+'.png';fs.writeFileSync(path.join(root,file),(await w.webContents.capturePage()).toPNG());pages.push({path:file,people});
}
const report={scope:'30人已有卡面的人工服饰视检联系页，不代替实战/性能/考古复原验收',batchSize:batch.length,pages};fs.writeFileSync(path.join(root,'docs/card-battle-outfit-current-batch.json'),JSON.stringify(report,null,2));console.log(JSON.stringify({batch:batch.length,pages:pages.length}));app.exit(0);
}catch(e){console.error(e);app.exit(1);}});
