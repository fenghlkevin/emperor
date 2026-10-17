import {PROVINCES,REALMS} from './domestic.mjs';
import {INK_COAST,inkPoint} from './ink-coast.mjs';
import {PAINTED_ZONES,subtractZone,joinPieces} from './painted-realms.mjs';
import {partition,sharedRings,ringPath,reliefRings,exteriorPath} from './map-geometry.mjs';
// Coastal control points reach beyond the painted shore. The common art-space
// clip determines the exact endpoint; an inland polygon edge cannot truncate it.
const coastalNodes=new Map([
 ['117,36',[118,36]],['120,41',[126,41]],['121,37',[129,37]],['121,34',[129,34]],
 ['122,31',[128,31]],['120,27',[126,27]],['117,23',[123,23]]
]);
export const provinceGeometry=sharedRings(PROVINCES.map(p=>({...p,polygon:p.polygon.map(v=>coastalNodes.get(v.join(','))||v)})));
export const homePath=provinceGeometry.map(p=>ringPath(p.polygon)).join('');
const islands=new Set(['japan','luzon','sinhala','srivijaya','java']);
const base=reliefRings(sharedRings(partition(REALMS.filter(r=>r.id!=='sheng'&&!islands.has(r.id)))));
const pixel=([x,y])=>[(x+12)/162*1586,(64-y)/66*992];
const inside=(p,ring)=>{let yes=false;for(let i=0,j=ring.length-1;i<ring.length;j=i++){const a=ring[i],b=ring[j];if((a[1]>p[1])!==(b[1]>p[1])&&p[0]<(b[0]-a[0])*(p[1]-a[1])/(b[1]-a[1])+a[0])yes=!yes;}return yes;};
const labelPixels={india:[700,700],korea:[1375,327],japan:[1525,332],luzon:[1350,669],sinhala:[738,817],srivijaya:[1210,890],java:[1110,963]};
export const realmGeometry=REALMS.filter(r=>r.id!=='sheng').map(r=>{
 let rings=base.find(g=>g.id===r.id)?[base.find(g=>g.id===r.id).polygon.map(pixel)]:[];
 for(const [,zone]of PAINTED_ZONES)rings=rings.flatMap(ring=>subtractZone(ring,zone));
 // Later zones (Sri Lanka) take precedence over earlier mainland zones (India).
 for(let i=0;i<PAINTED_ZONES.length;i++)if(PAINTED_ZONES[i][0]===r.id){
  let additions=[PAINTED_ZONES[i][1]];
  for(const [,zone]of PAINTED_ZONES.slice(i+1))additions=additions.flatMap(ring=>subtractZone(ring,zone));
  rings.push(...additions);
 }
 const owns=p=>rings.some(ring=>inside(p,ring))&&INK_COAST.reduce((land,ring)=>land!==inside(p,ring),false)&&!provinceGeometry.some(g=>inside(inkPoint(p),g.polygon));
 let label=labelPixels[r.id]||pixel(base.find(g=>g.id===r.id).center);
 if(!owns(label)){
  let nearest=null,distance=Infinity;
  for(let y=8;y<992;y+=4)for(let x=8;x<1586;x+=4){const d=(x-label[0])**2+(y-label[1])**2;if(d<distance&&owns([x,y])){nearest=[x,y];distance=d;}}
  if(nearest)label=nearest;
 }
 const polygons=joinPieces(rings).map(ring=>ring.map(inkPoint));
 return {...r,center:inkPoint(label),polygon:polygons[0],polygons};
});
export const territoryPath=r=>(r.polygons||[r.polygon]).map(ringPath).join('');
export const homeBorderPath=exteriorPath(provinceGeometry);
export const nationPath=r=>r.id==='sheng'?homePath:territoryPath(realmGeometry.find(g=>g.id===r.id));
