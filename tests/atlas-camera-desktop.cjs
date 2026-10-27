const {app,BrowserWindow}=require('electron');
const path=require('node:path'),fs=require('node:fs');
app.setPath('userData',`/private/tmp/emperor-atlas-camera-${process.pid}`);
app.whenReady().then(async()=>{
 const w=new BrowserWindow({show:false,width:1440,height:1000,webPreferences:{sandbox:true,contextIsolation:true}});
 try{
  await w.loadFile(path.join(__dirname,'../index.html'));
  const result=await w.webContents.executeJavaScript(`(async()=>{
   const {newGame}=await import('./src/game.mjs'),{openDomestic}=await import('./src/domestic-ui.mjs');
   const {occupyProvince}=await import('./src/occupation.mjs'),{territoryView,localMapRegions}=await import('./src/territory-atlas.mjs');
   const state=newGame('同图取景'),root=document.querySelector('#app');
   const initialView=territoryView(localMapRegions(state.domestic));
   for(const id of ['siberia','japan','franks'])occupyProvince(state.domestic,id,1);
   const before=JSON.stringify(state);openDomestic(state,root);
   const d=root.querySelector('dialog[open]');
   const geometry=()=>[...d.querySelectorAll('.civil-map path.realm,.civil-map path.province,.civil-map .atlas-base-land')].map(p=>[p.dataset.country??p.dataset.province??'land',p.getAttribute('d')]);
   const world=JSON.stringify(geometry());
   d.querySelector('[data-home]').click();
   if(d.dataset.level!=='province'||world!==JSON.stringify(geometry()))throw Error('国内另画了地图');
   const svg=d.querySelector('.civil-map'),view=svg.getAttribute('viewBox').split(' ').map(Number);
   const expected=territoryView(localMapRegions(state.domestic));
   if(JSON.stringify(view)!==JSON.stringify(expected)||view[2]<=initialView[2])throw Error('占领后的国内范围未扩大');
   for(const id of ['siberia','japan','franks'])if(!svg.querySelector('path.realm.home[data-country="'+id+'"]'))throw Error('国内缺少占领区 '+id);
   if(svg.querySelector('.atlas-river'))throw Error('仍绘制河流');
   // Make the neutral north visible, then test browser hit testing against the
   // actual country clip. A cell covering this point must not steal the click.
   svg.setAttribute('viewBox','-20 -82 200 122');
   await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));
   const added=(await import('./src/campaign-map.mjs')).realmGeometry.find(r=>r.id==='forestland');const p=svg.createSVGPoint();p.x=added.center[0];p.y=-added.center[1];const client=p.matrixTransform(svg.getScreenCTM());
   const hit=document.elementFromPoint(client.x,client.y);
   if(!hit||hit.closest('[data-country]')?.dataset.country!=='forestland')throw Error('新增北方国家不可点击');
   d.querySelector('[data-reset]').click();
   if(world!==JSON.stringify(geometry()))throw Error('切回天下改变几何');
   if(JSON.stringify(state)!==before)throw Error('取景写入存档');
   return {countries:svg.querySelectorAll('path.realm').length,domesticView:view,neutralHit:hit.tagName};
  })()`);
  console.log('同一地图、占领后自动扩大、新增外围国家可点击、无河流验收通过',JSON.stringify(result));
  app.exit(0);
 }catch(e){console.error(e);app.exit(1)}
});
