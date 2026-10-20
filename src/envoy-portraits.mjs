// Country palettes and permitted parts. A visit stores the assembled recipe, never a stock portrait index.
const row=(hat,robe,hair,ornament,screen,skin,colors)=>({hat:hat.split('/'),robe:robe.split('/'),hair:hair.split('/'),ornament:ornament.split('/'),screen,skin,colors});
export const ENVOY_PROFILES={
 tubo:row('wool/fur','chuba','braids/long','turquoise','mountain','#bc8c69',['#792e2c','#674b3c','#d3bc91']),
 nanzhao:row('wrap/band','embroidered','bun/long','silver','bamboo','#c99a77',['#324f68','#466154','#895542']),
 korea:row('winged','court','bun','jade','crane','#d8ae8c',['#668b7a','#596e88','#814e51']),
 japan:row('eboshi','layered','bun','fan','pine','#d7b394',['#67546b','#3d566c','#8c7954']),
 steppe:row('fur/pointed','riding','braids/long','bronze','steppe','#b98c6b',['#685342','#60644b','#89573c']),
 uyghur:row('round/pointed','brocade','waves/long','gold','garden','#c59a76',['#a27a32','#426d79','#884448']),
 persia:row('round/turban','brocade','waves','pearl','garden','#c99b79',['#78383d','#3a6556','#53657f']),
 arabia:row('turban','mantle','waves/short','gold','stars','#b78560',['#ded0ad','#344e65','#675347']),
 rome:row('band/round','mantle','waves','brooch','mosaic','#d0a17e',['#66506f','#435b77','#853f45']),
 india:row('turban','draped','waves/bun','gold','lotus','#9c694d',['#b4793c','#9a4435','#d8c6a1']),
 'west-turk':row('pointed/fur','riding','braids/long','bronze','steppe','#c29a76',['#476350','#87503b','#b5a181']),
 gaochang:row('wrap/round','brocade','short/waves','jade','garden','#cba582',['#b7a67e','#3e6482','#9b713b']),
 'east-turk':row('fur/pointed','riding','braids','bronze','steppe','#bd906c',['#3b5872','#504f48','#8e4f38']),
 khitan:row('fur','riding','sidebraids','bronze','pine','#bd8b68',['#8c433c','#3c645f','#6e5142']),
 xi:row('wool/fur','chuba','braids/long','silver','pine','#c49a74',['#8d7544','#5a6e50','#775e4b']),
 tokhara:row('round','brocade','waves/long','pearl','garden','#caa080',['#4b7a6b','#994e44','#4e6382']),
 shule:row('turban/wrap','brocade','waves','silver','stars','#b88a65',['#9c604b','#3e597b','#9b835d']),
 kucha:row('round/band','brocade','waves','gold','lotus','#cba583',['#5b8c8c','#b19a6d','#965544']),
 tuyuhun:row('pointed/wool','chuba','braids','turquoise','mountain','#ba8966',['#c2b193','#80523c','#48604d']),
 bolur:row('wool','chuba','long/waves','silver','mountain','#b48d70',['#395f51','#8a574a','#7e7b70']),
 slavs:row('fur/band','mantle','long/waves','brooch','pine','#d9ad8a',['#a9a082','#415e7d','#843f39']),
 franks:row('band/round','mantle','waves/long','brooch','mosaic','#d5a17e',['#894640','#455c7b','#79604b']),
 siberia:row('pointed/fur','riding','braids/long','silver','steppe','#cfa384',['#b9b19a','#376968','#737c85']),
 mohe:row('fur/wool','riding','braids/sidebraids','bronze','pine','#be936f',['#62694d','#70523f','#85463d']),
 pyu:row('wrap/band','draped','bun/short','gold','lotus','#b0805a',['#c5b89b','#9b4d40','#9e8047']),
 chenla:row('band','draped','bun/long','gold','lotus','#a77451',['#84463f','#a18343','#3f6353']),
 srivijaya:row('wrap/band','embroidered','long/bun','gold','waves','#a67651',['#3f5878','#977d40','#9b5e44']),
 java:row('wrap','embroidered','bun/long','bronze','waves','#9f7150',['#73523a','#b6a37e','#475e76']),
 champa:row('wrap/band','draped','bun/long','gold','lotus','#ad7b57',['#b4725c','#c3b38f','#4e6182']),
 luzon:row('band','embroidered','long/short','bronze','waves','#af8059',['#c4b58e','#8c453a','#947744']),
 axum:row('wrap/band','mantle','curls/short','gold','mosaic','#80523b',['#c6b899','#8f473f','#807346']),
 maghreb:row('turban/wrap','mantle','curls/waves','silver','stars','#b18661',['#3f5877','#c7b997','#9a6147']),
 sinhala:row('band/wrap','draped','waves/bun','gold','lotus','#936346',['#d0c1a4','#9c6444','#83423a'])
};
// Peripheral polities use the existing fixed portrait collections; the visit
// still stores the new country ID and its own deterministic portrait variant.
const frontierArt=Object.freeze({'north-sea':'slavs',frostland:'siberia',forestland:'mohe','far-east':'khitan','west-south':'maghreb',southland:'axum','east-coast':'sinhala',cape:'axum'});
for(const [id,source]of Object.entries(frontierArt))ENVOY_PROFILES[id]=ENVOY_PROFILES[source];
export const ENVOY_COUNTRIES=Object.keys(ENVOY_PROFILES);
function randomStream(seed){let n=seed>>>0;return()=>{n=(Math.imul(n,1664525)+1013904223)>>>0;return n/4294967296;};}
export const ENVOY_VARIANTS=3;
export function assembleEnvoy(countryId,seed){if(!ENVOY_PROFILES[countryId]||!Number.isInteger(seed)||seed<0||seed>4294967295)throw Error('使臣立绘参数无效');return {version:3,countryId,seed,variant:Math.floor(randomStream(seed)()*ENVOY_VARIANTS)};}
export function portraitAsset(a){if(!ENVOY_PROFILES[a.countryId]||!Number.isInteger(a.variant)||a.variant<0||a.variant>=ENVOY_VARIANTS)throw Error('使臣立绘编号无效');return `assets/envoys/wide/${frontierArt[a.countryId]??a.countryId}/envoy-${a.variant}.png`;}
export function initializeEnvoyPortraits(state){if(state.envoyVisit&&(!state.envoyVisit.appearance||[1,2].includes(state.envoyVisit.appearance.version))){const old=state.envoyVisit.appearance,seed=Number.isInteger(old?.seed)?old.seed:(state.envoyVisit.requestedTurn*1777+ENVOY_COUNTRIES.indexOf(state.envoyVisit.countryId)*131)>>>0;state.envoyVisit.appearance=assembleEnvoy(state.envoyVisit.countryId,seed);}return state;}
export function validateEnvoyPortraits(state){const v=state.envoyVisit;if(!v)return;const a=v.appearance;if(!a||a.version!==3||a.countryId!==v.countryId||!Number.isInteger(a.seed)||a.seed<0||a.seed>4294967295||Object.keys(a).length!==4||!Number.isInteger(a.variant)||a.variant<0||a.variant>=ENVOY_VARIANTS)throw Error('使臣固定立绘记录无效');}
