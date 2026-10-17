const {app,BrowserWindow}=require('electron');
const path=require('node:path');const fs=require('node:fs');
app.setPath('userData','/private/tmp/emperor-domestic-test');
app.whenReady().then(async()=>{
 const w=new BrowserWindow({show:false,width:1360,height:950,webPreferences:{sandbox:true,contextIsolation:true,nodeIntegration:false}});
 const run=async code=>{try{return await w.webContents.executeJavaScript(code);}catch(e){console.error('验收步骤:',code);throw e;}};
 w.webContents.on('console-message',event=>console.log('渲染日志:',event.message));
 const screenshot=async name=>{await new Promise(r=>setTimeout(r,180));fs.writeFileSync(`/private/tmp/emperor-domestic-${name}.png`,(await w.webContents.capturePage()).toPNG());};
 try{
  await w.webContents.session.clearStorageData();await w.loadFile(path.join(__dirname,'../index.html'));
  await run(`document.querySelector('#name').value='内政验收帝';document.querySelector('#create').requestSubmit();document.querySelector('[data-scene="court"]').click();document.querySelector('[data-entry="revenue-deputy"]').click();if(!document.querySelector('.ink-intro')||document.querySelectorAll('.realm').length!==34)throw Error('初始全球地图不完整');`);
  await run(`(()=>{
    const svg=document.querySelector('.civil-map'),matrix=svg.getScreenCTM();
    const hit=([x,y])=>{const point=new DOMPoint(-12+x/1586*162,-64+y/992*66).matrixTransform(matrix);return document.elementsFromPoint(point.x,point.y).find(el=>el.matches('path.realm,path.province'));};
    for(const point of [[1400,500],[1300,600],[1220,650],[850,700],[350,310]])if(hit(point))throw Error('海面或湖面可点选领土:'+point);
    for(const point of [[1320,400],[1300,480],[1250,540]])if(!hit(point)?.matches('.province'))throw Error('沿海陆地未连通:'+point);
  })()`);
  await screenshot('world');
  await run(`document.querySelector('path[data-country="sheng"]').dispatchEvent(new KeyboardEvent('keydown',{key:'Enter',bubbles:true}));if(document.querySelector('.civil-detail-title h2').textContent!=='大晟')throw Error('国家选择失败');for(const tab of ['overview','finance','economy','welfare','status','detail']){document.querySelector('[data-tab="'+tab+'"]').click();if(!document.querySelector('.civil-info').textContent.includes('大晟'))throw Error('报表失败:'+tab);}document.querySelector('[data-tab="finance"]').click();if(!document.querySelector('.civil-info').textContent.includes('武装购买'))throw Error('支出指标缺失');`);
  await screenshot('country');
  await run(`document.querySelector('[data-in]').click();if(document.querySelectorAll('path.province').length!==10)throw Error('州分区缺失');document.querySelector('path[data-province="shannan"]').dispatchEvent(new MouseEvent('click',{bubbles:true}));if(document.querySelector('.civil-detail-title h2').textContent!=='山南')throw Error('州选择失败');document.querySelector('[data-tab="detail"]').click();if(!document.querySelector('.civil-info').textContent.includes('开发率'))throw Error('州产业详情缺失');const svg=document.querySelector('.civil-map');const before=svg.getAttribute('viewBox');document.querySelector('[data-in]').click();if(svg.getAttribute('viewBox')===before)throw Error('缩放失败');document.querySelector('[data-zoom-country]').click();document.querySelector('path[data-province="shannan"]').dispatchEvent(new MouseEvent('click',{bubbles:true}));`);
  await run(`(()=>{
    const svg=document.querySelector('.civil-map'),matrix=svg.getScreenCTM(),rect=svg.getBoundingClientRect();
    for(const [pixel,land]of [[[1300,480],true],[[1270,550],true],[[1300,560],false],[[1230,650],false]]){
      const p=new DOMPoint(-12+pixel[0]/1586*162,-64+pixel[1]/992*66).matrixTransform(matrix);
      if(p.x<rect.left||p.x>=rect.right||p.y<rect.top||p.y>=rect.bottom)continue;
      const target=document.elementsFromPoint(p.x,p.y).find(el=>el.matches('path.realm,path.province'));
      if(Boolean(target)!==land)throw Error('放大后海岸裁剪不一致:'+pixel);
    }
  })()`);
  await screenshot('province');
  await run(`document.querySelector('[data-reset]').click();document.querySelector('path[data-country="rome"]').dispatchEvent(new MouseEvent('click',{bubbles:true}));if(document.querySelector('.civil-detail-title h2').textContent!=='罗马')throw Error('邻邦详情失败');document.querySelector('.domestic-dialog .close').click();`);
  await new Promise(r=>setTimeout(r,50));
  await run(`document.querySelector('#next').click();document.querySelector('#domestic').click();document.querySelector('[data-home]').click();document.querySelector('[data-tab="finance"]').click();if(!document.querySelector('.civil-info').textContent.includes('期末国库'))throw Error('结算历史缺失');`);
  w.setSize(900,680);await new Promise(r=>setTimeout(r,150));
  const layout=await run(`(()=>{const d=document.querySelector('.domestic-dialog').getBoundingClientRect();return {left:d.left,right:d.right,bottom:d.bottom,width:innerWidth,height:innerHeight};})()`);
  if(layout.left<0||layout.right>layout.width||layout.bottom>layout.height)throw Error('内政小窗口溢出');
  await screenshot('small');
  await run(`document.querySelector('.domestic-dialog .close').click();`);await new Promise(r=>setTimeout(r,50));await w.reload();await new Promise(r=>setTimeout(r,100));
  await run(`if(!document.querySelector('#continue'))throw Error('存档重载失败');document.querySelector('#continue').click();document.querySelector('#domestic').click();document.querySelector('[data-home]').click();document.querySelector('[data-tab="finance"]').click();if(!document.querySelector('.civil-info').textContent.includes('期末国库'))throw Error('内政结算未持久保存');`);
  console.log('内政验收通过：户部入口、全球/本国/10州、六报表、缩放、邻邦、结算、持久存档、900×680布局。');app.exit(0);
 }catch(e){console.error(e);app.exit(1);}
});
