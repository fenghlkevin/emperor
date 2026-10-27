import test from 'node:test';
import assert from 'node:assert/strict';
import {existsSync,readFileSync} from 'node:fs';
import {RANDOM_BEAUTY_ART,EVENT_BEAUTY_ART,resolveRandomPortraitAsset} from '../src/random-beauties-data.mjs';
import {BEAUTY_CITIES} from '../src/beauty-cities.mjs';
import {generateBeauty} from '../src/random-beauty-generation.mjs';
import {newGame,validateSave} from '../src/game.mjs';
import {palaceAction} from '../src/emperor.mjs';
import {portraitDataUrl} from '../src/beauty-raster-portrait.mjs';
const names=['刘雯','奚梦瑶','何穗','杜鹃','裴蓓','游天翼','秦舒培','雎晓雯','孙菲菲','张丽娜','陈碧舸','侯梦蝶','林志玲','贺聪','杨颖','赵佳丽','柳岩','徐若瑄'];
const additions=RANDOM_BEAUTY_ART.filter(r=>r.id.startsWith('model-couture-20261026-'));
test('all eighteen portraits are registered once and Zhang Zilin keeps one catalogue entry',()=>{
 assert.equal(additions.length,18);
 const manifest=JSON.parse(readFileSync(new URL('../outputs/model-portraits-20261026/manifest.json',import.meta.url)));
 for(const name of names){const rows=additions.filter(r=>r.name===name+'-古绡模特');assert.equal(rows.length,1,name);const r=rows[0];assert.equal(r.regionId,'sheng');assert.equal(r.poolScope,'mainland');assert.ok(existsSync(new URL('../'+r.asset,import.meta.url)));const source=manifest.registered.find(s=>s.name===name);assert.deepEqual(readFileSync(new URL('../'+r.asset,import.meta.url)),readFileSync(new URL('../outputs/model-portraits-20261026/'+source.source,import.meta.url)),name+' uses selected revision');}
 assert.equal(RANDOM_BEAUTY_ART.filter(r=>r.name==='张梓琳').length,1);
 if(manifest.existingRetained.source){assert.deepEqual(readFileSync(new URL('../'+manifest.existingRetained.asset,import.meta.url)),readFileSync(new URL('../outputs/model-portraits-20261026/'+manifest.existingRetained.source,import.meta.url)));}
});
test('each mainland city can draw all eighteen portraits and admission persists the selected image',()=>{
 const found=new Map();let serial=0;
 for(const city of BEAUTY_CITIES.filter(c=>c.regionId==='sheng')){
  const seen=new Set();for(let i=0;i<RANDOM_BEAUTY_ART.length;i++){const p=generateBeauty({id:`random-beauty-1-${serial++}`,cityId:city.id,random:()=>(i+.5)/RANDOM_BEAUTY_ART.length});if(additions.some(r=>r.asset===p.randomPortraitAsset)){seen.add(p.randomPortraitAsset);found.set(p.randomPortraitAsset,p);}}
  assert.equal(seen.size,18,city.id);
 }
 for(const [asset,p] of found){const s=newGame('模特立绘验证');s.harem.encounter=p;const admitted=palaceAction(s,'admit',{rank:null}).state;const saved=validateSave(JSON.parse(JSON.stringify(admitted)));const member=saved.harem.members.find(m=>m.id===p.id);assert.equal(member.randomPortraitAsset,asset);assert.equal(portraitDataUrl(member),portraitDataUrl(p));}
});

test('removed Lynn Hung is absent from all random catalogue entries',()=>{assert.ok(!RANDOM_BEAUTY_ART.some(r=>r.name.includes('熊黛林')));});

test('replaced models leave the random pool and saved paths resolve to replacements',()=>{
 for(const [old,name] of [['乐基儿','贺聪'],['王李丹妮','赵佳丽']]){
  assert.ok(!RANDOM_BEAUTY_ART.some(r=>r.name.includes(old)));
  const row=RANDOM_BEAUTY_ART.find(r=>r.name===name+'-古绡模特');
  const legacy='assets/beauties/random/女明星/'+old+'-古绡模特.png';
  assert.equal(resolveRandomPortraitAsset(legacy),row.asset);
  assert.equal(portraitDataUrl({id:'random-beauty-1-0',randomPortraitAsset:legacy}),portraitDataUrl({id:'random-beauty-1-0',randomPortraitAsset:row.asset}));
 }
});

test('Zhang Yuxi replaces Zhang Tianai and three Liu Yifei variants are reachable without removing the original',()=>{
 assert.ok(!RANDOM_BEAUTY_ART.some(r=>r.name==='张天爱'));
 const replacement=RANDOM_BEAUTY_ART.find(r=>r.name==='张予曦');
 for(const old of ['assets/beauties/random/张天爱.png','assets/beauties/random/女明星/张天爱.png'])assert.equal(resolveRandomPortraitAsset(old),replacement.asset);
 assert.ok(RANDOM_BEAUTY_ART.some(r=>r.name==='刘亦菲'));
 const liuVariants=RANDOM_BEAUTY_ART.filter(r=>r.id.startsWith('liu-yifei-variants-20261026-'));
 assert.equal(liuVariants.length,3);
 const carmanVariants=EVENT_BEAUTY_ART.filter(r=>r.id.startsWith('carman-lee-20261026-'));
 assert.deepEqual(carmanVariants.map(r=>r.name).sort(),['李若彤-小龙女','李若彤-王语嫣']);
 assert.ok(!RANDOM_BEAUTY_ART.some(r=>r.id.startsWith('carman-lee-20261026-')),'Carman Lee characters are event-exclusive');
 const variants=liuVariants;
 for(const row of variants)assert.ok(existsSync(new URL('../'+row.asset,import.meta.url)),row.name);
 const expected=new Set(variants.map(r=>r.asset));
 const seen=new Set();
 for(let i=0;i<RANDOM_BEAUTY_ART.length;i++){
  const p=generateBeauty({id:'random-beauty-3-'+i,cityId:'guannei',random:()=>(i+.5)/RANDOM_BEAUTY_ART.length});
  if(!expected.has(p.randomPortraitAsset))continue;
  seen.add(p.randomPortraitAsset);
  const s=newGame('新增造型验收');s.harem.encounter=p;
  const saved=validateSave(JSON.parse(JSON.stringify(palaceAction(s,'admit',{rank:null}).state)));
  assert.equal(saved.harem.members.find(m=>m.id===p.id).randomPortraitAsset,p.randomPortraitAsset);
 }
 assert.deepEqual(seen,expected);
});
