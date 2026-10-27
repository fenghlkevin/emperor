const {app,BrowserWindow}=require('electron');
const path=require('node:path');
const fs=require('node:fs');
app.setPath('userData',`/private/tmp/emperor-smoke-profile-${process.pid}`);
app.whenReady().then(async()=>{
 const w=new BrowserWindow({show:false,width:1360,height:1000,webPreferences:{contextIsolation:true,nodeIntegration:false,sandbox:true}});
 const errors=[];
 w.webContents.on('console-message',event=>{if(event.level==='error')errors.push(event.message+' at '+event.sourceId+':'+event.lineNumber);});
 const run=code=>w.webContents.executeJavaScript(`(async()=>{const click=selector=>{const element=document.querySelector(selector);if(!element)throw Error('Missing control: '+selector+'; dialogs: '+[...document.querySelectorAll('dialog[open]')].map(d=>d.outerHTML.slice(0,700)).join(' | '));element.click();};${code}})()`);
 const timer=setTimeout(()=>{console.error('Desktop smoke timed out');app.exit(1);},60000);
 try{
  await w.webContents.session.clearStorageData();
  await w.loadFile(path.join(__dirname,'../index.html'));
  await run(`document.querySelector('.opening-skip')?.click();
   click('#new-dynasty');
   for(const [id,value] of [['name','验收帝'],['country-name','大晟'],['era-name','景明']])document.getElementById(id).value=value;
   document.querySelector('#create').requestSubmit();
   const {buildings,officials}=await import('./src/game.mjs');
   if(document.querySelectorAll('.hotspot').length!==buildings.length)throw Error('皇宫入口数量错误');
   click('[data-entry="court"]');
   if(document.querySelectorAll('.hotspot').length!==officials.length)throw Error('朝堂入口数量错误');
   click('[data-entry="justice-minister"]');
   if(!document.querySelector('dialog[open]'))throw Error('刑部面板未打开');
   click('dialog[open] [data-court-close]');
   await new Promise(r=>setTimeout(r,0));
   click('#saves');
   if(!document.querySelector('dialog[open] #export')||!document.querySelector('dialog[open] #import'))throw Error('存档面板入口缺失');
   click('dialog[open] .close');
   const saved=JSON.parse(localStorage.getItem('emperor.save.v1'));
   if(saved.name!=='验收帝'||saved.scene!=='court')throw Error('场景进度未保存');`);

  await new Promise((resolve,reject)=>{w.webContents.once('did-finish-load',resolve);w.webContents.once('did-fail-load',(_event,code,description)=>reject(Error(description)));w.reload();});
  await run(`document.querySelector('.opening-skip')?.click();click('#continue');if(!document.querySelector('.game.is-court'))throw Error('继续游戏未恢复朝堂');`);
  await run(`for(let i=0;document.querySelector('.court')?.dataset.courtReady!=='true';i++){if(i>=200)throw Error('朝堂立绘未就绪');await new Promise(r=>setTimeout(r,25));}`);
  await new Promise(r=>setTimeout(r,150));
  fs.writeFileSync('/private/tmp/emperor-court.png',(await w.webContents.capturePage()).toPNG());
  w.setSize(900,680);await new Promise(r=>setTimeout(r,200));
  await run(`if([...document.querySelectorAll('.court-person-canvas')].some(c=>!c.width||!c.height))throw Error('朝堂立绘画布为空');`);
  const layout=await run(`return {width:document.documentElement.scrollWidth,viewport:innerWidth,bottom:document.querySelector('footer').getBoundingClientRect().bottom,height:innerHeight};`);
  if(layout.width>layout.viewport||layout.bottom>layout.height)throw Error('小窗口布局溢出: '+JSON.stringify(layout));
  await run(`const {mountCourtActors}=await import('./src/court-actors.mjs');
   const {officials}=await import('./src/game.mjs');
   const domestic=structuredClone(JSON.parse(localStorage.getItem('emperor.save.v1')).domestic);
   domestic.justice.officials=domestic.justice.officials.filter(p=>p.status==='serving').slice(0,1);
   const host=document.createElement('div'),scene=document.createElement('section');
   scene.style.width='1000px';scene.style.height='600px';
   scene.innerHTML='<img>'+officials.map(o=>'<button data-entry="'+o.id+'" aria-label="'+o.name+'"></button>').join('');
   host.append(scene);document.body.append(host);const dispose=mountCourtActors(scene,domestic);
   try{for(let i=0;scene.dataset.courtReady!=='true';i++){if(i>=200)throw Error('单排朝堂未就绪');await new Promise(r=>setTimeout(r,25));}
    const canvas=scene.querySelector('canvas');if(!canvas?.width||!canvas.height)throw Error('单排朝堂画布为空');
   }finally{dispose();host.remove();}`);
  if(errors.length)throw Error(errors.join('\n'));
  console.log('王朝创建、皇宫与朝堂入口、刑部面板、存档入口、刷新续玩和小窗口布局检查通过');
  clearTimeout(timer);app.exit(0);
 }catch(e){console.error(e);clearTimeout(timer);app.exit(1);}
});
