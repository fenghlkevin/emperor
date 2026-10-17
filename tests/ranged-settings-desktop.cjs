const {app,BrowserWindow}=require('electron');const path=require('node:path');
app.setPath('userData',`/private/tmp/emperor-ranged-settings-${process.pid}`);
app.whenReady().then(async()=>{
 const timeout=setTimeout(()=>app.exit(1),45000),w=new BrowserWindow({show:false,width:1400,height:960,webPreferences:{sandbox:true,contextIsolation:true,backgroundThrottling:false}}),run=c=>w.webContents.executeJavaScript(`(async()=>{${c}})()`),pause=ms=>new Promise(r=>setTimeout(r,ms));
 const until=async c=>{for(let i=0;i<300;i++){if(await run(`return ${c}`))return;await pause(10);}throw Error('状态超时 '+c);};
 try{await w.loadFile(path.join(__dirname,'../index.html'));
 for(const mode of ['fast','reduced','auto']){const reduced=mode==='reduced';
 await run(`const {newGame}=await import('./src/game.mjs'),{beginWar,generals,borderingCountries}=await import('./src/war.mjs'),{openWar}=await import('./src/war-ui.mjs');window.originalMatchMedia??=window.matchMedia.bind(window);window.matchMedia=q=>q==='(prefers-reduced-motion: reduce)'?{matches:${reduced},addEventListener(){},removeEventListener(){}}:originalMatchMedia(q);const s=newGame('动画设置');s.scene='court';const g=generals(s.domestic);window.s=beginWar(s,{id:1,kitVersion:1,kind:'war',targetId:borderingCountries(s.domestic)[0].id,generalId:g[0].id,commanderSquad:{kind:'infantry',count:30},squads:[{kind:'archers',count:100,generalId:g[1].id}]});const b=window.s.domestic.war.battle,a=b.units[0],t=b.units.find(u=>u.side==='enemy'&&!u.commander);a.x=3;a.y=4;t.x=6;t.y=4;b.order=[a.id,...b.order.filter(id=>id!==a.id)];b.cursor=0;window.target=t.id;openWar(window.s,document.body,n=>{window.s=n;},()=>{});const speed=document.querySelector('[data-battle-speed]');speed.value='4';speed.dispatchEvent(new Event('change'));document.querySelector('[data-cell="3,3"]').dispatchEvent(new MouseEvent('click'));`);
 await until(`document.querySelector('.battle-dialog')?.dataset.busy==='false'`);
 if(mode==='auto'){await run(`document.querySelector('[data-auto]').click();`);await until(`document.querySelector('[data-unit="u0"]')?.getAnimations().some(a=>a.effect.getTiming().duration===100)`);await run(`document.querySelector('[data-save-close]').click();`);await until(`!document.querySelector('.battle-dialog')`);continue;}
 await run(`const b=window.s.domestic.war.battle,{attackPreview}=await import('./src/battle.mjs'),p=attackPreview(b,b.units[0],b.units.find(u=>u.id===window.target));if(!p.movedShot)throw Error('移动射击惩罚缺失 '+JSON.stringify({unit:b.units[0],p,log:b.log,notice:document.querySelector('.battle-message')?.textContent}));window.expected=p.killed;window.initialTarget=b.units.find(u=>u.id===window.target).count;document.querySelector('[data-unit="'+window.target+'"]').dispatchEvent(new MouseEvent('click'));if(window.initialTarget-window.s.domestic.war.battle.units.find(u=>u.id===window.target).count!==window.expected)throw Error('移动射击预览不一致');`);
 if(!reduced){await until(`document.querySelector('[data-unit="u0"]')?.getAnimations().some(a=>a.effect.getTiming().duration===250)`);}
 await until(`document.querySelector('.battle-dialog')?.dataset.busy==='false'`);
 await run(`document.querySelector('[data-save-close]').click();if(document.querySelector('[data-projectile]'))throw Error('动画设置下箭矢残留');`);await until(`!document.querySelector('.battle-dialog')`);
 }
 console.log('原生动画设置通过：极速4倍实际250ms、自动叠加2.5倍实际100ms、移动后射击预览一致、减少动态效果完成清理');clearTimeout(timeout);app.exit(0);
 }catch(e){console.error(e);clearTimeout(timeout);app.exit(1);}
});
