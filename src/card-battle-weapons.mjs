// Weapon v1. Quantities refer to whole spare kits, never soldiers or generated items.
export const WEAPON_VERSION=1;
export const WEAPON_DEFINITIONS=Object.freeze(Object.fromEntries([
 {id:'arsenal_blade',name:'备用刀盾',cost:2,attack:2,durability:2,kitKind:'infantry'},
 {id:'arsenal_spear',name:'备用长枪',cost:3,attack:3,durability:2,kitKind:'spears'}
].map(d=>[d.id,Object.freeze({...d,type:'weapon',tags:[],enter:[],death:[],text:'主将装备；每回合攻击一次，每次消耗1耐久。'})])));
const other=s=>s==='home'?'enemy':'home';
export function normalizeWeaponSelection(value){
 if(value===undefined)return undefined;
 if(!value||value.version!==1||typeof value!=='object'||Array.isArray(value)||Object.keys(value).some(k=>!['version','counts'].includes(k))||!value.counts||typeof value.counts!=='object'||Array.isArray(value.counts))throw Error('武器配置无效');
 const counts={};let total=0;for(const id of Object.keys(value.counts).sort()){const n=value.counts[id];if(!Object.hasOwn(WEAPON_DEFINITIONS,id)||!Number.isSafeInteger(n)||n<0||n>2)throw Error('武器种类或张数无效');if(n)counts[id]=n;total+=n;}if(total>2)throw Error('武器最多2张');return {version:1,counts};
}
export const weaponSelectionIds=s=>Object.entries(s?.counts??{}).flatMap(([id,n])=>Array(n).fill(id));
export function weaponKitCounts(s){const counts={};for(const id of weaponSelectionIds(s)){const k=WEAPON_DEFINITIONS[id].kitKind;counts[k]=(counts[k]??0)+1;}return counts;}
export function autoWeaponSelection(stock){const counts={};for(const d of Object.values(WEAPON_DEFINITIONS))if((stock[d.kitKind]??0)>0)counts[d.id]=1;return {version:1,counts};}
export function visibleEnemyTargets(b,side){const c=b.cards,e=c.players[other(side)],visible=e.board.filter(id=>!c.catalog[id].tags.includes('stealth')),guards=visible.filter(id=>c.catalog[id].tags.includes('taunt'));return guards.length?guards:[...visible,'hero'];}
export function legalHeroAttacks(b,side=b.cards.turn){const c=b.cards;if(!b.command.weaponAllocation||c.rulesVersion<4)return [];const p=c.players[side],x=c.catalog[p.weapon];return c.phase==='play'&&!b.result&&side===c.turn&&x?.type==='weapon'&&x.durability>0&&!p.heroAttackUsed?visibleEnemyTargets(b,side):[];}
export function heroAttackPreview(b,target,side=b.cards.turn){if(!legalHeroAttacks(b,side).includes(target))return null;const c=b.cards,p=c.players[side],e=c.players[other(side)],x=c.catalog[p.weapon],t=c.catalog[target],damage=x.attack,retaliation=t?.attack??0;return {damage,retaliation,targetLife:target==='hero'?Math.max(0,e.hero-Math.max(0,damage-e.armor)):Math.max(0,t.hp-(t.tags.includes('shield')?0:damage)),attackerLife:Math.max(0,p.hero-Math.max(0,retaliation-p.armor))};}
export function breakWeapon(b,side,reason,emit){const c=b.cards,p=c.players[side],id=p.weapon;if(!id)return;p.weapon=null;c.weaponSupplies[id].lost=true;c.weaponSupplies[id].reason=reason;p.grave.push(id);emit('weapon-break',{id,side,kind:reason});}
export function equipWeapon(b,x,emit){const p=b.cards.players[x.side];if(p.weapon)breakWeapon(b,x.side,'replaced',emit);p.weapon=x.id;emit('weapon-equip',{id:x.id,side:x.side});}
export function performHeroAttack(b,target,{emit,damageHero,damageUnit,withCause,beforeStrike}){const c=b.cards,side=c.turn,p=c.players[side],x=c.catalog[p.weapon],f=heroAttackPreview(b,target);if(!f)throw Error('当前主将或目标不可攻击');p.heroAttackUsed=true;emit('hero-attack',{id:side+'-hero',target,side});if(beforeStrike&&!beforeStrike())return;if(target==='hero')damageHero(other(side),f.damage);else{damageUnit(c.catalog[target],f.damage);withCause({kind:'counterattack',sourceId:target},()=>damageHero(side,f.retaliation));}x.durability--;emit('weapon-wear',{id:x.id,side,amount:1});if(!x.durability)breakWeapon(b,side,'exhausted',emit);}
export function weaponLossForSource(b,sourceId){const result={};for(const supply of Object.values(b.cards?.weaponSupplies??{}))if(supply.sourceId===sourceId&&supply.lost)result[supply.kind]=(result[supply.kind]??0)+1;return result;}
export function expectedWeaponKits(b,sourceId){const result={};for(const row of Object.values(b.command.weaponAllocation??{})){if(!row||row.sourceId!==sourceId)continue;for(const [k,n]of Object.entries(weaponKitCounts(row.selection)))result[k]=(result[k]??0)+n;}return result;}
export function validateWeaponState(b){
 const c=b.cards,fail=()=>{throw Error('武器来源或战斗状态无效');};
 if(!b.command.weaponAllocation){if(c.weaponAiVersion!==undefined||c.weaponSupplies!==undefined||b.command.weaponAllocation!==undefined||Object.values(c.catalog).some(x=>x.type==='weapon')||Object.values(c.players).some(p=>p.weapon!==undefined||p.heroAttackUsed!==undefined))fail();return;}
 const allocation=b.command.weaponAllocation;if(c.weaponAiVersion!==1||!c.catalogVersion.includes('+weapons.1')||!allocation||allocation.version!==1||Object.keys(allocation).some(k=>!['version','home','enemy'].includes(k))||!c.weaponSupplies||c.rulesSnapshot.version!==c.rulesVersion||![4,5,6].includes(c.rulesVersion)||JSON.stringify(normalizeWeaponSelection(b.command.cardWeapons))!==JSON.stringify(allocation.home?.selection))fail();
 const seen=new Set();for(const side of ['home','enemy']){const p=c.players[side],row=allocation[side],leader=b.units.find(u=>u.side===side&&u.commander);if(!row||row.sourceId!==leader.sourceId||JSON.stringify(row.selection)!==JSON.stringify(normalizeWeaponSelection(row.selection))||typeof p.heroAttackUsed!=='boolean'||!(p.weapon===null||typeof p.weapon==='string'))fail();
  const ids=Object.values(c.catalog).filter(x=>x.side===side&&x.type==='weapon');if(JSON.stringify(ids.map(x=>x.definitionId).sort())!==JSON.stringify(weaponSelectionIds(row.selection).sort()))fail();
  for(const x of ids){const d=WEAPON_DEFINITIONS[x.definitionId],s=c.weaponSupplies[x.id];if(!d||JSON.stringify(x.definition)!==JSON.stringify(d)||x.cost!==d.cost||x.attack!==d.attack||!Number.isSafeInteger(x.durability)||x.durability<0||x.durability>d.durability||x.unitId!==undefined||x.count!==undefined||x.hp!==undefined||x.personId!==undefined||x.personInstanceId!==undefined||x.training!==undefined||!s||Object.keys(s).some(k=>!['sourceId','kind','quantity','lost','reason'].includes(k))||s.sourceId!==row.sourceId||s.kind!==d.kitKind||s.quantity!==1||typeof s.lost!=='boolean')fail();
   const equipped=p.weapon===x.id;if(equipped&&(x.durability<1||s.lost)||!x.durability&&!s.lost||s.lost&&(!p.grave.includes(x.id)||!['exhausted','replaced','leader-defeated'].includes(s.reason))||!s.lost&&s.reason!==undefined)fail();if(s.reason==='exhausted'&&x.durability!==0)fail();seen.add(x.id);
  }
  if(p.weapon!==null&&!ids.some(x=>x.id===p.weapon))fail();
 }
 if(Object.keys(c.weaponSupplies).some(id=>!seen.has(id)))fail();
 for(const d of Object.values(WEAPON_DEFINITIONS))if(JSON.stringify(c.definitionCatalog[d.id])!==JSON.stringify(d))fail();
}
