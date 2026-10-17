const {app,BrowserWindow}=require('electron');
const path=require('node:path');
app.setPath('userData','/private/tmp/emperor-sidebar-check');
app.whenReady().then(async()=>{
 const w=new BrowserWindow({show:false,width:1360,height:1000});
 try{
  await w.loadFile(path.join(__dirname,'../index.html'));
  await w.webContents.executeJavaScript(`localStorage.clear();document.querySelector('#name').value='布局验收';document.querySelector('#create').requestSubmit()`);
  for(const [width,height] of [[1360,1000],[900,680],[1200,900],[900,500],[600,400],[1360,1200]]){
   w.setSize(width,height);
   await new Promise(r=>setTimeout(r,100));
   for(let collapsed=0;collapsed<2;collapsed++){
    const result=await w.webContents.executeJavaScript(`(()=>{const s=document.querySelector('.sidebar'),c=document.querySelector('.sidebar-content'),b=document.querySelector('#exit');s.scrollTop=100;return {scroll:s.scrollTop,bottom:b.getBoundingClientRect().bottom,limit:s.getBoundingClientRect().bottom,content:c.getBoundingClientRect().height,height:s.clientHeight,position:getComputedStyle(document.querySelector('.emperor-panel')).position}})()`);
    if(result.scroll!==0||result.bottom>result.limit+1||result.content>result.height+1||result.position!=='relative')throw Error(JSON.stringify({width,height,collapsed,...result}));
    await w.webContents.executeJavaScript(`document.querySelector('[data-emperor-toggle]').click()`);
    await new Promise(r=>setTimeout(r,50));
   }
  }
  console.log('Sidebar fits all six window sizes, expanded and collapsed; scrolling is disabled.');app.exit(0);
 }catch(e){console.error(e);app.exit(1);}
});
