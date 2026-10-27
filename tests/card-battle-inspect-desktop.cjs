const {app,BrowserWindow}=require('electron'),fs=require('node:fs'),path=require('node:path');
app.setPath('userData','/private/tmp/emperor-card-inspect-'+process.pid);
app.whenReady().then(async()=>{
 const w=new BrowserWindow({show:false,width:1440,height:1000,webPreferences:{sandbox:true,contextIsolation:true,nodeIntegration:false,backgroundThrottling:false}}),checks=[],errors=[];
 const run=code=>w.webContents.executeJavaScript(`(async()=>{${code}})()`),pause=ms=>new Promise(r=>setTimeout(r,ms));
 const check=async(code,label)=>{if(!await run(`return (${code});`))throw Error(label);checks.push(label);console.log('Check: '+label);};
 const shot=async name=>fs.writeFileSync(path.join(__dirname,'../docs/screenshots/'+name),(await w.webContents.capturePage()).toPNG());
 const focus=async side=>{await run(`window.id=window.bs.domestic.war.battle.cards.players[${JSON.stringify(side)}].board[0];const el=window.bd.querySelector('[data-card="'+window.id+'"]');el.focus();el.dispatchEvent(new FocusEvent('focus')); `);await pause(80);};
 const click=async selector=>{const p=await run(`const e=window.bd.querySelector(${JSON.stringify(selector)});e.scrollIntoView({block:'nearest'});const r=e.getBoundingClientRect();return{x:Math.round(r.x+r.width/2),y:Math.round(r.y+r.height/2)};`);for(const type of ['mouseMove','mouseDown','mouseUp'])w.webContents.sendInputEvent({type,...p,button:'left',clickCount:1});await pause(80);};
 w.webContents.on('console-message',({level,message})=>{if(level==='error')errors.push(message);});
 const timeout=setTimeout(()=>app.exit(1),90000);
 try{
  await w.loadFile(path.join(__dirname,'../index.html'));
  await run(`const {createCardBattleEffectsPreview}=await import('./scripts/card-battle-effects-preview-state.mjs'),{drawCardBattle}=await import('./src/card-battle-ui.mjs'),{validateSave}=await import('./src/game.mjs');window.bs=createCardBattleEffectsPreview();const d=document.createElement('dialog');document.body.append(d);window.bd=d;window.bv=drawCardBattle(d,()=>window.bs,s=>{validateSave(s);window.bs=s;},()=>{},{isPaused:()=>true});d.showModal();window.before=JSON.stringify(window.bs);`);
  await focus('enemy');
  await check(`(()=>{const p=window.bd.querySelector('.cb-inspect-attributes');return p&&p.textContent.includes('兵力倍率')&&p.textContent.includes('训练')&&p.textContent.includes('主将')&&p.textContent.includes('四舍五入');})()`,'new battle shows manpower, training, officers, commander and rounding sources');
  await shot('card-battle-attributes-inspect.png');
  await run(`window.bd.querySelector('.cb-inspect-attributes details').open=true;`);
  await check(`(()=>{const p=window.bd.querySelector('.cb-inspect-attributes');return p.querySelector('details').open&&p.scrollWidth<=p.clientWidth+1;})()`,'expanded calculation stays readable within the details panel');
  await shot('card-battle-attributes-calculation.png');
  await run(`window.bd.querySelector('.cb-inspect-attributes details').open=false;`);
  await check(`(()=>{const p=window.bd.querySelector('.cb-inspect');return !p.hidden&&p.querySelector('.cb-inspect-portrait .cb-art')&&p.querySelector('.cb-inspect-values .attack')&&p.querySelector('[data-inspect-status="silence"] svg')&&p.querySelector('[data-inspect-status="freeze"] svg');})()`,'negative inspection has actual card art, combat values and separate freeze/silence icons');
  await shot('card-battle-inspect-negative.png');
  const crop=await run(`const r=window.bd.querySelector('.cb-inspect').getBoundingClientRect();return {x:Math.floor(r.x)-5,y:Math.floor(r.y)-5,width:Math.ceil(r.width)+10,height:Math.ceil(r.height)+10};`);fs.writeFileSync(path.join(__dirname,'../docs/screenshots/card-battle-inspect-detail.png'),(await w.webContents.capturePage(crop)).toPNG());
  await focus('home');
  await check(`(()=>{const p=window.bd.querySelector('.cb-inspect');return p.querySelectorAll('.cb-inspect-effect.positive').length===3&&p.querySelectorAll('.cb-inspect-effect.negative').length===1&&p.querySelector('.cb-inspect-roster').textContent.includes('训练')&&p.querySelector('.cb-inspect-source').textContent.includes('军阵来源');})()`,'mixed inspection keeps every real state, expiry and army provenance');
  await check(`(()=>{const p=window.bd.querySelector('.cb-inspect'),source=p.querySelector('.cb-inspect-source').getBoundingClientRect(),roster=p.querySelector('.cb-inspect-roster').getBoundingClientRect(),title=p.querySelector('h3').getBoundingClientRect(),heading=p.querySelector('.cb-inspect-copy>header>small').getBoundingClientRect();return source.top>=roster.bottom&&Math.abs(title.left-heading.left)<2&&title.top>=heading.bottom;})()`,'title and source stay in their own columns without inherited dialog header/footer overlap');
  await shot('card-battle-inspect-mixed.png');
  await click('.cb-inspect-breakdown summary');
  await check(`window.bd.querySelector('.cb-inspect-breakdown').open&&!window.bd.querySelector('.cb-inspect').hidden&&window.bd.querySelector('.cb-inspect-breakdown').textContent.includes('持续修正')`,'pointer can enter the panel and open the exact stat calculation');
  w.webContents.sendInputEvent({type:'keyDown',keyCode:'Escape'});w.webContents.sendInputEvent({type:'keyUp',keyCode:'Escape'});await pause(50);
  await check(`window.bd.open&&window.bd.querySelector('.cb-inspect').hidden`,'Escape dismisses details and keeps battle open');
  for(const [width,height]of [[1440,1000],[1000,800],[800,650]]){
   w.setSize(width,height);await pause(100);await run(`document.activeElement?.blur();`);await focus('home');
   await check(`(()=>{const p=window.bd.querySelector('.cb-inspect'),a=p.getBoundingClientRect(),s=window.bd.querySelector('.cb-stage').getBoundingClientRect(),v=window.bd.querySelector('[data-card="'+window.id+'"] .cb-card-surface').getBoundingClientRect();return a.left>=s.left&&a.right<=s.right+1&&a.top>=s.top&&a.bottom<=s.bottom+1&&(a.left>=v.right||a.right<=v.left)&&p.querySelector('.cb-inspect-copy').scrollWidth<=p.querySelector('.cb-inspect-copy').clientWidth+1;})()`,width+'px panel stays inside battle beside the card without horizontal text overflow');
   await shot('card-battle-inspect-'+width+'.png');
  }
  await check(`JSON.stringify(window.bs)===window.before`,'inspection and disclosure controls never change battle state');
  await run(`window.bd.querySelector('[data-inspect-close]').click();`);await check(`window.bd.querySelector('.cb-inspect').hidden`,'close control dismisses card details');
  w.setSize(1000,800);await pause(80);await run(`const c=window.bs.domestic.war.battle.cards,x=c.catalog[c.players.home.board[0]];Object.assign(x,{buffAttack:4,tempAttack:2,buffHealth:3,attack:x.printedAttack+6,hp:x.printedHp+3,maxHp:x.printedHp+3,tags:['shield','taunt','rush','stealth','anti','anti_horse','pierce'],frozen:true,silenced:true});x.definition.tags=[];window.bv.refresh();`);await focus('home');
  await check(`(()=>{const p=window.bd.querySelector('.cb-inspect');p.querySelector('[data-inspect-status="silence"]').scrollIntoView({block:'nearest'});const a=p.getBoundingClientRect(),last=p.querySelector('[data-inspect-status="silence"]').getBoundingClientRect();return p.querySelectorAll('[data-inspect-status]').length>=12&&p.scrollHeight>p.clientHeight&&last.bottom<=a.bottom&&last.top>=a.top;})()`,'full status combination remains individually visible and scrollable within the bounded panel');
  for(const [kind,fixture,selector,artClass,copy]of [['weapon','weapons','[data-equipped-weapon="home"]','.cb-weapon-art','完整套装1人份'],['secret','secrets','[data-own-secret]','.cb-secret-art','亲卫'],['landmark','landmarks','.cb-row.home .landmark','.cb-landmark-art','不新增建筑']]){
   const origin=JSON.parse(fs.readFileSync(path.join(__dirname,'../docs/fixtures/card-'+fixture+'-engine-base.json'),'utf8'));
   await run(`window.bd.close();window.bd.remove();const {drawCardBattle}=await import('./src/card-battle-ui.mjs'),{advanceWar}=await import('./src/war.mjs'),{validateSave}=await import('./src/game.mjs');window.bs=${JSON.stringify(origin)};if(window.bs.domestic.war.battle.cards.phase==='mulligan')window.bs=advanceWar(window.bs,{type:'mulligan',ids:[]});let c=window.bs.domestic.war.battle.cards,p=c.players.home;const x=Object.values(c.catalog).find(x=>x.side==='home'&&x.type===${JSON.stringify(kind)});for(const z of ['hand','deck'])p[z]=p[z].filter(id=>id!==x.id);p.hand.push(x.id);p.mana=p.maxMana=10;window.bs=advanceWar(window.bs,{type:'play',id:x.id});validateSave(window.bs);const d=document.createElement('dialog');document.body.append(d);window.bd=d;window.bv=drawCardBattle(d,()=>window.bs,s=>{validateSave(s);window.bs=s;},()=>{},{isPaused:()=>true});d.showModal();window.before=JSON.stringify(window.bs);const e=d.querySelector(${JSON.stringify(selector)});e.click();e.dispatchEvent(new FocusEvent('focus'));`);
   await pause(100);await check(`(()=>{const p=window.bd.querySelector('.cb-inspect');return !p.hidden&&p.querySelector(${JSON.stringify(artClass)})&&p.textContent.includes(${JSON.stringify(copy)})&&JSON.stringify(window.bs)===window.before;})()`,kind+' details retain their real illustration and source without changing state');
   await shot('card-battle-inspect-'+kind+'.png');
  }
  if(errors.length)throw Error(errors.join('\n'));
  fs.writeFileSync(path.join(__dirname,'../docs/card-battle-inspect-validation.json'),JSON.stringify({date:new Date().toISOString(),checks,errors},null,2)+'\n');clearTimeout(timeout);console.log('Card inspection passed: '+checks.length+' checks.');app.exit(0);
 }catch(e){console.error(e);console.error(errors);console.error(await run(`return {active:document.activeElement?.outerHTML.slice(0,180),inspect:window.bd.querySelector('.cb-inspect').outerHTML.slice(0,1200)};`));await shot('card-battle-inspect-failure.png');clearTimeout(timeout);app.exit(1);}
});
