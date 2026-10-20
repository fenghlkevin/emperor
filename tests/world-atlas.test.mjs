import test from 'node:test';import assert from 'node:assert/strict';
import {worldRealmGeometry,worldLandRings,worldIsLand,insideRing,provinceGeometry} from '../src/world-atlas.mjs';
import {REALMS} from '../src/scenario-geography.mjs';
import {provinceGeometry as regional,regionalCoast} from '../src/regional-atlas.mjs';
test('world candidates share the exact state geometry and eastern shoreline, with realm labels on their own land',()=>{
 assert.equal(provinceGeometry,regional);assert.deepEqual(worldLandRings[0].slice(0,regionalCoast.length),regionalCoast);assert.equal(worldRealmGeometry.length,REALMS.length-1);
 for(const r of worldRealmGeometry){assert.ok(worldIsLand(r.center),r.id);assert.ok(r.polygons.some(p=>insideRing(r.center,p)),r.id);assert.ok(!regional.some(p=>insideRing(r.center,p.polygon)),r.id);}
});
test('world geographic coastline separates key land and seas without using painting coordinates',()=>{
 for(const p of [[110,34],[127,38],[137,36],[131,32],[81,7],[20,26],[39,8],[51,30],[77,20]])assert.ok(worldIsLand(p),`land ${p}`);
 for(const p of [[125,25],[135,30],[120,36],[117,19],[60,16]])assert.ok(!worldIsLand(p),`sea ${p}`);
});

test('island ownership is unique and retains the intended campaign realm',()=>{
 for(const [id,points]of [['japan',[[137,36],[131,32],[133.5,33.5],[143,43]]],['korea',[[127,38]]],['luzon',[[121,18],[124,8]]],['sinhala',[[81,7]]],['java',[[114,-1]]],['srivijaya',[[100,1],[113,4]]]])for(const p of points){assert.ok(worldIsLand(p));assert.deepEqual(worldRealmGeometry.filter(r=>r.polygons.some(r=>insideRing(p,r))).map(r=>r.id),[id],`${id}/${p}`);}
});

test('world mainland has no crossing shoreline segments',()=>{
 const r=worldLandRings[0],cross=(a,b,c)=>(b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0]);
 for(let i=0;i<r.length-1;i++)for(let j=i+2;j<r.length-1;j++)assert.ok(!(cross(r[i],r[i+1],r[j])*cross(r[i],r[i+1],r[j+1])<-1e-12&&cross(r[j],r[j+1],r[i])*cross(r[j],r[j+1],r[i+1])<-1e-12),`${i}/${j}`);
});

test('every island coastline closes without self crossings and southern islands retain one realm',()=>{
 const cross=(a,b,c)=>(b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0]);
 for(const [n,r]of worldLandRings.entries())for(let i=0;i<r.length;i++)for(let j=i+2;j<r.length;j++){
  if(i===0&&j===r.length-1)continue;
  const a=r[i],b=r[(i+1)%r.length],c=r[j],d=r[(j+1)%r.length];
  assert.ok(!(cross(a,b,c)*cross(a,b,d)<-1e-12&&cross(c,d,a)*cross(c,d,b)<-1e-12),`ring ${n}: ${i}/${j}`);
 }
 for(const [ring,id]of [[worldLandRings.at(-3),'srivijaya'],[worldLandRings.at(-2),'srivijaya'],[worldLandRings.at(-1),'java']]){
  const center=ring.reduce((p,q)=>[p[0]+q[0]/ring.length,p[1]+q[1]/ring.length],[0,0]);
  for(const p of ring.map(q=>q.map((v,k)=>v*.99+center[k]*.01))){
   assert.deepEqual(worldRealmGeometry.filter(r=>r.polygons.reduce((yes,poly)=>yes!==insideRing(p,poly),false)).map(r=>r.id),[id]);
  }
 }
});


test('northeastern countries have compact visible land rather than parallel north-south strips',async()=>{
 const {atlasLandRings,atlasIsLand}=await import('../src/atlas-geography.mjs');
 for(const id of ['steppe','khitan','mohe','far-east']){
  const r=worldRealmGeometry.find(r=>r.id===id);
  const points=[...r.polygons.flat().filter(atlasIsLand),...atlasLandRings.flat().filter(p=>r.polygons.some(ring=>insideRing(p,ring)))];
  const xs=points.map(p=>p[0]),ys=points.map(p=>p[1]);
  const width=Math.max(...xs)-Math.min(...xs),height=Math.max(...ys)-Math.min(...ys);
  assert.ok(height/width<1.5,`${id}: visible land is too tall and narrow`);
  assert.ok(height/width>.45,`${id}: visible land is too flat`);
 }
});


test('expanded countries cover all drawn continental land without white end slivers',async()=>{
 const {atlasIsPlayableLand,atlasLandRings}=await import('../src/atlas-geography.mjs');
 const points=[...atlasLandRings[0].filter((_,i)=>i%4===0).map(p=>[p[0]*.999+90*.001,p[1]*.999+35*.001])];
 for(let x=-17.07;x<180;x+=2.31)for(let y=-34.13;y<79;y+=1.71)if(atlasIsPlayableLand([x,y]))points.push([x,y]);
 for(const p of points.filter(atlasIsPlayableLand))assert.equal(worldRealmGeometry.filter(r=>r.polygons.reduce((yes,poly)=>yes!==insideRing(p,poly),false)).length,1,String(p));
});
