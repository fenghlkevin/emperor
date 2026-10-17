const {app,BrowserWindow}=require('electron');
const path=require('node:path'),fs=require('node:fs');
module.exports=function(kind){
 app.setPath('userData',`/private/tmp/emperor-${kind}-instant-test`);
 app.whenReady().then(async()=>{
  const w=new BrowserWindow({show:false,width:1360,height:950,webPreferences:{backgroundThrottling:false,sandbox:true,contextIsolation:true,nodeIntegration:false}});
  try{
   console.log('loading '+kind);
   await w.loadFile(path.join(__dirname,'../index.html'));
   console.log(await w.webContents.executeJavaScript(`(async()=>{
    const {newGame}=await import('./src/game.mjs');
    const {openPalace}=await import('./src/emperor-ui.mjs');
    const kind=${JSON.stringify(kind)};
    const fields={music:['charm'],theatre:['talent'],mother:['happiness'],study:['wisdom'],martial:['martial']}[kind];
    const names={charm:'魅力',talent:'才艺',happiness:'快乐',wisdom:'智慧',martial:'武术',health:'健康'};
    const training=kind!=='mother',cost=training?40:1;const originalRandom=Math.random;Math.random=()=>.99;
    let calls=0,next;
    const s=newGame('即时结算验收');s.phase=1;fields.forEach(f=>s.stats[f]=training?498:98);
    const d=openPalace(s,document.body,{id:kind},v=>{calls++;next=v});
    await Promise.all([...d.querySelectorAll('img')].map(i=>i.decode()));
    await new Promise(r=>setTimeout(r,50));
    if(calls!==1||next.stats.energy!==200-cost)throw Error('未立即结算一次');
    const text=d.querySelector('[role=status]').textContent;
    if(!text.includes('体力减少了 '+cost))throw Error('缺少体力变化');
    for(const f of fields)if(next.stats[f]!==(training?500:100)||!text.includes(names[f]+'增加了 2'))throw Error('封顶实际增量错误');
    if(d.querySelector('.music-progress,.mother-ceremony,.study-reading,.martial-progress'))throw Error('残留进度提示');
    await new Promise(r=>setTimeout(r,3100));if(calls!==1)throw Error('重复结算');
    Math.random=originalRandom;window.resultDialog=d;
    return kind+'：即时结算、实际增量、体力变化及无重复结算通过';
   })()`));
   fs.mkdirSync(path.join(__dirname,'../outputs/instant-palaces'),{recursive:true});
   fs.writeFileSync(path.join(__dirname,`../outputs/instant-palaces/${kind}.png`),(await w.webContents.capturePage()).toPNG());
   console.log(await w.webContents.executeJavaScript(`(async()=>{
    window.resultDialog.close();
    const {newGame}=await import('./src/game.mjs');const mod=await import('./src/${kind}-ui.mjs');const open=Object.values(mod)[0];
    let calls=0;const s=newGame('体力不足');s.stats.energy=0;
    const d=open(s,document.body,()=>calls++);await Promise.all([...d.querySelectorAll('img')].map(i=>i.decode()));await new Promise(r=>setTimeout(r,50));
    if(calls||!d.textContent.includes('体力耗尽'))throw Error('体力限制错误');d.close();
    const cancelled=open(newGame('载入时离开'),document.body,()=>calls++);cancelled.close();await new Promise(r=>setTimeout(r,100));if(calls)throw Error('关闭后结算');
    return '体力限制和载入时关闭检查通过';
   })()`));app.exit(0);
  }catch(error){console.error(error);app.exit(1);}
 });
};
