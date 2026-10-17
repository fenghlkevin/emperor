const {app,BrowserWindow}=require('electron');
const fs=require('node:fs'),path=require('node:path');
app.setPath('userData','/private/tmp/emperor-event-art-test');
app.whenReady().then(async()=>{
 const w=new BrowserWindow({show:false,width:1440,height:900,webPreferences:{sandbox:true,contextIsolation:true}});
 try{
  await w.loadFile(path.join(__dirname,'../index.html'));
  const result=await w.webContents.executeJavaScript(`(async()=>{
   const {TOUR_EVENTS}=await import('./src/tour-events.mjs');
   const {openTravelJourney}=await import('./src/travel-ui.mjs');
   const {newGame,advance}=await import('./src/game.mjs');
   const {scheduleTravel,beginTravel}=await import('./src/travel.mjs');
   const events=TOUR_EVENTS.filter(e=>!e.rare),seen=new Set(),results=[];
   if(events.length!==18)throw Error('Expected 18 common events');
   for(const event of events){
    if(!event.art||seen.has(event.art))throw Error('Missing or duplicate art: '+event.id);
    seen.add(event.art);
    let s=newGame('插图验收');s.phase=2;s.domestic.countries[0].fiscal.treasury=100000;s.stats.treasury=100000;
    s=scheduleTravel(s,'tour','guannei').state;advance(s);s=beginTravel(s).state;
    s.travel.pending.encounters=[{id:'tour-art',type:event.id,seed:0,status:'pending',choiceId:null,result:null}];
    const d=openTravelJourney(s,document.body,()=>{}),img=d.querySelector('.travel-scene');
    await img.decode();
    if(!img.src.endsWith('sketch-tour-'+event.art+'.png')||!img.naturalWidth)throw Error('Wrong image: '+event.id);
    if(d.querySelectorAll('[data-tour-choice]').length!==3)throw Error('Choices missing: '+event.id);
    results.push({id:event.id,width:img.naturalWidth,height:img.naturalHeight});
    d.close();d.remove();
   }
   return results;
  })()`);
  console.log('PASS: all 18 common events render their own decoded image and three choices',JSON.stringify(result));
  app.exit(0);
 }catch(e){console.error(e);app.exit(1);}
});
