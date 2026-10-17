import {courtMilitaryFeedback} from './court-military-feedback.mjs';
import {courtFiscalFeedback} from './court-fiscal-feedback.mjs';
import {countrySummary} from './domestic.mjs';
import {foodForecast} from './food-relief.mjs';
import {activeDisaster,DISASTERS} from './disasters.mjs';
import {CONSTRUCTION_PLANS} from './construction.mjs';
import {courtOccupant} from './court-actors.mjs';
import {courtGovernanceFeedback} from './court-governance-feedback.mjs';
import {courtDiplomaticFeedback} from './court-diplomatic-feedback.mjs';
import {courtSpecialStatus} from './court-special.mjs';

// Derived from current facts. Reading the court never creates events or spends a turn.
export function courtAgenda(s){
 const d=s.domestic,q=countrySummary(d,undefined,s.turn),items=[];
 const add=(id,seal,title,summary,office,action,provinceId,urgent=false)=>items.push({id,seal,title,summary,office,action,provinceId,urgent});
 if(d.collapse?.pending)add('capital','急','京城失守','朝廷去留，须由陛下亲决。','war-minister','register',null,true);
 else if(d.war?.battle||d.strategy.pending?.defender===d.playerCountryId)add('war','急','边关军报','军情已至，先定守御，再议国政。','war-minister','register',null,true);
 const forecasts=q.provinces.map(p=>({p,f:foodForecast(p,s.turn)}));
 const hungry=forecasts.filter(x=>x.f.shortfall>0).sort((a,b)=>b.f.shortfall-a.f.shortfall)[0];
 if(hungry)add('food','赈',`${hungry.p.name}粮务告急`,`下旬预计缺粮${hungry.f.shortfall.toLocaleString('zh-CN')}石，可调邻州余粮或拨银购入。`,'revenue-minister','atlas-grain',hungry.p.id,true);
 const fiscal=courtFiscalFeedback(s);
 if(q.net<0||fiscal?.turn===s.turn&&fiscal.debtAdded>0)add('deficit','赋','国用渐紧',`${fiscal?`第${fiscal.turn}旬常规实收${fiscal.income}两、实付${fiscal.paid}两、欠支转国债${fiscal.debtAdded}两。`:''}当前预计每旬${q.net<0?'短支':'结余'}${Math.abs(q.net).toLocaleString('zh-CN')}两，宜核定赋税与支用。`,'revenue-minister','tax');
 const disaster=q.provinces.find(p=>activeDisaster(p,s.turn));
 if(disaster)add('disaster','灾',`${disaster.name}有灾`,`地方报${DISASTERS.find(([id])=>id===disaster.disaster.kind)?.[1]??'灾情'}，请阅当地钱粮与营建。`,'works-minister','atlas-build',disaster.id,true);
 const military=courtMilitaryFeedback(s);
 if(military?.turn===s.turn)add('military-result','军','战后归营复奏',`第${military.turn}旬：${military.lines.join('；')}`,'war-minister','garrison');
 const governed=q.provinces.map(p=>({p,f:courtGovernanceFeedback(s,p.id)})).filter(x=>x.f?.turn===s.turn).sort((a,b)=>b.f.cost-a.f.cost)[0];
 if(governed)add('governance','治',`${governed.p.name}地方复奏`,`第${governed.f.turn}旬实支${governed.f.cost}两：${governed.f.reasons.join('；')}`,'personnel-minister','personnel-delegate',governed.p.id);
 const receipt=courtDiplomaticFeedback(s).find(r=>r.turn===s.turn);
 if(receipt){add('diplomatic-receipt','邦',`${receipt.name}${receipt.shortfall?'履约不足':'履约复奏'}`,`第${receipt.turn}旬：${receipt.summary}。${receipt.shortfall?'不足额已按现行规则影响友善。':'钱款已按实际结算入账。'}`,'rites-minister','diplomacy');items.at(-1).countryId=receipt.countryId;}
 const special=courtSpecialStatus(s);
 if(special)add('special','工',`${special.provinceName}${special.name}${special.paused?'停工':'在建'}`,`已施工${special.progress}/${special.turns}旬；${special.paused?`当前因${special.reasons.join('、')}暂停，请核查工地。`:'工期按旬推进，全线竣工下一旬启用。'}`,'works-minister','special',special.provinceId,special.paused);
 const project=q.provinces.find(p=>p.construction.project);
 if(project){const r=project.construction.project,plan=CONSTRUCTION_PLANS[r.building];add('works','工',`${project.name}${plan.name}在建`,`已施工${r.progress}/${plan.turns}旬，遇灾暂停，完工下一旬收益生效。`,'works-minister','atlas-build',project.id);}
 const excess=forecasts.filter(x=>x.f.storageLoss>0).sort((a,b)=>b.f.storageLoss-a.f.storageLoss)[0];
 if(excess&&!hungry)add('storage','仓','仓廪也需周转',`${excess.p.name}下旬预计陈粮损耗${excess.f.storageLoss.toLocaleString('zh-CN')}石，可查余粮与邻州需求。`,'revenue-minister','atlas-grain',excess.p.id);
 if(items.length<3)add('muster','兵','点检兵籍',`中央现有${d.centralArmy.soldiers.toLocaleString('zh-CN')}名士兵，调动前宜核对各地兵装。`,'war-minister','garrison');
 if(items.length<3)add('building','建','营造候旨','择一州察看民生，再定粮仓、城墙或市集。','works-minister','atlas-build');
 if(items.length<3)add('stores','粮','核阅仓廪',`本国现有存粮${q.grainReserve.toLocaleString('zh-CN')}石，可逐州察看下旬产粮、口粮与仓储。`,'revenue-minister','atlas-grain');
 return items.sort((a,b)=>Number(b.urgent)-Number(a.urgent)).slice(0,3);
}
export function courtSpeaker(s,office){return courtOccupant(s.domestic,office);}
export function courtOverview(s){const q=countrySummary(s.domestic,undefined,s.turn);return {provinces:q.provinces.length,net:q.net,grain:q.grainReserve,treasury:q.country.fiscal.treasury,debt:q.country.fiscal.debt};}
