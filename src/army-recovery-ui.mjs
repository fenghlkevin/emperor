import {recoveryAdvice} from './recovery-advice.mjs';
import {developmentScene} from './development-page-ui.mjs';
import {recoveryStatus,quoteArmyRecovery,executeArmyRecovery,recoveryPauseReason,recoveryCrisis} from './army-recovery.mjs';
import {worldKitDepot} from './troop-kit-world.mjs';
import {commitOperation} from './operation-result.mjs';
import {courtBlock} from './emperor.mjs';
export const militaryEsc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const militaryFmt=n=>Number(n??0).toLocaleString('zh-CN');
export function militaryPaper(d,{title,subtitle,facts,controls,footer,nav=''}){
 d.className='domestic-dialog ink-mode revenue-dialog development-page army-recovery-page';
 d.innerHTML=`<header class="civil-header revenue-header"><div class="revenue-brand"><span class="revenue-seal">兵<br>部</span><h1>${militaryEsc(title)}</h1><small>${militaryEsc(subtitle)}</small></div><div class="military-paper-nav">${nav}<button data-paper-close aria-label="关闭">×</button></div></header><div class="revenue-body">${developmentScene({image:'assets/scenes/tour/sketch-tour-veterans.png',alt:'归营将士与战后抚恤',title,subtitle:'整军有度 · 钱粮有据',facts,controls})}</div><footer class="revenue-command">${footer}</footer>`;
}
export function openArmyRecovery(initial,root,onCommit,onClose,{readOnly=false}={}){
 let state=initial,page='overview',error='',train=initial.domestic.armyRecovery?.plan?.train??true,draft=initial.domestic.armyRecovery?.plan?.draft??true,debtRecovery=initial.domestic.armyRecovery?.plan?.debtRecovery??!initial.domestic.armyRecovery?.plan,cap=initial.domestic.armyRecovery?.plan?.active?initial.domestic.armyRecovery.plan.cap:undefined,amount;
 const d=document.createElement('dialog');d.setAttribute('aria-label','战后军备恢复');root.append(d);d.onclose=()=>{d.remove();onClose?.();};
 function draw(){
  const status=recoveryStatus(state.domestic),p=status?.plan,active=p?.active,t=status?.target,a=state.domestic.centralArmy,stock=worldKitDepot(state.domestic,'central').stock;
  const pending=Boolean(state.domestic.armyRecovery?.offer&&status&&(status.gaps.soldiers||Object.values(status.gaps.kits).some(n=>n)||status.gaps.training));
  let q;try{q=quoteArmyRecovery(state,{train});}catch(e){if(status)error=e.message;}
  cap??=q?.suggestedCap??50000;
  amount??=Math.max(1,(q?.suggestedCap??1)-Math.max(0,(p?.cap??0)-(p?.spent??0)));
  const pendingAuthorization=pending&&!active,paid=pendingAuthorization?(q?.carriedSpent??0):(p?.spent??0),limit=pendingAuthorization?paid+cap:(p?.cap??cap);
  const sum=o=>Object.values(o).reduce((n,v)=>n+v,0),gear=t?Object.keys(t.kits).reduce((n,k)=>n+Math.min(stock[k],t.kits[k]),0):sum(stock);
  const facts=[['兵员 / 目标',`${militaryFmt(a.soldiers)} / ${militaryFmt(t?.soldiers??a.soldiers)}`],['兵装 / 目标',`${militaryFmt(gear)} / ${militaryFmt(t?sum(t.kits):gear)}`],['训练 / 目标',`${a.training} / ${t?.training??a.training}`]];
  const pauseReason=active?recoveryPauseReason(state.domestic,state.turn):'';
  let controls;
  if(page==='terms')controls=`<form data-recovery-form><label>${active?'累计支出上限':'本次新增可用额度'} / 两<input data-recovery-cap type="number" min="1" max="1000000000" step="1" value="${cap}" ${active||readOnly?'disabled':''}></label><label>训练目标<select data-recovery-train ${active||readOnly?'disabled':''}><option value="yes" ${train?'selected':''}>恢复战前训练</option><option value="no" ${!train?'selected':''}>只补兵员与兵装</option></select></label><label>劳力来源<select data-recovery-draft ${active||readOnly?'disabled':''}><option value="yes" ${draft?'selected':''}>先用空闲劳力，缺额可抽调产业</option><option value="no" ${!draft?'selected':''}>仅用空闲劳力，不足则等待</option></select></label><label>偿债期间最低战备<select data-recovery-debt ${active||readOnly?'disabled':''}><option value="yes" ${debtRecovery?'selected':''}>授权从安全结余付费恢复</option><option value="no" ${!debtRecovery?'selected':''}>先付清本金，再恢复</option></select></label></form><p>每旬最多实付1,400两；偿债期间最多350两，且不超过常规结余的25%。本金、利息照付，不举债整军。</p><p>产业抽调每业许可10%，只取当批缺额。可办理整军时治理暂限350两；偿债、钱粮或危机暂停时解除。应急金与亏损缓冲见“钱粮”。</p>`;
  else if(page==='funds')controls=`<h3>实有资金 · 量入整军</h3><div class="recovery-cost-grid"><div><small>计划锁定 / 当前治理保留金</small><b>${militaryFmt(q?.lockedReserve??7000)} / ${militaryFmt(q?.governanceReserve??7000)} 两</b></div><div><small>常规亏损缓冲 / 实际门槛</small><b>${militaryFmt(q?.deficitBuffer)} / ${militaryFmt(q?.reserve??7000)} 两</b></div><div><small>国债本金 / 常规旬结余</small><b>${militaryFmt(q?.debt)} / ${militaryFmt(q?.net)} 两</b></div><div><small>门槛以上现银 / 本旬限额</small><b>${militaryFmt(q?.available)} / ${militaryFmt(q?.turnLimit??1400)} 两</b></div></div><p>实际保留${militaryFmt(q?.reserve??7000)}两；两条保留线取高值，再加六旬常规亏损。降低治理保留金不会暗中降低已核准的保护线。</p><p>${q?.debt?'债务本金与利息照常偿付。只有已授权、债务未增加且常规收支为正时，才使用实有结余整军。':'口粮和常规开支先结算，恢复计划不预扣全款、不自动借债。'}</p>`;
  else if(page==='advice'){
   const advice=recoveryAdvice(state);
   controls=`<h3>先稳收支，再量入整军</h3><div class="recovery-cost-grid">${advice.taxOptions.map(o=>`<div><small>${o.rate}%税率 · 当前产出估算结余</small><b>${o.net>0?'+':''}${militaryFmt(o.net)} 两 / 旬</b></div>`).join('')}</div><p>亏损时可到户部核阅22%或24%的临时税率，收支稳定后回调。持续高于24%会累积税负积怨，不能靠特赦长期抵消。</p><p>先保供粮，必要时实付购粮、赈灾；暂缓新出征和额外长期训练。需要提前恢复基本兵力时，可明确授权偿债期间最低战备，本金与利息照付。</p><p>调整原授权须由兵部先停止再核准，目标与实付保留。估算随灾损和税压变化，不保证未来实收。</p>`;
  }
  else if(page==='extend')controls=`<h3>续批恢复额度</h3><div class="recovery-cost-grid"><div><small>原累计实付 / 原核准上限</small><b>${militaryFmt(p?.spent)} / ${militaryFmt(p?.cap)} 两</b></div><div><small>原可用余额 / 当前恢复估算</small><b>${militaryFmt(Math.max(0,(p?.cap??0)-(p?.spent??0)))} / ${militaryFmt(q?.total)} 两</b></div></div><form data-recovery-form><label>本次追加上限 / 两<input data-recovery-amount type="number" min="1" max="${1000000000-(p?.cap??0)}" step="1" value="${amount}" ${readOnly?'disabled':''}></label></form><p data-recovery-total>追加后总上限 ${militaryFmt((p?.cap??0)+amount)} 两。原已付、恢复目标及训练和劳力授权均保留。</p><p>落印仅增加授权，不预扣款、不退还旧费用；仍按真实价格逐旬办理。</p>`;
  else if(page==='gear')controls=`<div class="recovery-gear-grid">${Object.entries(t?.kits??stock).map(([k,n])=>`<div><small>${militaryEsc(({infantry:'刀盾兵',spears:'长枪兵',cavalry:'轻骑兵','heavy-cavalry':'重骑兵',archers:'弓兵',crossbows:'弩兵',camel:'骆驼兵',elephant:'象兵','horse-archers':'弓骑兵'})[k])}</small><b>${militaryFmt(stock[k])} / ${militaryFmt(n)}</b></div>`).join('')}</div><p>先用实有兵装编成最多300人的队伍，授权训练时先练至40（原目标较低则从低），再补全军备。各项分别实付，原目标与累计实付保留。</p>`;
  else controls=`<h3>${active?'恢复计划正在执行':pending?'中央军战损待恢复':p?.completedTurn?'恢复目标已达成':status?'中央军战损待恢复':'中央军暂无战损记录'}</h3><p>${militaryEsc((pauseReason?pauseReason+'；可查看“建议”页核阅恢复方案':'')||(((active||!pending||!p?.completedTurn||!status?.gaps.soldiers&&!Object.values(status.gaps.kits).some(n=>n))?p?.status:null)??(status?.severe?'中央军重创，可优先整军。':'可从战报核阅恢复目标，原有兵装与人口不会重置。')))}</p><div class="recovery-cost-grid"><div><small>当前价估算 · 补员补装</small><b>${q?militaryFmt(q.gear+q.recruit)+' 两':'—'}</b></div><div><small>保守估算 · 训练另付</small><b>${q?militaryFmt(q.trainingCost)+' 两':'—'}</b></div><div><small>国库实有</small><b>${militaryFmt(state.stats.treasury)} 两</b></div><div><small>本计划已付 / 上限</small><b data-recovery-account>${militaryFmt(paid)} / ${militaryFmt(limit)} 两</b></div></div><p>新战损、停办与续批均保留尚未恢复的兵员、兵装和训练目标。估算随实价变化，全部扣款受核准上限约束。</p>`;
  const blocked=courtBlock(state)||(recoveryCrisis(state.domestic)?'请先处理本国战斗、参援或朝廷危机':''),renewal=active&&p.waitingCap;
  militaryPaper(d,{title:'战后恢复',subtitle:readOnly?'中央军务 · 只读指引':'兵部尚书 · 量入整军',facts,controls,nav:['overview','terms','funds','gear','advice'].map((id,i)=>`<button data-recovery-page="${id}" aria-pressed="${page===id}">${['进度','核准','钱粮','兵装','建议'][i]}</button>`).join(''),footer:`<div><small>${active?(renewal?'等待续批额度':recoveryPauseReason(state.domestic,state.turn)?'暂停条件见进度页':'按授权余额续办'):'仅核准计划，不预扣款'} · 国库 ${militaryFmt(state.stats.treasury)} 两</small><p role="status" data-recovery-error>${militaryEsc(error||blocked||'战争损失保留，全部恢复费用实际支付。')}</p></div><div class="military-paper-actions">${active?`<button ${readOnly||blocked?'disabled':''} ${page==='extend'||renewal?'data-recovery-stop':'data-recovery-renew'}>${page==='extend'||renewal?'停止计划':'续批额度'}</button>`:''}<button class="primary" data-recovery-execute ${readOnly||blocked||(!active&&(!pending||!q))?'disabled':''}>${readOnly?'请召兵部尚书':active?(page==='extend'?'落印续批额度':renewal?'续批恢复额度':'停止恢复计划'):'核准优先恢复'}</button></div>`});
  d.querySelector('[data-paper-close]').onclick=()=>d.close();
  d.querySelectorAll('[data-recovery-page]').forEach(b=>b.onclick=()=>{page=b.dataset.recoveryPage;draw();});
  d.querySelector('[data-recovery-cap]')?.addEventListener('input',e=>{cap=e.target.value===''?NaN:Number(e.target.value);});
  d.querySelector('[data-recovery-train]')?.addEventListener('change',e=>{train=e.target.value==='yes';cap=undefined;draw();});
  d.querySelector('[data-recovery-draft]')?.addEventListener('change',e=>{draft=e.target.value==='yes';});
  d.querySelector('[data-recovery-debt]')?.addEventListener('change',e=>{debtRecovery=e.target.value==='yes';});
  d.querySelector('[data-recovery-amount]')?.addEventListener('input',e=>{amount=e.target.value===''?NaN:Number(e.target.value);d.querySelector('[data-recovery-total]').textContent=`追加后总上限 ${Number.isSafeInteger(amount)?militaryFmt((p?.cap??0)+amount):'—'} 两。原已付与恢复目标保留。`;});
  d.querySelector('[data-recovery-form]')?.addEventListener('submit',e=>e.preventDefault());
  const submit=kind=>{try{if(readOnly)throw Error('恢复额度请召兵部尚书核准');const reason=courtBlock(state);if(reason)throw Error(reason);const r=executeArmyRecovery(state,{id:state.domestic.armyRecovery?.nextId??1,kind,train,draft,debtRecovery,cap,amount});commitOperation(onCommit,r.state);state=r.state;error=r.message;amount=undefined;if(kind==='extend'){page='overview';cap=state.domestic.armyRecovery.plan.cap;}if(kind==='cancel'){cap=undefined;page='overview';}draw();}catch(e){error=e.message;d.querySelector('[data-recovery-error]').textContent=error;}};
  d.querySelector('[data-recovery-renew]')?.addEventListener('click',()=>{page='extend';error='';draw();});
  d.querySelector('[data-recovery-stop]')?.addEventListener('click',()=>submit('cancel'));
  d.querySelector('[data-recovery-execute]').onclick=()=>{if(active&&renewal&&page!=='extend'&&!readOnly){page='extend';error='';draw();return;}submit(active?(page==='extend'?'extend':'cancel'):'start');};
 }
 draw();d.showModal();return d;
}
