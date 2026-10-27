import {atlasTone} from './atlas-colors.mjs';
export {atlasTone} from './atlas-colors.mjs';
import {homePath,provinceGeometry,realmGeometry,territoryPath} from './campaign-map.mjs';
import {regionalBorderPath as homeBorderPath,regionalStateBorderPath} from './regional-atlas.mjs';
import {atlasLandPath,atlasCampaignPath} from './atlas-geography.mjs';

const materials=new URL('../assets/scenes/atlas/sketch-atlas-materials-v2.png',import.meta.url).href;
const mountainArt=new URL('../assets/scenes/atlas/sketch-atlas-mountains-v2.png',import.meta.url).href;

// Mirror alternating tiles so generated material edges do not form a grid.
const materialPattern=(id,name,offset,opacity,background='none')=>`<pattern id="${id}-${name}" width="44" height="44" patternUnits="userSpaceOnUse"><rect width="44" height="44" fill="${background}"/><g opacity="${opacity}"><g id="${id}-${name}-tile"><svg width="22" height="22" viewBox="${offset} 0 887 887" overflow="hidden"><image href="${materials}" width="1774" height="887"/></svg></g><use href="#${id}-${name}-tile" transform="translate(44 0) scale(-1 1)"/><use href="#${id}-${name}-tile" transform="translate(0 44) scale(1 -1)"/><use href="#${id}-${name}-tile" transform="translate(44 44) scale(-1 -1)"/></g></pattern>`;

// All map consumers share these coordinates, masks and pigments. The foreign
// mask protects the complete imperial territory on every campaign overlay.
export function atlasBase(id,{diplomatic=false,domestic}={}){return `<defs>
<clipPath id="${id}-campaign"><path d="${atlasCampaignPath}"/></clipPath><clipPath id="${id}-land"><path d="${atlasLandPath}" clip-path="url(#${id}-campaign)" clip-rule="evenodd"/></clipPath>
<mask id="${id}-foreign" maskUnits="userSpaceOnUse" x="-180" y="-95" width="360" height="190"><rect x="-180" y="-95" width="360" height="190" fill="white"/><path d="${homePath}" fill="black"/></mask>
${materialPattern(id,'paper',0,1)}
${materialPattern(id,'water',887,.3,'#789e9b')}
</defs><rect class="atlas-base-sea" ${diplomatic?'data-diplomatic-sea':''} x="-180" y="-95" width="360" height="190" fill="url(#${id}-water)"/><path class="atlas-base-land" d="${atlasLandPath}" fill="#f9f7f0" fill-rule="evenodd"/>${domestic?atlasTerritories(id,domestic):''}`;}
// Shared, non-interactive country layer: local and world views differ only in
// camera range. Owned overlays and labels supplied by each tool stay on top.
export function atlasTerritories(id,d){
 const regions=[...realmGeometry.map(g=>({...g,id:g.id+'-core'})),...provinceGeometry];
 return `<g class="atlas-context" clip-path="url(#${id}-land)" pointer-events="none" aria-hidden="true">${regions.map(g=>{
  const owner=d.provinces.find(p=>p.id===g.id)?.countryId;
  return `<path ${atlasTone({...g,owner})} class="atlas-context-territory ${owner===d.playerCountryId?'is-owned':''}" ${g.id.endsWith('-core')?`mask="url(#${id}-foreign)"`:''} d="${territoryPath(g)}"/>`;
 }).join('')}</g>`;
}
export const atlasLandClip=(id,g)=>`${g?atlasTone(g):''} clip-path="url(#${id}-land)" ${g?.id.endsWith('-core')?`mask="url(#${id}-foreign)"`:''}`;

// Painted motifs are anchored in campaign coordinates, shared at every zoom.
// Artwork is decorative: the vector coast, territories and hit areas stay exact.
const mountains=[
 {x:94,y:-45.2,w:4.2,h:2.2,crop:'10 215 610 310'},
 {x:101.7,y:-45,w:3.5,h:2,crop:'655 215 590 310'},
 {x:94.4,y:-28,w:3.4,h:1.8,crop:'10 795 610 310'},
 {x:113.4,y:-30.1,w:3,h:1.8,crop:'655 795 590 310'},
 {x:101.3,y:-23.5,w:3.1,h:1.5,crop:'655 795 590 310'}
];
export function atlasRelief(id){return `<g class="atlas-relief" ${atlasLandClip(id)} pointer-events="none" aria-hidden="true"><path class="atlas-paper-texture" d="${atlasLandPath}" fill="url(#${id}-paper)"/>
<g class="atlas-mountains">${mountains.map(m=>`<svg x="${m.x}" y="${m.y}" width="${m.w}" height="${m.h}" viewBox="${m.crop}" preserveAspectRatio="xMidYMid meet"><image href="${mountainArt}" width="1254" height="1254"/></svg>`).join('')}</g>

</g>`;}
export function atlasBorders(id,d){return `${atlasRelief(id)}<g ${atlasLandClip(id)} pointer-events="none"><path class="atlas-state-border" d="${regionalStateBorderPath}"/><path class="${d?.provinces.some(p=>p.id.endsWith('-core')&&p.countryId===d.playerCountryId)?'atlas-state-border':'atlas-country-border'}" d="${homeBorderPath}"/></g>`;}
