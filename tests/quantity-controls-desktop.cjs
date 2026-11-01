const {app,BrowserWindow}=require('electron'),path=require('node:path'),fs=require('node:fs');
app.setPath('userData',`/private/tmp/emperor-quantity-${process.pid}`);
app.whenReady().then(async()=>{
 const w=new BrowserWindow({show:false,width:1440,height:1000,webPreferences:{sandbox:true,contextIsolation:true,nodeIntegration:false}});
 const timer=setTimeout(()=>app.exit(1),60000);
 const run=code=>w.webContents.executeJavaScript(`(async()=>{${code}})()`);
 try{
 await w.loadFile(path.join(__dirname,'../index.html'));
 await run(`document.querySelector('.opening-skip')?.click();window.fail=m=>{throw Error(m)};window.s=(await import('./src/game.mjs')).newGame('数量检查');window.open=async()=>{window.d=(await import('./src/central-military-transfers-ui.mjs')).openCentralTransfers(s,document.body,()=>{},()=>{});};await open();`);
 await new Promise(r=>setTimeout(r,100));
 await run(`const a=d.querySelector('[data-province=hebei][data-transfer-amount=soldiers]');const b=d.querySelector('[data-province=henan][data-transfer-amount=soldiers]');window.total=Number(a.max);if(!total)fail('缺少动态上限');a.value=total+100;a.dispatchEvent(new Event('input',{bubbles:true}));if(+a.value!==total)fail('手输未限制');if(+b.max!==0)fail('未扣其他州额度');a.nextElementSibling.querySelector('button').click();if(+a.value!==0||+b.max!==total)fail('Min未释放额度');b.nextElementSibling.querySelector('button:last-child').click();if(+b.value!==total||+a.max!==0)fail('Max未共用库存');const zero=d.querySelector('[data-province=hebei][data-transfer-amount=elephant]');if(zero&&+zero.max===0&&!zero.nextElementSibling.querySelector('input').disabled)fail('零库存可拖动');b.nextElementSibling.querySelector('button').click();const r=a.nextElementSibling.querySelector('input');r.value=Math.floor(total/2);r.dispatchEvent(new Event('input',{bubbles:true}));if(+a.value!==Math.floor(total/2))fail('滑条未更新草案');d.querySelector('[data-transfer-row=hebei]').open=true;`);
 await new Promise(r=>setTimeout(r,250));
 fs.writeFileSync('/private/tmp/emperor-quantity-transfer.png',(await w.webContents.capturePage()).toPNG());
 await run(`d.close();d=(await import('./src/court-garrison-ui.mjs')).openCourtGarrison(s,document.body,()=>{},()=>{},{kind:'purchase'});`);
 await new Promise(r=>setTimeout(r,100));
 await run(`const a=d.querySelector('[data-purchase-kit=infantry]');if(!(Number(a.max)>0))fail('采购缺少可负担上限');a.nextElementSibling.querySelector('button:last-child').click();const q=(await import('./src/troop-kit-world.mjs')).quoteKitCommand(s,{kind:'purchase',sourceId:'central',quantities:{infantry:+a.value}});if(!q.canAfford)fail('Max超出国库');a.value=0;a.dispatchEvent(new Event('input',{bubbles:true}));d.close();d=(await import('./src/works-minister-ui.mjs')).openWorksMinister(s,document.body,()=>{},()=>{},{kind:'develop'});`);
 await new Promise(r=>setTimeout(r,100));
 await run(`const a=d.querySelector('[data-value=area]');if(+a.max>500||!a.nextElementSibling.matches('.quantity-controls'))fail('工部控件错误');d.close();`);
 await run(`for(const r of s.domestic.diplomacy){if(r.countryIds.includes(s.domestic.playerCountryId)){r.relation='neutral';r.agreement.exports=1000;r.agreement.imports=1000;}}d=(await import('./src/food-relief-ui.mjs')).openFoodRelief(s,document.body,n=>{window.purchased=n;return n;},()=>{});`);
 await new Promise(r=>setTimeout(r,100));
 await run(`const a=d.querySelector('[data-food-amount]');if(!Number.isFinite(+a.max)||+a.max<=0)fail('购粮上限无效');a.nextElementSibling.querySelector('button:last-child').click();if(d.querySelector('[data-food-execute]').disabled)fail('购粮Max不可支付');d.querySelector('[data-food-execute]').click();d.querySelector('[data-food-execute]').click();if(!window.purchased||purchased.stats.treasury<0)fail('购粮无法执行');d=(await import('./src/revenue-ui.mjs')).openRevenue(s,document.body,()=>{},()=>{},{tab:'subsidy'});`);
 await new Promise(r=>setTimeout(r,100));
 await run(`const all=[...d.querySelectorAll('[data-amount]')];if(all.length<2)fail('补助未打开');all[0].nextElementSibling.querySelector('button:last-child').click();if(+all[1].max>s.stats.treasury-(+all[0].value))fail('补助共享余额错误');d.close();`);

 console.log('数量控件实机通过：手输超限、Min/Max、滑条同步、零库存、多州共享额度、采购支付上限、工部控件、购粮实际保存和补助共享余额。');clearTimeout(timer);app.exit(0);
 }catch(e){console.error(e);clearTimeout(timer);app.exit(1);}
});
