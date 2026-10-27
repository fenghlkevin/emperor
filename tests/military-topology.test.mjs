import test from 'node:test';
import assert from 'node:assert/strict';
import {newGame} from '../src/game.mjs';
import {borderingCountries} from '../src/war.mjs';
import {provinceGeometry,realmGeometry} from '../src/campaign-map.mjs';
import {atlasIsPlayableLand} from '../src/atlas-geography.mjs';
const inside=(p,ring)=>{let yes=false;for(let i=0,j=ring.length-1;i<ring.length;j=i++){const a=ring[i],b=ring[j];if((a[1]>p[1])!==(b[1]>p[1])&&p[0]<(b[0]-a[0])*(p[1]-a[1])/(b[1]-a[1])+a[0])yes=!yes;}return yes;};
const onLand=atlasIsPlayableLand;
const key=p=>p.map(n=>n.toFixed(6)).join(',');
const edgeKey=(a,b)=>[key(a),key(b)].sort().join('/');
function computeBorders(d,home){
 const owner=id=>d.provinces.find(p=>p.id===id)?.countryId;
 const regions=[...provinceGeometry.map(p=>({...p,owner:owner(p.id)})),...realmGeometry.flatMap(r=>(r.polygons||[r.polygon]).map(polygon=>({...r,polygon,owner:owner(r.id+'-core')})))];
 const edges=new Map();for(const r of regions)for(let i=0;i<r.polygon.length;i++){const a=r.polygon[i],b=r.polygon[(i+1)%r.polygon.length],k=edgeKey(a,b);if(!onLand([(a[0]+b[0])/2,(a[1]+b[1])/2]))continue;if(!edges.has(k))edges.set(k,[]);edges.get(k).push(r);}
 const ids=new Set();for(const rs of edges.values())if(rs.some(r=>r.owner===home))for(const r of rs)if(r.owner&&r.owner!==home)ids.add(r.owner);
 // The ten home provinces overlay the foreign partition; their exterior cuts foreign rings.
 const homeEdges=new Map();for(const p of provinceGeometry)for(let i=0;i<p.polygon.length;i++){const a=p.polygon[i],b=p.polygon[(i+1)%p.polygon.length],k=edgeKey(a,b);if(!homeEdges.has(k))homeEdges.set(k,[]);homeEdges.get(k).push({p,a,b});}
 for(const entries of homeEdges.values())if(entries.length===1){const {p,a,b}=entries[0];const h=owner(p.id);for(const r of regions.filter(r=>realmGeometry.some(g=>g.id===r.id))){if(r.owner===h)continue;const mid=[(a[0]+b[0])/2,(a[1]+b[1])/2];if(onLand(mid)&&inside(mid,r.polygon)){if(h===home)ids.add(r.owner);if(r.owner===home)ids.add(h);}}}
 // Island realms have no overland border; their painted partition may extend inland.
 const islands=new Set(['japan','luzon','srivijaya','java','sinhala']);
 return d.countries.filter(c=>ids.has(c.id)&&c.id!==home&&!islands.has(c.id)&&!islands.has(home));
}
test('single-pass military topology preserves every original country border and conquered ownership',()=>{
 const d=newGame('接壤复核').domestic;
 const islands=new Set(['japan','luzon','srivijaya','java','sinhala']);
 const provinces=d.provinces.map(p=>({id:p.id,countryId:islands.has(p.id.replace(/-core$/,''))?p.id.replace(/-core$/,''):'geo:'+p.id}));
 const geo={provinces,countries:provinces.map(p=>({id:p.countryId}))},links=[];
 for(const p of provinces)for(const c of computeBorders(geo,p.countryId)){const q=provinces.find(q=>q.countryId===c.id);if(q)links.push([p.id,q.id]);}
 for(const conquered of [false,true]){
 if(conquered){const p=d.provinces.find(p=>p.id.endsWith('-core'));const previous=d.countries.find(c=>c.id===p.countryId),home=d.countries.find(c=>c.id===d.playerCountryId);previous.provinceIds=previous.provinceIds.filter(id=>id!==p.id);p.countryId=home.id;home.provinceIds.push(p.id);}
 const owners=new Map(d.provinces.map(p=>[p.id,p.countryId]));
 for(const c of d.countries){const expected=new Set(links.filter(([a,b])=>owners.get(a)===c.id&&owners.get(b)!==c.id).map(([,b])=>owners.get(b)));assert.deepEqual(borderingCountries(d,c.id).map(c=>c.id).sort(),d.countries.filter(c=>expected.has(c.id)&&c.provinceIds.length).map(c=>c.id).sort(),c.id);}
 }
});
