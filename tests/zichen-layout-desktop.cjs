const {app,BrowserWindow}=require('electron');
const path=require('node:path'),fs=require('node:fs');
app.setPath('userData','/private/tmp/emperor-zichen-layout');
app.whenReady().then(async()=>{
 const w=new BrowserWindow({show:false,width:1280,height:900,webPreferences:{sandbox:true,contextIsolation:true,nodeIntegration:false}});
 try{
  await w.loadFile(path.join(__dirname,'../index.html'));
  const run=code=>w.webContents.executeJavaScript(`(async()=>{${code}})()`);
  await run(`const {newGame}=await import('./src/game.mjs');const {ACTIVE_BEAUTIES}=await import('./src/beauties.mjs');const {openZichen}=await import('./src/zichen-ui.mjs');const s=newGame('名册验收');s.harem.members=ACTIVE_BEAUTIES.map(p=>({...p,rank:null}));openZichen(s,document.body,()=>{});document.querySelector('[data-view="menu"]').click();document.querySelector('[data-view="consorts"]').click();`);
  for(const [width,height] of [[1280,900],[900,680],[480,740]]){
   w.setSize(width,height);await new Promise(r=>setTimeout(r,150));
   await run(`const cards=[...document.querySelectorAll('.zichen-card')];if(cards.length!==6)throw Error('分页人数错误');for(const card of cards){const art=card.querySelector('canvas').getBoundingClientRect(),copy=card.querySelector('h3').getBoundingClientRect();if(art.width>90||art.height>150||copy.left<art.right||card.scrollWidth>card.clientWidth+1)throw Error('图片挤压文字');}const book=document.querySelector('.zichen-book');if(book.scrollWidth>book.clientWidth+1)throw Error('名册横向溢出');`);
   fs.writeFileSync(`/private/tmp/zichen-roster-${width}.png`,(await w.webContents.capturePage()).toPNG());
  }
  await run(`for(let page=1;page<5;page++)document.querySelector('[data-page="1"]').click();if(!document.querySelector('[data-page="1"]').disabled||document.querySelector('footer span').textContent!=='5 / 5')throw Error('尾页错误');document.querySelector('[data-person]').click();if(!document.querySelector('.zichen-bio'))throw Error('小传未打开');document.querySelector('[data-view="consorts"]').click();if(document.querySelector('footer span').textContent!=='5 / 5')throw Error('未保留页码');`);
  console.log('30 人名册、三种窗口尺寸、缩略图边界、分页与小传返回通过');app.exit(0);
 }catch(e){console.error(e);app.exit(1);}
});
