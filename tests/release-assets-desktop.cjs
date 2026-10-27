const {app,BrowserWindow,protocol,net}=require('electron');
const fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const {installReleaseAssets}=require('../desktop-assets.cjs');
app.setPath('userData',path.join(os.tmpdir(),`emperor-release-protocol-${process.pid}`));
app.whenReady().then(async()=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'emperor-release-assets-'));
 fs.mkdirSync(path.join(root,'assets'));
 fs.writeFileSync(path.join(root,'assets/图片.webp'),Buffer.from('UklGRh4AAABXRUJQVlA4TBEAAAAvAQAAEA+w//Mf8x8xMqL/AQA=','base64'));
 fs.writeFileSync(path.join(root,'release-assets.json'),JSON.stringify({version:1,assets:{'assets/图片.png':'assets/图片.webp'}}));
 fs.writeFileSync(path.join(root,'fixture.mjs'),'window.releaseFixture=7;');
 fs.writeFileSync(path.join(root,'index.html'),'<html><body><script type="module" src="fixture.mjs"></script></body></html>');
 const w=new BrowserWindow({show:false,webPreferences:{sandbox:true,contextIsolation:true,nodeIntegration:false}});
 const timer=setTimeout(()=>app.exit(1),20000);
 try{
  if(!installReleaseAssets({protocol,net},root))throw Error('Release handler did not install');
  await w.loadFile(path.join(root,'index.html'));
  const result=await w.webContents.executeJavaScript(`(async()=>{if(window.releaseFixture!==7)throw Error('Module file fallback failed');const img=new Image();img.src='assets/图片.png?v=old-save';await img.decode();const canvas=document.createElement('canvas');canvas.width=2;canvas.height=1;const ctx=canvas.getContext('2d');ctx.drawImage(img,0,0);const data=ctx.getImageData(0,0,2,1).data;if(data[0]!==255||data[3]!==255||data[7]!==0)throw Error('Image pixel/alpha mismatch');return {width:img.naturalWidth,legacyURL:img.src,pixelsReadable:true,moduleLoaded:true};})()`);
  console.log(JSON.stringify(result));clearTimeout(timer);app.exit(0);
 }catch(e){console.error(e);clearTimeout(timer);app.exit(1);}
});
