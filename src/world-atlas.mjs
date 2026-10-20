import {subtractZone,joinPieces} from './painted-realms.mjs';
import {provinceGeometry} from './regional-atlas.mjs';
import {partition,sharedRings,reliefRings,northeastPoint} from './map-geometry.mjs';
import {REALMS,FRONTIER_IDS} from './scenario-geography.mjs';
import {insideRing} from './world-coast.mjs';
import {atlasIsLand as worldIsLand} from './atlas-geography.mjs';
export {provinceGeometry};
export {worldLandRings,worldLandPath,worldIsLand,insideRing} from './world-coast.mjs';
// A guard band keeps the warped outer cells beyond the visible coast, so
// even the eastern tip is covered rather than leaving a white sliver.
const cells=reliefRings(sharedRings(partition(REALMS.filter(r=>r.id!=='sheng'),[-24,185,-45,95])));
// Convex campaign zones keep an archipelago together rather than letting
// nearest-label partition split its islands between unrelated neighbors.
const zones=[['korea',[[124,34],[130,34],[132,43],[127,43],[124,40]].reverse()],['japan',[[129,30],[146,30],[146,47],[139,47],[129,35]]],['luzon',[[118,5],[127,5],[127,21],[118,21]]],['srivijaya',[[94,-2],[118.6,-2],[118.6,8],[94,8]]],['java',[[105,-2],[145,-2],[145,.2],[105,.2]]],['sinhala',[[79,5],[83,5],[83,10],[79,10]]]];
const oriented=ring=>ring.reduce((n,a,i)=>{const b=ring[(i+1)%ring.length];return n+a[0]*b[1]-b[0]*a[1];},0)<0?[...ring].reverse():ring;
const normalized=zones.map(([id,r])=>[id,oriented(r)]);
export const worldRealmGeometry=cells.map(r=>{
 let pieces=[r.polygon];for(const [,zone]of normalized)pieces=pieces.flatMap(p=>subtractZone(p,zone));
 for(let i=0;i<normalized.length;i++)if(normalized[i][0]===r.id){let additions=[normalized[i][1]];for(const [,zone]of normalized.slice(i+1))additions=additions.flatMap(p=>subtractZone(p,zone));pieces.push(...additions);}
 const polygons=joinPieces(pieces).map(ring=>ring.map(northeastPoint)),owns=p=>polygons.some(r=>insideRing(p,r))&&worldIsLand(p)&&!provinceGeometry.some(g=>insideRing(p,g.polygon));
 let center=northeastPoint(r.center);
 if(!owns(center)){let best=null,distance=Infinity;for(let y=-39.5;y<85;y+=.5)for(let x=-19.5;x<180;x+=.5){const delta=(x-center[0])**2+(y-center[1])**2;if(delta<distance&&owns([x,y])){best=[x,y];distance=delta;}}if(best)center=best;}
 if(r.id==='far-east'&&owns(northeastPoint([159,66])))center=northeastPoint([159,66]);
 // Compact cartographic names fit the new narrow peripheral regions; saved
 // country/province names retain their full scenario names.
 return {...r,name:FRONTIER_IDS.includes(r.id)?r.name.replace(/诸部$/,''):r.name,center,polygon:polygons[0],polygons};
});
