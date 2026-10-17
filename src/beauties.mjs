// 架空跨时代人物库；历史／传说姓名不代表真实人物经历或属性。
import {FEATURED_BEAUTY_DATA} from './featured-beauties-data.mjs';
export const CULTURES={
 zhongyuan:{name:'中原',portrait:'zhongyuan',dress:'交领襦裙、披帛与玉簪',first:'清婉 知微 若兰 听雪 锦书 云舒 月华 疏桐 含章 芷宁 明珠 映秋 书瑶 兰音 玉笙 念慈 晚晴 静姝 初荷 凝香'.split(' '),last:Array.from('沈顾林柳苏陆谢温叶宋许秦萧楚唐白江方程孟'),skills:['琴学','书画','诗赋','园艺']},
 southeast:{name:'东南亚',portrait:'southeast',dress:'地方丝织筒裙、肩披与金银饰',first:'莲达 素莉 玛丽 达拉 婉娜 苏雅 娜琳 莲妮 梅雅 莉妲 月丽 莎丽 芳妮 丽莎 索雅 碧娜 莲雅 安达 苏琳 芭雅'.split(' '),last:'帕 苏 陈 黎 阮 吴 范 林 郑 武 潘 杨 沙 陶 罗 龙 蒙 温 甘 金'.split(' '),skills:['舞乐','香料','织锦','航海']},
 central:{name:'中亚与西域',portrait:'central',dress:'翻领织锦长袍、腰带与皮靴',first:'阿依古丽 迪丽娜 萨比娜 古丽娜 扎丽娜 阿米娜 莉雅 娜孜 妮露 艾娜 索娜 拉娜 玛伊拉 祖拉 苏拉 塔娜 艾丽娅 罗莎 米娜 莎依'.split(' '),last:'安 康 曹 石 米 何 史 穆 萨 阿尔达 巴尔罕 塔里木 苏珊 库兰 伊利 纳曼 波拉特 撒马尔 帕米尔 叶尔'.split(' '),skills:['骑射','商贸','琵琶','语言']},
 france:{name:'法兰西与欧洲',portrait:'france',dress:'长袖裙袍、织带、头纱与冠饰',first:'阿黛尔 艾洛伊丝 玛蒂尔德 伊莎贝尔 克莱尔 艾莉诺 玛格丽特 阿涅丝 让娜 索菲 莉迪亚 艾玛 罗莎莉 布兰奇 塞西尔 露易丝 玛丽 薇奥莱特 卡米耶 奥黛特'.split(' '),last:'德瓦卢瓦 德里昂 德图尔 德鲁昂 德阿尔勒 德梅斯 德洛林 德普瓦捷 德安茹 德布卢瓦 德兰斯 德亚眠 德索恩 德南特 德奥尔良 德贝里 德第戎 德蒙特 德沙隆 德凡尔'.split(' '),skills:['竖琴','外交','刺绣','文书']},
 persia:{name:'波斯与西亚',portrait:'persia',dress:'刺绣长袍、软帽、珠饰与长裤',first:'希琳 帕丽莎 莱拉 娜迪娅 法拉 萨米拉 亚斯敏 达莉娅 努尔 莎赫拉 萨菲娅 妮嘉 阿兹拉 扎赫拉 鲁比娜 法蒂玛 萨哈尔 罗珊 梅赫尔 索拉雅'.split(' '),last:'巴赫拉姆 阿扎尔 纳西尔 拉希德 萨法尔 达里亚 米赫兰 卡里姆 沙普尔 法鲁克 阿里安 扎曼 法里德 哈桑 纳迪尔 阿米尔 萨利姆 马苏德 赫拉特 巴士拉'.split(' '),skills:['诗歌','医理','天文','香学']},
 india:{name:'南亚',portrait:'india',dress:'织金边披裹长衣、花饰与手镯',first:'帕德玛 拉克希米 米拉 阿莎 卡维娅 妮莎 莲娜 普丽娅 阿妮塔 塔拉 莎克蒂 维迪娅 拉妮 卡玛拉 桑迪娅 丽拉 苏曼 莫希妮 茹帕 莉蒂'.split(' '),last:'森 德维 古普塔 罗伊 辛格 达斯 库玛尔 莎尔玛 纳拉 梅塔 瓦尔玛 拉奥 卡普尔 钱德拉 拉曼 纳亚尔 戈帕尔 巴拉 提瓦里 贾雅'.split(' '),skills:['数学','舞蹈','医药','星象']},
 steppe:{name:'草原与北境',portrait:'steppe',dress:'毡呢长袍、织带、辫发与骑靴',first:'阿兰 萨仁 乌云 娜仁 图雅 乌兰 海兰 其其格 宝音 额尔敦 巴雅尔 敏珠 索伦 哈娜 木兰 伊娜 塔娜 朵兰 阿雅 诺敏'.split(' '),last:'博尔 赫连 慕容 拓跋 完颜 耶律 阿史那 铁勒 乞颜 苏赫 札兰 乌古 察罕 巴图 纳兰 蒙克 巴林 阿勒 伊勒 哈达'.split(' '),skills:['骑术','弓术','驯鹰','史诗']},
 japan:{name:'东亚海国',portrait:'japan',dress:'叠色长袍、扇与发饰',first:'绫子 晴子 藤子 雪子 千代 春香 葵 紫 纱月 诗织 琴音 美月 静香 千鹤 若叶 小夜 绫音 铃 兰 凛'.split(' '),last:'藤原 源 橘 平 纪 清原 菅原 大江 在原 小野 和泉 紫式部 伊势 赤染 中原 高阶 三善 坂上 吉田 吉野'.split(' '),skills:['和歌','书法','织染','乐舞']}
};
const localNames={
 tibet:['central','卓玛 央金 德吉 拉姆 措姆 曲珍','朗达 贡嘎 扎西 丹增 洛桑 索南'],
 korea:['japan','智媛 恩彩 秀妍 惠真 允熙 素英','金 李 朴 崔 郑 尹'],
 nanzhao:['southeast','阿诗 阿月 云枝 银花 山兰 碧泉','段 杨 高 董 赵 李'],
 rome:['france','狄奥多拉 伊琳娜 索菲娅 安娜 海伦娜 欧多琪娅','科穆宁 杜卡斯 帕列奥洛格 安格洛斯 拉斯卡里斯 弗卡斯'],
 slavs:['france','柳德米拉 米罗斯拉娃 斯韦特兰娜 雅罗斯拉娃 娜杰日达 薇拉','米洛娃 斯维亚托娃 柳博娃 维切娃 达尼洛娃 拉多娃'],
 axum:['persia','玛基达 阿尔玛兹 塞拉姆 提尔图 阿贝巴 索森娜','特斯法 耶胡内 阿勒穆 吉尔玛 贝克勒 塞尤姆'],
 maghreb:['persia','蒂娜欣南 塔夫苏特 塔莎 阿梅拉 玛西莉娅 蒂莉莉','阿伊特 伊德尔 阿马斯 阿齐鲁 伊弗伦 马辛'],
 sinhala:['india','阿努拉 维哈拉 萨曼蒂 尼兰蒂 库苏玛 玛利妮','佩雷拉 贾亚辛哈 维克拉玛 德席尔瓦 拉纳维拉 迪萨纳亚克'],
 maritime:['southeast','茉莉蒂 莲蒂 苏丽雅 玛雅拉 拉蒂娜 阿妮莎','布特丽 查哈雅 瓦蒂 巴哈里 苏里 塞拉坦'],
 java:['southeast','拉拉 拉蒂 德薇 塞卡尔 萨丽 乌兰','维加雅 普斯帕 宁西赫 拉哈尤 库苏玛 萨斯米塔'],
 champa:['southeast','波娜 达丽 娜伊 索妮 雅琳 阿莎','因陀罗 维阇耶 西诃 毗罗 摩尼 珊陀'],
 luzon:['southeast','玛雅 丽薇 莉加雅 达娅 玛丽娅 莲妮','拉坎 加特 布拉万 马拉雅 迪瓦 塔拉']
};
for(const [id,[base,first,last]] of Object.entries(localNames))CULTURES[id]={...CULTURES[base],name:id,portrait:id,first:first.split(' '),last:last.split(' ')};
const realmData=[['sheng','中原','zhongyuan'],['tubo','吐蕃','central'],['nanzhao','南诏','southeast'],['korea','高丽','japan'],['japan','日本','japan'],['steppe','铁勒','steppe'],['uyghur','回纥','central'],['persia','波斯','persia'],['arabia','大食','persia'],['rome','罗马','france'],['india','天竺','india'],['west-turk','西突厥','central'],['gaochang','高昌','central'],['east-turk','东突厥','steppe'],['khitan','契丹','steppe'],['xi','奚','steppe'],['tokhara','吐火罗','central'],['shule','疏勒','central'],['kucha','龟兹','central'],['tuyuhun','吐谷浑','central'],['bolur','小勃律','central'],['slavs','斯拉夫','france'],['franks','法兰西（法兰克）','france'],['siberia','黠戛斯','steppe'],['mohe','靺鞨','steppe'],['pyu','骠国','southeast'],['chenla','真腊','southeast'],['srivijaya','室利佛逝','southeast'],['java','诃陵','southeast'],['champa','林邑','southeast'],['luzon','吕宋','southeast'],['axum','阿克苏姆','persia'],['maghreb','柏柏尔','persia'],['sinhala','僧伽罗','india']];
const regionalStyle={
 tubo:['tibet','藏地氆氇长袍、彩条围裙与珊瑚绿松石饰'],nanzhao:['nanzhao','白族刺绣衣裙、包头与银饰'],korea:['korea','高腰长裙、短上衣、绳结佩饰与盘发'],rome:['rome','拜占庭纹饰长袍、织金领与珠宝冠饰'],slavs:['slavs','红色几何刺绣亚麻裙、羊毛罩裙与头巾'],axum:['axum','阿克苏姆织边棉布长裙、披巾与金饰'],maghreb:['maghreb','阿马齐格靛蓝长衣、披毯、银胸针与币饰'],sinhala:['sinhala','僧伽罗织金边围裙、短袖衫与肩披'],srivijaya:['maritime','马来丝织长衣、宋吉锦筒裙与肩巾'],java:['java','爪哇蜡染长裙、合身上衣与腰巾'],champa:['champa','占族长上衣、几何织边筒裙与头巾'],luzon:['luzon','吕宋织布上衫、围裙、长裙与金项饰'],pyu:['southeast','骠国丝织筒裙、斜披肩与金饰'],chenla:['southeast','真腊百褶桑朴裙、金肩披与花饰']};
export const BEAUTY_REGIONS=realmData.map(([id,name,base])=>{const style=regionalStyle[id],culture=style&&CULTURES[style[0]]?style[0]:base;return {id,name,culture,portrait:style?.[0]??CULTURES[culture].portrait,dress:style?.[1]??CULTURES[culture].dress};});
const historical=['西施','王昭君','貂蝉','杨玉环','赵飞燕','赵合德','甄宓','班婕妤','卫子夫','阴丽华','马皇后','长孙皇后','武则天','上官婉儿','太平公主','李清照','蔡文姬','卓文君','薛涛','鱼玄机','苏小小','李师师','陈圆圆','柳如是','董小宛','顾横波','李香君','卞玉京','寇白门','马湘兰','王朝云','花蕊夫人'];
const traits=['沉静细致','爽朗坦诚','机敏好学','温和坚韧','自信果决','风趣健谈','独立洒脱','好奇敏锐','沉稳持重','热情慷慨'];
const backgrounds=['书香门第','远行商旅','地方艺师','医者之家','使臣家族','工匠世家','山野学堂','宫廷乐坊'];
const seen={};
export const BEAUTIES=Array.from({length:1000},(_,i)=>{const historicalPerson=i<historical.length,r=historicalPerson?BEAUTY_REGIONS[0]:BEAUTY_REGIONS[(i-historical.length)%BEAUTY_REGIONS.length],c=CULTURES[r.culture],n=seen[r.culture]??0;seen[r.culture]=n+1;const name=historicalPerson?historical[i]:['zhongyuan','japan','korea','nanzhao'].includes(r.culture)?c.last[Math.floor(n/c.first.length)%c.last.length]+c.first[n%c.first.length]:c.first[n%c.first.length]+'·'+c.last[Math.floor(n/c.first.length)%c.last.length];return {id:`beauty-${i+1}`,name,origin:historicalPerson?'历史／传说':'原创',regionId:r.id,region:r.name,culture:r.culture,dress:r.dress,age:18,appearance:historicalPerson?92+(i*7)%9:45+(i*37)%56,experience:0,ability:historicalPerson?65+(i*11)%36:35+(i*19)%66,portrait:r.portrait,personality:traits[(i*3)%traits.length],specialty:c.skills[Math.floor(i/3)%c.skills.length],biography:historicalPerson?'借用历史或传说姓名的架空角色；年龄、性格与能力为游戏设定。':`出身${r.name}${backgrounds[Math.floor(i/7)%backgrounds.length]}，${traits[(i*3)%traits.length]}，擅长${c.skills[Math.floor(i/3)%c.skills.length]}。`};});
const homeCities=['hebei','henan','huainan','jiangnan','lingnan','hedong','guannei','shannan','jiannan','longyou'];
let homeIndex=0;for(const person of BEAUTIES)person.cityId=person.regionId==='sheng'?homeCities[homeIndex++%homeCities.length]:`${person.regionId}-core`;

// Keep archived IDs and records valid for old saves; only this edition's thirty may appear.
export const ACTIVE_BEAUTIES=FEATURED_BEAUTY_DATA.map((entry,index)=>{
 let person=BEAUTIES.find(p=>p.name===entry.name);
 if(!person){person={...BEAUTIES[0],id:`featured-${entry.key}`,name:entry.name,cityId:homeCities[index%homeCities.length]};BEAUTIES.push(person);}
 Object.assign(person,{featured:true,portraitAsset:entry.portraitAsset,legacyCode:entry.legacyCode,origin:entry.kind,age:entry.age,appearance:entry.appearance,ability:entry.ability,experience:entry.experience,specialty:entry.specialty,biography:`${entry.era}。${entry.kind==='原作人物'?'保留原作姓名，具体历史身份待考；衣饰为古典题材艺术设定。':'立绘依据时代与人物传统设计；未见文献记载的具体容貌、配色和饰物为艺术补全。'}年龄与能力为游戏设定。`,dress:entry.era});
 return person;
});
const featuredById=new Map(ACTIVE_BEAUTIES.map(p=>[p.id,p]));
export const isActiveBeauty=person=>Boolean(person&&(featuredById.has(person.id)||person.randomBeauty===true||person.foreignRoyal===true));
export const featuredBeautyFor=person=>person&&featuredById.get(person.id);
