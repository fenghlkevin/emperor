// DOS 原版台词与分档的项目数据适配；详见 reverse/emperor/rules-analysis/incognito/README.md。
export const INCOGNITO_PLACES=[
 {
  "id": "tax",
  "name": "农夫与樵夫",
  "description": "赋税",
  "originalIndex": 1
 },
 {
  "id": "economy",
  "name": "小贩与矿工",
  "description": "经济",
  "originalIndex": 2
 },
 {
  "id": "construction",
  "name": "两位书生",
  "description": "建设",
  "originalIndex": 3
 },
 {
  "id": "labor",
  "name": "青年",
  "description": "民伕",
  "originalIndex": 4
 },
 {
  "id": "army",
  "name": "中年人",
  "description": "军队",
  "originalIndex": 5
 },
 {
  "id": "living",
  "name": "街坊妇人",
  "description": "生活",
  "originalIndex": 6
 },
 {
  "id": "longevity",
  "name": "姑娘与老妇",
  "description": "寿命",
  "originalIndex": 7
 },
 {
  "id": "disasters",
  "name": "官差",
  "description": "灾难",
  "originalIndex": 8
 },
 {
  "id": "territory",
  "name": "谈论疆域的百姓",
  "description": "疆域",
  "originalIndex": 9
 },
 {
  "id": "diplomacy",
  "name": "芝麻官",
  "description": "外交",
  "originalIndex": 10
 },
 {
  "id": "brothel",
  "name": "青楼",
  "description": "青楼",
  "originalIndex": 11
 },
 {
  "id": "children",
  "name": "嬉戏孩童",
  "description": "孩童",
  "originalIndex": 12
 },
 {
  "id": "idler",
  "name": "闲人",
  "description": "闲人",
  "originalIndex": 13
 }
];
const TEXT={
 "0x2dc": "確定要回京城嗎？",
 "0x159": "農夫：皇帝把稅率定的那麼低，國庫哪來收入呀！\n樵夫：皇帝希望咱們百姓日子過的好點，別管國庫了！\n農夫：說是這麼說啦！可是自古至今也很難得有這樣的好皇帝，這麼替咱們著想。\n樵夫：是呀！生在這時是咱們的福氣呀！\n農夫：啊．．福氣啦！",
 "0x15a": "農夫：嘿！最近過得好嗎？\n樵夫：還不錯啦！官府的稅比以前少了，手頭寬鬆，日子也比較好過了。\n農夫：是呀！當朝皇帝真是體恤百姓，有機會我要上京去向天子朝拜。\n樵夫：好啊！記得找我一塊兒去！",
 "0x15b": "農夫：最近過得好嗎？\n樵夫：還不是老樣子，每天就賺固定的錢，官府抽個稅，就剩下的糊個口，馬馬虎虎啦！\n農夫：我也一樣，賦稅抽的那麼緊，想多存點錢也難喲！",
 "0x15c": "農夫：真是辛苦，每天拼命的賺錢，等著官府來收稅，真沒道理。\n樵夫：還說呢！我上有高堂下有妻兒，每天省吃簡用才能過活呀！\n農夫：這皇帝最好短命點，這樣咱們才能活得久一點。\n樵夫：對對對．．．",
 "0x15d": "農夫：不幹了！！賺的錢全到官府口袋，太過份了！\n樵夫：沒錯！民間百姓應該團結起來，共同對抗官府！\n農夫：對！那狗皇帝剝削百姓的血汗錢，咱們也將狗皇帝抓來毒打一番。\n樵夫：還要千刀萬剮，下油鍋、下地獄．．．．．",
 "0x15e": "小販：聽說這酒樓的紹興酒遠近馳名，真想喝個一杯。\n礦工：別裝了！朝廷大力開墾土地，現在經濟發達，社會繁榮。花點小錢，大大的吃喝一頓，也沒什麼了不起的，還裝一付窮酸樣。\n小販：大哥，您就別這樣說我了。好，我作莊，請大哥吃頓飯，免得說我鐵公雞！",
 "0x15f": "小販：現在酒樓的生意挺不錯的。\n礦工：是啊！現在公家分配的土地多了，收入也比從前好。\n小販：嗯！咱們兄弟倆好久沒聚聚了，今兒個我作莊，痛快地喝個夠！",
 "0x160": "小販：嘿！剛下工啊！要不要到酒店喝兩杯。\n礦工：這．．好吧！可是我只有五分錢，別喝太超過哦！\n小販：當然，老樣子，一壺酒一盤小菜，喫完就走人囉！",
 "0x161": "小販：現在社會已逐漸恢復了平和，朝廷似乎已開始在發展經濟了礦工：現在分配的土地比以前多了，相信大夥賺的會愈來愈多。\n小販：等我們有閒錢，就到這家酒店喝兩杯，你看如何？\n礦工：一言為定。",
 "0x162": "小贩：每天辛苦工作，生活却得不到改善。\n矿工：公家分配的土地少，生产量有限，日子自然不好过。",
 "0x163": "書生甲：您覺得地方建設做得如何？\n書生乙：非常好，朝廷是真正有在為地方做事，這是人民莫大的福祉啊！",
 "0x164": "書生甲：您覺得地方建設做得如何？\n書生乙：比以前進步太多了，皇上不但有能力，還相當關心社會民生，真是全民之福。",
 "0x165": "書生甲：您覺得地方建設做得如何？\n書生乙：看到各處興建中的工程，相信朝廷是很努力在做事，我們拭目以待吧！",
 "0x166": "書生甲：您覺得地方建設做得如何？\n書生乙：朝廷在這方面的表現顯得有心無力，但是地方建設是長久大計，得一步一步慢慢來，給他們一點時間吧！",
 "0x167": "書生甲：您覺得地方建設做得如何？\n書生乙：當今皇上根本不關心他的子民，否則為何基本的地方建設都不重視呢？",
 "0x168": "青年：朝廷徵了這麼多民伕，只顧做建設，國家勢必無法均衡的發展。",
 "0x169": "青年：家兄自願當民伕，他希望能多做一些地方建設造福鄉親。",
 "0x16a": "青年：朝廷似乎罔顧國家建設的重要性。",
 "0x16b": "中年人：這種過份注重兵力的國家，戰火隨時引燃，屆時親人死傷失散，天子不以愛民，足為暴君。",
 "0x16c": "中年人：雖然士兵是國力強盛的象徵，但願只是衛國，而非侵略性地隨時發動戰爭，否則戰死他鄉的士兵就太可憐了。",
 "0x16d": "中年人：國家的士兵是少了一些，保留較多的壯丁投入經濟發展，這也不壞呀！",
 "0x16e": "婦人甲：你瞧！我這衣服是上等的絲綢縫製的，好看嗎？\n婦人乙：美極了！你也瞧瞧我頭上這根金釵，鑲著可是值錢的珠寶喲！\n婦人甲：看起來很像皇族貴婦耶！\n婦人乙：哪兒的話！你更像皇族貴婦呢！\n婦人甲乙：呵呵呵．．",
 "0x16f": "婦人甲：好姐妹，您這衣裳的好漂亮，我好喜歡！\n婦人乙：就在小李的布莊買的，那匹布料剩得不多，喜歡就要趕快去買！\n婦人甲：哦！那我得趕緊去裁布。\n婦人乙：走路小心點。\n婦人甲：嗯，再見。",
 "0x170": "婦人甲：好姐妹，上哪去呀！\n婦人乙：買了一塊布，要給家人做新衣服。\n婦人甲：我也買了雞，要給老人家補身體的。婦人乙：我也做燉雞給我娘吃，他身體越來越好了。\n婦人甲：真好，大家都苦盡甘來了。",
 "0x171": "婦人甲：上街呀，我跟你說，對街豆腐攤旁邊來了個賣胭脂的小販，貨色齊全又便宜，好多人搶著買呀！\n婦人乙：可是我身上沒多餘的錢．．．\n婦人甲：那真可惜呀！",
 "0x172": "婦人甲：你這衣服的料子可真粗呀！當心傷著皮膚了！\n婦人乙：看你天熱也穿這件，天冷也穿這件，難道沒別的衣服穿嗎！當心著涼呀！\n婦人甲：嘿！大家生活都一樣貧苦，你也別太得意了！",
 "0x173": "老妇：听说皇上好色，派了官员出来找宫女。小姑娘，你要小心一点！",
 "0x174": "姑娘：聽說皇帝龍體狀況不是很好，可能不長命哦！\n老婦：再加上酒色過度，一定很短命。",
 "0x175": "姑娘：當今皇帝似乎不太重視身體健康。\n老婦：身子不照顧好，如何開創春秋大業呢？",
 "0x176": "姑娘：聽說皇上很重視身體健康，壽命應該很長。\n老婦：皇上龍體當然要照顧好，不然如何處理朝務呢？",
 "0x177": "姑娘：聽說皇上很重視身體健康，壽命應該很長。\n老婦：八成服過什麼延命仙丹，如果也送我一顆，那該多好！",
 "0x178": "官差甲：最近各地有什麼災難新聞嗎？\n官差乙：這是最平靜的一段日子了！",
 "0x179": "官差甲：最近各地有什麼新聞嗎？\n官差乙：天災人禍接踵而來，沒一日安寧。",
 "0x17a": "官差甲：聽說最近各地似乎發生不少災難。\n官差乙：你也知道了，這天災人禍接二連三，恐怕是大難當前的表象。",
 "0x17b": "中年甲：我覺得當今皇帝一點作為也沒有。\n中年乙：怎麼說？\n中年甲：太膽小了！不懂得對外拓展江山，八成都躲在後宮玩女人。",
 "0x17c": "中年甲：這實再令人精神大振呀！\n中年乙：你在說什麼啊？\n中年甲：咱們現在國力強盛，當百姓的也覺得挺光榮的。",
 "0x17d": "中年甲：我就知道當今皇上智武過人，一定會有偉大的成就。\n中年乙：嗯！皇上策劃謀略，深思熟慮，才創造出這般偉大的扑~。",
 "0x17e": "中年甲：當今皇上可真不是蓋的，創造這樣的豐功偉業，歷代皇朝無人能比呀！\n中年乙：是啊！降服蠻夷，威震四海，真是太偉大了！\n中年甲：今生如果有福份，讓我見皇上龍顏一面，那真是太幸運了！\n中年乙：少作白日夢！咱們這種市井小民怎可能見皇上啊！",
 "0x17f": "中年甲：你知道嗎，我們這一朝將成為古今中外最偉大得時期。\n中年乙：是啊！看看這廣大的疆域，四海皆中國呀！\n兩人跪下，向天膜拜。\n「偉大的天子！您將永垂不朽，將與萬物共存。萬歲！萬歲！萬萬歲！」",
 "0x180": "芝麻官：諸國對我國的友善程度，整體而言非常不錯，可見我國對外發展很成功。",
 "0x2d4": "芝麻官：諸國對我國的友善程度，整體而言都還不錯！",
 "0x2d5": "芝麻官：諸國對我國的友善程度，整體而言似乎很差。",
 "0x2d7": "老鸨：这位是全城最红的姑娘……\n皇帝见到这位姑娘，惊为天人。",
 "0x2d6": "老鸨：大爷，进来坐坐！姑娘们，出来招呼客人！\n皇帝瞧了瞧，似乎没有看得上眼的姑娘。",
 "0x2d9": "小孩甲：哈．．．別跑．．．\n小孩乙：嘻嘻！！捉不到！捉不到！\n小孩甲：喂！這位大叔你擋到我們了，走開！\n小孩們：哈．哈．．哈．．．嘻嘻．．．",
 "0x2da": "閒人：當皇帝的統治大片江山，這萬人之上的寶座，真令人垂涎。",
 "0x2db": "閒人：當皇帝真好，天下美女盡藏後宮，好不快活！"
};
const mean=values=>values.length?values.reduce((a,b)=>a+b,0)/values.length:0;
export function incognitoDialogue(state,placeId,random=Math.random){
 const d=state.domestic,own=d.provinces.filter(p=>p.countryId===d.playerCountryId),population=own.reduce((n,p)=>n+p.population.total,0)||1;
 const country=d.countries.find(c=>c.id===d.playerCountryId),tax=Math.round((country?.fiscal.taxRate||0)*100);
 const developed=mean(own.flatMap(p=>Object.values(p.economy).map(e=>100*e.developedArea/Math.max(1,e.capacityArea))));
 const economy=mean(own.flatMap(p=>Object.values(p.economy).map(e=>2*e.productivity)));
 const building=mean(own.flatMap(p=>['stability','security','activity','fitness','defense','loyalty'].map(k=>p.welfare[k])));
 const labor=100*own.reduce((n,p)=>n+p.population.professions.militia,0)/population;
 const army=100*own.reduce((n,p)=>n+p.population.professions.soldiers,0)/population;
 const living=mean(own.map(p=>p.status.livingStandard))/25,life=state.stats.age+Math.floor(state.stats.life/36);
 const peaceful=100*own.filter(p=>!p.disaster||state.turn<p.disaster.startTurn||state.turn>=p.disaster.endTurn).length/Math.max(1,own.length);
 const foreignIds=new Set(d.countries.filter(c=>c.id!==d.playerCountryId&&c.provinceIds.length).map(c=>c.id));
 const relations=d.diplomacy.filter(r=>r.countryIds.includes(d.playerCountryId)&&foreignIds.has(r.countryIds.find(id=>id!==d.playerCountryId)));
 const protectedStates=relations.filter(r=>r.relation===(r.countryIds[0]===d.playerCountryId?'protector':'protected')).length;
 const territory=own.length*4+protectedStates*2;
 const friendship=foreignIds.size?mean(relations.map(r=>r.friendship)):90;
 let id;
 switch(placeId){
 case 'tax':id=tax<=8?0x159:tax<=16?0x15a:tax<=25?0x15b:tax<32?0x15c:0x15d;break;
 case 'economy':id=developed>=80&&economy>=130?0x15e:developed>=75&&economy>=115?0x15f:developed>=75&&economy>=100?0x160:economy>=90?0x161:0x162;break;
 case 'construction':id=developed>=80&&building>=80?0x163:developed>=75&&building>=70?0x164:developed>=75&&building>=60?0x165:building>=50?0x166:0x167;break;
 case 'labor':id=labor>=10?0x168:labor>=4?0x169:0x16a;break;
 case 'army':id=army>=16?0x16b:army>=9?0x16c:0x16d;break;
 case 'living':id=living>=3.5?0x16e:living>=3?0x16f:living>=2?0x170:living>=1?0x171:0x172;break;
 case 'longevity':id=life<35?0x173:life>=36&&life<45?0x174:life>=46&&life<55?0x175:life>=56&&life<65?0x176:0x177;break;
 case 'disasters':id=peaceful>=90?0x178:peaceful>=50?0x179:0x17a;break;
 case 'territory':id=territory<41?0x17b:territory<60?0x17c:territory<85?0x17d:territory<110?0x17e:0x17f;break;
 case 'diplomacy':id=friendship>=80?0x180:friendship>=60?0x2d4:0x2d5;break;
 case 'brothel':id=0x2d6;break;
 case 'children':id=0x2d9;break;
 case 'idler':id=random()<.5?0x2da:0x2db;break;
 default:throw Error('未知的微服查访地点');
 }
 return {title:INCOGNITO_PLACES.find(p=>p.id===placeId).name,text:TEXT[`0x${id.toString(16)}`]};
}
