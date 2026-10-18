// Only canonical player battle reports carry kitVersion; do not infer results from NPC news.
export function courtMilitaryFeedback(state){
 const row=state.domestic.war.history.find(r=>r.kind==='war'&&r.report?.kitVersion===1&&r.turn<=state.turn);
 if(!row)return null;
 return {id:row.id,turn:row.turn,title:row.title,lines:[...row.lines]};
}
