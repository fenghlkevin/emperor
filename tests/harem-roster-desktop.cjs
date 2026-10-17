const {app,BrowserWindow}=require('electron');
const path=require('node:path'),fs=require('node:fs');
app.setPath('userData','/private/tmp/emperor-harem-roster-profile');
app.whenReady().then(async()=>{
 const w=new BrowserWindow({show:false,width:1440,height:1000,webPreferences:{contextIsolation:true,sandbox:true}});
 try{
 await w.loadFile(path.join(__dirname,'../index.html'));
 console.log(await w.webContents.executeJavaScript(`(async()=>{
 localStorage.clear();document.querySelector('#name').value='名册验收';document.querySelector('#create').requestSubmit();
 const state=JSON.parse(localStorage.getItem('emperor.save.v1'));
 const {openHarem}=await import('./src/harem-ui.mjs');
 const base=state.harem.members[0];if(!base)throw Error('missing initial member');
 state.harem.members=[{...base,id:'a',name:'西施',rank:0},{...base,id:'b',name:'林映秋',rank:null,pregnancy:{},inColdPalace:false}];
 const d=openHarem(state,document.querySelector('#app')||document.body,()=>{},()=>{});
 const assert=(ok,msg)=>{if(!ok)throw Error(msg);};
 assert(d.getBoundingClientRect().width>1200,'dialog remains narrow');
 const summon=d.querySelector('[data-arrange]'),grid=d.querySelector('.harem-choice-grid');
 assert(!grid.contains(summon)&&summon.getBoundingClientRect().right<grid.getBoundingClientRect().left,'summon is not separate on left');
 const change=(selector,value,type='change')=>{const el=d.querySelector(selector);el.value=value;el.dispatchEvent(new Event(type,{bubbles:true}));};
 change('[data-roster-query]','林','input');assert(d.querySelectorAll('[data-company]').length===1&&d.querySelector('[data-company]').dataset.company==='b','name search failed');
 change('[data-roster-status]','available');assert(!!d.querySelector('.harem-roster-empty'),'combined status filter failed');
 d.querySelector('[data-reset-filters]').click();assert(d.querySelectorAll('[data-company]').length===2,'reset failed');
 change('[data-roster-rank]','unranked');assert(d.querySelector('[data-company]').dataset.company==='b','rank filter failed');
 d.querySelector('[data-reset-filters]').click();
 state.harem.members=Array.from({length:15},(_,i)=>({...base,id:'many-'+i,name:'佳人'+i}));d.close();
 const many=openHarem(state,document.querySelector('#app')||document.body,()=>{},()=>{});
 const list=many.querySelector('.harem-choice-grid');assert(list.scrollHeight>list.clientHeight,'large roster does not scroll');
 const cards=[...list.querySelectorAll('.harem-choice')];
 for(let i=0;i<cards.length;i++){
 const card=cards[i],r=card.getBoundingClientRect(),copy=card.querySelector('.harem-card-copy').getBoundingClientRect(),art=card.querySelector('.harem-card-art').getBoundingClientRect();
 assert(copy.bottom<=art.top+1,'name and appearance must precede portrait');
 assert(card.scrollHeight<=card.clientHeight+1,'card content clipped');
 for(const next of cards.slice(i+1)){const n=next.getBoundingClientRect();if(Math.abs(n.left-r.left)<1)assert(n.top>=r.bottom,'roster rows overlap');}
 }
 const first=cards[0];first.scrollIntoView({block:'start'});
 for(const target of [first.querySelector('h3'),first.querySelector('dd')]){const r=target.getBoundingClientRect();assert(document.elementFromPoint(r.x+r.width/2,r.y+r.height/2)?.closest('.harem-choice')===first,'name or appearance click blocked');}
 list.scrollTop=list.scrollHeight;assert(many.querySelector('[data-arrange]').getBoundingClientRect().top>0,'summon scrolled away');
 many.close();openHarem({...state,harem:{...state.harem,members:[{...base,id:'a',name:'西施'},{...base,id:'b',name:'林映秋'}]}},document.querySelector('#app')||document.body,()=>{},()=>{});
 await new Promise(r=>setTimeout(r,700));
 return 'PASS: wide dialog, separate summon, name/rank/status combination, reset, empty state and independent scrolling';
 })()`));
 const out=path.join(__dirname,'../outputs/harem-roster');fs.mkdirSync(out,{recursive:true});fs.writeFileSync(path.join(out,'desktop.png'),(await w.webContents.capturePage()).toPNG());
 await w.setSize(900,700);
 console.log(await w.webContents.executeJavaScript(`(()=>{const d=document.querySelector('.royal-harem-dialog');if(d.scrollWidth>d.clientWidth+1)throw Error('horizontal overflow');return 'PASS: 900px layout';})()`));
 app.exit(0);
 }catch(e){console.error(e);app.exit(1);}
});
