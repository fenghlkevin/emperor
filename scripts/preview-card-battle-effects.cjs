const {app,BrowserWindow}=require('electron'),path=require('node:path'),fs=require('node:fs'),crypto=require('node:crypto');
const checking=process.argv.includes('--check'),slot=crypto.createHash('sha256').update(path.resolve(__dirname,'..')).digest('hex').slice(0,12);
app.setPath('userData','/private/tmp/emperor-card-effects-preview-'+slot+(checking?'-check':''));
process.on('SIGINT',()=>app.quit());process.on('SIGTERM',()=>app.quit());
app.whenReady().then(async()=>{
 const w=new BrowserWindow({show:!checking,width:1440,height:1000,title:'军阵卡牌 · 增益与负面特效试玩',webPreferences:{sandbox:true,contextIsolation:true,nodeIntegration:false,backgroundThrottling:false}}),errors=[];
 const run=s=>w.webContents.executeJavaScript(`(async()=>{${s}})()`);
 w.webContents.on('console-message',({level,message})=>{if(level==='error'){errors.push(message);console.error(message);}});w.on('page-title-updated',e=>e.preventDefault());
 try{
  await w.loadFile(path.join(__dirname,'../index.html'));
  await run(`const {createCardBattleEffectsPreview}=await import('./scripts/card-battle-effects-preview-state.mjs'),{drawCardBattle}=await import('./src/card-battle-ui.mjs'),{validateSave}=await import('./src/game.mjs');let state=createCardBattleEffectsPreview();const resets=new WeakSet();window.cardEffectsDemoSnapshot=()=>JSON.parse(JSON.stringify(state));const open=()=>{const d=document.createElement('dialog');document.body.append(d);d.addEventListener('close',()=>{d.remove();if(!resets.has(d))window.close();});let view;view=drawCardBattle(d,()=>state,s=>{validateSave(s);state=s;},()=>window.close(),{opponentAction:()=>({type:'end'}),decorate:({dialog,busy})=>{const tools=dialog.querySelector('.cb-header-tools'),reset=document.createElement('button');reset.textContent='重置演示';reset.dataset.effectsReset='';reset.disabled=busy;reset.onclick=()=>{view.dispose();resets.add(d);d.close();state=createCardBattleEffectsPreview();open();};tools.prepend(reset);dialog.querySelector('[data-close]').textContent='退出演示 ×';}});d.showModal();window.cardEffectsDemoDialog=d;};open();`);
  const summary=await run(`const b=window.cardEffectsDemoSnapshot().domestic.war.battle,c=b.cards;return {mana:c.players.home.mana,home:c.players.home.board.map(id=>({name:c.catalog[id].name,frozen:c.catalog[id].frozen})),hand:c.players.home.hand.map(id=>c.catalog[id].name),emitters:[...window.cardEffectsDemoDialog.querySelectorAll('.cb-row .cb-state-canvas')].map(e=>e.dataset.stateEffects)};`);
  console.log('CARD_EFFECTS_DEMO_READY '+JSON.stringify(summary));
  if(process.argv.includes('--card-details'))await run(`const c=window.cardEffectsDemoSnapshot().domestic.war.battle.cards,id=c.players.enemy.board[0],el=window.cardEffectsDemoDialog.querySelector('[data-card="'+id+'"]');el.focus();el.dispatchEvent(new FocusEvent('focus'));`);
  if(process.argv.includes('--card-aim')){
   await run(`const c=window.cardEffectsDemoSnapshot().domestic.war.battle.cards,id=c.players.home.hand.find(id=>c.catalog[id].definitionId==='pin');window.cardEffectsDemoDialog.querySelector('.cb-hand [data-card="'+id+'"]').click();`);
   await new Promise(r=>setTimeout(r,220));const point=await run(`const c=window.cardEffectsDemoSnapshot().domestic.war.battle.cards,r=window.cardEffectsDemoDialog.querySelector('[data-card="'+c.players.enemy.board[0]+'"]').getBoundingClientRect();return{x:Math.round(r.x+r.width/2),y:Math.round(r.y+r.height/2)};`);w.webContents.sendInputEvent({type:'mouseMove',...point});
  }
  if(checking){
   await new Promise(r=>setTimeout(r,1800));const before=await run(`return [...document.querySelectorAll('.cb-row .cb-state-canvas')].map(c=>c.toDataURL());`);await new Promise(r=>setTimeout(r,450));
   const verified=await run(`return [...document.querySelectorAll('.cb-row .cb-state-canvas')].every((c,i)=>c.toDataURL()!==${JSON.stringify(before)}[i])&&window.cardEffectsDemoSnapshot().domestic.war.battle.cards.players.home.mana===10&&document.querySelectorAll('.cb-hand [data-card]').length===5;`);
   if(!verified||errors.length)throw Error('特效演示未通过持续动画和技能准备验证 '+errors.join('\n'));
   if(process.argv.includes('--card-aim')){const crop=await run(`const a=window.cardEffectsDemoDialog.querySelector('.cb-aim');if(a.dataset.aimLocked!=='true')throw Error('瞄准目标未锁定');const r=a.querySelector('[data-aim-line]').getBoundingClientRect();return{x:Math.floor(r.x)-24,y:Math.floor(r.y)-24,width:Math.ceil(r.width)+48,height:Math.ceil(r.height)+48};`);fs.writeFileSync(path.join(__dirname,'../docs/screenshots/card-battle-aim-detail.png'),(await w.webContents.capturePage(crop)).toPNG());}
   fs.writeFileSync(path.join(__dirname,'../docs/screenshots/card-battle-effects-playground.png'),(await w.webContents.capturePage()).toPNG());await run(`window.cardEffectsDemoDialog.querySelector('[data-effects-reset]').click();`);const reset=await run(`const c=window.cardEffectsDemoSnapshot().domestic.war.battle.cards;return c.players.home.mana===10&&c.players.home.hand.length===5&&window.cardEffectsDemoDialog.open;`);if(!reset)throw Error('重置演示未恢复技能与军令');console.log('CARD_EFFECTS_DEMO_CHECK_PASSED');app.exit(0);
  }
 }catch(e){console.error(e);if(checking)app.exit(1);}
});
app.on('window-all-closed',()=>app.quit());
