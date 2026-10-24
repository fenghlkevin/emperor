// Finite army cards: every troop card owns a disjoint share of a reserved stack.
const names={infantry:'刀盾兵',spears:'长枪兵',cavalry:'轻骑兵','heavy-cavalry':'重骑兵',archers:'弓兵',crossbows:'弩兵',camel:'骆驼骑兵',elephant:'象兵','horse-archers':'弓骑兵'};
const bases={infantry:[2,2,3,'guard'],spears:[3,3,4,'guard'],cavalry:[3,3,3,'rush'],'heavy-cavalry':[5,5,5,'rush'],archers:[3,3,2,'shot'],crossbows:[4,4,3,'shot'],camel:[4,4,4,'rush'],elephant:[6,6,7,'guard'],'horse-archers':[4,4,3,'shot']};
export const TACTICS={supply:{name:'军需调度',cost:3,text:'抽两张牌'},arrows:{name:'万箭齐发',cost:4,text:'对所有敌方部队造成2点伤害'},inspire:{name:'整军鼓舞',cost:2,text:'恢复主将4点军心'},coin:{name:'调兵令',cost:0,text:'本回合获得1点军令'}};
const other=s=>s==='home'?'enemy':'home';
const leader=(b,s)=>b.units.find(u=>u.side===s&&u.commander);
export function commanderSkill(g={}){return (g.intelligence??0)>(g.martial??0)?{name:'运筹',text:'抽一张牌',kind:'draw'}:(g.leadership??g.martial??0)>=80?{name:'振军',text:'恢复4点军心',kind:'heal'}:{name:'督战',text:'对敌方主将造成2点伤害',kind:'strike'};}
function random(c){c.seed=(Math.imul(c.seed,1664525)+1013904223)>>>0;return c.seed/4294967296;}
function heroDamage(c,s,n){c.players[s].hero-=n;c.players[s].heroDamage+=n;}
function draw(c,s){const p=c.players[s];if(!p.deck.length){heroDamage(c,s,++p.fatigue);return;}const id=p.deck.shift();(p.hand.length<10?p.hand:p.grave).push(id);}
export function attachCards(b,{rulesVersion=2}={}){
 const c=b.cards={version:1,rulesVersion,seed:(b.command.id*7919+17)>>>0,turn:'home',phase:'mulligan',ply:1,selected:[],players:{},catalog:{}};
 for(const s of ['home','enemy']){
  const p=c.players[s]={hero:30,maxMana:s==='home'?1:0,mana:s==='home'?1:0,hand:[],deck:[],board:[],grave:[],fatigue:0,powerUsed:false,heroDamage:0};
  const army=b.units.filter(u=>u.side===s&&!u.commander),parts=Math.max(1,Math.min(6,Math.floor(24/Math.max(1,army.length))));
  for(const u of army){const n=Math.min(parts,u.initial);for(let i=0;i<n;i++){
   const count=Math.floor(u.initial/n)+(i<u.initial%n?1:0),[cost,a,h,ability]=bases[u.kind],g=u.general??{},size=Math.min(6,Math.floor(Math.log2(Math.max(1,count)/100+1))),trained=Math.floor(u.training/40),martial=Math.floor((g.martial??0)/40),defense=Math.floor((g.intelligence??0)/60),hp=h+(rulesVersion>=2?4:0)+size+trained+defense+Math.floor((leader(b,s).general?.leadership??0)/50)+(s===(b.field?.defenderSide??'enemy')?Math.round(((b.field?.defense??1)-1)*4):0);
   const id=`${u.id}-${i}`;c.catalog[id]={id,type:'troop',side:s,unitId:u.id,name:names[u.kind],kind:u.kind,general:g.name,count,cost,attack:Math.max(1,Math.round((a+size+trained+martial)*(u.equipmentFactor??1))),hp,maxHp:hp,ability,ready:false,damage:0};p.deck.push(id);
  }}
  for(let i=p.deck.length;i<30;i++){const kind=['supply','arrows','inspire'][i%3],id=`${s}-t${i}`;c.catalog[id]={id,type:'tactic',side:s,kind,...TACTICS[kind]};p.deck.push(id);}
  for(let i=p.deck.length-1;i>0;i--){const j=Math.floor(random(c)*(i+1));[p.deck[i],p.deck[j]]=[p.deck[j],p.deck[i]];}
  for(let i=0;i<(s==='home'?3:4);i++)draw(c,s);
 }
 const id='enemy-coin';c.catalog[id]={id,type:'tactic',side:'enemy',kind:'coin',...TACTICS.coin};c.players.enemy.hand.push(id);
 b.log=['军阵已成：选择要替换的起手牌，再开始交战。'];return b;
}
function update(b){
 const c=b.cards;
 for(const s of ['home','enemy']){const p=c.players[s];for(const id of [...p.board])if(c.catalog[id].hp<=0){p.board.splice(p.board.indexOf(id),1);p.grave.push(id);}}
 for(const u of b.units.filter(u=>!u.commander)){
  const cards=Object.values(c.catalog).filter(x=>x.unitId===u.id);u.dead=cards.reduce((n,x)=>n+Math.min(x.count,Math.ceil(x.count*Math.min(x.maxHp,x.damage)/x.maxHp)),0);u.count=u.initial-u.dead;
 }
 for(const s of ['home','enemy']){const u=leader(b,s);u.dead=Math.ceil(u.initial*Math.min(30,c.players[s].heroDamage)/60);u.count=u.initial-u.dead;}
 const homeDead=c.players.home.hero<=0,enemyDead=c.players.enemy.hero<=0;
 if(homeDead||enemyDead){const loser=homeDead?'home':'enemy',u=leader(b,loser);u.fled=true;b.result=loser==='home'?'defeat':'victory';c.phase='ended';}
 b.log=b.log.slice(-30);
}
function hurt(c,id,n){const x=c.catalog[id];x.hp-=n;x.damage+=n;}
// A single explanation for action availability, also used by the battlefield UI.
export function cardAttackStatus(b,id){
 const c=b.cards,x=c.catalog[id];
 if(b.result||c.phase==='ended')return {code:'ended',label:'战斗结束',reason:'战斗已结束，请结算战果。'};
 if(c.phase!=='play')return {code:'deployment',label:'未开战',reason:'请先点击“开始交战”。'};
 if(!x||!c.players[x.side]?.board.includes(id))return {code:'hand',label:'未上场',reason:'手牌不能直接攻击，请先把部队牌打到战场。'};
 if(c.turn!==x.side)return {code:'opponent',label:'敌方回合',reason:'现在是敌方回合，等敌军行动结束后再攻击。'};
 if(!x.ready){
  if(x.attackedPly===c.ply)return {code:'spent',label:'已攻击',reason:'这支部队本回合已经攻击过，下个己方回合才能再次攻击。'};
  if(x.enteredPly===c.ply)return {code:'summoned',label:'刚上场',reason:'这支部队刚上场，本回合不能攻击；下个己方回合可攻击。'};
  return {code:'waiting',label:'待命',reason:'这支部队本回合不能攻击，下个己方回合恢复行动。'};
 }
 return {code:'ready',label:x.rushing?'突袭就绪':'可攻击',reason:x.rushing?'选择高亮的敌方部队；突袭登场当回合不能攻击主将。':'选择高亮的敌方部队或主将发动攻击。'};
}
export function legalCardAttacks(b,id){const c=b.cards,p=c.players[c.turn],x=c.catalog[id],enemy=c.players[other(c.turn)];if(c.phase!=='play'||!p.board.includes(id)||!x.ready)return [];const guards=enemy.board.filter(id=>c.catalog[id].ability==='guard');return guards.length?guards:[...enemy.board,...(x.rushing?[]:['hero'])];}
export function actCards(original,action){
 const b=structuredClone(original),c=b.cards;if(!c||b.result)throw Error('战斗已结束或不是卡牌战场');const s=c.turn,p=c.players[s],enemy=c.players[other(s)];
 if(action.type==='retreat'){for(const u of b.units.filter(u=>u.side===s))u.fled=true;b.result=s==='home'?'defeat':'victory';c.phase='ended';c.retreated=s;b.log.push('全军撤退，生还部队携装归营。');return b;}
 if(c.phase==='mulligan'){
  if(action.type!=='mulligan')throw Error('请先确认起手牌');const ids=action.ids??[];if(!Array.isArray(ids)||new Set(ids).size!==ids.length||ids.some(id=>!p.hand.includes(id)))throw Error('起手牌无效');
  p.hand=p.hand.filter(id=>!ids.includes(id));for(const id of ids)draw(c,s);p.deck.push(...ids);for(let i=p.deck.length-1;i>0;i--){const j=Math.floor(random(c)*(i+1));[p.deck[i],p.deck[j]]=[p.deck[j],p.deck[i]];}draw(c,s);c.phase='play';b.log.push('我军先行，战斗开始。');return b;
 }
 if(action.type==='play'){
  const x=c.catalog[action.id];if(!p.hand.includes(action.id)||!x||x.cost>p.mana)throw Error('手牌或军令不足');if(x.type==='troop'&&p.board.length>=7)throw Error('战场最多七支部队');
  p.mana-=x.cost;p.hand.splice(p.hand.indexOf(x.id),1);
  if(x.type==='troop'){p.board.push(x.id);x.enteredPly=c.ply;x.ready=x.ability==='rush';x.rushing=x.ready;if(x.ability==='shot')heroDamage(c,other(s),1);}
  else{p.grave.push(x.id);if(x.kind==='supply'){draw(c,s);draw(c,s);}else if(x.kind==='inspire')p.hero=Math.min(30,p.hero+4);else if(x.kind==='arrows')for(const id of enemy.board)hurt(c,id,2);else if(x.kind==='coin')p.mana=Math.min(10,p.mana+1);}
  b.log.push(`${s==='home'?'我军':'敌军'}打出${x.name}。`);
 }else if(action.type==='attack'){
  if(!legalCardAttacks(b,action.id).includes(action.target))throw Error('目标受护卫保护，或部队本回合不能攻击');const x=c.catalog[action.id];x.ready=false;x.attackedPly=c.ply;
  if(action.target==='hero')heroDamage(c,other(s),x.attack);else{const t=c.catalog[action.target];hurt(c,t.id,x.attack);hurt(c,x.id,t.attack);}b.log.push(`${x.general}率${x.name}攻击${action.target==='hero'?'对方主将':c.catalog[action.target].name}，造成${x.attack}点伤害${action.target==='hero'?'':`，自身受到${c.catalog[action.target].attack}点反击伤害`}。`);
 }else if(action.type==='power'){
  if(p.powerUsed||p.mana<2)throw Error('主将技本回合已使用或军令不足');const skill=commanderSkill(leader(b,s).general);p.mana-=2;p.powerUsed=true;
  if(skill.kind==='draw')draw(c,s);else if(skill.kind==='heal')p.hero=Math.min(30,p.hero+4);else heroDamage(c,other(s),2);b.log.push(`${leader(b,s).general.name}发动${skill.name}。`);
 }else if(action.type==='end'){
  c.turn=other(s);c.ply++;b.round=Math.ceil(c.ply/2);const q=c.players[c.turn];q.maxMana=Math.min(10,q.maxMana+1);q.mana=q.maxMana;q.powerUsed=false;for(const id of q.board){c.catalog[id].ready=true;c.catalog[id].rushing=false;}draw(c,c.turn);
  // Long engagements exhaust morale, ensuring a finite result even with healing.
  if(c.ply>80)heroDamage(c,c.turn,c.ply-80);
 }else throw Error('无效卡牌军令');update(b);return b;
}
export function cardAI(b){const c=b.cards,p=c.players[c.turn];if(c.phase==='mulligan')return {type:'mulligan',ids:p.hand.filter(id=>c.catalog[id].cost>3)};
 const play=p.hand.map(id=>c.catalog[id]).filter(x=>x.cost<=p.mana&&(x.type!=='troop'||p.board.length<7)).sort((a,b)=>(b.type==='troop')-(a.type==='troop')||b.cost-a.cost)[0];if(play)return {type:'play',id:play.id};
 for(const id of p.board){const targets=legalCardAttacks(b,id);if(targets.length){const target=targets.includes('hero')&&c.players[other(c.turn)].hero<=c.catalog[id].attack?'hero':targets.find(t=>t!=='hero'&&c.catalog[t].hp<=c.catalog[id].attack)??targets.at(-1);return {type:'attack',id,target};}}
 const skill=commanderSkill(leader(b,c.turn).general);if(p.mana>=2&&!p.powerUsed&&(skill.kind!=='heal'||p.hero<30))return {type:'power'};return {type:'end'};
}
export function validateCards(b){
 const c=b.cards;if(!c||![1,2].includes(c.rulesVersion??1)||c.version!==1||!['home','enemy'].includes(c.turn)||!['mulligan','play','ended'].includes(c.phase)||!Number.isSafeInteger(c.ply)||c.ply<1||!Number.isSafeInteger(c.seed))throw Error('卡牌战场存档无效');
 const expected=attachCards(structuredClone(b),{rulesVersion:c.rulesVersion??1}).cards.catalog;
 if(JSON.stringify(Object.keys(c.catalog).sort())!==JSON.stringify(Object.keys(expected).sort()))throw Error('军阵牌库无效');
 for(const [id,x] of Object.entries(c.catalog)){for(const key of ['id','type','side','unitId','name','kind','general','count','cost','attack','maxHp','ability','text'])if(x[key]!==expected[id][key])throw Error('卡牌属性无效');if(x.type==='troop'&&(x.hp!==x.maxHp-x.damage||typeof x.ready!=='boolean'))throw Error('卡牌兵力无效');}
 const seen=new Set();for(const s of ['home','enemy']){const p=c.players[s];if(!p||!Number.isSafeInteger(p.hero)||p.hero>30||!Number.isInteger(p.mana)||p.mana<0||p.mana>10||!Number.isInteger(p.maxMana)||p.maxMana<0||p.maxMana>10||p.hand.length>10||p.board.length>7||!Number.isInteger(p.fatigue)||p.fatigue<0||typeof p.powerUsed!=='boolean'||!Number.isSafeInteger(p.heroDamage)||p.heroDamage<0)throw Error('卡牌资源无效');
 for(const zone of ['hand','deck','board','grave']){if(!Array.isArray(p[zone]))throw Error('卡牌区域无效');for(const id of p[zone]){const x=c.catalog[id];if(seen.has(id)||!x||x.side!==s||(zone==='board'&&x.type!=='troop'))throw Error('卡牌来源或位置无效');seen.add(id);}}
 }
 if(seen.size!==Object.keys(c.catalog).length)throw Error('卡牌丢失');
 for(const u of b.units.filter(u=>!u.commander)){const rows=Object.values(c.catalog).filter(x=>x.unitId===u.id);if(rows.reduce((n,x)=>n+x.count,0)!==u.initial||rows.some(x=>!Number.isInteger(x.hp)||x.hp>x.maxHp||x.maxHp<1||!Number.isInteger(x.damage)||x.damage<0||!Number.isInteger(x.attack)||x.attack<1))throw Error('部队牌兵籍无效');const dead=rows.reduce((n,x)=>n+Math.min(x.count,Math.ceil(x.count*Math.min(x.maxHp,x.damage)/x.maxHp)),0);if(u.dead!==dead)throw Error('部队伤亡不一致');}
 const defeated=c.players.home.hero<=0?'defeat':c.players.enemy.hero<=0?'victory':null;if((!c.retreated&&b.result!==defeated)||(!!b.result!==(c.phase==='ended'))||(c.retreated&&!['home','enemy'].includes(c.retreated)))throw Error('卡牌胜负无效');
 for(const s of ['home','enemy']){const u=leader(b,s),dead=Math.ceil(u.initial*Math.min(30,c.players[s].heroDamage)/60);if(u.dead!==dead)throw Error('亲卫伤亡无效');}
}
