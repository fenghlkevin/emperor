import test from 'node:test';import assert from 'node:assert/strict';
import {newGame,validateSave} from '../src/game.mjs';
import {occupyProvince} from '../src/occupation.mjs';
import {localMapRegions,ownedRegions,territoryView} from '../src/territory-atlas.mjs';
import {worldLandRings,insideRing} from '../src/world-atlas.mjs';
test('all annexed regions survive reload and expand local maps without changing saves',()=>{
 const s=newGame('领土');for(const id of ['tuyuhun','korea','japan'])occupyProvince(s.domestic,id,1);
 const loaded=validateSave(structuredClone(s)),before=JSON.stringify(loaded),rows=localMapRegions(loaded.domestic),view=territoryView(rows);
 assert.equal(rows.length,13);assert.equal(ownedRegions(loaded.domestic).length,13);
 for(const id of ['tuyuhun','korea','japan']){const g=rows.find(g=>g.id===id+'-core');assert.ok(g);assert.equal(g.owner,'sheng');
  for(const p of [g.center,...worldLandRings.flat().filter(p=>(g.polygons??[g.polygon]).some(r=>insideRing(p,r)))])assert.ok(p[0]>=view[0]&&p[0]<=view[0]+view[2]&&-p[1]>=view[1]&&-p[1]<=view[1]+view[3]);
 }
 assert.equal(JSON.stringify(loaded),before);
});
test('lost original states remain selectable but cease to be owned',()=>{
 const s=newGame('失地');occupyProvince(s.domestic,'sheng',1,'korea','hebei');
 assert.equal(localMapRegions(s.domestic).find(g=>g.id==='hebei').owner,'korea');
 assert.ok(!ownedRegions(s.domestic).some(g=>g.id==='hebei'));
});
