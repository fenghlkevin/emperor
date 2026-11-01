const {app,BrowserWindow}=require('electron');
const path=require('node:path');
app.setPath('userData',`/private/tmp/emperor-scene-dismiss-${process.pid}`);
app.whenReady().then(async()=>{
 const w=new BrowserWindow({show:false,webPreferences:{sandbox:true}});
 try{
  await w.loadFile(path.join(__dirname,'../index.html'));
  await w.webContents.executeJavaScript(`(async()=>{
   const {createPlayableGame}=await import('./src/game.mjs');
   for(const [key,fn] of [['garden','openGarden'],['study','openStudy'],['martial','openMartial'],['mother','openMother'],['theatre','openTheatre'],['music','openMusic'],['observation','openObservation'],['dragon','openDragon']]){
    const { [fn]:open }=await import('./src/'+key+'-ui.mjs');
    for(const target of ['img','h1','[role=status]']){
     const root=document.createElement('div');document.body.append(root);
     const state=createPlayableGame('关闭验收','大明');state.phase=2;
     const d=key==='garden'?open(root,'游园已毕'):open(state,root,()=>{},()=>{});
     if(d.querySelector('[data-exit],[data-garden-close]'))throw Error(key+' still has exit button');
     const el=d.querySelector(target);if(!el)throw Error(key+' missing '+target);
     el.dispatchEvent(new MouseEvent('click',{bubbles:true}));
     if(d.open)throw Error(key+' failed to dismiss from '+target);
     await new Promise(r=>setTimeout(r,20));
     if(d.isConnected)throw Error(key+' failed to remove dialog');root.remove();
    }
   }
  })()`);
  console.log('PASS: 8 scene dialogs dismiss from artwork, heading and result text; exit buttons removed.');app.exit(0);
 }catch(e){console.error(e);app.exit(1);}
});
