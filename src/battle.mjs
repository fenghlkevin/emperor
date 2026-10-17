// Deterministic hex combat. Each piece is a stack, never an individual soldier.
export const COLS=13,ROWS=9;
export const troopNames={cavalry:'轻骑兵',infantry:'刀盾兵',spears:'长枪兵','heavy-cavalry':'重骑兵',archers:'弓兵',crossbows:'弩兵',camel:'骆驼骑兵',elephant:'象兵','horse-archers':'弓骑兵'};
const clamp=n=>Math.max(0,Math.min(100,Number.isFinite(n)?n:50));
export function bonuses(g={}){return {attack:1+clamp(g.martial)*.003+clamp(g.experience??0)*.001,defense:1+clamp(g.intelligence)*.002+clamp(g.experience??0)*.001,speed:clamp(g.leadership??g.intelligence)>=80?1:0,aura:1+clamp(g.leadership??g.intelligence)*.0015+clamp(g.experience??0)*.0005};}
export function neighbors(x,y){return [[x-1,y],[x+1,y],[x-(y%2?0:1),y-1],[x+(y%2?1:0),y-1],[x-(y%2?0:1),y+1],[x+(y%2?1:0),y+1]].filter(([a,b])=>a>=0&&a<COLS&&b>=0&&b<ROWS);}
export function alive(u){return u.count>0&&!u.fled;}
export function active(b){return b.units.find(u=>u.id===b.order[b.cursor]&&alive(u));}
export const movement=u=>(['cavalry','camel','horse-archers'].includes(u.kind)?4:['crossbows','elephant'].includes(u.kind)?2:3)+u.bonus.speed;
export const adjacent=(a,b)=>neighbors(a.x,a.y).some(([x,y])=>x===b.x&&y===b.y);
export function hexDistance(a,b){const ax=a.x-(a.y-(a.y&1))/2,bx=b.x-(b.y-(b.y&1))/2;return (Math.abs(ax-bx)+Math.abs(a.y-b.y)+Math.abs(ax+a.y-bx-b.y))/2;}
// Six directions, counterclockwise from east. Front covers three hex faces.
export const facingOf=u=>u.facing??(u.side==='enemy'?3:0);
export function directionTo(a,t){const dx=(t.x-a.x)*2+(t.y%2)-(a.y%2),dy=(t.y-a.y)*Math.sqrt(3);let angle=Math.atan2(-dy,dx);return (Math.round(angle/(Math.PI/3))+6)%6;}
export function attackAspect(a,t){const delta=Math.abs(directionTo(t,a)-facingOf(t)),d=Math.min(delta,6-delta);return d===3?{name:'背击',multiplier:1.4}:d===2?{name:'侧击',multiplier:1.2}:{name:'正面',multiplier:1};}
export function reachable(b,u=active(b)){
 if(!u||u.moved||!alive(u))return [];
 const seen=new Set([`${u.x},${u.y}`]),out=[],q=[{x:u.x,y:u.y,d:0,path:[]}],occupied=new Set(b.units.filter(alive).map(v=>`${v.x},${v.y}`));
 for(let i=0;i<q.length;i++){
  const p=q[i];if(p.d>=movement(u))continue;
  for(const [x,y]of neighbors(p.x,p.y)){
   const k=`${x},${y}`;if(seen.has(k)||occupied.has(k))continue;
   seen.add(k);const cell={x,y,d:p.d+(b.field?.terrain==='高山型'&&mounted(u)?2:1),path:[...p.path,{x,y}]};if(cell.d<=movement(u)){q.push(cell);out.push(cell);}
  }
 }
 return out;
}
export function movementPath(b,u,x,y){if(u.x===x&&u.y===y)return [];return reachable(b,u).find(p=>p.x===x&&p.y===y)?.path??null;}
export const isRanged=u=>['archers','crossbows','horse-archers'].includes(u.kind);
export const shootingRange=u=>u.kind==='archers'?4:['crossbows','horse-archers'].includes(u.kind)?3:0;
export function canShoot(b,u,t){return isRanged(u)&&hexDistance(u,t)>1&&hexDistance(u,t)<=shootingRange(u)&&!b.units.some(v=>alive(v)&&v.side!==u.side&&adjacent(u,v));}
export function attackOptions(b,u=active(b)){
 if(!u||!alive(u)||b.result)return [];
 const cells=[{x:u.x,y:u.y,d:0,path:[]},...reachable(b,u)];
 return b.units.filter(t=>alive(t)&&t.side!==u.side).flatMap(t=>{
  const approaches=cells.filter(p=>adjacent(p,t)||canShoot(b,{...u,x:p.x,y:p.y},t)).sort((a,c)=>a.d-c.d||a.y-c.y||a.x-c.x);
  return approaches.length?[{targetId:t.id,approaches}]:[];
 });
}
const mounted=u=>['cavalry','heavy-cavalry','camel','elephant','horse-archers'].includes(u.kind);
const ordinaryHorse=u=>['cavalry','heavy-cavalry','horse-archers'].includes(u.kind);
const kitCounter=(a,t)=>a.kind==='camel'&&ordinaryHorse(t)?1.35:a.kind==='spears'&&mounted(t)?1.5:mounted(a)&&t.kind==='spears'?.75:a.kind==='infantry'&&t.kind==='spears'?1.25:a.kind==='spears'&&t.kind==='infantry'?.85:mounted(a)&&t.kind==='infantry'?1.2:1;
export const chargeMultiplier=(b,a,t)=>a.kind==='heavy-cavalry'&&(a.chargeRun??0)>=2&&a.chargeFacing===directionTo(a,t)?1.3:1;
function trackCharge(u,path){
 let previous=u;for(const p of path){const facing=directionTo(previous,p);u.chargeRun=facing===u.chargeFacing?(u.chargeRun??0)+1:1;u.chargeFacing=facing;previous=p;}
}
export function damageEstimate(b,a,t,{retaliationFactor=1}={}){
 const aura=side=>b.units.find(u=>u.side===side&&u.commander&&alive(u))?.bonus.aura??1;
 const shot=canShoot(b,a,t),rangedFactor=isRanged(a)?(shot?(a.moved?(a.kind==='horse-archers'?1:a.kind==='archers'?.7:.6):1):(a.kind==='horse-archers'?.5:a.kind==='archers'?.4:.35)):1;
 const aspect=shot?1:attackAspect(a,t).multiplier,armor=t.kind==='heavy-cavalry'?(shot&&a.kind==='crossbows'?1.05:1.25):1;
 return Math.min(t.count,Math.max(1,Math.round(a.count*.24*retaliationFactor*rangedFactor*(a.kind==='horse-archers'&&shot?.75:1)*(a.kind==='camel'&&b.field?.surface==='desert'?1.2:1)*(a.kind==='elephant'?1.25:1)*(a.equipmentFactor??1)*(b.field?.terrain==='丘陵型'&&mounted(a)?.9:1)*(.6+a.training/100)*a.bonus.attack*aura(a.side)*kitCounter(a,t)*aspect*(a.commander?1.2:1)*(a.kind==='heavy-cavalry'?1.15:1)*chargeMultiplier(b,a,t)/((t.side===(b.field?.defenderSide??'enemy')?(b.field?.defense??1):1)*t.bonus.defense*aura(t.side)*(t.defending?1.2:1)*armor))));
}
export function attackPreview(b,u,t,from){
 const option=attackOptions(b,u).find(o=>o.targetId===t.id);if(!option)return null;
 const p=from?option.approaches.find(p=>p.x===from.x&&p.y===from.y):option.approaches[0];if(!p)return null;
 // Simulate the same hit/turn/retaliation sequence as the real action.
 const copy=structuredClone(b),a=copy.units.find(v=>v.id===u.id),target=copy.units.find(v=>v.id===t.id);trackCharge(a,p.path);a.x=p.x;a.y=p.y;a.facing=directionTo(a,target);a.defending=false;a.moved=!!(a.moved||p.path.length);
 const shot=canShoot(copy,a,target),aspect=shot?{name:'射击',multiplier:1}:attackAspect(a,target),canRetaliate=adjacent(a,target)&&!target.retaliated&&damageEstimate(copy,a,target)<target.count;
 const charge=chargeMultiplier(copy,a,target);hit(copy,a,target);
 return {mode:shot?'ranged':'melee',range:shootingRange(a),movedShot:shot&&a.moved&&a.kind!=='horse-archers',mobileShot:shot&&a.moved&&a.kind==='horse-archers',desertBonus:a.kind==='camel'&&b.field?.surface==='desert',retaliationSuppression:a.kind==='elephant'?.5:1,armorPiercing:shot&&a.kind==='crossbows',killed:t.count-target.count,retaliation:u.count-a.count,canRetaliate:canRetaliate&&target.retaliated,counter:kitCounter(u,t),chargeMultiplier:charge,aspect:aspect.name,directionMultiplier:aspect.multiplier,commanderMultiplier:u.commander?1.2:1,path:p.path,from:{x:p.x,y:p.y}};
}
function order(b){b.order=b.units.filter(alive).sort((a,c)=>movement(c)-movement(a)||(a.side===c.side?a.id.localeCompare(c.id):a.side==='home'?-1:1)).map(u=>u.id);b.cursor=0;}
export function createBattle({command,friendly,enemy,training,enemyTraining,targetName,field}){let id=0;const units=[];for(const [side,army]of [['home',friendly],['enemy',enemy]])army.forEach((u,i)=>units.push({...u,id:`u${id++}`,side,x:u.commander?(side==='home'?0:12):(command.deploymentVersion===2||army.length>10)?(side==='home'?(i%2?3:2):(i%2?8:10)):(side==='home'?2:10),y:u.commander?4:army.length===2?4:Math.round((army.slice(0,i).filter(v=>!v.commander).length)*8/Math.max(1,army.filter(v=>!v.commander).length-1)),facing:side==='enemy'?3:0,count:u.count,initial:u.count,dead:0,fled:false,defending:false,retaliated:false,waited:false,moved:false,bonus:bonuses(u.general),training:u.training??(side==='home'?training:enemyTraining)}));const b={...(field?{field}:{}),version:2,command,targetName,units,round:1,cursor:0,order:[],log:['两军列阵，战斗开始。'],result:null};order(b);check(b);return b;}
export function check(b){const home=b.units.some(u=>u.side==='home'&&u.commander&&alive(u)),enemy=b.units.some(u=>u.side==='enemy'&&u.commander&&alive(u));b.result=!home?'defeat':!enemy?'victory':null;return b.result;}
export function battleResultText(b){if(!b.result)return '';const loser=b.result==='victory'?'敌军':'我军',commander=b.units.find(u=>u.commander&&u.side===(b.result==='victory'?'enemy':'home'));return `${loser}${commander?.fled?'全军撤退':'主将失去战斗能力'}，战斗结束。`;}
function hit(b,a,t,retaliation=false,retaliationFactor=1){if(retaliation)a.chargeRun=0;const shot=canShoot(b,a,t),aspect=shot?{name:'射击',multiplier:1}:attackAspect(a,t),charge=chargeMultiplier(b,a,t),n=damageEstimate(b,a,t,{retaliationFactor});a.chargeRun=0;a.facing=directionTo(a,t);t.count-=n;t.dead+=n;b.log.push(`${a.name}${retaliation?'反击':''}攻击${t.name}（${aspect.name}${aspect.multiplier>1?' +'+Math.round((aspect.multiplier-1)*100)+'%':''}${shot&&a.moved&&a.kind!=='horse-archers'?' · 移动射击衰减':''}${a.kind==='camel'&&b.field?.surface==='desert'?' · 沙地 +20%':''}${a.kind==='elephant'?' · 冲击压制反击':''}${shot&&a.kind==='crossbows'?' · 穿甲':''}${a.commander?' · 主将 +20%':''}${charge>1?' · 冲锋 +30%':''}），阵亡 ${n} 人。`);if(alive(t)&&!shot)t.facing=directionTo(t,a);if(!check(b)&&alive(t)&&adjacent(a,t)&&!t.retaliated&&!retaliation){t.retaliated=true;hit(b,t,a,true,a.kind==='elephant'?.5:1);}}
function next(b){b.log=b.log.slice(-30);if(check(b))return;do{b.cursor++;if(b.cursor>=b.order.length){b.round++;for(const u of b.units){u.defending=false;u.retaliated=false;u.waited=false;u.moved=false;u.chargeRun=0;delete u.chargeFacing;}order(b);b.log.push(`第 ${b.round} 回合。`);}}while(!active(b));b.log=b.log.slice(-30);}
export function actBattle(original,action){
 const b=structuredClone(original);if(b.result)throw Error('战斗已结束');const u=active(b);if(!u)throw Error('当前部队无效');
 if(action.type==='retreat'){for(const t of b.units.filter(t=>t.side===u.side&&alive(t)))t.fled=true;b.log.push(`${u.side==='home'?'我军':'敌军'}全军撤退。`);b.log=b.log.slice(-30);check(b);return b;}
 if(action.type==='move'){
  const path=movementPath(b,u,action.x,action.y);if(!path?.length)throw Error(u.moved?'本队已移动，请攻击或结束行动':'无法移动到此处');
  u.defending=false;trackCharge(u,path);u.facing=directionTo(path.length>1?path.at(-2):u,path.at(-1));u.x=action.x;u.y=action.y;u.moved=true;b.log.push(`${u.name}移动 ${path.length} 格，可攻击范围内敌军或结束行动。`);b.log=b.log.slice(-30);return b;
 }else if(action.type==='attack'){
  const t=b.units.find(t=>t.id===action.target&&alive(t)&&t.side!==u.side);if(!t)throw Error('攻击目标无效');
  const option=attackOptions(b,u).find(o=>o.targetId===t.id);if(!option)throw Error(u.moved?'移动后目标不在攻击范围或被贴身压制':'敌军超出本次移动与攻击范围');
  const p=action.from?option.approaches.find(p=>p.x===action.from.x&&p.y===action.from.y):option.approaches[0];if(!p)throw Error('攻击落点不可达');
  u.defending=false;trackCharge(u,p.path);u.x=p.x;u.y=p.y;u.facing=directionTo(u,t);u.moved=!!(u.moved||p.path.length);hit(b,u,t);u.moved=true;
 }else if(action.type==='defend'){u.chargeRun=0;u.defending=true;b.log.push(`${u.name}防御，本回合防御提高20%。`);
 }else if(action.type==='end'){u.chargeRun=0;b.log.push(`${u.name}结束行动。`);
 }else if(action.type==='wait'){
  if(u.waited||u.moved)throw Error(u.moved?'移动后不能等待':'本回合已等待');u.waited=true;u.chargeRun=0;
  const pending=b.order.slice(b.cursor+1),normal=pending.filter(id=>!b.units.find(t=>t.id===id).waited),waiting=[...pending.filter(id=>b.units.find(t=>t.id===id).waited),u.id];
  waiting.sort((a,c)=>movement(b.units.find(t=>t.id===a))-movement(b.units.find(t=>t.id===c))||c.localeCompare(a));
  b.order=[...b.order.slice(0,b.cursor+1),...normal,...waiting];b.log.push(`${u.name}等待，回合末按速度由慢至快行动。`);
 }else throw Error('战斗指令无效');
 next(b);return b;
}
export function aiAction(b){
 const u=active(b);if(!u||b.result)throw Error('当前部队无效');
 const options=attackOptions(b,u).flatMap(o=>o.approaches.map(from=>{const target=b.units.find(t=>t.id===o.targetId),p=attackPreview(b,u,target,from),landing={...u,...p.from,count:u.count-p.retaliation},enemies=b.units.filter(t=>alive(t)&&t.side!==u.side&&(t.id!==target.id||p.killed<t.count)),exposure=Math.max(0,...enemies.filter(t=>adjacent(landing,t)).map(t=>damageEstimate(b,{...t,count:t.count-(t.id===target.id?p.killed:0)},landing))),safety=isRanged(u)&&enemies.length?Math.min(...enemies.map(t=>hexDistance(landing,t))):0;return {targetId:o.targetId,from:p.from,fatal:p.retaliation+exposure>=u.count,score:p.killed-p.retaliation*.8+(p.killed===target.count?30:0)+(target.commander?8:0)-exposure*.35+safety*(u.kind==='horse-archers'?2:.25),distance:from.d};})).filter(o=>!(u.commander&&o.fatal)).sort((a,c)=>c.score-a.score||a.distance-c.distance);
 if(options.length)return {type:'attack',target:options[0].targetId,from:options[0].from};
 if(u.moved)return {type:'end'};
 const targets=b.units.filter(t=>alive(t)&&t.side!==u.side),cells=reachable(b,u);
 if(u.commander&&b.units.some(t=>t.side===u.side&&!t.commander&&alive(t))){const safety=p=>Math.min(...targets.map(t=>hexDistance(p,t))),current=safety(u),safe=cells.sort((a,c)=>safety(c)-safety(a)||a.d-c.d)[0];return current<=5&&safe&&safety(safe)>current?{type:'move',x:safe.x,y:safe.y}:{type:'defend'};}
 const occupied=new Set(b.units.filter(t=>alive(t)&&t.id!==u.id).map(t=>`${t.x},${t.y}`)),cost=new Map(),queue=[];
 // Flood from all free attack positions. This can route around a friendly screen
 // even when the first step temporarily increases straight-line hex distance.
 for(const t of targets)for(const [x,y]of (isRanged(u)?Array.from({length:COLS*ROWS},(_,i)=>[i%COLS,Math.floor(i/COLS)]).filter(([x,y])=>canShoot(b,{...u,x,y},t)):neighbors(t.x,t.y))){const k=`${x},${y}`;if(!occupied.has(k)&&!cost.has(k)){cost.set(k,0);queue.push({x,y});}}
 for(let i=0;i<queue.length;i++){const c=queue[i],d=cost.get(`${c.x},${c.y}`);for(const [x,y]of neighbors(c.x,c.y)){const k=`${x},${y}`;if(!occupied.has(k)&&!cost.has(k)){cost.set(k,d+1);queue.push({x,y});}}}
 const distance=p=>cost.get(`${p.x},${p.y}`)??Infinity;
 const p=cells.sort((a,c)=>distance(a)-distance(c)||a.d-c.d)[0];
 return p&&distance(p)<distance(u)?{type:'move',x:p.x,y:p.y}:{type:'defend'};
}
export function validateBattle(b){if(b?.field?.surface!==undefined&&!['normal','desert'].includes(b.field.surface))throw Error('战场地表无效');if(b?.command?.kitVersion!==1)throw Error('套装战场版本无效');if(b?.command?.deploymentVersion!==undefined&&(b.command.deploymentVersion!==2||b.command.deploymentVersion===2&&b.command.kitVersion!==1||b.command.defensive!==true))throw Error('战场部署版本无效');if(b?.field?.defenderSide!==undefined&&!['home','enemy'].includes(b.field.defenderSide))throw Error('守方标记无效');if(b?.field&&(!['平原型','河海型','高山型','丘陵型'].includes(b.field.terrain)||!Number.isFinite(b.field.defense)||b.field.defense<1||b.field.defense>1.5))throw Error('战场城防地形无效');const fail=()=>{throw Error('战场存档无效');};if(!b||b.version!==2||!Array.isArray(b.units)||b.units.length<2||b.units.length>(24)||!Number.isSafeInteger(b.round)||b.round<1||!Array.isArray(b.order)||!Number.isSafeInteger(b.cursor)||b.cursor<0||b.cursor>=b.order.length||!Array.isArray(b.log)||b.log.length>30||b.log.some(l=>typeof l!=='string'||l.length>500)||![null,'victory','defeat'].includes(b.result)||!b.command||b.command.kind!=='war'||!Array.isArray(b.command.squads)||b.command.squads.length<(b.command.deploymentVersion===2?0:1)||b.command.squads.length>6)fail();const ids=new Set(),positions=new Set();for(const u of b.units){if(!u||(u.equipmentFactor!==undefined&&(!Number.isFinite(u.equipmentFactor)||u.equipmentFactor<.5||u.equipmentFactor>1))||typeof u.id!=='string'||ids.has(u.id)||!['home','enemy'].includes(u.side)||!Object.hasOwn(troopNames,u.kind)||typeof u.name!=='string'||!Number.isSafeInteger(u.x)||u.x<0||u.x>=COLS||!Number.isSafeInteger(u.y)||u.y<0||u.y>=ROWS||!Number.isSafeInteger(u.count)||u.count<0||!Number.isSafeInteger(u.initial)||u.initial<(u.commander?0:1)||u.count>u.initial||!Number.isSafeInteger(u.dead)||u.dead!==u.initial-u.count||typeof u.fled!=='boolean'||(!Number.isInteger(u.facing)||u.facing<0||u.facing>5)||(typeof u.moved!=='boolean')||(typeof u.waited!=='boolean')||(u.chargeRun!==undefined&&(!Number.isSafeInteger(u.chargeRun)||u.chargeRun<0||u.chargeRun>COLS*ROWS))||(u.chargeFacing!==undefined&&(!Number.isInteger(u.chargeFacing)||u.chargeFacing<0||u.chargeFacing>5))||!Number.isFinite(u.training)||u.training<0||u.training>100||!u.bonus||['attack','defense','aura'].some(k=>!Number.isFinite(u.bonus[k])||u.bonus[k]<1||u.bonus[k]>2)||![0,1].includes(u.bonus.speed))fail();ids.add(u.id);if(alive(u)){const k=`${u.x},${u.y}`;if(positions.has(k))fail();positions.add(k);}}if(b.order.some(id=>!ids.has(id)))fail();for(const side of ['home','enemy'])if(b.units.filter(u=>u.side===side&&u.commander).length!==1||b.units.filter(u=>u.side===side&&!u.commander).length>(side==='home'&&b.command.deploymentVersion===2||side==='enemy'&&b.command.kitVersion===1?(side==='enemy'?13:9):6))fail();const copy=structuredClone(b);const expected=check(copy);if(expected!==b.result||(!b.result&&!active(b)))fail();}
