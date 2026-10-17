const {app,BrowserWindow}=require('electron');
const path=require('node:path'),fs=require('node:fs');
app.setPath('userData','/private/tmp/emperor-dragon-test-profile');
app.whenReady().then(async()=>{
 const w=new BrowserWindow({show:false,width:1360,height:950,webPreferences:{sandbox:true,contextIsolation:true,nodeIntegration:false}});
 try{
  await w.loadFile(path.join(__dirname,'../index.html'));
  console.log(await w.webContents.executeJavaScript(`(async()=>{
   const {newGame}=await import('./src/game.mjs');const {openPalace}=await import('./src/emperor-ui.mjs');
   const s=newGame('戏园验收');s.phase=1;s.stats.energy=3;s.stats.health=98;let calls=0,next;
   const d=openPalace(s,document.body,{id:'dragon',name:'金龙殿'},value=>{calls++;next=value;});
   await Promise.all([...d.querySelectorAll('img')].map(img=>img.decode()));await new Promise(r=>setTimeout(r,100));
   if(!d.classList.contains('is-resting'))throw Error('未开演');
   if(d.querySelectorAll('.dragon-person img').length!==4)throw Error('侍从不齐');if(d.querySelector('.bed-sleep-screen'))throw Error('旧安寝卡片仍在');
   if(d.querySelector('svg')||d.querySelector('.juggling-balls'))throw Error('旧画面仍在');
   const canvas=d.querySelector('.dragon-breath'),ctx=canvas.getContext('2d');const before=ctx.getImageData(0,0,canvas.width,canvas.height).data;await new Promise(r=>setTimeout(r,1300));const after=ctx.getImageData(0,0,canvas.width,canvas.height).data;if(!before.some((v,i)=>v!==after[i]))throw Error('胸腹锦衾没有实际运动');await new Promise(r=>setTimeout(r,1200));if(calls)throw Error('不足3秒结算');
   window.dragonTest={d,getCalls:()=>calls,getNext:()=>next};return '新寝殿与两组侍从已加载；3秒前不结算';
  })()`));
  fs.mkdirSync(path.join(__dirname,'../outputs/dragon'),{recursive:true});
  fs.writeFileSync(path.join(__dirname,'../outputs/dragon/performing-v2.png'),(await w.webContents.capturePage()).toPNG());
  console.log(await w.webContents.executeJavaScript(`(async()=>{
   await new Promise(r=>setTimeout(r,600));const {d,getCalls,getNext}=window.dragonTest;
   if(getCalls()!==1||getNext().stats.energy!==153)throw Error('结算次数或体力错误');
   if(d.querySelector('[role=status]').textContent!=='独寝安眠，体力增加150，健康增加2。')throw Error('实际增量错误');
   if(!d.classList.contains('is-finished'))throw Error('未完成安寝');
   if(d.querySelector('.dragon-rest').getAnimations({subtree:true}).length)throw Error('谢幕后未停止');
   return '结算一次、体力恢复150；正确显示封顶后的实际增量；安寝场景保留';
  })()`));
  fs.writeFileSync(path.join(__dirname,'../outputs/dragon/result-v2.png'),(await w.webContents.capturePage()).toPNG());
  await w.setSize(900,680);
  fs.writeFileSync(path.join(__dirname,'../outputs/dragon/compact-v2.png'),(await w.webContents.capturePage()).toPNG());
  console.log(await w.webContents.executeJavaScript(`(async()=>{
   window.dragonTest.d.close();const {newGame}=await import('./src/game.mjs');const {openDragon}=await import('./src/dragon-ui.mjs');
   let calls=0;const d=openDragon(newGame('中断验收'),document.body,()=>calls++);d.close();await new Promise(r=>setTimeout(r,3300));if(calls)throw Error('离园后仍结算');return '提前离园取消结算';
  })()`));app.exit(0);
 }catch(error){console.error(error);app.exit(1);}
});
