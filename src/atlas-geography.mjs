import {regionalCoast,regionalLandRings} from './regional-atlas.mjs';
import {worldLandRings,insideRing} from './world-coast.mjs';
import {softenCoast,ringPath,clipToBounds,northeastPoint} from './map-geometry.mjs';

// Complete background geography, independent of which countries are playable.
// Replace the old rectangular northern cap with an authored Arctic shore.
// All eastern coastal samples meeting province boundaries remain untouched.
const easternStart=regionalCoast.findIndex(([x,y])=>x===175&&y===60);
const eastern=regionalCoast.slice(easternStart);
const western=worldLandRings[0].slice(regionalCoast.length,-1);
const north=[[60,73],[67,70],[73,72],[79,73],[86,76],[96,77],[103,78],[109,76],[113,73],[121,73],[128,71],[137,72],[144,70],[151,70],[159,69],[166,67],[173,66],[179,65],[180,63],[175,60]];
const returnCoast=softenCoast([eastern.at(-1),...western,...north]);
export const atlasLandRings=[
 [...eastern.slice(0,-1),...returnCoast.slice(0,-1)],
 ...regionalLandRings.slice(1),
 ...worldLandRings.slice(regionalLandRings.length).map(r=>softenCoast(r,true))
].map(ring=>ring.map(northeastPoint));
export const atlasLandPath=atlasLandRings.map(ringPath).join('');
// The expanded scenario covers the complete drawn mainland. No artificial
// latitude band cuts countries off across the Arctic or southern Africa.
export const atlasCampaignBounds=[-20,180,-40,90];
export const atlasCampaignRim=[[-20,-40],[180,-40],[180,90],[-20,90]];
export const atlasCampaignPath=ringPath(atlasCampaignRim);
export const atlasIsLand=p=>atlasLandRings.some(r=>insideRing(p,r));
export const atlasIsPlayableLand=p=>atlasIsLand(p)&&insideRing(p,atlasCampaignRim);
export const campaignRing=r=>clipToBounds(r,atlasCampaignBounds);
