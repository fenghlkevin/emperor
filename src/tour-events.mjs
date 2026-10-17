import {endReign} from './ending-rules.mjs';
import {postTreasury} from './finance.mjs';
import {changeWelfare} from './building-effects.mjs';
import {BEAUTIES} from './beauties.mjs';
import {ensurePortrait,portraitHash,portraitRandom} from './beauty-portrait.mjs';
import {RANDOM_PORTRAITS} from './random-beauties-data.mjs';
import {entryConsortRank} from './emperor.mjs';
import {settleProgress} from './imperial-progress.mjs';
import {settleReignResult} from './reign-result.mjs';

// Original project expansion, not a claim about DOS event rules.
const option=(id,label,effects,extra={})=>({id,label,effects,...extra});
export const TOUR_EVENTS=[
 {id:'petition',title:'拦驾告御状',category:'司法',art:'petition',story:'一名老妇捧着诉状跪在道旁，诉称田产被豪强侵占，数次告官均被驳回。随行官员请旨：是亲自过问，还是交由地方复核？',choices:[
  option('review','拨银复核，御前听讼',{money:-1200,local:{loyalty:8,security:3},stats:{wisdom:2},justice:true}),
  option('delegate','命刑部派员核查',{money:-300,local:{loyalty:3,stability:2},justice:true}),
  option('dismiss','斥退申诉，催驾前行',{prestige:-4,local:{loyalty:-8,security:-3}})]},
 {id:'assassin',title:'短刃惊驾',category:'险情',art:'assassin',story:'拥挤的人群忽然散开，一名刺客拔出短刃冲向御驾。侍卫奋力阻拦，陛下必须立即决断。护卫训练、当地治安与自身武术都会影响结果。',choices:[
  option('guards','令侍卫结阵擒拿',{money:-600},{risk:'guards',success:{prestige:4,local:{security:5}},failure:{stats:{health:-18,life:-4},prestige:-2,local:{security:-3}}}),
  option('fight','亲自迎击刺客',{}, {risk:'martial',success:{stats:{martial:6,health:-3},prestige:5},failure:{stats:{health:-25,life:-6},prestige:-3}}),
  option('withdraw','护驾撤离，不再追击',{stats:{health:-4},prestige:-5,local:{stability:-3}})]},
 {id:'bereaved',title:'卖身葬父',category:'邂逅',art:'bereaved',story:'道旁一名成年女子身着素衣，守着父亲的灵柩，因无钱安葬而求助。她识字能绣，愿凭双手谋生。陛下可以资助她重建生活，也可在她自愿后迎入宫中。',choices:[
  option('aid','赐银安葬，助其自立',{money:-300,local:{loyalty:5},prestige:2}),
  option('admit','厚葬其父，询其意愿迎入后宫',{money:-500,stats:{happiness:8},local:{loyalty:2},admit:true}),
  option('pass','交善堂照料，继续巡行',{local:{loyalty:1},stats:{happiness:-1}})]},
 {id:'flood',art:'flood',title:'河堤险情',category:'民生',story:'连日春汛冲坏护堤，村民以沙袋勉强堵住缺口。若再遇大雨，沿岸田舍恐将受损，地方请求就近拨款与粮食。',choices:[
  option('relief','拨款补堤，调粮安民',{money:-2500,grain:8000,local:{stability:8,loyalty:6}}),
  option('repair','优先修固堤防',{money:-1400,local:{defense:5,security:2}}),
  option('delay','暂交地方自行筹措',{local:{stability:-5,loyalty:-4}})]},
 {id:'corruption',art:'corruption',title:'账册疑云',category:'司法',story:'驿站小吏暗中呈上一册阴阳账，称地方胥吏侵吞工程银款。账面似有端倪，但尚须核实。贸然抄没或许得银，却可能伤及无辜。',choices:[
  option('audit','出资核账，依法追赃',{money:-800},{risk:'investigation',success:{money:3300,local:{security:5,loyalty:6},stats:{wisdom:2},justice:true},failure:{local:{stability:1},stats:{wisdom:1},justice:true}}),
  option('seize','即刻封存库银，责令追缴',{money:1800,prestige:-3,local:{loyalty:-4,stability:-2},justice:true}),
  option('warn','留册备查，申饬地方',{stats:{wisdom:1},local:{loyalty:1},justice:true})]},
 {id:'recluse',art:'recluse',title:'山亭问道',category:'修养',story:'山亭中一位老先生正与乡民讲解治水、农时与用人之道。他不求官位，只愿朝廷少些急令，多听地方实情。',choices:[
  option('learn','驻驾请教治道',{money:-400,stats:{wisdom:6,talent:2}}),
  option('teach','资助其开馆授业',{money:-900,stats:{wisdom:3,talent:4},local:{stability:4,loyalty:3}}),
  option('salute','拱手致意，不扰清修',{stats:{wisdom:1}})]},
 {id:'healer',art:'healer',title:'乡野名医',category:'修养',story:'一位行医多年的女医正在为村民义诊。她诊出旅途劳顿之症，亦恳请朝廷为乡间添设药箱。',choices:[
  option('treat','请其诊治，赐酬谢礼',{money:-600,stats:{health:15,life:3}}),
  option('clinic','拨银设乡间医舍',{money:-1200,local:{fitness:8,loyalty:5}}),
  option('support','托地方药铺照料患者',{local:{fitness:1,loyalty:1}})]},
 {id:'bandits',art:'bandits',title:'商道遇匪',category:'治安',story:'商旅告称前方山道常有劫匪出没，货车不敢独行。有人主张派兵清剿，也有人建议安抚饥民、招散胁从。',choices:[
  option('attack','拨军费清剿山道',{money:-1200},{risk:'guards',success:{local:{security:9,loyalty:5},prestige:3},failure:{local:{security:-3},stats:{health:-5}}}),
  option('pacify','赈济胁从，招抚离散者',{money:-900,local:{stability:5,security:4}}),
  option('detour','绕道而行，留待地方处理',{local:{security:-6,stability:-3}})]},
 {id:'grain',art:'grain',title:'粮价腾贵',category:'民生',story:'城中粮铺囤积居奇，百姓排队购米却不断被抬价。官府请旨，能否从附近丰收州购粮平价投放。',choices:[
  option('buy','购粮平粜，补足州仓',{money:-1500,grain:10000,local:{loyalty:4,stability:3}}),
  option('inspect','查验私藏，责令释粮',{money:-300,grain:2500,local:{security:4},justice:true}),
  option('tax','加征粮商税，充实国库',{money:1800,local:{loyalty:-7,activity:-4}})]},
 {id:'canal',art:'canal',title:'渡口阻舟',category:'建设',story:'旧渡口淤浅，商船和运粮船停在岸边，货主与脚夫争执不休。乡老盼望修疏河道，让商旅重新通行。',choices:[
  option('dredge','拨款疏浚，整修渡口',{money:-1800,local:{activity:6},living:3}),
  option('temporary','修临时栈桥，先保通行',{money:-600,local:{defense:5,fitness:-2}}),
  option('wait','等地方自行募集款项',{local:{activity:-4,stability:-3}})]},
 {id:'craftsmen',art:'craftsmen',title:'巧匠献艺',category:'人才',story:'一位工匠带来改良水车与织机的小样，愿将技法传授当地作坊，只苦于没有材料和学徒经费。',choices:[
  option('workshop','资助作坊，推广新法',{money:-1000,productivity:2,stats:{talent:5}}),
  option('purchase','买下小样，带回宫中研习',{money:-500,stats:{talent:4,happiness:4}}),
  option('praise','赐匾鼓励，令地方观摩',{prestige:1,local:{activity:2}})]},
 {id:'harvest',art:'harvest',title:'丰年迎驾',category:'风物',story:'乡民摆出新谷与时蔬迎驾，称今年收成尚好。地方官劝进献更多粮银，乡老却盼能让辛劳一年的百姓多留余粮。',choices:[
  option('remit','赐还贡物，赏银劝农',{money:-1000,local:{loyalty:6},living:3}),
  option('receive','收下地方自愿献礼',{money:2000,prestige:2,local:{loyalty:-2}}),
  option('feast','赐宴乡民，共庆丰收',{money:-600,stats:{happiness:8},local:{activity:3}})]},
 {id:'school',art:'school',title:'破庙书声',category:'教化',story:'村中孩子聚在漏雨的破庙读书，先生用树枝在沙地写字。乡民愿出力修屋，却凑不齐书本与纸墨。',choices:[
  option('build','赐银修学舍，添置书籍',{money:-1200,stats:{wisdom:4,talent:4},local:{stability:4}}),
  option('books','赐书与纸墨，勉励师生',{money:-400,stats:{wisdom:3},local:{loyalty:2}}),
  option('observe','驻足听课，题字留念',{stats:{wisdom:1},prestige:1})]},
 {id:'lostchild',art:'lostchild',title:'街头寻亲',category:'民生',story:'市集上有孩童与家人走散，正被一名卖饼老人照看。巡街衙役问是否停驾寻亲，或将孩子送往善堂安置。',choices:[
  option('reunite','命人沿街寻亲',{money:-200,local:{loyalty:4},stats:{happiness:3}}),
  option('shelter','拨款照料善堂孤幼',{money:-600,local:{stability:4,loyalty:3}}),
  option('delegate','命衙役照看，待家人认领',{local:{loyalty:1}})]},
 {id:'veterans',art:'veterans',title:'老卒诉饷',category:'军务',story:'几名退役老卒拦在驿馆门前，诉说旧年欠饷与伤病无人照料。随行军官也担心此事影响军心。',choices:[
  option('stipend','发给抚恤，核补欠饷',{money:-1000,training:4,local:{loyalty:5},justice:true}),
  option('honor','亲加慰问，表彰战功',{prestige:3,training:2}),
  option('defer','令军府另册查办',{local:{loyalty:-3},training:-2,justice:true})]},
 {id:'gift',art:'gift',title:'巨贾献珍',category:'抉择',story:'一名富商献上珍玩与银票，言辞间却暗示希望独占当地盐货买卖。地方百姓远远望着，等候皇帝的答复。',choices:[
  option('accept','收下献礼，默许其经营',{money:1500,prestige:-3,local:{loyalty:-2}}),
  option('refuse','退还献礼，不许垄断',{prestige:4,local:{loyalty:2}}),
  option('public','将献礼转赠地方善堂',{cash:800,local:{loyalty:4,activity:2}})]},
 {id:'refugees',art:'refugees',title:'流民求安',category:'民生',story:'一队流民扶老携幼来到城外，盼能落籍耕作。地方担心骤增口粮负担，但附近尚有可耕荒地。',choices:[
  option('settle','拨银安置，给粮落籍',{money:-2000,population:1500,grain:5000,local:{loyalty:5,stability:3}}),
  option('supply','拨银助行，赠粮分流',{money:-700,grain:-2000,local:{stability:3,loyalty:2}}),
  option('reject','关闭城门，令其离去',{local:{loyalty:-3,stability:-2}})]},
 {id:'performers',art:'performers',title:'乡间百戏',category:'风物',story:'一班民间艺人正表演傀儡与杂技，曲调中唱的都是乡里故事。领班愿赴行宫献艺，也希望能在集市再演一场。',choices:[
  option('palace','请赴行宫献艺',{money:-800,stats:{happiness:10,talent:4}}),
  option('festival','出资演给乡民观看',{money:-1200,local:{activity:5,loyalty:3}}),
  option('watch','驻驾看一折，赞其技艺',{stats:{happiness:2,talent:1}})]},
 {id:'xia-yuhe',title:'大明湖畔·夏雨荷',category:'稀有彩蛋',rare:true,art:'xia-yuhe',story:'暮雨初歇，荷香满湖。一位名唤夏雨荷的二十二岁女子，正在亭下题诗绘荷。她温婉聪慧，谈吐不俗，与陛下一见如故。她愿自择去留：随驾入宫，或留在湖畔继续自己的生活。',choices:[
  option('admit','赠以信物，依她心意迎入后宫',{money:-800,stats:{happiness:15,talent:5},admit:true}),
  option('poetry','以诗相赠，珍重作别',{stats:{talent:8,wisdom:3,happiness:5}}),
  option('patron','资助她的画坊，留一段湖畔佳话',{money:-600,local:{activity:4},stats:{talent:4,happiness:8}})]}
];
export const XIA_YUHE_CHANCE=.01;
const homeProvinces=new Set(['hebei','henan','huainan','jiangnan','lingnan','hedong','guannei','shannan','jiannan','longyou']);
const byId=new Map(TOUR_EVENTS.map(e=>[e.id,e]));
const ordinary=BEAUTIES.filter(p=>p.origin==='原创'&&p.regionId==='sheng');
const bounded=(n,min,max)=>Math.max(min,Math.min(max,n));
export function initializeTourEvents(s){for(const trip of [...(s.travel?.pending?[s.travel.pending]:[]),...(s.travel?.history??[])])trip.encounters??=[];return s;}
export function createTourEncounters(s,trip){
 const random=portraitRandom(portraitHash(`${s.createdAt}|${s.name}|tour:${trip.id}|${trip.provinceId}`));
 const p=s.domestic.provinces.find(p=>p.id===trip.provinceId),recent=new Set(s.travel.history.slice(0,3).flatMap(t=>(t.encounters??[]).map(e=>e.type)));
 const pool=TOUR_EVENTS.filter(e=>!e.rare).map(event=>({event,weight:(['petition','bereaved','assassin'].includes(event.id)?2:1)*(recent.has(event.id)?.3:1)*(event.id==='bandits'&&p.welfare.security<60?2:1)*(event.id==='flood'&&p.disaster?2:1)}));
 const used=new Set([...s.harem.members.map(p=>p.id),...(s.harem.seen??[]),...(s.harem.encounter?[s.harem.encounter.id]:[])]);
 const records=Array.from({length:3},(_,i)=>{
  let roll=random()*pool.reduce((n,p)=>n+p.weight,0),index=pool.findIndex(p=>(roll-=p.weight)<0);if(index<0)index=pool.length-1;
  const [{event}]=pool.splice(index,1),seed=Math.floor(random()*4294967296);
  const record={id:`tour-${trip.id}-${i+1}`,type:event.id,seed,status:'pending',choiceId:null,result:null};
  if(event.id==='bereaved'){const available=ordinary.filter(p=>!used.has(p.id));if(available.length){record.personId=available[seed%available.length].id;used.add(record.personId);}}
  return record;
 });
 if(!s.travel.easterEggs.xiaYuheSeen&&homeProvinces.has(trip.provinceId)&&random()<XIA_YUHE_CHANCE){
  const available=ordinary.filter(p=>!used.has(p.id));if(available.length){const seed=Math.floor(random()*4294967296);records[2]={id:`tour-${trip.id}-3`,type:'xia-yuhe',seed,status:'pending',choiceId:null,result:null,personId:available[seed%available.length].id};s.travel.easterEggs.xiaYuheSeen=true;}
 }
 return records;
}
export function nextTourEvent(s){return s.travel?.pending?.kind==='tour'?s.travel.pending.encounters?.find(e=>e.status==='pending')??null:null;}
export function tourEventDefinition(event){return event?byId.get(event.type):null;}
export function eventCompanion(s,event){
 const base=ordinary.find(p=>p.id===event.personId);if(!base)return null;
 const p=s.domestic.provinces.find(p=>p.id===s.travel.pending?.provinceId),seed=event.seed;
 const names=['沈','林','顾','苏','陆','柳','江','许'],given=['晚晴','清禾','知微','若兰','锦书','云舒','念慈','映秋'];
 const rare=event.type==='xia-yuhe';
 return ensurePortrait({...structuredClone(base),name:rare?'夏雨荷':names[seed%8]+given[Math.floor(seed/8)%8],age:rare?22:18+seed%7,appearance:rare?98:68+seed%18,experience:rare?25:0,ability:rare?110:35+seed%21,randomBeauty:true,randomPortraitAsset:RANDOM_PORTRAITS[seed%RANDOM_PORTRAITS.length],rank:null,inColdPalace:false,cityId:p?.id?.endsWith('-core')?'guannei':p?.id??'guannei',specialty:rare?'诗书、琴艺与荷花丹青':'刺绣与诗书',personality:rare?'温婉聪慧':'温婉坚韧',biography:rare?'大明湖畔题诗绘荷的成年女子，与巡游中的皇帝相识，自愿随驾入宫。取意《还珠格格》的虚构彩蛋人物；外表、经验与能力均为游戏设计。':`巡游${p?.name??'地方'}时相逢的成年民女。父亲病故后因家贫无力安葬，在御前得到救助；父事料理妥当后，自愿随驾入宫。此为原创巡游人物。`,travelOrigin:{eventId:event.id,turn:s.turn,provinceId:p?.id??'guannei',consented:true,...(rare?{easterEgg:'xia-yuhe'}:{})}},`tour:${event.id}`);
}
export function tourRiskChance(s,event,choice){
 const p=s.domestic.provinces.find(p=>p.id===s.travel.pending.provinceId);
 if(choice.risk==='martial')return bounded(.25+s.stats.martial/700,.25,.92);
 if(choice.risk==='guards')return bounded(.25+(s.domestic.centralArmy.soldiers>0?s.domestic.centralArmy.training*.004:0)+p.welfare.security*.003,.25,.95);
 if(choice.risk==='investigation')return bounded(.45+s.stats.wisdom/1200,.45,.9);
 return 1;
}
const statNames={health:'健康',life:'寿元',happiness:'快乐',wisdom:'智慧',martial:'武术',talent:'才艺',charm:'魅力'};
const welfareNames={loyalty:'民忠',security:'治安',stability:'安定',activity:'营业',fitness:'体能',defense:'防御'};
export function effectSummary(e){
 const signed=n=>(n>0?'+':'')+n.toLocaleString('zh-CN'),parts=[];
 if(e.money)parts.push('国库'+signed(e.money)+'两');
 if(e.prestige)parts.push('威望'+signed(e.prestige));
 for(const [key,n]of Object.entries(e.stats??{}))parts.push(statNames[key]+signed(n));
 for(const [key,n]of Object.entries(e.local??{}))parts.push('当地'+welfareNames[key]+signed(n));
 for(const [key,label]of Object.entries({grain:'当地存粮',cash:'地方府库',living:'当地生活水平',productivity:'当地各业生产率',training:'中央训练',population:'当地人口'}))if(e[key])parts.push(label+signed(e[key]));
 if(e.admit)parts.push('迎入后宫（自愿）');if(e.justice)parts.push('记入刑部案卷');return parts.join('，');
}
export function tourChoiceBlock(s,event,choice){
 const country=s.domestic.countries.find(c=>c.id===s.domestic.playerCountryId),p=s.domestic.provinces.find(p=>p.id===s.travel.pending.provinceId);
 if(s.stats.life===0)return '寿元已尽';
 if(p.countryId!==s.domestic.playerCountryId)return '当地已失去统治，请结束行程';
 if(country.fiscal.treasury<Math.max(0,-(choice.effects.money??0)))return '国库不足';
 if(p.welfare.grainReserve<Math.max(0,-(choice.effects.grain??0)))return '当地存粮不足';
 if(choice.effects.admit){if(!event.personId)return '暂无可相逢人物';if(s.harem.members.some(p=>p.id===event.personId)||s.harem.encounter?.id===event.personId)return '此人已在宫中或候选中';if(s.harem.members.length>=BEAUTIES.length+s.domestic.countries.length)return '宫册已满';}
 return '';
}
function applyEffects(s,e,event,lines,tag){
 const d=s.domestic,c=d.countries.find(c=>c.id===d.playerCountryId),p=d.provinces.find(p=>p.id===s.travel.pending.provinceId);
 const describe=(label,before,after)=>{if(after!==before)lines.push(`${label}${after-before>0?'+':''}${after-before}`);};
 if(e.money){postTreasury(d,c.id,{turn:s.turn,income:Math.max(0,e.money),expense:Math.max(0,-e.money),reason:`巡游·${byId.get(event.type).title}`,key:`${event.id}:${tag}`});s.stats.treasury=c.fiscal.treasury;lines.push(`国库${e.money>0?'+':''}${e.money}两`);}
 for(const [key,n]of Object.entries(e.stats??{})){const before=s.stats[key],max=key==='life'?s.stats.lifeLimit:['happiness','health'].includes(key)?100:500;s.stats[key]=bounded(before+n,0,max);describe(statNames[key],before,s.stats[key]);}
 if(e.prestige){const before=c.prestige;c.prestige=bounded(c.prestige+e.prestige,0,500);s.stats.prestige=c.prestige;describe('威望',before,c.prestige);}
 for(const [key,n]of Object.entries(e.local??{})){const before=p.welfare[key];changeWelfare(p,key,n);if(key==='defense'&&p.buildingEffects)p.buildingEffects.baselineDefense=bounded(p.buildingEffects.baselineDefense+p.welfare[key]-before,0,100);describe(p.name+welfareNames[key],before,p.welfare[key]);}
 for(const [key,obj,field,max]of [['grain',p.welfare,'grainReserve',1e12],['cash',p.status,'cash',1e12],['living',p.status,'livingStandard',100],['training',d.centralArmy,'training',100]])if(e[key]){const before=obj[field];obj[field]=bounded(before+e[key],key==='cash'?-1e12:0,max);describe({grain:'当地存粮',cash:'地方府库',living:'生活水平',training:'中央训练'}[key],before,obj[field]);}
 if(e.productivity){for(const [key,v]of Object.entries(p.economy)){const before=v.productivity;v.productivity=bounded(v.productivity+e.productivity,0,100);describe(`${p.name}${key}生产率`,before,v.productivity);}}
 if(e.population){p.population.total+=e.population;p.population.professions.farmers+=Math.floor(e.population*.6);p.population.professions.workers+=Math.floor(e.population*.2);lines.push(`当地人口+${e.population}`);}
 if(e.admit){const person=eventCompanion(s,event);person.rank=entryConsortRank(s);s.harem.members.push(person);s.harem.seen=[...new Set([...(s.harem.seen??[]),person.id])];lines.push(`${person.name}（${person.age}岁）自愿入宫，已录入后宫名册`);}
 if(e.justice){d.justice.history.unshift(`第${s.turn}旬：巡游${p.name}，处理「${byId.get(event.type).title}」，御前指示及结果见出行纪事。`);d.justice.history=d.justice.history.slice(0,100);}
}
export function resolveTourEvent(state,eventId,choiceId){
 const s=structuredClone(state),trip=s.travel?.pending,event=nextTourEvent(s);
 if(!trip||trip.startedTurn===undefined||!event||event.id!==eventId)throw Error('事件已处理或尚未轮到，请勿重复颁旨');
 const def=byId.get(event.type),choice=def.choices.find(c=>c.id===choiceId);if(!choice)throw Error('事件处置无效');
 const blocked=tourChoiceBlock(s,event,choice);if(blocked)throw Error(blocked);
 const lines=[];applyEffects(s,choice.effects,event,lines,'base');
 let outcome='';if(choice.risk){const success=portraitRandom(event.seed)()<tourRiskChance(s,event,choice);applyEffects(s,success?choice.success:choice.failure,event,lines,'outcome');outcome=success?'处置成功。':'事有波折。';if(!success&&event.type==='assassin'&&(s.stats.health===0||s.stats.life===0)){endReign(s,'遇刺','巡游遇刺，护驾或迎击失败，伤势致命。');outcome+='遇刺伤重，本朝终结。';}}
 const message=`${def.title}：${choice.label}。${outcome}${lines.join('；')||'各项属性已达上限，旨意已记入巡游纪事'}。`;
 event.status='resolved';event.choiceId=choice.id;event.result=message;
 s.harem.history.unshift(`第${s.turn}旬：${message}`);s.harem.history=s.harem.history.slice(0,30);
 settleProgress(s);settleReignResult(s);return {state:s,message};
}
export function validateTourEvents(s){
 const fail=()=>{throw Error('巡游事件存档无效');};
 for(const trip of [...(s.travel?.pending?[s.travel.pending]:[]),...(s.travel?.history??[])]){
  const list=trip.encounters;if(!Array.isArray(list)||list.length>3||new Set(list.map(e=>e?.id)).size!==list.length||new Set(list.map(e=>e?.type)).size!==list.length)fail();
  if((trip.kind!=='tour'||trip.startedTurn===undefined)&&list.length)fail();let unresolved=false;
  for(const [i,e]of list.entries()){
   const def=byId.get(e?.type);if(!def||e.id!==`tour-${trip.id}-${i+1}`||!Number.isSafeInteger(e.seed)||e.seed<0||e.seed>4294967295||!['pending','resolved'].includes(e.status))fail();
   if(e.personId!==undefined&&(!['bereaved','xia-yuhe'].includes(e.type)||!ordinary.some(p=>p.id===e.personId)))fail();
   if(e.type==='xia-yuhe'&&!e.personId)fail();
   if(e.status==='pending'){unresolved=true;if(e.choiceId!==null||e.result!==null)fail();}
   else if(unresolved||!def.choices.some(c=>c.id===e.choiceId)||typeof e.result!=='string'||!e.result||e.result.length>1000)fail();
  }
 }
 const appearances=[...(s.travel.pending?.encounters??[]),...s.travel.history.flatMap(t=>t.encounters??[])].filter(e=>e.type==='xia-yuhe');
 if(appearances.length>1||appearances.length&&!s.travel.easterEggs.xiaYuheSeen)fail();
 const companions=s.harem.members.filter(p=>p.travelOrigin?.easterEgg==='xia-yuhe');
 if(companions.length>1||companions.length&&!s.travel.easterEggs.xiaYuheSeen||companions.some(p=>p.name!=='夏雨荷'||!p.randomBeauty))fail();
}
