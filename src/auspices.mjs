import {postTreasury} from './finance.mjs';
// One chance per旬; rewards are applied during settlement, never by the notice UI.
export const AUSPICE_CHANCE=.3;
export const AUSPICES=[
 ['gold','矿脉出金','山中矿户掘得新脉，金砂盈筐，特将头批所得解送京师。','central','treasury',1800,'国库银两','两'],
 ['tribute','海舶献珍','远洋商舶顺风归港，献上珍货，折银充实国库。','central','treasury',1200,'国库银两','两'],
 ['arms','神工铸兵','京中匠作制成一批完整刀盾兵装备，悉数收入武库。','central','infantry',600,'中央刀盾兵装备','人份'],
 ['steeds','天马来归','牧监配齐战马、武器与护具，成套交付京营。','central','cavalry',240,'中央轻骑兵装备','人份'],
 ['harvest','嘉禾连穗','田间嘉禾连穗，百姓收获丰足，州仓新粮满载。','local','grain',6000,'地方存粮','石'],
 ['fish','江河鱼丰','江河鱼汛大至，渔舟满载，鱼米折粮收入州仓。','local','grain',3600,'地方存粮','石'],
 ['market','商贾云集','四方客商闻治而来，市肆繁盛，地方获利颇丰。','local','cash',1000,'地方府库','两'],
 ['silver','银砂涌泉','山泉冲出银砂，民间采集有获，地方府库增收。','local','cash',1500,'地方府库','两'],
 ['people','流民归籍','流寓百姓闻境内安定，携家归附，已编入当地户籍。','local','people',2400,'在籍人口','人'],
 ['craftsmen','良匠来投','一批能工巧匠举家迁入，愿凭手艺安居兴业。','local','workers',800,'工匠人口','人'],
 ['farmers','垦户来归','邻境农户携种而来，愿在此安家垦田，官府已妥善安置。','local','farmers',1600,'农人人口','人'],
 ['herders','牧野兴旺','牧户逐水草迁来，献上良马，愿入籍共事农牧。','local','herders',1000,'牧人人口','人']
].map(([id,title,story,scope,resource,amount,label,unit])=>({id,title,story,scope,resource,amount,label,unit}));
export function auspiceDefinition(s,id){return AUSPICES.find(e=>e.id===id);}
export function initializeAuspices(s){s.auspices??={lastTurn:s.turn,history:[]};return s.auspices;}
function turnRandom(s){
 let seed=s.turn;for(const ch of s.createdAt??'emperor')seed=Math.imul(seed^ch.charCodeAt(0),16777619)>>>0;
 return ()=>{seed=(seed+0x6D2B79F5)>>>0;let n=seed;n=Math.imul(n^(n>>>15),n|1);n^=n+Math.imul(n^(n>>>7),n|61);return ((n^(n>>>14))>>>0)/4294967296;};
}
export function settleAuspices(s,random=turnRandom(s)){
 const system=initializeAuspices(s);if(system.lastTurn>=s.turn)return null;system.lastTurn=s.turn;
 if(random()>=AUSPICE_CHANCE)return null;
 const d=s.domestic,c=d.countries.find(c=>c.id===d.playerCountryId),owned=d.provinces.filter(p=>p.countryId===c.id);
 const previous=system.history[0]?.kind,pool=AUSPICES.filter(e=>e.id!==previous),e=auspiceDefinition(s,pool[Math.floor(random()*pool.length)].id);
 const p=e.scope==='local'?owned[Math.floor(random()*owned.length)]:null;
 if(e.resource==='treasury')postTreasury(d,c.id,{turn:s.turn,income:e.amount,reason:e.title,key:`auspice:${s.turn}`});
 else if(e.scope==='central'){d.troopKits.depots.central.stock[e.resource]+=e.amount;}
 else if(e.resource==='grain')p.welfare.grainReserve+=e.amount;
 else if(e.resource==='cash')p.status.cash+=e.amount;
 else {p.population.total+=e.amount;if(e.resource!=='people')p.population.professions[e.resource]+=e.amount;}
 s.stats.treasury=c.fiscal.treasury;
 const record={turn:s.turn,kind:e.id,provinceId:p?.id??null,amount:e.amount,notified:false};
 system.history.unshift(record);system.history=system.history.slice(0,36);return record;
}
export function validateAuspices(s){
 const a=initializeAuspices(s);if(!Number.isSafeInteger(a.lastTurn)||a.lastTurn<1||a.lastTurn>s.turn||!Array.isArray(a.history)||a.history.length>36)throw Error('祥瑞记录无效');
 let previous=s.turn+1;for(const r of a.history){const e=AUSPICES.find(e=>e.id===r.kind);if(!e||!Number.isSafeInteger(r.turn)||r.turn<1||r.turn>=previous||r.turn>a.lastTurn||r.amount!==e.amount||typeof r.notified!=='boolean'||(e.scope==='central'?r.provinceId!==null:!s.domestic.provinces.some(p=>p.id===r.provinceId)))throw Error('祥瑞记录无效');previous=r.turn;}
}
