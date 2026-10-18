// Read existing settlement receipts; never estimate or transfer treasury here.
export function courtDiplomaticFeedback(state){
 const d=state.domestic,home=d.playerCountryId,rows=[];
 for(const r of d.diplomacy.filter(r=>r.countryIds.includes(home))){
  const country=d.countries.find(c=>c.id===r.countryIds.find(id=>id!==home));
  const a=r.agreement,p=a.lastPerformance,t=a.lastTribute;
  if(p)rows.push({countryId:country.id,name:country.name,kind:'trade',turn:p.turn,shortfall:p.exportsPaid<p.exportsDue||p.importsPaid<p.importsDue,summary:`出口实收${p.exportsPaid}/${p.exportsDue}两，进口实付${p.importsPaid}/${p.importsDue}两`});
  if(t)rows.push({countryId:country.id,name:country.name,kind:'tribute',turn:t.turn,shortfall:t.paid<t.due,summary:`岁贡实付${t.paid}/${t.due}两`});
 }
 return rows.sort((a,b)=>b.turn-a.turn||Number(b.shortfall)-Number(a.shortfall)||a.countryId.localeCompare(b.countryId));
}
