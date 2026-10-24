import {newGame,validateSave} from './game.mjs';
import {beginWar,generals,borderingCountries} from './war.mjs';
import {attachCards} from './card-battle.mjs';
export const SECRET_TUTORIAL_RULES=[
 '奥秘演练完全隔离：主将、兵员、训练、装备与人物来自新建教学世界的真实来源，不占正式朝廷资源、不写进度、不结算正式军务。',
 '明示教学预设：固定起手料敌设伏、御前警戒、精准射击；两侧各预置两支无护卫演练部队。我方试探队4攻2命、主力6攻6命，敌方试探队2攻2命、主力3攻6命；靶主将8命1甲，我方30命0甲。',
 '明示训练脚本：敌军预设3军令上限，首个敌方回合正常增长到4军令，依次支付2费布置警戒与设伏，随后结束。最后一次训练回合用两队依次攻击。其余回合只结束；不把教学脚本或预设牌序用于实战或平衡样本。',
 '奥秘每张2费，替代普通计策名额，整副仍30张；来自已经部署的主将亲卫军阵，不额外生成兵员、人物、装备或训练。最多两个活动奥秘，同名不能同时布置；触发离场后才能再布置另一张同名副本。',
 '自己的奥秘可读名称与来源，对方槽位只显示匿名封印。对手合法攻击本方主将时，按布置顺序先揭示再结算；计策和主将技不会触发这两种攻击奥秘，不能据此断言没有奥秘。',
 '警戒先加3防线护甲；设伏对来袭部队造成3伤。若部队被击杀，原本主将攻击中止，并重新检查后续奥秘：已经失去攻击者时，后续警戒留场保密，不额外触发。',
 '存活的高命部队或护甲盾可承受设伏；持武器主将只触发警戒，不触发限定部队的设伏。护卫仍先限制合法目标；冻结阻止攻击，沉默不能把奥秘区的军令当部队移除。',
 '先警戒再设伏：警戒护甲已经增加，来袭者即使随后阵亡也不撤销护甲；先设伏击杀来袭者：警戒保持待命，下一支部队再攻击才揭示。真实损伤与死亡只由正式引擎结算一次。'
];
export function createSecretTutorial(){
 const s=newGame('奥秘教学'),g=generals(s.domestic),game=beginWar(s,{id:s.domestic.war.nextId,kitVersion:1,battleMode:'cards',kind:'war',targetId:borderingCountries(s.domestic)[0].id,generalId:g[0].id,commanderSquad:{kind:'cavalry',count:100},squads:[{kind:'infantry',count:200,generalId:g[1].id},{kind:'spears',count:100,generalId:g[2].id}],cardSecrets:{version:1,counts:{secret_watch:1,secret_ambush:1}},cardTactics:{version:1,counts:{precision:2,fire:2,execute:2,arrows:2,barrage:1,brace:1,assault:1,fortify:1,pin:1,dispel:1,heal:1,supply:1}}});
 const b=game.domestic.war.battle;attachCards(b,{first:'home',seed:6700417,seeds:{home:324161,enemy:15485863}});b.targetName='奥秘教学靶阵';const c=b.cards,p=c.players.home,e=c.players.enemy,find=(side,definitionId)=>Object.values(c.catalog).find(x=>x.side===side&&x.definitionId===definitionId)?.id,ids={watch:find('home','secret_watch'),ambush:find('home','secret_ambush'),precision:find('home','precision'),probe:find('home','vanguard'),main:find('home','infantry_line'),enemyWatch:find('enemy','secret_watch'),enemyAmbush:find('enemy','secret_ambush'),enemyProbe:find('enemy','vanguard'),enemyMain:find('enemy','infantry_line')};if(Object.values(ids).some(id=>!id))throw Error('奥秘教学缺少真实军阵卡片');
 function hand(side,held){const p=c.players[side],pool=[...p.hand,...p.deck];p.hand=held;p.deck=pool.filter(id=>!held.includes(id));}
 hand('home',[ids.ambush,ids.watch,ids.precision]);hand('enemy',[ids.enemyWatch,ids.enemyAmbush]);
 function preset(side,id,attack,hp){const p=c.players[side],x=c.catalog[id];for(const z of ['hand','deck'])p[z]=p[z].filter(v=>v!==id);p.board.push(id);x.played=++c.sequence;x.tags=[];x.buffAttack=attack-x.printedAttack;x.attack=attack;x.buffHealth=hp-x.printedHp;x.hp=x.maxHp=hp;}
 preset('home',ids.probe,4,2);preset('home',ids.main,6,6);preset('enemy',ids.enemyProbe,2,2);preset('enemy',ids.enemyMain,3,6);e.maxMana=3;p.armor=0;e.hero=8;e.heroDamage=22;const leader=b.units.find(u=>u.side==='enemy'&&u.commander);leader.dead=Math.ceil(leader.initial*22/60);leader.count=leader.initial-leader.dead;
 b.log=['隔离奥秘教学：固定起手与四支无护卫预置靶队，靶主将8命1甲、敌方起始3军令上限均为明示预设；训练脚本按正式动作布置和攻击。'];validateSave(game);return {version:1,lesson:'secrets',step:0,status:'playing',ids,origin:structuredClone(game),game};
}
export function secretTutorialGuide(course){
 const x=course.ids,c=course.game.domestic.war.battle.cards,total=11;
 if(course.status==='complete')return {index:total,total,title:'奥秘演练完成',text:'11步操作与训练对手的真实触发均已完成，可核对逐张揭示、攻击中止和实际记录。',action:null};
 if(c.turn==='enemy'){
  let action={type:'end'},text='训练对手结束回合，军令、抽牌与就绪仍由正式引擎计算。';
  if(course.step===2){const id=[x.enemyWatch,x.enemyAmbush].find(id=>c.catalog[id].armedOrder===undefined);if(id){action={type:'play',id};text='训练对手按明示脚本依次付费布置两张奥秘，活动槽位保持匿名。';}}
  if(course.step===10){const id=[x.enemyProbe,x.enemyMain].find(id=>c.players.enemy.board.includes(id)&&c.catalog[id].ready);if(id){action={type:'attack',id,target:'hero'};text='训练对手依次发起真实攻击，观察设伏击杀后警戒留场，再由第二支部队触发警戒。';}}
  return {index:course.step,total,title:'训练对手回合',text,action,opponent:true};
 }
 const titles=['保留奥秘演练手牌','等待布置与军令','计策绕过攻击奥秘','逐张揭示与攻击中止','等待主力就绪','按触发后的护甲攻击','准备自己的双奥秘','先布置料敌设伏','再布置御前警戒','观察两次真实来袭','完成真实胜利'];
 const texts=[
 '固定起手为料敌设伏、御前警戒、精准射击；四支演练队与靶主将数值见明示预设。全部保留，开始交战。',
 '当前1军令，不够2费奥秘。结束回合；训练对手会真实支付军令布置两张，不能从匿名封印提前查看身份。',
 '先用2费精准射击点敌方主将。3伤先消耗1甲，再使8命降到6；攻击触发型奥秘仍匿名留场。计策与主将技可绕过这两种触发条件。',
 '选择我方4攻2命试探队，攻击敌方主将。先警戒加3甲，再设伏造成3伤击杀试探队；攻击在冲锋前中止，敌主将仍6命3甲。',
 '试探队已阵亡，不能重试本次攻击。结束回合，准备使用真正存活的6攻6命主力。',
 '用我方主力攻击敌方主将。奥秘已按真实顺序结算；6伤先扣3甲，主将6→3命。不会把先前因设伏中止的4伤补回来。',
 '结束回合，等下个己方回合获得4军令，再按顺序布置两张奥秘。',
 '花2军令布置料敌设伏，可点击或拖到己方奥秘区。它关联真实亲卫军阵，不新增兵员或装备。',
 '再花2军令布置御前警戒。两个槽位保留布置顺序，己方可查来源；正式对手只能看到封印。',
 '结束回合，训练对手先用2命试探队攻击：设伏击杀它，后续警戒留场。随后3攻主力来袭，警戒才揭示，加3甲并承受真实攻击。',
 '敌方奥秘已处理。用我方6攻主力攻击剩3命的靶主将，完成真正胜利；打开记录核对先后顺序和一次结算。'
 ];
 const actions=[{type:'mulligan',ids:[]},{type:'end'},{type:'play',id:x.precision,target:'hero'},{type:'attack',id:x.probe,target:'hero'},{type:'end'},{type:'attack',id:x.main,target:'hero'},{type:'end'},{type:'play',id:x.ambush},{type:'play',id:x.watch},{type:'end'},{type:'attack',id:x.main,target:'hero'}];
 return {index:course.step,total,title:titles[course.step],text:texts[course.step],action:actions[course.step],opponent:false};
}
