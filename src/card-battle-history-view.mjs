import {publicCardHistory} from './card-battle-history.mjs';
const actions={'landmark-use':'发动地标','landmark-remove':'撤下地标',mulligan:'换牌',play:'出牌',attack:'攻击','hero-attack':'主将武器攻击',power:'主将技能',end:'结束回合',retreat:'撤军'};
const causes={landmark:'地标效果',...actions,secret:'奥秘触发',enter:'入场效果',death:'遗计',counterattack:'同时反击','turn-end':'回合到期','start-turn':'回合开始',fatigue:'疲劳'};
const effects={'unit-heal':'部队恢复',rally:'本回合号令','damage-attacker':'伏击来袭部队',damage:'伤害',heal:'治疗',armor:'护甲',draw:'抽牌',buff:'强化',freeze:'冻结',silence:'沉默',mana:'军令',discount:'计策减费',aoe:'全体伤害',selfdamage:'自损',refund:'军令返还',group:'群体强化',destroy:'消灭',setattack:'调整攻击',shield:'护甲盾'};
const events={'landmark-deploy':'部署地标','landmark-use':'地标次数消耗','landmark-ready':'地标冷却完成','landmark-remove':'地标离场','secret-set':'布置奥秘','secret-reveal':'揭示奥秘','secret-stop':'奥秘中止攻击','hero-attack':'主将武器攻击','weapon-equip':'装备武器','weapon-break':'武器毁损','weapon-wear':'武器耐久消耗',damage:'伤害',shield:'护甲盾消耗',draw:'抽牌',burn:'满手爆牌',fatigue:'疲劳',reserve:'预备兵补充',turn:'回合开始',armor:'护甲变化',heal:'治疗',mana:'军令返还',discount:'计策减费',buff:'强化',freeze:'冻结',silence:'沉默',death:'阵亡',result:'战局结束',play:'出牌',attack:'攻击',power:'主将技能',expire:'临时效果到期'};
const tags={taunt:'护卫',rush:'突袭',shield:'护甲盾',stealth:'潜行',anti:'反骑',anti_horse:'慑马',pierce:'破盾'};
const zones={landmark:'军阵设施位',weapon:'主将装备槽',board:'场上',grave:'弃牌区',hand:'手牌'};
const fields={uses:'剩余次数',cooldown:'冷却回合',durability:'耐久',attack:'攻击',hp:'生命',maxHp:'生命上限',armor:'护甲',tempAttack:'临时攻击',frozen:'冻结',silenced:'沉默',zone:'位置',tags:'关键词'};
const side=s=>s==='home'?'我军':'敌军',value=(k,v)=>v===undefined?'未记录':Array.isArray(v)?v.map(t=>tags[t]??t).join('、')||'无':typeof v==='boolean'?(v?'是':'否'):k==='zone'?(zones[v]??v):String(v);
export function historyStatChanges(before,after){
 return Object.entries(fields).filter(([k])=>JSON.stringify(before?.[k])!==JSON.stringify(after?.[k])).map(([k,name])=>({field:k,text:`${name} ${value(k,before?.[k])} → ${value(k,after?.[k])}${Number.isFinite(before?.[k])&&Number.isFinite(after?.[k])?`（${after[k]-before[k]>0?'+':''}${after[k]-before[k]}）`:''}`}));
}
const causeText=c=>`${causes[c.kind]??c.kind}${c.source?' · '+c.source.name:''}${c.effect?' / '+(effects[c.effect]??c.effect):''}`;
export function cardHistoryView(b,filters={}){return historyRecordView(publicCardHistory(b),filters);}
export function historyRecordView(h,{round='',side:filterSide=''}={}){
 const all=h.entries,rows=all.filter(row=>(round===''||row.round===Number(round))&&(!filterSide||row.side===filterSide));
 const groups=[];
 for(const row of rows){
  let group=groups.at(-1);if(!group||group.round!==row.round){group={round:row.round,rows:[]};groups.push(group);}
  group.rows.push({id:row.id,ply:row.ply,side:row.side,title:`#${row.id} · ${side(row.side)} · ${actions[row.type]} · ${row.actor.name}${row.skill?' / '+row.skill:''}${row.target?' → '+row.target.name:''}`,cost:row.cost,swaps:row.swaps,
   resources:['home','enemy'].map(s=>`${side(s)}军令 ${row.resources[s].before.mana} → ${row.resources[s].after.mana}；计策减费 ${row.resources[s].before.discount} → ${row.resources[s].after.discount}`),
   changes:row.changes.map(x=>({name:x.subject.name,values:historyStatChanges(x.before,x.after)})),
   events:row.events.map(e=>({ordinal:e.ordinal,ply:e.ply,round:e.round,title:`${events[e.type]}${e.subject?' · '+e.subject.name:e.side?' · '+side(e.side):''}${['draw','burn'].includes(e.type)&&e.side==='enemy'?'（未公开牌名）':''}${e.type==='result'?' · '+({victory:'我军获胜',defeat:'我军战败',draw:'双方收兵'}[e.result]??e.result):''}`,
    cause:[...(e.cause.parents??[]),e.cause].map(causeText).join(' → '),values:historyStatChanges(e.before,e.after),
    // Damage amounts may include armor or overkill: before/after alone define actual deductions.
    note:e.type==='weapon-break'?({exhausted:'耐久耗尽，实际备用套装计入损耗。',replaced:'替换旧武器，已用攻击次数不刷新。','leader-defeated':'主将败退，已装备的备用套装遗失。'}[e.kind]??''):e.type==='fatigue'?`疲劳伤害 ${e.amount}`:e.type==='expire'&&e.thaw?'冻结解除；到期值见上列。':''}))});
 }
 return {partial:h.partial,startedPly:h.startedPly,total:all.length,shown:rows.length,rounds:[...new Set(all.map(r=>r.round))],groups};
}
