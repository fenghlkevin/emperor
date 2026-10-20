const {app,BrowserWindow}=require('electron');
const path=require('node:path');
const fs=require('node:fs');
const {waitForSelector}=require('./helpers/wait-for-selector.cjs');
app.setPath('userData','/private/tmp/emperor-governance-scroll-test');
app.whenReady().then(async()=>{
 const w=new BrowserWindow({show:false,width:1440,height:1000,webPreferences:{sandbox:true,contextIsolation:true,nodeIntegration:false}});
 const errors=[];w.webContents.on('console-message',(_,d)=>{if(d.level==='error')errors.push(d.message);});
 try{
  await w.loadFile(path.join(__dirname,'../index.html'));
  await w.webContents.executeJavaScript(`(async()=>{
   const waitForSelector=${waitForSelector.toString()};
   const click=selector=>{const el=document.querySelector(selector);if(!el)throw Error('缺少入口 '+selector);el.click();};
   click('#new-dynasty');document.querySelector('#name').value='国政验收';document.querySelector('#country-name').value='大明';document.querySelector('#era-name').value='承平';document.querySelector('#create').requestSubmit();
   click('[data-scene=court]');await waitForSelector('.scene.court[data-court-ready=true],.scene.court[data-court-ready=fallback]');
   const before=localStorage.getItem('emperor.save.v1');click('[data-entry=prime-minister]');
   await waitForSelector('[data-court-action=office-report]');
   document.querySelector('[data-court-action=office-report]').click();
   await waitForSelector('.governance-dialog[open]');
   if(!document.querySelector('.governance-dialog[open]'))throw Error('宰相汇总入口未接通');
   if(localStorage.getItem('emperor.save.v1')!==before)throw Error('查阅更改了存档');
   await document.fonts.ready;
   await Promise.all(['assets/scenes/governance/sketch-governance-treasury-states-v1.png','assets/scenes/governance/sketch-governance-scenes-v1.png','assets/scenes/governance/sketch-governance-scroll-frame-v2.png'].map(src=>{const i=new Image();i.src=src;return i.decode();}));
  })()`);
  fs.mkdirSync(path.join(__dirname,'../docs/screenshots'),{recursive:true});
  await new Promise(r=>setTimeout(r,100));
  fs.writeFileSync(path.join(__dirname,'../docs/screenshots/court-governance-in-game.png'),(await w.webContents.capturePage()).toPNG());
  await w.webContents.executeJavaScript(`(async()=>{
   const click=selector=>document.querySelector(selector).click();
   click('.governance-header button');
   await new Promise(r=>setTimeout(r,100));
  })()`);
  await w.webContents.executeJavaScript(`(async()=>{
   const {newGame}=await import('./src/game.mjs');const {openOfficeReport}=await import('./src/court-office-access.mjs');
   window.govState=newGame('图卷验收');window.govOpen=()=>openOfficeReport(window.govState,document.querySelector('#app'),'prime-minister');
   document.querySelector('#app').innerHTML='';window.govOpen();await document.fonts.ready;
   const urls=['assets/scenes/governance/sketch-governance-treasury-states-v1.png','assets/scenes/governance/sketch-governance-scenes-v1.png','assets/scenes/governance/sketch-governance-scroll-frame-v2.png','src/governance-ink-mask.svg'];
   await Promise.all(urls.map(src=>new Promise((resolve,reject)=>{const i=new Image();i.onload=resolve;i.onerror=reject;i.src=src;})));
  })()`);
  const output=path.join(__dirname,'../docs/screenshots');fs.mkdirSync(output,{recursive:true});
  for(const [scene,cash,debt] of [['rich',800000,0],['low',1475,0],['light',0,5000],['heavy',0,500000]]){
   await w.webContents.executeJavaScript(`(()=>{document.querySelector('dialog').close();const s=window.govState,c=s.domestic.countries.find(c=>c.id===s.domestic.playerCountryId);c.fiscal.treasury=${cash};c.fiscal.debt=${debt};c.ledger=[{turn:s.turn,income:12618,expenditure:21143,closingTreasury:${cash}}];window.govOpen();})()`);
   await new Promise(r=>setTimeout(r,120));
   const state=await w.webContents.executeJavaScript(`(()=>{const d=document.querySelector('dialog'),s=d.querySelector('.governance-scroll');return {scene:s.dataset.treasuryScene,overflow:d.scrollWidth>d.clientWidth+1,open:d.open,rolls:d.querySelectorAll('.governance-roller').length};})()`);
   if(state.scene!==scene||state.overflow||!state.open||state.rolls!==2)throw Error(JSON.stringify(state));
   await w.webContents.executeJavaScript(`(()=>{for(const art of document.querySelectorAll('.governance-art')){const p=getComputedStyle(art,'::before');if(Math.abs(parseFloat(p.width)/parseFloat(p.height)-1.5)>.01)throw Error('插画比例拉伸');}const d=document.querySelector('dialog'),a=d.getBoundingClientRect(),f=d.querySelector('footer').getBoundingClientRect();if(f.bottom>a.bottom||f.top<a.top)throw Error('卷尾结算超出绢面');})()`);
   fs.writeFileSync(path.join(output,'court-governance-'+scene+'.png'),(await w.webContents.capturePage()).toPNG());
  }
  for(const [width,height] of [[1280,800],[900,680],[390,844]]){
   w.setSize(width,height);await new Promise(r=>setTimeout(r,120));
   const checks=await w.webContents.executeJavaScript(`(()=>{const d=document.querySelector('dialog'),close=d.querySelector('button'),r=d.getBoundingClientRect(),b=close.getBoundingClientRect();if(getComputedStyle(d.querySelector('footer')).position!=='static')throw Error('结算栏覆盖正文');return {overflow:d.scrollWidth>d.clientWidth+1,visible:b.top>=0&&b.right<=innerWidth,within:r.left>=0&&r.right<=innerWidth,scrollable:d.scrollHeight>d.clientHeight};})()`);
   if(checks.overflow||!checks.visible||!checks.within)throw Error(width+': '+JSON.stringify(checks));
   fs.writeFileSync(path.join(output,'court-governance-'+width+'.png'),(await w.webContents.capturePage()).toPNG());
  }
  await w.webContents.executeJavaScript(`document.querySelector('dialog button').click();`);
  if(await w.webContents.executeJavaScript(`Boolean(document.querySelector('dialog'))`))throw Error('关闭未移除弹窗');
  if(errors.length)throw Error(errors.join('\n'));
  console.log('卷轴四状态、原账本、素材加载、1440/1280/900/390布局和关闭通过');app.exit(0);
 }catch(e){console.error(e);app.exit(1);}
});
