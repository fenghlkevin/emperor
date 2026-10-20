const {app,BrowserWindow}=require('electron'),fs=require('node:fs'),path=require('node:path');
app.setPath('userData',`/private/tmp/emperor-tactics-${process.pid}`);
app.whenReady().then(async()=>{
 const w=new BrowserWindow({show:false,width:1440,height:1000,webPreferences:{sandbox:true,contextIsolation:true,backgroundThrottling:false}});
 const timer=setTimeout(()=>app.exit(1),60000),pause=ms=>new Promise(r=>setTimeout(r,ms)),run=c=>w.webContents.executeJavaScript(`(async()=>{${c}})()`);
 const idle=async()=>{for(let i=0;i<150;i++){if(await run("return document.querySelector('dialog')?.dataset.busy==='false';"))return;await pause(30);}throw Error('动画未结束');};
 try{
 await w.loadFile(path.join(__dirname,'../index.html'));
 await run(`const {newGame}=await import('./src/game.mjs'),{beginWar,generals,borderingCountries}=await import('./src/war.mjs'),{openWar}=await import('./src/war-ui.mjs');
 const s=newGame('战术实战'),gs=generals(s.domestic);window.s=beginWar(s,{id:1,kitVersion:1,kind:'war',targetId:borderingCountries(s.domestic)[0].id,generalId:gs[0].id,commanderSquad:{kind:'cavalry',count:100},squads:[{kind:'spears',count:100,generalId:gs[1].id}]});
 const b=window.s.domestic.war.battle,a=b.units[0],t=b.units.find(u=>u.side==='enemy'&&!u.commander);b.tiles.fill('plain');b.tiles[2*13+3]='forest';Object.assign(a,{kind:'horse-archers',x:3,y:4});Object.assign(t,{x:6,y:4,count:100,initial:100,dead:0});window.target=t.id;b.order=[a.id,...b.order.filter(id=>id!==a.id)];b.cursor=0;
 window.launch=()=>openWar(window.s,document.body,next=>{window.s=next;},()=>{});window.launch();
 if(!document.querySelector('.battle-selection').textContent.includes('移动点 5 / 5'))throw Error('移动点提示错误');
 if(!document.querySelector('[data-cell="3,2"] title').textContent.includes('消耗 3'))throw Error('骑乘林地费用错误');
 document.querySelector('[data-cell="3,3"]').dispatchEvent(new MouseEvent('click'));`);
 await idle();
 await run(`document.querySelector('[data-unit="'+target+'"]').dispatchEvent(new MouseEvent('click'));`);
 await idle();
 await run(`const b=window.s.domestic.war.battle,a=b.units[0];if(b.cursor!==0||!a.attacked||a.moveSpent!==3)throw Error('射后移动状态未保留');
 if(!document.querySelector('[data-battle-hint]').textContent.includes('剩余 2 移动点'))throw Error('射后提示错误');
 document.querySelector('[data-cell="2,3"]').dispatchEvent(new MouseEvent('click'));`);
 await idle();
 await run(`const b=window.s.domestic.war.battle;if(b.units[0].x!==2||b.units[0].moveSpent!==4)throw Error('射后移动未落地');
 (await import('./src/battle.mjs')).validateBattle(b);window.snapshot=JSON.stringify(b);document.querySelector('[data-save-close]').click();launch();
 if(JSON.stringify(window.s.domestic.war.battle)!==snapshot)throw Error('续战重复结算');`);
 const out=path.join(__dirname,'../output/battle-tactics');fs.mkdirSync(out,{recursive:true});fs.writeFileSync(path.join(out,'horse-archer-after-shot.png'),(await w.webContents.capturePage()).toPNG());
 clearTimeout(timer);console.log('战术桌面验收通过：真实战争界面、地形费用、弓骑移动—射击—移动、剩余点提示与保存续战');app.exit(0);
 }catch(e){console.error(e);clearTimeout(timer);app.exit(1);}
});
