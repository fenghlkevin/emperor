const {app,BrowserWindow}=require('electron');
const fs=require('node:fs'),path=require('node:path');
app.setPath('userData',`/private/tmp/emperor-crisis-recovery-${process.pid}`);
app.whenReady().then(async()=>{
 const timer=setTimeout(()=>app.exit(1),60000),w=new BrowserWindow({show:false,width:1360,height:960,webPreferences:{sandbox:true,contextIsolation:true,nodeIntegration:false,backgroundThrottling:false}});
 const run=code=>w.webContents.executeJavaScript(`(async()=>{${code}})()`);
 const records=[];
 try{
  await w.loadFile(path.join(__dirname,'../index.html'));
  // Reach the low-happiness invasion using only normal rules. Invasion timing
  // can change with balance; do not hardcode the former turn 78.
  await run(`const {newGame,sleepUntilNextTurn}=await import('./src/game.mjs'),{executePersonnel}=await import('./src/personnel-actions.mjs'),{spendEnergy}=await import('./src/emperor.mjs');let s=newGame('可玩性验收');s.createdAt='2026-10-17T00:00:00.000Z';s.domestic.disasters.seed=1;for(let i=0;i<19;i++){s=executePersonnel(s,{id:s.domestic.personnel.nextId,kind:'delegate',provinceId:'guannei',enabled:i%2===0}).state;spendEnergy(s,true);}for(let i=0;i<200&&s.domestic.strategy.pending?.defender!=='sheng';i++)sleepUntilNextTurn(s);if(s.stats.happiness!==18||s.domestic.strategy.pending?.defender!=='sheng')throw Error('自然来敌复现失败');window.reachable=JSON.stringify(s);`);
  const base=await run('return window.reachable;');
  for(const mode of ['low-happiness-auto','low-happiness-withdraw','low-health-auto','zero-energy-auto','healthy-auto']){
   await run(`const s=JSON.parse(${JSON.stringify(base)});if(${JSON.stringify(mode)}==='low-health-auto'){s.stats.health=10;s.stats.happiness=75;}if(${JSON.stringify(mode)}==='zero-energy-auto'){s.stats.energy=0;s.stats.happiness=75;}if(${JSON.stringify(mode)}==='healthy-auto'){s.stats.health=100;s.stats.happiness=75;}localStorage.setItem('emperor.save.v1',JSON.stringify(s));window.before=s;`);
   const before=await run('return window.before;');await w.loadFile(path.join(__dirname,'../index.html'));
   await run(`document.querySelector('#continue').click();document.querySelector('#chronicle').click();const action=document.querySelector(${JSON.stringify(mode.endsWith('withdraw')?'[data-kit-withdraw]':'[data-kit-defend-auto]')});if(!action||action.disabled)throw Error('应战按钮不可用：'+document.querySelector('dialog[open]')?.textContent);action.click();if(${JSON.stringify(mode.endsWith('withdraw'))})action.click();`);
   const result=await run(`const s=JSON.parse(localStorage.getItem('emperor.save.v1'));return {turn:s.turn,pending:!!s.domestic.strategy.pending,battle:!!s.domestic.war.battle,health:s.stats.health,happiness:s.stats.happiness,energy:s.stats.energy,life:s.stats.life,status:document.querySelector('[data-kit-defense-status]')?.textContent??''};`);
   records.push({mode,before:{turn:before.turn,happiness:before.stats.happiness,health:before.stats.health,energy:before.stats.energy},after:result});
   if(result.pending||result.battle)throw Error(`${mode} 军务没有结算：${result.status}`);
   if(mode==='healthy-auto'&&(result.energy!==before.stats.energy-1||result.health!==98||result.happiness!==72))throw Error('正常军务行动成本被改变');
   if(mode.startsWith('low-happiness')){
    await run(`document.querySelector('.war-office .close').click();document.querySelector('[data-sleep-next-turn]').click();document.querySelector('[data-confirm-sleep]').click();if(JSON.parse(localStorage.getItem('emperor.save.v1')).turn!==${before.turn+1})throw Error('战后仍无法继续下一旬');`);
   }
  }
  fs.writeFileSync('/private/tmp/emperor-crisis-recovery-results.json',JSON.stringify(records,null,2)+'\n');
  fs.writeFileSync('/private/tmp/emperor-crisis-recovery.png',(await w.webContents.capturePage()).toPNG());
  clearTimeout(timer);console.log('危机恢复桌面验收通过：自然低快乐来敌、自动迎敌/撤守、低健康、零体力、健康状态保留行动成本、战后继续下一旬。');app.exit(0);
 }catch(e){fs.writeFileSync('/private/tmp/emperor-crisis-recovery-failure.png',(await w.webContents.capturePage()).toPNG());fs.writeFileSync('/private/tmp/emperor-crisis-recovery-results.json',JSON.stringify(records,null,2)+'\n');console.error(e);clearTimeout(timer);app.exit(1);}
});
