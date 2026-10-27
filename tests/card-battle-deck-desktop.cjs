const {app,BrowserWindow}=require('electron'),fs=require('node:fs'),path=require('node:path');
app.setPath('userData',`/private/tmp/emperor-card-deck-${process.pid}`);
app.whenReady().then(async()=>{
 const timer=setTimeout(()=>app.exit(1),90000),errors=[],checks=[];
 const w=new BrowserWindow({show:false,width:1440,height:1000,webPreferences:{sandbox:true,contextIsolation:true,nodeIntegration:false,backgroundThrottling:false}});
 w.webContents.on('console-message',({level,message})=>{if(level==='error')errors.push(message);});
 const run=code=>w.webContents.executeJavaScript(`(async()=>{${code}})()`),pause=ms=>new Promise(r=>setTimeout(r,ms));
 const click=async selector=>{const pt=await run(`const r=document.querySelector(${JSON.stringify(selector)}).getBoundingClientRect();return{x:Math.round(r.x+r.width/2),y:Math.round(r.y+r.height/2)};`);w.webContents.sendInputEvent({type:'mouseDown',button:'left',clickCount:1,...pt});w.webContents.sendInputEvent({type:'mouseUp',button:'left',clickCount:1,...pt});await pause(70);};
 const check=async(code,label)=>{if(!await run(`return (${code});`))throw Error(label);checks.push(label);};
 try{
 await w.loadFile(path.join(__dirname,'../index.html'));
 await run(`const {createCardBattlePreview}=await import('./scripts/card-battle-preview-state.mjs'),{drawBattle}=await import('./src/battle-ui.mjs');window.deckState=createCardBattlePreview();const d=document.createElement('dialog');document.body.append(d);drawBattle(d,()=>window.deckState,s=>window.deckState=s,()=>{});d.showModal();window.beforeDeck=JSON.stringify(window.deckState);`);await click('.card-battle-dialog[open] [data-battle-deck]');
 await pause(150);
 await check(`document.querySelectorAll('[data-deck-entry]').length===30`,'all 30 locked cards rendered during mulligan');
 await check(`document.querySelector('.cb-deck-dialog').textContent.includes('不展示抽牌顺序')`,'shuffle privacy is explicit');
 for(const [width,height]of [[1440,1000],[1000,800],[800,650]]){
  w.setSize(width,height);await pause(120);
  await check(`(()=>{const d=document.querySelector('.cb-deck-dialog');return d.scrollWidth<=d.clientWidth+2&&[...d.querySelectorAll('.cb-deck-face')].every(e=>{const r=e.getBoundingClientRect();return Math.abs(r.width/r.height-5/7)<.015;});})()`,`${width}px layout retains 5:7 cards without horizontal overflow`);
  fs.writeFileSync(`/private/tmp/card-deck-${width}.png`,(await w.webContents.capturePage()).toPNG());
 }
 await run(`const input=document.querySelector('[data-deck-query]');input.value='不存在的卡牌';input.dispatchEvent(new Event('input',{bubbles:true}));`);
 await check(`document.querySelectorAll('[data-deck-entry]').length===0&&document.activeElement.matches('[data-deck-query]')`,'empty search preserves keyboard focus');
 await run(`const input=document.querySelector('[data-deck-query]');input.value='';input.dispatchEvent(new Event('input',{bubbles:true}));document.querySelector('[data-deck-type]').value='general';document.querySelector('[data-deck-type]').dispatchEvent(new Event('change'));`);
 await check(`document.querySelectorAll('[data-deck-entry]').length===3`,'person filter matches the actual three officers');
 await run(`document.querySelector('[data-deck-type]').value='';document.querySelector('[data-deck-type]').dispatchEvent(new Event('change'));document.querySelector('[data-deck-mode="remaining"]').click();`);
 await check(`document.querySelectorAll('[data-deck-entry]').length===window.deckState.domestic.war.battle.cards.players.home.deck.length`,'remaining view counts exact own deck');
 await run(`document.querySelector('[data-deck-close]').click();`);await pause(50);
 await check(`!document.querySelector('.cb-deck-dialog')&&JSON.stringify(window.deckState)===window.beforeDeck`,'open/filter/close preserves complete battle and resource state');
 await run(`document.querySelector('.card-battle-dialog').close();document.querySelector('.card-battle-dialog').remove();const {newGame}=await import('./src/game.mjs'),{openCourtCampaign}=await import('./src/court-campaign-ui.mjs'),{borderingCountries}=await import('./src/war.mjs');window.draftState=newGame('牌组草案');window.draftBefore=JSON.stringify(window.draftState);window.commits=0;window.campaignDialog=openCourtCampaign(window.draftState,document.body,()=>window.commits++,()=>{});const target=borderingCountries(window.draftState.domestic)[0].id;[...window.campaignDialog.querySelectorAll('[data-war-country]')].find(e=>e.dataset.warCountry===target).dispatchEvent(new MouseEvent('click',{bubbles:true}));window.campaignDialog.querySelector('[data-campaign-review]').click();`);
 await click('[data-campaign-deck]');
 await check(`document.querySelectorAll('[data-deck-entry]').length===30&&JSON.stringify(window.draftState)===window.draftBefore&&window.commits===0`,'campaign review opens exact 30-card preview without a resource commit');
 await run(`document.querySelector('[data-deck-close]').click();`);await pause(50);
 await check(`!!document.querySelector('[data-campaign-seal]')&&window.commits===0`,'closing campaign preview returns to unsealed draft');
 await run(`window.campaignDialog.close();const {newGame}=await import('./src/game.mjs'),{startCampaign}=await import('./src/foreign-strategy.mjs'),{drawCourtDefense}=await import('./src/court-defense-ui.mjs');window.defenseState=newGame('守城草案');window.defenseState.turn=37;startCampaign(window.defenseState.domestic,'xi','hebei',37);window.defenseBefore=JSON.stringify(window.defenseState);const d=document.createElement('dialog');document.body.append(d);window.defenseDialog=d;drawCourtDefense(d,()=>window.defenseState,()=>window.commits++,()=>{});d.showModal();d.querySelector('[data-kit-defend]').click();`);
 await click('[data-defense-deck]');
 await check(`document.querySelectorAll('[data-deck-entry]').length===30&&JSON.stringify(window.defenseState)===window.defenseBefore&&window.commits===0`,'defense review opens exact 30-card preview without deploying soldiers or gear');
 await run(`document.querySelector('[data-deck-close]').click();`);await pause(50);
 await check(`!!document.querySelector('[data-defense-seal]')&&window.commits===0`,'closing defense preview retains unsealed deployment');
 await run(`window.defenseDialog.close();const {createCardBattlePreview}=await import('./scripts/card-battle-preview-state.mjs'),{drawBattle}=await import('./src/battle-ui.mjs'),{cardAI,actCardsMutable}=await import('./src/card-battle.mjs');window.pauseState=createCardBattlePreview();const b=window.pauseState.domestic.war.battle;actCardsMutable(b,cardAI(b));actCardsMutable(b,{type:'end'});const d=document.createElement('dialog');document.body.append(d);drawBattle(d,()=>window.pauseState,s=>window.pauseState=s,()=>{});d.showModal();window.pauseBefore=JSON.stringify(window.pauseState);`);
 await click('.card-battle-dialog[open] [data-battle-deck]');await pause(800);
 await check(`JSON.stringify(window.pauseState)===window.pauseBefore`,'opponent timer pauses while the read-only deck dialog is open');
 await run(`document.querySelector('[data-deck-close]').click();`);await pause(850);
 await check(`JSON.stringify(window.pauseState)!==window.pauseBefore`,'opponent resumes after closing the deck dialog');
 await check(`localStorage.getItem('emperor.save.v1')===null`,'isolated UI never writes real save key');
 if(errors.length)throw Error(errors.join('\n'));clearTimeout(timer);fs.writeFileSync('/private/tmp/card-deck-validation.json',JSON.stringify({date:new Date().toISOString(),checks,errors},null,2)+'\n');console.log('Deck desktop acceptance passed: '+checks.length+' checks.');app.exit(0);
 }catch(e){console.error(e);clearTimeout(timer);app.exit(1);}
});
