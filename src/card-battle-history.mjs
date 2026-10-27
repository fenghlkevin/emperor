// Public, persistent action history. No hidden hand/deck snapshots or random streams.
const canonical=x=>Array.isArray(x)?x.map(canonical):x&&typeof x==='object'?Object.fromEntries(Object.keys(x).sort().map(k=>[k,canonical(x[k])])):x;
const checksum=x=>{let h=2166136261;for(const c of JSON.stringify(canonical(x)))h=Math.imul(h^c.charCodeAt(0),16777619);return h>>>0;};
const sessions=new WeakMap(),other=s=>s==='home'?'enemy':'home';
const ref=(b,id)=>{
 if(id?.endsWith('-hero')){const side=id.slice(0,-5),u=b.units.find(u=>u.side===side&&u.commander);return {id,side,type:'hero',name:u?.general?.name??(side==='home'?'我方主将':'敌方主将')};}
 if(/^enemy-secret-seal-[1-9][0-9]*$/.test(id)&&Object.values(b.cards.catalog).some(x=>x.secretSeal===id))return {id,side:'enemy',type:'secret',name:'未知奥秘'};
 const x=b.cards.catalog[id];if(x?.type==='secret'&&x.side==='enemy'&&!x.secretRevealed&&x.secretSeal)return {id:x.secretSeal,side:'enemy',type:'secret',name:'未知奥秘'};return x?{id:x.id,side:x.side,type:x.type,name:x.name}:null;
};
function stats(b,id){
 if(id.endsWith('-hero')){const p=b.cards.players[id.slice(0,-5)];return {hp:p.hero,armor:p.armor};}
 const x=b.cards.catalog[id];if(!x||['tactic','secret'].includes(x.type))return null;
 if(x.type==='landmark'){const p=b.cards.players[x.side];return {uses:x.uses,cooldown:Math.max(0,x.landmarkReadyTurn-p.ownTurn),zone:p.landmarks.includes(id)?'landmark':p.grave.includes(id)?'grave':'hand'};}
 if(x.type==='weapon'){const p=b.cards.players[x.side];return {attack:x.attack,durability:x.durability,zone:p.weapon===id?'weapon':p.grave.includes(id)?'grave':'hand'};}
 const p=b.cards.players[x.side];return {attack:x.attack,hp:x.hp,maxHp:x.maxHp,tags:[...x.tags],frozen:x.frozen,silenced:x.silenced,tempAttack:x.tempAttack,zone:p.board.includes(id)?'board':p.grave.includes(id)?'grave':'hand'};
}
function publicStates(b){return Object.fromEntries(['home','enemy'].flatMap(side=>[side+'-hero',...b.cards.players[side].board,...(b.cards.players[side].landmarks??[]),...(b.cards.players[side].weapon?[b.cards.players[side].weapon]:[])]).map(id=>[id,stats(b,id)]));}
export function beginCardHistory(b,action){
 const c=b.cards,side=action.type==='mulligan'||action.type==='retreat'?'home':c.turn,p=c.players[side],x=c.catalog[action.id],cost=action.type==='power'?2:action.type==='play'&&x?Math.max(0,x.cost-(['tactic','secret'].includes(x.type)&&x.definitionId!=='coin'?p.discount:0)):0;
 const states=publicStates(b),session={partial:c.phase!=='mulligan'||c.ply>1,side,ply:c.ply,round:b.round,type:action.type,cost,actorId:x?.id??side+'-hero',targetId:action.target==='hero'?(action.type==='power'&&p.skill.kind==='command'?side:other(side))+'-hero':action.target,skill:action.type==='power'?p.skill.name:undefined,swaps:action.type==='mulligan'?(action.ids?.length??0):undefined,states,cache:structuredClone(states),events:[],cause:{kind:action.type,sourceId:x?.id??side+'-hero'},resources:{home:{mana:c.players.home.mana,discount:c.players.home.discount},enemy:{mana:c.players.enemy.mana,discount:c.players.enemy.discount}}};
 sessions.set(b,session);
}
export function withCardHistoryCause(b,cause,fn){const session=sessions.get(b);if(!session)return fn();const previous=session.cause;session.cause={...cause,parent:previous};try{return fn();}finally{session.cause=previous;}}
export function observeCardHistoryEvent(b,type,data){
 const s=sessions.get(b);if(!s)return;
 const parents=[];for(let p=s.cause.parent;p;p=p.parent)parents.unshift({kind:p.kind,...(p.sourceId?{source:ref(b,p.sourceId)}:{}),...(p.effect?{effect:p.effect}:{})});
 const ordinal=s.events.length+1,cause={...(parents.length?{parents}:{}),kind:s.cause.kind,...(s.cause.sourceId?{source:ref(b,s.cause.sourceId)}:{}),...(s.cause.effect?{effect:s.cause.effect}:{})};
 // Enemy hidden draws/burns and reserve generation expose neither ID nor name.
 if((type==='draw'||type==='burn')&&data.side==='enemy'){s.events.push({ordinal,type,ply:b.cards.ply,round:b.round,side:'enemy',cause});return;}
 if(type==='reserve'){const side=b.units.find(u=>u.id===data.unitId)?.side;s.events.push({ordinal,type,ply:b.cards.ply,round:b.round,side,cause});return;}
 const id=data.target??data.id,subject=ref(b,id),after=subject?stats(b,id):null,before=subject?s.cache[id]??null:null;
 const entry={ordinal,type,ply:b.cards.ply,round:b.round,cause,...(data.side?{side:data.side}:{}),...(subject?{subject}:{}),...(after?{before,after}:{}),...Object.fromEntries(['amount','armor','attack','health','thaw','result','kind','round'].filter(k=>data[k]!==undefined).map(k=>[k,data[k]]))};
 if(after)s.cache[id]=structuredClone(after);s.events.push(entry);
}
export function finishCardHistory(b){
 const s=sessions.get(b);if(!s)throw Error('动作记录上下文缺失');
 try{
  const c=b.cards,history=c.history??={version:1,nextId:1,checksum:0,startedPly:s.ply,partial:s.partial,entries:[]},end=publicStates(b),ids=new Set([...Object.keys(s.states),...Object.keys(end)]);
  const changes=[...ids].map(id=>({subject:ref(b,id),before:s.states[id]??null,after:end[id]??stats(b,id)})).filter(x=>JSON.stringify(x.before)!==JSON.stringify(x.after));
  const entry={id:history.nextId,ply:s.ply,round:s.round,side:s.side,type:s.type,cost:s.cost,actor:ref(b,s.actorId),...(s.targetId?{target:ref(b,s.targetId)}:{}),...(s.skill?{skill:s.skill}:{}),...(s.swaps!==undefined?{swaps:s.swaps}:{}),resources:Object.fromEntries(['home','enemy'].map(side=>[side,{before:s.resources[side],after:{mana:c.players[side].mana,discount:c.players[side].discount}}])),changes,events:s.events};
  entry.checksum=checksum({previous:history.checksum,row:entry});history.checksum=entry.checksum;history.entries.push(entry);history.nextId++;return b;
 }finally{sessions.delete(b);}
}
export function abortCardHistory(b){sessions.delete(b);}
export function publicCardHistory(b){validateCardHistory(b);return structuredClone(b.cards.history??{version:1,nextId:1,checksum:0,startedPly:b.cards.ply,partial:b.cards.phase!=='mulligan',entries:[]});}
const keys=(x,allowed)=>x&&typeof x==='object'&&!Array.isArray(x)&&Object.keys(x).every(k=>allowed.includes(k));
export function validateCardHistory(b){
 const h=b.cards.history;if(h===undefined)return;return validatePublicCardHistory(h,b.cards.ply,id=>ref(b,id));
}
// Archives no longer have a private battle/catalog. Validate the same public schema,
// with consistent IDs across every occurrence and the original checksum chain.
export function validatePublicCardHistory(h,ply,resolveReference){
 const known=new Map();const fail=()=>{throw Error('卡牌动作记录无效');},integer=(n,min=0)=>Number.isSafeInteger(n)&&n>=min;
 const checkRef=x=>{if(!keys(x,['id','side','type','name'])||typeof x.id!=='string'||typeof x.name!=='string'||!['home','enemy'].includes(x.side)||!['hero','troop','general','tactic','weapon','secret','landmark'].includes(x.type))fail();if(!x.id.length||x.id.length>256||x.name.length>128||x.type==='hero'&&x.id!==x.side+'-hero'||x.type!=='hero'&&x.id.endsWith('-hero'))fail();const expected=resolveReference?resolveReference(x.id):known.get(x.id)??x;if(!expected||['id','side','type'].some(k=>expected[k]!==x[k]))fail();known.set(x.id,x);};
 const checkStats=x=>{if(x===null)return;if(!keys(x,['hp','armor','attack','maxHp','tags','frozen','silenced','tempAttack','durability','uses','cooldown','zone'])||(!Object.hasOwn(x,'hp')&&!Object.hasOwn(x,'durability')&&!Object.hasOwn(x,'uses'))||Object.entries(x).some(([k,v])=>['hp','armor','attack','maxHp','tempAttack','durability','uses','cooldown'].includes(k)&&!Number.isFinite(v)))fail();if(x.uses!==undefined&&(!integer(x.uses)||x.uses>2)||x.cooldown!==undefined&&(!integer(x.cooldown)||x.cooldown>2))fail();if(x.tags!==undefined&&(!Array.isArray(x.tags)||x.tags.some(v=>typeof v!=='string')))fail();if(x.zone!==undefined&&!['board','grave','hand','weapon','landmark'].includes(x.zone))fail();if(['frozen','silenced'].some(k=>x[k]!==undefined&&typeof x[k]!=='boolean'))fail();};
 if(!keys(h,['version','nextId','checksum','startedPly','partial','entries'])||h.version!==1||!integer(ply,1)||h.startedPly>ply||!integer(h.checksum)||!integer(h.startedPly,1)||typeof h.partial!=='boolean'||!Array.isArray(h.entries)||h.nextId!==h.entries.length+1)fail();
 let previous=h.startedPly,previousChecksum=0;
 for(const [index,row]of h.entries.entries()){
  if(!keys(row,['id','ply','round','side','type','cost','actor','target','skill','swaps','resources','changes','events','checksum'])||row.id!==index+1||!integer(row.ply,previous)||row.ply>ply||row.round!==Math.ceil(row.ply/2)||!['home','enemy'].includes(row.side)||!['mulligan','play','attack','hero-attack','power','end','retreat','landmark-use','landmark-remove'].includes(row.type)||!integer(row.cost)||row.cost>10||!Array.isArray(row.changes)||!Array.isArray(row.events))fail();previous=row.ply;const payload={...row};delete payload.checksum;if(row.checksum!==checksum({previous:previousChecksum,row:payload}))fail();previousChecksum=row.checksum;checkRef(row.actor);if(row.target)checkRef(row.target);
  if(row.type==='play'&&row.side==='enemy'&&row.actor.type==='secret'&&(!/^enemy-secret-seal-[1-9][0-9]*$/.test(row.actor.id)||row.actor.name!=='未知奥秘'))fail();
  if(row.skill!==undefined&&typeof row.skill!=='string'||row.swaps!==undefined&&!integer(row.swaps))fail();
  if(!keys(row.resources,['home','enemy'])||['home','enemy'].some(side=>!keys(row.resources[side],['before','after'])))fail();for(const side of ['home','enemy'])for(const phase of ['before','after']){const value=row.resources[side]?.[phase];if(!keys(value,['mana','discount'])||!integer(value.mana)||value.mana>10||!integer(value.discount)||value.discount>10)fail();}
  for(const change of row.changes){if(!keys(change,['subject','before','after']))fail();checkRef(change.subject);checkStats(change.before);checkStats(change.after);}
  for(const [i,event]of row.events.entries()){
   if(!keys(event,['ordinal','type','ply','side','cause','subject','before','after','amount','armor','attack','health','thaw','result','kind','round'])||event.ordinal!==i+1||!integer(event.ply,row.ply)||event.ply>ply||event.round!==Math.ceil(event.ply/2)||typeof event.type!=='string'||!keys(event.cause,['kind','source','effect','parents'])||typeof event.cause.kind!=='string')fail();if(event.cause.source)checkRef(event.cause.source);if(event.subject)checkRef(event.subject);if(event.before!==undefined)checkStats(event.before);if(event.after!==undefined)checkStats(event.after);
   if(event.cause.parents!==undefined){if(!Array.isArray(event.cause.parents))fail();for(const parent of event.cause.parents){if(!keys(parent,['kind','source','effect'])||typeof parent.kind!=='string'||parent.effect!==undefined&&typeof parent.effect!=='string')fail();if(parent.source)checkRef(parent.source);}}
   if(!['damage','shield','draw','burn','fatigue','reserve','turn','armor','heal','mana','discount','buff','freeze','silence','death','result','play','attack','power','expire','hero-attack','weapon-equip','weapon-break','weapon-wear','secret-set','secret-reveal','secret-stop','landmark-deploy','landmark-use','landmark-remove','landmark-ready'].includes(event.type)||event.side!==undefined&&!['home','enemy'].includes(event.side)||event.cause.effect!==undefined&&typeof event.cause.effect!=='string'||['amount','armor','attack','health','round'].some(k=>event[k]!==undefined&&!Number.isFinite(event[k]))||['kind','result'].some(k=>event[k]!==undefined&&typeof event[k]!=='string')||event.thaw!==undefined&&typeof event.thaw!=='boolean')fail();
   if(['draw','burn'].includes(event.type)&&event.side==='enemy'&&(event.subject||event.before||event.after))fail();
   if(event.type==='secret-set'&&event.side==='enemy'&&(!event.subject||event.subject.type!=='secret'||!/^enemy-secret-seal-[1-9][0-9]*$/.test(event.subject.id)||event.subject.name!=='未知奥秘'))fail();
  }
 }
 if(h.checksum!==previousChecksum)fail();
}
