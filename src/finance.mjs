// Treasury is authoritative. Each open period includes every actual cash movement.
export const FINANCE_VERSION = 1;
const integer = n => Number.isSafeInteger(n) && n >= 0;
const fail = () => { throw Error('财政流水无效或余额不一致'); };
export function initializeFinance(d) {
  for (const c of d.countries) {
    if (c.fiscal.accounting !== undefined) continue;
    // Old ledgers contain regular budgets, not a complete cash history. Never repair cash from them.
    const lastTurn = c.ledger[0]?.turn ?? 0;
    for (const row of c.ledger) row.legacy = true;
    c.fiscal.accounting = {version:FINANCE_VERSION, lastSettledTurn:lastTurn, nextId:1};
  }
  return d;
}
export function openPeriod(c, turn) {
  if (!integer(turn) || turn < 1) fail();
  const latest = c.ledger[0];
  if (latest && !latest.legacy && latest.turn === turn) return latest;
  if (latest && latest.turn > turn) throw Error('不能向已封存的旬重复记账');
  const legacyBaseline=latest?.legacy&&latest.turn===turn?c.ledger.shift():undefined;
  const row = {turn, ...(legacyBaseline?{legacyBaseline}:{}), openingTreasury:c.fiscal.treasury, openingDebt:c.fiscal.debt,
    income:0, expenditure:0, net:0, debtAdded:0, closingTreasury:c.fiscal.treasury,
    closingDebt:c.fiscal.debt, categories:{}, entries:[], keys:[], carried:{income:0,expenditure:0,debtAdded:0}};
  c.ledger.unshift(row);
  c.ledger = c.ledger.slice(0,36);
  return row;
}
// A posting may incur debt only for the pre-existing compulsory-payment rules.
export function postTreasury(d, countryId, {turn, income=0, expense=0, allowDebt=false, category='oneOff', reason, key}) {
  initializeFinance(d);
  const c=d.countries.find(c=>c.id===countryId);
  if (!c || !integer(income) || !integer(expense) || !['regular','oneOff','transfer'].includes(category) ||
      typeof reason!=='string' || !reason || reason.length>160 || typeof key!=='string' || !key || key.length>200) fail();
  const row=c.ledger[0];
  if (row && !row.legacy && row.turn===turn && row.keys.includes(key)) throw Error('该财政交易已入账，请勿重复提交');
  const available=c.fiscal.treasury+income;
  if (!Number.isSafeInteger(available) || (!allowDebt && available<expense)) throw Error('国库不足');
  const paid=Math.min(available,expense), debtAdded=expense-paid;
  const closing=available-paid, debt=c.fiscal.debt+debtAdded;
  if (!integer(closing)||!integer(debt)) fail();
  const period=openPeriod(c,turn);
  // Catch a caller bypassing this module once a complete period exists.
  if (period.closingTreasury!==c.fiscal.treasury || period.closingDebt!==c.fiscal.debt) fail();
  if(period.keys.length>=4096)throw Error('本旬财政交易数量已达存档上限，请结束本旬');
  period.keys.push(key);
  const entry={id:c.fiscal.accounting.nextId++,key,category,reason,income,expenditure:paid,debtAdded,
    treasuryBefore:c.fiscal.treasury,treasuryAfter:closing,debtBefore:c.fiscal.debt,debtAfter:debt};
  c.fiscal.treasury=closing;c.fiscal.debt=debt;
  period.income+=income;period.expenditure+=paid;period.net=period.income-period.expenditure;
  period.debtAdded+=debtAdded;period.closingTreasury=closing;period.closingDebt=debt;
  const group=period.categories[category]??={income:0,expenditure:0,debtAdded:0};
  group.income+=income;group.expenditure+=paid;group.debtAdded+=debtAdded;
  period.entries.push(entry);
  // Retain bounded detail plus exact carry-forward totals; domain command IDs prevent older replays.
  if(period.entries.length>100){const old=period.entries.shift();for(const k of ['income','expenditure','debtAdded'])period.carried[k]+=old[k];}
  return entry;
}
export function transferTreasury(d, from, to, amount, {turn,key,reason,allowDebt=false}) {
  if(from===to || !integer(amount)) fail();
  // Validate and apply both sides on a private copy before publishing either account.
  const source=d.countries.find(c=>c.id===from),target=d.countries.find(c=>c.id===to);
  if(!source||!target)fail();
  const draft={countries:[structuredClone(source),structuredClone(target)]},payer=draft.countries[0];
  const paid=Math.min(payer.fiscal.treasury,amount);
  const debit=postTreasury(draft,from,{turn,key:key+':out',reason,expense:amount,allowDebt,category:'transfer'});
  postTreasury(draft,to,{turn,key:key+':in',reason,income:paid,category:'transfer'});
  for(const id of [from,to]){const original=d.countries.find(c=>c.id===id),updated=draft.countries.find(c=>c.id===id);original.fiscal=updated.fiscal;original.ledger=updated.ledger;}
  return debit.expenditure;
}
export function validateFinance(d) {
  for(const c of d.countries){
    const a=c.fiscal.accounting;
    if(!a||a.version!==FINANCE_VERSION||!integer(a.lastSettledTurn)||!integer(a.nextId)||a.nextId<1)fail();
    let newer=null;const ids=new Set();
    for(const r of c.ledger){
      if(r.legacy===true){newer=null;continue;}
      if(!['openingTreasury','openingDebt','income','expenditure','debtAdded','closingTreasury','closingDebt'].every(k=>integer(r[k]))||
        r.net!==r.income-r.expenditure||r.closingTreasury!==r.openingTreasury+r.net||r.closingDebt!==r.openingDebt+r.debtAdded||
        !r.categories||!Array.isArray(r.entries)||r.entries.length>100||!Array.isArray(r.keys)||r.keys.length>4096||new Set(r.keys).size!==r.keys.length||r.keys.some(k=>typeof k!=='string'||!k||k.length>200)||!r.carried)fail();
      const sum={income:0,expenditure:0,debtAdded:0};
      for(const [k,v]of Object.entries(r.categories)){if(!['regular','oneOff','transfer'].includes(k)||!v)fail();for(const field of Object.keys(sum)){if(!integer(v[field]))fail();sum[field]+=v[field];}}
      for(const field of Object.keys(sum))if(sum[field]!==r[field]||!integer(r.carried[field]))fail();
      const detail={...r.carried},entryKeys=new Set();let previous=null;
      for(const e of r.entries){
        if(!integer(e.id)||e.id<1||e.id>=a.nextId||ids.has(e.id)||entryKeys.has(e.key)||!r.keys.includes(e.key)||typeof e.key!=='string'||!e.key||e.key.length>200||typeof e.reason!=='string'||!e.reason||e.reason.length>160||!['regular','oneOff','transfer'].includes(e.category)||
          !['income','expenditure','debtAdded','treasuryBefore','treasuryAfter','debtBefore','debtAfter'].every(k=>integer(e[k]))||
          e.treasuryAfter!==e.treasuryBefore+e.income-e.expenditure||e.debtAfter!==e.debtBefore+e.debtAdded)fail();
        if(previous&&(e.id<=previous.id||e.treasuryBefore!==previous.treasuryAfter||e.debtBefore!==previous.debtAfter))fail();
        ids.add(e.id);entryKeys.add(e.key);previous=e;for(const field of Object.keys(sum))detail[field]+=e[field];
      }
      for(const field of Object.keys(sum))if(detail[field]!==r[field])fail();
      if(r.entries.length){const first=r.entries[0],last=r.entries.at(-1);if(first.treasuryBefore!==r.openingTreasury+r.carried.income-r.carried.expenditure||first.debtBefore!==r.openingDebt+r.carried.debtAdded||last.treasuryAfter!==r.closingTreasury||last.debtAfter!==r.closingDebt)fail();}
      if(newer&&(newer.openingTreasury!==r.closingTreasury||newer.openingDebt!==r.closingDebt))fail();
      newer=r;
    }
    const latest=c.ledger[0];
    if(latest&&!latest.legacy&&(latest.closingTreasury!==c.fiscal.treasury||latest.closingDebt!==c.fiscal.debt))fail();
  }
}
