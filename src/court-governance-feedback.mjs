// Preserve the recorded outcome; current officeholders need not be the officer who acted.
export function courtGovernanceFeedback(state,provinceId){
 const records=state.domestic.governance.records.filter(r=>r.provinceId===provinceId&&r.turn<=state.turn);
 if(!records.length)return null;
 const turn=Math.max(...records.map(r=>r.turn)),rows=records.filter(r=>r.turn===turn);
 return {turn,provinceId,cost:rows.reduce((sum,r)=>sum+r.cost,0),reasons:rows.map(r=>r.reason)};
}
