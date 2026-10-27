const {app,BrowserWindow}=require('electron'),fs=require('node:fs'),path=require('node:path');
app.setPath('userData','/private/tmp/emperor-attributes-'+process.pid);
app.whenReady().then(async()=>{
 const w=new BrowserWindow({show:false,width:1440,height:1000,webPreferences:{sandbox:true,contextIsolation:true,nodeIntegration:false}}),checks=[],errors=[];
 const run=code=>w.webContents.executeJavaScript(`(async()=>{${code}})()`),pause=ms=>new Promise(r=>setTimeout(r,ms));
 w.webContents.on('console-message',({level,message})=>{if(level==='error')errors.push(message);});
 const timer=setTimeout(()=>app.exit(1),60000);
 try{
  await w.loadFile(path.join(__dirname,'../index.html'));
  await run(`const {createCardBattlePreview}=await import('./scripts/card-battle-preview-state.mjs'),{openBattleDeck}=await import('./src/card-battle-deck-ui.mjs');window.state=createCardBattlePreview();window.before=JSON.stringify(window.state);window.deck=openBattleDeck(window.state.domestic.war.battle,{prebattle:true});`);
  for(const [width,height]of [[1440,1000],[1000,800],[800,650]]){
   w.setSize(width,height);await pause(120);
   const result=await run(`const d=window.deck,details=d.querySelector('.cb-deck-attributes');details.open=true;details.querySelector('p').scrollIntoView({block:'start'});return {count:d.querySelectorAll('[data-deck-entry]').length,copy:details.textContent,overflow:d.scrollWidth>d.clientWidth+2,readOnly:JSON.stringify(window.state)===window.before};`);
   if(result.count!==30||result.overflow||!result.readOnly||!['兵力倍率','训练','主将','四舍五入'].every(s=>result.copy.includes(s)))throw Error(JSON.stringify(result));
   checks.push(width+'px prebattle deck expands attribute calculation without overflow or state changes');
   fs.writeFileSync(path.join(__dirname,'../docs/screenshots/card-battle-attributes-deck-'+width+'.png'),(await w.webContents.capturePage()).toPNG());
  }
  await run(`window.deck.querySelector('[data-deck-close]').click();const {openBattleDeck}=await import('./src/card-battle-deck-ui.mjs');window.deck=openBattleDeck(window.state.domestic.war.battle);`);
  if(!await run(`return window.deck.querySelectorAll('.cb-deck-attributes').length>0&&JSON.stringify(window.state)===window.before;`))throw Error('live deck attributes');
  checks.push('live battle deck uses the same read-only attribute explanation');
  if(errors.length)throw Error(errors.join('\n'));
  fs.writeFileSync(path.join(__dirname,'../docs/card-battle-attributes-ui-validation.json'),JSON.stringify({date:'2026-10-26',checks,errors},null,2)+'\n');
  console.log('Attribute deck acceptance passed: '+checks.length+' checks.');clearTimeout(timer);app.exit(0);
 }catch(e){console.error(e);clearTimeout(timer);app.exit(1);}
});
