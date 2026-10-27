// Secret1: military orders bound to the already-reserved commander, not new troops or gear.
export const SECRET_VERSION=1,SECRET_LIMIT=2;
export const SECRET_DEFINITIONS=Object.freeze(Object.fromEntries([
 {id:'secret_watch',name:'御前警戒',trigger:'hero-attacked',effect:'armor',amount:3,text:'奥秘：对手攻击我方主将前，主将获得3点护甲。'},
 {id:'secret_ambush',name:'料敌设伏',trigger:'unit-attacks-hero',effect:'damage-attacker',amount:3,text:'奥秘：敌方部队攻击我方主将前，对攻击者造成3点伤害；若其阵亡，取消本次攻击。'}
].map(x=>[x.id,Object.freeze({...x,type:'secret',cost:2,tags:[],enter:[],death:[]})])));
const other=s=>s==='home'?'enemy':'home';
export function normalizeSecretSelection(value){
 if(value===undefined)return undefined;const fail=()=>{throw Error('奥秘配置无效：每种0至2张，总数最多2张');};
 if(!value||typeof value!=='object'||Array.isArray(value)||value.version!==1||Object.keys(value).some(k=>!['version','counts'].includes(k))||!value.counts||typeof value.counts!=='object'||Array.isArray(value.counts))fail();const counts={};let total=0;
 for(const id of Object.keys(value.counts).sort()){const n=value.counts[id];if(!Object.hasOwn(SECRET_DEFINITIONS,id)||!Number.isSafeInteger(n)||n<0||n>2)fail();total+=n;if(n)counts[id]=n;}if(total>2)fail();return {version:1,counts};
}
export const secretSelectionIds=s=>Object.entries(s?.counts??{}).flatMap(([id,n])=>Array(n).fill(id));
export function planSecretAllocation(home,enemy,selection){if(!secretSelectionIds(selection).length)return undefined;return {version:1,home:{sourceId:home.find(u=>u.commander).sourceId,selection:structuredClone(selection)},enemy:{sourceId:enemy.find(u=>u.commander).sourceId,selection:structuredClone(selection)}};}
export function canArmSecret(b,x){const p=b.cards.players[x.side];return x.type==='secret'&&Array.isArray(p.secrets)&&p.secrets.length<SECRET_LIMIT&&!p.secrets.some(id=>b.cards.catalog[id].definitionId===x.definitionId);}
export function armSecret(b,x,emit){if(!canArmSecret(b,x))throw Error('奥秘区已满或同名奥秘尚未触发');x.armedOrder=++b.cards.secretSequence;x.secretSeal=x.side+'-secret-seal-'+x.armedOrder;b.cards.players[x.side].secrets.push(x.id);emit('secret-set',{id:x.id,side:x.side});}
export function secretZoneView(b,viewer='home'){
 if(!['home','enemy'].includes(viewer))throw Error('奥秘观察方无效');return Object.fromEntries(['home','enemy'].map(side=>[side,(b.cards.players[side].secrets??[]).map(id=>{const x=b.cards.catalog[id];return side===viewer?{id:x.id,name:x.name,definitionId:x.definitionId,text:x.definition.text,order:x.armedOrder,source:structuredClone(x.secretSource)}:{seal:x.secretSeal,name:'未知奥秘',order:x.armedOrder};})]));
}
// Re-evaluate eligibility after each older secret; dead attackers never trigger later orders.
export function resolveAttackSecrets(b,action,{emit,withCause,hurt,cleanup}){
 const c=b.cards,attacking=c.turn,owner=other(attacking),p=c.players[owner];if(!p.secrets||action.target!=='hero'||!['attack','hero-attack'].includes(action.type))return true;
 const alive=()=>!b.result&&(action.type==='hero-attack'?c.players[attacking].hero>0:c.players[attacking].board.includes(action.id)&&c.catalog[action.id].hp>0);
 for(const id of [...p.secrets]){
  if(!alive())break;const x=c.catalog[id],d=x.definition;if(d.trigger==='unit-attacks-hero'&&action.type!=='attack')continue;
  p.secrets=p.secrets.filter(v=>v!==id);p.grave.push(id);x.secretRevealed=true;
  withCause({kind:'secret',sourceId:id,effect:d.effect},()=>{emit('secret-reveal',{id,side:owner});if(d.effect==='armor'){p.armor+=d.amount;emit('armor',{target:owner+'-hero',amount:d.amount});}else{hurt(c.catalog[action.id],d.amount);cleanup();}});
 }
 if(!alive()){emit('secret-stop',{id:action.id??attacking+'-hero',side:attacking});return false;}return true;
}
export function validateSecretState(b){
 const c=b.cards,allocation=b.command.secretAllocation,fail=()=>{throw Error('奥秘来源或战斗状态无效');},same=(a,z)=>JSON.stringify(a)===JSON.stringify(z);
 if(!allocation){if(secretSelectionIds(normalizeSecretSelection(b.command.cardSecrets)).length||c.rulesVersion===5||c.secretAiVersion!==undefined||c.secretSequence!==undefined||Object.values(c.players).some(p=>p.secrets!==undefined)||Object.values(c.catalog).some(x=>x.type==='secret'))fail();return;}
 if(![5,6].includes(c.rulesVersion)||c.secretAiVersion!==1||c.rulesSnapshot.version!==c.rulesVersion||!c.catalogVersion.includes('+secrets.1')||allocation.version!==1||Object.keys(allocation).some(k=>!['version','home','enemy'].includes(k))||!same(normalizeSecretSelection(b.command.cardSecrets),allocation.home?.selection)||!Number.isSafeInteger(c.secretSequence)||c.secretSequence<0)fail();
 const orders=new Set();for(const side of ['home','enemy']){
  const p=c.players[side],leader=b.units.find(u=>u.side===side&&u.commander),row=allocation[side];if(!row||row.sourceId!==leader.sourceId||!same(row.selection,normalizeSecretSelection(row.selection))||!Array.isArray(p.secrets)||p.secrets.length>SECRET_LIMIT)fail();const ids=Object.values(c.catalog).filter(x=>x.side===side&&x.type==='secret');if(!same(ids.map(x=>x.definitionId).sort(),secretSelectionIds(row.selection).sort()))fail();let previous=0;const activeDefs=new Set();
  for(const id of p.secrets){const x=c.catalog[id];if(!x||x.type!=='secret'||x.side!==side||x.secretRevealed||x.armedOrder<=previous||activeDefs.has(x.definitionId))fail();previous=x.armedOrder;activeDefs.add(x.definitionId);}
  for(const x of ids){const d=SECRET_DEFINITIONS[x.definitionId],s=x.secretSource;if(!d||!same(x.definition,d)||!s||!same(s,{unitId:leader.id,sourceId:leader.sourceId,personId:leader.cardPersonId})||x.unitId!==undefined||x.count!==undefined||x.hp!==undefined||x.attack!==undefined||x.personId!==undefined||typeof x.secretRevealed!=='boolean')fail();
   if(x.armedOrder!==undefined){if(!Number.isSafeInteger(x.armedOrder)||x.armedOrder<1||x.armedOrder>c.secretSequence||orders.has(x.armedOrder)||x.secretSeal!==side+'-secret-seal-'+x.armedOrder||(!p.secrets.includes(x.id)&&!p.grave.includes(x.id))||x.secretRevealed!==p.grave.includes(x.id))fail();orders.add(x.armedOrder);}else if(x.secretSeal!==undefined||x.secretRevealed||p.secrets.includes(x.id))fail();
  }
 }
 if(orders.size!==c.secretSequence)fail();for(const d of Object.values(SECRET_DEFINITIONS))if(!same(c.definitionCatalog[d.id],d))fail();
}
