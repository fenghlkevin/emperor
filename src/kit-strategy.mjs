import {kitGarrison} from './kit-war.mjs';
import {worldKitDepot,reserveWorldKits,settleWorldKits,ENABLED_KITS} from './troop-kit-world.mjs';
import {TROOP_KITS,kitProductionAllowed,kitTargetMix} from './troop-kits.mjs';
import {newRecruitTraining} from './building-effects.mjs';
import {postTreasury} from './finance.mjs';
export function kitForceStrength(d,f){
 if(!f.soldiers)return 0;
 return kitGarrison(d,f.sourceId,f.soldiers,{maxStacks:10}).reduce((n,u)=>n+u.count*(.45+f.training/100)*u.equipmentFactor*(u.kind==='heavy-cavalry'?1.18:u.kind==='cavalry'?1.05:1),0);
}
export function loseForceKits(d,f,n){
 if(!Number.isSafeInteger(n)||n<0||n>f.soldiers)throw Error('战役损失人数无效');if(!n)return;
 const units=kitGarrison(d,f.sourceId,f.soldiers,{maxStacks:10}),losses=units.map(u=>Math.floor(u.count*n/f.soldiers));let left=n-losses.reduce((a,b)=>a+b,0);
 for(let i=0;left&&i<units.length;i++){const v=Math.min(left,units[i].count-losses[i]);losses[i]+=v;left-=v;}
 const id=`kit-strategy:${d.troopKits.nextId++}`;reserveWorldKits(d,f.sourceId,id,units);settleWorldKits(d,f.sourceId,id,units.map((u,i)=>u.count-losses[i]));
 if(!d.centralArmy.soldiers){d.centralArmy.training=0;d.general.ongoing=false;d.general.trainingFloor=0;}
}
export function buyForeignKits(d,p,budget,turn,{plannedSoldiers}={}){
 const depot=worldKitDepot(d,p.id),targets=kitTargetMix(p),desired=plannedSoldiers??depot.soldiers;
 const kit=TROOP_KITS.filter(k=>ENABLED_KITS.includes(k.id)&&kitProductionAllowed(p,k.id)&&k.price<=budget&&depot.stock[k.id]<Math.ceil(desired*(targets[k.id]??.1))).sort((a,b)=>depot.stock[a.id]/Math.max(1,desired*(targets[a.id]??.1))-depot.stock[b.id]/Math.max(1,desired*(targets[b.id]??.1)))[0];
 if(!kit)return 0;const n=Math.min(Math.floor(budget/kit.price),Math.ceil(desired*(targets[kit.id]??.1))-depot.stock[kit.id]),cost=n*kit.price;
 postTreasury(d,p.countryId,{turn,expense:cost,reason:`外国购买${kit.name}装备`,key:`strategy:${turn}:${p.id}:kits`});d.troopKits.depots[p.id].stock[kit.id]+=n;return cost;
}

// Pay for complete equipment before increasing the foreign soldier register.
export function growForeignKitArmy(d,p,budget,turn){
 const old=p.population.professions.soldiers,free=p.population.total-Object.values(p.population.professions).reduce((a,b)=>a+b,0),target=Math.floor(p.population.total*.02);
 const wanted=Math.max(0,Math.min(100,free,target-old)),reserve=Math.min(wanted,Math.floor(budget/(Math.min(...TROOP_KITS.map(k=>k.price))+4)))*4;
 const gearCost=buyForeignKits(d,p,Math.max(0,budget-reserve),turn,{plannedSoldiers:old+wanted});
 const depot=worldKitDepot(d,p.id),coverage=Object.values(depot.stock).reduce((a,b)=>a+b,0),n=Math.max(0,Math.min(wanted,coverage-old,Math.floor((budget-gearCost)/4)));
 if(n){postTreasury(d,p.countryId,{turn,expense:n*4,reason:'外国征兵',key:`strategy:${turn}:${p.id}:recruit`});p.population.professions.soldiers+=n;p.military.training=Math.floor((p.military.training*old+newRecruitTraining(p)*n)/(old+n));}
 return {cost:gearCost+n*4,recruited:n,gearCost};
}
