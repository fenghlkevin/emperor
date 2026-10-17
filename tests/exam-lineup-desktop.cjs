const {app,BrowserWindow}=require('electron');
const path=require('node:path');
const fs=require('node:fs');
app.setPath('userData','/private/tmp/emperor-exam-lineup-test');
app.whenReady().then(async()=>{
 const w=new BrowserWindow({show:false,width:1440,height:1000,webPreferences:{contextIsolation:true,nodeIntegration:false}});
 try{
 await w.loadFile(path.join(__dirname,'../index.html'));
 await w.webContents.executeJavaScript(`(async()=>{
 const {openExamSession}=await import('./src/exam-session-ui.mjs');
 const people=Array.from({length:15},(_,i)=>({id:'random-1-'+i,name:i<6?['都俊正','和元山','孙正','孙膑','康有为','温勇毅'][i]:'候选'+i,role:i%2?'文职':'武将',politics:50+i,leadership:60,intelligence:70,martial:40,integrity:80,loyalty:75,age:30,experience:20,generated:true}));
 window.examResult={selected:null,closed:0};
 window.examFixture=()=>openExamSession({domestic:{personnel:{candidates:people}}},document.body,id=>examResult.selected=id,()=>examResult.closed++);
 const d=examFixture();
 const assert=(x,m)=>{if(!x)throw Error(m)};
 assert(d.querySelectorAll('[data-exam-person]').length===6,'六人横排');assert(d.querySelector('.exam-roster').hidden,'名册默认隐藏');
 d.querySelector('[data-exam-preview]').click();assert(d.querySelectorAll('[data-exam-check]:checked').length===0,'点击立绘不选择');assert(d.querySelector('[data-exam-confirm]').disabled,'查看才干不能启用录用');
 d.querySelector('[data-exam-choose]').click();assert(d.querySelectorAll('[data-exam-check]:checked').length===1,'点击姓名选择');
 d.querySelector('[data-exam-preview]').click();assert(d.querySelectorAll('[data-exam-check]:checked').length===1,'再点立绘不取消选择');
 d.querySelector('[data-exam-choose]').click();assert(d.querySelectorAll('[data-exam-check]:checked').length===0,'再次点击姓名取消');
 d.querySelector('[data-exam-choose]').dispatchEvent(new KeyboardEvent('keydown',{key:'Enter',bubbles:true}));
 for(const selector of ['.exam-profile-avatar','.exam-profile-name']){d.querySelector(selector).click();const profile=document.querySelector('.historical-profile-dialog');assert(profile&&profile.textContent.includes('都俊正'),'头像姓名应打开人物详情');profile.querySelector('.close').click();profile.remove();assert(d.querySelectorAll('[data-exam-check]:checked').length===1,'查看详情不改变选择');}
 d.querySelector('[data-exam-locate]').click();const profile=document.querySelector('.historical-profile-dialog');assert(profile,'名册头像姓名应打开详情');profile.querySelector('.close').click();profile.remove();
 d.querySelector('[data-picker-next]').click();assert(d.querySelector('[data-exam-selected]').textContent.includes('已选 1 人'),'翻页保留选择');
 d.querySelector('[data-exam-roster]').click();assert(d.querySelector('[data-exam-check]:checked').dataset.examCheck==='random-1-0','同步勾选');
 d.querySelector('[data-exam-check="random-1-14"]').click();assert(d.querySelector('[data-exam-person].is-selected').dataset.examPerson==='random-1-14','名册跳转第三页');
 assert(d.querySelectorAll('[data-exam-check]:checked').length===2,'跨页多人勾选');const selectedButton=d.querySelector('[data-exam-person].is-selected');selectedButton.focus();assert(getComputedStyle(selectedButton).backgroundColor==='rgba(0, 0, 0, 0)','选中背景必须透明');
 const q=d.querySelector('[data-picker-query]');q.value='候选14';q.dispatchEvent(new Event('input'));assert(d.querySelectorAll('[data-exam-check]').length===1,'搜索');q.value='';q.dispatchEvent(new Event('input'));
 const s=d.querySelector('[data-picker-sort]');s.value='politics';s.dispatchEvent(new Event('change'));assert(d.querySelector('[data-exam-check]').dataset.examCheck==='random-1-14','排序');
 assert(examResult.selected===null,'确认前不录用');d.querySelector('[data-roster-close]').click();assert(d.querySelector('[data-exam-person].is-selected'),'收起保留选择');
 await Promise.all([...d.images??d.querySelectorAll('img')].map(i=>i.decode().catch(()=>{})));
 })()`);
 await w.webContents.executeJavaScript(`document.querySelector('[data-exam-check="random-1-3"]').click();document.querySelector('[data-exam-roster]').click();const sort=document.querySelector('[data-picker-sort]');sort.value='';sort.dispatchEvent(new Event('change'));`);
 await w.webContents.executeJavaScript(`(async()=>{await Promise.all([...document.querySelector('.exam-session').querySelectorAll('img')].map(i=>i.decode().catch(()=>{})));await new Promise(r=>setTimeout(r,150));})()`);
 fs.writeFileSync('/private/tmp/emperor-exam-lineup.png',(await w.webContents.capturePage()).toPNG());
 await w.webContents.executeJavaScript(`document.querySelector('[data-roster-close]').click();`);
 await w.webContents.executeJavaScript(`new Promise(r=>setTimeout(r,150))`);
 fs.writeFileSync('/private/tmp/emperor-exam-lineup-default.png',(await w.webContents.capturePage()).toPNG());
 await w.webContents.executeJavaScript(`document.querySelector('[data-exam-roster]').click();`);
 await w.webContents.executeJavaScript(`document.querySelector('[data-exam-roster]').click();document.querySelector('[data-exam-check="random-1-14"]').click();document.querySelector('[data-roster-close]').click();`);
 for(const size of [[900,680],[390,844]]){w.setSize(...size);await w.webContents.executeJavaScript(`new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)))`);await w.webContents.executeJavaScript(`(()=>{const d=document.querySelector('.exam-session'),r=d.getBoundingClientRect();if(r.right>innerWidth+1||r.bottom>innerHeight+1)throw Error('窗口溢出');})()`);}
 await w.webContents.executeJavaScript(`(async()=>{document.querySelector('[data-exam-confirm]').click();if(examResult.selected!==null)throw Error('圣旨用印前不可录用');const edict=document.querySelector('.exam-edict');if([...edict.querySelectorAll('.edict-names li')].map(n=>n.textContent).join(',')!=='都俊正,孙膑')throw Error('圣旨名单不符');edict.dispatchEvent(new Event('cancel',{cancelable:true}));if(!edict.open)throw Error('圣旨不能被Escape跳过');const seal=edict.querySelector('[data-edict-seal]');if(!seal.textContent.endsWith('用印'))throw Error('用印按钮文字');seal.click();seal.click();if(!edict.classList.contains('is-stamping')||examResult.selected!==null)throw Error('用印动画前不可完成');await new Promise(r=>setTimeout(r,2300));if(JSON.stringify(examResult.selected)!==JSON.stringify(['random-1-0','random-1-3'])||examResult.closed!==0)throw Error('录用回调错误');const d=examFixture();d.querySelector('[data-picker-cancel]').click();if(examResult.closed!==1)throw Error('退出回调错误');})()`);
 console.log('选才桌面验证通过：6人分页、跨页保留、双向同步、搜索排序、确认录用、退出及1440/900/390窗口。');app.exit(0);
 }catch(e){console.error(e);app.exit(1);}
});
