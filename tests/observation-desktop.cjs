const {app,BrowserWindow}=require('electron');const path=require('node:path'),fs=require('node:fs');
app.setPath('userData','/private/tmp/emperor-observation-profile');
app.whenReady().then(async()=>{const w=new BrowserWindow({show:false,width:1440,height:1000,webPreferences:{contextIsolation:true,nodeIntegration:false,sandbox:true}});try{
 await w.loadFile(path.join(__dirname,'../index.html'));
 const result=await w.webContents.executeJavaScript(`(async()=>{
 const {newGame}=await import('./src/game.mjs');const {openObservation}=await import('./src/observation-ui.mjs');const {palaceOutline}=await import('./src/palace-outlines.mjs');
 const outline=palaceOutline('view');if(outline.x<40||outline.x>50||outline.y<60)throw Error('wrong gate position');
 let state=newGame('观景帝');state.phase=1;let commits=0;
 const dialog=openObservation(state,document.querySelector('#app'),next=>{state=next;commits++;},()=>{});
 await new Promise((resolve,reject)=>{let n=0;const timer=setInterval(()=>{if(commits){clearInterval(timer);resolve();}else if(n++>100){clearInterval(timer);reject(Error('scene did not commit'));}},100);});
 if(!dialog.querySelector('canvas').dataset.figures)throw Error('missing crowd');
 if(!dialog.querySelector('[role=status]').textContent.includes('朝拜'))throw Error('missing result');
 dialog.querySelector('details').open=true;
 const {observationReport}=await import('./src/observation.mjs');
 const {paintCrowd}=await import('./src/observation-ui.mjs');const sprite=new Image();sprite.src='assets/sketch-observation-commoner-v1.png';await sprite.decode();
 const canvas=dialog.querySelector('canvas');paintCrowd(canvas,sprite,{count:20});const sparse=Number(canvas.dataset.figures);paintCrowd(canvas,sprite,{count:6000});if(Number(canvas.dataset.figures)<=sparse)throw Error('density unchanged');paintCrowd(canvas,sprite,observationReport(state));
 return 'gate hotspot, asset loading, crowd density, activity commit verified';})()`);
 console.log(result);fs.mkdirSync(path.join(__dirname,'../outputs/observation'),{recursive:true});await new Promise(r=>setTimeout(r,1300));fs.writeFileSync(path.join(__dirname,'../outputs/observation/scene.png'),(await w.webContents.capturePage()).toPNG());app.exit(0);
 }catch(e){console.error(e);app.exit(1);}});
