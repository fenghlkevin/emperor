import {endReign} from './ending-rules.mjs';
import {settleReignResult} from './reign-result.mjs';
// Project rules based on the DOS guide; numerical choices documented in docs/alchemy.md.
export const HERBS=[['A','冰山雪莲','白瓣凝霜'],['B','冷凝不化冰','青晶含雾'],['C','千年人参王','参须盘结'],['D','透光灵芝','芝盖映光'],['E','神僧舍利子','金珠莹润'],['F','龙脑香','香晶如雪'],['G','鲸王脂','凝脂藏罐'],['H','炽火蛙','赤蛙入匣']].map(([id,name,description])=>({id,name,description}));
export const DOMESTIC_TRIBUTE_CHANCE=.05;
export const EFFECTS={energy:'回元丹',wellness:'养和丹',abilities:'四仪丹',capacity:'强身丹',life8:'八珍延寿丹',life7:'七珍延寿丹',life6:'六珍延寿丹',harm:'药性相冲'};
export const RECIPES=Object.entries({energy:['AB','EF'],wellness:['AEG','ACF','BEH','CEF','DFG'],abilities:['ADFG','ACDF','ACEH','BCDH','BEGH'],capacity:['ABCEF','ABCEH','ACDFG','BDEGH','BDFGH'],life8:['ABCDEFGH'],life7:['ABCDEFH'],life6:['ABDEFH']}).flatMap(([effect,keys])=>keys.map(key=>({key,effect,name:EFFECTS[effect]})));
const recipe=key=>RECIPES.find(r=>r.key===key);
export const herbNames=key=>[...key].map(id=>HERBS.find(h=>h.id===id)?.name??id).join('、');
export function initializeAlchemy(s,{starter=false}={}){s.alchemy??={version:1,lastTurn:s.turn,sequence:0,herbs:Object.fromEntries(HERBS.map(h=>[h.id,starter?1:0])),furnace:null,batches:[],known:[],history:starter?[`第${s.turn}旬：内府拨八味药材各一份，供初次试炼。`]:[]};return s;}
function record(s,message){s.alchemy.history.unshift(`第${s.turn}旬：${message}`);s.alchemy.history=s.alchemy.history.slice(0,60);}
const validKey=key=>typeof key==='string'&&/^[A-H]{1,8}$/.test(key)&&[...new Set(key)].sort().join('')===key;
export function validateAlchemy(s){initializeAlchemy(s);const a=s.alchemy,int=(n,max=1000000)=>Number.isSafeInteger(n)&&n>=0&&n<=max,turn=n=>int(n,s.turn)&&n>=1;const batch=b=>b&&int(b.id,a.sequence)&&b.id>0&&validKey(b.key)&&b.effect===(recipe(b.key)?.effect??'harm')&&typeof b.identified==='boolean'&&int(b.quantity,2)&&b.quantity>0&&turn(b.startedTurn)&&b.readyTurn===b.startedTurn+3;
 if(!a||a.version!==1||!turn(a.lastTurn)||!int(a.sequence,Number.MAX_SAFE_INTEGER)||!a.herbs||Object.keys(a.herbs).length!==8||HERBS.some(h=>!int(a.herbs[h.id]))||!Array.isArray(a.known)||a.known.length>255||new Set(a.known).size!==a.known.length||a.known.some(k=>!validKey(k))||!Array.isArray(a.history)||a.history.length>60||a.history.some(x=>typeof x!=='string'||x.length>500)||!Array.isArray(a.batches)||a.batches.length>200||a.batches.some(b=>!batch(b)||b.readyTurn>s.turn)||new Set(a.batches.map(b=>b.id)).size!==a.batches.length||(a.furnace!==null&&(!batch(a.furnace)||a.furnace.quantity!==2||a.furnace.readyTurn<=s.turn||a.batches.some(b=>b.id===a.furnace.id))))throw Error('青炉房存档无效');return s;
}
export function alchemyBlock(s){return s.stats.life<=0||s.dynasty?.endReason||s.reignResult?'本朝已终，不能再行炼丹服药':![2,3].includes(s.phase)?'青炉房仅在午时、申时开放':'';}
export function drugEffect(s,effect){const a=s.stats;if(effect==='energy')return {energy:Math.min(100,a.maxEnergy-a.energy)};if(effect==='wellness')return {health:Math.min(10,100-a.health),happiness:Math.min(10,100-a.happiness)};if(effect==='abilities')return Object.fromEntries(['wisdom','martial','charm','talent'].map(k=>[k,Math.min(2,500-a[k])]));if(effect==='capacity')return {maxEnergy:Math.min(30,500-a.maxEnergy)};if(effect==='harm')return {health:-Math.min(15,a.health),life:-Math.min(12,a.life-1)};const base=Math.max(1,Math.floor(1200/Math.max(20,a.age)));const amount=effect==='life7'?base*2:effect==='life6'?Math.floor(base/2):base;return {life:Math.min(amount,a.lifeLimit-a.life)};}
const LABELS={energy:'体力',maxEnergy:'体力上限',health:'健康',happiness:'快乐',wisdom:'智慧',martial:'武术',charm:'魅力',talent:'才艺',life:'寿元'};
export const effectText=changes=>Object.entries(changes).map(([k,n])=>`${LABELS[k]}${n>=0?'+':''}${n}`).join('，');
export function alchemyAction(state,command){const s=structuredClone(state);initializeAlchemy(s);const blocked=alchemyBlock(s);if(blocked)throw Error(blocked);const a=s.alchemy;let message;
 if(command.kind==='brew'){
  if(a.furnace)throw Error('炉中尚有丹药，请待成丹');if(a.batches.length>=199)throw Error('药柜已满，请先处理成丹');if(s.stats.energy<10)throw Error('开炉需10体力，请先休息');
  if(!Array.isArray(command.herbs)||command.herbs.length<1||command.herbs.length>8||new Set(command.herbs).size!==command.herbs.length||command.herbs.some(id=>!HERBS.some(h=>h.id===id)))throw Error('请选择不重复的八味以内药材');
  const key=[...command.herbs].sort().join('');if([...key].some(id=>a.herbs[id]<1))throw Error('所选药材不足');for(const id of key)a.herbs[id]--;s.stats.energy-=10;s.harem.streak=0;
  a.furnace={id:++a.sequence,key,effect:recipe(key)?.effect??'harm',quantity:2,identified:a.known.includes(key),startedTurn:s.turn,readyTurn:s.turn+3};message='已封炉，消耗10体力，三旬后成丹两颗。';
 }else{
  const b=a.batches.find(b=>b.id===command.id);if(!b)throw Error('丹药已处理或不存在');
  if(command.kind==='poison'){if(!b.identified||b.effect!=='harm')throw Error('只有已辨明的有害丹可用于服毒终局');if(command.confirm!==true)throw Error('请再次确认服毒并结束本朝');b.quantity--;endReign(s,'服毒','亲服已辨明的有害丹，主动结束本朝。');message='已服有害丹，本朝以服毒结束并归档。';}
  else if(command.kind==='test'){if(b.identified)throw Error('此丹药性已明，无需再试');b.identified=true;if(!a.known.includes(b.key))a.known.push(b.key);b.quantity--;message=`内侍试药，耗一颗。${EFFECTS[b.effect]}：${effectText(drugEffect(s,b.effect))}。已录入丹方簿。`;}
  else if(command.kind==='take'){if(!b.identified&&command.confirm!==true)throw Error('此丹药性未明，请先试药或确认亲服');const changes=drugEffect(s,b.effect);if(Object.values(changes).every(n=>n===0))throw Error('相关属性已达上限，无需服用');for(const [key,value]of Object.entries(changes))s.stats[key]+=value;b.quantity--;b.identified=true;if(!a.known.includes(b.key))a.known.push(b.key);message=`服用${EFFECTS[b.effect]}，${effectText(changes)}。`;}
  else if(command.kind==='discard'){if(command.confirm!==true)throw Error('请确认弃药');const count=command.quantity;if(!Number.isInteger(count)||count<1||count>b.quantity)throw Error('弃药数量无效');b.quantity-=count;message=`已弃去本批丹药${count}颗。`;}
  else throw Error('未知青炉房操作');
  a.batches=a.batches.filter(b=>b.quantity>0);
 }
 for(const b of a.batches)if(a.known.includes(b.key))b.identified=true;if(a.furnace&&a.known.includes(a.furnace.key))a.furnace.identified=true;
 record(s,message);s.harem.history.unshift(`第${s.turn}旬：青炉房，${message}`);s.harem.history=s.harem.history.slice(0,30);settleReignResult(s);return {state:s,message};
}
function tributeRandom(s){
 let seed=s.turn;for(const ch of `alchemy|${s.createdAt??'emperor'}|${s.name}`)seed=Math.imul(seed^ch.charCodeAt(0),16777619)>>>0;
 return ()=>{seed=(seed+0x6D2B79F5)>>>0;let n=seed;n=Math.imul(n^(n>>>15),n|1);n^=n+Math.imul(n^(n>>>7),n|61);return ((n^(n>>>14))>>>0)/4294967296;};
}
export function settleAlchemy(s,random=tributeRandom(s)){initializeAlchemy(s);const a=s.alchemy;if(a.lastTurn>=s.turn)return;a.lastTurn=s.turn;
 if(a.furnace&&s.turn>=a.furnace.readyTurn){a.batches.push(a.furnace);a.furnace=null;record(s,'炉火已息，丹成两颗，已收入药柜。');}
 if(s.stats.life<=0||s.dynasty?.endReason)return;
 const home=s.domestic.playerCountryId;
 // One national roll, independent of diplomacy; expanding territory does not multiply it.
 const provinces=s.domestic.provinces.filter(p=>p.countryId===home);
 if(provinces.length&&random()<DOMESTIC_TRIBUTE_CHANCE){
  const province=provinces[Math.min(provinces.length-1,Math.floor(random()*provinces.length))];
  const herb=HERBS[Math.min(7,Math.floor(random()*8))];
  if(a.herbs[herb.id]<1000000){a.herbs[herb.id]++;record(s,`${province.name}进贡${herb.name}一份，已收入药柜。`);}
 }
 const candidates=s.domestic.diplomacy.filter(r=>r.countryIds.includes(home)&&r.friendship>=95&&r.relation!=='hostile').map(r=>({r,c:s.domestic.countries.find(c=>c.id===r.countryIds.find(id=>id!==home)&&c.provinceIds.length)})).filter(x=>x.c);
 if(!candidates.length)return;
 // At most one foreign gift each turn. Protection raises the gift chance, never the quantity.
 const {r,c}=candidates[Math.min(candidates.length-1,Math.floor(random()*candidates.length))];const protectedByHome=r.relation===(r.countryIds[0]===home?'protector':'protected');if(random()>=(protectedByHome?.4:.25))return;
 const herb=HERBS[Math.min(7,Math.floor(random()*8))];if(a.herbs[herb.id]>=1000000)return;a.herbs[herb.id]++;record(s,`${c.name}遣使献${herb.name}一份，已收入药柜。`);
}
