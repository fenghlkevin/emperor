const {app,BrowserWindow}=require('electron');
const path=require('node:path');
app.setPath('userData',`/private/tmp/emperor-labor-reserve-${process.pid}`);
app.whenReady().then(async()=>{
 const w=new BrowserWindow({show:false,webPreferences:{sandbox:true,contextIsolation:true,nodeIntegration:false}});
 try{
 await w.loadFile(path.join(__dirname,'../index.html'));
 console.log(await w.webContents.executeJavaScript(`(async()=>{
 const {createPlayableGame}=await import('./src/game.mjs');
 const {executeIndustry}=await import('./src/industry.mjs');
 const {openWorksMinister}=await import('./src/works-minister-ui.mjs');
 const s=createPlayableGame('劳役验收');
 const d=openWorksMinister(s,document.body,x=>x,()=>{},{kind:'levy-militia',provinceId:'jiangnan'});
 if([...d.querySelectorAll('[data-rate]')].some(x=>Number(x.value)!==50))throw Error('默认抽调比例错误');
 if(!d.querySelector('.wm-stats').textContent.includes('本次最多可征'))throw Error('缺少征调容量');
 const amount=d.querySelector('[data-value="amount"]');
 amount.value='0';amount.dispatchEvent(new Event('input',{bubbles:true}));
 if(!d.querySelector('[data-error]').textContent.includes('请填写'))throw Error('零人数提示错误');
 for(const rate of d.querySelectorAll('[data-rate]')){rate.value='50';rate.dispatchEvent(new Event('input',{bubbles:true}));}
 amount.value='10000';amount.dispatchEvent(new Event('input',{bubbles:true}));
 if(d.querySelector('[data-execute]').disabled)throw Error(d.querySelector('[data-error]').textContent);
 if(!d.querySelector('[data-preview]').textContent.includes('抽调'))throw Error('缺少抽调来源');
 d.close();
 const recruited=executeIndustry(s,{id:s.domestic.industryActions.nextId,kind:'levy-militia',provinceId:'jiangnan',amount:6000}).state;
 const b=openWorksMinister(recruited,document.body,x=>x,()=>{},{kind:'buildings',provinceId:'jiangnan'});
 if(!b.querySelector('[data-preview]').textContent.includes('1,000'))throw Error('寺庙用工规模未更新');
 b.querySelector('[data-building="palaces"]').click();
 if(b.querySelector('[data-execute]').disabled||!b.querySelector('[data-preview]').textContent.includes('5,000'))throw Error('行宫报价错误');
 b.close();return 'PASS: local draft sources, dynamic capacity, zero guidance, temple and palace scale';
 })()`));app.exit(0);
 }catch(e){console.error(e);app.exit(1);}
});
