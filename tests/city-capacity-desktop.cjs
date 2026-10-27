const {app,BrowserWindow}=require('electron');
const path=require('node:path'),fs=require('node:fs');
app.setPath('userData',`/private/tmp/emperor-city-capacity-${process.pid}`);
app.whenReady().then(async()=>{
 const watchdog=setTimeout(()=>{console.error('城州容量桌面验收超时');app.exit(1);},60000);
 const w=new BrowserWindow({show:false,width:1440,height:1000,webPreferences:{sandbox:true,contextIsolation:true,nodeIntegration:false}}),errors=[];
 w.webContents.on('console-message',e=>{if(e.level==='error'&&!e.message.startsWith('Refused to apply inline style'))errors.push(e.message);});
 const run=code=>w.webContents.executeJavaScript(`(async()=>{${code}})()`);
 const pause=()=>new Promise(r=>setTimeout(r,80));
 const shot=async name=>{await pause();fs.writeFileSync(`/private/tmp/emperor-city-${name}.png`,(await w.webContents.capturePage()).toPNG());};
 try{
 await w.loadFile(path.join(__dirname,'../index.html'));
 await run(`
 const {newGame}=await import('./src/game.mjs'),{initializeResourceEconomy}=await import('./src/province-resources.mjs'),{openConstruction}=await import('./src/construction-ui.mjs'),{persistCandidate}=await import('./src/persistence.mjs');
 window.cityState=newGame('城州验收帝');initializeResourceEconomy(cityState.domestic);cityState.scene='court';
 const p=cityState.domestic.provinces[0];const {industryLandLimit}=await import('./src/terrain-economy.mjs');let free=p.cityCapacity.land-Object.values(p.economy).reduce((n,e)=>n+e.developedArea,0);for(const k of ['pastoral','industry','commerce']){const n=Math.min(free,industryLandLimit(p,k)-p.economy[k].developedArea);p.economy[k].developedArea+=n;free-=n;}if(free)throw Error('满地测试设置失败');p.population.total=Math.floor(p.cityCapacity.population*1.2);
 window.openCity=tab=>openConstruction(cityState,document.body,candidate=>{persistCandidate(cityState,candidate,localStorage);window.cityState=candidate;},()=>{},{tab,provinceId:p.id});
 openCity('develop');
 if(!document.querySelector('[data-industry-execute]').disabled||!document.querySelector('[data-industry-status]').textContent.includes('转用'))throw Error('满地未提示转用');
 if(!document.querySelector('[data-city-capacity]').textContent.includes('超载上限'))throw Error('容量信息缺失');
 document.querySelector('[data-works-action="convert"]').click();
 const sector=document.querySelector('[data-industry-sector]');sector.value='agriculture';sector.dispatchEvent(new Event('change'));
 const from=document.querySelector('[data-industry-from]');from.value='commerce';from.dispatchEvent(new Event('change'));
 const area=document.querySelector('[data-industry-area]');area.value=137;area.dispatchEvent(new Event('input'));
 if(document.querySelector('[data-industry-execute]').disabled)throw Error('满地无法转用');
 if(!document.querySelector('[data-industry-preview]').textContent.includes('第3旬'))throw Error('转用时点未显示');
 window.beforeCity=JSON.stringify(cityState);
 `);
 await shot('conversion');w.setSize(900,680);await pause();
 await run(`const r=document.querySelector('[data-industry-execute]').getBoundingClientRect();if(r.bottom>innerHeight||r.right>innerWidth||r.top<0)throw Error('小窗口确认按钮越界');if(document.querySelector('.industry-dialog').getBoundingClientRect().width>innerWidth)throw Error('小窗口对话框越界');`);
 await shot('small-conversion');
 await run(`window.citySetItem=Storage.prototype.setItem;Storage.prototype.setItem=function(){throw Error('quota');};document.querySelector('[data-industry-execute]').click();if(!document.querySelector('[data-industry-status]').textContent.includes('保存失败')||JSON.stringify(cityState)!==beforeCity)throw Error('转用失败未回滚');Storage.prototype.setItem=citySetItem;document.querySelector('[data-industry-execute]').click();if(cityState.domestic.provinces[0].development.project.fromIndustry!=='commerce')throw Error('转用未保存');`);
 await pause();
 await run(`openCity('expand');window.preExpand=structuredClone(cityState);if(!document.querySelector('[data-industry-preview]').textContent.includes('200,000 → 210,000'))throw Error('扩城容量预览错误');`);
 await shot('small-expansion');
 await run(`document.querySelector('[data-industry-execute]').click();const p=cityState.domestic.provinces[0],old=preExpand.domestic.provinces[0];if(p.population.total!==old.population.total||p.cityCapacity.population!==old.cityCapacity.population+10000||cityState.stats.treasury!==preExpand.stats.treasury-5000)throw Error('扩城结果错误');const {validateSave}=await import('./src/game.mjs');cityState=validateSave(JSON.parse(localStorage.getItem('emperor.save.v1')));if(cityState.domestic.provinces[0].cityCapacity.population!==210000)throw Error('容量重载错误');const {settleIndustry}=await import('./src/industry.mjs');cityState.turn=2;settleIndustry(cityState.domestic,2);validateSave(cityState);openCity('convert');`);
 await pause();await run(`document.querySelector('.industry-dialog .close').click();`);await pause();
 w.setSize(1440,1000);

 if(errors.length)throw Error(errors.join('\n'));
 console.log('城州容量桌面验收通过：满地开发拦截、转用预览及保存、失败回滚、扩城、容量重载、900×680布局。截图 /private/tmp/emperor-city-*.png');clearTimeout(watchdog);app.exit(0);
 }catch(e){console.error(e);clearTimeout(watchdog);app.exit(1);}
});
