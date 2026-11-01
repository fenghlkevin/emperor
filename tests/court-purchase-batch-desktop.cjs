const {app,BrowserWindow}=require('electron');
const path=require('node:path'),fs=require('node:fs');
app.setPath('userData',`/private/tmp/emperor-batch-purchase-${process.pid}`);
app.whenReady().then(async()=>{
 const w=new BrowserWindow({show:false,width:1440,height:1000,webPreferences:{sandbox:true,contextIsolation:true,nodeIntegration:false}});
 const timer=setTimeout(()=>app.exit(1),60000);
 try{
  await w.loadFile(path.join(__dirname,'../index.html'));
  await w.webContents.executeJavaScript(`(async()=>{
   const {newGame}=await import('./src/game.mjs');
   const {executeKitCommand}=await import('./src/troop-kit-world.mjs');
   const {openCourtGarrison}=await import('./src/court-garrison-ui.mjs');
   document.querySelector('.opening-skip')?.click();
   window.batchState=executeKitCommand(newGame('合并采购'),{kind:'recruit',sourceId:'central',amount:100,id:1}).state;
   window.batchBefore=structuredClone(batchState);
   window.openBatch=()=>openCourtGarrison(batchState,document.body,s=>{window.batchState=s;return s},()=>{},{kind:'purchase'});
   openBatch();
   const fill=(id,n)=>{const input=document.querySelector('[data-purchase-kit="'+id+'"]');input.value=n;input.dispatchEvent(new Event('input',{bubbles:true}));};
   if(document.querySelectorAll('[data-purchase-kit]').length!==9)throw Error('未展示全部兵种');
   if(!document.querySelector('[data-purchase-kit=camel]').disabled)throw Error('产地未限制');
   if(!document.querySelector('[data-garrison-review]').disabled)throw Error('空单可提交');
   fill('infantry',30);document.querySelector('[data-purchase-fill=spears]').click();
   if(document.querySelector('[data-purchase-kit=spears]').value!=='70')throw Error('未按整单剩余缺口补齐');
   if(!document.querySelector('[data-purchase-summary]').textContent.includes('1,060'))throw Error('整单报价错误');
   document.querySelector('[data-garrison-review]').click();document.querySelector('[data-garrison-edit]').click();
   if(document.querySelector('[data-purchase-kit=infantry]').value!=='30')throw Error('返回丢失数量');
   if(JSON.stringify(batchState)!==JSON.stringify(batchBefore))throw Error('预览改动存档');
   fill('infantry',9999999);if(!document.querySelector('[data-garrison-review]').disabled)throw Error('超预算可提交');
   fill('infantry',30);
  })()`);
  await new Promise(resolve=>setTimeout(resolve,500));
  fs.writeFileSync('/private/tmp/emperor-batch-purchase.png',(await w.webContents.capturePage()).toPNG());
  await w.webContents.executeJavaScript(`document.querySelector('[data-garrison-review]').click();document.querySelector('[data-garrison-seal]').click();if(batchState.stats.treasury!==batchBefore.stats.treasury-1060||batchState.domestic.troopKits.depots.central.stock.spears!==batchBefore.domestic.troopKits.depots.central.stock.spears+70||batchState.domestic.troopKits.depots.central.stock.infantry!==batchBefore.domestic.troopKits.depots.central.stock.infantry+30||batchState.domestic.troopKits.nextId!==batchBefore.domestic.troopKits.nextId+1)throw Error('合并采购账实不符');openBatch();document.querySelector('[data-purchase-fill=infantry]').click();if(document.querySelector('[data-purchase-kit=infantry]').value!=='0')throw Error('重复补齐导致多购');document.querySelector('[data-purchase-clear]').click();if(!document.querySelector('[data-garrison-review]').disabled)throw Error('清空未生效');`);
  console.log('合并采购通过：全兵种、产地、缺口补齐、实际报价、超预算、草稿返回、统一扣款入库、重复补齐与清空。');
  clearTimeout(timer);app.exit(0);
 }catch(e){console.error(e);clearTimeout(timer);app.exit(1);}
});
