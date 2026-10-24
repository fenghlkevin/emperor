import {createLandmarkTutorial,landmarkTutorialGuide} from './card-battle-landmark-tutorial.mjs';
import {createSecretTutorial,secretTutorialGuide} from './card-battle-secret-tutorial.mjs';
import {createWeaponTutorial,weaponTutorialGuide} from './card-battle-weapon-tutorial.mjs';
import {newGame,validateSave} from './game.mjs';
import {beginWar,generals,borderingCountries,advanceWar} from './war.mjs';
import {attachCards,legalCardActions} from './card-battle.mjs';
export const TUTORIAL_VERSION=1;
export const TUTORIAL_RULES=[
 '演练完全隔离：兵员、装备、训练、将领来自新建演练世界，不动用正式朝廷；不写存档、不结算正式军务。',
 '教学预设：固定起手与换牌首张；前锋预先强化至5攻10命，靶护卫预先强化至10命并在场，靶主将预设无甲5命。所有强化均在卡片详情中可查。',
 '训练对手只结束回合，攻击时的反击仍由正式引擎计算。演练不是随机实战或胜率依据；正式牌局不使用教学预设。',
 '军令支付费用；攻击不花军令，但普通部队需等下个己方回合。突袭登场可攻击部队，本回合不能攻击主将。',
 '护卫存活时先攻击护卫。5攻打10命，目标剩5命；对方3攻同时反击，己方10命剩7命。攻击不会因受伤而降低。',
 '主将技每回合一次，消耗2军令。临时强化在回合结束到期；护甲盾挡一次伤害，冻结、沉默可在规则说明与交战记录中核查。',
 '每个己方回合军令上限增加1，最多10；战场最多7支部队，手牌最多10张。护甲先吸收主将伤害；护甲盾抵挡一次伤害后移除。',
 '冻结阻止攻击，到该部队所属回合结束时解除；沉默移除关键词与可移除的强化，并解除冻结。需要目标的计策必须点选合法目标。',
 '编入人数和来源训练在开战时锁定为卡片数值，卡片详情显示训练与强化分项。本例5攻10命属于明示教学强化，不代表普通前锋牌数值。'
];
function setup(){
 const s=newGame('军阵教学');s.scene='court';const g=generals(s.domestic),game=beginWar(s,{id:s.domestic.war.nextId,kitVersion:1,battleMode:'cards',kind:'war',targetId:borderingCountries(s.domestic)[0].id,generalId:g[0].id,commanderSquad:{kind:'cavalry',count:100},squads:[{kind:'spears',count:200,generalId:g[3].id},{kind:'archers',count:100,generalId:g[2].id},{kind:'heavy-cavalry',count:80,generalId:g[5].id},{kind:'cavalry',count:160,generalId:g[4].id},{kind:'infantry',count:300,generalId:g[1].id}],cardTactics:{version:1,counts:{precision:2,fire:2,fortify:2,assault:2,supply:2,brace:2}}});
 const b=game.domestic.war.battle;attachCards(b,{first:'home',seed:310031,seeds:{home:71129,enemy:88169}});b.targetName='教学靶阵';
 const c=b.cards,p=c.players.home,e=c.players.enemy,find=(side,id)=>Object.values(c.catalog).find(x=>x.side===side&&x.definitionId===id)?.id;
 const ids={front:find('home','vanguard'),swap:find('home','fortify'),assault:find('home','assault'),rush:find('home','cavalry_line'),guard:find('enemy','infantry_line')};if(Object.values(ids).some(x=>!x))throw Error('教学缺少来自正式军阵的卡片');
 const held=[ids.front,ids.assault,ids.swap],pool=[...p.hand,...p.deck];p.hand=held;p.deck=[ids.rush,...pool.filter(id=>!held.includes(id)&&id!==ids.rush)];
 e.hand=e.hand.filter(id=>id!==ids.guard);e.deck=e.deck.filter(id=>id!==ids.guard);e.board.push(ids.guard);
 const front=c.catalog[ids.front],guard=c.catalog[ids.guard];front.buffAttack=5-front.printedAttack;front.attack=5;front.buffHealth=10-front.printedHp;front.hp=front.maxHp=10;
 guard.buffHealth=10-guard.printedHp;guard.hp=guard.maxHp=10;guard.played=++c.sequence;e.armor=0;e.hero=5;e.heroDamage=25;const leader=b.units.find(u=>u.side==='enemy'&&u.commander);leader.dead=Math.ceil(leader.initial*25/60);leader.count=leader.initial-leader.dead;
 b.log=['隔离教学：固定起手与换牌首张，前锋5攻10命、靶护卫10命、靶主将5命均为明示预设；训练对手只结束回合。'];validateSave(game);return {game,ids};
}
export function createCardTutorial({lesson}={}){if(lesson==='landmarks')return createLandmarkTutorial();if(lesson==='secrets')return createSecretTutorial();if(lesson==='weapons')return createWeaponTutorial();const {game,ids}=setup();return {version:1,step:0,status:'playing',ids,origin:structuredClone(game),game};}
export function skipCardTutorial(course){return {...course,status:course.status==='complete'?'complete':'skipped'};}
export function restartCardTutorial(course){return {...course,step:0,status:'playing',game:structuredClone(course.origin)};}
const titles=['替换起手','花军令部署','等待召唤限制','攻击护卫与反击','发动主将技能','进入下一回合','部署突袭部队','突袭合法目标','准备强化回合','施放临时强化','观察回合到期','清除护卫','准备攻击主将','击败教学主将'];
export function tutorialGuide(course){
 if(course.lesson==='landmarks')return landmarkTutorialGuide(course);
 if(course.lesson==='secrets')return secretTutorialGuide(course);
 if(course.lesson==='weapons')return weaponTutorialGuide(course);
 const b=course.game.domestic.war.battle,c=b.cards,x=course.ids,skill=c.players.home.skill;
 const power={type:'power',...(skill.kind==='intelligence'?{}:{target:skill.kind==='command'?x.front:'hero'})};
 const actions=[{type:'mulligan',ids:[x.swap]},{type:'play',id:x.front},{type:'end'},{type:'attack',id:x.front,target:x.guard},power,{type:'end'},{type:'play',id:x.rush},{type:'attack',id:x.rush,target:x.guard},{type:'end'},{type:'play',id:x.assault,target:x.front},{type:'end'},{type:'attack',id:x.front,target:x.guard},{type:'end'},{type:'attack',id:x.front,target:'hero'}];
 const texts=[
 '选择整队备战（2费）作为换牌，再点击开始交战。前锋与奋勇进击保留。换入的轻骑兵是明示教学预设。',
 '点击手牌中的前锋小队，支付1军令部署。5攻10命是本场明示强化；正式前锋仍是原卡表数值。',
 '普通前锋刚上场不能攻击。可点击它查看原因，再结束回合，等下个己方回合恢复攻击。',
 '先点己方前锋，再点敌方护卫：5攻打10命，护卫剩5命，同时3点反击使前锋剩7命。护卫存在时不能绕过攻击主将。',
 `点击主将技${skill.name}，支付2军令${skill.kind==='intelligence'?'抽牌并承受技能自损':skill.kind==='command'?'，再选受伤前锋恢复2命':'，再选敌方主将造成1点伤害'}。按实际记录核对费用和结果。`,
 '本回合军令已用完。结束回合，等下一回合获得3军令，再部署轻骑兵。',
 '点击轻骑兵主力，支付3军令。突袭允许本回合立即攻击部队，仍不能攻击主将。',
 '选择刚部署的轻骑兵，再选敌方护卫。对方会同时反击，本例骑兵会阵亡；护卫仍须优先处理。',
 '结束回合，等待前锋恢复攻击与新军令，再练习需要目标的计策。',
 '点击奋勇进击，再选择己方前锋：本回合攻击5→8。无效目标或取消都不支付费用。',
 '现在结束回合，观察前锋临时攻击8→5；可打开交战记录查看到期事件与原因。',
 '点击前锋，再攻击残存护卫。部队生命归零即阵亡，受到的实际反击不会因敌方阵亡而取消。',
 '前锋本回合已经攻击。结束回合恢复后，准备攻击敌方教学主将。',
 '护卫已清除。点击前锋，再选敌方主将，完成这场隔离教学对局。'
 ];
 if(course.status==='complete')return {index:14,total:14,title:'教学对局完成',text:'已实际完成全部教学动作，可查阅记录或返回军务。',action:null};
 if(c.turn==='enemy')return {index:course.step,total:14,title:'训练对手回合',text:'训练对手按脚本结束回合，实际引擎照常处理抽牌、军令与状态到期。',action:{type:'end'},opponent:true};
 return {index:course.step,total:14,title:titles[course.step],text:texts[course.step],action:actions[course.step],opponent:false};
}
export function advanceCardTutorial(course,action){
 if(course.version!==1||course.status!=='playing')throw Error('教学已经结束，请重来或返回军务');const guide=tutorialGuide(course),expected=guide.action;
 const same=expected&&action.type===expected.type&&action.id===expected.id&&action.target===expected.target&&(action.type!=='mulligan'||Array.isArray(action.ids)&&JSON.stringify(action.ids)===JSON.stringify(expected.ids));
 if(!same)throw Error('当前教学：'+guide.text);
 const b=course.game.domestic.war.battle;if(action.type!=='mulligan'&&!legalCardActions(b).some(a=>a.type===action.type&&a.id===action.id&&a.target===action.target))throw Error('此教学动作尚未满足正式引擎的军令或目标要求');
 const next={...course,game:advanceWar(course.game,action),step:course.step+(guide.opponent?0:1)};if(next.step===guide.total){if(next.game.domestic.war.battle.result!=='victory')throw Error('教学尚未完成真实胜负结算');next.status='complete';}validateSave(next.game);return next;
}
