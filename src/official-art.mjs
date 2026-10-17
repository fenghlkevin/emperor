import {OFFICIAL_ART} from './official-art-data.mjs';
export {OFFICIAL_ART};
export function stablePersonId(person){return String(person?.id??'').replace(/^recruit-/,'');}
export function randomPortraitKey(person){
 const role=person?.portraitRole??person?.role;
 const military=role==='武将'||role==='military'||(!role&&(person?.id==='central-general'||person?.id?.endsWith('-general')));
 let hash=2166136261;for(const ch of stablePersonId(person)+':'+(person?.name??''))hash=Math.imul(hash^ch.charCodeAt(0),16777619);
 hash^=hash>>>16;hash=Math.imul(hash,0x7feb352d);hash^=hash>>>15;hash=Math.imul(hash,0x846ca68b);hash^=hash>>>16;
 return `random-${military?'military':'civil'}-${(hash>>>0)%10+1}`;
}
export function officialPortraitKey(person){
 const id=stablePersonId(person);
 if(OFFICIAL_ART[id]&&!id.startsWith('random-'))return id;
 return randomPortraitKey(person);
}
export function officialArt(person){return OFFICIAL_ART[officialPortraitKey(person)]??null;}
export function officialAvatar(person){return officialArt(person)?.avatar??null;}
