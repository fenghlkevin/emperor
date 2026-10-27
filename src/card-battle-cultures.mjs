// Fictional people use broad period-inspired regional pools, never a historical identity.
export const CARD_CULTURES={
 central:{index:null,names:[['沈','陆','顾','韩','许','张','李','周','陈','徐'],['明远','景和','文清','怀诚','承礼','弘毅','知远','守信','安邦']]},
 tibetan:{index:0,names:[['朗','赤','尚','贡'],['达赞','仁钦','洛桑','德吉']]},
 steppe:{index:1,names:[['阿勒','铁木','巴图','呼延'],['罕','图','察','达尔']]},
 centralasia:{index:2,names:[['苏尔','米尔','阿兰','达尔'],['达','曼','沙','纳']]},
 persian:{index:3,names:[['巴赫','阿尔','法鲁','达里'],['拉姆','达','曼','斯']]},
 arab:{index:4,names:[['哈桑','萨利','阿米','法里'],['姆','尔','德','兹']]},
 indian:{index:5,names:[['维','阿','迦','摩'],['拉提','南达','提伐','哈罗']]},
 roman:{index:6,names:[['马尔','莱昂','米哈','安德'],['库斯','尼奥','罗','诺斯']]},
 nanzhao:{index:7,names:[['段','杨','高','罗'],['明和','承安','德远','景初']]},
 japan:{index:8,names:[['藤原','源','平','橘'],['忠正','清信','景成','义直']]}
};
const groups={tibetan:['tubo','tuyuhun','bolur'],steppe:['steppe','uyghur','west-turk','east-turk','khitan','xi','siberia','mohe','north-sea','frostland','forestland','far-east'],centralasia:['gaochang','tokhara','shule','kucha'],persian:['persia'],arab:['arabia','maghreb','axum','west-south','southland','east-coast','cape'],indian:['india','sinhala'],roman:['rome','slavs','franks'],nanzhao:['nanzhao','pyu','chenla','srivijaya','java','champa','luzon'],japan:['japan']};
export function cardCulture(country){return Object.keys(groups).find(k=>groups[k].includes(country))??'central';}
// Image-only source regions; gameplay culture/name pools remain unchanged.
const primarySourceRows=[['korean','central'],['aksumite','arab'],['amazigh','arab'],['slavic','roman'],['frankish','roman'],['pyu','nanzhao'],['khmer','nanzhao'],['maritime','nanzhao'],['sinhala','indian']];
const finalSourceRows=[['cham','nanzhao'],['mohe','steppe'],['yenisei','steppe'],['borealwest','steppe'],['borealeast','steppe'],['tropicalwest','arab'],['tropicalinterior','arab'],['tropicalcoast','arab'],['southerncape','arab']];
export const SOURCE_ART_REGIONS=Object.freeze(Object.fromEntries([
 ...primarySourceRows.map(([id,parent],index)=>['source_'+id,Object.freeze({index,parent,atlas:'source'})]),
 ...finalSourceRows.map(([id,parent],index)=>['source_'+id,Object.freeze({index,parent,atlas:'source-final'})])
]));
const sourceRegions={korea:'korean',axum:'aksumite',maghreb:'amazigh',slavs:'slavic',franks:'frankish',pyu:'pyu',chenla:'khmer',srivijaya:'maritime',java:'maritime',luzon:'maritime',sinhala:'sinhala',champa:'cham',mohe:'mohe',siberia:'yenisei','north-sea':'borealwest',frostland:'borealwest',forestland:'borealeast','far-east':'borealeast','west-south':'tropicalwest',southland:'tropicalinterior','east-coast':'tropicalcoast',cape:'southerncape'};
export function cardArtRegion(country){return sourceRegions[country]?'source_'+sourceRegions[country]:cardCulture(country);}
function sourceCountry(world,unit){return unit.sourceId==='central'?world.playerCountryId:world.provinces?.find(p=>p.id===unit.sourceId)?.countryId??unit.countryId;}
export function sourceArtRegion(world,unit){return cardArtRegion(sourceCountry(world,unit));}
// The troops belong to their actual source, even when led by an imported historical officer.
export function sourceArtCulture(world,unit){
 return cardCulture(sourceCountry(world,unit));
}
export function regionalTroopArt(culture,kind){
 const detailed=SOURCE_ART_REGIONS[culture];
 if(detailed&&['infantry','spears','archers','cavalry','heavy-cavalry','crossbows','camel','elephant','horse-archers'].includes(kind))return {src:`assets/battle/card-${detailed.atlas}-${kind}-v1.png`,x:detailed.index%3*50,y:Math.floor(detailed.index/3)*50};
 if(detailed)culture=detailed.parent;
 if(!['infantry','spears','archers','cavalry','heavy-cavalry','crossbows','camel','elephant','horse-archers'].includes(kind)||CARD_CULTURES[culture]?.index==null)return null;
 const index=CARD_CULTURES[culture].index;
 return {src:`assets/battle/card-regional-${kind}-v2.png`,x:index%3*50,y:Math.floor(index/3)*50};
}
// Portrait variants are chosen once at profile creation, never by the renderer.
export function regionalPersonPortrait(culture,role,seed){
 if(CARD_CULTURES[culture]?.index==null&&!SOURCE_ART_REGIONS[culture])return null;
 return `regional-${role==='文职'?'civil':'military'}-${culture}-v2-${(seed>>>0)%2}`;
}
export function cardRegionalArt(portraitId){
 const match=/^regional-(civil|military)-(\w+)(?:-v2-([01]))?$/.exec(portraitId??'');if(!match)return null;
 const detailed=SOURCE_ART_REGIONS[match[2]];
 if(detailed)return {src:`assets/battle/card-${detailed.atlas}-${match[1]}-v1.png`,x:detailed.index%3*50,y:Math.floor(detailed.index/3)*50};
 if(CARD_CULTURES[match[2]]?.index==null)return null;
 const index=CARD_CULTURES[match[2]].index;
 return {src:`assets/battle/card-regional-${match[1]}-variant${match[3]??0}-v2.png`,x:index%3*50,y:Math.floor(index/3)*50};
}
