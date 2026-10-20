const {app,BrowserWindow}=require('electron');
const fs=require('node:fs'),path=require('node:path');
app.setPath('userData',`/private/tmp/emperor-province-overview-${process.pid}`);
app.whenReady().then(async()=>{
 const w=new BrowserWindow({show:false,width:1440,height:1000,webPreferences:{sandbox:true,contextIsolation:true,nodeIntegration:false,backgroundThrottling:false}});
 const run=s=>w.webContents.executeJavaScript(`(async()=>{${s}})()`);
 try{
 await w.loadFile(path.join(__dirname,'../index.html'));
 await run(`document.querySelector('#new-dynasty').click();document.querySelector('#name').value='州情验收';document.querySelector('#era-name').value='承平';document.querySelector('#create').requestSubmit();document.querySelector('#domestic').click();document.querySelector('[data-home]').click();document.querySelector('[data-province="jiangnan"]').dispatchEvent(new MouseEvent('click',{bubbles:true}));`);
 for(const [width,height] of [[1440,1000],[1280,800],[980,720],[900,680]]){
 w.setContentSize(width,height);await new Promise(r=>setTimeout(r,200));
 const result=await run(`await document.fonts.ready;const d=document.querySelector('.province-sheet'),info=d.parentElement,footer=d.querySelector('footer'),r=footer.getBoundingClientRect();const sections=[...d.querySelectorAll('.province-columns>section')].map(e=>({height:e.clientHeight,scroll:e.scrollHeight}));return {width:innerWidth,height:innerHeight,info:[info.clientHeight,info.scrollHeight],sheet:[d.clientHeight,d.scrollHeight],footer:r.bottom,sections,text:d.textContent};`);
 console.log(`${width}×${height}: 一屏布局通过检查`);fs.writeFileSync(`/private/tmp/province-overview-${width}.png`,(await w.webContents.capturePage()).toPNG());
 if(result.info[1]>result.info[0]+2||result.sheet[1]>result.sheet[0]+2||result.footer>height||result.sections.some(s=>s.scroll>s.height+2))throw Error('一屏布局溢出 '+width+' '+JSON.stringify(result));
 if(/NaN|undefined|地方现金/.test(result.text))throw Error('无效内容');
 fs.writeFileSync(`/private/tmp/province-overview-${width}.png`,(await w.webContents.capturePage()).toPNG());
 }
 await run(`for(const key of ['stability','security','activity','fitness','defense','loyalty','living','grain','training','population','production']){document.querySelector('[data-indicator="'+key+'"]').click();const d=document.querySelector('.province-help[open]');if(!d?.open||!d.textContent.includes('如何提升'))throw Error('指标说明失败 '+key);d.querySelector('.province-help-done').click();await new Promise(r=>setTimeout(r,10));}document.querySelector('[data-neighbor="1"]').click();if(document.querySelector('.province-sheet h2').textContent==='江南')throw Error('切州失败');document.querySelector('[data-back-country]').click();if(document.querySelector('.province-sheet'))throw Error('返回全国失败');`);
 await run(`document.querySelector('[data-province="jiangnan"]').dispatchEvent(new MouseEvent('click',{bubbles:true}));window.beforePreviewSave=localStorage.getItem('emperor.save.v1');document.querySelector('[data-indicator="living"]').click();document.querySelector('.province-help[open] .province-help-done').click();if(localStorage.getItem('emperor.save.v1')!==beforePreviewSave)throw Error('阅读说明改变存档');document.querySelector('[data-open-industry="allocate"]').click();if(!document.querySelector('[data-industry-form]')&&!document.querySelector('.construction-dialog')){if(!document.querySelector('dialog[open]').textContent.includes('用工'))throw Error('调配入口失败');}`);
 await run(`document.querySelectorAll('dialog[open]').forEach(d=>d.close());await new Promise(r=>setTimeout(r,100));document.querySelector('#domestic').click();document.querySelector('[data-home]').click();document.querySelector('[data-province="jiangnan"]').dispatchEvent(new MouseEvent('click',{bubbles:true}));document.querySelector('[data-open-industry="buildings"]').click();if(!document.querySelector('dialog[open]').textContent.includes('普通营建'))throw Error('建设入口失败');document.querySelectorAll('dialog[open]').forEach(d=>d.close());await new Promise(r=>setTimeout(r,100));document.querySelector('#domestic').click();document.querySelector('[data-home]').click();document.querySelector('[data-province="jiangnan"]').dispatchEvent(new MouseEvent('click',{bubbles:true}));document.querySelector('[data-province-action="subsidy"]').click();if(document.querySelector('.revenue-dialog')?.dataset.revenue!=='subsidy')throw Error('补助入口失败');`);
 console.log('州情总览验收通过：四尺寸无滚动、十一类说明、切州与全国返回。');app.exit(0);
 }catch(e){console.error(e);app.exit(1);}
});
