import {provinceGeometry,worldRealmGeometry} from './world-atlas.mjs';
import {ringPath,exteriorPath} from './map-geometry.mjs';
export {provinceGeometry};
export const realmGeometry=worldRealmGeometry;
export const homePath=provinceGeometry.map(p=>ringPath(p.polygon)).join('');
export const territoryPath=r=>(r.polygons||[r.polygon]).map(ringPath).join('');
export const homeBorderPath=exteriorPath(provinceGeometry);
export const nationPath=r=>r.id==='sheng'?homePath:territoryPath(realmGeometry.find(g=>g.id===r.id));
