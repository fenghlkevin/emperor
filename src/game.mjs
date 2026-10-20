import {settleBeautyTributes} from './beauty-tributes.mjs';
import {settleEspionage,validateEspionage} from './espionage.mjs';
import {PERIOD_NAMES} from './calendar.mjs';
export {dateLabel} from './calendar.mjs';
import {REST_LIFE_COST,EXHAUSTION_LIFE_COST} from './balance-rules.mjs';
import {initializeEndings,settleEndings,validateEndings} from './endings.mjs';
import {initializeAlchemy,validateAlchemy,settleAlchemy,alchemyBlock} from './alchemy.mjs';
import {validateHunting} from './hunting.mjs';
import {initializeTravel,validateTravel} from './travel.mjs';
import {initializeStrategy,settleStrategy,validateStrategy} from './foreign-strategy.mjs';
import {initializeDynasty,settleDynasty,validateDynasty} from './dynasty.mjs';
import {initializeProgress,settleProgress,validateProgress} from './imperial-progress.mjs';
import {settleReignResult,validateReignResult} from './reign-result.mjs';
import {settleMother} from './mother.mjs';
import {initializeAuspices,settleAuspices,validateAuspices} from './auspices.mjs';
import {initializeEmperor,validateEmperor,courtBlock,settleRoyalFamily} from './emperor.mjs';
import {initializeEnvoyVisit,validateEnvoyVisit} from './envoy-visits.mjs';
import {initializeWar,validateWar} from './war.mjs';
import {settlePersonnel} from './personnel-actions.mjs';
import {settleJustice} from './justice.mjs';
import {CENTRAL_OFFICES} from './personnel.mjs';
import {createDomestic,migrateDomestic,validateDomestic,settleDomestic,countrySummary} from './domestic.mjs';
export const SAVE_KEY = 'emperor.save.v1';
export const buildings = [
 ['court','宣政殿',60,65,17,16,'召见群臣，处理朝政。'], ['view','观景台',82,75,12,18,'登临南门，俯瞰御街，接受百姓朝拜。'],
 ['alchemy','青炉房',83,32,10,12,'丹药与养生。'], ['theatre','百戏园',61,17,14,18,'观赏百戏，安排宫廷演出。'],
 ['rest','紫宸殿',41,48,16,14,'召见内侍，查阅宫中玉牒。'], ['music','棋琴阁',6,53,20,19,'琴棋与修养。'],
 ['study','御书房',17,29,17,19,'阅读典籍，提升学识。'], ['mother','慈宁宫',30,13,15,19,'拜见太后。'],
 ['liming','礼明殿',64,43,9,12,'接见来京外国使臣，面议两国事务。'],
 ['dragon','金龙殿',6,24,17,15,'天子寝殿，独寝安眠。'], ['harem','后宫',4,2,23,20,'后宫人物与关系。'], ['martial','武道场',35,60,8,9,'习武强身，提升武术。']
].map(([id,name,x,y,w,h,description],i)=>{
 const positions=[[42,39,16,13],[43,61,14,11],[73,30,8,10],[70,23,9,8],[46,15,8,8],[15,63,9,9],[29,26,8,9],[21,22,9,9],[64,43,9,12],[46,31,8,8],[28,10,11,10],[35,60,8,9]];
 [x,y,w,h]=positions[i];return {id,name,x,y,w,h,description};
});
// Court and personnel register share the same central-office definitions.
export const officials=CENTRAL_OFFICES;
export function newGame(name,countryName='大晟') { if(typeof countryName!=='string'||!countryName.trim()||countryName.trim().length>16)throw Error('国号须为1至16字');const result=initializeNewSystems(initializeEmperor({auspices:{lastTurn:1,history:[]},envoyVisit:null,emperorRulesVersion:1,version:2,saveRevision:0,domestic:initializeWar(createDomestic(10000)),name:name.trim().slice(0,16),turn:1,scene:'palace',stats:{treasury:10000,health:100,prestige:50},visits:{},createdAt:new Date().toISOString()}));result.domestic.countries.find(c=>c.id===result.domestic.playerCountryId).name=countryName.trim();result.stats.treasury=countrySummary(result.domestic).country.fiscal.treasury;return result; }
/** 含兼容补值、镜像同步及终评生成；输入边界见 docs/save-compatibility.md。 */
export function validateSave(data) { if (!data || data.version!==2 || typeof data.name!=='string' || !data.name.trim() || data.name.length>16 || !Number.isInteger(data.turn) || data.turn<1 || !['court','palace'].includes(data.scene) || !data.stats || !['treasury','health','prestige'].every(k=>Number.isFinite(data.stats[k])) || !data.visits || typeof data.visits!=='object' || Array.isArray(data.visits)) throw new Error('存档格式不正确或版本不支持');  if(data.eraName!==undefined&&(typeof data.eraName!=='string'||!data.eraName.trim()||data.eraName.length>16))throw Error('存档年号无效');  data={...data,domestic:migrateDomestic(data.domestic,data.turn)};if(data.saveRevision===undefined)data.saveRevision=0;if(!Number.isSafeInteger(data.saveRevision)||data.saveRevision<0)throw Error('存档提交版本无效');initializeWar(data.domestic);initializeStrategy(data.domestic,data.turn);validateStrategy(data.domestic,data.turn);validateWar(data.domestic);validateDomestic(data.domestic,data.turn);validateEspionage(data.domestic,data.turn);initializeEnvoyVisit(data);validateEnvoyVisit(data);data.stats={...data.stats,treasury:countrySummary(data.domestic).country.fiscal.treasury,prestige:countrySummary(data.domestic).country.prestige};validateEmperor(data);validateAlchemy(data);validateHunting(data);validateTravel(data);validateAuspices(data);initializeDynasty(data);validateDynasty(data);initializeEndings(data);validateEndings(data);initializeProgress(data);validateProgress(data);settleReignResult(data);validateReignResult(data);return data; }
/** 原地结算一旬；调用方在候选副本上执行后提交。顺序见 docs/turn-settlement.md。 */
export function advance(state) {
 initializeEmperor(state);
 initializeAuspices(state);
 if(state.stats.life===0)throw Error('寿元已尽，本朝终结');
 if(state.domestic.collapse?.pending)throw Error('京城失守，请先决定迁都或朝廷存亡');
 if(state.domestic.war?.battle)throw Error('请先结束战斗');
 state.turn++;
 settleMother(state);
 state.phase=0;
 state.stats.life=Math.max(0,state.stats.life-1);
 state.harem.streak=0;
 if((state.turn-1)%36===0){
  state.stats.age++;
  for(const p of state.harem.members)p.age++;
  if(state.harem.encounter)state.harem.encounter.age++;
  for(const p of state.harem.children)if(p.birthTurn===undefined&&p.status!=='deceased')p.age++;
 }
 settleRoyalFamily(state);
 settleDynasty(state);
 settleJustice(state.domestic,state.turn);
 settleDomestic(state.domestic,state.turn);
 settlePersonnel(state.domestic,state.turn,Math.random,state.stats);
 settleStrategy(state.domestic,state.turn);
 settleEspionage(state.domestic,state.turn);
 settleEndings(state);
 settleAlchemy(state);
 settleAuspices(state);
 state.stats.prestige=countrySummary(state.domestic).country.prestige;
 state.stats.treasury=countrySummary(state.domestic).country.fiscal.treasury;
 settleBeautyTributes(state);
 settleProgress(state);
 settleReignResult(state);
 return state;
}

export const PHASES=PERIOD_NAMES.map((time,i)=>`${time} · ${['早朝','听政','理政','理政','理政','就寝'][i]}`);
export function phaseLabel(s){return PHASES[s.phase??0];}
export function roomBlock(s,id){
 initializeEmperor(s);
 if(s.stats.life===0)return '寿元已尽，本朝终结';
 if(id==='alchemy'&&alchemyBlock(s))return alchemyBlock(s);
 if(s.stats.energy<=0&&id!=='dragon')return '体力耗尽，请到金龙殿独寝恢复';
 if(s.phase===5&&!['dragon','harem'].includes(id))return '亥时只能独寝安眠或回后宫';
 if(id==='court'&&(s.phase??0)!==0)return '本旬仅早朝阶段可以上朝，退朝后请待下一旬早朝';
 if(s.phase===0&&!['court','dragon','harem'].includes(id))return '卯时请先到宣政殿早朝';
 return id==='court'||id==='liming'?courtBlock(s):'';
}
export function leaveRoom(s){
 initializeEmperor(s);
 if(s.stats.life===0)return s;
 if(s.phase===5){s.scene='palace';return advance(s);}
 s.phase++;s.scene='palace';return s;
}
export function resolveExhaustion(s){
 if(s.stats.energy>0||s.stats.life===0)return false;
 advance(s);s.stats.energy=s.stats.maxEnergy;s.stats.health=Math.min(100,s.stats.health+5);s.scene='palace';s.stats.life=Math.max(0,s.stats.life-EXHAUSTION_LIFE_COST);
 s.harem.history.unshift('体力耗尽晕倒，进入下一回合，体力回满、健康增加5，额外损失30寿元。');
 s.harem.history=s.harem.history.slice(0,30);settleReignResult(s);return true;
}

export function sleepUntilNextTurn(s){
 initializeEmperor(s);
 if(s.stats.life===0)throw Error('寿元已尽，本朝终结');
 if(s.domestic.war?.battle)throw Error('请先完成当前战斗');
 if(s.phase===5)throw Error('已是本回合最后阶段，请独寝安眠');
 const turn=s.turn;
 const before=s.stats.energy,health=s.stats.health,exhausted=before===0;
 s.stats.energy=exhausted?s.stats.maxEnergy:Math.min(s.stats.maxEnergy,before+150);
 s.stats.health=Math.min(100,health+5);s.stats.life=Math.max(0,s.stats.life-(exhausted?EXHAUSTION_LIFE_COST:REST_LIFE_COST));s.harem.streak=0;
 if(s.stats.life===0){settleReignResult(s);return s;}
 advance(s);s.scene='palace';
 s.harem.history.unshift(`第${turn}旬：安寝至明，跳过剩余阶段，体力增加${s.stats.energy-before}，健康增加${s.stats.health-health}。`);
 s.harem.history=s.harem.history.slice(0,30);
 return s;
}

function initializeNewSystems(s){initializeTravel(s);initializeAlchemy(s,{starter:true});initializeStrategy(s.domestic,s.turn);initializeDynasty(s);initializeEndings(s);initializeProgress(s);return s;}
