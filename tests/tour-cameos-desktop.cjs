const {app,BrowserWindow}=require('electron');
const fs=require('node:fs'),path=require('node:path');
const selectedIds=(process.env.TOUR_CAMEO_IDS??'').split(',').filter(Boolean);
app.setPath('userData',selectedIds.length?`/private/tmp/emperor-wuxia-cameos-${process.pid}`:'/private/tmp/emperor-tour-cameos-test');
app.whenReady().then(async()=>{
 const w=new BrowserWindow({show:false,width:1440,height:1000,webPreferences:{sandbox:true,contextIsolation:true,nodeIntegration:false}});
 const out=path.join(__dirname,selectedIds.length?'../outputs/wuxia-cameos-20261026':'../outputs/tour-cameos');fs.mkdirSync(out,{recursive:true});
 const js=code=>w.webContents.executeJavaScript(code),paint=()=>new Promise(r=>setTimeout(r,180));
 const capture=async name=>{await paint();fs.writeFileSync(path.join(out,name+'.png'),(await w.webContents.capturePage()).toPNG());};
 const ready=async selector=>{for(let i=0;i<60;i++){if(await js(`Boolean(${selector})`))return;await paint();}throw Error('art did not load: '+selector);};
 try{
  const admitted=[];
  await w.loadFile(path.join(__dirname,'../index.html'));
  const cameos=await js(`(async()=>{const {TOUR_CAMEOS}=await import('./src/tour-cameos.mjs');return TOUR_CAMEOS.slice(1);})()`);
  const selected=selectedIds.length?cameos.filter(c=>selectedIds.includes(c.id)):cameos;
  if(selectedIds.length&&selected.length!==selectedIds.length)throw Error('Unknown selected cameo');
  for(const [index,c]of selected.entries()){
   const provinceId=c.eligibleProvinces?.[0]??'guannei';
   await js(`(async()=>{const {newGame,advance,SAVE_KEY}=await import('./src/game.mjs');const {scheduleTravel,beginTravel}=await import('./src/travel.mjs');const {markCameoSeen}=await import('./src/tour-cameos.mjs');let s=newGame('巡游佳人验收');s.phase=2;s.domestic.countries[0].fiscal.treasury=100000;s.stats.treasury=100000;s.domestic.provinces.find(p=>p.id===${JSON.stringify(provinceId)}).buildings.palaces=1;s=scheduleTravel(s,'tour',${JSON.stringify(provinceId)}).state;advance(s);s=beginTravel(s).state;s.travel.pending.encounters=[{id:'tour-1-1',type:${JSON.stringify(c.id)},seed:10000,status:'pending',choiceId:null,result:null,personId:${JSON.stringify(c.featuredId??'random-beauty-tour-1-1')}}];s.travel.easterEggs={xiaYuheSeen:false,cameosSeen:[]};markCameoSeen(s,${JSON.stringify(c.id)});localStorage.setItem(SAVE_KEY,JSON.stringify(s));})()`);
   await w.loadFile(path.join(__dirname,'../index.html'));await paint();await js(`document.querySelector('#continue').click()`);
   await ready(`document.querySelector('.travel-scene')?.complete&&document.querySelector('.travel-scene')?.naturalWidth`);
   await js(`(()=>{const d=document.querySelector('.travel-dialog'),im=d.querySelector('.travel-scene');if(!(d.querySelector('.tour-person')??d.querySelector('.tour-event-copy h2')).textContent.includes(${JSON.stringify(c.encounterName??c.name)})||!im.src.endsWith(${JSON.stringify(c.encounterPortraitAsset??c.portraitAsset)}))throw Error('wrong cameo art/identity');if(!d.style.getPropertyValue('--tour-portrait-scene').includes(${JSON.stringify(c.sceneAsset)}))throw Error('wrong scene');if(d.scrollWidth>d.clientWidth+2)throw Error('event overflow');})()`);
   await capture(c.id+'-event');
   if(index===0){w.setSize(700,850);await paint();await js(`(()=>{const d=document.querySelector('.travel-dialog');if(d.scrollWidth>d.clientWidth+2||d.getBoundingClientRect().width>innerWidth)throw Error('narrow overflow');})()`);await capture('narrow-event');w.setSize(1440,1000);}
   if(c.encounterName){
    await js(`if(document.querySelector('.tour-person').textContent.includes(${JSON.stringify(c.name)}))throw Error('identity revealed early')`);
    await w.loadFile(path.join(__dirname,'../index.html'));await paint();await js(`document.querySelector('#continue').click()`);
    await ready(`document.querySelector('.travel-scene')?.complete&&document.querySelector('.travel-scene')?.naturalWidth`);
    await js(`if(!document.querySelector('.travel-scene').src.endsWith(${JSON.stringify(c.encounterPortraitAsset)}))throw Error('disguise lost on pending reload')`);
   }
   await js(`document.querySelector('[data-tour-choice="admit"]').click()`);
   if(c.encounterPortraitAsset&&!c.forceAdmission){
    await ready(`document.querySelector('.travel-scene')?.complete&&document.querySelector('.travel-scene')?.naturalWidth`);
    await js(`if(!document.querySelector('.travel-scene').src.endsWith(${JSON.stringify(c.portraitAsset)})||!document.querySelector('[data-tour-result]').textContent.includes('恢复了本来容貌'))throw Error('admission did not reveal true portrait')`);
    await capture(c.id+'-revealed');
   }
   await js(`document.querySelector('[data-tour-next]').click();document.querySelector('[data-finish]').click();document.querySelector('.travel-dialog [data-exit]').click()`);
   await w.loadFile(path.join(__dirname,'../index.html'));await paint();
   const person=await js(`(async()=>{const {validateSave,SAVE_KEY}=await import('./src/game.mjs');const s=validateSave(JSON.parse(localStorage.getItem(SAVE_KEY)));const p=s.harem.members.find(p=>p.travelOrigin?.easterEgg===${JSON.stringify(c.id)});if(!p||!s.travel.easterEggs.cameosSeen.includes(${JSON.stringify(c.id)}))throw Error('lost cameo on reload');document.querySelector('#continue').click();document.querySelector('[data-quick-harem]').click();return p;})()`);
   await ready(`document.querySelector('canvas[data-beauty="${person.id}"]')?.dataset.ready==='true'`);
   await js(`if(!document.querySelector('canvas[data-beauty="${person.id}"]').dataset.signature.endsWith(${JSON.stringify(c.portraitAsset)}))throw Error('wrong palace portrait')`);
   await capture(c.id+'-harem');person.id=`random-beauty-tour-${100+index}-3`;person.rank=null;admitted.push(person);
   console.log('PASS: '+c.name+' encounter → admit → return → reload → dedicated palace portrait');
  }
  await js(`(async()=>{const {newGame,SAVE_KEY}=await import('./src/game.mjs');const s=newGame('巡游佳人合影');const people=${JSON.stringify(admitted)};s.harem.members.push(...people);s.harem.seen=[...(s.harem.seen??[]),...people.map(p=>p.id)];s.travel.easterEggs.cameosSeen=people.map(p=>p.travelOrigin.easterEgg);localStorage.setItem(SAVE_KEY,JSON.stringify(s));})()`);
  w.setSize(1800,1200);await w.loadFile(path.join(__dirname,'../index.html'));await paint();await js(`document.querySelector('#continue').click();document.querySelector('[data-quick-harem]').click()`);
  await ready(`document.querySelectorAll('canvas[data-ready="true"]').length>=${Math.min(6,admitted.length+1)}`);await capture('all-cameos-harem');
  fs.writeFileSync(path.join(out,'validation.json'),JSON.stringify({passed:true,characters:selected.map(c=>({id:c.id,name:c.name,portrait:c.portraitAsset})),checks:['event image','choices','admission','return journey','save reload','harem portrait','narrow layout']},null,2)+'\n');
  app.exit(0);
 }catch(error){console.error(error);await capture('failure');app.exit(1);}
});
