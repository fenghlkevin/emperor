const {app,BrowserWindow}=require('electron');
const fs=require('node:fs'),path=require('node:path');
app.setPath('userData',`/private/tmp/emperor-terrain-${process.pid}`);
app.whenReady().then(async()=>{
 const timer=setTimeout(()=>{console.error('地形桌面验收超时');app.exit(1);},60000);
 const w=new BrowserWindow({show:false,width:1440,height:1000,webPreferences:{contextIsolation:true,sandbox:true,nodeIntegration:false}});
 let step=0;const run=code=>w.webContents.executeJavaScript(`(async()=>{try{${code}}catch(e){throw Error('验收步骤 ${++step}: '+e.stack);}})()`);
 const shot=async name=>{await run('await document.fonts.ready;await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));');fs.writeFileSync(`/private/tmp/emperor-terrain-${name}.png`,(await w.webContents.capturePage()).toPNG());};
 try{
  await w.loadFile(path.join(__dirname,'../index.html'));
  await run(`const {newGame}=await import('./src/game.mjs'),{initializeResourceEconomy}=await import('./src/province-resources.mjs'),{openConstruction}=await import('./src/construction-ui.mjs'),{persistCandidate}=await import('./src/persistence.mjs');
   window.s=newGame('地形验收');initializeResourceEconomy(s.domestic);s.domestic.countries[0].fiscal.treasury=s.stats.treasury=100000;
   window.city=s.domestic.provinces.find(p=>p.id==='hedong');const {industryLandLimit}=await import('./src/terrain-economy.mjs');city.economy.agriculture.developedArea=industryLandLimit(city,'agriculture');
   window.openTerrain=tab=>openConstruction(s,document.body,next=>{persistCandidate(s,next,localStorage);window.s=next;window.city=s.domestic.provinces.find(p=>p.id==='hedong');},()=>{},{tab,provinceId:'hedong'});
   openTerrain('develop');const note=document.querySelector('[data-terrain-economy]').textContent;
   for(const text of ['高山型','工业产出＋20%','最终土地上限','农业用地≤20%','工业用地≤65%'])if(!note.includes(text))throw Error('地形提示缺失：'+text);
   if(!document.querySelector('[data-industry-execute]').disabled||!document.querySelector('[data-industry-status]').textContent.includes('地形用地上限'))throw Error('有空地时仍应拦截满额农业');
   const sel=document.querySelector('[data-industry-sector]');sel.value='industry';sel.dispatchEvent(new Event('change'));if(document.querySelector('[data-industry-execute]').disabled)throw Error('特色工业开发被错误拦截');
   window.before=structuredClone(s);`);
  await shot('mountain');w.setContentSize(900,680);await new Promise(r=>setTimeout(r,100));
  await run(`const b=document.querySelector('[data-industry-execute]').getBoundingClientRect(),d=document.querySelector('dialog[open]').getBoundingClientRect();if(b.bottom>innerHeight||b.right>innerWidth||b.top<0||d.width>innerWidth)throw Error('小窗口确认操作越界');document.querySelector('[data-terrain-economy]').scrollIntoView({block:'start'});`);
  await shot('small');
  await run(`document.querySelector('[data-industry-execute]').click();if(s.stats.treasury!==before.stats.treasury-1000||city.development.project.industry!=='industry')throw Error('特色产业开发未正确扣款保存');await new Promise(r=>setTimeout(r,0));openTerrain('expand');if(!document.querySelector('[data-industry-preview]').textContent.includes('扩建后用地上限'))throw Error('缺少扩城产业上限预览');document.querySelector('[data-industry-execute]').click();if(city.cityCapacity.land!==before.domestic.provinces.find(p=>p.id==='hedong').cityCapacity.land+5000)throw Error('扩城土地增量错误');await new Promise(r=>setTimeout(r,0));const {validateSave}=await import('./src/game.mjs');window.s=validateSave(JSON.parse(localStorage.getItem('emperor.save.v1')));`);
  await run(`const {openDomestic}=await import('./src/domestic-ui.mjs');openDomestic(s,document.body);document.querySelector('[data-home]').click();document.querySelector('[data-province="hedong"]').dispatchEvent(new MouseEvent('click',{bubbles:true}));document.querySelector('[data-province-geography]')?.click();if(!document.querySelector('[data-terrain-economy]')?.textContent.includes('工业产出＋20%'))throw Error('户部州县细查缺少地形特色');if(!document.querySelector('[data-geography-description]')?.textContent.includes('太行'))throw Error('地貌依据缺失');if(!document.querySelector('.province-geography-help button'))throw Error('地理说明弹窗没有打开');document.querySelector('.province-geography-help button').click();await new Promise(r=>setTimeout(r,0));document.querySelector('dialog[open] .close').click();await new Promise(r=>setTimeout(r,0));openDomestic(s,document.body,{mode:'works'});document.querySelector('[data-home]').click();document.querySelector('[data-province="hedong"]').dispatchEvent(new MouseEvent('click',{bubbles:true}));if(!document.querySelector('[data-works-page="economy"]'))throw Error('工部没有选中州县：'+document.querySelector('dialog[open]')?.textContent.slice(-600));document.querySelector('[data-works-page="economy"]').click();if(!document.querySelector('[data-terrain-economy]'))throw Error('工部经济细查缺少地形上限');if(/NaN|undefined/.test(document.querySelector('dialog[open]').textContent))throw Error('页面出现无效数据');`);
  await shot('works');console.log('地形桌面验收通过：现有地形、特色产出、产业上限拦截、开发保存、扩城上限预览、重载、户部/工部细查及900×680布局。');clearTimeout(timer);app.exit(0);
 }catch(e){console.error(e);fs.writeFileSync('/private/tmp/emperor-terrain-failure.png',(await w.webContents.capturePage()).toPNG());clearTimeout(timer);app.exit(1);}
});
