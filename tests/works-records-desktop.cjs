const {app,BrowserWindow}=require('electron');
const fs=require('node:fs');
app.setPath('userData',`/tmp/works-records-qa-${process.pid}`);
app.whenReady().then(async()=>{const w=new BrowserWindow({show:true,width:1100,height:800,webPreferences:{contextIsolation:true,backgroundThrottling:false}});try{
await w.loadFile(process.cwd()+'/index.html');
for(const [width,height] of [[1440,1000],[1100,800],[900,680]]){
w.setSize(width,height);
await w.webContents.executeJavaScript(`(async()=>{const {newGame}=await import('./src/game.mjs');const {openWorksMinister}=await import('./src/works-minister-ui.mjs');const s=newGame('记录验收');s.domestic.industryActions.history=Array.from({length:100},(_,i)=>({turn:100-i,message:'河北城州扩建已开工，预付5000两；完工后容量与土地生效。'.repeat(10)}));window.qa=openWorksMinister(s,document.body,()=>{throw Error('只读记录不得提交')},()=>{},{kind:'records'});await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));const d=qa,b=d.getBoundingClientRect();if(d.querySelector('[data-execute]'))throw Error('残留颁旨按钮');for(const el of d.querySelectorAll('nav button,header button')){const r=el.getBoundingClientRect();if(r.bottom>b.bottom||r.top<b.top||r.bottom>innerHeight)throw Error('按钮越界');}d.querySelector('[data-next]').click();if(!d.querySelector('nav span').textContent.startsWith('2 /'))throw Error('翻页失败');})()`);
fs.writeFileSync('/tmp/works-records-'+width+'.png',(await w.webContents.capturePage()).toPNG());
await w.webContents.executeJavaScript('qa.close()');console.log(width,height,'PASS');
}app.exit(0);}catch(e){console.error(e);app.exit(1);}});
