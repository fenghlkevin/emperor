import {resourceShortage} from './action-feedback.mjs';
// One unit of stock equips one soldier, including the mount/crew allocation.
// Project balance v1 prices; no independent weapon or mount stocks.
export const TROOP_KITS=Object.freeze([
 {id:'infantry',name:'刀盾兵',price:12},
 {id:'spears',name:'长枪兵',price:10},
 {id:'cavalry',name:'轻骑兵',price:28},
 {id:'heavy-cavalry',name:'重骑兵',price:40},
 {id:'archers',name:'弓兵',price:10},
 {id:'crossbows',name:'弩兵',price:16},
 {id:'camel',name:'骆驼骑兵',price:30,description:'沙地攻击+20%，对普通骑兵+35%；大食、柏柏尔稳定产地采购',origins:['arabia','maghreb']},
 {id:'elephant',name:'象兵',price:60,description:'基础移动2，冲击伤害+25%，目标本次反击减半；天竺、真腊、骠国稳定产地采购',origins:['india','chenla','pyu']},
 {id:'horse-archers',name:'弓骑兵',price:32,description:'移动4、射程3，移动射击不减伤，远程伤害为专职弓兵75%；突厥、回纥、铁勒稳定产地采购',origins:['east-turk','west-turk','uyghur','steppe']},
].map(k=>Object.freeze({...k,...(k.origins?{origins:Object.freeze(k.origins)}:{})})));
const ids=TROOP_KITS.map(k=>k.id);
const equipped=row=>{if(row.equipped!==undefined&&typeof row.equipped!=='boolean'||row.equipped===false&&row.kind!=='infantry')throw Error('只有乡勇可以缺装步战');return row.equipped!==false;};
const integer=(n,max=Number.MAX_SAFE_INTEGER)=>{if(!Number.isSafeInteger(n)||n<0||n>max)throw Error('兵员与套装数量须为范围内的非负整数');return n;};
const add=(a,b)=>integer(a+b);
const key=id=>{if(!ids.includes(id))throw Error('兵种套装无效');return id;};
const token=id=>{if(typeof id!=='string'||!id||id.length>120||['__proto__','constructor','prototype'].includes(id))throw Error('出战占用编号无效');return id;};
export const emptyKitStock=()=>Object.fromEntries(ids.map(id=>[id,0]));
export function kitQuantities(values={}){
 if(!values||typeof values!=='object'||Array.isArray(values)||Object.keys(values).some(id=>!ids.includes(id)))throw Error('兵种套装数量无效');
 return Object.fromEntries(ids.map(id=>[id,integer(values[id]??0)]));
}
export function createKitDepot(id,soldiers=0,training=0,stock={}){
 if(typeof id!=='string'||!id)throw Error('驻地编号无效');
 return {version:1,id,soldiers:integer(soldiers),training:integer(training,100),stock:kitQuantities(stock),reservations:{}};
}
export function validateKitDepot(depot){
 if(!depot||depot.version!==1||typeof depot.id!=='string'||!depot.id)throw Error('驻地军备数据无效');
 integer(depot.soldiers);integer(depot.training,100);const stock=kitQuantities(depot.stock);
 if(!depot.reservations||typeof depot.reservations!=='object'||Array.isArray(depot.reservations))throw Error('出战占用数据无效');
 let used=0;const reserved=emptyKitStock();
 for(const [id,r] of Object.entries(depot.reservations)){
  token(id);if(!r||!['active','settled'].includes(r.status)||!Array.isArray(r.squads)||!r.squads.length)throw Error('出战占用数据无效');
  for(const row of r.squads){key(row.kind);equipped(row);integer(row.count);if(!row.count)throw Error('编队人数须大于零');if(r.status==='active'){used=add(used,row.count);if(equipped(row))reserved[row.kind]=add(reserved[row.kind],row.count);}}
  if(r.status==='settled'){
   if(!Array.isArray(r.survivors)||r.survivors.length!==r.squads.length)throw Error('战后生还数据无效');
   r.survivors.forEach((n,i)=>integer(n,r.squads[i].count));
  }
 }
 if(used>depot.soldiers||ids.some(id=>reserved[id]>stock[id]))throw Error('出战占用超过现有兵员或套装');
 return depot;
}
export function kitAvailability(depot){
 validateKitDepot(depot);const used=emptyKitStock();let soldiers=0;
 for(const r of Object.values(depot.reservations))if(r.status==='active')for(const row of r.squads){soldiers+=row.count;if(equipped(row))used[row.kind]+=row.count;}
 return {soldiers:{total:depot.soldiers,used:soldiers,available:depot.soldiers-soldiers},kits:Object.fromEntries(ids.map(id=>[id,{total:depot.stock[id],used:used[id],available:depot.stock[id]-used[id]}]))};
}
export function reserveKitSquads(depot,id,squads){
 const available=kitAvailability(depot);token(id);
 if(Object.hasOwn(depot.reservations,id))throw Error('出战编号已经使用');
 if(!Array.isArray(squads)||!squads.length)throw Error('请选择出战部队');
 let soldiers=0;const stock=emptyKitStock(),rows=squads.map(row=>{key(row.kind);equipped(row);integer(row.count);if(!row.count)throw Error('编队人数须大于零');soldiers=add(soldiers,row.count);if(equipped(row))stock[row.kind]=add(stock[row.kind],row.count);return {kind:row.kind,count:row.count,...(row.equipped===false?{equipped:false}:{})};});
 if(soldiers>available.soldiers.available)throw Error(resourceShortage('出征编队','空闲士兵',soldiers,available.soldiers.available,'人'));
 for(const id of ids)if(stock[id]>available.kits[id].available)throw Error(resourceShortage('出征编队',TROOP_KITS.find(k=>k.id===id).name+'装备',stock[id],available.kits[id].available,'人份'));
 const next=structuredClone(depot);next.reservations[id]={status:'active',squads:rows};return validateKitDepot(next);
}
export function settleKitSquads(depot,id,survivors){
 validateKitDepot(depot);token(id);const r=depot.reservations[id];
 if(!r||r.status!=='active')throw Error('出战占用不存在或已经结算');
 if(!Array.isArray(survivors)||survivors.length!==r.squads.length)throw Error('请提供各队生还人数');
 survivors.forEach((n,i)=>integer(n,r.squads[i].count));
 const next=structuredClone(depot);r.squads.forEach((row,i)=>{const dead=row.count-survivors[i];next.soldiers-=dead;if(equipped(row))next.stock[row.kind]-=dead;});
 next.reservations[id]={...next.reservations[id],status:'settled',survivors:[...survivors]};return validateKitDepot(next);
}
export function transferKitDepot(source,target,{soldiers=0,kits={}}={}){
 if(source.id===target.id)throw Error('来源与目标驻地不能相同');
 const available=kitAvailability(source);validateKitDepot(target);integer(soldiers);if(soldiers>available.soldiers.available)throw Error(resourceShortage('调拨士兵','空闲士兵',soldiers,available.soldiers.available,'人'));const amounts=kitQuantities(kits);
 for(const id of ids){integer(amounts[id]);if(amounts[id]>available.kits[id].available)throw Error(resourceShortage('调拨装备',TROOP_KITS.find(k=>k.id===id).name+'装备',amounts[id],available.kits[id].available,'人份'));}
 if(!soldiers&&!Object.values(amounts).some(Boolean))throw Error('请填写调拨数量');
 const from=structuredClone(source),to=structuredClone(target),total=add(to.soldiers,soldiers);
 to.training=total?Math.floor(to.training*(to.soldiers/total)+from.training*(soldiers/total)):0;
 from.soldiers-=soldiers;to.soldiers=total;
 for(const id of ids){from.stock[id]-=amounts[id];to.stock[id]=add(to.stock[id],amounts[id]);}
 return {source:validateKitDepot(from),target:validateKitDepot(to)};
}
// The world adapter must supply the province's immutable original region, and
// independently verify current ownership, stability and treasury before commit.
export function quoteKitPurchase(quantities,originId,{stable=true}={}){
 const amounts=kitQuantities(quantities);let cost=0;
 for(const kit of TROOP_KITS){const n=amounts[kit.id];if(!n)continue;if(kit.origins&&(!stable||!kit.origins.includes(originId)))throw Error(`${kit.name}装备只能在稳定控制的对应产地采购`);cost=add(cost,integer(n*kit.price));}
 if(!cost)throw Error('请至少购买一人份兵种装备');
 return {quantities:amounts,cost};
}

// Origin is attached to the province identity, never its current owner.
export const kitOrigin=p=>p?.id?.endsWith('-core')?p.id.slice(0,-5):'sheng';
export const kitSurface=p=>['arabia','maghreb'].includes(kitOrigin(p))?'desert':'normal';
export function kitProductionAllowed(p,kind){const kit=TROOP_KITS.find(k=>k.id===kind);return !!kit&&(!kit.origins||kit.origins.includes(kitOrigin(p))&&p.status?.situation==='stable'&&(!p.occupation||p.occupation.settled));}

export function kitTargetMix(p){const mix={infantry:.30,spears:.25,cavalry:.20,'heavy-cavalry':.05,archers:.12,crossbows:.08};const special=TROOP_KITS.find(k=>k.origins?.includes(kitOrigin(p)));if(special){mix.infantry-=.1;mix.cavalry-=.1;mix[special.id]=.2;}return mix;}
