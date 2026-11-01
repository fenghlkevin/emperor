const {app,BrowserWindow}=require('electron');
const path=require('node:path'),fs=require('node:fs');
app.setPath('userData',`/private/tmp/emperor-court-roster-interaction-${process.pid}`);
app.whenReady().then(async()=>{
 const w=new BrowserWindow({show:false,width:1440,height:1000,webPreferences:{sandbox:true,contextIsolation:true,nodeIntegration:false,backgroundThrottling:false}});
 const run=c=>w.webContents.executeJavaScript(`(async()=>{${c}})()`);
 try{
  await w.loadFile(path.join(__dirname,'../index.html'));
  await run(`document.querySelector('.opening-skip')?.click();document.querySelector('#new-dynasty').click();document.querySelector('#name').value='朝班验收';document.querySelector('#country-name').value='大明';document.querySelector('#era-name').value='承平';document.querySelector('#create').requestSubmit();document.querySelector('[data-entry=court]').click();for(let i=0;i<300&&document.querySelector('.court')?.dataset.courtReady!=='true';i++)await new Promise(r=>setTimeout(r,30));if(document.querySelector('.court')?.dataset.courtReady!=='true')throw Error('人物未加载');`);
  console.log(await run(`
   const wait=ms=>new Promise(r=>setTimeout(r,ms));
   const first=document.querySelector('.court-person[data-entry="works-minister"]');
   if(!first)throw Error('找不到工部人物');first.click();await wait(500);
   if(!first.classList.contains('is-summoned')||!document.querySelector('.court-audience[open]'))throw Error('召见未出列或未打开菜单');
   const task=document.querySelector('[data-court-action="works-records"]');if(!task)throw Error('找不到工程记录 '+document.querySelector('.court-audience')?.textContent);task.click();await wait(100);
   if(document.querySelector('.court-audience[open]'))throw Error('进入功能未收起菜单');
   const feature=document.querySelector('dialog[open]');if(!feature)throw Error('未进入功能');feature.close();await wait(500);
   if(!document.querySelector('.court-audience[open]')||!document.querySelector('[data-entry="works-minister"]').classList.contains('is-summoned'))throw Error('关闭功能未返回菜单');
   const second=document.querySelector('[data-entry="revenue-minister"]');if(!second)throw Error('找不到户部人物');second.click();await wait(500);
   if(document.querySelectorAll('.is-summoned').length!==1||!document.querySelector('[data-entry="revenue-minister"]').classList.contains('is-summoned')||document.querySelectorAll('.court-audience').length!==1)throw Error('切换人物未正确交接');
   document.querySelector('[data-court-close]').click();await wait(500);
   if(document.querySelector('.is-summoned')||document.querySelector('.court-audience'))throw Error('退未归位');
   return '人物出列、进入功能、返回菜单、切换人物、退回原位全部通过';
  `));
  for(const office of ['war-minister','works-minister','revenue-minister']){
   await run(`document.querySelector('.court-person[data-entry="${office}"]').click();await new Promise(r=>setTimeout(r,500));if(!document.querySelector('.court-audience[open]'))throw Error('Esc 测试菜单未打开');document.querySelector('.court-person[data-entry="${office}"]').focus();`);
   w.webContents.sendInputEvent({type:'keyDown',keyCode:'Escape'});
   w.webContents.sendInputEvent({type:'keyUp',keyCode:'Escape'});
   await new Promise(r=>setTimeout(r,500));
   console.log(await run(`if(document.querySelector('.court-audience')||document.querySelector('.is-summoned')||document.querySelector('.court-person.selected'))throw Error('Esc 未收起菜单并归位：${office}');return '${office}：焦点在菜单外时 Esc 退回原位通过';`));
  }
  w.setSize(1440,1000);await new Promise(r=>setTimeout(r,200));fs.writeFileSync('/private/tmp/emperor-court-roster-interaction.png',(await w.webContents.capturePage()).toPNG());app.exit(0);
 }catch(error){console.error(error);app.exit(1);}
});
