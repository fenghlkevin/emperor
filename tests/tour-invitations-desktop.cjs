const {app,BrowserWindow}=require('electron');
const fs=require('node:fs'),path=require('node:path');
app.setPath('userData','/private/tmp/emperor-invitation-events-test');
app.whenReady().then(async()=>{
 const w=new BrowserWindow({show:false,width:1440,height:1000,webPreferences:{sandbox:true,contextIsolation:true,nodeIntegration:false}});
 const out=path.join(__dirname,'../outputs/tour-beauty-preview/invitations');fs.mkdirSync(out,{recursive:true});
 w.webContents.on('console-message',(_event,details)=>{if(details.level==='error')console.error(details.message)});
 const js=code=>w.webContents.executeJavaScript(code),paint=()=>new Promise(r=>setTimeout(r,180));
 const capture=async name=>{await paint();fs.writeFileSync(path.join(out,name+'.png'),(await w.webContents.capturePage()).toPNG());};
 const ready=async selector=>{for(let i=0;i<60;i++){if(await js(`Boolean(${selector})`))return;await paint();}throw Error('art did not load: '+selector);};
 try{
  const admitted=[];
  await w.loadFile(path.join(__dirname,'../index.html'));
  const cameos=await js(`(async()=>{const {TOUR_CAMEOS}=await import('./src/tour-cameos.mjs');return TOUR_CAMEOS.filter(c=>c.invitationOnly);})()`);
  for(const [index,c]of cameos.entries()){
   const provinceId=c.eligibleProvinces?.[0]??'guannei';
   await js(`(async()=>{const {newGame,advance,SAVE_KEY}=await import('./src/game.mjs');const {scheduleTravel,beginTravel}=await import('./src/travel.mjs');const {markCameoSeen}=await import('./src/tour-cameos.mjs');let s=newGame('巡游佳人验收');s.phase=2;s.domestic.countries[0].fiscal.treasury=100000;s.stats.treasury=100000;s.domestic.provinces.find(p=>p.id===${JSON.stringify(provinceId)}).buildings.palaces=1;s=scheduleTravel(s,'tour',${JSON.stringify(provinceId)}).state;advance(s);s=beginTravel(s).state;s.travel.pending.encounters=[{id:'tour-1-1',type:${JSON.stringify(c.id)},seed:10000,status:'pending',choiceId:null,result:null,personId:${JSON.stringify(c.featuredId??'random-beauty-tour-1-1')}}];s.travel.easterEggs={xiaYuheSeen:false,cameosSeen:[]};markCameoSeen(s,${JSON.stringify(c.id)});localStorage.setItem(SAVE_KEY,JSON.stringify(s));})()`);
   await w.loadFile(path.join(__dirname,'../index.html'));await paint();await js(`document.querySelector('#continue').click()`);
   await ready(`document.querySelector('.travel-scene')?.complete&&document.querySelector('.travel-scene')?.naturalWidth`);
   await js(`(()=>{const d=document.querySelector('.travel-dialog'),im=d.querySelector('.travel-scene');if(!d.querySelector('.tour-event-copy h2').textContent.includes(${JSON.stringify(c.encounterName??c.name)})||!im.src.endsWith(${JSON.stringify(c.encounterPortraitAsset??c.portraitAsset)}))throw Error('wrong cameo art/identity');if(!d.style.getPropertyValue('--tour-portrait-scene').includes(${JSON.stringify(c.sceneAsset)}))throw Error('wrong scene');if(d.scrollWidth>d.clientWidth+2)throw Error('event overflow');})()`);
   await js(`if(/低概率奇遇|本局仅此一次/.test(document.querySelector('.travel-dialog').textContent))throw Error('removed badge is visible');if(!document.querySelector('.has-commoner-event'))throw Error('invitation layout missing')`);
   await js(`if(document.querySelectorAll('[data-tour-choice]').length!==2||document.querySelector('[data-tour-choice="patron"]')||document.querySelector('[data-tour-choice="part"] strong').textContent!=='放弃')throw Error('expected exactly invitation and refusal');if(document.querySelector('[data-tour-choice="admit"] strong').textContent!=='邀请入宫')throw Error('wrong invitation label')`);
   await capture(c.id+'-event');
   await w.loadFile(path.join(__dirname,'../index.html'));await paint();await js(`document.querySelector('#continue').click()`);
   await ready(`document.querySelector('.travel-scene')?.complete&&document.querySelector('.travel-scene')?.naturalWidth`);
   await js(`if(!document.querySelector('.travel-scene').src.endsWith(${JSON.stringify(c.encounterPortraitAsset)}))throw Error('serious encounter portrait lost on reload')`);
   if(index===0){w.setSize(700,850);await paint();await js(`(()=>{const d=document.querySelector('.travel-dialog');if(d.scrollWidth>d.clientWidth+2||d.getBoundingClientRect().width>innerWidth)throw Error('narrow overflow');})()`);await capture('narrow-event');w.setSize(1440,1000);}
   if(c.encounterName){
    await js(`if(document.querySelector('.tour-person').textContent.includes(${JSON.stringify(c.name)}))throw Error('identity revealed early')`);
    await w.loadFile(path.join(__dirname,'../index.html'));await paint();await js(`document.querySelector('#continue').click()`);
    await ready(`document.querySelector('.travel-scene')?.complete&&document.querySelector('.travel-scene')?.naturalWidth`);
    await js(`if(!document.querySelector('.travel-scene').src.endsWith(${JSON.stringify(c.encounterPortraitAsset)}))throw Error('disguise lost on pending reload')`);
   }
   await js(`document.querySelector('[data-tour-choice="admit"]').click()`);
   await ready(`document.querySelector('.travel-scene')?.complete&&document.querySelector('.travel-scene')?.naturalWidth`);
   await js(`if(!document.querySelector('.travel-scene').src.endsWith(${JSON.stringify(c.pregnantPortraitAsset??c.portraitAsset)}))throw Error('invitation result must show correct palace expression')`);
   await capture(c.id+'-admitted');
   await js(`document.querySelector('[data-tour-next]').click();document.querySelector('[data-finish]').click();document.querySelector('.travel-dialog [data-exit]').click()`);
   await w.loadFile(path.join(__dirname,'../index.html'));await paint();
   if(c.arrivalPregnancy){
    await js(`document.querySelector('#continue').click()`);
    await ready(`document.querySelector('.royal-event-dialog[data-kind="birth"]')?.open`);
    await js(`(async()=>{const {validateSave,SAVE_KEY}=await import('./src/game.mjs');const s=validateSave(JSON.parse(localStorage.getItem(SAVE_KEY))),p=s.harem.members.find(p=>p.travelOrigin?.easterEgg==='susu');if(p.pregnancy||s.harem.children.filter(c=>c.motherId===p.id).length!==1)throw Error('Susu delivery not persisted');})()`);
    await capture('susu-birth');await js(`document.querySelector('[data-ack-royal]').click()`);await paint();
    await w.loadFile(path.join(__dirname,'../index.html'));await paint();
   }
   const person=await js(`(async()=>{const {validateSave,SAVE_KEY}=await import('./src/game.mjs');const s=validateSave(JSON.parse(localStorage.getItem(SAVE_KEY)));const p=s.harem.members.find(p=>p.travelOrigin?.easterEgg===${JSON.stringify(c.id)});if(!p||!p.travelOrigin.consented||!s.travel.easterEggs.cameosSeen.includes(${JSON.stringify(c.id)}))throw Error('lost cameo on reload');document.querySelector('#continue').click();document.querySelector('[data-quick-harem]').click();return p;})()`);
   await ready(`document.querySelector('canvas[data-beauty="${person.id}"]')?.dataset.ready==='true'`);
   await js(`if(!document.querySelector('canvas[data-beauty="${person.id}"]').dataset.signature.endsWith(${JSON.stringify(c.portraitAsset)}))throw Error('wrong palace portrait')`);
   await capture(c.id+'-harem');person.id=`random-beauty-tour-${100+index}-3`;person.rank=null;admitted.push(person);
   console.log('PASS: '+c.name+' encounter → admit → return → reload → dedicated palace portrait');
  }
  await js(`(async()=>{const {newGame,SAVE_KEY}=await import('./src/game.mjs');const s=newGame('巡游佳人合影');const people=${JSON.stringify(admitted)};s.harem.members.push(...people);s.harem.seen=[...(s.harem.seen??[]),...people.map(p=>p.id)];s.travel.easterEggs.cameosSeen=people.map(p=>p.travelOrigin.easterEgg);localStorage.setItem(SAVE_KEY,JSON.stringify(s));})()`);
  w.setSize(1800,1200);await w.loadFile(path.join(__dirname,'../index.html'));await paint();await js(`document.querySelector('#continue').click();document.querySelector('[data-quick-harem]').click()`);
  await ready(`document.querySelectorAll('canvas[data-ready="true"]').length>=4`);await capture('three-invitations-harem');
  app.exit(0);
 }catch(error){console.error(error);await capture('failure');app.exit(1);}
});
