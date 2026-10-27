import {cardStatuses} from './card-battle-status.mjs';

const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const signed=n=>(n>0?'+':'−')+Math.abs(n);
const badTones=new Set(['weakened','frozen','silenced']);
export const statusIsNegative=s=>badTones.has(s.tone);
const kinds={attack:['attack','攻'],health:['health','命'],'temporary-attack':['temporary','时'],freeze:['freeze','冻'],silence:['silence','默'],shield:['shield','盾'],'granted-taunt':['guard','卫'],'granted-rush':['rush','袭'],'granted-stealth':['stealth','隐'],'granted-anti':['anti','骑'],'granted-anti_horse':['horse','慑'],'granted-pierce':['pierce','破']};
const rank={attack:0,'temporary-attack':1,health:2,shield:3,'granted-taunt':4,'granted-rush':5,'granted-stealth':6,'granted-anti':7,'granted-anti_horse':8,'granted-pierce':9,freeze:10,silence:11};
const unknown=()=>({name:'来源未记录'});
const sourceOf=(event,row)=>{
 const ref=event.cause?.source??event.cause?.parents?.findLast(p=>p.source)?.source??row.actor;
 return ref?{id:ref.id,name:ref.name,round:event.round??row.round}:unknown();
};
// Only public history is read. This view model never changes a card or save.
function historyModifiers(b,x){
 const groups={attack:[],health:[],temporary:[]},sources=new Map();let initialized=false;
 const seed=s=>{if(!s)return;for(const [key,value]of [['attack',s.attack-(s.tempAttack??0)-x.printedAttack],['health',s.maxHp-x.printedHp],['temporary',s.tempAttack??0]])if(Number.isFinite(value)&&value)groups[key].push({amount:value,source:unknown()});};
 for(const row of b?.cards?.history?.entries??[]){for(const e of row.events??[]){
  if(e.subject?.id!==x.id)continue;
  if(!initialized){seed(e.before);initialized=true;}
  const src=sourceOf(e,row),before=e.before,after=e.after;
  if(e.type==='silence'){groups.attack=[];groups.health=[];groups.temporary=[];sources.clear();sources.set('silence',src);continue;}
  if(e.type==='expire'){if(e.attack)groups.temporary=[];if(e.thaw)sources.delete('freeze');continue;}
  if(e.type==='shield'){sources.delete('shield');continue;}
  if(e.type==='freeze')sources.set('freeze',src);
  if(e.type!=='buff'||!before||!after)continue;
  const temp=(after.tempAttack??0)-(before.tempAttack??0);
  if(!Object.hasOwn(e,'attack')){
   // setattack replaces earlier attack modifiers rather than adding another source.
   const value=after.attack-x.printedAttack;groups.attack=value?[{amount:value,source:src}]:[];groups.temporary=[];
  }else{
   const attack=e.attack-temp;
   if(attack)groups.attack.push({amount:attack,source:src});
   if(temp)groups.temporary.push({amount:temp,source:src});
  }
  const health=after.maxHp-before.maxHp;if(health)groups.health.push({amount:health,source:src});
  for(const tag of after.tags??[])if(!before.tags?.includes(tag))sources.set(tag,src);
 }
  if(row.type==='end'&&row.side===x.side)groups.temporary=[];
 }
 for(const [key,value]of [['attack',x.buffAttack??0],['health',x.buffHealth??0],['temporary',x.tempAttack??0]]){
  // Partial or externally restored snapshots must not invent historical modifiers.
  if(groups[key].reduce((sum,v)=>sum+v.amount,0)!==value)groups[key]=value?[{amount:value,source:unknown()}]:[];
 }
 return {groups,sources};
}
export function battleCardStatuses(b,x){
 if(!x||!['troop','general'].includes(x.type))return [];
 const {groups,sources}=historyModifiers(b,x),rows=[];
 for(const s of cardStatuses(x)){
  if(['attack','health','temporary-attack'].includes(s.key))continue;
  const [kind,glyph]=kinds[s.key]??['guard','令'],tag=s.key.startsWith('granted-')?s.key.slice(8):s.key;
  rows.push({...s,kind,glyph,negative:statusIsNegative(s),sources:[sources.get(tag)??(tag==='shield'&&x.definition?.tags?.includes('shield')?{name:x.name}:unknown())]});
 }
 for(const [key,group]of [['attack','attack'],['health','health'],['temporary-attack','temporary']]){
  for(const negative of [false,true]){
   const active=groups[group].filter(s=>(s.amount<0)===negative);if(!active.length)continue;
   const value=active.reduce((sum,s)=>sum+s.amount,0),temporary=group==='temporary',name=group==='health'?'生命上限':'攻击',kind=temporary?'temporary':group;
   rows.push({key:negative?key+'-negative':key,tone:negative?'weakened':temporary?'temporary':'enhanced',negative,kind,glyph:temporary?'时':group==='health'?'命':'攻',value,label:(group==='health'?'命':'攻')+signed(value)+(temporary?' · 本回合':''),description:(temporary?(negative?'临时削弱：':'临时强化：'):group==='health'?'生命上限':'攻击修正')+(temporary?'攻击':'')+signed(value)+(temporary?'，本回合结束失效':'；持续到被移除或离场'),sources:active.map(v=>({...v.source,amount:v.amount})),name:name+signed(value)});
  }
 }
 return rows.sort((a,z)=>Number(a.negative)-Number(z.negative)+(a.negative===z.negative?(rank[a.key.replace(/-negative$/,'')]??12)-(rank[z.key.replace(/-negative$/,'')]??12):0));
}
export function battleStatBreakdown(x,statuses){
 const deltas=kind=>statuses.filter(s=>s.kind===kind).map(s=>signed(s.value));
 const total=(x.printedAttack??x.attack)+statuses.filter(s=>s.kind==='attack'||s.kind==='temporary').reduce((n,s)=>n+s.value,0);
 return {attack:`攻击 ${x.printedAttack??x.attack}（基础）${deltas('attack').map(v=>' '+v+'（持续修正）').join('')}${deltas('temporary').map(v=>' '+v+'（本回合）').join('')}${total===x.attack?' = '+x.attack:'；当前攻击 '+x.attack+'（含最低攻击等规则结算）'}`,health:`生命上限 ${x.printedHp??x.maxHp}（基础）${deltas('health').map(v=>' '+v+'（持续修正）').join('')} = ${x.maxHp}`};
}
