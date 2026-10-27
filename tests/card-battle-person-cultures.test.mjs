import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {PERSON_CULTURE_REVIEWS,personCultureReview} from '../src/card-battle-person-culture-data.mjs';
import {personProductionManifest} from '../src/card-battle-person-presentations.mjs';
import {CARD_CULTURES} from '../src/card-battle-cultures.mjs';

test('production culture metadata matches all reviewed IDs with explicit user-selected historical adaptations',()=>{
 const evidence=JSON.parse(readFileSync(new URL('../docs/card-battle-person-cultural-evidence.json',import.meta.url),'utf8'));
 const manifest=personProductionManifest();
 assert.equal(manifest.length,100);
 assert.equal(Object.keys(PERSON_CULTURE_REVIEWS).length,100);
 for(const row of manifest){
  const source=evidence.people.find(p=>p.personId===row.personId);
  assert.equal(row.name,source.name);
  assert.equal(row.culture,source.culture);
  assert.equal(row.cultureStatus,source.cultureStatus);
  assert.ok(row.cultureReview.conclusion);
  if(row.culture){assert.ok(CARD_CULTURES[row.culture]);assert.equal(row.cultureReview.period,source.period);assert.ok(source.evidence.some(e=>e.url?.startsWith('https://')));}
  else{assert.equal(row.source.catalogVerified,false);assert.equal(row.source.reviewStatus,'historical-link-pending');assert.equal(row.catalogDynasty,'原作');assert.equal(row.cultureReview.period,null);}
  assert.equal(row.presentation.regionalArt,'pending');
  assert.ok(Object.values(row.acceptance).every(v=>!v));
 }
 assert.equal(manifest.filter(p=>p.culture).length,100);
 assert.equal(manifest.filter(p=>!p.culture).length,0);
});

test('regional metadata is ID-only, immutable and cannot erase distinct period or family context',()=>{
 assert.equal(personCultureReview('拔都'),null);
 assert.equal(personCultureReview('unknown'),null);
 const a=personCultureReview('general-638-62417');assert.equal(a.culture,'steppe');a.evidence.length=0;
 assert.ok(personCultureReview('general-638-62417').evidence.length);
 assert.ok(Object.isFrozen(PERSON_CULTURE_REVIEWS['general-638-62417']));
 assert.match(personCultureReview('manual-1624').region,/满洲正红旗/);
 assert.equal(personCultureReview('manual-1624').culture,'central');
 assert.match(personCultureReview('general-795-83328').region,/日本/);
 assert.equal(personCultureReview('general-795-83328').culture,'central');
 assert.equal(personCultureReview('original-89').culture,'central');
 assert.equal(personCultureReview('original-89').period,'隋末唐初');
 assert.notEqual(personCultureReview('cbdb-3767').period,personCultureReview('manual-1624').period);
});
