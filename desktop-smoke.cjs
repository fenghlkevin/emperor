const fs = require('node:fs');

async function runPackagedSmoke(app, window) {
  const output = process.env.EMPEROR_SMOKE_OUTPUT;
  const errors = [];
  window.webContents.on('console-message', event => {
    if (event.level === 'error') errors.push(event.message);
  });
  const timer = setTimeout(() => app.exit(1), 90000);
  const run = code => window.webContents.executeJavaScript(`(async()=>{${code}})()`);
  try {
    if (window.webContents.isLoading()) await new Promise(resolve => window.webContents.once('did-finish-load', resolve));
    await run(`
      document.querySelector('.opening-skip')?.click();
      document.querySelector('#new-dynasty').click();
      for(const [id,value] of [['name','发行验证'],['country-name','大晟'],['era-name','承平']])document.getElementById(id).value=value;
      document.querySelector('#create').requestSubmit();
      if(!document.querySelector('.scene.palace'))throw Error('新局未打开皇宫');
      document.querySelector('[data-entry="court"]').click();
      for(let i=0;document.querySelector('.court')?.dataset.courtReady!=='true';i++){
        if(i>=300)throw Error('朝堂立绘未就绪');await new Promise(r=>setTimeout(r,25));
      }
      if(document.querySelectorAll('.court-person-canvas').length<10)throw Error('朝堂立绘缺失');
      document.querySelector('#saves').click();
      if(!document.querySelector('dialog[open] #export')||!document.querySelector('dialog[open] #import'))throw Error('存档入口缺失');
      document.querySelector('dialog[open] .close').click();
      const s=JSON.parse(localStorage.getItem('emperor.save.v1'));
      if(s.name!=='发行验证'||s.scene!=='court')throw Error('进度未保存');
      const manifest=await import('./src/random-beauties-data.mjs');
      const images=['assets/scenes/palace/sketch-palace-color.png','assets/battle/card-troops-v1.png',manifest.RANDOM_BEAUTY_ART[0].asset];
      for(const src of images){const image=new Image();image.src=src;await image.decode();if(!image.naturalWidth)throw Error(src);const canvas=document.createElement('canvas');canvas.width=2;canvas.height=2;canvas.getContext('2d').drawImage(image,0,0,2,2);canvas.getContext('2d').getImageData(0,0,2,2);}
      await document.fonts.ready;
    `);
    await new Promise(resolve => {window.webContents.once('did-finish-load', resolve);window.reload();});
    await run(`document.querySelector('.opening-skip')?.click();document.querySelector('#continue').click();if(!document.querySelector('.game.is-court'))throw Error('续玩未恢复朝堂');`);
    if (errors.length) throw Error(errors.join('\n'));
    const result = {passed:true, packaged:app.isPackaged, version:app.getVersion(), platform:process.platform, arch:process.arch,
      checks:['standalone startup','new dynasty','court portraits and alpha canvases','local save','reload and continue','WebP images through legacy PNG URLs','font loading'],errors};
    if (output) fs.writeFileSync(output, JSON.stringify(result, null, 2));
    console.log(JSON.stringify(result));
    clearTimeout(timer);app.exit(0);
  } catch (error) {
    if (output) fs.writeFileSync(output, JSON.stringify({passed:false,error:String(error),errors}, null, 2));
    console.error(error);clearTimeout(timer);app.exit(1);
  }
}

module.exports = {runPackagedSmoke};
