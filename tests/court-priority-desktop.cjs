const {app,BrowserWindow}=require('electron');
const fs=require('node:fs'),path=require('node:path');
const {waitForSelector}=require('./helpers/wait-for-selector.cjs');
app.setPath('userData',`/private/tmp/emperor-court-priority-${process.pid}`);
app.whenReady().then(async()=>{
 const w=new BrowserWindow({show:false,width:900,height:680,webPreferences:{sandbox:true,contextIsolation:true,nodeIntegration:false,backgroundThrottling:false}});
 const timer=setTimeout(()=>app.exit(1),120000);
 const run=c=>w.webContents.executeJavaScript(`(async()=>{const waitForSelector=${waitForSelector.toString()};${c}})()`);
 try{
  await w.loadFile(path.join(__dirname,'../index.html'));
  const base=await run(`const {newGame,validateSave}=await import('./src/game.mjs'),{startCampaign}=await import('./src/foreign-strategy.mjs');const s=newGame('军情优先验收');s.turn=37;s.scene='court';startCampaign(s.domestic,'xi','hebei',37);validateSave(s);return JSON.stringify(s);`);
  const routes=[['户部人物',`document.querySelector('[data-entry=revenue-minister]').click();`],['御案舆图',`document.querySelector('[data-court-atlas]').click();`],['国库概览',`document.querySelector('[data-court-overview]').click();`],['召见名册',`document.querySelector('[data-court-roster]').click();document.querySelector('[data-court-summon=personnel-minister]').click();`],['主动退朝',`document.querySelector('#next').click();`],['本朝纪事',`document.querySelector('#chronicle').click();`],['军情奏折',`document.querySelector('[data-court-petition=war]').click();document.querySelector('[data-court-defer]').click();await new Promise(r=>setTimeout(r,80));if(!JSON.parse(localStorage.getItem('emperor.save.v1')).domestic.strategy.pending)throw Error('留待再议清除了军情');document.querySelector('[data-court-petition=war]').click();document.querySelector('[data-court-follow]').click();`]];
  for(const [label,action]of routes){
   await run(`localStorage.setItem('emperor.save.v1',${JSON.stringify(base)});`);await w.reload();
   await run(`document.querySelector('#continue').click();await waitForSelector('.scene.court[data-court-ready=true],.scene.court[data-court-ready=fallback]');window.beforePriority=localStorage.getItem('emperor.save.v1');${action}await new Promise(r=>setTimeout(r,180));if(!document.querySelector('.court-defense[open]'))throw Error(${JSON.stringify(label+'未优先守城')});if(localStorage.getItem('emperor.save.v1')!==window.beforePriority)throw Error(${JSON.stringify(label+'查阅军情修改了存档')});`);
  }
  fs.writeFileSync('/private/tmp/emperor-court-priority.png',(await w.webContents.capturePage()).toPNG());
  clearTimeout(timer);console.log('七条朝堂入口军情优先通过；留待再议保留风险，查阅不写档。受控第37旬真实来敌命令场景。');app.exit(0);
 }catch(e){console.error(e);fs.writeFileSync('/private/tmp/emperor-court-priority-failure.png',(await w.webContents.capturePage()).toPNG());clearTimeout(timer);app.exit(1);}
});
