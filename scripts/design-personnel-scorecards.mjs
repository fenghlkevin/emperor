// 由逐人事迹条目生成可编辑的独立设计卡，不使用姓名/编号取模或随机值。
// 每个维度记录本人的证据、设计取舍；最终运行时只读取明确保存的分数。
import fs from 'node:fs/promises';
import {HISTORICAL_PEOPLE} from '../src/historical-people.mjs';
import {HISTORICAL_RATINGS} from '../src/historical-ratings.mjs';
import {SUPPLEMENTAL_RATINGS} from '../src/historical-ratings-supplement.mjs';
import {MILITARY_RATINGS} from '../src/historical-ratings-military.mjs';
const corpus=JSON.parse(await fs.readFile(new URL('../src/historical-evidence.json',import.meta.url),'utf8'));
const overrides=new Map([...HISTORICAL_RATINGS,...SUPPLEMENTAL_RATINGS,...MILITARY_RATINGS].map(p=>[p.name,p]));
const cap=(v,min,max)=>Math.max(min,Math.min(max,Math.round(v)));
const unique=a=>[...new Set(a.filter(Boolean))];
const definitions={intelligence:'智力（学识、谋划与技术理解）',martial:'武力（个人武勇，不等于统军）',leadership:'统率（组织与战役指挥）',politics:'政务（行政与制度执行）',integrity:'清廉（廉洁与公私操守）'};
const limits={intelligence:[35,94],martial:[8,95],leadership:[12,94],politics:[20,94],integrity:[15,96]};
function design(person,fact){
 const full=fact?.assessmentText??fact?.text??'',offices=fact?.offices??[],works=fact?.works??[];
 // 排除亲属官职、当代评价者及纯纪念设施，避免借用他人的成就。
 const clauses=full.split(/[。；\n]/).filter(s=>s&&!/^(?:其父|其祖|父亲|祖父|曾祖|高祖|外祖|父为|兄为|弟为|其子|之子|其兄|其弟)/.test(s.trim())&&!/未证|未见|不足以|不借用|未经确认|具体.*待考|纪念馆|纪念碑|公园|故居|墓地|墓葬|文革|文化大革命/.test(s));
 const text=clauses.join('。'),military=person.role==='武将';
 const hasCommand=military||/(?:率|领|统)(?:军|兵)|任.{0,12}(?:将军|都督|节度使)|组织.{0,8}(?:抵御|防御|守城)/.test(text);
 const stat={intelligence:55,martial:military?43:16,leadership:military?42:18,politics:37,integrity:62};
 const evidence=Object.fromEntries(Object.keys(stat).map(k=>[k,[]]));const tags=[];
 function find(pattern){const re=new RegExp(pattern);const clause=clauses.find(s=>re.test(s));if(!clause)return '';const match=re.exec(clause),start=Math.max(0,match.index-45),end=Math.min(clause.length,Math.max(start+130,match.index+match[0].length));return (start?'…':'')+clause.slice(start,end).trim()+(end<clause.length?'…':'');}
 function apply(key,points,pattern,reason,tag){if(key==='leadership'&&!hasCommand)return false;const quote=find(pattern);if(!quote)return false;if(points<0&&/反对|弹劾|揭露|批评|不满|谴责|抵制|阻止|诬陷|构陷|冤/.test(quote))return false;stat[key]+=points;evidence[key].push({reason,quote,adjustment:points});if(tag)tags.push(tag);return true;}
 function direct(key,points,quote,reason,tag){if(!quote)return;stat[key]+=points;evidence[key].push({reason,quote,adjustment:points});if(tag)tags.push(tag);}
 const isScholar=/学者|文学家|思想家|哲学家|理学家|经学家|史学家|教育家|诗人|诗僧|僧人|书法家|画家|文学名家|著述/.test(text);
 apply('intelligence',10,'进士|状元|制科|博学宏词|博学弘词|明经','科举或专门学业显示知识训练');
 apply('intelligence',12,'学者|思想家|哲学家|理学家|经学家|史学家|教育家','有明确的学术专业','学术');
 apply('intelligence',9,'文学家|诗人|诗僧|书法家|画家|词人|曲家','文学艺术创作能力见载','文艺');
 apply('intelligence',9,'医学家|科学家|数学家|天文学家|地理学家|农学家|音律|历法|医药|医学|水利学','有技术或科学专长','技术');
 apply('intelligence',10,'兵法|谋士|谋臣|军事家|军事理论|战略家|善谋|足智|智略','军政判断或兵学专长见载','谋略');
 apply('intelligence',8,'反间|离间|诱敌|计策|奇袭|出奇|谋划|谋略|料敌|设伏|伏击|战略','有具体筹谋、情报判断或战术运用');
 apply('intelligence',5,'宰相|丞相|首辅|平章政事|参知政事|统帅|主帅|主将','有军政决策实践，适度增加综合判断');
 apply('intelligence',5,'创立|开创|创始|开宗|奠基|集大成|独创|开派|首创','有开创性学说或方法');
 apply('intelligence',4,'编纂|编修|修撰|修史|总纂|校勘|考据|考证|编著|编撰','有文献辨析、编纂或专著实践');
 apply('intelligence',8,'著有|撰有|著《|有《|文集|诗作|词作|诗集|撰写|词章','本人有可识别的写作或著述实践','著述');
 apply('intelligence',4,'外交|使节|出使|谈判|议和|条约|游说','有外交判断与交涉经验','外交');
 if(works.length)direct('intelligence',Math.min(6,works.length*2),works.slice(0,3).join('、'),'本人著述记录支持专业深度，不以书名或篇幅随机加分');
 if(!evidence.intelligence.length&&isScholar)direct('intelligence',12,fact.text,'史料确认学术或文学活动，按其专业能力设定');
 apply('intelligence',-8,'屡次误判|判断失误|不学无术|愚昧无知','明确记有学识或判断缺陷');
 apply('martial',23,'骁勇|勇猛|勇武|武艺|武勇|勇力|膂力|力能|勇悍','明确记有个人勇武，而非只有将军称号','勇武');
 apply('martial',13,'善射|善骑射|精骑射|骑射|射术|善用.*(?:枪|槊|刀|戟|剑)','骑射或兵器技能见载');
 apply('martial',10,'先登|陷阵|冲锋|突阵|亲冒矢石|身先士卒|力战|格斗','有临阵亲战行为');
 apply('martial',6,'武举|武进士|武状元|武童','有武学或武科训练记录');
 if(/不善骑射|不善骑马|身体羸弱|体弱|残疾|膑刑/.test(text)){stat.martial=Math.min(stat.martial,28);evidence.martial.push({reason:'身体或骑射限制使武勇与谋略分开',quote:find('不善骑射|不善骑马|身体羸弱|体弱|残疾|膑刑'),adjustment:'上限28'});}
 apply('leadership',11,'率军|领军|统军|统帅|主帅|主将|指挥官|将领|将军|节度使','本人具有领兵或军队组织履历','领军');
 apply('leadership',9,'击败|击退|大破|战胜|获胜|取胜|收复|攻克|平定','有作战成果记载，增计战役执行');
 apply('leadership',8,'守城|坚守|防御|防守|守卫|镇守|保卫|边防|边疆','有防务或持续守御经历','防务');
 apply('leadership',8,'练兵|训练|治军|军纪|军制|编练|建军|军队建设','有练兵或军队制度组织实践','治军');
 apply('leadership',6,'漕运|粮运|军需|军粮|馈运|运粮|后勤|屯田','有军需与后勤协调实践','后勤');
 apply('leadership',5,'水战|海战|水师|水军|海军|舰队|海防','水上作战或海防经验','水师');
 apply('leadership',5,'骑兵|突袭|奇袭|奔袭|夜袭|伏击|合围','有机动、奇袭或兵种运用记载');
 const battles=unique(text.match(/[\u4e00-\u9fff]{2,6}之战/g)??[]);
 if(hasCommand&&battles.length>1)direct('leadership',Math.min(12,(battles.length-1)*3),battles.slice(0,4).join('、'),'多次具体战役体现军事实践广度，不能仅据一个将军称号评价');
 apply('leadership',8,'统帅|大都督|大将军|统领.{0,8}军|率兵.{0,8}万|率军.{0,8}万','有大军或多部组织经历');
 apply('leadership',-11,'全军覆没|全军覆灭|丧师|大败而归|溃败','严重战役失败，不能只计胜绩');
 apply('leadership',-5,'兵败|战败|败走|败绩|失守|作战失利','明确失败经历降低战役稳健性');
 apply('politics',12,'宰相|丞相|首辅|平章政事|大学士|中书令|参知政事|内阁|辅政','实际中枢任职带来决策与协调经验','中枢');
 apply('politics',8,'尚书|侍郎|总督|巡抚|布政使|按察使|御史|刺史|太守|知府|知州|知县|县令|县尉|县丞','实际行政或监察岗位见载','行政');
 apply('politics',10,'尚书|侍郎|总督|巡抚|参知政事|大学士|中书令|枢密使','承担部门、区域或中枢行政协调');
 apply('politics',7,'知.{0,4}州|知.{0,4}府|通判|县令|县尉|县丞|太守|刺史|布政使|按察使','本人具体地方岗位构成行政实践');
 apply('politics',6,'翰林|学士|中书舍人|给事中|谏议大夫|太子少师|御史','中枢文书、监察或议政经验');
 apply('politics',9,'改革|变法|法令|制度|税制|财政|赋税|盐政|盐铁|赋役|漕运','有制度或财税实务','财政治理');
 apply('politics',8,'赈灾|赈济|救济|办粥|粥局|水利|治水|浚|修筑|兴修|垦田|民生','有民生建设或救济实务','民生');
 apply('politics',6,'断案|审判|司法|执法|平反|狱讼|刑狱|冤案','有司法处置经验');
 apply('politics',5,'学校|书院|讲学|国子监|教授|教育|培养','有教育组织或人才培养实践','教育');
 apply('politics',5,'外交|使节|出使|谈判|条约|游说','外交事务增加协商与政务能力');
 apply('politics',-6,'行政失误|怠政|疏于实务|废弛|政绩不佳','行政执行缺陷见载');
 const actualOffices=unique(offices.filter(x=>! /未详|追赠|追封|赠|宗室|封爵/.test(x)));
 if(actualOffices.length){direct('politics',Math.min(9,actualOffices.length),actualOffices.slice(0,5).join('、'),'本人任职记录体现岗位跨度与政务经验');if(/将军|节度|都督|兵马|军使/.test(actualOffices.join('、')))direct('leadership',4,actualOffices.filter(x=>/将军|节度|都督|兵马|军使/.test(x)).slice(0,3).join('、'),'直接任官记录补充军事组织履历');}
 // 操守使用明确表述；不把“弹劾别人贪污”算成本人贪污。
 apply('integrity',19,'为官清廉|廉洁奉公|一生廉洁|清廉自守|清正廉洁|廉洁无私|清贫如洗|以清廉|以廉洁|以清正','明确廉洁评价或行为见载','廉洁');
 apply('integrity',10,'拒绝贿赂|不受贿|不受馈|拒贿|拒绝徇私|不徇私|不畏权贵|秉公执法|刚方正直','有拒贿或秉公行为');
 apply('integrity',8,'直言强谏|直言敢谏|敢于直谏|直言谏诤|以直谏|以敢谏|犯颜直谏','承担风险直谏，支持公私操守','谏诤');
 apply('integrity',8,'被俘拒降|拒降而死|拒降遇害|拒降|殉节|殉难|守节|忠烈','拒降、守节或殉难见载，不能替代军事能力','守节');
 apply('integrity',-25,'本人贪污|因贪污|因贪赃|因受贿|贪赃纳贿|贪赃枉法|贪污受贿|大肆敛财|贪暴|贪腐|巨额贪','明确本人贪腐行为','贪腐');
 apply('integrity',-14,'专权|弄权|结党营私|排斥异己|构陷|残暴|屠城|滥杀|杀降','权力滥用或暴虐行为见载','争议');
 apply('integrity',-12,'叛变|叛乱|谋反|叛将','记有背盟叛乱行为；阵营选择与军事能力分评','政治反复');
 const sourceExcerpt=(fact?.text??person.biography).slice(0,180);
 const track=isScholar?'学术文职':military?'军事执行':'地方文职';
 const caveats=[];
 for(const key of Object.keys(stat)){
  if(!evidence[key].length){
   const reasons={intelligence:'现有个人资料尚不足以证明高阶军政谋略，保守设定知识判断能力',martial:isScholar?'本人材料以学术或文职为主，未证个人格斗骑射，按低武勇设计':military?'本人武职履历明确但个人武艺记载不足，保留中等武勇':'未见本人武艺事迹，以低个人武勇设计',leadership:isScholar?'本人以学术教育为主，未证独立指挥大战，统率低配':'没有足够独立统军记录，不借用同名人物或亲属战功',politics:'资料所见实际行政履历有限，政务保守配置',integrity:'没有足够本人廉贪行为证据；本值仅为个人游戏设定，不宣称其清官或奸臣'};
   evidence[key].push({reason:reasons[key],quote:sourceExcerpt,adjustment:'个人设计保守值'});
   if(key==='integrity')caveats.push('操守证据有限');
  }
  stat[key]=cap(stat[key],...limits[key]);
 }
 // 经验取决于本人的履职与专长证据，而不再用所有普通人同一经验档。
 const experience=cap(25+actualOffices.length*3+Math.min(works.length,8)*2+Object.values(evidence).flat().filter(x=>typeof x.adjustment==='number').length*2,25,85);
 const sourceStrength=fact?.kind==='biography'||actualOffices.length||works.length?'事迹及履职记录':'基本身份记录';
 const narrative=`${person.name}的设计重心为${track}。${unique(tags).slice(0,4).join('、')||'具体能力按现有本人记录保守配置'}。`;
 return {...stat,tags:unique(tags).length?unique(tags):[track],initialExperience:experience,designMethod:'逐项史料设计',designConfidence:sourceStrength,designNote:narrative,dimensionEvidence:evidence,designCaveats:caveats};
}
const designs={};
for(const p of HISTORICAL_PEOPLE){const fact=corpus[p.id],override=overrides.get(p.name);let entry=design(p,fact);
 if(override){const dimensions={},context=override.designNote??override.biography;
  const interpretations={
   intelligence:override.intelligence>=90?'学识、技术理解或军政谋略为突出专长':override.intelligence>=75?'知识判断与实际谋划较强，仍有能力边界':'实绩偏执行或武勇，不以功名直接拔高综合谋划',
   martial:override.martial>=90?'个人武勇或临阵战斗为突出专长':override.martial>=60?'具武职或个人战斗经验，区别于顶级勇将':'未证顶级个人武艺或存在身体限制，避免把学名、军略或官位当武力',
   leadership:override.leadership>=90?'独立战役、治军或大军组织能力突出':override.leadership>=60?'具有军事实践或协调能力，战役独立性与胜败另作限制':'缺乏一流独立统军实绩，不以忠烈、学术或职位代替战役能力',
   politics:override.politics>=90?'治国、制度、财政或地方治理为突出专长':override.politics>=65?'具实际政务或经世能力，未列顶级行政实绩':'主要贡献在军旅或专业领域，高阶行政能力保守设计',
   integrity:override.integrity>=90?'相关廉洁、秉公、守正或守节行为突出':override.integrity<=20?'相关贪赃、专权、构陷或暴虐行为严重，才干与操守分开':override.integrity<=55?'存在明确争议或政治操守问题，保留能力但降低操守评价':'未列极端廉贪类型，按可见行为及资料边界作谨慎设定'
  };
  for(const key of Object.keys(definitions))dimensions[key]=[{reason:`${p.name}：${interpretations[key]}。个案依据：${context}`,quote:fact?.text??p.biography,adjustment:'逐人审定值'}];
  entry={...entry,...override,designMethod:'逐人史事审定',dimensionEvidence:dimensions,historySummary:context,designNote:Object.values(interpretations).join('；')+'。',designConfidence:'史传个案审定',initialExperience:p.initialExperience??75};}
 entry.id=p.id;entry.name=p.name;entry.source=fact?.source??p.source;entry.sourceTitle=fact?.sourceTitle??p.sourceTitle;
 entry.ratingBasis=Object.entries(definitions).map(([k,label])=>`${label} ${entry[k]}：${entry.dimensionEvidence[k].map(e=>`${e.reason}（依据：${e.quote}）`).join('；')}`).join('\n');
 designs[p.id]=entry;
}
await fs.writeFile(new URL('../src/historical-designs.json',import.meta.url),JSON.stringify(designs,null,2)+'\n');
const values=Object.values(designs);console.log(JSON.stringify({total:values.length,individual:values.filter(p=>p.designMethod==='逐人史事审定').length,documented:values.filter(p=>p.designMethod==='逐项史料设计').length,scoreCombinations:new Set(values.map(p=>['intelligence','martial','leadership','politics','integrity'].map(k=>p[k]).join(','))).size}));
