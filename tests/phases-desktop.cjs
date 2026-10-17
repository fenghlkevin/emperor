const {app,BrowserWindow}=require('electron');
const path=require('node:path');
app.setPath('userData','/private/tmp/emperor-phases-profile');
app.whenReady().then(async()=>{
 const w=new BrowserWindow({show:false,width:1440,height:1000,webPreferences:{contextIsolation:true,nodeIntegration:false,sandbox:true}});
 try{
 await w.loadFile(path.join(__dirname,'../index.html'));
 console.log(await w.webContents.executeJavaScript(`(async()=>{
 const pause=()=>new Promise(r=>setTimeout(r,80));
 const click=q=>{const e=document.querySelector(q);if(!e)throw Error('Missing '+q);e.click();};
 const read=()=>JSON.parse(localStorage.getItem('emperor.save.v1'));
 const check=(v,m)=>{if(!v)throw Error(m);};
 localStorage.clear();document.querySelector('#name').value='阶段帝';document.querySelector('#create').requestSubmit();
 click('[data-entry="study"]');check(document.querySelector('dialog').textContent.includes('早朝'),'morning restriction');click('dialog .close');await pause();
 click('[data-scene="court"]');check(document.querySelector('.court-workspace'),'court entry');
 click('[data-entry="justice-minister"]');click('dialog .close');await pause();check(read().phase===0,'audience must not advance phase');
 click('[data-scene="palace"]');check(read().phase===1,'court exit');
 click('[data-entry="study"]');click('[data-activity]');click('[data-activity]');check(read().phase===1,'room actions must not advance phase');check(read().stats.energy===8,'action energy');click('dialog .close');await pause();check(read().phase===2,'room exit');
 click('[data-quick-sleep]');click('[data-activity]');check(read().stats.energy===10,'daytime sleep restores');click('dialog .close');await pause();check(read().phase===3&&read().turn===1,'daytime sleep phase');
 click('[data-entry="study"]');for(let i=0;i<10;i++)click('[data-activity]');await pause();check(read().turn===2&&read().phase===0,'exhaustion next turn');check(read().stats.life===2156,'exhaustion life');check(!document.querySelector('dialog'),'exhaustion closes room');
 click('[data-scene="court"]');click('[data-scene="palace"]');
 for(let i=0;i<4;i++){click('[data-quick-sleep]');click('[data-activity]');click('dialog .close');await pause();}
 check(read().phase===5,'night reached');click('[data-entry="study"]');check(document.querySelector('dialog').textContent.includes('夜晚只能'),'night blocked');click('dialog .close');await pause();
 click('[data-quick-harem]');click('[data-company]');click('dialog .close');await pause();check(read().turn===3&&read().phase===0,'night next turn');
 return '六阶段、朝堂多事务、离屋推进、白天休息、晕倒扣寿元、夜晚限制通过';
 })()`));app.exit(0);
 }catch(e){console.error(e);app.exit(1);}
});
