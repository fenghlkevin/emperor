const {app,BrowserWindow}=require('electron');
const path=require('node:path'),fs=require('node:fs');
app.setPath('userData',`/private/tmp/emperor-balance-ui-${process.pid}`);
app.whenReady().then(async()=>{
 const w=new BrowserWindow({show:false,width:1440,height:1000,webPreferences:{sandbox:true,backgroundThrottling:false}}),errors=[];
 w.webContents.on('page-error',e=>errors.push(e.message));
 const run=js=>w.webContents.executeJavaScript(`(async()=>{${js}})()`);
 try{
  await w.loadFile(path.join(__dirname,'../index.html'));
  await run(`const {createPlayableGame}=await import('./src/game.mjs');const s=createPlayableGame('调养验收','大明');s.phase=2;Object.assign(s.stats,{energy:150,health:18,happiness:41});localStorage.setItem('emperor.save.v1',JSON.stringify(s));`);
  await w.reload();await new Promise(r=>setTimeout(r,600));
  await run(`document.querySelector('.opening-skip')?.click();document.querySelector('#continue').click();await document.querySelector('.palace-season-image').decode();if(document.querySelector('[data-quick-garden]'))throw Error('旧游园按钮仍在侧栏');const panel=document.querySelector('.emperor-panel');for(const name of ['健康','快乐','寿元'])if(!panel.textContent.includes(name))throw Error('missing '+name);if(!panel.textContent.includes('现为18'))throw Error('health gate missing');const garden=document.querySelector('[data-entry=garden]'),r=garden.getBoundingClientRect();if(!document.elementFromPoint(r.x+r.width/2,r.y+r.height/2)?.closest('[data-entry=garden]'))throw Error('花园地图入口被遮挡');garden.click();const s=JSON.parse(localStorage.getItem('emperor.save.v1'));if(s.stats.energy!==130||s.stats.health!==23||s.stats.happiness!==61)throw Error('garden did not persist actual gains');await document.querySelector('.garden-scene>img').decode();document.querySelector('.garden-scene').click();`);
  for(const [width,height] of [[1440,1000],[900,720]]){
   w.setSize(width,height);await new Promise(r=>setTimeout(r,200));
   await run(`for(const selector of ['.emperor-vital.health','.emperor-vital.happiness','[data-entry=garden]']){const e=document.querySelector(selector),r=e.getBoundingClientRect();if(r.width<=0||r.right>innerWidth||r.bottom>innerHeight)throw Error(selector+' out of viewport');}if(document.documentElement.scrollWidth>innerWidth)throw Error('page horizontal overflow');`);
   fs.writeFileSync(`/private/tmp/emperor-balance-${width}.png`,(await w.webContents.capturePage()).toPNG());
  }
  await run(`document.querySelector('[data-quick-sleep]').click();await new Promise(r=>setTimeout(r,3800));const s=JSON.parse(localStorage.getItem('emperor.save.v1'));if(s.stats.health!==33||s.stats.happiness!==66||s.stats.energy!==200)throw Error('sleep gains incorrect');document.querySelector('.dragon-dialog').close();`);
  if(errors.length)throw Error(errors.join('\n'));
  console.log('健康与快乐显示、游园真实提交、独寝恢复、1440与900窗口验收通过');app.exit(0);
 }catch(e){console.error(e);app.exit(1);}
});
