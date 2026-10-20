import test from 'node:test';import assert from 'node:assert/strict';
import {diplomaticViewport} from '../src/court-diplomacy-ui.mjs';
const scopes={world:[-20,-82,200,122],east:[91,-80,89,65],west:[-20,-78,105,118],south:[89,-25,48,27]};
test('map viewport fills tall and wide panels without stretching or clipping the chosen region',()=>{for(const [scope,base] of Object.entries(scopes))for(const [w,h] of [[850,600],[500,340],[180,500],[1000,300]]){const v=diplomaticViewport(scope,w,h);assert.ok(Math.abs(v[2]/v[3]-w/h)<1e-9);assert.ok(v[0]<=base[0]&&v[1]<=base[1]);assert.ok(v[0]+v[2]>=base[0]+base[2]-1e-9);assert.ok(v[1]+v[3]>=base[1]+base[3]-1e-9);assert.ok(Math.abs(v[0]+v[2]/2-base[0]-base[2]/2)<1e-9);}});
