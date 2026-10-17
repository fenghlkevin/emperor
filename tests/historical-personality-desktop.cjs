const {app,BrowserWindow}=require('electron'),fs=require('node:fs'),path=require('node:path');
app.setPath('userData','/private/tmp/emperor-personality-test');
app.whenReady().then(async()=>{const w=new BrowserWindow({show:false,width:1440,height:1000,webPreferences:{sandbox:true,contextIsolation:true}});try{
await w.webContents.session.clearStorageData();await w.loadFile(path.join(__dirname,'../index.html'));
await w.webContents.executeJavaScript(`(async()=>{const {newGame}=await import('./src/game.mjs'),{HISTORICAL_PEOPLE}=await import('./src/historical-people.mjs');const s=newGame('性格验收');s.scene='court';for(const name of ['文天祥','张飞']){const p=HISTORICAL_PEOPLE.find(p=>p.name===name);s.domestic.justice.officials.push({...structuredClone(s.domestic.justice.officials[0]),...p,id:'recruit-'+p.id,office:'待任',provinceId:null,status:'imprisoned',loyalty:50,discovered:true,discoveredTurn:1,plotTurn:null,prison:{admittedTurn:1,lastSettledTurn:1,servedTurns:0,lastDelta:0,totalDelta:0,lastReason:'新近收押'}});}localStorage.setItem('emperor.save.v1',JSON.stringify(s));})()`);
await w.reload();await w.webContents.executeJavaScript(`document.querySelector('#continue').click();document.querySelector('[data-official="justice-minister"]').click();document.querySelector('[data-tab="prison"]').click();const text=document.body.textContent;if(!text.includes('文天祥')||!text.includes('张飞')||!text.includes('下旬预计 -3')||!text.includes('下旬预计 +0'))throw Error('历史性格未显示');document.querySelector('.prison-personality-details').open=true;`);
await new Promise(r=>setTimeout(r,300));fs.writeFileSync('/private/tmp/emperor-personality-prison.png',(await w.webContents.capturePage()).toPNG());
await w.webContents.executeJavaScript(`document.querySelector('[data-profile]').click();if(!document.body.textContent.includes('人物性格'))throw Error('人物详情缺少性格');`);
console.log('历史人物天牢验收通过：性格依据、不同反应、人物详情');app.exit(0);
}catch(e){console.error(e);app.exit(1);}});
