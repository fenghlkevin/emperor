import {countrySummary} from './domestic.mjs';

const fmt=n=>Number(n).toLocaleString('zh-CN');
// Compare reserves with the country's own recurring budget, rather than an
// arbitrary fixed sum. Debt is independent of cash; never net them together.
export function governanceSummary(state){
 const d=state.domestic,q=countrySummary(d,undefined,state.turn),{treasury,debt}=q.country.fiscal;
 const debtState=debt<=0?'none':debt>=Math.max(1,q.income)*3?'heavy':'light';
 const cashState=treasury>0&&treasury>=Math.max(1,q.expenditure)*3?'rich':'low';
 const scene=treasury>0||debtState==='none'?cashState:debtState;
 const actual=q.country.ledger.find(row=>row.turn===state.turn&&!row.legacy)??null;
 return {treasury,debt,debtState,cashState,scene,income:q.income,expenditure:q.expenditure,net:q.net,
  provinces:q.provinces.length,delegations:q.provinces.filter(p=>d.personnel.delegations.includes(p.id)).length,
  projects:q.provinces.filter(p=>p.construction.project).length,special:Boolean(d.specialWorks.project),actual,turn:state.turn};
}
export function governanceSummaryMarkup(state){
 const s=governanceSummary(state),max=Math.max(1,s.income,s.expenditure);
 const label=s.treasury===0&&s.debt===0?'国库暂无余银':({rich:'钱粮充盈',low:'国库吃紧',light:'轻度负债',heavy:'重度负债'})[s.scene];
 const debtLabel=({none:'暂无国债',light:'轻度负债',heavy:'重度负债'})[s.debtState];
 const art=(kind,extra='')=>`<div class="governance-art governance-art--${kind} ${extra}" aria-hidden="true"></div>`;
 const stat=(name,value,unit='两',extra='')=>`<div class="governance-stat ${extra}"><span>${name}</span><strong>${fmt(value)}<small>${unit}</small></strong></div>`;
 return `<div class="governance-scroll" data-treasury-scene="${s.scene}" data-debt-state="${s.debtState}">
  <p class="governance-scope">汇总国情与协调呈奏，具体事项由主管部门办理。<span>第 ${s.turn} 旬</span></p>
  <div class="governance-main">
   <section class="governance-treasury" aria-label="国库钱粮：${label}，${debtLabel}">
    <h2>国库钱粮 <small>${label}</small></h2>${art('treasury')}
    <div class="governance-reserves">${stat('国库现银',s.treasury)}${stat('国债',s.debt,'两',s.debt?'is-deficit':'')}<span class="governance-debt-label">${debtLabel}</span></div>
   </section>
   <section class="governance-budget" aria-label="当前预算预计">
    <h2>当前预算预计</h2>${art('accounts')}
    <div class="governance-budget-lines">
     <div><span>预计收入</span><strong>${fmt(s.income)} <small>两 / 旬</small></strong><meter min="0" max="${max}" value="${s.income}" aria-label="预计收入">${fmt(s.income)}</meter></div>
     <div class="is-deficit"><span>预计支出</span><strong>${fmt(s.expenditure)} <small>两 / 旬</small></strong><meter min="0" max="${max}" value="${s.expenditure}" aria-label="预计支出">${fmt(s.expenditure)}</meter></div>
     <div class="governance-net ${s.net<0?'is-deficit':''}"><span>预计净额</span><strong>${s.net>0?'+':''}${fmt(s.net)} <small>两 / 旬</small></strong></div>
    </div>
   </section>
  </div>
  <div class="governance-secondary">
   <section class="governance-registers"><h2>州郡与委任</h2>${art('registers')}<div class="governance-secondary-stats">${stat('本国州数',s.provinces,'州')}${stat('地方委任',s.delegations,'州')}</div></section>
   <section class="governance-works" data-works-state="${s.projects||s.special?'active':'idle'}"><h2>营造工程</h2>${art(s.projects||s.special?'building':'plans')}<div class="governance-secondary-stats">${stat('在建普通工程',s.projects,'项')}<div class="governance-stat"><span>全国特殊工程</span><strong>${s.special?'在建':'无'}</strong></div></div></section>
  </div>
  <footer class="governance-settlement" aria-label="本旬实际结算"><h2>本旬已结算 <small>第 ${s.turn} 旬</small></h2>${s.actual?`${stat('实收',s.actual.income)}${stat('实付',s.actual.expenditure,'两','is-deficit')}${stat('期末',s.actual.closingTreasury)}`:'<p>本旬尚无结算记录</p>'}</footer>
 </div>`;
}
