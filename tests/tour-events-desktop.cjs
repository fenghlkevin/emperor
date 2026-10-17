const {app,BrowserWindow}=require('electron');
const fs=require('node:fs'),path=require('node:path');
app.setPath('userData','/private/tmp/emperor-tour-events-test');
app.whenReady().then(async()=>{
 const w=new BrowserWindow({show:false,width:1400,height:1000,webPreferences:{sandbox:true,contextIsolation:true,nodeIntegration:false}}),out=path.join(__dirname,'../outputs/tour-events');fs.mkdirSync(out,{recursive:true});
 const js=code=>w.webContents.executeJavaScript(code),paint=()=>new Promise(r=>setTimeout(r,180));
 const capture=async name=>{await paint();fs.writeFileSync(path.join(out,name+'.png'),(await w.webContents.capturePage()).toPNG());};
 try{
  await w.loadFile(path.join(__dirname,'../index.html'));
  await js(`(async()=>{const {newGame,advance,SAVE_KEY}=await import('./src/game.mjs');const {scheduleTravel,beginTravel}=await import('./src/travel.mjs');const {BEAUTIES}=await import('./src/beauties.mjs');let s=newGame('巡游彩蛋验收');s.phase=2;s.domestic.countries[0].fiscal.treasury=100000;s.stats.treasury=100000;s=scheduleTravel(s,'tour','guannei').state;advance(s);s=beginTravel(s).state;const ordinary=BEAUTIES.find(p=>p.origin==='原创'&&p.regionId==='sheng');s.travel.pending.encounters=['petition','xia-yuhe','assassin'].map((type,i)=>({id:'tour-1-'+(i+1),type,seed:10000,status:'pending',choiceId:null,result:null,...(type==='xia-yuhe'?{personId:ordinary.id}:{})}));s.travel.easterEggs.xiaYuheSeen=true;window.characterId=ordinary.id;localStorage.setItem(SAVE_KEY,JSON.stringify(s));})()`);
  await w.loadFile(path.join(__dirname,'../index.html'));await paint();
  await js(`document.querySelector('#continue').click();if(!document.querySelector('[data-tour-choice="review"]'))throw Error('petition not shown');if(!document.querySelector('[data-finish]').disabled)throw Error('can bypass events');`);
  await capture('petition');
  await js(`const before=JSON.parse(localStorage.getItem('emperor.save.v1'));document.querySelector('[data-tour-choice="review"]').click();const after=JSON.parse(localStorage.getItem('emperor.save.v1'));if(after.stats.treasury!==before.stats.treasury-1200||after.travel.pending.encounters[0].status!=='resolved')throw Error('petition not saved');document.querySelector('[data-tour-next]').click();if(!document.querySelector('.tour-person').textContent.includes('夏雨荷'))throw Error('rare character missing');if(!document.querySelector('.travel-scene').src.includes('xia-yuhe-v3.png'))throw Error('wrong rare portrait');`);
  await capture('xia-yuhe');
  await js(`if(!document.querySelector('.travel-scene').complete||!document.querySelector('.travel-scene').naturalWidth)throw Error('portrait not loaded');document.querySelector('[data-tour-choice="admit"]').click();const saved=JSON.parse(localStorage.getItem('emperor.save.v1')),p=saved.harem.members.find(p=>p.name==='夏雨荷');if(!p||p.appearance!==98||p.ability!==110||!saved.travel.easterEggs.xiaYuheSeen)throw Error('admission wrong');window.testCharacterId=p.id;document.querySelector('[data-tour-next]').click();if(!document.querySelector('[data-tour-choice="fight"]'))throw Error('assassin missing');`);
  await capture('assassin');
  await js(`document.querySelector('[data-tour-choice="withdraw"]').click();document.querySelector('[data-tour-next]').click();if(document.querySelector('[data-finish]').disabled)throw Error('completion still blocked');document.querySelector('[data-finish]').click();const s=JSON.parse(localStorage.getItem('emperor.save.v1'));if(s.travel.pending||s.travel.history[0].encounters.filter(e=>e.status==='resolved').length!==3)throw Error('events not archived');document.querySelector('.travel-dialog [data-exit]').click();`);
  await paint();await w.loadFile(path.join(__dirname,'../index.html'));await paint();
  await js(`document.querySelector('#continue').click();if(document.querySelector('.travel-dialog'))throw Error('journey replayed');const s=JSON.parse(localStorage.getItem('emperor.save.v1'));if(s.harem.members.filter(p=>p.name==='夏雨荷').length!==1||!s.travel.easterEggs.xiaYuheSeen)throw Error('rare uniqueness lost');`);
  await js(`document.querySelector('[data-quick-harem]').click();if(!document.querySelector('.harem-dialog').textContent.includes('夏雨荷'))throw Error('admitted character missing from live harem');`);
  await new Promise(r=>setTimeout(r,500));await capture('xia-yuhe-harem');await js(`document.querySelector('.harem-dialog').close()`);await paint();
  console.log('PASS: real application petition → rare portrait/admission → assassination → return/reload, real persisted choices and harem portrait');
  // Re-open in read-only UI fixtures at both sizes, including a phone-sized narrow window.
  for(const [width,height]of [[900,700],[1440,900]]){
   w.setSize(width,height);
   await js(`(async()=>{const {openTravelJourney}=await import('./src/travel-ui.mjs');const {newGame,advance}=await import('./src/game.mjs');const {scheduleTravel,beginTravel}=await import('./src/travel.mjs');let s=newGame('布局');s.phase=2;s.domestic.countries[0].fiscal.treasury=100000;s.stats.treasury=100000;s=scheduleTravel(s,'tour','guannei').state;advance(s);s=beginTravel(s).state;s.travel.pending.encounters=[{id:'tour-1-1',type:'assassin',seed:0,status:'pending',choiceId:null,result:null}];window.layoutDialog=openTravelJourney(s,document.body,()=>{});})()`);
   await paint();await js(`(()=>{const d=window.layoutDialog,r=d.getBoundingClientRect();if(r.width>innerWidth||r.height>innerHeight||d.scrollWidth>d.clientWidth+2||document.querySelectorAll('[data-tour-choice]').length!==3)throw Error('event layout overflow');})()`);
   await capture('layout-'+width);await js(`window.layoutDialog.close()`);await paint();
  }
  console.log('PASS: 900px / 1440px event art, choices and scrollable risk descriptions');
  app.exit(0);
 }catch(error){console.error(error);await capture('failure');app.exit(1);}
});
