const {app,BrowserWindow}=require('electron');
const path=require('node:path');
app.setPath('userData','/private/tmp/emperor-exam-dismiss-test');
app.whenReady().then(async()=>{
 const w=new BrowserWindow({show:false,webPreferences:{contextIsolation:true}});
 const run=code=>w.webContents.executeJavaScript(code);
 try{
 await w.loadFile(path.join(__dirname,'../index.html'));
 for(const exit of ['notice','escape','close','cancel','hire','exhausted-notice','exhausted-close','exhausted-cancel']){
 await run(`(async()=>{const {newGame,advance,leaveRoom,SAVE_KEY}=await import('./src/game.mjs');const {executePersonnel}=await import('./src/personnel-actions.mjs');let s=newGame('制举关闭回归');s=executePersonnel(s,{kind:'exam',id:s.domestic.personnel.nextId}).state;advance(s);leaveRoom(s);if(${JSON.stringify(exit)}.startsWith('exhausted-'))s.stats.energy=1;window.localStorage.setItem(SAVE_KEY,JSON.stringify(s));})()`);
 await w.reload();await run(`document.querySelector('.opening-skip')?.click();document.querySelector('#continue').click()`);
 const before=await run(`(async()=>{const {SAVE_KEY}=await import('./src/game.mjs');return JSON.parse(localStorage.getItem(SAVE_KEY)).stats.energy;})()`);
 if(exit.endsWith('notice'))await run(`document.querySelector('[aria-label="举行制举通知"] .close').click()`);
 else if(exit==='escape')await run(`document.querySelector('[aria-label="举行制举通知"]').dispatchEvent(new Event('cancel',{cancelable:true}))`);
 else {await run(`document.querySelector('[data-begin-exam]').click()`);if(exit==='hire'){await run(`document.querySelector('[data-exam-choose]').click();document.querySelector('[data-exam-confirm]').click();document.querySelector('[data-edict-seal]').click()`);await new Promise(r=>setTimeout(r,2400));}else await run(`document.querySelector('${exit.endsWith('close')?'[data-picker-close]':'[data-picker-cancel]'}').click()`);}
 await new Promise(r=>setTimeout(r,150));
 const result=await run(`(async()=>{const {SAVE_KEY}=await import('./src/game.mjs');const s=JSON.parse(localStorage.getItem(SAVE_KEY));return {phase:s.phase,energy:s.stats.energy,maxEnergy:s.stats.maxEnergy,candidates:s.domestic.personnel.candidates.length,dialogs:[...document.querySelectorAll('dialog[open][aria-label="举行制举通知"],dialog[open][aria-label="制举候选人才"]')].map(d=>d.textContent)};})()`);
 if(result.phase!==(before===1?0:2)||result.energy!==(before===1?result.maxEnergy:before-1)||result.candidates||result.dialogs.length)throw Error(exit+': '+JSON.stringify(result));
 console.log(exit+' passed');
 }
 app.exit(0);
 }catch(e){console.error(e);app.exit(1);}
});
