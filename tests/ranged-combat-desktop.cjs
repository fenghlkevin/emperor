const {app,BrowserWindow}=require('electron'),fs=require('node:fs'),path=require('node:path');
app.setPath('userData',`/private/tmp/emperor-archers-combat-${process.pid}`);
app.whenReady().then(async()=>{
 const timeout=setTimeout(()=>{console.error('远程实战验收超时');app.exit(1);},60000),w=new BrowserWindow({show:false,width:1440,height:1000,webPreferences:{sandbox:true,contextIsolation:true,nodeIntegration:false,backgroundThrottling:false}});
 const run=c=>w.webContents.executeJavaScript(`(async()=>{${c}})()`),pause=ms=>new Promise(r=>setTimeout(r,ms));
 const until=async code=>{for(let i=0;i<150;i++){if(await run(`return ${code};`))return;await pause(20);}throw Error('远程状态超时 '+code);};
 const shot=async name=>{await run(`window.captureAnimations=document.getAnimations().filter(a=>a.playState==='running');window.captureAnimations.forEach(a=>a.pause());await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));`);fs.writeFileSync(`/private/tmp/emperor-archers-${name}.png`,(await w.webContents.capturePage()).toPNG());await run('window.captureAnimations.forEach(a=>a.play());');};
 try{
  await w.loadFile(path.join(__dirname,'../index.html'));
  await run(`const {newGame}=await import('./src/game.mjs'),{beginWar,generals,borderingCountries}=await import('./src/war.mjs'),{openWar}=await import('./src/war-ui.mjs'),{persistCandidate}=await import('./src/persistence.mjs');const s=newGame('远程实战');s.scene='court';const g=generals(s.domestic);window.s=beginWar(s,{id:1,kitVersion:1,kind:'war',targetId:borderingCountries(s.domestic)[0].id,generalId:g[0].id,commanderSquad:{kind:'cavalry',count:37},squads:[{kind:'archers',count:100,generalId:g[1].id},{kind:'spears',count:100,generalId:g[2].id}]});const b=window.s.domestic.war.battle,a=b.units[0],t=b.units.find(u=>u.side==='enemy'&&!u.commander);a.x=3;a.y=4;t.x=6;t.y=4;b.order=[a.id,...b.order.filter(id=>id!==a.id)];b.cursor=0;window.targetId=t.id;window.launch=()=>openWar(window.s,document.body,next=>{window.s=persistCandidate(window.s,next,localStorage);},()=>{});window.launch();document.querySelector('[data-unit="'+t.id+'"]').dispatchEvent(new MouseEvent('click'));window.savedBattle=JSON.stringify(window.s.domestic.war.battle);if(!window.s.domestic.war.battle.log.some(l=>l.includes('射击')))throw Error('实际射击未生效');`);
  await until(`!!document.querySelector('[data-projectile="archers"]')`);await shot('projectile');
  await until(`document.querySelector('[data-unit="'+window.targetId+'"]')?.dataset.reaction==='hit'`);await shot('ranged-hit');
  await run(`if(document.querySelector('[data-unit="u0"]')?.dataset.reaction)throw Error('发生隔空反击');document.querySelector('[data-save-close]').click();`);await pause(80);
  await run(`window.launch();if(JSON.stringify(window.s.domestic.war.battle)!==window.savedBattle)throw Error('关闭射击动画重复结算');if(document.querySelector('[data-projectile]'))throw Error('箭矢未清理');`);
  clearTimeout(timeout);console.log('远程实战桌面验收通过：实际射击、飞行箭矢、中箭受击、无隔空反击、关闭续战与伤亡一致');app.exit(0);
 }catch(e){console.error(e);clearTimeout(timeout);app.exit(1);}
});
