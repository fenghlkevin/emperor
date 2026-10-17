const kind=process.argv.includes('--crossbows')?'crossbows':'archers';
const {app,BrowserWindow}=require('electron'),fs=require('node:fs'),path=require('node:path');
app.setPath('userData',`/private/tmp/emperor-ranged-death-combat-${process.pid}`);
app.whenReady().then(async()=>{
 const timeout=setTimeout(()=>{console.error('弓弩实战验收超时');app.exit(1);},60000),w=new BrowserWindow({show:false,width:1440,height:1000,webPreferences:{sandbox:true,contextIsolation:true,nodeIntegration:false,backgroundThrottling:false}});
 const run=c=>w.webContents.executeJavaScript(`(async()=>{${c}})()`),pause=ms=>new Promise(r=>setTimeout(r,ms));
 const until=async code=>{for(let i=0;i<150;i++){if(await run(`return ${code};`))return;await pause(20);}throw Error('弓弩状态超时 '+code);};
 const shot=async name=>{await run(`await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));`);fs.writeFileSync(`/private/tmp/emperor-ranged-death-${kind}-${name}.png`,(await w.webContents.capturePage()).toPNG());};
 try{
  await w.loadFile(path.join(__dirname,'../index.html'));
  await run(`const {newGame}=await import('./src/game.mjs'),{beginWar,generals,borderingCountries}=await import('./src/war.mjs'),{openWar}=await import('./src/war-ui.mjs'),{persistCandidate}=await import('./src/persistence.mjs');const s=newGame('弓弩实战');s.scene='court';const g=generals(s.domestic);window.s=beginWar(s,{id:1,kitVersion:1,kind:'war',targetId:borderingCountries(s.domestic)[0].id,generalId:g[0].id,commanderSquad:{kind:'cavalry',count:37},squads:[{kind:'${kind}',count:10,generalId:g[1].id},{kind:'spears',count:100,generalId:g[2].id}]});const b=window.s.domestic.war.battle,a=b.units[0],t=b.units.find(u=>u.side==='enemy'&&u.kind==='heavy-cavalry');if(!t)throw Error('没有弓弩目标');a.x=2;a.y=4;t.x=3;t.y=4;b.order=[a.id,...b.order.filter(id=>id!==a.id)];b.cursor=0;window.targetId=t.id;window.launch=()=>openWar(window.s,document.body,next=>{window.s=persistCandidate(window.s,next,localStorage);},()=>{});window.launch();document.querySelector('[data-unit="'+t.id+'"]').dispatchEvent(new MouseEvent('click'));window.savedBattle=JSON.stringify(window.s.domestic.war.battle);if(window.s.domestic.war.battle.units[0].count!==0)throw Error('弱近战未被反击击溃');if(document.querySelector('[data-projectile]'))throw Error('近战生成飞箭');`);
  await until(`document.querySelector('[data-unit="u0"] .unit-sprite')?.dataset.animation==='melee'`);
  await until(`document.querySelector('[data-unit="'+window.targetId+'"]')?.dataset.reaction==='hit'`);
  await until(`document.querySelector('[data-unit="u0"]')?.dataset.reaction==='death'`);
  await until(`document.querySelector('[data-unit="u0"] .unit-art')?.getAnimations().some(a=>a.effect.getKeyframes().some(f=>f.opacity==='0'||f.opacity===0))`);
  await run(`window.death=document.querySelector('[data-unit="u0"] .unit-art').getAnimations().find(a=>a.effect.getKeyframes().some(f=>f.opacity==='0'||f.opacity===0));window.death.pause();await window.death.ready;window.death.currentTime=window.death.effect.getTiming().duration*.65;await new Promise(r=>requestAnimationFrame(r));const matrix=new DOMMatrix(getComputedStyle(document.querySelector('[data-unit="u0"] .unit-art')).transform);if(Math.abs(matrix.b)<.2)throw Error('阵亡中间帧旋转未生效 '+matrix.toString());`);await shot('death');
  await run(`if(getComputedStyle(document.querySelector('[data-unit="u0"] .unit-art')).transform==='none')throw Error('弓弩阵亡没有实际倾倒');window.death.play();document.querySelector('[data-save-close]').click();`);await pause(80);
  await run(`window.launch();if(JSON.stringify(window.s.domestic.war.battle)!==window.savedBattle)throw Error('关闭弓弩动画重复结算');if(document.querySelector('[data-unit="u0"]'))throw Error('阵亡弓弩重新出现');`);
  clearTimeout(timeout);console.log('弓弩实战桌面验收通过：弱近战无射击、反击受伤、弓弩自身倾倒阵亡、动画中关闭续战伤亡不变');app.exit(0);
 }catch(e){console.error(e);clearTimeout(timeout);app.exit(1);}
});
