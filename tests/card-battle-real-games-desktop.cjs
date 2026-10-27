const {app,BrowserWindow}=require('electron'),fs=require('node:fs'),path=require('node:path');
app.setPath('userData','/private/tmp/card-real-games-'+process.pid);
app.whenReady().then(async()=>{
 const root=path.join(__dirname,'..'),start=Date.now(),games=[],errors=[],w=new BrowserWindow({show:false,width:1440,height:1000,webPreferences:{sandbox:true,contextIsolation:true,nodeIntegration:false,backgroundThrottling:false}});
 const pause=ms=>new Promise(r=>setTimeout(r,ms)),run=s=>w.webContents.executeJavaScript('(async()=>{'+s+'})()');
 w.webContents.on('console-message',({level,message})=>{if(level==='error')errors.push(message)});
 async function click(sel){let p=await run(`const e=document.querySelector(${JSON.stringify(sel)});if(!e)throw Error('missing '+${JSON.stringify(sel)});e.scrollIntoView({block:'nearest'});const r=e.getBoundingClientRect();return {x:Math.round(r.x+r.width/2),y:Math.round(r.y+r.height/2)};`);w.webContents.sendInputEvent({type:'mouseMove',...p});await pause(250);p=await run(`const e=document.querySelector(${JSON.stringify(sel)}),r=e.getBoundingClientRect(),x=Math.round(r.x+r.width/2),y=Math.round(r.y+r.height/2);if(!e.contains(document.elementFromPoint(x,y)))throw Error('blocked '+${JSON.stringify(sel)});return {x,y};`);for(const type of ['mouseDown','mouseUp'])w.webContents.sendInputEvent({type,button:'left',clickCount:1,...p});await pause(60);}
 const save=status=>fs.writeFileSync(path.join(root,'docs/card-battle-real-games-ui-validation.json'),JSON.stringify({status,started:new Date(start).toISOString(),elapsedSeconds:(Date.now()-start)/1000,hiddenWindow:true,foregroundHourCompleted:false,scope:'Real rendered battles, native auto/speed/settlement clicks, production advanceWar/finishWar; no direct engine stepping loop',games,errors},null,2)+'\n');
 try{await w.loadFile(path.join(root,'index.html'));
 for(let index=0;index<20;index++){
  const configuration=['weapons','secrets','landmarks','combined'][index%4],first=index%2?'enemy':'home',seed=2147483+index*7919;
  await run(`window.rgUI?.dispose();document.querySelectorAll('dialog').forEach(d=>d.remove());const {configuredBaseline,configuredBattle}=await import('./scripts/card-battle-configured-fixture.mjs'),{validateSave}=await import('./src/game.mjs'),{drawCardBattle}=await import('./src/card-battle-ui.mjs');window.rgBase=configuredBaseline(${JSON.stringify(configuration)},${index%2?5:0});const fixture=configuredBattle(rgBase,{first:${JSON.stringify(first)},seeds:{home:${seed},enemy:${seed+104729}}});window.rgState=fixture.state;window.rgCommits=0;window.rgReceipt=null;window.rgInitial=structuredClone(rgState);window.rgDialog=document.createElement('dialog');document.body.append(rgDialog);window.rgUI=drawCardBattle(rgDialog,()=>rgState,s=>{validateSave(s);rgState=s;rgCommits++;},receipt=>{rgReceipt=receipt;});rgDialog.showModal();`);
  await click('[data-speed]');await click('[data-mulligan]');await pause(100);await click('[data-auto]');
  const deadline=Date.now()+600000;let finished=false;
  while(Date.now()<deadline){if(await run(`return !!document.querySelector('[data-settle]')&&rgDialog.dataset.busy!=='true';`)){finished=true;break;}await pause(500);}
  if(!finished)throw Error('game '+index+' timed out');
  const result=await run(`return {result:rgState.domestic.war.battle.result,round:rgState.domestic.war.battle.round,commits:rgCommits,history:rgState.domestic.war.battle.cards.history?.entries?.length??0};`);
  fs.writeFileSync(path.join(root,'docs/screenshots/card-real-game-'+(index+1)+'-result.png'),(await w.webContents.capturePage()).toPNG());
  await run(`window.rgExpected=(await import('./src/war.mjs')).finishWar(rgState);`);await click('[data-settle]');
  if(!await run(`return !!rgReceipt&&JSON.stringify(rgState)===JSON.stringify(rgExpected.state)&&JSON.stringify(rgReceipt)===JSON.stringify(rgExpected.receipt);`))throw Error('settlement mismatch '+index);
  await run(`const {finishWar}=await import('./src/war.mjs');let rejected=false;try{finishWar(rgState)}catch{rejected=true}if(!rejected)throw Error('duplicate settlement accepted');`);
  games.push({index:index+1,configuration,rotation:index%2?5:0,first,seed,...result,settlementMatchesProduction:true,duplicateSettlementRejected:true});save('in-progress');console.log('actual UI game '+games.length+'/20 '+result.result);
 }
 if(errors.length)throw Error(errors.join('\n'));save('passed');app.exit(0);
 }catch(e){errors.push(e.stack);save('failed');console.error(e.stack);fs.writeFileSync(path.join(root,'docs/screenshots/card-real-games-failure.png'),(await w.webContents.capturePage()).toPNG());app.exit(1);}
});
