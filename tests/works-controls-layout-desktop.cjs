const {app,BrowserWindow}=require('electron');
const path=require('node:path'),fs=require('node:fs');
app.setPath('userData',`/private/tmp/emperor-works-controls-${process.pid}`);
app.whenReady().then(async()=>{
 const w=new BrowserWindow({show:true,width:1440,height:1000,webPreferences:{sandbox:true,contextIsolation:true,nodeIntegration:false,backgroundThrottling:false}});
 const run=code=>w.webContents.executeJavaScript(`(async()=>{${code}})()`);
 try{
 await w.loadFile(path.join(__dirname,'../index.html'));
 await run(`document.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true}));const {createPlayableGame}=await import('./src/game.mjs');window.state=createPlayableGame('控件验收');state.stats.treasury=100000;for(const p of state.domestic.provinces)p.disaster=null;window.openWorks=(await import('./src/works-minister-ui.mjs')).openWorksMinister;`);
 for(const [width,height] of [[1440,1000],[1100,800],[900,680]]){
 w.setSize(width,height);await new Promise(r=>setTimeout(r,150));
 for(const kind of ['buildings','develop','expand','levy-militia','release-militia','special','schedule']){
 await run(`window.d=openWorks(state,document.body,s=>s,()=>{},{kind:'${kind}'});`);
 await new Promise(r=>setTimeout(r,80));
 console.log(width,height,kind,await run(`
 if(d.querySelector('.wm-fields select'))throw Error('操作表单仍有下拉框');
 for(const n of d.querySelectorAll('.wm-fields input[type=number]'))if(!n.nextElementSibling?.classList.contains('quantity-controls'))throw Error('数字缺少滑条');
 const command=d.querySelector('.wm-command'),footer=d.querySelector('.wm-order'),detail=d.querySelector('.wm-city-detail'),preview=d.querySelector('.wm-preview');
 const b=command.getBoundingClientRect(),f=footer.getBoundingClientRect(),t=detail.getBoundingClientRect(),v=preview.getBoundingClientRect();
 if(f.bottom>b.bottom+2||t.bottom>f.top+2||v.bottom>f.top+2)throw Error('内容重叠或底部越界');
 if(preview.scrollHeight>preview.clientHeight+2)throw Error('预览需要滚动 '+preview.scrollHeight+'/'+preview.clientHeight);
 if('${kind}'==='develop'){
 d.querySelector('[data-choice=industry][data-option=industry]').click();
 if(d.querySelector('[data-choice=industry][data-option=industry]').getAttribute('aria-pressed')!=='true')throw Error('产业选择未更新');
 const n=d.querySelector('[data-value=area]'),bar=n.nextElementSibling;bar.querySelector('button').click();if(n.value!==n.min)throw Error('Min失败');bar.querySelector('button:last-child').click();if(n.value!==n.max)throw Error('Max失败');
 }
 if('${kind}'==='levy-militia'){
 for(const n of d.querySelectorAll('[data-rate]')){n.nextElementSibling.querySelector('button:last-child').click();if(n.value!=='50')throw Error('比例Max失败');}
 const n=d.querySelector('[data-value=amount]');n.nextElementSibling.querySelector('button:last-child').click();if(Number(n.value)<=0||d.querySelector('[data-execute]').disabled)throw Error('抽调人数上限未刷新');
 }
 return 'PASS';`));
 await run('await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)))');await new Promise(r=>setTimeout(r,180));
 if(['develop','levy-militia','schedule'].includes(kind))fs.writeFileSync(`/private/tmp/works-controls-${width}-${kind}.png`,(await w.webContents.capturePage()).toPNG());
 await run('d.close()');
 }
 }
 app.exit(0);
 }catch(e){console.error(e);fs.writeFileSync('/private/tmp/works-controls-failure.png',(await w.webContents.capturePage()).toPNG());app.exit(1);}
});
