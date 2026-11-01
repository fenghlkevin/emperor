const {app,BrowserWindow}=require('electron');
const fs=require('node:fs');
app.setPath('userData',`/tmp/development-capacity-qa-${process.pid}`);
app.whenReady().then(async()=>{const w=new BrowserWindow({show:true,width:1100,height:800,webPreferences:{contextIsolation:true,backgroundThrottling:false}});try{
await w.loadFile(process.cwd()+'/index.html');
await new Promise(r=>setTimeout(r,700));
await w.webContents.executeJavaScript("document.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true}))");
await new Promise(r=>setTimeout(r,300));
for(const [width,height] of [[1440,1000],[1100,800],[900,680]]){
w.setSize(width,height);
await w.webContents.executeJavaScript(`(async()=>{const {newGame}=await import('./src/game.mjs');const {openWorksMinister}=await import('./src/works-minister-ui.mjs');const s=(await import('./src/game.mjs')).createPlayableGame('开发规模');const p=s.domestic.provinces.find(p=>p.id==='henan');p.disaster=null;p.population.professions.militia=400;window.qa=openWorksMinister(s,document.body,()=>{throw Error('只读记录不得提交')},()=>{},{kind:'develop',provinceId:'henan'});await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));const d=qa,b=d.getBoundingClientRect();const n=d.querySelector('[data-value=area]');if(Number(n.max)<=500)throw Error('仍受500亩限制');n.nextElementSibling.querySelector('button:last-child').click();if(Number(n.value)!==Number(n.max))throw Error('Max未同步');if(d.querySelector('[data-execute]').disabled)throw Error(d.querySelector('[data-error]').textContent);const f=d.querySelector('.wm-order').getBoundingClientRect();if(f.bottom>b.bottom)throw Error('底部溢出');})()`);
await new Promise(r=>setTimeout(r,200));
fs.writeFileSync('/tmp/development-capacity-'+width+'.png',(await w.webContents.capturePage()).toPNG());
await w.webContents.executeJavaScript('qa.close()');console.log(width,height,'PASS');
}app.exit(0);}catch(e){console.error(e);app.exit(1);}});
