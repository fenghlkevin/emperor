import {RECOVERY,welfareValue,commerceMultiplier,newRecruitTraining,buildingMarginal,effectiveBuildings} from './building-effects.mjs';
const names={temples:'寺庙',yamen:'衙门',markets:'市集',trainingGrounds:'校场',granaries:'粮仓',walls:'城墙',palaces:'行宫'};
const labels={stability:'安定',security:'治安',activity:'营业',fitness:'体能',loyalty:'民忠'};
const fmt=n=>Number(n).toLocaleString('zh-CN',{maximumFractionDigits:2});
export function buildingEffectsReport(p,turn){
 const b=p.buildingEffects,last=b?.last,counts=effectiveBuildings(p,turn),pending=b?.pending;
 const rows=Object.keys(names).map(key=>{
  const r=RECOVERY[key];let effect,applied='—';
  if(r){effect=`每旬${labels[r[0]]}最多 +${fmt(Math.min(r[2],p.buildings[key]*r[1])/100)}`;if(last)applied=`+${fmt(last.gains[r[0]])}`;}
  if(key==='temples')effect+='；缺粮暂停';
  if(key==='palaces')effect+='；须足粮无灾';
  if(key==='markets')effect+=`；商业增益 +${fmt((commerceMultiplier(p)-1)*100)}%`;
  if(key==='trainingGrounds')effect+=`；当前新兵训练 ${newRecruitTraining(p)}`;
  if(key==='granaries')effect=`灾害粮损减少 ${fmt((1-1/(1+p.buildings.granaries*.1))*100)}%；不生成粮食`;
  if(key==='walls')effect=`当前防御 ${fmt(welfareValue(p,'defense'))}；新增每座+5，上限100；尚不影响战棋伤害`;
  const status=pending?.building===key&&turn<pending.effectiveTurn?`新增1处第${pending.effectiveTurn}旬启用`:buildingMarginal(p,key,turn)<=0?'当前收益已封顶':'可继续改善';
  return `<tr><th>${names[key]}</th><td>${p.buildings[key]} / ${counts[key]}</td><td>${effect}</td><td>${applied}</td><td>${status}</td></tr>`;
 }).join('');
 return `<section data-building-effects><h3>普通建筑民生收益</h3><p class="civil-note">以下为项目试行规则。恢复保留小数，竣工后下一旬生效；本旬恢复自下一旬影响灾害风险及商业生产。</p><div class="civil-table report-table"><table><thead><tr><th>建物</th><th>实有 / 当旬有效</th><th>收益与条件</th><th>最近恢复</th><th>继续营建</th></tr></thead><tbody>${rows}</tbody></table></div><p class="civil-note">${last?`最近结算：第${last.turn}旬 · ${last.fed?'足额供粮':'缺粮'} · ${last.disaster?'受灾':'无活跃灾害'}`:'尚无收益结算，现有建筑从下一次旬结算开始生效。'} 积粮值仍按实际库存计算。</p></section>`;
}
