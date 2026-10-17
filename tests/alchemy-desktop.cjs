const {app,BrowserWindow}=require('electron');
const path=require('node:path'),fs=require('node:fs');
app.setPath('userData','/private/tmp/emperor-alchemy-test');
app.whenReady().then(async()=>{
 const w=new BrowserWindow({show:false,width:1360,height:950,webPreferences:{sandbox:true,contextIsolation:true,nodeIntegration:false}});
 try{
 await w.loadFile(path.join(__dirname,'../index.html'));
 console.log(await w.webContents.executeJavaScript(`(async()=>{
 const {newGame,advance,validateSave}=await import('./src/game.mjs');const {openPalace}=await import('./src/emperor-ui.mjs');const {persistCandidate}=await import('./src/persistence.mjs');
 let s=newGame('青炉房验收');s.phase=2;let calls=0;const commit=next=>{s=persistCandidate(s,next,localStorage);calls++};
 let d=openPalace(s,document.body,{id:'alchemy',name:'青炉房'},commit);
 await d.querySelector('img').decode();if(calls)throw Error('进房自动扣资源');
 d.querySelector('[data-herb=A]').click();d.querySelector('[data-herb=B]').click();d.querySelector('[data-brew]').click();if(calls!==1||s.stats.energy!==190)throw Error('开炉未正确提交');
 d.querySelector('[data-tab=history]').click();if(!d.textContent.includes('已封炉'))throw Error('炉记缺失');d.close();
 for(let i=0;i<3;i++)advance(s);s.phase=2;s=validateSave(s);
 d=openPalace(s,document.body,{id:'alchemy',name:'青炉房'},commit);d.querySelector('[data-tab=cabinet]').click();d.querySelector('[data-test]').click();if(s.alchemy.batches[0].quantity!==1)throw Error('试药扣量错误');s.stats.energy=150;
 d.close();d=openPalace(s,document.body,{id:'alchemy',name:'青炉房'},commit);d.querySelector('[data-tab=cabinet]').click();d.querySelector('[data-take]').click();if(s.stats.energy!==200||s.alchemy.batches.length)throw Error('服药未正确提交');
 d.querySelector('[data-tab=recipes]').click();if(!d.textContent.includes('回元丹'))throw Error('丹方未发现');
 d.querySelector('[data-tab=brew]').click();await d.querySelector('img').decode();window.alchemyDialog=d;return '开炉、跨旬、试药、服用、发现丹方、持久化通过';
 })()`));
 fs.mkdirSync(path.join(__dirname,'../outputs/alchemy'),{recursive:true});fs.writeFileSync(path.join(__dirname,'../outputs/alchemy/desktop.png'),(await w.webContents.capturePage()).toPNG());
 await w.setSize(900,720);await new Promise(r=>setTimeout(r,200));
 console.log(await w.webContents.executeJavaScript(`(()=>{const d=window.alchemyDialog;const box=d.getBoundingClientRect();const content=d.querySelector('.alchemy-content');if(box.width>innerWidth||box.height>innerHeight||content.scrollWidth>content.clientWidth+2||d.querySelector('[role=status]').getBoundingClientRect().bottom>box.bottom)throw Error('窄屏内容溢出');return '900像素窄窗口布局通过';})()`));
 fs.writeFileSync(path.join(__dirname,'../outputs/alchemy/narrow.png'),(await w.webContents.capturePage()).toPNG());app.exit(0);
 }catch(error){console.error(error);app.exit(1);}
});
