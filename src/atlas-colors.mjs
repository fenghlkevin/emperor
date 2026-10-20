// Stable country identity, shared by every map. Status/selection overlays are
// separate from this palette; never hash countries into a repeating color set.
const countryColors=Object.freeze({
 'north-sea':'#7e9dba',frostland:'#b4c9a7',forestland:'#819e80','far-east':'#ad8a77',
 'west-south':'#a9a3cf',southland:'#c6ae6c','east-coast':'#74a6b4',cape:'#be869e',
 sheng:'#efd18d',tubo:'#a792ae',nanzhao:'#a6b382',korea:'#91afb6',japan:'#bf968d',
 steppe:'#91ad94',uyghur:'#c5aa7a',persia:'#9c9ebd',arabia:'#c5ad96',rome:'#97b6aa',
 india:'#c196ab','west-turk':'#a9b3c7',gaochang:'#c1bd87','east-turk':'#95a47d',
 khitan:'#b9a2bf',xi:'#c1a17a',tokhara:'#a4bab5',shule:'#b99c9b',kucha:'#b4bda0',
 tuyuhun:'#aaa18a',bolur:'#a695bc',slavs:'#8ca3b4',franks:'#bfb49e',siberia:'#9cbd9e',
 mohe:'#b0a3a3',pyu:'#bda6a1',chenla:'#a5a1c2',srivijaya:'#a8bd85',java:'#88ada3',
 champa:'#c4b77d',luzon:'#c0a4b4',axum:'#9eafc4',maghreb:'#c4927f',sinhala:'#b0bbba'
});
export function atlasCountryColor(id){return countryColors[String(id).replace(/-core$/,'')]??'#b9aa8c';}
export function atlasTone(region){return `data-atlas-tone="${region.owner??region.id}" color="${atlasCountryColor(region.owner??region.id)}"`;}
