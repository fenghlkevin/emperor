const {app,BrowserWindow}=require('electron');
const path=require('node:path'),fs=require('node:fs');
app.setPath('userData',`/private/tmp/emperor-medical-${process.pid}`);
app.whenReady().then(async()=>{
 const w=new BrowserWindow({show:false,width:1440,height:1000,webPreferences:{sandbox:true,backgroundThrottling:false}}),errors=[];
 w.webContents.on('page-error',e=>errors.push(e.message));
 const run=js=>w.webContents.executeJavaScript(`(async()=>{${js}})()`);
 const seed=async health=>{
  await w.loadFile(path.join(__dirname,'../index.html'));
  await run(`const {createPlayableGame}=await import('./src/game.mjs');const s=createPlayableGame('诊治验收','大明');s.phase=2;Object.assign(s.stats,{energy:150,health:${health},happiness:41});localStorage.setItem('emperor.save.v1',JSON.stringify(s));`);
  await w.loadFile(path.join(__dirname,'../index.html'));
  await run(`document.querySelector('.opening-skip')?.click();document.querySelector('#continue').click();`);
 };
 try{
  await seed(18);
  await run(`document.querySelector('[data-quick-sleep]').click();const s=JSON.parse(localStorage.getItem('emperor.save.v1'));if(s.stats.health!==28)throw Error('独寝仍依赖动画等待');if(!document.querySelector('.emperor-vital.health b').textContent.includes('28'))throw Error('侧栏健康未即时刷新');document.querySelector('.dragon-dialog [data-exit]').click();await new Promise(r=>setTimeout(r,50));if(JSON.parse(localStorage.getItem('emperor.save.v1')).stats.health!==28)throw Error('立即离殿丢失恢复');`);
  await run(`if(document.querySelector('#medical'))throw Error('太医院旧侧栏按钮仍存在');const entry=document.querySelector('[data-entry=medical]'),r=entry.getBoundingClientRect();if(!document.elementFromPoint(r.x+r.width/2,r.y+r.height/2)?.closest('[data-entry=medical]'))throw Error('太医院地图入口被遮挡');entry.click();document.querySelector('[data-medical-treat]').click();const s=JSON.parse(localStorage.getItem('emperor.save.v1'));if(s.stats.health!==53||s.stats.energy!==190||s.stats.happiness!==41||s.stats.treasury!==29000)throw Error('太医院恢复/副作用/诊金错误 '+JSON.stringify(s.stats));if(!document.querySelector('[data-medical-treat]').disabled)throw Error('同旬可重复治疗');if(!document.querySelector('.emperor-vital.health b').textContent.includes('53'))throw Error('治疗后侧栏未即时刷新');if(!document.querySelector('.medical-dialog [role=status]').textContent.includes('28→53'))throw Error('缺少实际疗效反馈');`);
  for(const [width,height] of [[1440,1000],[900,720],[520,720]]){
   w.setSize(width,height);await new Promise(r=>setTimeout(r,150));
   await run(`const d=document.querySelector('.medical-dialog'),r=d.getBoundingClientRect();if(r.left<0||r.right>innerWidth+1||r.bottom>innerHeight+1||d.scrollWidth>d.clientWidth+1)throw Error('太医院窗口溢出');const b=d.querySelector('[data-medical-treat]').getBoundingClientRect();if(b.width<=0||b.right>r.right||b.bottom>innerHeight)throw Error('就诊按钮不可见');const message=d.querySelector('[role=status]'),m=message.getBoundingClientRect();if(getComputedStyle(message).display==='none'||m.height<=0||m.bottom>innerHeight)throw Error('诊治结果不可见');`);
   fs.writeFileSync(`/private/tmp/emperor-medical-${width}.png`,(await w.webContents.capturePage()).toPNG());
  }
  w.setSize(1440,1000);
  await run(`document.querySelector('[data-medical-close]').click();await new Promise(r=>setTimeout(r,50));`);
  await w.loadFile(path.join(__dirname,'../index.html'));
  await run(`document.querySelector('.opening-skip')?.click();document.querySelector('#continue').click();document.querySelector('[data-entry=medical]').click();if(!document.querySelector('[data-medical-treat]').disabled)throw Error('读档重置诊治次数');document.querySelector('[data-medical-close]').click();`);
  await seed(8);
  await run(`document.querySelector('#chronicle').click();document.querySelector('[data-treat]').click();document.querySelector('[data-confirm]').click();const s=JSON.parse(localStorage.getItem('emperor.save.v1'));if(s.stats.health!==33||s.stats.energy!==140||s.stats.happiness!==36||s.stats.treasury!==29000)throw Error('紧急诊治未生效');if(!document.querySelector('.chronicle-dialog [role=status]').textContent.includes('8→33'))throw Error('紧急诊治无结果反馈');document.querySelector('[data-medical-clinic]').click();if(!document.querySelector('[data-medical-treat]').disabled)throw Error('两个入口未共用冷却');document.querySelector('[data-medical-close]').click();document.querySelector('.chronicle-dialog [data-close]').click();`);
  await run(`const {newGame}=await import('./src/game.mjs');const {openMedical}=await import('./src/medical-ui.mjs');const s=newGame('失败重试');s.stats.health=18;let reject=true,published;const d=openMedical(s,document.body,n=>{if(reject)return false;published=n;return n;});d.querySelector('[data-medical-treat]').click();if(d.querySelector('[data-medical-health]').textContent.trim().split('/')[0].trim()!=='18'||published||!d.querySelector('[role=status]').textContent.includes('未能'))throw Error('失败保存显示成功');reject=false;d.querySelector('[data-medical-treat]').click();if(published.stats.health!==43||published.stats.treasury!==9000)throw Error('医疗重试重复扣费');d.close();`);
  await run(`const {newGame}=await import('./src/game.mjs');const {openDragon}=await import('./src/dragon-ui.mjs');const s=newGame('独寝重试');s.phase=2;s.stats.health=18;let reject=true,published;const originalDecode=HTMLImageElement.prototype.decode;HTMLImageElement.prototype.decode=()=>Promise.reject(Error('test asset failure'));const d=openDragon(s,document.body,n=>{if(reject)return false;published=n;return n;});if(published||d.dataset.settled||!d.querySelector('[data-rest-retry]'))throw Error('独寝保存失败仍显示成功');reject=false;d.querySelector('[data-rest-retry]').click();await new Promise(r=>setTimeout(r,30));if(published.stats.health!==28||!d.textContent.includes('健康增加10'))throw Error('图片失败阻断了恢复');d.close();HTMLImageElement.prototype.decode=originalDecode;`);
  for(const [width,height] of [[1440,1000],[900,720]]){
   w.setSize(width,height);await new Promise(r=>setTimeout(r,150));
   await run(`const e=document.querySelector('[data-entry=medical]'),r=e.getBoundingClientRect();if(r.width<=0||!document.elementFromPoint(r.x+r.width/2,r.y+r.height/2)?.closest('[data-entry=medical]'))throw Error('地图太医院入口不可点击');if(document.querySelector('#medical'))throw Error('旧侧栏入口未移除');`);
   fs.writeFileSync(`/private/tmp/emperor-medical-map-${width}.png`,(await w.webContents.capturePage()).toPNG());
  }
  if(errors.length)throw Error(errors.join('\n'));
  console.log('独寝立即结算/提前离殿/图片失败/保存失败重试、侧栏即时刷新、太医院恢复与副作用、紧急诊治及共享旬限额、读档和三尺寸验收通过');app.exit(0);
 }catch(e){console.error(e);app.exit(1);}
});
