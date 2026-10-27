const {app,BrowserWindow}=require('electron'),fs=require('node:fs'),path=require('node:path');
app.setPath('userData',`/private/tmp/emperor-card-tactics-${process.pid}`);
app.whenReady().then(async()=>{
 const start=Date.now(),timer=setTimeout(()=>app.exit(1),100000),errors=[],checks=[];
 const w=new BrowserWindow({show:false,width:1440,height:1000,webPreferences:{sandbox:true,contextIsolation:true,nodeIntegration:false,backgroundThrottling:false}});
 w.webContents.on('console-message',({level,message})=>{if(level==='error')errors.push(message);});
 const run=code=>w.webContents.executeJavaScript(`(async()=>{${code}})()`),pause=ms=>new Promise(r=>setTimeout(r,ms));
 const check=async(code,label)=>{if(!await run(`return (${code});`))throw Error(label);checks.push(label);};
 const click=async selector=>{const pt=await run(`const el=document.querySelector(${JSON.stringify(selector)});el.scrollIntoView({block:'center'});const r=el.getBoundingClientRect();return{x:Math.round(r.x+r.width/2),y:Math.round(r.y+r.height/2)};`);w.webContents.sendInputEvent({type:'mouseDown',button:'left',clickCount:1,...pt});w.webContents.sendInputEvent({type:'mouseUp',button:'left',clickCount:1,...pt});await pause(60);};
 const change=async()=>run(`const inputs=[...document.querySelectorAll('[data-tactic-count]')],from=inputs.find(e=>Number(e.value)>0),to=inputs.find(e=>e!==from&&Number(e.value)<Number(e.max));from.value=Number(from.value)-1;from.dispatchEvent(new Event('input'));to.value=Number(to.value)+1;to.dispatchEvent(new Event('input'));window.expectedTactics=Object.fromEntries(inputs.filter(e=>Number(e.value)>0).map(e=>[e.dataset.tacticCount,Number(e.value)]));`);
 try{
 await w.loadFile(path.join(__dirname,'../index.html'));
 await run(`const {newGame}=await import('./src/game.mjs'),{openCourtCampaign}=await import('./src/court-campaign-ui.mjs'),{borderingCountries}=await import('./src/war.mjs');window.state=newGame('出征配牌');window.before=JSON.stringify(window.state);window.commits=0;window.campaign=openCourtCampaign(window.state,document.body,s=>{window.state=s;window.commits++;},()=>{});const target=borderingCountries(window.state.domestic)[0].id;[...window.campaign.querySelectorAll('[data-war-country]')].find(e=>e.dataset.warCountry===target).dispatchEvent(new MouseEvent('click',{bubbles:true}));`);
 await click('[data-campaign-tactics]');
 await check(`document.querySelectorAll('[data-tactic-count]').length===12&&!document.querySelector('[data-tactic-apply]').disabled`,'12 legal tactics and valid automatic capacity shown');
 for(const [width,height]of [[1440,1000],[1000,800],[800,650]]){w.setSize(width,height);await pause(80);await check(`(()=>{const d=document.querySelector('.cb-tactic-dialog');return d.scrollWidth<=d.clientWidth+2&&[...d.querySelectorAll('[data-tactic-count]')].every(e=>e.getBoundingClientRect().width>=60);})()`,`${width}px editor keeps inputs readable without horizontal overflow`);fs.writeFileSync(`/private/tmp/card-tactics-${width}.png`,(await w.webContents.capturePage()).toPNG());}
 await run(`const e=document.querySelector('[data-tactic-count]');e.value=99;e.dispatchEvent(new Event('input'));`);
 await check(`document.querySelector('[data-tactic-apply]').disabled&&document.querySelector('[data-tactic-status]').textContent.includes('限0至')`,'over-limit selection cannot apply');
 await click('[data-tactic-auto]');
 await run(`const e=[...document.querySelectorAll('[data-tactic-count]')].find(e=>Number(e.value)>0);e.value=Number(e.value)-1;e.dispatchEvent(new Event('input'));`);
 await check(`document.querySelector('[data-tactic-apply]').disabled&&document.querySelector('[data-tactic-status]').textContent.includes('需')`,'incomplete capacity cannot apply');
 await click('[data-tactic-cancel]');await pause(40);
 await check(`JSON.stringify(window.state)===window.before&&window.commits===0&&document.querySelector('[data-campaign-tactics]').textContent.includes('自动')`,'cancel leaves draft mode, resources and real state unchanged');
 await click('[data-campaign-tactics]');await change();await click('[data-tactic-apply]');await pause(40);
 await check(`window.commits===0&&JSON.stringify(window.state)===window.before&&document.querySelector('[data-campaign-tactics]').textContent.includes('自选')`,'valid selection applies to campaign draft only');
 await click('[data-campaign-review]');await click('[data-campaign-deck]');
 await check(`(()=>{const ids=Object.keys(window.expectedTactics);return document.querySelectorAll('[data-deck-entry]').length===30&&ids.every(id=>[...document.querySelectorAll('[data-deck-entry]')].filter(e=>e.querySelector('.troop-'+id)).length===window.expectedTactics[id]);})()`,'read-only preview reflects selected tactic quantities');
 await click('[data-deck-close]');await pause(40);await click('[data-campaign-seal]');
 await check(`window.commits===1&&JSON.stringify(window.state.domestic.war.battle.cards.deckConfiguration.tactics.counts)===JSON.stringify(Object.fromEntries(Object.entries(window.expectedTactics).sort(([a],[b])=>a.localeCompare(b))))`,'campaign seal commits selected snapshot exactly once');
 await run(`const {newGame}=await import('./src/game.mjs'),{startCampaign}=await import('./src/foreign-strategy.mjs'),{drawCourtDefense}=await import('./src/court-defense-ui.mjs');window.defenseState=newGame('守城配牌');window.defenseState.turn=37;startCampaign(window.defenseState.domestic,'xi','hebei',37);window.defenseBefore=JSON.stringify(window.defenseState);window.defenseCommits=0;const d=document.createElement('dialog');document.body.append(d);window.defense=d;drawCourtDefense(d,()=>window.defenseState,s=>{window.defenseState=s;window.defenseCommits++;},()=>{});d.showModal();`);
 await click('[data-defense-tactics]');await change();await click('[data-tactic-apply]');await pause(40);
 await check(`window.defenseCommits===0&&JSON.stringify(window.defenseState)===window.defenseBefore`,'defense selection reserves no soldiers or equipment before seal');
 await click('[data-defense-tactics]');await click('[data-tactic-auto]');await click('[data-tactic-apply]');await pause(40);
 await check(`document.querySelector('[data-defense-tactics]').textContent.includes('自动')`,'automatic option clears the custom configuration');
 await click('[data-defense-tactics]');await change();await click('[data-tactic-apply]');await pause(40);await click('[data-kit-defend]');await click('[data-defense-seal]');
 await check(`window.defenseCommits===1&&!!window.defenseState.domestic.war.battle.cards.deckConfiguration`,'defense seal locks custom tactics with real-source deployment');
 await check(`localStorage.getItem('emperor.save.v1')===null`,'isolated tests never write the actual save key');
 if(errors.length)throw Error(errors.join('\n'));clearTimeout(timer);const result={date:new Date().toISOString(),elapsedSeconds:(Date.now()-start)/1000,checks,consoleErrors:errors};fs.writeFileSync('/private/tmp/card-tactics-validation.json',JSON.stringify(result,null,2)+'\n');console.log('Tactic desktop acceptance passed: '+checks.length+' checks, '+result.elapsedSeconds+' seconds.');app.exit(0);
 }catch(e){console.error(e);clearTimeout(timer);app.exit(1);}
});
