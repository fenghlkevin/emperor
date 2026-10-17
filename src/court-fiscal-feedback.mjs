// Regular settlement totals survive bounded entry pruning; one-off orders are excluded.
export function courtFiscalFeedback(state){
 const home=state.domestic.countries.find(c=>c.id===state.domestic.playerCountryId);
 const settled=home.fiscal.accounting.lastSettledTurn;
 const row=home.ledger.find(r=>!r.legacy&&r.turn===settled&&r.turn<=state.turn);
 const regular=row?.categories.regular;
 if(!regular)return null;
 return {turn:row.turn,income:regular.income,paid:regular.expenditure,debtAdded:regular.debtAdded,due:regular.expenditure+regular.debtAdded,cashNet:regular.income-regular.expenditure};
}
