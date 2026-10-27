import {cardText,keywordNames} from './card-battle.mjs';
// Face copy is a projection only. Inspection and accessible labels retain full rules.
export function compactPersonText(d){
 if(d.type!=='general')return cardText(d);
 const kind=f=>({foot:'步兵',cavalry:'骑兵',ranged:'远程部队'}[f.mask]??'部队');
 const who=f=>f.target==='friend'?'其他友方'+kind(f):f.target==='enemy_character'?'敌方角色':(f.injured?'受伤':'')+'敌方部队';
 const effect=f=>{
  const n=f.n??0;
  switch(f.op){
   case 'draw':return '抽'+n+({tactic:'计策',general:'人物牌',troop:'部队牌',low:'张≤2费牌',high:'张≥5费牌'}[f.filter]??'张牌');
   case 'discount':return '下张计策−'+n+'费（本回合）';
   case 'armor':return '主将护甲+'+n;
   case 'heal':return '主将回血'+n;
   case 'damage':return who(f)+'受'+n+'伤害';
   case 'aoe':return '全体敌方部队受'+n+'伤害';
   case 'selfdamage':return '己方主将受'+n+'伤害';
   case 'refund':return '军令+'+n+'（本回合）';
   case 'freeze':return '冻结'+who(f);
   case 'silence':return '沉默'+who(f);
   case 'destroy':return '消灭受伤敌方部队';
   case 'setattack':return who(f)+'攻击变为'+n;
   case 'buff':case 'group':{
    const target=f.op==='group'?(f.limit?'至多'+f.limit+'个':'所有')+'其他友方'+kind(f):who(f);
    return target+[(f.a??0)?'攻'+(f.a>0?'+':'')+f.a:'',(f.h??0)?'命'+(f.h>0?'+':'')+f.h:'',f.give==='shield'?'获得护甲盾':''].filter(Boolean).join('、')+(f.temp?'（本回合）':'');
   }
   default:return null;
  }
 };
 const tags=(d.tags??[]).map(t=>({anti:'反骑（主动攻骑兵+2攻）',anti_horse:'慑马（主动攻战马+2攻）',pierce:'破盾（主动攻护卫+2攻）'}[t]??keywordNames[t])).filter(Boolean);
 const enter=(d.enter??[]).map(effect),death=(d.death??[]).map(effect);
 // New effects must keep their complete rules until a compact wording is supplied.
 if([...enter,...death].includes(null))return cardText(d);
 return [...tags,...enter,...(death.length?['遗计：'+death.join('，')]:[])].join('；')||'普通部队';
}
