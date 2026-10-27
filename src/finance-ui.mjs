const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fmt=n=>Number(n).toLocaleString('zh-CN');
const table=(headers,rows)=>`<div class="civil-table"><table><thead><tr>${headers.map(h=>`<th>${h}</th>`).join('')}</tr></thead><tbody>${rows.map(row=>`<tr>${row.map(v=>`<td>${v}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
export function financeHistory(country,turn){
  const latest=country.ledger[0];
  if(!latest)return '<h3>国库实际流水</h3><p class="civil-note">尚无收付记录；首笔交易或旬结算时建立期初余额。</p>';
  const history=table(['旬序 / 状态','期初国库','实际收入','实际支出','现金净变动','期末国库','新增债务'],country.ledger.map(r=>[
    `${r.turn} · ${r.legacy?'旧版常规收支':r.turn===turn?'本旬实时':'已封账'}`,
    r.legacy?'—':fmt(r.openingTreasury),fmt(r.income),fmt(r.expenditure),fmt(r.net),fmt(r.closingTreasury),r.legacy?'—':fmt(r.debtAdded)]));
  if(latest.legacy)return `<h3>国库实际流水</h3>${history}<p class="civil-note">旧版记录仅包含当时的常规收支；迁移保留实际余额，新交易从该余额开始完整记账。</p>`;
  const labels={regular:'常规财政',oneOff:'政令与事件',transfer:'转账与履约'};
  const categories=table(['本期分类','实际收入','实际支出','新增应付未付'],Object.entries(latest.categories).map(([key,v])=>[labels[key],fmt(v.income),fmt(v.expenditure),fmt(v.debtAdded)]));
  const entries=table(['交易号','事项','实际收入','实际支出','新增债务','偿还本金','交易后国库'],latest.entries.slice(-20).reverse().map(e=>[e.id,esc(e.reason),fmt(e.income),fmt(e.expenditure),fmt(e.debtAdded),fmt(e.debtRepaid??0),fmt(e.treasuryAfter)]));
  return `<h3>国库实际流水</h3><p class="civil-note">上方为常规预算预测；下方记录实际收付，含政令、外交和祥瑞。内部转账不代表全国新增财富。</p>${history}<h3>最新一期分类</h3>${categories}<p class="civil-note">余额核对：${fmt(latest.openingTreasury)} + ${fmt(latest.income)} − ${fmt(latest.expenditure)} = ${fmt(latest.closingTreasury)} 两；国债 ${fmt(latest.closingDebt)} 两。</p><h3>最新一期最近20笔交易</h3>${entries}<p class="civil-note">每旬保留最近100笔明细，更早明细并入结转汇总；完整旬流水保留36旬，另存72旬经营收支摘要；经营收支包含持续训练、密查等经常支出，工程、救灾与偿还本金另列。</p>`;
}
