const {app,BrowserWindow}=require('electron');const fs=require('node:fs'),path=require('node:path');
app.setPath('userData',`/private/tmp/emperor-territory-${process.pid}`);
app.whenReady().then(async()=>{const w=new BrowserWindow({show:false,width:1440,height:1000,webPreferences:{sandbox:true,contextIsolation:true,nodeIntegration:false}});
 const run=s=>w.webContents.executeJavaScript(`(async()=>{${s}})()`);
 const shot=async name=>{await run('await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)))');await new Promise(r=>setTimeout(r,100));fs.writeFileSync('/private/tmp/territory-'+name+'.png',(await w.webContents.capturePage()).toPNG());};
 try{await w.loadFile(path.join(__dirname,'../index.html'));await run(`window.s=(await import('./src/game.mjs')).newGame('疆域验收');window.root=document.querySelector('#app');window.dom=await import('./src/domestic-ui.mjs');dom.openDomestic(s,root);`);await shot('initial');
 
 await run(`document.querySelector('dialog').close();const {occupyProvince}=await import('./src/occupation.mjs');for(const id of ['tuyuhun','korea','japan'])occupyProvince(s.domestic,id,1);window.before=JSON.stringify(s);`);
 for(const [name,module,fn,options]of [['world','domestic-ui','openDomestic',null],['grain','court-atlas-ui','openCourtAtlas',{tab:'grain'}],['garrison','court-garrison-ui','openCourtGarrison',null],['special','court-special-ui','openCourtSpecial',null],['diplomacy','court-diplomacy-ui','openCourtDiplomacy',null],['campaign','court-campaign-ui','openCourtCampaign',null]]){
  await run(`document.querySelectorAll('dialog').forEach(d=>{d.close();d.remove();});const m=await import('./src/${module}.mjs');${name==='world'?'m.openDomestic(s,root);':`m.${fn}(s,root,()=>{},()=>{},${JSON.stringify(options??{})});`}
   const svg=document.querySelector('dialog[open] svg');if(!svg)throw Error('${name} missing map');
   for(const path of svg.querySelectorAll('path[data-atlas-province],path[data-garrison-depot],path[data-special-province],path[data-diplomatic-country],path[data-war-country]')){
    const css=getComputedStyle(path);if(css.stroke==='none'||parseFloat(css.strokeWidth)<1||css.vectorEffect!=='non-scaling-stroke')throw Error('${name}: 州界不可见或随地图缩放');
   }
   if('${name}'==='world'){
    for(const el of svg.querySelectorAll('path.realm.home,path.province')){const css=getComputedStyle(el);if(css.stroke==='none'||parseFloat(css.strokeWidth)<1)throw Error('国内州界不可见');}
    for(const el of svg.querySelectorAll('text.province-name'))if(getComputedStyle(el).display==='none')throw Error('国内州名被隐藏');
    for(const id of ['tuyuhun','korea','japan'])if(!svg.querySelector('path.realm.home[data-country="'+id+'"]'))throw Error('未标记占领 '+id);}
   if(['grain','garrison','special'].includes('${name}'))for(const id of ['tuyuhun','korea','japan'])if(![...svg.querySelectorAll('path')].some(p=>[...p.attributes].some(a=>a.name.startsWith('data-')&&a.value===id+'-core')))throw Error('${name} 缺占领区 '+id);
   if('${name}'==='world'){
    svg.querySelector('path[data-country="korea"]').dispatchEvent(new MouseEvent('click',{bubbles:true}));
    if(!document.querySelector('.civil-info').textContent.includes('高丽'))throw Error('占领区点击未读当前归属');
   }
   if('${name}'==='grain'){
    document.querySelector('path[data-atlas-province="korea-core"]').dispatchEvent(new MouseEvent('click',{bubbles:true}));
    if(!document.querySelector('.atlas-local-heading').textContent.includes('高丽'))throw Error('占领州无法选中');
   }
   if('${name}'==='diplomacy'&&svg.querySelectorAll('path.is-home').length!==13)throw Error('通邦图归属不完整');
   if('${name}'==='campaign'&&svg.querySelectorAll('path.home').length!==13)throw Error('出征图归属不完整');
   if(JSON.stringify(s)!==before)throw Error('查图改写存档');`);await shot(name);
 }
 console.log('领土地图验收通过');app.exit(0);
 }catch(e){console.error(e);app.exit(1);}});
