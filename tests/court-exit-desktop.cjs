const {app,BrowserWindow}=require('electron');
const path=require('node:path');
app.setPath('userData','/private/tmp/emperor-court-exit-test');
app.whenReady().then(async()=>{
 const w=new BrowserWindow({show:false,width:1360,height:950,webPreferences:{sandbox:true,contextIsolation:true,nodeIntegration:false}});
 const errors=[];
 w.webContents.on('render-process-gone',(_,details)=>errors.push(JSON.stringify(details)));
 w.webContents.on('console-message',(_,details)=>{if(details.level==='error')errors.push(details.message);});
 try{
  await w.webContents.session.clearStorageData();
  await w.loadFile(path.join(__dirname,'../index.html'));
  const result=await w.webContents.executeJavaScript(`(async()=>{
   const wait=ms=>new Promise(r=>setTimeout(r,ms));
   const click=selector=>{const el=document.querySelector(selector);if(!el)throw Error('缺少入口 '+selector);el.click();};
   document.querySelector('#new-dynasty').click();document.querySelector('#name').value='退朝验收';document.querySelector('#create').requestSubmit();
   for(let i=0;i<8;i++){
    click('[data-scene="court"]');
    if(!document.querySelector('.scene.court'))throw Error('未进入朝堂');
    if(i%2){
     for(let n=0;n<300&&document.querySelector('.court').dataset.courtReady==='loading';n++)await wait(20);
     click('[data-entry="revenue-minister"]');
     click('[data-court-action="register"]');
     click('dialog[open] .close');await wait(30);
    }
    click('[data-scene="palace"]');await wait(100);
    if(!document.querySelector('.scene.palace'))throw Error('退朝未返回皇城');
    const saved=JSON.parse(localStorage.getItem('emperor.save.v1'));
    if(saved.scene!=='palace'||saved.phase!==1)throw Error('退朝存档阶段错误');
    if(i<7){click('[data-sleep-next-turn]');click('[data-confirm-sleep]');await wait(40);while(document.querySelector('dialog[open] [data-ack-auspice]')){click('[data-ack-auspice]');await wait(30);}}
   }
   return '连续8旬：立即退朝、召见后退朝、皇城渲染及存档阶段通过';
  })()`);
  if(errors.length)throw Error(errors.join('\n'));
  console.log(result);app.exit(0);
 }catch(error){console.error(error);app.exit(1);}
});
