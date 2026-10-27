const {app,BrowserWindow}=require('electron');
const path=require('node:path');
app.setPath('userData',`/private/tmp/emperor-atlas-colors-${process.pid}`);
app.whenReady().then(async()=>{
 const w=new BrowserWindow({show:false,width:1440,height:1000,webPreferences:{sandbox:true,contextIsolation:true}});
 try{
  await w.loadFile(path.join(__dirname,'../index.html'));
  const result=await w.webContents.executeJavaScript(`(async()=>{
   const {newGame}=await import('./src/game.mjs'),{atlasCountryColor}=await import('./src/atlas-colors.mjs');
   const {REALMS}=await import('./src/domestic.mjs');
   const state=newGame('独立配色'),before=JSON.stringify(state),root=document.querySelector('#app');
   const {diplomaticMap}=await import('./src/court-diplomacy-ui.mjs'),{targetMap}=await import('./src/war-target-map.mjs');
   const {openDomestic}=await import('./src/domestic-ui.mjs'),{openFoodRelief}=await import('./src/food-relief-ui.mjs');
   const cases=[['天下',()=>openDomestic(state,root),'path.realm'],['外交',()=>root.insertAdjacentHTML('beforeend',diplomaticMap(state.domestic,null)),'path.diplomatic-territory'],['出征',()=>root.insertAdjacentHTML('beforeend',targetMap(state.domestic,[],null)),'path.war-territory'],['购粮',()=>openFoodRelief(state,root,()=>{},()=>{}),'path.grain-trade-region']];
   const results=[];
   for(const [name,open,selector]of cases){
    document.querySelectorAll('dialog').forEach(d=>{d.close();d.remove()});root.replaceChildren();open();
    const colors=new Map();
    for(const p of root.querySelectorAll(selector)){
     const id=p.dataset.atlasTone;if(!id)throw Error(name+' 缺国家配色标记');
     if(p.matches('.is-selected,.chosen,.selected'))continue;
     const actual=getComputedStyle(p).fill,probe=document.createElementNS('http://www.w3.org/2000/svg','path');
     probe.setAttribute('fill',atlasCountryColor(id));p.parentNode.append(probe);const expected=getComputedStyle(probe).fill;probe.remove();
     if(actual!==expected)throw Error(name+' '+id+' 未显示登记颜色 '+actual+' / '+expected);
     if(colors.has(id)&&colors.get(id)!==actual)throw Error(name+' 同国颜色不同 '+id);
     colors.set(id,actual);
    }
    if(new Set(colors.values()).size!==colors.size)throw Error(name+' 存在国家同色');
    if(colors.size<REALMS.length-1)throw Error(name+' 未覆盖全部国家');
    results.push({map:name,countries:colors.size});
   }
   if(JSON.stringify(state)!==before)throw Error('验色改写存档');return results;
  })()`);
  console.log('国家颜色独立、跨图一致，实际渲染验收通过',JSON.stringify(result));app.exit(0);
 }catch(e){console.error(e);app.exit(1)}
});
