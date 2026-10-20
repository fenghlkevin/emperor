const {app,BrowserWindow}=require('electron');
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
app.setPath('userData',`/private/tmp/emperor-atlas-scroll-${process.pid}`);
app.whenReady().then(async()=>{
 const w=new BrowserWindow({show:false,width:1440,height:1000,webPreferences:{sandbox:true,contextIsolation:true}});
 const run=s=>w.webContents.executeJavaScript(`(async()=>{${s}})()`);
 try{
  await w.loadFile(path.join(__dirname,'../index.html'));
  await run(`window.s=(await import('./src/game.mjs')).newGame('卷轴验收');window.atlas=await import('./src/court-atlas-ui.mjs');window.commits=0;atlas.openCourtAtlas(s,document.querySelector('#app'),()=>{commits++},()=>{},{tab:'grain'});await document.fonts.ready;`);
  for(const [width,height]of [[1440,1000],[1280,800],[390,844]]){
   w.setContentSize(width,height);await new Promise(r=>setTimeout(r,250));
   const result=await run(`const d=document.querySelector('.court-atlas'),close=d.querySelector('[data-atlas-close]').getBoundingClientRect(),box=d.getBoundingClientRect(),review=d.querySelector('[data-atlas-purchase]').getBoundingClientRect(),title=d.querySelector('h1').getBoundingClientRect();if(Math.abs((title.top+title.height/2)-(box.top+box.height*.092))>2)throw Error('标题未居中于匾额');return {center:Math.abs((close.left+close.width/2)-(box.left+box.width/2)),bottom:close.bottom,height:innerHeight,reviewVisible:review.top>=0&&review.bottom<=innerHeight,closeBelow:close.top>box.top+box.height*.9,scene:d.querySelector('.atlas-regional-scene').getAttribute('data-regional-scene')};`);
   assert(result.center<2,'关闭按钮须居中');assert(result.bottom<=result.height,'关闭按钮超出屏幕');assert(result.closeBelow,'关闭按钮须位于卷轴底部');assert(result.reviewVisible,'拟旨按钮必须可见');
   fs.mkdirSync(path.join(__dirname,'../docs/screenshots'),{recursive:true});fs.writeFileSync(path.join(__dirname,`../docs/screenshots/atlas-scroll-${width}.png`),(await w.webContents.capturePage()).toPNG());
  }
  w.setContentSize(1440,1000);
  await run(`window.seenScenes=new Set();for(const id of ['guannei','longyou','hedong','hebei','henan','huainan','shannan','jiannan','jiangnan','lingnan']){const d=document.querySelector('.court-atlas');d.querySelector('[data-atlas-province="'+id+'"]').dispatchEvent(new MouseEvent('click',{bubbles:true}));const position=getComputedStyle(d.querySelector('.atlas-regional-scene')).backgroundPosition;if(seenScenes.has(position))throw Error('地域图片重复 '+id+' '+position);seenScenes.add(position);}`);
  for(const id of ['longyou','jiangnan']){await run(`document.querySelector('[data-atlas-province="${id}"]').dispatchEvent(new MouseEvent('click',{bubbles:true}));`);await new Promise(r=>setTimeout(r,100));fs.writeFileSync(path.join(__dirname,`../docs/screenshots/atlas-scroll-${id}.png`),(await w.webContents.capturePage()).toPNG());}
  await run(`document.querySelector('[data-atlas-province="guannei"]').dispatchEvent(new MouseEvent('click',{bubbles:true}));`);
  await run(`const d=document.querySelector('.court-atlas');window.originalScene=getComputedStyle(d.querySelector('.atlas-regional-scene')).backgroundPosition;d.querySelector('[data-atlas-province="jiangnan"]').dispatchEvent(new MouseEvent('click',{bubbles:true}));if(getComputedStyle(d.querySelector('.atlas-regional-scene')).backgroundPosition===originalScene)throw Error('地域风景未切换');if(d.querySelector('[data-atlas-amount]')||d.textContent.includes('下旬预计缺口')||d.textContent.includes('全国下旬仓损'))throw Error('州情混入购粮或全国指标');if(!d.textContent.includes('粮食总产出')||!d.textContent.includes('工商银税'))throw Error('州情产出缺失');d.querySelector('[data-atlas-close]').click();await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));if(document.querySelector('.court-atlas'))throw Error('关闭未生效');if(commits)throw Error('预览不得执行旨意');`);
  console.log('卷轴布局、地域风景、数量、拟旨返回及底部关闭验收通过');app.exit(0);
 }catch(e){console.error(e);app.exit(1)}
});
