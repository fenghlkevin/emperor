import {TERRAIN_SECTORS,terrainRule,validateTerrainEconomy} from './terrain-economy.mjs';
// Broad scenario regions mapped to the four existing game categories.
// Hills also approximate lower plateaus; aridity and grassland are described,
// not silently introduced as new terrain or climate mechanics.
export const PROVINCE_GEOGRAPHY=Object.freeze({
 'north-sea':{terrain:'丘陵型',description:'北海沿岸与北方台地，按剧本地形归为丘陵型。'},
 frostland:{terrain:'平原型',description:'北方寒原低地，按剧本地形归为平原型。'},
 forestland:{terrain:'丘陵型',description:'北方林海与起伏高原，按剧本地形归为丘陵型。'},
 'far-east':{terrain:'高山型',description:'极东山地与沿岸丘陵，按剧本地形归为高山型。'},
 'west-south':{terrain:'丘陵型',description:'南方大陆西缘台地，按剧本地形归为丘陵型。'},
 southland:{terrain:'平原型',description:'南方大陆内陆低地，按剧本地形归为平原型。'},
 'east-coast':{terrain:'河海型',description:'南方大陆东侧沿海低地，按剧本地形归为河海型。'},
 cape:{terrain:'高山型',description:'南方海角与高原山地，按剧本地形归为高山型。'},
 hebei:{terrain:'平原型',description:'华北平原为主体，北部燕山、西缘太行山；按主要低地归类。'},
 henan:{terrain:'平原型',description:'黄淮冲积平原为主体，西部兼有山地。'},
 huainan:{terrain:'河海型',description:'淮河下游、长江下游及滨海冲积低地，河网密集。'},
 jiangnan:{terrain:'丘陵型',description:'江南丘陵与东南山地广布，兼有洞庭湖、鄱阳湖及沿江平原。'},
 lingnan:{terrain:'丘陵型',description:'南岭以南丘陵山地为主体，兼珠江流域和沿海平原。'},
 hedong:{terrain:'高山型',description:'山西高原与太行、吕梁山地，盆地夹于山间；高原山地归类。'},
 guannei:{terrain:'丘陵型',description:'关中盆地与黄土高原并存，按起伏高原和丘陵复合区近似。'},
 shannan:{terrain:'高山型',description:'秦岭、大巴山及汉水谷地，主体为秦巴山地。'},
 jiannan:{terrain:'高山型',description:'川西高山、横断山地与四川盆地并存，按本剧本西南山地区域归类。'},
 longyou:{terrain:'高山型',description:'祁连山、青藏高原东北缘及河西走廊，按高原山地归类。'},
 tubo:{terrain:'高山型',description:'青藏高原与喜马拉雅山地，高海拔地区为主体。'},
 nanzhao:{terrain:'高山型',description:'云贵高原、横断山系南段及山间盆地，山地高原为主体。'},
 korea:{terrain:'高山型',description:'朝鲜半岛山地广布，主要平原集中于西部沿海。'},
 japan:{terrain:'高山型',description:'日本列岛山地与火山地形广布，沿海平原较狭窄。'},
 steppe:{terrain:'丘陵型',description:'蒙古高原草原与起伏山地；现有四类中以丘陵型近似，不代表湿润丘陵。'},
 uyghur:{terrain:'丘陵型',description:'准噶尔盆地、阿尔泰山前与草原高原复合区，以丘陵型近似。'},
 persia:{terrain:'高山型',description:'伊朗高原及扎格罗斯山地，兼有内陆荒漠盆地。'},
 arabia:{terrain:'丘陵型',description:'阿拉伯高原与荒漠为主体，北部兼两河低地；以丘陵型近似高原，尚无荒漠类别。'},
 rome:{terrain:'丘陵型',description:'本剧本罗马代表欧洲西部至巴尔干的复合腹地，平原、丘陵与山地并存。'},
 india:{terrain:'丘陵型',description:'印度半岛德干高原为主体，兼恒河平原与沿海低地；以丘陵型近似高原。'},
 'west-turk':{terrain:'平原型',description:'中亚草原、图兰低地及内陆盆地为主，东南缘兼山地；平原不代表湿润耕地。'},
 gaochang:{terrain:'丘陵型',description:'天山东部山前及干旱盆地绿洲，以丘陵型近似山前复合区，尚无荒漠类别。'},
 'east-turk':{terrain:'丘陵型',description:'蒙古高原南部及戈壁草原、起伏山地，以丘陵型近似。'},
 khitan:{terrain:'丘陵型',description:'大兴安岭周边山地、草原台地与东北平原交错。'},
 xi:{terrain:'丘陵型',description:'燕山、辽西山地与山间河谷，丘陵山地为主体。'},
 tokhara:{terrain:'高山型',description:'兴都库什、帕米尔周缘与阿姆河上游盆地，按山地复合区归类。'},
 shule:{terrain:'高山型',description:'本剧本区域涵盖帕米尔、天山西段及喀什绿洲，按周缘高山复合区归类。'},
 kucha:{terrain:'丘陵型',description:'天山南麓山前带与塔里木盆地北缘绿洲，以丘陵型近似，尚无荒漠类别。'},
 tuyuhun:{terrain:'高山型',description:'青海高原、祁连山南缘及高原盆地。'},
 bolur:{terrain:'高山型',description:'吉尔吉特与喀喇昆仑、喜马拉雅交会区域，峡谷高山为主体。'},
 slavs:{terrain:'平原型',description:'东欧平原为主体，兼河流谷地与局部高地。'},
 franks:{terrain:'平原型',description:'本剧本腹地以巴黎盆地及西欧低地为主，南东缘兼丘陵山地。'},
 siberia:{terrain:'高山型',description:'黠戛斯按叶尼塞河上游、米努辛斯克盆地及萨彦山地归类，不泛指整个西西伯利亚平原。'},
 mohe:{terrain:'丘陵型',description:'黑龙江流域森林丘陵、兴安岭周边与河谷平原交错。'},
 pyu:{terrain:'河海型',description:'伊洛瓦底江中下游盆地与河流低地，周缘有山地。'},
 chenla:{terrain:'河海型',description:'湄公河下游及洞里萨湖低地为主体。'},
 srivijaya:{terrain:'河海型',description:'苏门答腊东部穆西河及巨港河口低地，河海交通腹地。'},
 java:{terrain:'高山型',description:'爪哇岛火山山脊贯穿全岛，兼北岸冲积平原。'},
 champa:{terrain:'河海型',description:'越南中部沿海狭长平原与河口港埠腹地，西侧倚长山山地。'},
 luzon:{terrain:'高山型',description:'吕宋中北部科迪勒拉、马德雷山地广布，兼中央平原。'},
 axum:{terrain:'高山型',description:'埃塞俄比亚北部与厄立特里亚高原山地。'},
 maghreb:{terrain:'丘陵型',description:'阿特拉斯山地、内陆台地与撒哈拉荒漠并存，以丘陵型近似，尚无荒漠类别。'},
 sinhala:{terrain:'河海型',description:'斯里兰卡外围沿海低地为主体，岛中部有高地。'}
});
export function geographicProfile(id){return PROVINCE_GEOGRAPHY[id.replace(/-core$/,'')];}
export function geographicTerrain(id){const row=geographicProfile(id);if(!row)throw Error(`缺少州县地理配置：${id}`);return row.terrain;}
export function initializeProvinceGeography(d){
 if(d.geographyVersion!==undefined){if(d.geographyVersion!==1)throw Error('州县地理版本无效');return d;}
 // Validate the old rule snapshot BEFORE changing its terrain. A migration must
 // not turn a damaged snapshot into a valid one or reset paid developments.
 if(d.terrainEconomyVersion!==undefined)validateTerrainEconomy(d);
 else if(d.provinces.some(p=>p.terrainCapacity!==undefined))throw Error('地形经济记录不完整');
 for(const p of d.provinces){
  const row=geographicProfile(p.id);if(!row||p.terrain===row.terrain)continue;
  p.terrain=row.terrain;
  if(p.terrainCapacity){
   const t=p.terrainCapacity;t.kind=p.terrain;t.legacyLand=Math.max(t.legacyLand,p.cityCapacity.land);
   for(const k of TERRAIN_SECTORS)t.legacySectors[k]=Math.max(t.legacySectors[k],p.economy[k].developedArea+(p.development?.project?.industry===k?p.development.project.area:0));
   t.landLimit=Math.min(p.area,Math.max(1,Math.floor(p.area*terrainRule(p).land),t.legacyLand));
  }
 }
 d.geographyVersion=1;return d;
}
export function validateProvinceGeography(d){
 if(d.geographyVersion!==1)throw Error('州县地理版本无效');
 for(const p of d.provinces){const row=geographicProfile(p.id);if(row&&p.terrain!==row.terrain)throw Error('州县地形与地理配置不一致');}
}
