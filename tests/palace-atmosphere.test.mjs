import test from 'node:test';
import assert from 'node:assert/strict';
import {palaceAtmosphere,palaceArtwork,SEASONS,DAYLIGHT} from '../src/palace-atmosphere.mjs';
test('all 36 turns map to four game-calendar seasons and repeat next year',()=>{for(let turn=1;turn<=72;turn++){const a=palaceAtmosphere({turn,phase:0});assert.equal(a.month,Math.floor((turn-1)%36/3)+1);assert.equal(a.season.id,SEASONS[Math.floor((turn-1)%36/9)].id);}assert.equal(palaceAtmosphere({turn:28,phase:0}).season.id,'winter');});
test('four seasonal illustrations combine with six distinct daylight states',()=>{const combinations=new Set();for(let season=0;season<4;season++)for(let phase=0;phase<6;phase++){const state={turn:1+season*9,phase};const a=palaceAtmosphere(state),html=palaceArtwork(state);assert.equal(a.light.id,DAYLIGHT[phase].id);assert.match(html,new RegExp(`data-season="${SEASONS[season].id}"`));assert.match(html,new RegExp(`data-daylight="${DAYLIGHT[phase].id}"`));assert.ok(html.includes(a.image));assert.equal(html.includes('palace-particles palace-snow'),a.weather==='snow');combinations.add(a.label);}assert.equal(combinations.size,24);});
test('old saves without phase display dawn',()=>{assert.equal(palaceAtmosphere({turn:1}).light.id,'dawn');});

test('weather varies by save and time, stays stable on redraw and respects seasons',()=>{
 const weather=new Set(),variants=new Set();
 for(let i=0;i<120;i++){
 const s={name:`帝${i}`,createdAt:`save-${i}`,turn:1,phase:i%6};const a=palaceAtmosphere(s);
 assert.deepEqual(palaceAtmosphere(structuredClone(s)),a);assert.notEqual(a.weather,'snow');weather.add(a.weather);variants.add(a.variation);
 }
 assert.ok(weather.size>=4);assert.equal(variants.size,3);
 const a=palaceAtmosphere({name:'帝',turn:28,phase:0});assert.ok(['snow','cloudy','clear'].includes(a.weather));
});
