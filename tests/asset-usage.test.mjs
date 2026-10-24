import {TOUR_CAMEOS,tourCameo} from '../src/tour-cameos.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {TOUR_EVENTS} from '../src/tour-events.mjs';
import {AUSPICES} from '../src/auspices.mjs';
import {ENVOY_COUNTRIES,portraitAsset} from '../src/envoy-portraits.mjs';
import {portraitDataUrl} from '../src/beauty-raster-portrait.mjs';
import {OFFICIAL_ART} from '../src/official-art-data.mjs';
import {BEAUTY_REGIONS} from '../src/beauties.mjs';
const root=new URL('../',import.meta.url);
const files=directory=>fs.readdirSync(new URL(directory+'/',root),{withFileTypes:true}).flatMap(entry=>entry.isDirectory()?files(directory+'/'+entry.name):[directory+'/'+entry.name]);
// Audit only modules and styles reachable from the actual game entry point.
function runtimeFiles(){
 const visited=new Set(),pending=['index.html'];
 while(pending.length){
  const file=pending.pop();if(visited.has(file))continue;
  assert.ok(fs.existsSync(new URL(file,root)),`missing runtime dependency: ${file}`);
  visited.add(file);
  const source=fs.readFileSync(new URL(file,root),'utf8');
  const pattern=file.endsWith('.html')?/(?:href|src)=['"]([^'"]+)['"]/g:file.endsWith('.css')?/@import\s+(?:url\()?['"]([^'"]+)['"]/g:/(?:from\s*|import\s*\(|import\s*)['"]([^'"]+)['"]/g;
  for(const [,ref] of source.matchAll(pattern)){
   if(/^(?:https?:|node:)/.test(ref))continue;
   const dependency=path.posix.normalize(path.posix.join(path.posix.dirname(file),ref));
   if(/\.(?:mjs|js|cjs|css|html)$/.test(dependency))pending.push(dependency);
  }
 }
 return [...visited];
}
test('all shipped non-beauty artwork has a runtime consumer, including dynamic paths',()=>{
 const used=new Set();
 for(const file of runtimeFiles()){
  const source=fs.readFileSync(new URL(file,root),'utf8');
  for(const asset of source.matchAll(/assets\/[^\s'"`<>?()]+\.(?:png|svg|ttf)/g)){
   if(!/[${}]/.test(asset[0]))used.add(asset[0]);
  }
 }
 for(const event of TOUR_EVENTS)if(event.art&&!tourCameo(event.id))used.add(`assets/scenes/tour/sketch-tour-${event.art}.png`);
 for(const kind of ['tour','incognito'])used.add(`assets/scenes/travel/sketch-travel-${kind}.png`);
 for(const season of ['spring','summer','autumn','winter'])used.add(`assets/scenes/palace/sketch-palace-${season}.png`);
 for(const event of AUSPICES)used.add(`assets/auspices/${event.id}.png`);
 for(const id of ENVOY_COUNTRIES)for(let variant=0;variant<3;variant++)used.add(portraitAsset({countryId:id,variant}));
 // Composite markup chooses these short paths inside a single assets prefix.
 used.add('assets/examinations/exam-gongyuan.png');
 used.add('assets/scenes/governance/sketch-governance-scenes-v1.png');
 const nonBeauty=asset=>!asset.startsWith('assets/beauties/');
 for(const asset of [...used].filter(nonBeauty))assert.ok(fs.existsSync(new URL(asset,root)),`missing runtime asset: ${asset}`);
 const unused=files('assets').filter(nonBeauty).filter(asset=>!used.has(asset)&&!['assets/fonts/OFL-LXGWZhenKai.txt','assets/auspices/README.md','assets/royal-events/README.md'].includes(asset)&&!/^assets\/officials\/(?:[^/]+\/)*readme\.md$/.test(asset));
 assert.deepEqual(unused,[],'unreferenced artwork must not remain in asset subdirectories');
});
test('legacy regional portraits resolve to existing complete images for every country',()=>{
 for(const region of BEAUTY_REGIONS){
  const person={id:`legacy-${region.id}`,regionId:region.id,randomBeauty:true,regionalPortrait:true,portraitRecipe:{seed:123}};
  const url=portraitDataUrl(person);
  assert.match(new URL(url).pathname,/assets\/beauties\/random\/.+\.png$/);
  assert.ok(fs.existsSync(new URL(url)));
  assert.equal(portraitDataUrl(structuredClone(person)),url);
 }
});

test('official portrait registry contains only variants consumed by the UI',()=>{
 for(const [id,art] of Object.entries(OFFICIAL_ART)){
  assert.ok(Object.keys(art).every(key=>['avatar','full','court'].includes(key)),`unused portrait variant registered for ${id}`);
  for(const [variant,asset] of Object.entries(art))assert.equal(asset,`assets/officials/${id.startsWith('random-')?'random':'historical'}/${id}/${variant}.png`);
 }
});


test('screen cameos use distinct existing portraits and existing event backgrounds',()=>{
 assert.equal(new Set(TOUR_CAMEOS.map(c=>c.portraitAsset)).size,TOUR_CAMEOS.length);
 for(const c of TOUR_CAMEOS){
  assert.ok(fs.existsSync(new URL(c.portraitAsset,root)),c.name+' portrait missing');
  assert.ok(fs.existsSync(new URL(c.sceneAsset,root)),c.name+' scene missing');
  if(c.encounterPortraitAsset)assert.ok(fs.existsSync(new URL(c.encounterPortraitAsset,root)),c.name+' disguise missing');
  assert.ok(portraitDataUrl({travelOrigin:{easterEgg:c.id}}).endsWith(c.portraitAsset));
 }
});
