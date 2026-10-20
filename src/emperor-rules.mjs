// DOS training/stat units with project rest/lifespan balance rules. Initial values and legacy conversion preserve
// this project's old progress ratios; they are not claimed as DOS creation stats.
export const EMPEROR_RULES_VERSION=1;
export const ABILITIES=['charm','talent','wisdom','martial'];
export const TRAINING={music:{key:'charm',name:'魅力',specialty:0},study:{key:'wisdom',name:'智慧',specialty:1},theatre:{key:'talent',name:'才艺'},martial:{key:'martial',name:'武术',specialty:2}};
export function migrateEmperorRules(s){
 if(s.emperorRulesVersion===EMPEROR_RULES_VERSION)return;
 if(s.emperorRulesVersion!==undefined)throw Error('皇帝规则版本不支持');
 const a=s.stats;
 for(const key of ABILITIES)if(a[key]!==undefined&&(!Number.isInteger(a[key])||a[key]<0||a[key]>100))throw Error('旧档皇帝能力无效');
 if(a.maxEnergy!==undefined&&(!Number.isInteger(a.maxEnergy)||a.maxEnergy<1||a.maxEnergy>500))throw Error('旧档体力上限无效');
 if(a.energy!==undefined&&(!Number.isInteger(a.energy)||a.energy<0||a.energy>(a.maxEnergy??10)))throw Error('旧档当前体力无效');
 for(const key of ABILITIES)if(a[key]!==undefined)a[key]*=5;
 const oldMax=a.maxEnergy??10,newMax=Math.min(500,oldMax*20);
 a.energy=a.energy===undefined?newMax:Math.round(a.energy/oldMax*newMax);
 a.maxEnergy=newMax;
 s.emperorRulesVersion=EMPEROR_RULES_VERSION;
}
export function trainingGain(age,specialty,kind,random=Math.random){
 const roll=Math.floor(random()*100);
 const base=roll<20?1:roll<55?2:roll<90?3:4;
 const agePenalty=Math.floor(random()*100)<age-10?1:0;
 return Math.max(1,base-agePenalty)+(TRAINING[kind].specialty!==undefined&&specialty===TRAINING[kind].specialty?1:0);
}
export function companionRecovery(person,member=true){
 return (person.baseAbility??Math.trunc(person.appearance**2/40))+(member?person.experience+(person.rank==null?5:person.rank<5?50:person.rank<14?20:5):0);
}
export function companyLifeCost(streak){return [0,0,2,4,8,16,24][streak]??32;}
// Existing non-DOS talent/talent-generation models still operate on a 100 scale.
export const ability100=value=>Math.max(0,Math.min(100,value/5));
