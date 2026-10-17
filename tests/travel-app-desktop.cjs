const {app,BrowserWindow}=require('electron');
const path=require('node:path'),fs=require('node:fs');
app.setPath('userData','/private/tmp/emperor-travel-app-test');
app.whenReady().then(async()=>{
 const w=new BrowserWindow({show:false,width:1360,height:950,webPreferences:{sandbox:true,contextIsolation:true,nodeIntegration:false}}),out=path.join(__dirname,'../outputs/travel');fs.mkdirSync(out,{recursive:true});
 const js=code=>w.webContents.executeJavaScript(code),paint=()=>new Promise(r=>setTimeout(r,150));
 const capture=async name=>{await paint();fs.writeFileSync(path.join(out,name+'.png'),(await w.webContents.capturePage()).toPNG());};
 try{
 for(const kind of ['tour','incognito']){
  await w.loadFile(path.join(__dirname,'../index.html'));
  await js(`(async()=>{const {newGame,advance,SAVE_KEY}=await import('./src/game.mjs');const {scheduleTravel,travelDestinations}=await import('./src/travel.mjs');let s=newGame('真实出行验收');s.phase=2;s.stats.happiness=40;s.domestic.countries.find(c=>c.id===s.domestic.playerCountryId).fiscal.treasury=100000;s.stats.treasury=100000;s=scheduleTravel(s,'${kind}',travelDestinations(s,'${kind}')[0].id).state;advance(s);localStorage.setItem(SAVE_KEY,JSON.stringify(s));})()`);
  await w.loadFile(path.join(__dirname,'../index.html'));await paint();
  await js(`document.querySelector('#continue').click();if(!document.querySelector('[data-begin-travel]'))throw Error('automatic departure notice missing');window.beforeTravel=JSON.parse(localStorage.getItem('emperor.save.v1'));document.querySelector('[data-begin-travel]').click();if(!document.querySelector('.travel-dialog'))throw Error('journey missing');window.startedTravel=JSON.parse(localStorage.getItem('emperor.save.v1'));if(window.startedTravel.stats.happiness!==Math.min(100,window.beforeTravel.stats.happiness+20))throw Error('entry happiness wrong');if(window.startedTravel.stats.treasury!==window.beforeTravel.stats.treasury-${kind==='tour'?20000:0})throw Error('entry treasury wrong');if(window.startedTravel.stats.life!==window.beforeTravel.stats.life-${kind==='incognito'?8:0})throw Error('entry life wrong');`);
  await capture(kind+'-journey');
  if(kind==='incognito'){await js(`document.querySelector('[data-visit]').click();if(!document.querySelector('.travel-event'))throw Error('saved event missing');`);await capture('incognito-event');}
  await js(`while(document.querySelector('[data-tour-choice]')){const choices=[...document.querySelectorAll('[data-tour-choice]')].filter(b=>!b.disabled);choices.at(-1).click();document.querySelector('[data-tour-next]')?.click();}document.querySelector('[data-finish]').click();window.finishedTravel=JSON.parse(localStorage.getItem('emperor.save.v1'));if(window.finishedTravel.travel.pending||window.finishedTravel.travel.history.length!==1)throw Error('finish not persisted');${kind==='tour'?"const expected=(Math.floor((window.startedTravel.turn-1)/3)+1)*3+1;if(window.finishedTravel.turn!==expected||window.finishedTravel.phase!==0||window.finishedTravel.stats.life!==window.startedTravel.stats.life-10-(expected-window.startedTravel.turn))throw Error('tour date/life wrong');":"if(window.finishedTravel.turn!==window.startedTravel.turn||window.finishedTravel.phase!==window.startedTravel.phase+1||window.finishedTravel.stats.life!==window.startedTravel.stats.life)throw Error('incognito phase/life wrong');"}`);
  await capture(kind+'-result');
  const saved=await js(`localStorage.getItem('emperor.save.v1')`);
  await js(`document.querySelector('.travel-dialog [data-exit]').click()`);await paint();await w.loadFile(path.join(__dirname,'../index.html'));await paint();
  await js(`document.querySelector('#continue').click();if(document.querySelector('[data-begin-travel]')||document.querySelector('.travel-dialog'))throw Error('completed trip replayed');if(localStorage.getItem('emperor.save.v1')!==${JSON.stringify(saved)})throw Error('reload changed settlement');`);
  console.log('PASS: real app '+kind+' departure notice, entry costs, persisted settlement, date/phase, reload without replay');
 }
 await js(`document.querySelector('[data-entry="rest"]').click();document.querySelector('.zichen-npc.left').click();document.querySelector('[data-travel="tour"]').click()`);await capture('planner');
 app.exit(0);
 }catch(e){console.error(e);await capture('app-failure');app.exit(1);}
});
