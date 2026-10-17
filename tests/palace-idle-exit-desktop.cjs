const {app,BrowserWindow}=require('electron');
const path=require('node:path');
app.setPath('userData','/private/tmp/emperor-idle-exit-profile');
app.whenReady().then(async()=>{
 const w=new BrowserWindow({show:false,webPreferences:{sandbox:true,contextIsolation:true}});
 const run=code=>w.webContents.executeJavaScript(`(async()=>{${code}})()`);
 try{
  await w.loadFile(path.join(__dirname,'../index.html'));
  await run(`const {newGame,SAVE_KEY}=await import('./src/game.mjs');const {encounter,palaceAction}=await import('./src/emperor.mjs');let s=newGame('离宫验收');s.phase=1;encounter(s);s=palaceAction(s,'admit',{rank:null}).state;localStorage.setItem(SAVE_KEY,JSON.stringify(s));`);
  await w.reload();
  await new Promise(resolve=>w.webContents.once('did-finish-load',resolve));
  await run(`document.querySelector('#continue').click();window.initialSave=localStorage.getItem('emperor.save.v1');window.pause=()=>new Promise(r=>setTimeout(r,50));
   for(const id of ['rest','harem']){document.querySelector('[data-entry="'+id+'"]').click();document.querySelector('dialog [data-exit]').click();await pause();if(localStorage.getItem('emperor.save.v1')!==initialSave)throw Error(id+' 空退出改变存档');}
   document.querySelector('[data-entry="rest"]').click();document.querySelector('[data-view="menu"]').click();document.querySelector('[data-view="consorts"]').click();document.querySelector('[data-person]').click();document.querySelector('[data-exit]').click();await pause();if(localStorage.getItem('emperor.save.v1')!==initialSave)throw Error('查看名册推进阶段');
   document.querySelector('[data-entry="rest"]').click();document.querySelector('[data-view="menu"]').click();document.querySelector('[data-view="consorts"]').click();document.querySelector('[data-person]').click();document.querySelector('[data-action="cold-palace"]').click();document.querySelector('[data-exit]').click();await pause();const s=JSON.parse(localStorage.getItem('emperor.save.v1'));if(s.phase!==2||!s.harem.members[0].inColdPalace)throw Error('实际操作未正常推进');`);
  console.log('PASS: 紫宸殿、后宫空退出及名册浏览保持阶段，成功操作后正常推进');app.exit(0);
 }catch(e){console.error(e);app.exit(1);}
});
