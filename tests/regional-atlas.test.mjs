import test from 'node:test';import assert from 'node:assert/strict';import {provinceGeometry,regionalLandPath} from '../src/regional-atlas.mjs';
const key=p=>p.join(',');const inside=(p,r)=>{let yes=false;for(let i=0,j=r.length-1;i<r.length;j=i++){const a=r[i],b=r[j];if((a[1]>p[1])!==(b[1]>p[1])&&p[0]<(b[0]-a[0])*(p[1]-a[1])/(b[1]-a[1])+a[0])yes=!yes;}return yes;};
test('regional labels remain inside one selected province and polygons do not overlap',()=>{assert.equal(provinceGeometry.length,10);for(const p of provinceGeometry){assert.ok(inside(p.center,p.polygon),p.id);assert.equal(provinceGeometry.filter(q=>inside(p.center,q.polygon)).length,1);}for(let x=94.07;x<123;x+=.31)for(let y=21.03;y<42;y+=.29)assert.ok(provinceGeometry.filter(p=>inside([x,y],p.polygon)).length<=1,`${x},${y}`);});
test('every shared regional boundary is the same reversed chain',()=>{const directed=new Set(),undirected=new Map();for(const p of provinceGeometry)for(let i=0;i<p.polygon.length;i++){const a=key(p.polygon[i]),b=key(p.polygon[(i+1)%p.polygon.length]);assert.notEqual(a,b);assert.ok(!directed.has(a+'/'+b),'overlapping same-direction boundary');directed.add(a+'/'+b);const k=[a,b].sort().join('/');undirected.set(k,(undirected.get(k)??0)+1);}assert.ok([...undirected.values()].filter(n=>n===2).length>60);assert.ok([...undirected.values()].every(n=>n<=2));assert.ok(regionalLandPath.length>2000);});

test('shore does not cross itself and coastal provinces reuse the shore instead of leaving independently drawn strips',async()=>{
 const {regionalCoast}=await import('../src/regional-atlas.mjs');
 const cross=(a,b,c)=>(b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0]);
 for(let i=0;i<regionalCoast.length-1;i++)for(let j=i+2;j<regionalCoast.length-1;j++){const a=regionalCoast[i],b=regionalCoast[i+1],c=regionalCoast[j],d=regionalCoast[j+1];assert.ok(!(cross(a,b,c)*cross(a,b,d)<-1e-12&&cross(c,d,a)*cross(c,d,b)<-1e-12),`crossed shore ${i}/${j}`);}
 const coast=new Set(regionalCoast.map(key));for(const id of ['hebei','huainan','jiangnan','lingnan']){const p=provinceGeometry.find(p=>p.id===id);assert.ok(p.polygon.filter(v=>coast.has(key(v))).length>15,`${id}: coast must be shared`);}
});
