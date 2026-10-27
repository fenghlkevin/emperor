const {app,BrowserWindow}=require('electron'),fs=require('node:fs'),path=require('node:path');
const {previewBootstrap}=require('../scripts/card-battle-preview-bootstrap.cjs');
app.setPath('userData',`/private/tmp/emperor-card-history-${process.pid}`);
app.whenReady().then(async()=>{
 const start=Date.now(),timeout=setTimeout(()=>app.exit(1),90000),checks=[],errors=[],pause=ms=>new Promise(r=>setTimeout(r,ms));let w;
 const run=code=>w.webContents.executeJavaScript(`(async()=>{${code}})()`),check=async(code,label)=>{if(!await run(`return (${code});`))throw Error(label);checks.push(label);};
 async function ready(){for(let i=0;i<200;i++){if(await run(`return !!window.cardPreviewSnapshot&&!!document.querySelector('dialog[open] .cb-stage');`).catch(()=>false))return;await pause(25);}throw Error('preview mount timeout');}
 async function idle(){for(let i=0;i<240;i++){if(await run(`return document.querySelector('dialog[open]')?.dataset.busy==='false';`))return;await pause(25);}throw Error('animation unlock timeout');}
 async function open(){w=new BrowserWindow({show:false,width:1440,height:1000,webPreferences:{sandbox:true,contextIsolation:true,nodeIntegration:false,backgroundThrottling:false}});w.webContents.on('console-message',({level,message})=>{if(level==='error')errors.push(message);});w.webContents.on('did-finish-load',()=>w.webContents.executeJavaScript(previewBootstrap()).catch(e=>errors.push(e.message)));await w.loadFile(path.join(__dirname,'../index.html'));await ready();}
 async function click(selector){const pt=await run(`const r=document.querySelector(${JSON.stringify(selector)}).getBoundingClientRect();return{x:Math.round(r.x+r.width/2),y:Math.round(r.y+r.height/2)};`);w.webContents.sendInputEvent({type:'mouseDown',button:'left',clickCount:1,...pt});w.webContents.sendInputEvent({type:'mouseUp',button:'left',clickCount:1,...pt});await pause(35);}
 try{
 await open();await click('[data-mulligan]');await idle();
 await check(`(()=>{const h=window.cardPreviewSnapshot().domestic.war.battle.cards.history;return h.entries.length===1&&h.entries[0].type==='mulligan'&&!h.partial;})()`,'opening action is persisted exactly once');
 const front=await run(`const b=window.cardPreviewSnapshot().domestic.war.battle;return b.cards.players.home.hand.find(id=>b.cards.catalog[id].front);`);await click('[data-card="'+front+'"]');
 await check(`document.querySelector('dialog[open]').dataset.busy==='true'&&window.cardPreviewSnapshot().domestic.war.battle.cards.history.entries.length===2`,'troop deployment record commits before animation completion');
 const history=await run(`return JSON.stringify(window.cardPreviewSnapshot().domestic.war.battle.cards.history);`),state=await run(`return JSON.stringify(window.cardPreviewSnapshot());`);
 await new Promise(resolve=>{w.webContents.once('did-finish-load',resolve);w.reload();});await ready();
 await check(`JSON.stringify(window.cardPreviewSnapshot())===${JSON.stringify(state)}&&JSON.stringify(window.cardPreviewSnapshot().domestic.war.battle.cards.history)===${JSON.stringify(history)}`,'reload during animation restores exact state and history without duplication');
 await idle();const old=w;await open();old.destroy();await idle();
 await check(`JSON.stringify(window.cardPreviewSnapshot().domestic.war.battle.cards.history)===${JSON.stringify(history)}`,'new hidden window restores the same committed action history');
 const projection=await run(`const {publicCardHistory}=await import('./src/card-battle-history.mjs');return JSON.stringify(publicCardHistory(window.cardPreviewSnapshot().domestic.war.battle));`);
 await click('[data-battle-deck]');await check(`!!document.querySelector('.cb-deck-dialog')&&JSON.stringify(window.cardPreviewSnapshot().domestic.war.battle.cards.history)===${JSON.stringify(history)}`,'read-only deck view creates no phantom action record');await click('[data-deck-close]');await pause(60);
 await click('[data-battle-history]');await check(`document.querySelectorAll('[data-history-row]').length===2&&document.querySelector('.cb-history-dialog').textContent.includes('实付')&&JSON.stringify(window.cardPreviewSnapshot().domestic.war.battle.cards.history)===${JSON.stringify(history)}`,'recovered record panel renders the two committed actions without publishing another');await click('[data-history-close]');await pause(60);
 await check(`document.querySelector('dialog[open]').dataset.busy==='false'&&localStorage.getItem('emperor.save.v1')===null`,'recovered input unlocks and actual game save key stays untouched');
 if(errors.length)throw Error(errors.join('\n'));clearTimeout(timeout);const result={date:new Date().toISOString(),elapsedSeconds:(Date.now()-start)/1000,checks,consoleErrors:errors,publicHistory:JSON.parse(projection)};fs.writeFileSync('/private/tmp/card-history-validation.json',JSON.stringify(result,null,2)+'\n');console.log('History persistence desktop acceptance passed: '+checks.length+' checks, '+result.elapsedSeconds+' seconds.');app.exit(0);
 }catch(e){console.error(e);clearTimeout(timeout);app.exit(1);}
});
