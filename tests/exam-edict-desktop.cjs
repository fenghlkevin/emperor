const {app,BrowserWindow}=require('electron');
const path=require('node:path');
const fs=require('node:fs');
app.setPath('userData','/private/tmp/emperor-edict-test');
app.whenReady().then(async()=>{
 const w=new BrowserWindow({show:false,width:1440,height:1000,webPreferences:{contextIsolation:true}});
 try{
  await w.loadFile(path.join(__dirname,'../index.html'));
  await w.webContents.executeJavaScript(`(async()=>{
   const {openExamSession}=await import('./src/exam-session-ui.mjs');
   window.calls=0;window.edictClosed=0;
   const names=['谭海','龚仲远','葛云','弘致云','丁威','幸毅','孙膑','都俊正','和元山','温勇毅','康有为','李衡','张文远','王安石','沈括'];
   const people=names.map((name,i)=>({id:'edict-'+i,name,role:'文职',generated:true}));
   const d=openExamSession({domestic:{personnel:{candidates:people}}},document.body,ids=>{if(ids.length!==15)throw Error('名单缺失');calls++},()=>edictClosed++);
   for(const p of people)d.querySelector('[data-exam-check="'+p.id+'"]').click();
   d.querySelector('[data-exam-confirm]').click();
   if(d.querySelectorAll('.edict-names li').length!==15||calls)throw Error('圣旨应完整列出15人且尚未录用');
   await document.fonts.load('24px "Imperial ZhenKai"');
   if(!document.fonts.check('24px "Imperial ZhenKai"'))throw Error('圣旨毛笔字体未加载');
   await new Promise(r=>setTimeout(r,200));
  })()`);
  fs.writeFileSync('/private/tmp/emperor-edict-ready.png',(await w.webContents.capturePage()).toPNG());
  w.setSize(390,844);
  await w.webContents.executeJavaScript(`new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)))`);
  await w.webContents.executeJavaScript(`(()=>{const d=document.querySelector('.exam-edict');if(d.scrollWidth>d.clientWidth+1)throw Error('圣旨横向溢出');const b=d.querySelector('[data-edict-seal]');b.scrollIntoView();})()`);
  fs.writeFileSync('/private/tmp/emperor-edict-mobile.png',(await w.webContents.capturePage()).toPNG());
  w.setSize(1440,1000);
  await w.webContents.executeJavaScript(`(()=>{const d=document.querySelector('.exam-edict');d.scrollTop=0;d.querySelector('[data-edict-seal]').click();d.querySelector('[data-edict-seal]').click();})()`);
  await new Promise(r=>setTimeout(r,800));
  fs.writeFileSync('/private/tmp/emperor-edict-stamping.png',(await w.webContents.capturePage()).toPNG());
  await w.webContents.executeJavaScript(`(()=>{if(calls)throw Error('扣章未结束不能录用');const ink=document.querySelector('.edict-seal-mark');if(Number(getComputedStyle(ink).opacity)<.5)throw Error('印记未出现');})()`);
  await new Promise(r=>setTimeout(r,1600));
  await w.webContents.executeJavaScript(`(()=>{if(calls!==1||edictClosed!==0||document.querySelector('.exam-edict'))throw Error('未恰好完成一次录用并关闭');})()`);
  console.log('圣旨验证通过：15人完整名单、窄屏无横向溢出、扣章印记、动画后提交及防重复。');app.exit(0);
 }catch(e){console.error(e);app.exit(1)}
});
