const {app,BrowserWindow}=require('electron'),fs=require('node:fs'),path=require('node:path');
app.setPath('userData',`/private/tmp/emperor-card-plans-${process.pid}`);
app.whenReady().then(async()=>{
 const start=Date.now(),timer=setTimeout(()=>app.exit(1),100000),errors=[],checks=[];
 const w=new BrowserWindow({show:false,width:1440,height:1000,webPreferences:{sandbox:true,contextIsolation:true,nodeIntegration:false,backgroundThrottling:false}});
 w.webContents.on('console-message',({level,message})=>{if(level==='error')errors.push(message);});
 const run=code=>w.webContents.executeJavaScript(`(async()=>{${code}})()`),pause=ms=>new Promise(r=>setTimeout(r,ms));
 const check=async(code,label)=>{if(!await run(`return (${code});`))throw Error(label);checks.push(label);};
 const click=async selector=>{const pt=await run(`const el=document.querySelector(${JSON.stringify(selector)});el.scrollIntoView({block:'center'});const r=el.getBoundingClientRect();return{x:Math.round(r.x+r.width/2),y:Math.round(r.y+r.height/2)};`);w.webContents.sendInputEvent({type:'mouseDown',button:'left',clickCount:1,...pt});w.webContents.sendInputEvent({type:'mouseUp',button:'left',clickCount:1,...pt});await pause(65);};
 const name=async value=>run(`const e=document.querySelector('[data-plan-name]');e.value=${JSON.stringify(value)};e.dispatchEvent(new Event('input'));`);
 try{
 await w.loadFile(path.join(__dirname,'../index.html'));
 await run(`const {newGame}=await import('./src/game.mjs'),{openCourtCampaign}=await import('./src/court-campaign-ui.mjs'),{borderingCountries}=await import('./src/war.mjs');window.state=newGame('方案界面');window.original=JSON.stringify(window.state);window.commits=0;window.courtCommits=0;window.openCampaign=()=>{window.campaign=openCourtCampaign(window.state,document.body,s=>{window.state=s;window.commits++;window.courtCommits++;},()=>{},undefined,{savePlans:s=>{window.state=s;window.commits++;}});const target=borderingCountries(window.state.domestic)[0].id;[...window.campaign.querySelectorAll('[data-war-country]')].find(e=>e.dataset.warCountry===target).dispatchEvent(new MouseEvent('click',{bubbles:true}));};window.openCampaign();`);
 await click('[data-campaign-plans]');await name('常用中军');await click('[data-plan-save]');
 await check(`window.commits===1&&window.courtCommits===0&&window.state.domestic.cardBattlePlans.plans.length===1&&(()=>{const s=structuredClone(window.state);delete s.domestic.cardBattlePlans;return JSON.stringify(s)===window.original;})()`,'saving changes only the plan library and spends no resources');
 await click('[data-plan-id="1"]');await name('中军改名');await click('[data-plan-overwrite]');
 await check(`window.state.domestic.cardBattlePlans.plans.length===1&&window.state.domestic.cardBattlePlans.plans[0].name==='中军改名'`,'overwrite renames the selected plan without duplication');
 await name('删除用');await click('[data-plan-save]');await click('[data-plan-id="2"]');await click('[data-plan-delete]');
 await check(`window.state.domestic.cardBattlePlans.plans.length===1&&window.state.domestic.cardBattlePlans.nextId===3`,'deleting removes only the selected plan and does not reuse its ID');
 await click('[data-plan-id="1"]');
 for(const [width,height]of [[1440,1000],[1000,800],[800,650]]){w.setSize(width,height);await pause(80);await check(`(()=>{const d=document.querySelector('.cb-plans-dialog');return d.scrollWidth<=d.clientWidth+2&&d.querySelector('[data-plan-load]').getBoundingClientRect().height>=30;})()`,`${width}px plan management has readable controls without horizontal overflow`);fs.writeFileSync(`/private/tmp/card-plans-${width}.png`,(await w.webContents.capturePage()).toPNG());}
 await click('[data-plans-close]');await pause(40);
 await run(`window.campaign.close();window.state=JSON.parse(JSON.stringify(window.state));window.openCampaign();`);await click('[data-campaign-plans]');await click('[data-plan-id="1"]');const beforeLoad=await run(`return JSON.stringify(window.state);`);await click('[data-plan-load]');
 await check(`JSON.stringify(window.state)===${JSON.stringify(beforeLoad)}&&!document.querySelector('.cb-plans-dialog')`,'serialized plan reloads to draft without changing resources or fixed identities');
 await click('[data-campaign-review]');await click('[data-campaign-seal]');
 await check(`!!window.state.domestic.war.battle&&window.state.domestic.cardBattlePlans.plans[0].name==='中军改名'`,'sealing a loaded plan retains the saved library in the committed game');
 await run(`const {newGame}=await import('./src/game.mjs'),{startCampaign}=await import('./src/foreign-strategy.mjs'),{openWar}=await import('./src/war-ui.mjs');window.defenseState=newGame('守城方案');window.defenseState.turn=37;startCampaign(window.defenseState.domestic,'xi','hebei',37);window.defenseOriginal=JSON.stringify(window.defenseState);window.defense=openWar(window.defenseState,document.body,()=>{throw Error('Plan save must bypass court action cost');},()=>{},{savePlans:s=>window.defenseState=s});`);
 await click('[data-defense-plans]');await name('守城预案');await click('[data-plan-save]');await click('[data-plan-id="1"]');await click('[data-plan-load]');
 await check(`(()=>{const s=structuredClone(window.defenseState);delete s.domestic.cardBattlePlans;return JSON.stringify(s)===window.defenseOriginal;})()`,'defense save and load do not reserve troops or equipment');
 await click('[data-defense-plans]');await run(`window.defenseState.domestic.cardBattlePlans.plans[0].formation.generalId='retired-general';`);await click('[data-plan-id="1"]');
 await check(`document.querySelector('[data-plan-load]').disabled&&document.querySelector('.cb-deck-statistics').textContent.includes('将领不可用')`,'unavailable officer is listed and invalid load is blocked');
 await click('[data-plans-close]');await pause(40);await run(`window.defense.close();const {newGame}=await import('./src/game.mjs'),{openCourtCampaign}=await import('./src/court-campaign-ui.mjs');window.rejectState=newGame('保存拒绝');window.rejectBefore=JSON.stringify(window.rejectState);openCourtCampaign(window.rejectState,document.body,()=>false,()=>{},undefined,{savePlans:()=>false});`);await click('dialog[open] [data-campaign-plans]');await name('不可保存');await click('[data-plan-save]');
 await check(`JSON.stringify(window.rejectState)===window.rejectBefore&&document.querySelector('[data-plan-status]').textContent.includes('未保存')`,'rejected persistence leaves the library and real state unchanged');
 await run(`for(const d of document.querySelectorAll('dialog[open]'))d.close();const {newGame}=await import('./src/game.mjs'),{openWar}=await import('./src/war-ui.mjs');window.alternateState=newGame('兵部备用入口');window.alternateCourtCalls=0;window.alternate=openWar(window.alternateState,document.body,s=>{window.alternateState=s;window.alternateCourtCalls++;},()=>{},{savePlans:s=>window.alternateState=s});`);
 await click('[data-kit-war-plans]');await name('备用出征');await click('[data-plan-save]');await click('[data-plan-id="1"]');
 await check(`!document.querySelector('[data-plan-load]').disabled&&window.alternateCourtCalls===0`,'alternate war office can save and load a plan before choosing a target without office cost');
 await click('[data-plan-load]');await pause(40);
 await run(`const {borderingCountries}=await import('./src/war.mjs');const e=document.querySelector('[data-kit-war-target]');e.value=borderingCountries(window.alternateState.domestic)[0].id;e.dispatchEvent(new Event('change'));`);
 await click('[data-kit-war-tactics]');await check(`document.querySelectorAll('[data-tactic-count]').length===12`,'alternate war office exposes the same legal tactic editor');await click('[data-tactic-cancel]');await pause(40);
 await click('[data-kit-war-deck]');await check(`document.querySelectorAll('[data-deck-entry]').length===30&&window.alternateCourtCalls===0`,'alternate war office exposes the exact read-only deck without spending resources');
 await check(`localStorage.getItem('emperor.save.v1')===null`,'isolated test never writes the actual game save key');
 if(errors.length)throw Error(errors.join('\n'));clearTimeout(timer);const result={date:new Date().toISOString(),elapsedSeconds:(Date.now()-start)/1000,checks,consoleErrors:errors};fs.writeFileSync('/private/tmp/card-plans-validation.json',JSON.stringify(result,null,2)+'\n');console.log('Plan desktop acceptance passed: '+checks.length+' checks, '+result.elapsedSeconds+' seconds.');app.exit(0);
 }catch(e){console.error(e);clearTimeout(timer);app.exit(1);}
});
