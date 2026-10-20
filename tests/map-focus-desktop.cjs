const {app,BrowserWindow}=require('electron');
const path=require('node:path');
const fs=require('node:fs');
app.setPath('userData',`/private/tmp/emperor-map-focus-${process.pid}`);
app.whenReady().then(async()=>{
 const w=new BrowserWindow({show:false,width:1440,height:1000,webPreferences:{sandbox:true,contextIsolation:true,nodeIntegration:false}});
 try{
  await w.loadFile(path.join(__dirname,'../index.html'));
  await w.webContents.executeJavaScript(`(async()=>{
   const {newGame}=await import('./src/game.mjs');window.auditState=newGame('地图焦点验收');
   window.auditBefore=JSON.stringify(auditState);window.auditSaved=localStorage.getItem('emperor.save.v1');
   window.auditRoot=document.querySelector('#app');
   window.mapAuditCases=[
    ...['domestic','works','military','diplomacy'].map(mode=>({name:'world-'+mode,module:'domestic-ui',fn:'openDomestic',mode})),
    ...['grain','finance','army','build'].map(tab=>({name:'atlas-'+tab,module:'court-atlas-ui',fn:'openCourtAtlas',tab})),
    {name:'garrison',module:'court-garrison-ui',fn:'openCourtGarrison'},
    {name:'special',module:'court-special-ui',fn:'openCourtSpecial'},
    {name:'diplomacy',module:'court-diplomacy-ui',fn:'openCourtDiplomacy'},
    {name:'campaign',module:'court-campaign-ui',fn:'openCourtCampaign'}
   ];
  })()`);
  const results=[];
  for(let i=0;i<12;i++){
   const result=await w.webContents.executeJavaScript(`(async()=>{
    document.querySelectorAll('dialog').forEach(d=>{d.close();d.remove();});
    const c=mapAuditCases[${i}],m=await import('./src/'+c.module+'.mjs');
    if(c.mode)m[c.fn](auditState,auditRoot,{mode:c.mode});
    else m[c.fn](auditState,auditRoot,()=>{},()=>{},c.tab?{tab:c.tab}:undefined);
    const dialog=document.querySelector('dialog[open]');
    const selector='svg :is(path,text,g)[tabindex="0"]';
    const entries=[...dialog.querySelectorAll(selector)].map(el=>({tag:el.tagName,attr:[...el.attributes].find(a=>a.name.startsWith('data-'))?.name,value:[...el.attributes].find(a=>a.name.startsWith('data-'))?.value}));
    if(!entries.length)throw Error(c.name+': 没有可检查地图入口');
    let focused=0,clicked=0,keyed=0;
    for(const entry of entries){
     const locate=()=>[...dialog.querySelectorAll(selector)].find(el=>el.tagName===entry.tag&&el.getAttribute(entry.attr)===entry.value);
     let el=locate();if(!el)continue;
     el.focus();let s=getComputedStyle(el);
     if(s.outlineStyle!=='none')throw Error(c.name+': 默认焦点框 '+entry.value);
     if(el.tagName==='path'&&el.matches(':focus-visible')&&(s.vectorEffect!=='non-scaling-stroke'||parseFloat(s.strokeWidth)>2))throw Error(c.name+': 焦点描边未固定像素 '+entry.value);
     focused++;
     el.dispatchEvent(new MouseEvent('click',{bubbles:true}));clicked++;
     el=locate();if(el){el.focus();el.dispatchEvent(new KeyboardEvent('keydown',{key:'Enter',bubbles:true}));keyed++;}
    }
    if(JSON.stringify(auditState)!==auditBefore||localStorage.getItem('emperor.save.v1')!==auditSaved)throw Error(c.name+': 查阅修改存档');
    await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));
    return {name:c.name,focused,clicked,keyed};
   })()`);
   await new Promise(r=>setTimeout(r,100));
   fs.writeFileSync(`/private/tmp/emperor-map-focus-${result.name}.png`,(await w.webContents.capturePage()).toPNG());
   results.push(result);
  }
  console.log('全部地图焦点验收通过',JSON.stringify(results));app.exit(0);
 }catch(e){console.error(e);app.exit(1);}
});
