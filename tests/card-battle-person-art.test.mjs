import {test} from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';
import {BATTLE_PERSON_ART,battlePersonArt,battleDefinitionArt} from '../src/card-battle-person-art.mjs';import {CARD_CATALOG} from '../src/card-battle-data.mjs';import {personProductionManifest} from '../src/card-battle-person-presentations.mjs';
test('all100 dedicated battle illustrations bind canonical historical IDs and correct individual roles without changing official portraits',()=>{assert.equal(Object.keys(BATTLE_PERSON_ART).length,100);const original=JSON.stringify(CARD_CATALOG);for(const [id,a]of Object.entries(BATTLE_PERSON_ART)){const d=CARD_CATALOG.cards.find(d=>d.type==='general'&&d.person_id===id);assert.ok(d);assert.equal(a.name,d.name);assert.equal(a.role,d.source.role);assert.equal(a.personId,id);assert.notEqual(a.src,d.art.full);assert.equal(battleDefinitionArt(d.id),a);assert.equal(personProductionManifest().find(p=>p.personId===id).battleArt.src,a.src);}assert.equal(JSON.stringify(CARD_CATALOG),original);});
test('dedicated battle raster assets have genuine portrait5:7 dimensions rather than stretching the court full-body image',()=>{for(const a of Object.values(BATTLE_PERSON_ART)){const b=readFileSync(a.src);assert.equal(b.toString('ascii',1,4),'PNG');const width=b.readUInt32BE(16),height=b.readUInt32BE(20);assert.ok(width>=1000&&height>=1400);assert.ok(Math.abs(width/height-5/7)<.02);}});
test('unknown people, names and non-person cards cannot accidentally inherit another hero battle image',()=>{for(const id of ['张飞','刘基','unknown',undefined,null])assert.equal(battlePersonArt(id),null);for(const id of ['precision','vanguard','person_unknown',undefined])assert.equal(battleDefinitionArt(id),null);assert.equal(personProductionManifest().filter(p=>p.battleArt).length,100);});
test('all shipped historical battle art matches its recorded generation checksum and exact identity manifest',async()=>{
 const {createHash}=await import('node:crypto');
 const ids=new Set();
 const cleanup=JSON.parse(readFileSync('docs/resource-cleanup-20261027.json','utf8'));
 const archived=new Map(cleanup.changes.filter(r=>r.action==='archive').map(r=>[r.path,r.destination]));
 const adaptation=JSON.parse(readFileSync('docs/card-battle-identity-replacements.json','utf8'));
 const replacements=adaptation.replacements;
 const corrections=JSON.parse(readFileSync('docs/card-battle-person-art-corrections.json','utf8')).assets;
 for(let batch=1;batch<=9;batch++){
  const report=JSON.parse(readFileSync(`docs/card-battle-person-art-batch${batch}.json`,'utf8'));
  for(const asset of report.assets??report.jobs){
   const oldId=asset.personId??asset.id,id=replacements.find(r=>r.oldId===oldId)?.newId??oldId;assert.ok(!ids.has(id),'duplicate generation identity '+id);ids.add(id);
   const registered=battlePersonArt(id);assert.ok(registered,id);const correction=corrections.find(x=>x.personId===id)??adaptation.assets.find(x=>x.personId===id&&x.variant==='battle');assert.equal(registered.src,correction?.path??asset.path);
   if(correction){const updated=readFileSync(correction.path);assert.equal(createHash('sha256').update(updated).digest('hex'),correction.sha256,id+' correction');assert.deepEqual([updated.readUInt32BE(16),updated.readUInt32BE(20)],correction.dimensions);assert.equal(correction.originalPath,asset.path);}
   const bytes=readFileSync(archived.get(asset.path)??asset.path);assert.equal(createHash('sha256').update(bytes).digest('hex'),asset.sha256,id);
   assert.deepEqual([bytes.readUInt32BE(16),bytes.readUInt32BE(20)],asset.dimensions,id);
  }
 }
 assert.deepEqual([...ids].sort(),Object.keys(BATTLE_PERSON_ART).sort());
});
