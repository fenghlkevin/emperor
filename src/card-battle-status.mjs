// Derive persistent UI state from the existing saved card. No new battle rules or save fields.
const signed=n=>(n>0?'+':'−')+Math.abs(n);
export function cardStatuses(x){
 if(!x||x.type==='tactic')return [];
 const out=[],add=(key,tone,label,description)=>out.push({key,tone,label,description});
 if(x.frozen)add('freeze','frozen','冻结','无法攻击；己方回合结束解除');
 if(x.silenced)add('silence','silenced','沉默','原有关键词与专属技能已移除；持续到离场，新施加的效果仍可生效');
 if(x.tempAttack)add('temporary-attack','temporary','攻'+signed(x.tempAttack)+' · 本回合','临时强化：攻击'+signed(x.tempAttack)+'，本回合结束失效');
 if(x.buffAttack)add('attack',x.buffAttack>0?'enhanced':'weakened','攻'+signed(x.buffAttack),'攻击修正'+signed(x.buffAttack)+'；持续到被移除或离场');
 if(x.buffHealth)add('health',x.buffHealth>0?'enhanced':'weakened','命'+signed(x.buffHealth),'生命上限'+signed(x.buffHealth)+'；持续到被移除或离场');
 if(x.tags?.includes('shield'))add('shield','shield','护甲盾','抵挡下一次伤害，抵挡后消失');
 for(const [tag,name]of [['taunt','护卫'],['rush','突袭'],['stealth','潜行'],['anti','反骑'],['anti_horse','慑马'],['pierce','破盾']])if(x.tags?.includes(tag)&&!x.definition?.tags?.includes(tag))add('granted-'+tag,'enhanced','获'+name,'额外获得'+name+'；按该关键词规则生效');
 return out;
}
export function statBreakdown(x){
 const a=x.printedAttack??x.attack,h=x.printedHp??x.maxHp;
 return {attack:'攻击 '+a+'（基础）'+(x.buffAttack?' '+signed(x.buffAttack)+'（持续修正）':'')+(x.tempAttack?' '+signed(x.tempAttack)+'（本回合）':'')+' = '+x.attack,
 health:'生命上限 '+h+'（基础）'+(x.buffHealth?' '+signed(x.buffHealth)+'（持续修正）':'')+' = '+x.maxHp};
}
export function effectNotice(event,before,after){
 const old=before.cards.catalog[event.target],x=after.cards.catalog[event.target];
 if(event.type==='freeze')return '已冻结 · 无法攻击';
 if(event.type==='silence')return '已沉默 · 原技能移除';
 if(event.type==='shield')return '护甲盾已抵挡伤害';
 if(event.type==='buff'&&x){
  const parts=[],a=x.attack-(old?.attack??x.printedAttack),h=x.maxHp-(old?.maxHp??x.printedHp),temporary=x.tempAttack-(old?.tempAttack??0);
  if(a)parts.push('攻击'+signed(a));if(h)parts.push('生命上限'+signed(h));if(x.tags.includes('shield')&&!old?.tags.includes('shield'))parts.push('获得护甲盾');
  return parts.join(' · ')+(temporary?' · 本回合':'');
 }
 return '';
}
