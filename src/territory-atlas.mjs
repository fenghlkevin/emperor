import {provinceGeometry,realmGeometry} from './campaign-map.mjs';
import {insideRing} from './world-atlas.mjs';
import {atlasLandRings,atlasCampaignRim,atlasIsPlayableLand,campaignRing} from './atlas-geography.mjs';
// Geometry is fixed, ownership is always read from the current save.
export function territoryRegions(d){return [...provinceGeometry,...realmGeometry.map(g=>({...g,id:g.id+'-core'}))].map(g=>({...g,owner:d.provinces.find(p=>p.id===g.id)?.countryId}));}
export function ownedRegions(d){return territoryRegions(d).filter(g=>g.owner===d.playerCountryId);}
export function localMapRegions(d){const original=new Set(provinceGeometry.map(g=>g.id));return territoryRegions(d).filter(g=>original.has(g.id)||g.owner===d.playerCountryId);}
export function territoryView(regions,fallback=[94,-47,39,30]){
 if(!regions.some(g=>g.id.endsWith('-core')))return fallback;
 // Use the exact same visible land/campaign clip as the renderer. Exclude the
 // huge ocean and non-playable northern portions of foreign ownership cells.
 const coast=[...atlasLandRings.flat(),...atlasCampaignRim],points=regions.flatMap(g=>{
  const rings=(g.polygons??[g.polygon]).map(campaignRing);
  return [g.center,...rings.flat().filter(atlasIsPlayableLand),...coast.filter(p=>atlasIsPlayableLand(p)&&rings.some(r=>insideRing(p,r)))];
 });
 if(!points.length)return fallback;
 const xs=points.map(p=>p[0]),ys=points.map(p=>-p[1]);
 return [Math.min(...xs)-2,Math.min(...ys)-2,Math.max(...xs)-Math.min(...xs)+4,Math.max(...ys)-Math.min(...ys)+4];
}
