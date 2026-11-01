const {app,BrowserWindow}=require('electron');
const path=require('node:path'),fs=require('node:fs');
app.setPath('userData','/private/tmp/emperor-personnel-table-test');
app.whenReady().then(async()=>{
 const w=new BrowserWindow({show:false,width:1440,height:1000,webPreferences:{contextIsolation:true}}),errors=[];
 w.webContents.on('console-message',e=>{if(e.level>=3)errors.push(e.message);});
 const run=code=>w.webContents.executeJavaScript(`(async()=>{${code}})()`);
 try{
 await w.loadFile(path.join(__dirname,'../index.html'));
 await run(`document.querySelector('.opening-skip')?.click();const {newGame}=await import('./src/game.mjs');const {openCourtPersonnel}=await import('./src/court-personnel-ui.mjs');const {appointmentSeats}=await import('./src/appointment-draft.mjs');window.batchState=newGame('整页任官验收');window.batchOriginal=JSON.stringify(batchState);window.batchSeats=appointmentSeats(batchState.domestic);window.batchKeys=Object.keys(batchSeats).filter(id=>batchSeats[id]).slice(0,3);window.batchCommits=0;window.failBatchSave=false;window.batchDialog=openCourtPersonnel(batchState,document.body,s=>{if(failBatchSave)throw Error('模拟保存失败');batchState=s;batchCommits++;return s;});`);
 const choose=async(target,from)=>run(`{batchDialog.querySelector('[data-appointment-picker="'+batchKeys[${target}]+'"]').click();const p=document.querySelector('[data-picker-query]');p.value=batchState.domestic.justice.officials.find(p=>p.id===batchSeats[batchKeys[${from}]]).name;p.dispatchEvent(new Event('input'));document.querySelector('[data-pick-official="'+batchSeats[batchKeys[${from}]]+'"]').click();}`);
 await choose(0,1);await choose(1,2);
 await run(`if(batchCommits||JSON.stringify(batchState)!==batchOriginal)throw Error('暂拟改变了状态');if(batchDialog.querySelectorAll('tr.is-changed').length!==3)throw Error('三人循环未生成');if(batchDialog.querySelectorAll('.appointment-attributes').length!==28)throw Error('14个中央官职未显示双方属性');if(!batchDialog.querySelector('.up')||!batchDialog.querySelector('.down'))throw Error('属性增减缺失');batchDialog.querySelector('[data-appointment-scope="local"]').click();if(batchDialog.querySelectorAll('[data-appointment-picker]').length<2)throw Error('地方官职缺失');batchDialog.querySelector('[data-appointment-scope="central"]').click();if(batchDialog.querySelectorAll('tr.is-changed').length!==3)throw Error('跨页丢失');`);
 for(const width of [1440,900,390]){
 w.setSize(width,1000);await new Promise(r=>setTimeout(r,150));
 await run(`const d=batchDialog,r=d.getBoundingClientRect(),f=d.querySelector('.appointment-footer').getBoundingClientRect(),scroll=d.querySelector('.appointment-table-scroll');if(r.right>innerWidth+1||f.bottom>innerHeight+1||scroll.scrollWidth>scroll.clientWidth+1)throw Error('任官表溢出');if(!d.querySelector('[data-appointment-review]')||d.querySelector('[data-appointment-review]').disabled)throw Error('颁旨按钮不可用');`);
 fs.writeFileSync('/private/tmp/personnel-table-'+width+'.png',(await w.webContents.capturePage()).toPNG());
 }
 await run(`batchDialog.querySelector('[data-appointment-review]').click();if(batchDialog.querySelectorAll('[data-appointment-row]').length!==3)throw Error('批量预览缺人');if(batchDialog.querySelectorAll('.appointment-attributes').length!==6)throw Error('确认页双方能力缺失');batchDialog.querySelector('[data-appointment-edit]').click();batchDialog.querySelector('[data-appointment-undo]').click();if(batchDialog.querySelectorAll('tr.is-changed').length!==2)throw Error('撤销未恢复两人互换');batchDialog.querySelector('[data-appointment-reset]').click();if(!batchDialog.querySelector('[data-appointment-review]').disabled)throw Error('还原失败');`);
 await choose(0,1);await choose(1,2);
 await run(`batchDialog.querySelector('[data-appointment-review]').click();`);
 w.setSize(1440,1000);await new Promise(r=>setTimeout(r,120));
 fs.writeFileSync('/private/tmp/personnel-table-confirm.png',(await w.webContents.capturePage()).toPNG());
 await run(`window.failBatchSave=true;batchDialog.querySelector('[data-appointment-seal]').click();if(batchCommits||!batchDialog.querySelector('[data-appointment-status]').textContent.includes('模拟保存失败'))throw Error('失败后未保留草案');window.failBatchSave=false;batchDialog.querySelector('[data-appointment-seal]').click();if(batchCommits!==1)throw Error('整批应只提交一次');const {appointmentSeats}=await import('./src/appointment-draft.mjs');const s=appointmentSeats(batchState.domestic);if(s[batchKeys[0]]!==batchSeats[batchKeys[1]]||s[batchKeys[1]]!==batchSeats[batchKeys[2]]||s[batchKeys[2]]!==batchSeats[batchKeys[0]])throw Error('循环结果错误');const {validateSave}=await import('./src/game.mjs');validateSave(batchState);`);
 if(errors.length)throw Error(errors.join('\n'));
 console.log('整页任官表界面验收通过：真实六维对照、自动互换、三人轮调、中央地方切换、撤销还原、统一核对与提交、1440/900/390布局。');app.exit(0);
 }catch(e){console.error(e);app.exit(1);}
});
