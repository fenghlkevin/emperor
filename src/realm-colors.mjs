import {REALMS} from './domestic.mjs';
// Stable golden-angle spacing gives every realm a distinct pigment.
export const REALM_COLORS=Object.fromEntries(REALMS.map((r,i)=>[r.id,r.id==='sheng'?'hsl(42 75% 48%)':`hsl(${(i*137.508%360).toFixed(2)} ${45+i%3*9}% ${45+i%4*5}%)`]));
export const realmColor=id=>REALM_COLORS[id];
