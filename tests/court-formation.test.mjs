import test from 'node:test';
import assert from 'node:assert/strict';
import {COURT_ACTOR_SLOTS} from '../src/court-actors.mjs';
import {COURT_SIDES} from '../src/personnel.mjs';
const ranks=[
 ['works-deputy','works-minister','justice-minister','justice-deputy'],
 ['war-deputy','war-minister','rites-minister','rites-deputy'],
 ['revenue-deputy','revenue-minister','personnel-minister','personnel-deputy'],
 ['prime-minister','central-general']
];
test('court follows the requested four ranks from doorway to throne, with paired departments and mirrored positions',()=>{
 assert.deepEqual(Object.keys(COURT_ACTOR_SLOTS),ranks.flat());
 let previous=0;
 for(const rank of ranks){const slots=rank.map(id=>COURT_ACTOR_SLOTS[id]);assert.ok(slots[0][1]>previous);previous=slots[0][1];for(let i=0;i<slots.length;i++){assert.equal(slots[i][1],previous);if(i)assert.ok(slots[i][0]>slots[i-1][0]);assert.equal(slots[i][0]+slots[slots.length-1-i][0],100);}}
 assert.deepEqual(COURT_SIDES[0][1],ranks.flatMap(r=>r.slice(0,r.length/2)));
 assert.deepEqual(COURT_SIDES[1][1],ranks.flatMap(r=>r.slice(r.length/2)));
});
