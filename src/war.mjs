import {validateCardHistoryArchive} from './card-battle-history-archive.mjs';
import {kitSurface} from './troop-kits.mjs';
import {quoteKitWar,beginKitWar,finishKitWar,validateKitBattle} from './kit-war.mjs';
import {initializeWarRecord,validateWarRecord} from './war-records.mjs';
import {finishDefense} from './foreign-strategy.mjs';
import {specialActive} from './special-buildings.mjs';
import {actBattle,validateBattle} from './battle.mjs';
import {validateDomestic} from './domestic.mjs';
import {provinceGeometry,realmGeometry} from './campaign-map.mjs';
import {servingOfficials,officeId} from './personnel-actions.mjs';
import {atlasIsPlayableLand} from './atlas-geography.mjs';
export const WAR_TABS=[['war','发动战争'],['recruit','招募士兵'],['dismiss','解雇士兵']];
export function initializeWar(d){d.war??={nextId:1,history:[]};initializeWarRecord(d);return d;}
export function validateWar(d){if(!d.war)return;validateWarRecord(d);const w=d.war;if(w.battle){validateBattle(w.battle);if(!w.battle.command.defensive)validateKitBattle(d,w.battle);if(w.battle.command.id!==w.nextId)throw Error('战场军令无效');const allies=w.battle.command.alliedForces;if(allies!==undefined){if(!Array.isArray(allies)||allies.length>2||new Set(allies.map(f=>f.countryId)).size!==allies.length)throw Error('盟军编队无效');for(const [i,f]of allies.entries()){const p=d.provinces.find(p=>p.id===f.sourceId&&p.countryId===f.countryId);if(!p||!Number.isSafeInteger(f.soldiers)||f.soldiers<100||f.soldiers>p.population.professions.soldiers||f.countryId===d.playerCountryId||f.countryId===w.battle.command.targetId||w.battle.units.filter(u=>u.side==='enemy'&&u.allyIndex===i).reduce((n,u)=>n+u.initial,0)!==f.soldiers)throw Error('盟军兵籍无效');}for(const u of w.battle.units)if(u.allyIndex!==undefined&&(!Number.isSafeInteger(u.allyIndex)||u.side!=='enemy'||!allies[u.allyIndex]))throw Error('盟军来源无效');}}if(!Number.isSafeInteger(w.nextId)||w.nextId<1||!Array.isArray(w.history)||w.history.length>100)throw Error('兵部军令记录无效');for(const r of w.history){if(r.cardHistory!==undefined)validateCardHistoryArchive(r.cardHistory,r);if(!Number.isSafeInteger(r.id)||r.id<1||r.id>=w.nextId||!Number.isSafeInteger(r.turn)||r.turn<1||!WAR_TABS.some(([k])=>k===r.kind)||!Array.isArray(r.lines)||r.lines.some(l=>typeof l!=='string'||l.length>500))throw Error('兵部军令记录无效');}}
const sum=a=>a.reduce((x,y)=>x+y,0);
const inside=(p,ring)=>{let yes=false;for(let i=0,j=ring.length-1;i<ring.length;j=i++){const a=ring[i],b=ring[j];if((a[1]>p[1])!==(b[1]>p[1])&&p[0]<(b[0]-a[0])*(p[1]-a[1])/(b[1]-a[1])+a[0])yes=!yes;}return yes;};
// Fixed coast geometry: border construction revisits the same edge midpoints.
const landPointCache=new Map();
const onLand=p=>{const id=p.join(',');if(!landPointCache.has(id))landPointCache.set(id,atlasIsPlayableLand(p));return landPointCache.get(id);};
const key=p=>p.map(n=>n.toFixed(6)).join(',');
const edgeKey=(a,b)=>[key(a),key(b)].sort().join('/');
// Resolve ownership on the same rings used by the campaign map, including rebellions.
let landLinks=null;
export function borderingCountries(d,home=d.playerCountryId){
 if(!landLinks)landLinks=buildLandLinks(d);
 const owners=new Map(d.provinces.map(p=>[p.id,p.countryId])),ids=new Set();for(const [a,b]of landLinks)if(owners.get(a)===home&&owners.get(b)!==home)ids.add(owners.get(b));return d.countries.filter(c=>ids.has(c.id)&&c.provinceIds.length);
}
export function borderingProvinces(d,attacker,defender){if(!landLinks)borderingCountries(d,attacker);const owners=new Map(d.provinces.map(p=>[p.id,p.countryId])),ids=new Set();for(const [a,b]of landLinks)if(owners.get(a)===attacker&&owners.get(b)===defender)ids.add(b);return d.provinces.filter(p=>ids.has(p.id));}
function buildLandLinks(d){
 const islands=new Set(['japan','luzon','srivijaya','java','sinhala']);
 const known=new Set(d.provinces.map(p=>p.id)),links=new Set();
 const connect=(a,b)=>{if(a===b||!known.has(a)||!known.has(b)||islands.has(a.replace(/-core$/,''))||islands.has(b.replace(/-core$/,'')))return;links.add(a+'/'+b);links.add(b+'/'+a);};
 const foreign=realmGeometry.flatMap(r=>(r.polygons||[r.polygon]).map(polygon=>({id:r.id+'-core',polygon})));
 const regions=[...provinceGeometry,...foreign],edges=new Map(),homeEdges=new Map();
 for(const r of regions)for(let i=0;i<r.polygon.length;i++){
  const a=r.polygon[i],b=r.polygon[(i+1)%r.polygon.length],k=edgeKey(a,b);
  if(!onLand([(a[0]+b[0])/2,(a[1]+b[1])/2]))continue;
  if(!edges.has(k))edges.set(k,[]);edges.get(k).push(r.id);
 }
 for(const ids of edges.values())for(let i=0;i<ids.length;i++)for(let j=i+1;j<ids.length;j++)connect(ids[i],ids[j]);
 // Home provinces overlay the foreign partition, so include exterior intersections.
 for(const p of provinceGeometry)for(let i=0;i<p.polygon.length;i++){
  const a=p.polygon[i],b=p.polygon[(i+1)%p.polygon.length],k=edgeKey(a,b);
  if(!homeEdges.has(k))homeEdges.set(k,[]);homeEdges.get(k).push({p,a,b});
 }
 for(const entries of homeEdges.values())if(entries.length===1){const {p,a,b}=entries[0],mid=[(a[0]+b[0])/2,(a[1]+b[1])/2];if(onLand(mid))for(const r of foreign)if(inside(mid,r.polygon))connect(p.id,r.id);}
 return [...links].map(k=>k.split('/'));
}

export function generals(d){return servingOfficials(d).filter(o=>officeId(o)==='central-general'||officeId(o)?.endsWith('-general'));}
export const civilianCount=p=>Math.max(0,p.population.total-sum(Object.values(p.population.professions)));
export function recruitLimit(d){const c=d.countries.find(c=>c.id===d.playerCountryId);return Math.min(Math.floor(c.fiscal.treasury/4),sum(d.provinces.filter(p=>p.countryId===c.id).map(civilianCount)));}
export const quoteWar=quoteKitWar;
export const beginWar=beginKitWar;
export function advanceWar(state,action){const next=structuredClone(state),b=next.domestic.war?.battle;if(!b)throw Error('尚未开战');next.domestic.war.battle=actBattle(b,action);return next;}
export function finishWar(state){return state.domestic.war?.battle?.command.defensive?finishDefense(state):finishKitWar(state);}

export function battlefieldFor(d,id,turn){const p=d.provinces.find(p=>p.countryId===id);return {terrain:p?.terrain??'平原型',surface:kitSurface(p),defense:Math.min(1.5,1+(p?.welfare.defense??0)/500+(specialActive(d,'greatWall',turn,id)?.2:0))};}
