const {app,BrowserWindow}=require('electron');
const path=require('node:path');
app.setPath('userData','/private/tmp/emperor-court-fallback-test');
app.whenReady().then(async()=>{const w=new BrowserWindow({show:false,webPreferences:{sandbox:true,contextIsolation:true,nodeIntegration:false}});try{
await w.loadFile(path.join(__dirname,'../index.html'));
await w.webContents.executeJavaScript(`(async()=>{
const {mountCourtActors,courtActorRecords}=await import('./src/court-actors.mjs');
const {newGame}=await import('./src/game.mjs');
const domestic=newGame('加载容错').domestic,records=courtActorRecords(domestic);
const scene=document.createElement('section');scene.className='scene court';scene.style.width='800px';scene.style.height='600px';
scene.innerHTML='<img src="assets/scenes/court/sketch-court-background-urban-v9.png">'+records.map(({office})=>'<button data-entry="'+office.id+'" style="clip-path:circle(10%)"><span>'+office.name+'</span></button>').join('');document.body.append(scene);
const art=records.find(r=>r.office.id==='revenue-minister').art,original=art.court;art.court='assets/officials/missing-test.png';
const cleanup=mountCourtActors(scene,domestic);
for(let i=0;i<200&&scene.dataset.courtReady==='loading';i++)await new Promise(r=>setTimeout(r,25));
if(scene.dataset.courtReady!=='fallback'||!scene.querySelector('img').src.endsWith('sketch-court-emperor-pov-v7.png')||scene.querySelector('.court-person'))throw Error('加载失败未恢复群臣');
cleanup();art.court=original;const dispose=mountCourtActors(scene,domestic);
for(let i=0;i<200&&scene.dataset.courtReady==='loading';i++)await new Promise(r=>setTimeout(r,25));
if(scene.dataset.courtReady!=='true'||scene.querySelectorAll('canvas').length!==13)throw Error('加载恢复后人物未显示');
if([...scene.querySelectorAll('.court-person')].some(b=>b.style.clipPath!=='none'))throw Error('人物仍被旧轮廓裁切');dispose();
})()`);
console.log('素材加载失败回退、恢复加载与人物裁切检查通过');app.exit(0);
}catch(error){console.error(error);app.exit(1);}});
