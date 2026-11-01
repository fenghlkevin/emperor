const {app,BrowserWindow}=require('electron'),fs=require('node:fs'),path=require('node:path');
app.setPath('userData',`/private/tmp/emperor-quantity-layout-${process.pid}`);
app.whenReady().then(async()=>{
 const w=new BrowserWindow({show:false,width:1440,height:1000,webPreferences:{sandbox:true,contextIsolation:true,nodeIntegration:false,backgroundThrottling:false}});
 const run=code=>w.webContents.executeJavaScript(`(async()=>{${code}})()`),results=[],failures=[];
 const timer=setTimeout(()=>app.exit(1),180000);
 const scenarios=[
 ['transfer-out',`(await import('./src/central-military-transfers-ui.mjs')).openCentralTransfers(s,document.body,commit,close,{direction:'out'})`,`d.querySelector('[data-transfer-row=hebei]').open=true;`],
 ['transfer-in',`(await import('./src/central-military-transfers-ui.mjs')).openCentralTransfers(s,document.body,commit,close,{direction:'in'})`,`d.querySelector('[data-transfer-row=hebei]').open=true;`],
 ...['purchase','recruit','dismiss'].map(kind=>['garrison-'+kind,`(await import('./src/court-garrison-ui.mjs')).openCourtGarrison(s,document.body,commit,close,{kind:'${kind}'})`]),
 ['local-policy',`(await import('./src/court-personnel-ui.mjs')).openCourtPersonnel(s,document.body,commit,close,{view:'delegate',provinceId:'hebei'})`],
 ['food',`(await import('./src/food-relief-ui.mjs')).openFoodRelief(s,document.body,commit,close)`],
 ...['army','grain','finance'].map(tab=>['atlas-'+tab,`(await import('./src/court-atlas-ui.mjs')).openCourtAtlas(s,document.body,commit,close,{tab:'${tab}',fiscalKind:'subsidy'})`]),
 ...['subsidy','tax','repay'].map(tab=>['revenue-'+tab,`(await import('./src/revenue-ui.mjs')).openRevenue(s,document.body,commit,close,{tab:'${tab}'})`]),
 ...['develop','levy-militia','release-militia'].map(kind=>['works-'+kind,`(await import('./src/works-minister-ui.mjs')).openWorksMinister(s,document.body,commit,close,{kind:'${kind}'})`]),
 ...['develop','convert','plan','allocate','levy-militia','release-militia'].map(tab=>['industry-'+tab,`(await import('./src/construction-ui.mjs')).openConstruction(s,document.body,commit,close,{tab:'${tab}'})`]),
 ['justice',`(await import('./src/court-justice-ui.mjs')).openCourtJustice(s,document.body,commit,close)`],
 ['justice-legacy',`(await import('./src/justice-ui.mjs')).openJustice(s,document.body,commit,close)`],
 ...['budget','delegate'].map(kind=>['personnel-'+kind,`(await import('./src/court-personnel-ui.mjs')).openCourtPersonnel(s,document.body,commit,close,{view:'${kind}',provinceId:'hebei'})`]),
 ...['people','aid'].map(tab=>['national-'+tab,`(await import('./src/national-ui.mjs')).openNational(s,document.body,commit,close,{tab:'${tab}'})`]),
 ['recovery',`(await import('./src/army-recovery-ui.mjs')).openArmyRecovery(s,document.body,commit,close)`,`d.querySelector('[data-recovery-page=terms]').click();`],
 ...['trade','tribute','demand'].flatMap(tab=>[
 ['rites-'+tab,`(await import('./src/rites-ui.mjs')).openRites(s,document.body,commit,close)`,`d.querySelector('[data-rites-tab=${tab}]').click();`],
 ['negotiation-'+tab,`(await import('./src/court-negotiation-ui.mjs')).openCourtNegotiation(s,document.body,commit,close)`,`d.querySelector('[data-negotiation-kind=${tab}]').click();`],
 ]),
 ['secret',`(await import('./src/card-battle-secret-draft-ui.mjs')).openSecretDraft({},()=>{})`],
 ['landmark',`(await import('./src/card-battle-landmark-draft-ui.mjs')).openLandmarkDraft({},()=>{})`],
 ['weapon',`(await import('./src/card-battle-weapon-draft-ui.mjs')).openWeaponDraft(s,{commanderSquad:{kind:'infantry',count:10},squads:[]},()=>{})`],
 ['tactics',`(await import('./src/card-battle-tactics-ui.mjs')).openTacticDraft({cards:{catalog:{a:{side:'home',type:'tactic',definitionId:'strike'}}}},undefined,()=>{})`],
 ];
 try{
 await w.loadFile(path.join(__dirname,'../index.html'));
 await run(`document.querySelector('.opening-skip')?.click();window.base=(await import('./src/game.mjs')).createPlayableGame('数量布局');for(const r of base.domestic.diplomacy){if(r.countryIds.includes(base.domestic.playerCountryId)){r.relation='neutral';r.agreement.exports=1000;r.agreement.imports=1000;}}window.commit=n=>n;window.close=()=>{};`);
 for(const [width,height]of (process.argv.includes('--preview')?[[390,760]]:[[1440,1000],[900,680],[390,760]])){
 w.setSize(width,height);
 for(const [name,open,setup='']of scenarios){
 if(process.argv.includes('--preview')&&!['food','revenue-subsidy','personnel-budget'].includes(name))continue;
 try{
 await run(`document.querySelectorAll('dialog').forEach(d=>{d.close();d.remove()});window.s=structuredClone(base);if('${name}'.startsWith('rites-')||'${name}'.startsWith('negotiation-')){s.scene='palace';const countryId=s.domestic.countries.find(c=>c.id!==s.domestic.playerCountryId).id;s.envoyVisit={countryId,arrivalTurn:s.turn,appearance:(await import('./src/envoy-portraits.mjs')).assembleEnvoy(countryId,42)};}window.d=${open};${setup}`);
 await new Promise(r=>setTimeout(r,45));
 const result=await run(`const problems=[],fields=[];for(const i of d.querySelectorAll('input[type=number]')){if(!i.getClientRects().length||i.closest('details:not([open])'))continue;const r=i.getBoundingClientRect(),bar=i.nextElementSibling,style=getComputedStyle(i);if(!bar?.matches('.quantity-controls')){problems.push('缺少控件');continue;}const b=bar.getBoundingClientRect(),range=bar.querySelector('input'),rr=range.getBoundingClientRect();const canvas=document.createElement('canvas'),ctx=canvas.getContext('2d');ctx.font=style.font;const text=(i.max&&i.max.length>(i.value||'0').length)?i.max:(i.value||'0'),needed=ctx.measureText(text).width+parseFloat(style.paddingLeft)+parseFloat(style.paddingRight)+6;const info={label:i.getAttribute('aria-label')||i.name||JSON.stringify(i.dataset),value:i.value,width:r.width,needed,slider:rr.width};fields.push(info);if(r.width+1<needed)problems.push('数字裁切 '+JSON.stringify(info));if(b.top<r.bottom-1&&b.bottom>r.top+1)problems.push('滑条与数字重叠 '+info.label);if(rr.width<80)problems.push('滑条太窄 '+info.label);if(b.right>d.getBoundingClientRect().right+1||b.left<d.getBoundingClientRect().left-1)problems.push('控件溢出对话框 '+info.label);for(const button of bar.querySelectorAll('button')){const br=button.getBoundingClientRect();if(br.width<30||br.height<24)problems.push('按钮过小 '+info.label);}}return {fields,problems};`);
 if(!result.fields.length&&name!=='atlas-grain')result.problems.push('该分支未显示数量框，覆盖失败');
 results.push({name,width,...result});if(result.problems.length)failures.push({name,width,problems:result.problems});
 if(['food','garrison-recruit','garrison-purchase','secret','industry-plan','national-people','personnel-budget','revenue-subsidy'].includes(name)&&(width===1440||process.argv.includes('--preview')))fs.writeFileSync(`/private/tmp/quantity-layout-${name}-${width}.png`,(await w.webContents.capturePage()).toPNG());
 }catch(e){failures.push({name,width,error:String(e)});}
 }
 }
 fs.writeFileSync(process.argv.includes('--preview')?'/private/tmp/quantity-layout-preview.json':'/private/tmp/quantity-layout-audit.json',JSON.stringify({results,failures},null,2));
 console.log(JSON.stringify({screens:results.length,fields:results.reduce((n,r)=>n+r.fields.length,0),failures},null,2));clearTimeout(timer);app.exit(failures.length?1:0);
 }catch(e){console.error(e);clearTimeout(timer);app.exit(1);}
});
