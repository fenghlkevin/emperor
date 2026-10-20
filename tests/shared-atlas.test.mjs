import test from 'node:test';
import assert from 'node:assert/strict';
import {newGame} from '../src/game.mjs';
import {atlasBase,atlasBorders} from '../src/atlas-base.mjs';
import {homePath,provinceGeometry,territoryPath} from '../src/campaign-map.mjs';
import {atlasLandPath,atlasCampaignPath} from '../src/atlas-geography.mjs';
import {diplomaticMap} from '../src/court-diplomacy-ui.mjs';
import {targetMap} from '../src/war-target-map.mjs';

test('all atlas bases retain the identical coastline and protect the entire imperial territory',()=>{
 for(const id of ['world','readonly-region','court-atlas','garrison-atlas','special','diplomatic','war','grain-trade']){
  const base=atlasBase(id);
  assert.ok(base.includes(`<path d="${atlasLandPath}" clip-path="url(#${id}-campaign)" clip-rule="evenodd"/>`),id);
  assert.ok(base.includes(`<path d="${homePath}" fill="black"/>`),id);
  assert.ok(base.includes(`id="${id}-foreign"`),id);
  assert.ok(base.includes(`<path d="${atlasCampaignPath}"/>`),id);
  const relief=atlasBorders(id);
  assert.ok(!relief.includes('atlas-river'),id);
  assert.ok(relief.includes('pointer-events="none"'),id);
 }
});

test('diplomatic and campaign maps keep every domestic province and mask only the surrounding realms without changing state',()=>{
 const state=newGame('统一舆图'),d=state.domestic,before=JSON.stringify(state);
 for(const [id,markup] of [['diplomatic',diplomaticMap(d,'japan')],['war',targetMap(d,d.countries.filter(c=>c.id!==d.playerCountryId),'japan')]]){
  for(const province of provinceGeometry)assert.ok(markup.includes(`d="${territoryPath(province)}"`),province.id);
  assert.ok(markup.includes(`<path d="${homePath}" fill="black"/>`));
  assert.ok(markup.includes(`mask="url(#${id}-foreign)"`));
  assert.ok(markup.includes('class="atlas-relief"'));
 }
 assert.equal(JSON.stringify(state),before);
});

// Color identity must survive sorting, changing maps and adding core suffixes.
test('all countries have independent stable colors across maps and territorial ownership',async()=>{
 const {REALMS}=await import('../src/domestic.mjs');
 const {atlasCountryColor,atlasTone}=await import('../src/atlas-colors.mjs');
 const colors=REALMS.map(r=>atlasCountryColor(r.id));
 assert.equal(new Set(colors).size,REALMS.length);
 for(const r of REALMS){
  assert.equal(atlasCountryColor(r.id+'-core'),atlasCountryColor(r.id));
  assert.ok(atlasTone({id:'other-core',owner:r.id}).includes(atlasCountryColor(r.id)));
 }
});
