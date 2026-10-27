const {app,BrowserWindow}=require('electron');
const path=require('node:path');
const fs=require('node:fs');
app.setPath('userData','/private/tmp/emperor-opening-test');
app.whenReady().then(async()=>{
 const w=new BrowserWindow({show:true,width:1440,height:900,webPreferences:{sandbox:true}});
 w.webContents.on('console-message',(_e,...args)=>console.log('RENDERER',...args));
 const errors=[];w.webContents.on('page-error',e=>errors.push(e.message));
 try{
  await w.loadFile(path.join(__dirname,'../index.html'));
  const check=js=>w.webContents.executeJavaScript(js);
  await check(`Promise.all([...document.querySelectorAll('.opening-stage img')].map(img=>img.decode()))`);
  await check(`if(!document.querySelector('.opening-cinematic[open]'))throw Error('未自动播放');document.querySelector('.opening-skip').click();if(document.querySelector('.opening-cinematic'))throw Error('跳过失败');document.querySelector('#opening-replay').click();if(!document.querySelector('.opening-cinematic[open]'))throw Error('重播失败');if(document.querySelectorAll('.opening-courtier').length!==8)throw Error('百官层缺失');`);
  for(const [second,name,phase] of [[2,'palace','0'],[10,'gate','1'],[15,'court','2'],[21,'edict','3'],[27.5,'title','4']]){
    await check(`new Promise(resolve=>{const poll=()=>{const f=document.querySelector('.opening-cinematic');if(!f)throw Error('提前结束');if(Number(f.dataset.time)>=${second})resolve();else setTimeout(poll,30)};poll()})`);
    console.log('checkpoint',name);
    await check(`if(document.querySelector('.opening-cinematic').dataset.phase!=='${phase}')throw Error('时间线错误');`);
    fs.writeFileSync(`/private/tmp/emperor-opening-${name}.png`,(await w.webContents.capturePage()).toPNG());
    if(name==='court')await check(`if(getComputedStyle(document.querySelector('.courtier-upper')).transform==='none')throw Error('百官未俯身');document.querySelector('.opening-audio').click()`);
  }
  await new Promise(r=>setTimeout(r,3000));
  await check(`if(document.querySelector('.opening-cinematic'))throw Error('30秒未结束');document.querySelector('#new-dynasty').click();if(!document.querySelector('#create'))throw Error('菜单未恢复');document.querySelector('dialog[open]').close();document.querySelector('#opening-replay').click();document.querySelector('.opening-cinematic').dispatchEvent(new Event('cancel',{cancelable:true}));if(document.querySelector('.opening-cinematic'))throw Error('Esc未结束');`);
  if(errors.length)throw Error(errors.join('\n'));
  console.log('PASS: 图片资源、自动播放、跳过重播、5段时间线、百官俯身、配乐、30秒结束、菜单和Esc');
  app.exit(0);
 }catch(e){console.error(e);app.exit(1);}
});
