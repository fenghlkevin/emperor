const {app,BrowserWindow}=require('electron'),fs=require('node:fs'),path=require('node:path');
app.setPath('userData','/private/tmp/card-surface-readability-'+process.pid);
app.whenReady().then(async()=>{
 const w=new BrowserWindow({show:false,webPreferences:{sandbox:true,contextIsolation:true,nodeIntegration:false,backgroundThrottling:false}}),errors=[];
 w.webContents.on('console-message',({level,message})=>{if(level==='error')errors.push(message);});
 try{
  await w.loadFile(path.join(__dirname,'../index.html'));
  const result=await w.webContents.executeJavaScript(`(async()=>{
   const {drawCardSurface,CARD_SURFACE_EFFECTS,ADDITIONAL_CARD_SURFACE_EFFECTS}=await import('./src/card-battle-surface-renderer.mjs'),effects=[...CARD_SURFACE_EFFECTS,...ADDITIONAL_CARD_SURFACE_EFFECTS],results=[];
   const surface=(keys,width,ratio)=>{const canvas=document.createElement('canvas');canvas.width=Math.round(width*1.12*ratio);canvas.height=Math.round(width*1.4*1.12*ratio);return {canvas,ctx:canvas.getContext('2d'),pixelRatio:ratio,game:true,u:{id:'measure-1',seed:.63,keys,burst:0,burstKeys:[]}};};
   const measure=s=>{const {canvas,ctx}=s,p=ctx.getImageData(0,0,canvas.width,canvas.height).data;let ink=0,centerInk=0;for(let y=0;y<canvas.height;y++)for(let x=0;x<canvas.width;x++){const i=(y*canvas.width+x)*4,high=Math.max(p[i],p[i+1],p[i+2]),a=p[i+3]/255;if(high>=140)ink+=a*high/255;const nx=x/canvas.width*112-6,ny=y/canvas.height*156.8-8.4;if(nx>30&&nx<70&&ny>50&&ny<95)centerInk+=a;}return {ink:ink/s.pixelRatio**2,centerInk:centerInk/s.pixelRatio**2};};
   for(const width of [80,96,144])for(const ratio of [1,2])for(const e of effects){const s=surface([e.id],width,ratio),frames=[];let minInk=Infinity;for(const time of [2200,4300,6900,9200]){drawCardSurface(s,time);minInk=Math.min(minInk,measure(s).ink);frames.push(s.canvas.toDataURL());}if(minInk<width*.28)throw Error(e.id+' is too faint at '+width+'px/'+ratio+'x: '+minInk);if(new Set(frames).size!==frames.length)throw Error(e.id+' stopped animating');results.push({id:e.id,width,ratio,minInk:Number(minInk.toFixed(1))});}
   const full=surface(effects.map(e=>e.id),96,2);drawCardSurface(full,4600);const combined=measure(full);if(combined.centerInk>1)throw Error('combined effects obscure the protected portrait center');
   const army=Array.from({length:14},(_,i)=>{const s=surface(effects.map(e=>e.id),96,2);s.u.seed=i*.63;return s;}),timings=[];for(let i=0;i<12;i++){await new Promise(r=>requestAnimationFrame(r));const start=performance.now();for(const s of army)drawCardSurface(s,5000+i*34);timings.push(performance.now()-start);}timings.sort((a,b)=>a-b);
   return {cases:results.length,effects:effects.length,results,combined,renderMs:{median:Number(timings[6].toFixed(1)),max:Number(timings.at(-1).toFixed(1))}};
  })()`);
  if(errors.length)throw Error(errors.join('\n'));fs.writeFileSync(path.join(__dirname,'../docs/card-battle-surface-readability-validation.json'),JSON.stringify({date:new Date().toISOString(),...result,errors},null,2)+'\n');console.log('Effect readability passed: '+result.cases+' size/density cases; fourteen-card render '+JSON.stringify(result.renderMs)+'ms.');app.exit(0);
 }catch(e){console.error(e);app.exit(1);}
});
