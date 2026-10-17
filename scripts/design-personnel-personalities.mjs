import fs from 'node:fs/promises';
import {HISTORICAL_PEOPLE} from '../src/historical-people.mjs';
import {PRISON_PERSONALITIES} from '../src/personality-rules.mjs';
const facts=JSON.parse(await fs.readFile(new URL('../src/historical-evidence.json',import.meta.url),'utf8'));
const manualText=`
文天祥|steadfast|坚贞、守节、果决|被俘后拒绝劝降，在狱中作《正气歌》，以受囚仍守志设计。
岳飞|steadfast|忠直、严整、坚忍|治军严明、遭冤狱而未以诬告迎合，按坚守本志设计。
于谦|steadfast|刚正、担当、清慎|组织北京保卫战，后遭冤杀，重在担当与守正，不以囚禁自动增减其心志。
海瑞|steadfast|刚直、清介、无畏|冒死上疏直谏、长期清介，按不因刑威折节设计。
包拯|steadfast|刚正、秉公、严谨|敢于弹劾权贵，以执法和守正见长，按不因囚禁改志设计。
诸葛亮|steadfast|谨慎、严谨、尽责|勤于治政、赏罚有度、尽力任事，以责任感和自持设计。
张巡|steadfast|坚毅、果决、强硬|睢阳长期困守、被俘后遇害，按困境中坚持原志设计，相关守城伦理争议另论。
许远|steadfast|宽厚、坚毅、守节|与张巡共同守睢阳，城陷后遇害，按守志设计。
南霁云|steadfast|勇烈、守节、果断|睢阳相关战事中以忠烈著称，拒降而死。
陆秀夫|steadfast|坚贞、担当、决绝|崖山战败后负帝投海，按守节不屈设计。
史可法|steadfast|忠直、担当、坚毅|扬州守城失败后殉难，按守节而非畏刑顺从设计。
方孝孺|steadfast|刚正、守节、执着|靖难后拒绝草诏而遇害，按不屈性格设计。
黄道周|steadfast|刚正、执着、守节|抗清被俘后拒降遇害，守志性格有具体事迹支持。
刘宗周|steadfast|严谨、刚直、守节|重视修养和谏诤，明亡后绝食殉节。
高攀龙|steadfast|刚正、清介、执着|反对魏忠贤势力，受迫害后自尽，按坚守本志设计。
魏大中|steadfast|刚正、守节、坚忍|反对魏忠贤并在迫害中遇害，按受囚守志设计。
张煌言|steadfast|坚毅、守节、沉着|长期抗清，被俘后就义，以困境中的坚守设计。
张宪|steadfast|忠直、勇毅、坚忍|岳家军将领，在岳飞案中遇害，不以刑威自动增加顺从。
苏武|steadfast|坚贞、耐苦、守节|出使匈奴长期被扣仍守节，是耐囚守志的明确例子。
庞德|steadfast|勇烈、守志、决绝|襄樊被俘后拒降而死，以守志而非畏威设计。
高顺|steadfast|严整、清慎、守志|史载治军严整、清白，兵败后拒降遇害。
王彦章|steadfast|勇烈、刚直、守志|后梁兵败被俘后拒降，按囚中守志设计。
完颜陈和尚|steadfast|勇毅、守节、果决|金末抗蒙将领，被俘后拒降而死。
姜维|steadfast|执着、坚毅、审谋|蜀亡后仍筹划恢复，按长期执志设计，不宣称其所有军事决策正确。
赵云|composed|谨慎、严整、克制|任事谨慎、重军纪，以克制自守的囚中反应设计。
鲁肃|composed|宽厚、持重、远虑|重视联盟、外交与长远经营，以审慎自守设计。
陆逊|composed|持重、审慎、克制|善审势、注重军纪，受政治猜疑时并非恃勇冲动型。
羊祜|composed|宽厚、守信、持重|重信义与安抚，按沉静自守设计。
郭子仪|composed|宽厚、谨慎、谦退|功高而政治处事谨慎，按隐忍自守设计。
徐达|composed|谨慎、谦退、严整|作战稳健、治军严明、政治处事审慎。
孙膑|composed|隐忍、审谋、坚韧|遭受膑刑后仍以军略任事，按隐忍谋划而非畏刑顺服设计。
陈庆之|composed|谨慎、审势、坚毅|个人武勇非长项而重军队指挥，按审慎应对困境设计。
范蠡|composed|审势、谨慎、自守|功成后退处，善于判断政治风险。
张良|composed|审谋、克制、谦退|善于谋划与进退，功成后逐步退出权力中心。
萧何|composed|谨慎、尽责、克制|长于后方组织，政治处事谨慎，以持重自守设计。
曹参|composed|宽简、持重、守成|继萧何后延续制度，以宽简稳健的反应设计。
周亚夫|staunch|刚直、严整、执拗|治军严整，政治上不愿迁就，入狱后绝食而死，按不甘受囚设计。
韩信|staunch|自矜、敏感、善谋|军事天才而自负功名，政治失意中表现敏感，按受囚不平设计。
关羽|staunch|自矜、刚直、勇毅|史传有刚而自矜的评价，按受辱不平而非悔过顺服设计。
魏延|staunch|矜功、刚强、果决|军功突出，与同僚冲突尖锐，以矜功刚强设计。
白起|staunch|刚强、自持、决绝|晚年拒绝再度领兵并受迫自杀，按不愿屈从设计。
伍子胥|staunch|刚烈、直谏、执着|多次直谏吴王并被赐死，按受囚仍不愿迁就设计。
狄青|composed|沉着、谨慎、坚毅|以行伍军功立身，政治处境中谨慎自持。
司马懿|pragmatic|隐忍、权变、审势|长期隐忍、审势并掌控政治机会，以囚中权变而非认罪悔过设计。
贾诩|pragmatic|审势、谨慎、自保|善判断局势和自保，按审度利害暂求顺服设计。
陈平|pragmatic|机敏、审势、圆融|善于权谋应变与化解政治危机，以权变应对设计。
秦桧|pragmatic|机巧、逢迎、猜忌|长期经营权势、打击政敌，以权变自保设计；不把暂求顺服解释成清廉悔悟。
和珅|pragmatic|机敏、逢迎、逐利|擅政务和迎合皇帝，按利害权变设计，与巨额贪赃评价分开。
蔡京|pragmatic|机巧、逐利、权变|多次入相、擅政治经营，以审势求存设计。
严嵩|fearful|逢迎、依势、自保|长期依附皇权、晚年失势，按刑威下趋向自保设计，属于史事的游戏化推演。
李斯|fearful|审势、依权、惧祸|沙丘政变中的政治选择和临刑求生体现处境压力下的自保，以畏威设计。
魏忠贤|resentful|狠厉、猜忌、报复|专权并迫害异己，以强烈敌意与报复倾向的囚中反应设计。
李林甫|resentful|阴沉、猜忌、排异|长期排斥异己、阻塞言路，按囚中积怨设计。
梁冀|resentful|骄横、暴虐、猜忌|贪暴专权、操纵朝政，以受制后敌意加重设计。
来俊臣|resentful|狠厉、机巧、报复|罗织罪名、制造冤狱，以报复与敌意型反应设计。
周兴|fearful|狠厉、惧祸、自保|酷吏本人受逼问时的畏惧记载支持刑威下自保的设定。
赵高|pragmatic|机巧、阴狠、权变|操纵皇位继承、反复经营权势，以利害权变设计。
张飞|resentful|急躁、强硬、苛下|史载爱敬君子而不恤小人，刑杀既过差，以急躁与对部下苛严的囚中反应设计。
甘宁|resentful|勇烈、急躁、暴烈|勇敢但性情暴烈，有杀部下等记载，按受囚积怨设计。
蓝玉|staunch|骄纵、矜功、强硬|战功大而骄纵，受约束后不易低头，按刚烈反应设计。
常遇春|staunch|勇烈、强硬、果决|勇于突击，作战强硬，以不甘受制设计，杀降等操守评价另列。
鳌拜|staunch|骄强、矜功、强硬|早年军功突出，辅政后擅权，以矜功强硬设计。
年羹尧|staunch|矜功、骄强、专断|军功后骄纵擅权，以受囚不平设计。
曾国藩|repentant|自省、坚忍、谨慎|长期记日记、反省修身，自省特征明确，按囚中反思设计，不等于断言其历史上必然认罪。
廉颇|repentant|勇毅、知过、坦直|负荆请罪是承认过失的明确事迹，以知过能改设计。
冯异|composed|谦退、谨慎、持重|不争功名、军纪与安抚并重，按沉静自守设计。
邓禹|composed|谦退、审谋、持重|开国后谨慎退让，政治处事持重。
张廷玉|composed|谨慎、严整、持重|长期参与机务，文书政务严密，按自持应对设计。
陈廷敬|composed|谨慎、清慎、持重|政务与文献组织能力强，按稳健自守设计。
林则徐|steadfast|刚正、担当、自持|禁烟、直言及被贬后任事的经历，按坚守责任设计。
左宗棠|staunch|刚毅、自信、执着|任事坚决，与同僚争论强硬，以受囚不平设计。
李鸿章|pragmatic|务实、权变、审势|长于军政、外交与协调，按审度利害的反应设计。
张居正|staunch|果决、严厉、自信|推进改革、考成行政，作风强硬，按不甘受制设计。
王安石|staunch|执着、刚直、自信|坚持变法主张，不轻改政治判断，按受囚不平设计。
司马光|steadfast|审慎、守正、执着|重政治原则与史学判断，按持守本志设计。
苏轼|composed|旷达、坚韧、坦直|经历乌台诗案与贬谪，能调整心境并持续任事创作，按沉静自持设计。
朱熹|staunch|严谨、执着、守正|学术与政治主张坚持原则，以不愿因刑威改论设计。
陶渊明|composed|淡泊、自守、坦直|辞官归田、重个人志趣，以恬淡自守设计。
李白|staunch|自信、疏放、傲岸|诗文与行迹体现疏放自信，按受制不平设计，不采用神仙剑客传说。
杜甫|composed|坚韧、忧民、持重|长期困顿而关心民生，以忍耐和自持设计。
辛弃疾|staunch|豪迈、果决、执着|早年抗金行动果决，恢复志向坚定，以不甘受制设计。
岳钟琪|composed|坚毅、隐忍、谨慎|军功后曾遭牢狱并复出任事，以忍耐应变设计。
王守仁|composed|自省、坚韧、审势|受杖贬谪后讲学任事，反思修养与坚韧突出，不等于刑威必然改变其政治立场。
`.trim().split('\n');
const manual=new Map(manualText.map(line=>{const [name,personality,traits,basis]=line.split('|');return [name,{personality,characterTraits:traits.split('、'),personalityBasis:basis}];}));
const rules=[
 ['steadfast',['守志','坚毅'],'拒降|拒绝投降|拒绝劝降|宁死不屈|坚贞不屈|殉节|守节|忠贞'],
 ['repentant',['自省','知过'],'知过能改|悔过|改过自新|悔悟|引咎自责|反躬自省'],
 ['resentful',['强硬','易积怨'],'睚眦必报|怀恨|报复心|性情暴躁|性暴|残忍好杀|性情残暴'],
 ['fearful',['谨慎','畏祸'],'贪生怕死|畏罪|惧死|怯懦|胆怯|畏祸|害怕获罪'],
 ['staunch',['刚强','不轻屈从'],'刚烈|刚愎|刚强|刚毅|刚直|刚正|性刚|自矜|恃才|自负|骄纵'],
 ['pragmatic',['审势','权变'],'逢迎|趋炎附势|见风使舵|圆滑|善于迎合|善于自保|明哲保身'],
 ['composed',['持重','自守'],'宽厚|温和|沉静|沉着|持重|谨慎|恬淡|隐居|退隐']
];
const output={};
for(const person of HISTORICAL_PEOPLE){const fact=facts[person.id],text=fact?.assessmentText??fact?.text??person.biography;
 const clauses=text.split(/[。；\n]/).map(s=>s.trim()).filter(s=>s&&!/^(其父|其祖|父亲|祖父|曾祖|高祖|外祖|其子|其兄|其弟)/.test(s)&&!/^.*(?:纪念馆|影视形象|演员饰演|小说虚构)/.test(s));
 let card=manual.get(person.name),quote='',method='史事个案设计';
 if(!card){for(const [key,traits,pattern] of rules){const re=new RegExp(pattern),clause=clauses.find(c=>re.test(c)&&!/(?:不|并非|并不|未曾)(?:是|为|以)?(?:刚烈|刚愎|自负|怯懦|胆怯|残暴|逢迎)|批评.{0,10}他人|反对.{0,10}他人/.test(c));if(!clause)continue;const match=re.exec(clause),start=Math.max(0,match.index-40);quote=clause.slice(start,start+150);card={personality:key,characterTraits:traits,personalityBasis:`本人传记记有“${quote}”。据此设计${PRISON_PERSONALITIES[key].name}型天牢反应；这是历史事迹的游戏化推演。`};method='本人记载设计';break;}}
 if(!card){card={personality:'composed',characterTraits:['审慎自守'],personalityBasis:`${person.name}现有本人资料未明确记载足以判断囚中反应的性情事迹。保守设为沉静自守，囚禁本身不改变忠诚；不把资料空白编成悔过或怨恨。`};method='资料有限保守设计';}
 if(!Object.hasOwn(PRISON_PERSONALITIES,card.personality))throw Error(person.name+'性格类型无效');
 output[person.id]={id:person.id,name:person.name,...card,personalityEvidence:quote||person.biography,personalityMethod:method,personalitySource:fact?.source??person.source,personalityVersion:1};
}
await fs.writeFile(new URL('../src/historical-personalities.json',import.meta.url),JSON.stringify(output,null,2)+'\n');
console.log(JSON.stringify({total:Object.keys(output).length,types:Object.fromEntries(Object.keys(PRISON_PERSONALITIES).map(k=>[k,Object.values(output).filter(p=>p.personality===k).length]))}));
