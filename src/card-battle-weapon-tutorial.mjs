import {newGame,validateSave} from './game.mjs';
import {beginWar,generals,borderingCountries} from './war.mjs';
import {attachCards} from './card-battle.mjs';
export const WEAPON_TUTORIAL_RULES=[
 '武器演练完全隔离：亲卫、部队、人物及两套备用装来自新建教学世界的真实军籍，不占用正式朝廷资源，不写存档、不结算正式军务。',
 '明示教学预设：固定起手备用刀盾、备用长枪、整军鼓舞；敌方刀盾护卫预设2命、保持3攻，靶主将无甲6命。训练对手只结束回合。正式牌局不使用教学预设，不强制抽武器。',
 '备用刀盾2费、2攻2耐；备用长枪3费、3攻2耐。各自额外绑定主将驻地1人份完整套装，不增加士兵；30张牌中取代计策名额，不占7支部队场位。',
 '主将每回合只能主动攻击一次，装备当回合可攻击。护卫必须先处理，潜行不能被选；敌部队即使阵亡仍同时反击，主将护甲先吸收伤害。',
 '有效攻击消耗1耐久，护甲盾挡伤仍耗耐久；取消和非法目标不耗。更换武器毁损旧备用套装，也不会刷新已经使用的主将攻击。',
 '治疗恢复主将生命但不会复活已经阵亡的亲卫兵员；武器换血仍有真实伤亡和失去主将的风险。',
 '耐久归零、替换及主将被击败时的弃装按既定规则核销实际备用套装；未抽到、未使用或爆牌不凭空损坏实物，未坏装备战后回库。',
 '本课只演练正式规则，固定牌序与靶阵不是平衡样本。实战可用护卫、高攻反击、潜行、护甲与军令压力反制，不能假定总会抽到武器。'
];
export function createWeaponTutorial(){
 const s=newGame('武器教学'),g=generals(s.domestic),game=beginWar(s,{id:s.domestic.war.nextId,kitVersion:1,battleMode:'cards',kind:'war',targetId:borderingCountries(s.domestic)[0].id,generalId:g[0].id,commanderSquad:{kind:'cavalry',count:100},squads:[{kind:'infantry',count:200,generalId:g[1].id},{kind:'spears',count:100,generalId:g[2].id}],cardWeapons:{version:1,counts:{arsenal_blade:1,arsenal_spear:1}},cardTactics:{version:1,counts:{precision:2,fire:2,execute:2,arrows:2,barrage:1,brace:1,assault:1,fortify:1,pin:1,dispel:1,heal:1,supply:1}}});
 const b=game.domestic.war.battle;attachCards(b,{first:'home',seed:470041,seeds:{home:81179,enemy:90149}});b.targetName='武器教学靶阵';const c=b.cards,p=c.players.home,e=c.players.enemy,find=(side,definitionId)=>Object.values(c.catalog).find(x=>x.side===side&&x.definitionId===definitionId)?.id,ids={blade:find('home','arsenal_blade'),spear:find('home','arsenal_spear'),heal:find('home','heal'),guard:find('enemy','infantry_line')};if(Object.values(ids).some(id=>!id))throw Error('教学缺少实际来源武器或卡片');
 const held=[ids.blade,ids.spear,ids.heal],pool=[...p.hand,...p.deck];p.hand=held;p.deck=pool.filter(id=>!held.includes(id));for(const zone of ['hand','deck'])e[zone]=e[zone].filter(id=>id!==ids.guard);e.board.push(ids.guard);const guard=c.catalog[ids.guard];guard.buffHealth=2-guard.printedHp;guard.hp=guard.maxHp=2;guard.played=++c.sequence;e.armor=0;e.hero=6;e.heroDamage=24;const leader=b.units.find(u=>u.side==='enemy'&&u.commander);leader.dead=Math.ceil(leader.initial*24/60);leader.count=leader.initial-leader.dead;
 b.log=['隔离武器教学：固定起手，刀盾护卫2命、靶主将无甲6命为明示预设；训练对手只结束回合。'];validateSave(game);return {version:1,lesson:'weapons',step:0,status:'playing',ids,origin:structuredClone(game),game};
}
export function weaponTutorialGuide(course){
 const x=course.ids,c=course.game.domestic.war.battle.cards,titles=['保留真实备用武器','等待2军令','装备备用刀盾','等待攻击与换装时机','先解护卫并承受反击','换装不会刷新攻击','等待下一回合','治疗不复活亲卫','长枪攻击主将','等待最后一击','耐久耗尽与胜利'],texts=[
 '本课固定起手已明确标示。保留备用刀盾、备用长枪和整军鼓舞，直接开始交战；正式牌局不能保证抽到武器。',
 '当前只有1军令，刀盾需2费。结束回合，训练对手结束后正常获得2军令。',
 '点击备用刀盾或拖到己方主将／装备槽，支付2军令。装备槽显示2攻2耐，不占部队场位，不会再扣一遍实物。',
 '本回合装备后已经可以攻击；本课先结束回合，等3军令，在一次攻击后演练同回合更换武器。',
 '点己方主将，再选敌方护卫，或直接拖拽主将到护卫：2攻打2命，仍受到3点反击，主将30→27，刀盾2→1耐。不能绕过护卫打主将。',
 '本回合主将已经攻击。现在花3军令换备用长枪；旧刀盾剩1耐仍因替换而毁损，长枪2耐，但不能再攻击。',
 '更换武器不刷新攻击次数。结束回合，等下一回合恢复主将攻击与4军令。',
 '花2军令施放整军鼓舞，主将27→30。已阵亡亲卫不会复活，治疗不能免除先前换血造成的真实伤亡。',
 '护卫已清除。点主将再点敌主将，或拖拽过去：长枪造成3伤害，靶主将6→3，耐久2→1。防守主将不会因装备武器自动反击。',
 '主将本回合已攻击。结束回合恢复攻击次数；留意装备耐久仍为1，不会随回合自动补满。',
 '主将再次攻击敌主将，造成最后3点实际伤害并耗尽长枪耐久。查看交战记录：刀盾因替换毁损，长枪因耗尽毁损。'
 ],actions=[{type:'mulligan',ids:[]},{type:'end'},{type:'play',id:x.blade},{type:'end'},{type:'hero-attack',target:x.guard},{type:'play',id:x.spear},{type:'end'},{type:'play',id:x.heal},{type:'hero-attack',target:'hero'},{type:'end'},{type:'hero-attack',target:'hero'}];
 if(course.status==='complete')return {index:11,total:11,title:'武器演练完成',text:'11步武器操作已由正式引擎实际完成，可查阅耐久与来源记录。',action:null};
 if(c.turn==='enemy')return {index:course.step,total:11,title:'训练对手回合',text:'训练对手只结束回合；抽牌、军令、攻击刷新仍由正式引擎计算。',action:{type:'end'},opponent:true};
 return {index:course.step,total:11,title:titles[course.step],text:texts[course.step],action:actions[course.step],opponent:false};
}
