const {app,BrowserWindow}=require('electron');
const path=require('node:path'),fs=require('node:fs');
app.setPath('userData',`/private/tmp/emperor-garrison-overview-${process.pid}`);
app.whenReady().then(async()=>{const w=new BrowserWindow({show:false,width:1440,height:1000,webPreferences:{contextIsolation:true,nodeIntegration:false}});try{
await w.loadFile(path.join(__dirname,'../index.html'));
const result=await w.webContents.executeJavaScript(`(async()=>{
const {newGame}=await import('./src/game.mjs');const {openCourtGarrison}=await import('./src/court-garrison-ui.mjs');const {officeTasks}=await import('./src/court-play-ui.mjs');const {canOfficeNavigate}=await import('./src/court-office-access.mjs');
if(!officeTasks('war-deputy').some(t=>t.action==='garrison')||officeTasks('war-minister').some(t=>t.action==='garrison')||!canOfficeNavigate('war-deputy','garrison')||canOfficeNavigate('war-minister','garrison'))throw Error('入口归属错误');
const s=newGame('点营'),before=JSON.stringify(s);openCourtGarrison(s,document.body,()=>{throw Error('查阅不应写档')});
function check(){const cards=[...document.querySelectorAll('[data-garrison-stock]')];if(cards.length!==9||document.querySelector('[aria-label="选择兵种"]'))throw Error('兵种未同时展示');if(cards.some(c=>c.querySelectorAll('dd').length!==3))throw Error('缺少库存数据');return cards.length;}
check();const select=document.querySelector('[aria-label="选择军营驻地"]');select.value='hebei';select.dispatchEvent(new Event('change'));check();if(!document.querySelector('.garrison-overview h2').textContent.includes('河北'))throw Error('驻地未切换');if(JSON.stringify(s)!==before)throw Error('查阅改变状态');return {cards:check(),depot:document.querySelector('.garrison-overview h2').textContent};})()`);
await new Promise(r=>setTimeout(r,300));fs.writeFileSync('/private/tmp/emperor-garrison-overview.png',(await w.webContents.capturePage()).toPNG());console.log(result);app.exit(0);
}catch(e){console.error(e);app.exit(1);}});
