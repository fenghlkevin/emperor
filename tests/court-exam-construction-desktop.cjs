const {app,BrowserWindow}=require('electron');
const path=require('node:path');
app.setPath('userData','/private/tmp/emperor-court-exam-construction-test');
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
   click('[data-scene="court"]');
   click('[data-entry="personnel-minister"]');click('[data-tab="exam"]');click('[data-exam]');
   click('.personnel-minister-dialog .close');await wait(40);
   click('[data-entry="works-minister"]');
   const cities=[...document.querySelector('[name="provinceId"]').options].map(o=>o.value);
   for(const city of cities){
    const p=document.querySelector('[name="provinceId"]');p.value=city;p.dispatchEvent(new Event('change'));
    const b=document.querySelector('[name="building"]');b.value='markets';b.dispatchEvent(new Event('change'));
    document.querySelector('dialog[open] form').requestSubmit();
   }
   click('dialog[open] .close');await wait(40);click('[data-scene="palace"]');await wait(200);
   let saved=JSON.parse(localStorage.getItem('emperor.save.v1'));
   if(saved.domestic.provinces.filter(p=>p.countryId===saved.domestic.playerCountryId).some(p=>p.construction.project?.building!=='markets'))throw Error('市场未全部开工');
   if(!document.querySelector('.scene.palace')||saved.phase!==1)throw Error('退朝失败');
   click('[data-sleep-next-turn]');click('[data-confirm-sleep]');await wait(60);
   while(document.querySelector('dialog[open] [data-ack-auspice]')){click('[data-ack-auspice]');await wait(30);}
   click('[data-scene="court"]');click('[data-scene="palace"]');await wait(100);
   if(!document.querySelector('[data-begin-exam]'))throw Error('下旬退朝未呈报制举');
   const beforeMisclick=localStorage.getItem('emperor.save.v1');
   const notice=document.querySelector('.exam-notice');
   notice.click();await wait(40);
   if(!notice.open||localStorage.getItem('emperor.save.v1')!==beforeMisclick)throw Error('误点通知空白处关闭或消耗了制举');
   // A backdrop click targets the dialog too; exercise the same event path.
   notice.dispatchEvent(new MouseEvent('click',{bubbles:true,clientX:1,clientY:1}));await wait(40);
   if(!notice.open||localStorage.getItem('emperor.save.v1')!==beforeMisclick)throw Error('误点框外关闭或消耗了制举');
   click('[data-begin-exam]');await wait(100);if(!document.querySelector('.exam-session[open]'))throw Error('制举未打开');
   click('[data-picker-cancel]');await wait(100);
   if(document.querySelector('dialog[open]'))throw Error('制举结束后弹窗未关闭');
   return '安排制举、十城市场、退朝、下旬制举及取消通过';
  })()`);
  if(errors.length)throw Error(errors.join('\n'));
  console.log(result);app.exit(0);
 }catch(error){console.error(error);app.exit(1);}
});
