// Versioned battle-only modifiers. Card templates and persistent people stay unchanged.
export const ATTRIBUTE_RULES={version:1,trainingAttack:.004,trainingHealth:.006,officerAttack:.003,officerHealth:.004,commander:.004};
const bounded=n=>Math.max(0,Math.min(100,n??35));
const ranged=new Set(['archers','crossbows','horse-archers']);
export function attributeStats(def,count,training,rule,officer={},commander={},kind=def.kind){
 if(rule?.version!==1)throw Error('未知军阵属性规则');
 const martial=bounded(officer.martial),intelligence=bounded(officer.intelligence),leadership=bounded(officer.leadership),command=bounded(commander.leadership);
 const tactical=ranged.has(kind),attackAbility=tactical ? .4*martial+.6*intelligence : .8*martial+.2*intelligence;
 // 25 soldiers retain 70% strength; under 25 also scale by the actual fraction.
 const manpower=(.6+.4*Math.min(100,count)/100)*Math.min(1,count/25);
 const factors={manpower,trainingAttack:1+(training-60)*rule.trainingAttack,trainingHealth:1+(training-60)*rule.trainingHealth,officerAttack:1+(attackAbility-60)*rule.officerAttack,officerHealth:1+(leadership-60)*rule.officerHealth,commander:1+(command-60)*rule.commander};
 const rawAttack=def.attack*manpower*factors.trainingAttack*factors.officerAttack*factors.commander,rawHealth=def.health*manpower*factors.trainingHealth*factors.officerHealth*factors.commander;
 return {attack:Math.max(1,Math.round(rawAttack)),hp:Math.max(1,Math.round(rawHealth)),rawAttack,rawHealth,factors,abilities:{martial,intelligence,leadership,command},tactical};
}
const percent=n=>(n*100).toFixed(1)+'%';
export function attributeExplanation(stats,def,count,training,officerName,commanderName){
 const f=stats.factors,a=stats.abilities;
 return {title:'开战属性 · 攻命来源',summary:`${count}人 · 训练${training} · ${officerName}带队。基础${def.attack}攻／${def.health}命 → 本场${stats.attack}攻／${stats.hp}命；兵力、训练、带队能力与主将统率共同计算。`,lines:[
  `编制 ${count}人：兵力倍率 ${percent(f.manpower)}（100人满编；25人70%；不足25人进一步折减）。`,
  `训练 ${training}：攻击 ${percent(f.trainingAttack)}，生命 ${percent(f.trainingHealth)}；60为基准，每点分别改变0.4%、0.6%。`,
  `${officerName}：武力${a.martial}、智力${a.intelligence}、统率${a.leadership}。攻击按${stats.tactical?'武力40%＋智力60%':'武力80%＋智力20%'}，倍率 ${percent(f.officerAttack)}；统率生命倍率 ${percent(f.officerHealth)}；60为基准，攻击能力每点改变0.3%、统率每点改变生命0.4%。`,
  `主将${commanderName}：统率${a.command}，全军攻命倍率 ${percent(f.commander)}；60为基准，每点改变0.4%。`,
  `攻击：基础${def.attack} × ${(f.manpower).toFixed(3)} × ${f.trainingAttack.toFixed(3)} × ${f.officerAttack.toFixed(3)} × ${f.commander.toFixed(3)} = ${stats.rawAttack.toFixed(2)} → ${stats.attack}攻。`,
  `生命：基础${def.health} × ${(f.manpower).toFixed(3)} × ${f.trainingHealth.toFixed(3)} × ${f.officerHealth.toFixed(3)} × ${f.commander.toFixed(3)} = ${stats.rawHealth.toFixed(2)} → ${stats.hp}命。`,
  '攻命四舍五入，最低1；小幅提升可能尚未跨过整数门槛。开战后属性锁定，受伤不降低攻击；治疗不复活实际阵亡兵员。'
 ]};
}
