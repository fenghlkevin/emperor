const {app,BrowserWindow}=require('electron');
const path=require('node:path');
app.setPath('userData','/private/tmp/harem-decision-profile');
app.whenReady().then(async()=>{
 const w=new BrowserWindow({show:false,width:1360,height:950,webPreferences:{sandbox:true,contextIsolation:true}});
 const run=code=>w.webContents.executeJavaScript(`(async()=>{${code}})()`);
 try{
  for(const decision of ['company','defer','dismiss','rank']){
   await w.loadFile(path.join(__dirname,'../index.html'));
   await run(`const {newGame,SAVE_KEY}=await import('./src/game.mjs');const s=newGame('离宫验收');s.scene='palace';s.phase=2;s.stats.energy=2;localStorage.setItem(SAVE_KEY,JSON.stringify(s));`);
   await w.loadFile(path.join(__dirname,'../index.html'));
   if(decision==='company'){
    await run(`document.querySelector('#continue').click();document.querySelector('[data-entry="harem"]').click();window.beforeSleep=JSON.parse(localStorage.getItem('emperor.save.v1'));document.querySelector('[data-company]').click();if(!document.querySelector('.harem-sleep-dialog'))throw Error('未进入相伴安寝');document.querySelector('.harem-sleep-dialog [data-exit]').click();`);
    console.log(await run(`for(let i=0;i<100&&document.querySelector('.harem-dialog');i++)await new Promise(r=>setTimeout(r,30));const saved=JSON.parse(localStorage.getItem('emperor.save.v1')),before=window.beforeSleep;if(document.querySelector('.harem-dialog')||document.querySelector('.harem-sleep-dialog')||!document.querySelector('.scene.palace')||saved.scene!=='palace')throw Error('相伴安寝后未直接返回皇城');if(saved.stats.energy<=before.stats.energy||saved.harem.members[0].experience!==before.harem.members[0].experience+1)throw Error('安寝未结算或重复结算');if(saved.phase!==before.phase+1||saved.turn!==before.turn)throw Error('离宫时段推进异常');return 'company: 安寝结算且直接返回皇城通过';`));
    continue;
   }
   await run(`document.querySelector('#continue').click();document.querySelector('[data-entry="harem"]').click();document.querySelector('[data-arrange]').click();document.querySelector('.harem-sleep-dialog [data-exit]').click();`);
   await run(`for(let i=0;i<100&&!document.querySelector('[data-defer]');i++)await new Promise(r=>setTimeout(r,30));if(!document.querySelector('[data-defer]'))throw Error('未进入晨起相见');window.beforeDecision=JSON.parse(localStorage.getItem('emperor.save.v1'));`);
   await run(decision==='rank'?`document.querySelector('[data-admit]').click();document.querySelector('[data-rank-choice="2"]').click();`:`document.querySelector('[data-${decision}]').click();`);
   console.log(await run(`for(let i=0;i<100&&document.querySelector('.harem-dialog');i++)await new Promise(r=>setTimeout(r,30));const saved=JSON.parse(localStorage.getItem('emperor.save.v1')),before=window.beforeDecision;if(document.querySelector('.harem-dialog')||!document.querySelector('.scene.palace')||saved.scene!=='palace')throw Error('未直接返回皇城');if(saved.stats.energy!==before.stats.energy)throw Error('决定耗费体力');if(saved.phase!==before.phase+1||saved.turn!==before.turn)throw Error('离宫时段推进异常');if(saved.harem.encounter)throw Error('待选未清理');if('${decision}'==='dismiss'?saved.harem.members.length!==before.harem.members.length:saved.harem.members.length!==before.harem.members.length+1)throw Error('决定未保存');return '${decision}: 不耗体力、决定存档、直接返回皇城通过';`));
  }
  app.exit(0);
 }catch(e){console.error(e);app.exit(1);}
});
