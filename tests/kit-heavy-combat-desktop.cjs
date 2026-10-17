const {app,BrowserWindow}=require('electron'),fs=require('node:fs'),path=require('node:path');
app.setPath('userData',`/private/tmp/emperor-kit-heavy-combat-${process.pid}`);
app.whenReady().then(async()=>{
 const timeout=setTimeout(()=>{console.error('重骑实战验收超时');app.exit(1);},60000),w=new BrowserWindow({show:false,width:1440,height:1000,webPreferences:{sandbox:true,contextIsolation:true,nodeIntegration:false,backgroundThrottling:false}});
 const run=c=>w.webContents.executeJavaScript(`(async()=>{${c}})()`),pause=ms=>new Promise(r=>setTimeout(r,ms));
 const until=async code=>{for(let i=0;i<150;i++){if(await run(`return ${code};`))return;await pause(20);}throw Error('重骑状态超时 '+code);};
 const shot=async name=>{await run(`await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));`);fs.writeFileSync(`/private/tmp/emperor-kit-heavy-${name}.png`,(await w.webContents.capturePage()).toPNG());};
 try{
  await w.loadFile(path.join(__dirname,'../index.html'));
  await run(`const {newGame}=await import('./src/game.mjs'),{beginWar,generals,borderingCountries}=await import('./src/war.mjs'),{openWar}=await import('./src/war-ui.mjs'),{persistCandidate}=await import('./src/persistence.mjs');const s=newGame('重骑实战');s.scene='court';const g=generals(s.domestic);window.s=beginWar(s,{id:1,kitVersion:1,kind:'war',targetId:borderingCountries(s.domestic)[0].id,generalId:g[0].id,commanderSquad:{kind:'cavalry',count:37},squads:[{kind:'heavy-cavalry',count:10,generalId:g[1].id},{kind:'spears',count:100,generalId:g[2].id}]});const b=window.s.domestic.war.battle,a=b.units[0],t=b.units.find(u=>u.side==='enemy'&&u.kind==='heavy-cavalry');if(!t)throw Error('没有重骑目标');a.x=2;a.y=4;t.x=5;t.y=4;b.order=[a.id,...b.order.filter(id=>id!==a.id)];b.cursor=0;window.targetId=t.id;window.launch=()=>openWar(window.s,document.body,next=>{window.s=persistCandidate(window.s,next,localStorage);},()=>{});window.launch();document.querySelector('[data-unit="'+t.id+'"]').dispatchEvent(new MouseEvent('click'));window.savedBattle=JSON.stringify(window.s.domestic.war.battle);if(!window.s.domestic.war.battle.log.some(l=>l.includes('冲锋 +30%')))throw Error('实际冲锋未生效');`);
  await until(`document.querySelector('[data-unit="'+window.targetId+'"]')?.dataset.reaction==='hit'`);await shot('received-hit');
  await until(`document.querySelector('[data-unit="u0"]')?.dataset.reaction==='death'`);
  await until(`document.querySelector('[data-unit="u0"] .unit-art')?.getAnimations().some(a=>a.effect.getKeyframes().some(f=>f.opacity==='0'||f.opacity===0))`);
  await run(`window.death=document.querySelector('[data-unit="u0"] .unit-art').getAnimations().find(a=>a.effect.getKeyframes().some(f=>f.opacity==='0'||f.opacity===0));window.death.pause();window.death.currentTime=window.death.effect.getTiming().duration*.65;`);await shot('death');
  await run(`if(getComputedStyle(document.querySelector('[data-unit="u0"] .unit-art')).transform==='none')throw Error('重骑阵亡没有实际倾倒');window.death.play();document.querySelector('[data-save-close]').click();`);await pause(80);
  await run(`window.launch();if(JSON.stringify(window.s.domestic.war.battle)!==window.savedBattle)throw Error('关闭重骑动画重复结算');if(document.querySelector('[data-unit="u0"]'))throw Error('阵亡重骑重新出现');`);
  clearTimeout(timeout);console.log('重骑实战桌面验收通过：直线冲锋、独立攻击、受击反馈、骑乘倾倒消退、动画中关闭续战与伤亡一致');app.exit(0);
 }catch(e){console.error(e);clearTimeout(timeout);app.exit(1);}
});
