const {app,BrowserWindow}=require('electron'),fs=require('node:fs'),path=require('node:path');
app.setPath('userData',`/private/tmp/emperor-central-offices-${process.pid}`);
app.whenReady().then(async()=>{
 const w=new BrowserWindow({show:false,width:1440,height:1000,webPreferences:{sandbox:true,contextIsolation:true,nodeIntegration:false,backgroundThrottling:false}}),timer=setTimeout(()=>app.exit(1),90000);
 const run=c=>w.webContents.executeJavaScript(`(async()=>{${c}})()`);
 const shot=async name=>{await run(`await document.fonts.ready;await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));`);fs.writeFileSync(`/private/tmp/emperor-central-offices-${name}.png`,(await w.webContents.capturePage()).toPNG());};
 try{
  await w.loadFile(path.join(__dirname,'../index.html'));
  await run(`const {newGame}=await import('./src/game.mjs'),{initializeResourceEconomy}=await import('./src/province-resources.mjs'),{enableOfficialProduction}=await import('./src/official-production.mjs');window.s=newGame('中央职效');initializeResourceEconomy(s.domestic);enableOfficialProduction(s.domestic,1);for(const id of ['personnel-minister','works-deputy','revenue-deputy','war-minister','war-deputy','central-general']){const o=s.domestic.justice.officials.find(o=>o.id===id);Object.assign(o,{politics:100,intelligence:100,experience:100,martial:100,leadership:100,integrity:100});}window.openPersonnel=(await import('./src/court-personnel-ui.mjs')).openCourtPersonnel;openPersonnel(s,document.body,()=>{},()=>{});document.querySelector('[data-personnel-office=personnel-minister]').click();document.querySelector('[data-personnel-person=central-general]').click();if(!document.querySelector('[data-office-ability]').textContent.includes('文职：智力、政务、经验取均值'))throw Error('文职岗位公式未显示');if(!document.querySelector('[data-office-effect]').textContent.includes('额外2名'))throw Error('任职影响未显示');`);
  await shot('appointment');
  w.setSize(390,844);await shot('appointment-mobile');await run(`document.querySelector('[data-office-effect]').scrollIntoView({block:'center'});`);await shot('appointment-mobile-effects');
  await run(`const d=document.querySelector('.court-personnel');if(d.getBoundingClientRect().width>window.innerWidth+1)throw Error('窄屏弹窗超宽');d.close();`);
  w.setSize(1440,1000);
  await run(`const {openFoodRelief}=await import('./src/food-relief-ui.mjs');window.committed=null;openFoodRelief(s,document.body,next=>{window.committed=next;return next;},()=>{});const input=document.querySelector('[data-food-amount]');input.value='1000';input.dispatchEvent(new Event('input'));const text=document.querySelector('[data-food-preview]').textContent;if(!text.includes('优惠160两')||!text.includes('实付1,840两'))throw Error('购粮预览费用不符：'+text);`);
  await shot('procurement');
  await run(`document.querySelector('[data-food-execute]').click();if(!committed||committed.domestic.countries[0].fiscal.treasury!==8160)throw Error('UI实际采购未使用优惠');(await import('./src/game.mjs')).validateSave(committed);const {openConstruction}=await import('./src/construction-ui.mjs');openConstruction(s,document.body,()=>{},()=>{});if(!document.querySelector('dialog[open]').textContent.includes('调度后需90人'))throw Error('民夫减免未显示');`);
  await shot('labor');
  await run(`document.querySelector('dialog[open]').close();const {openNational}=await import('./src/national-ui.mjs');openNational(s,document.body,()=>{},()=>{});const text=document.querySelector('dialog[open]').textContent;for(const name of ['宰相','吏部尚书','户部侍郎','工部侍郎','兵部尚书','兵部侍郎','礼部侍郎'])if(!text.includes(name))throw Error('国政缺少职位：'+name);`);
  clearTimeout(timer);console.log('中央官职界面验收通过：任职效果对比、390窄屏、购粮优惠预览及实际扣款、民夫减免、全部中央职位说明。');app.exit(0);
 }catch(e){console.error(e);await shot('failure').catch(()=>{});clearTimeout(timer);app.exit(1);}
});
