// Explicit project rules. Historical names are analogies, not a recovered DOS matrix.
export const END_REASONS=['寿元已尽','禅让','升仙','病逝','遇刺','服毒','亡国'];
export const HISTORY_MATRIX=[
 ['秦始皇','汉武帝','唐太宗'],
 ['隋炀帝','唐玄宗','汉文帝'],
 ['晋惠帝','宋徽宗','宋仁宗']
];
export function endReign(s,reason,evidence){
 if(!END_REASONS.includes(reason))throw Error('终局原因无效');
 if(s.reignResult||s.dynasty?.endReason)return false;
 s.stats.life=0;s.dynasty.endReason=reason;
 s.dynasty.endEvidence={turn:s.turn,text:evidence};return true;
}
export function historicalEvaluation(s){
 const d=s.domestic,ps=d.provinces.filter(p=>p.countryId===d.playerCountryId),total=ps.reduce((n,p)=>n+p.population.total,0);
 const avg=f=>total?ps.reduce((n,p)=>n+f(p)*p.population.total,0)/total:0;
 const protectedCount=d.diplomacy.filter(r=>r.countryIds.includes(d.playerCountryId)&&(r.relation==='protector'&&r.countryIds[0]===d.playerCountryId||r.relation==='protected'&&r.countryIds[1]===d.playerCountryId)&&d.countries.some(c=>c.id===r.countryIds.find(id=>id!==d.playerCountryId)&&c.provinceIds.length)).length;
 const living=Math.round(avg(p=>p.status.livingStandard)),production=Math.round(avg(p=>Object.values(p.economy).reduce((n,e)=>n+e.productivity*e.developedArea/e.capacityArea,0)/4)),order=Math.round(avg(p=>(p.welfare.stability+p.welfare.security+p.welfare.loyalty)/3));
 const domesticScore=Math.round(living*.4+production*.25+order*.35),control=ps.length+protectedCount*.5,row=control>=20?0:control>=10?1:2,column=domesticScore>=75?2:domesticScore>=45?1:0;
 const years=Math.floor((s.turn-(s.dynasty?.reignStartTurn??1))/36),shortReign=years<10,reason=s.dynasty?.endReason??'寿元已尽',tags=[];
 if(shortReign)tags.push('在位未满十年，阶段评价');if(s.stats.life===0&&s.stats.age<30)tags.push('早逝');
 const c=d.countries.find(c=>c.id===d.playerCountryId);if(c.fiscal.debt>c.fiscal.treasury)tags.push('财政困顿');if(ps.length<10)tags.push('疆土有失');if(living<20)tags.push('民生贫困');
 return {version:1,basis:'项目历史类比矩阵',name:reason==='亡国'?'崇祯':HISTORY_MATRIX[row][column],row,column,years,shortReign,living,production,order,domesticScore,control,protectedCount,tags};
}
