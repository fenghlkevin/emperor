import {northeastPoint} from '../src/map-geometry.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import {atlasLandRings,atlasIsLand,atlasIsPlayableLand} from '../src/atlas-geography.mjs';
import {regionalCoast,provinceGeometry} from '../src/regional-atlas.mjs';
import {newGame} from '../src/game.mjs';
import {occupyProvince} from '../src/occupation.mjs';
import {localMapRegions,territoryView} from '../src/territory-atlas.mjs';

test('expanded northern and southern countries fill the complete drawn land',()=>{
 for(const p of [[93,70],[105,72],[140,69],[30,-10],[20,-25]]){
  assert.ok(atlasIsLand(p),String(p));assert.ok(atlasIsPlayableLand(p),String(p));
 }
 for(const p of [[93,60],[110,34],[137,36],[114,-1]])assert.ok(atlasIsPlayableLand(p),String(p));
 for(const p of [[125,25],[135,30],[120,36]])assert.ok(!atlasIsLand(p),String(p));
});

test('shared eastern shore is exact and complete background coastlines do not self-cross',()=>{
 const start=regionalCoast.findIndex(([x,y])=>x===175&&y===60);
 assert.deepEqual(atlasLandRings[0].slice(0,regionalCoast.length-start-1),regionalCoast.slice(start,-1).map(northeastPoint));
 const cross=(a,b,c)=>(b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0]);
 for(const [n,ring]of atlasLandRings.entries())for(let i=0;i<ring.length;i++)for(let j=i+2;j<ring.length;j++){
  if(i===0&&j===ring.length-1)continue;
  const a=ring[i],b=ring[(i+1)%ring.length],c=ring[j],d=ring[(j+1)%ring.length];
  assert.ok(!(cross(a,b,c)*cross(a,b,d)<-1e-12&&cross(c,d,a)*cross(c,d,b)<-1e-12),`${n}/${i}/${j}`);
 }
 // No inland polygon edges silently fall back to long straight ruler lines.
 for(const g of provinceGeometry)for(let i=0;i<g.polygon.length;i++){
  const a=g.polygon[i],b=g.polygon[(i+1)%g.polygon.length];
  assert.ok(Math.hypot(a[0]-b[0],a[1]-b[1])<1,g.id);
 }
});

test('domestic camera grows with northern and western annexations but excludes unplayable land',()=>{
 const s=newGame('扩张取景'),initial=territoryView(localMapRegions(s.domestic));
 for(const id of ['siberia','japan','franks'])occupyProvince(s.domestic,id,1);
 const before=JSON.stringify(s),view=territoryView(localMapRegions(s.domestic));
 assert.ok(view[0]<initial[0]);assert.ok(view[1]<initial[1]);assert.ok(view[2]>initial[2]);
 assert.ok(view[1]>-84,'fit the drawn Arctic shoreline rather than raw cells up to latitude 95');
 assert.equal(JSON.stringify(s),before);
});
