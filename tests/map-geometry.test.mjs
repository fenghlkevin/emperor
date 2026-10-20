import test from 'node:test';
import assert from 'node:assert/strict';
import {partition,sharedRings} from '../src/map-geometry.mjs';
import {REALMS,PROVINCES} from '../src/domestic.mjs';
const area=ring=>Math.abs(ring.reduce((s,p,i)=>{const q=ring[(i+1)%ring.length];return s+p[0]*q[1]-q[0]*p[1];},0)/2);
const inside=(p,ring)=>{let found=false;for(let i=0,j=ring.length-1;i<ring.length;j=i++){const a=ring[i],b=ring[j];if((a[1]>p[1])!==(b[1]>p[1])&&p[0]<(b[0]-a[0])*(p[1]-a[1])/(b[1]-a[1])+a[0])found=!found;}return found;};
test('campaign partition covers entire extent without overlapping interiors',()=>{
 const cells=partition(REALMS.filter(r=>r.id!=='sheng'));
 assert.ok(Math.abs(cells.reduce((sum,r)=>sum+area(r.polygon),0)-162*66)<1e-7);
 for(let x=-11.87;x<150;x+=1.37)for(let y=-1.81;y<64;y+=1.19)assert.equal(cells.filter(r=>inside([x,y],r.polygon)).length,1,`${x},${y}`);
 const detailed=sharedRings(cells);assert.ok(Math.abs(detailed.reduce((sum,r)=>sum+area(r.polygon),0)-162*66)<1e-5);
});
test('T junctions split at shared vertices and both sides use the same curved chain',()=>{
 const cells=sharedRings([{polygon:[[0,0],[2,0],[2,2],[0,2]]},{polygon:[[2,0],[4,0],[4,1],[2,1]]},{polygon:[[2,1],[4,1],[4,2],[2,2]]}]);
 const edges=cells.map(c=>c.polygon.map((p,i)=>JSON.stringify([p,c.polygon[(i+1)%c.polygon.length]])));
 for(const i of [1,2]){
  const shared=cells[i].polygon.map((p,j)=>[p,cells[i].polygon[(j+1)%cells[i].polygon.length]]).filter(([a,b])=>a[0]<2.2&&b[0]<2.2);
  assert.ok(shared.length>2);
  for(const [a,b] of shared)assert.ok(edges[0].includes(JSON.stringify([b,a])));
 }
});
test('all ten state labels remain inside their state',()=>{
 for(const p of sharedRings(PROVINCES))assert.ok(inside(p.center,p.polygon),p.name);
});

import {INK_COAST,INK_SIZE,inkPoint,inkLandPath} from '../src/ink-coast.mjs';
import {provinceGeometry} from '../src/campaign-map.mjs';
const paintedLand=p=>INK_COAST.reduce((land,ring)=>land!==inside(p,ring),false);
test('paint-space shoreline keeps mainland, islands and water separate',()=>{
 assert.deepEqual(INK_SIZE,[1586,992]);assert.deepEqual(inkPoint([0,0]),[-12,64]);assert.deepEqual(inkPoint(INK_SIZE),[150,-2]);assert.ok(inkLandPath.startsWith('M-12.000000,-64.000000'));
 for(const p of [[1220,420],[1290,470],[1230,540],[1110,590],[680,750],[380,640],[1350,550],[740,820],[1200,900]])assert.ok(paintedLand(p),`painted land ${p}`);
 for(const p of [[1400,500],[1300,600],[1220,650],[1100,900],[850,700],[600,750],[450,800],[350,310],[170,260],[100,390]])assert.ok(!paintedLand(p),`painted water ${p}`);
});
import {worldIsLand,insideRing as geographicInside} from '../src/world-atlas.mjs';
test('campaign states use the regional geographic rings without painted-coordinate expansion',async()=>{
 const {provinceGeometry:regional}=await import('../src/regional-atlas.mjs');assert.equal(provinceGeometry,regional);
 for(const p of provinceGeometry){assert.ok(geographicInside(p.center,p.polygon));assert.ok(worldIsLand(p.center));}
});

import {reliefRings} from '../src/map-geometry.mjs';
import {realmGeometry,homeBorderPath} from '../src/campaign-map.mjs';
test('country relief keeps a complete shared partition and detailed borders for all added realms',()=>{
 const original=sharedRings(partition(REALMS.filter(r=>r.id!=='sheng'),[-20,180,-40,95])),detailed=reliefRings(original);
 assert.equal(detailed.length,REALMS.length-1);assert.ok(Math.abs(detailed.reduce((n,r)=>n+area(r.polygon),0)-200*135)<200*135*.04);
 for(let x=-10;x<170;x+=3.7)for(let y=-30;y<80;y+=3.1)assert.equal(detailed.filter(r=>inside([x,y],r.polygon)).length,1,`${x},${y}`);
 for(const r of detailed){assert.ok(r.polygon.length>50,r.id);assert.ok(inside(r.center,r.polygon),r.id);}
 assert.equal(realmGeometry.length,REALMS.length-1);assert.ok(homeBorderPath.length>100);
 // Warped outlines include substantial turns, rather than subdivisions on straight segments.
 const north=detailed.find(r=>r.id==='steppe'),base=original.find(r=>r.id==='steppe');
 assert.ok(north.polygon.some(p=>!inside(p,base.polygon)));
});

test('world labels are on their own geographic land and displayed land has one owner',()=>{
 const owns=(p,r)=>(r.polygons||[r.polygon]).reduce((yes,ring)=>yes!==geographicInside(p,ring),false);
 for(const r of realmGeometry){assert.ok(worldIsLand(r.center),r.id);assert.ok(owns(r.center,r),r.id);}
 for(let x=-11.81;x<150;x+=2.1)for(let y=-1.73;y<64;y+=1.7){const p=[x,y];if(!worldIsLand(p))continue;const home=provinceGeometry.filter(r=>geographicInside(p,r.polygon));assert.equal(home.length?home.length:realmGeometry.filter(r=>owns(p,r)).length,1,`${x},${y}`);}
});
