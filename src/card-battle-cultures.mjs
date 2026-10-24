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
const atlasAssets={civil:'assets/battle/card-regional-civil-v1.png',military:'assets/battle/card-regional-military-v1.png'};
export function cardRegionalArt(portraitId){
 const match=/^regional-(civil|military)-(\w+)$/.exec(portraitId??'');if(!match||CARD_CULTURES[match[2]]?.index==null)return null;
 const index=CARD_CULTURES[match[2]].index;
 return {src:atlasAssets[match[1]],x:index%3*50,y:Math.floor(index/3)*50};
}
