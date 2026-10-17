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
test('coastal state seams reach the painted shore without an inland gap or overlapping wedge',()=>{
 // East China: west is land, east is sea. Each seam crosses the painted coast.
 const toGeo=inkPoint;
 for(const [name,land,water]of [
  ['河北',[1320,400],[1380,400]],['淮南',[1300,480],[1380,480]],['江南',[1250,540],[1370,540]]
 ]){
  const ring=provinceGeometry.find(p=>p.name===name).polygon;
  assert.ok(paintedLand(land));assert.ok(!paintedLand(water));assert.ok(inside(toGeo(land),ring),`${name} reaches coast`);
 }
 // Samples around the formerly mismatched Hebei/Huainan junction have one owner.
 for(let x=1260.31;x<1340;x+=2.3)for(let y=408.17;y<428;y+=1.7){
  if(paintedLand([x,y]))assert.equal(provinceGeometry.filter(p=>inside(toGeo([x,y]),p.polygon)).length,1,`${x},${y}`);
 }
});

import {reliefRings} from '../src/map-geometry.mjs';
import {realmGeometry,homeBorderPath} from '../src/campaign-map.mjs';
test('country relief keeps a complete shared partition and detailed borders for all added realms',()=>{
 const original=sharedRings(partition(REALMS.filter(r=>r.id!=='sheng'))),detailed=reliefRings(original);
 assert.equal(detailed.length,33);assert.ok(Math.abs(detailed.reduce((n,r)=>n+area(r.polygon),0)-162*66)<1e-4);
 for(const r of detailed){assert.ok(r.polygon.length>50,r.id);assert.ok(inside(r.center,r.polygon),r.id);}
 assert.equal(realmGeometry.length,33);assert.ok(homeBorderPath.length>100);
 // Warped outlines include substantial turns, rather than subdivisions on straight segments.
 const north=detailed.find(r=>r.id==='steppe'),base=original.find(r=>r.id==='steppe');
 assert.ok(north.polygon.some(p=>!inside(p,base.polygon)));
});

test('every realm label is on its own painted land and all land has exactly one owner',()=>{
 const owns=(p,r)=>(r.polygons||[r.polygon]).reduce((yes,ring)=>yes!==inside(inkPoint(p),ring),false);
 for(const r of realmGeometry){const p=[(r.center[0]+12)/162*1586,(64-r.center[1])/66*992];assert.ok(paintedLand(p),`${r.name} label on land`);assert.ok(owns(p,r),`${r.name} label in territory`);}
 for(let y=3.31;y<992;y+=7.7)for(let x=2.17;x<1586;x+=7.3){
  if(!paintedLand([x,y]))continue;
  const home=provinceGeometry.filter(r=>inside(inkPoint([x,y]),r.polygon));
  assert.equal(home.length?home.length:realmGeometry.filter(r=>owns([x,y],r)).length,1,`land ownership ${x},${y}`);
 }
 for(const [id,points]of [
  ['japan',[[1562,219],[1540,290],[1487,389],[1448,409]]],
  ['korea',[[1380,340],[1395,350]]],
  ['india',[[680,700],[700,790],[790,620]]],
  ['luzon',[[1350,669],[1380,710],[1380,790],[1318,767]]],
  ['sinhala',[[738,817]]],['srivijaya',[[980,875],[1210,890]]],['java',[[1110,963],[1310,890]]]
 ])for(const point of points){assert.ok(paintedLand(point),`${id} sample is land ${point}`);assert.deepEqual(realmGeometry.filter(r=>owns(point,r)).map(r=>r.id),[id]);}
});
