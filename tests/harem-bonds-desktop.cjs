const {app,BrowserWindow}=require('electron');
const path=require('node:path'),fs=require('node:fs');
app.setPath('userData','/private/tmp/harem-bonds-desktop-profile');
app.whenReady().then(async()=>{
 const w=new BrowserWindow({show:false,width:1360,height:950,webPreferences:{sandbox:true,contextIsolation:true}});
 const run=code=>w.webContents.executeJavaScript(`(async()=>{${code}})()`);
 const shot=async name=>{await new Promise(r=>setTimeout(r,200));fs.writeFileSync('/private/tmp/'+name,(await w.webContents.capturePage()).toPNG());};
 try{
  await w.loadFile(path.join(__dirname,'../index.html'));
  await run(`
   const {newGame,SAVE_KEY}=await import('./src/game.mjs');const {palaceAction}=await import('./src/emperor.mjs');
   Math.random=()=>.99;const base=newGame('佳话验收');base.turn=40;base.phase=2;base.stats.energy=2;base.stats.happiness=65;
   Object.assign(base.harem.members[0],{hiddenTraits:{version:1,source:'historical',kinds:['longevity']},specialty:'园艺',personality:'独立洒脱',experience:60,bond:{visits:6,lastVisitTurn:39,lastEventTurn:0,lifeGranted:0}});
   let ready;for(let seed=1;seed<2000;seed++){base.harem.portraitSeed=seed;const r=palaceAction(base,'company',{id:base.harem.members[0].id});if(r.state.harem.bonds.history[0]?.kind==='longevity'){ready=base;break;}}
   if(!ready)throw Error('延寿样本未找到');localStorage.setItem(SAVE_KEY,JSON.stringify(ready));
  `);
  await w.reload();
  await run(`
   Math.random=()=>.99;document.querySelector('#continue').click();document.querySelector('[data-entry="harem"]').click();
   if(/六旬相伴|隐藏特性|舒心延年/.test(document.querySelector('.harem-dialog').textContent))throw Error('隐藏特性或条件泄漏');
   document.querySelector('[data-company]').click();const status=document.querySelector('.harem-sleep-effects');
   if(!status.textContent.includes('寿元增加 3')||status.textContent.includes('寿元减少 -'))throw Error('晨起寿元正负提示错误：'+status.textContent);
   if(!status.textContent.includes('舒心延年'))throw Error('晨起没有佳话缘由');
   window.bondBefore=JSON.parse(localStorage.getItem('emperor.save.v1'));
  `);
  await shot('harem-bonds-sleep.png');
  await run(`
   const leave=document.querySelector('.harem-sleep-dialog [data-exit]');leave.click();leave.click();
   await new Promise(r=>setTimeout(r,150));
   const saved=JSON.parse(localStorage.getItem('emperor.save.v1'));
   if(saved.stats.life!==window.bondBefore.stats.life+3||saved.harem.bonds.lifeGranted!==3||saved.harem.bonds.history.length!==1)throw Error('奖励重复或未保存');
   if(document.querySelector('.royal-event-dialog')||saved.harem.royalNotices.some(e=>e.kind==='harem-bond'))throw Error('佳话仍有重复弹窗');
  `);
  await run(`
   document.querySelector('[data-entry="harem"]').click();document.querySelector('.harem-bond-history').open=true;
   if(!document.querySelector('.harem-bond-history').textContent.includes('寿元增加3'))throw Error('人物纪事未留存');
  `);
  await shot('harem-bonds-history.png');
  w.setSize(920,720);
  await run(`await new Promise(r=>setTimeout(r,150));const d=document.querySelector('.harem-dialog'),f=d.querySelector('footer').getBoundingClientRect();if(d.scrollWidth>d.clientWidth+1||f.bottom>innerHeight+1)throw Error('小窗口布局溢出');`);
  await shot('harem-bonds-small.png');
  await w.reload();
  await run(`document.querySelector('#continue').click();await new Promise(r=>setTimeout(r,100));if(document.querySelector('.royal-event-dialog'))throw Error('佳话重载后仍弹窗');const s=JSON.parse(localStorage.getItem('emperor.save.v1'));if(s.harem.bonds.history.length!==1||s.harem.bonds.lifeGranted!==3)throw Error('重载奖励丢失');document.querySelector('[data-entry="harem"]').click();if(!document.querySelector('.harem-bond-history').textContent.includes('舒心延年'))throw Error('重载纪事丢失');`);
  console.log('隐藏延寿、晨起反馈、一次结算、无重复弹窗、纪事回看、小窗口和重载通过');app.exit(0);
 }catch(error){console.error(error);app.exit(1);}
});
