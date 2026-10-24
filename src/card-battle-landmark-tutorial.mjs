import {newGame,validateSave} from './game.mjs';
import {beginWar,generals,borderingCountries} from './war.mjs';
import {attachCards} from './card-battle.mjs';
export const LANDMARK_TUTORIAL_RULES=[
 '地标演练完全隔离：真实亲卫、部队、人物和兵装来自新建教学世界，不使用正式军务资源，不写存档、不结算正式军务。',
 '明示预设：固定起手整军营地、号令旌台、精准射击；己方前锋预置5攻10命、敌方护卫3攻20命，靶主将无甲5命。训练对手只结束回合。正式牌局不使用预设或强制抽地标。',
 '地标来自实际主将的既有营地与号令位置，不新建建筑、不增加人员、训练、装备、军粮或防御；在30张牌中替代普通计策。',
 '设施与部队共享7格；地标不能攻击，不是普通伤害、冻结、沉默或部队强化的目标。敌方可消灭受益部队、施加攻击压力并利用其场位与冷却限制。',
 '整军营地2费2次，恢复受伤存活友方部队最多3生命。真实阵亡兵员不会复活；治疗不减少已经发生的兵装核销。',
 '号令旌台3费2次，使友方部队本回合攻击+2。效果回合结束到期，不能延续到下一回合；发动不是攻击，不触发攻击奥秘。',
 '部署当回合可发动，不再扣军令；每次耗1次，下一己方回合仍冷却，再下个己方回合可用。非法目标、取消不扣次数。第二次发动后耗尽离场。',
 '撤下设施释放原场位，剩余次数作废，不退军令，不触发部队死亡、遗计或兵装损耗。撤下也不会撤销已生效的临时强化；强化仍按原回合到期。',
 '固定牌序和靶阵只用于操作教学，不作为随机实战或47%至53%平衡样本。武器仍按正式来源独立占装，主将技与地标分别支付和判定合法目标。'
];
export function createLandmarkTutorial(){
 const s=newGame('地标教学'),g=generals(s.domestic),game=beginWar(s,{id:s.domestic.war.nextId,kitVersion:1,battleMode:'cards',kind:'war',targetId:borderingCountries(s.domestic)[0].id,generalId:g[0].id,commanderSquad:{kind:'cavalry',count:100},squads:[{kind:'infantry',count:200,generalId:g[1].id},{kind:'spears',count:100,generalId:g[2].id}],cardLandmarks:{version:1,counts:{field_camp:1,rally_post:1}},cardTactics:{version:1,counts:{precision:2,fire:2,execute:2,arrows:2,barrage:1,brace:1,assault:1,fortify:1,pin:1,dispel:1,heal:1,supply:1}}});
 const b=game.domestic.war.battle;attachCards(b,{first:'home',seed:470041,seeds:{home:81179,enemy:90149}});b.targetName='地标教学靶阵';const c=b.cards,p=c.players.home,e=c.players.enemy,find=(side,def)=>Object.values(c.catalog).find(x=>x.side===side&&x.definitionId===def)?.id,ids={camp:find('home','field_camp'),post:find('home','rally_post'),precision:find('home','precision'),front:find('home','vanguard'),guard:find('enemy','infantry_line')};if(Object.values(ids).some(x=>!x))throw Error('地标教学缺少真实来源卡片');
 const held=[ids.camp,ids.post,ids.precision],pool=[...p.hand,...p.deck];p.hand=held;p.deck=pool.filter(id=>!held.includes(id)&&id!==ids.front);p.board.push(ids.front);for(const z of ['hand','deck'])e[z]=e[z].filter(id=>id!==ids.guard);e.board.push(ids.guard);
 for(const [id,attack,hp]of [[ids.front,5,10],[ids.guard,3,20]]){const x=c.catalog[id];x.buffAttack=attack-x.printedAttack;x.attack=attack;x.buffHealth=hp-x.printedHp;x.hp=x.maxHp=hp;x.played=++c.sequence;}
 e.armor=0;e.hero=5;e.heroDamage=25;const leader=b.units.find(u=>u.side==='enemy'&&u.commander);leader.dead=Math.ceil(leader.initial*25/60);leader.count=leader.initial-leader.dead;b.log=['隔离地标教学：固定起手、己方5攻10命与敌方3攻20命护卫及无甲5命靶主将为明示预设，训练对手只结束回合。'];validateSave(game);return {version:1,lesson:'landmarks',step:0,status:'playing',ids,origin:structuredClone(game),game};
}
export function landmarkTutorialGuide(course){
 const x=course.ids,c=course.game.domestic.war.battle.cards,items=[
 ['保留地标演练手牌','保留整军营地、号令旌台、精准射击。己方5攻10命前锋和敌方3攻20命护卫是本课明示靶阵；正式开局不使用这些预设。',{type:'mulligan',ids:[]}],
 ['等待2军令','营地需要2军令。先结束回合，训练对手只结束回合。',{type:'end'}],
 ['部署整军营地','点击营地或拖到己方战场，付2军令。设施与前锋共用同一七格，剩余2次。',{type:'play',id:x.camp}],
 ['真实交战制造伤口','前锋攻击护卫，护卫20→15命，同时3点反击使前锋10→7命。不能绕过护卫打主将。',{type:'attack',id:x.front,target:x.guard}],
 ['部署回合即可治疗','点击营地，再选受伤前锋，或拖拽过去：7→10命，剩1次。实际阵亡人数不会减少；计数显示冷却2。',{type:'landmark-use',id:x.camp,target:x.front}],
 ['隔回合冷却','结束回合。下一个己方回合仍冷却1，不能立即再次发动。',{type:'end'}],
 ['冷却期间继续交战','营地仍冷却。前锋攻击护卫15→10，同时受到3反击再降至7命。',{type:'attack',id:x.front,target:x.guard}],
 ['等到下一次可用','结束回合，再下个己方回合冷却完成。不会凭空补充已经消耗的次数。',{type:'end'}],
 ['第二次治疗后耗尽','再次用营地治疗前锋7→10。剩余次数归零，设施耗尽离场，腾出原来的一格。',{type:'landmark-use',id:x.camp,target:x.front}],
 ['部署号令旌台','用3军令部署旌台，占用一个共享场位，初始2次。',{type:'play',id:x.post}],
 ['发动临时攻击强化','点击旌台再选前锋，本回合攻击5→7，剩1次进入冷却；这不是攻击，不消耗前锋攻击次数。',{type:'landmark-use',id:x.post,target:x.front}],
 ['观察强化到期','结束回合，前锋攻击7→5，旌台仍冷却，不保留上一回合的临时强化。',{type:'end'}],
 ['主动撤下的代价','点击仍冷却的旌台，在详情点击撤下设施：剩余1次作废，只释放场位，不退军令、不制造部队阵亡。',{type:'landmark-remove',id:x.post}],
 ['继续削弱护卫','前锋攻击10命护卫，护卫剩5命，己方10→7命。营地已耗尽，不能继续治疗。',{type:'attack',id:x.front,target:x.guard}],
 ['等待攻击恢复','结束回合。设施离场不会刷新前锋已经用过的攻击。',{type:'end'}],
 ['清除护卫','前锋攻击残余5命护卫。护卫阵亡仍同时反击3，己方剩4命。',{type:'attack',id:x.front,target:x.guard}],
 ['准备最后一击','结束回合恢复前锋攻击，靶主将仍无甲5命。',{type:'end'}],
 ['击败教学主将','前锋攻击敌主将造成5点真实伤害。设施没有增加士兵或装备；查看交战记录核对两次营地和旌台撤下。',{type:'attack',id:x.front,target:'hero'}]
 ];
 if(course.status==='complete')return {index:items.length,total:items.length,title:'地标演练完成',text:'18步操作已由正式引擎完成；可查看次数、冷却、耗尽、到期与撤下记录。',action:null};
 if(c.turn==='enemy')return {index:course.step,total:items.length,title:'训练对手回合',text:'训练对手只结束回合，正式引擎处理军令、抽牌与状态。',action:{type:'end'},opponent:true};
 const [title,text,action]=items[course.step];return {index:course.step,total:items.length,title,text,action,opponent:false};
}
