import {quoteShortage,resourceShortage} from './action-feedback.mjs';
import {organizedRecruitTraining,recruitOrganization} from './central-office-effects.mjs';
import {planManpower,applyManpower,moveDrafts,releaseDrafts,validateManpower} from './manpower.mjs';
import {manpowerEffects,manpowerEffectLines} from './manpower-effects.mjs';
import {requirePopulationRoom} from './city-capacity.mjs';
import {TROOP_KITS,createKitDepot,validateKitDepot,kitAvailability,reserveKitSquads,settleKitSquads,transferKitDepot,quoteKitPurchase,kitOrigin,kitTargetMix} from './troop-kits.mjs';
import {postTreasury} from './finance.mjs';
import {newRecruitTraining} from './building-effects.mjs';

// Enable a type only when its combat and presentation are ready.
export const ENABLED_KITS=Object.freeze(['infantry','spears','cavalry','heavy-cavalry','archers','crossbows','camel','elephant','horse-archers']);
const integer=(n,min=0,max=Number.MAX_SAFE_INTEGER)=>{if(!Number.isSafeInteger(n)||n<min||n>max)throw Error('军令数量或编号无效');return n;};
const sourceProvince=(d,id)=>d.provinces.find(p=>p.id===(id==='central'?d.centralArmy.sourceProvinceId:id));
const owner=(d,id)=>id==='central'?d.playerCountryId:sourceProvince(d,id)?.countryId;
const initialStock=(n,p)=>{const stock=Object.fromEntries(Object.entries(kitTargetMix(p)).map(([id,ratio])=>[id,Math.floor(n*ratio)]));stock['heavy-cavalry']+=n-Object.values(stock).reduce((a,b)=>a+b,0);return stock;};
export function initializeTroopKits(d){
 if(d.troopKits!==undefined)return d;
 const depots={};
 for(const id of ['central',...d.provinces.map(p=>p.id)]){
  const p=sourceProvince(d,id),soldiers=id==='central'?d.centralArmy.soldiers:p.population.professions.soldiers-(id===d.centralArmy.sourceProvinceId?d.centralArmy.soldiers:0);
  const depot=createKitDepot(id,soldiers,0,initialStock(soldiers,p));depots[id]={stock:depot.stock,reservations:depot.reservations};
 }
 d.troopKits={version:1,nextId:1,history:[],depots};return d;
}
// Population/central army remain the sole soldier and training registers.
export function worldKitDepot(d,id){
 const record=d.troopKits?.depots?.[id],p=sourceProvince(d,id);if(!record||!p)throw Error('驻地军备不存在');
 const central=id==='central',soldiers=central?d.centralArmy.soldiers:p.population.professions.soldiers-(id===d.centralArmy.sourceProvinceId?d.centralArmy.soldiers:0);
 return validateKitDepot({version:1,id,soldiers,training:central?d.centralArmy.training:p.military.training,stock:record.stock,reservations:record.reservations});
}
function writeDepot(d,depot){
 d.troopKits.depots[depot.id]={stock:depot.stock,reservations:depot.reservations};
}
export function worldKitSummary(d,countryId=d.playerCountryId){
 return ['central',...d.provinces.map(p=>p.id)].filter(id=>owner(d,id)===countryId).map(id=>{
  const p=sourceProvince(d,id);return {id,name:id==='central'?'中央':p.name,training:worldKitDepot(d,id).training,...kitAvailability(worldKitDepot(d,id))};
 });
}
export function validateTroopKits(d){
 const data=d.troopKits;if(data&&Object.keys(data).some(k=>!['version','nextId','history','depots'].includes(k)))throw Error('军备结构字段无效');if(!data)throw Error('兵种套装军备缺失，请开启新王朝');
 if(data.version!==1||!data.depots||typeof data.depots!=='object'||Array.isArray(data.depots)||Object.keys(data.depots).length!==d.provinces.length+1||!Array.isArray(data.history)||data.history.length>100)throw Error('套装军备存档无效');
 integer(data.nextId,1);
 for(const id of ['central',...d.provinces.map(p=>p.id)]){const stock=data.depots[id]?.stock;if(!stock||Object.keys(stock).length!==ENABLED_KITS.length||ENABLED_KITS.some(k=>!Object.hasOwn(stock,k)))throw Error('九兵种装备库存不完整');worldKitDepot(d,id);}
 let previous=data.nextId;
 for(const row of data.history){integer(row.id,1,previous-1);previous=row.id;integer(row.turn,1);integer(row.cost);if(!['purchase','transfer','recruit','dismiss'].includes(row.kind)||!Array.isArray(row.lines)||row.lines.some(s=>typeof s!=='string'||s.length>500))throw Error('套装军令历史无效');}
}
function ownedDepot(d,id){if(owner(d,id)!==d.playerCountryId)throw Error('只能操作本国驻地');return worldKitDepot(d,id);}
export function quoteKitCommand(state,c){
 const d=state.domestic,depot=ownedDepot(d,c.sourceId),p=sourceProvince(d,c.sourceId),country=d.countries.find(c=>c.id===d.playerCountryId);
 let cost=0,details,lines,impact;
 if(c.kind==='purchase'){
  if(!c.quantities||Object.entries(c.quantities).some(([id,n])=>n!==0&&!ENABLED_KITS.includes(id)))throw Error('该兵种尚未开放采购');
  const origin=kitOrigin(p),stable=p.status.situation==='stable'&&(!p.occupation||p.occupation.settled);
  // Caller supplied country, origin and stability are intentionally ignored.
  const q=quoteKitPurchase(c.quantities,origin,{stable});cost=q.cost;details=q.quantities;
  for(const [id,n]of Object.entries(details))integer(depot.stock[id]+n);
  lines=TROOP_KITS.filter(k=>details[k.id]).map(k=>`${k.name}装备 ${details[k.id]} 人份，单价 ${k.price} 两`);
 }else if(c.kind==='transfer'){
  const target=ownedDepot(d,c.targetId);if(p!==sourceProvince(d,c.targetId))requirePopulationRoom(sourceProvince(d,c.targetId),c.soldiers??0);details=transferKitDepot(depot,target,{soldiers:c.soldiers??0,kits:c.quantities??{}});
  lines=[`${c.sourceId==='central'?'中央':p.name}调往${c.targetId==='central'?'中央':sourceProvince(d,c.targetId).name}，士兵 ${c.soldiers??0} 人`,...TROOP_KITS.filter(k=>c.quantities?.[k.id]).map(k=>`${k.name}装备 ${c.quantities[k.id]} 人份`)];
 }else if(c.kind==='recruit'||c.kind==='dismiss'){
  const n=integer(c.amount,1),available=kitAvailability(depot).soldiers.available;
  const provinces=c.sourceId==='central'?d.provinces.filter(p=>p.countryId===d.playerCountryId):[p];
  if(c.kind==='dismiss'&&n>available)throw Error(resourceShortage('遣散士兵','空闲士兵',n,available,'人'));
  const plan=c.kind==='recruit'?planManpower(d,provinces,n,c.draftRates??{}):null;
  if(c.kind==='recruit'&&c.sourceId==='central')requirePopulationRoom(p,plan.filter(r=>r.provinceId!==p.id).reduce((sum,r)=>sum+r.count,0));
  cost=c.kind==='recruit'?integer(n*4):0;details={amount:n,...(plan?{plan}:{})};lines=[`${c.kind==='recruit'?'招募':'解散'}${c.sourceId==='central'?'中央':p.name}士兵 ${n} 人；装备库存不变`];
  const preview=structuredClone(state);
  if(plan){recruitFromPlan(preview.domestic,plan,c.sourceId);lines.push(`先用空闲劳力${plan.filter(r=>!r.job).reduce((sum,r)=>sum+r.count,0)}人，抽调四业${plan.filter(r=>r.job).reduce((sum,r)=>sum+r.count,0)}人；各业累计在役抽调上限50%（士兵与民夫合计）`);}
  else{const target=sourceProvince(preview.domestic,c.sourceId);target.population.professions.soldiers-=n;if(c.sourceId==='central')preview.domestic.centralArmy.soldiers-=n;releaseDrafts(preview.domestic,c.sourceId,n,{turn:state.turn});}
  if(c.kind==='recruit'){const e=recruitOrganization(d);lines.push(`兵部侍郎${e.source.name}：新兵训练额外＋${e.bonus}，最终不超过40；按新旧兵人数加权`);}
  impact=manpowerEffects(state,preview);lines=[...manpowerEffectLines(impact),...lines];
 }else throw Error('套装军令类型无效');
 return {kind:c.kind,cost,details,lines,impact,canAfford:country.fiscal.treasury>=cost,treasuryAfter:country.fiscal.treasury-cost};
}
function moveSoldiers(d,fromId,toId,n,targetTraining){
 const from=sourceProvince(d,fromId),to=sourceProvince(d,toId);
 moveDrafts(d,fromId,toId,n);
 if(fromId==='central')d.centralArmy.soldiers-=n;
 if(toId==='central'){d.centralArmy.soldiers+=n;d.centralArmy.training=targetTraining;}else to.military.training=targetTraining;
 if(from!==to){from.population.total-=n;from.population.professions.soldiers-=n;to.population.total=integer(to.population.total+n);to.population.professions.soldiers=integer(to.population.professions.soldiers+n);}
}
function recruitFromPlan(d,plan,stationId){
 const p=sourceProvince(d,stationId),depot=worldKitDepot(d,stationId);let count=0,weighted=0;
 for(const row of plan){const source=d.provinces.find(x=>x.id===row.provinceId);count+=row.count;weighted+=row.count*organizedRecruitTraining(d,source,newRecruitTraining(source));}
 applyManpower(d,plan,'soldiers',stationId);
 for(const row of plan){const source=d.provinces.find(x=>x.id===row.provinceId);if(source!==p){source.population.professions.soldiers-=row.count;source.population.total-=row.count;p.population.total+=row.count;p.population.professions.soldiers+=row.count;}}
 const training=Math.floor((depot.soldiers*depot.training+weighted)/(depot.soldiers+count));
 if(stationId==='central'){d.centralArmy.soldiers+=count;d.centralArmy.training=training;}else p.military.training=training;
}
export function executeKitCommand(state,c){
 validateTroopKits(state.domestic);integer(c.id,1);
 if(c.id!==state.domestic.troopKits?.nextId)throw Error('军令已执行或数据已更新，请重新拟令');
 if(state.domestic.war?.battle||state.domestic.strategy?.pending||state.domestic.collapse?.pending||state.domestic.collapse?.ended||state.stats.life===0)throw Error('当前不能办理军备军令');
 const q=quoteKitCommand(state,c);if(!q.canAfford)throw Error(quoteShortage(q,c.kind==='recruit'?`募兵${c.amount.toLocaleString('zh-CN')}人`:'采办兵装'));
 const next=structuredClone(state),d=next.domestic,depot=worldKitDepot(d,c.sourceId),p=sourceProvince(d,c.sourceId);
 if(c.kind==='purchase'){for(const [id,n]of Object.entries(q.details))depot.stock[id]+=n;writeDepot(d,depot);}
 if(c.kind==='transfer'){writeDepot(d,q.details.source);writeDepot(d,q.details.target);moveSoldiers(d,c.sourceId,c.targetId,c.soldiers??0,q.details.target.training);}
 if(c.kind==='recruit')recruitFromPlan(d,q.details.plan,c.sourceId);
 if(c.kind==='dismiss'){p.population.professions.soldiers-=c.amount;if(c.sourceId==='central')d.centralArmy.soldiers-=c.amount;releaseDrafts(d,c.sourceId,c.amount,{turn:state.turn});}
 if(!d.centralArmy.soldiers){d.centralArmy.training=0;d.general.ongoing=false;d.general.trainingFloor=0;}
 if(q.cost)postTreasury(d,d.playerCountryId,{turn:state.turn,expense:q.cost,reason:c.kind==='purchase'?'兵部购买兵种装备':'兵部招募士兵',key:`troop-kit:${c.id}:${c.kind}`});
 const receipt={id:c.id,turn:state.turn,kind:c.kind,cost:q.cost,lines:q.lines};d.troopKits.nextId++;d.troopKits.history.unshift(receipt);d.troopKits.history=d.troopKits.history.slice(0,100);
 next.stats.treasury=d.countries.find(c=>c.id===d.playerCountryId).fiscal.treasury;validateTroopKits(d);validateManpower(d);return {state:next,receipt};
}
// Battle adapters operate on their private candidate state before persistence.
export function reserveWorldKits(d,sourceId,battleId,squads){const depot=reserveKitSquads(worldKitDepot(d,sourceId),battleId,squads);writeDepot(d,depot);return depot;}
export function settleWorldKits(d,sourceId,battleId,survivors){
 const before=worldKitDepot(d,sourceId),after=settleKitSquads(before,battleId,survivors),dead=before.soldiers-after.soldiers,p=sourceProvince(d,sourceId);
 p.population.total-=dead;p.population.professions.soldiers-=dead;if(sourceId==='central')d.centralArmy.soldiers-=dead;releaseDrafts(d,sourceId,dead,{dead:true});writeDepot(d,after);return {dead,depot:after};
}
