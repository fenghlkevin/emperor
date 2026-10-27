import {militaryPaper,militaryEsc as esc,militaryFmt as fmt} from './army-recovery-ui.mjs';
// Small ink drawings keep the review legible without replacing live figures with artwork.
const drawings={army:'M12 42V8m0 2h28l-6 9 6 9H12m-5 14h14',reserve:'M8 40V24l16-16 16 16v16M17 40V27h14v13M6 40h36',people:'M18 18a6 6 0 1 0 0-12 6 6 0 0 0 0 12m-10 22V29a10 10 0 0 1 20 0v11m4-22a5 5 0 1 0 0-10m1 15a9 9 0 0 1 8 9v8',silver:'M7 23l7 16h20l7-16-10 6H17L7 23m10-8a7 7 0 1 1 14 0 7 7 0 1 1-14 0',grain:'M24 42V9m0 9C10 18 10 8 10 8c12 0 14 10 14 10m0 10C10 28 10 18 10 18c12 0 14 10 14 10m0-10C38 18 38 8 38 8c-12 0-14 10-14 10m0 20c14 0 14-10 14-10-12 0-14 10-14 10',gear:'M10 8l28 30m0-30L10 38M7 28l13 13m8-34 13 13M8 40l-2 3m34-3 3 3'};
const icon=kind=>`<svg class="campaign-ink-icon" viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${drawings[kind]}"/></svg>`;
const meter=(value,max,label)=>`<svg class="campaign-meter" viewBox="0 0 100 7" preserveAspectRatio="none" role="img" aria-label="${esc(label)}"><rect width="100" height="7" class="campaign-meter-track"/><rect width="${Math.min(100,Math.max(0,Number(value)/Math.max(1,max)*100))}" height="7" class="campaign-meter-fill"/></svg>`;
export function drawCampaignReview(d,state,draft,{onEdit,onSeal}){
 let page=0;
 function draw(){
  const r=draft.replacement,controls=page===0?`<h3>${draft.riskLabel}</h3><div class="recovery-cost-grid"><div><small>我军出征 / 训练</small><b>${fmt(draft.count)} 人 / ${draft.training}</b></div><div><small>敌方本地 / 训练</small><b>${fmt(draft.enemy)} 人 / ${draft.enemyTraining}</b></div><div><small>中央预备队</small><b>${fmt(draft.reserve)} 人</b></div><div><small>当前可征空闲劳力</small><b>${fmt(draft.idle)} 人</b></div></div><p class="recovery-risk">${esc(draft.warning)}</p><p>敌方人数不含可能援军。将领、兵种、训练与地形均影响战果，兵力比例不代表胜率。</p>`:`<h3>核对全损后的重建代价</h3><div class="recovery-cost-grid"><div><small>本次额外整备</small><b>${fmt(draft.supply.silver)} 两</b></div><div><small>本次额外补给</small><b>${fmt(draft.supply.grain)} 石</b></div><div><small>全损补员、补装估算</small><b>${r.total===null?'当前无法购齐':fmt(r.total)+' 两'}</b></div><div><small>重建资金缺口</small><b>${r.total===null?'待补采购来源':fmt(Math.max(0,r.total+draft.supply.silver-state.stats.treasury))+' 两'}</b></div></div><p class="recovery-risk">${esc(r.blocked??'报价只含出征补给；阵亡按兵种扣除装备与人口。重建另付银，不会自动补偿。')}</p><p>全损估算按当前采购价；训练、常规驻防钱粮另计。补员须有真实劳力，缺额${fmt(Math.max(0,draft.count-draft.idle))}人需从产业抽调。国库 ${fmt(state.stats.treasury)} 两。</p>`;
  militaryPaper(d,{title:'出征核阅',subtitle:draft.targetProvince+' · 战前核价',facts:[['我军 / 敌方',fmt(draft.count)+' / '+fmt(draft.enemy)],['兵力比例',draft.ratio+'%'],['重建估算',r.total===null?'待核':fmt(r.total)+' 两']],controls,nav:`<button data-risk-page aria-label="切换出征核阅页">${page===0?'核对代价 →':'← 核对兵力'}</button>`,footer:`<div><small>第 ${page+1} / 2 页 · 核阅不扣款</small><p role="status" data-campaign-error>${draft.count<draft.enemy?'兵力处于劣势，请确认是否继续。':'主将亲卫退场即判负，请核对预备队。'}</p></div><div class="military-paper-actions"><button data-campaign-edit>再布阵</button><button class="primary" data-campaign-seal>落印出征</button></div>`});
  d.classList.add('court-campaign','campaign-review-page');
  const cards=d.querySelectorAll('.recovery-cost-grid>div');
  const kinds=page===0?['army','army','reserve','people']:['silver','grain','gear','silver'];
  cards.forEach((card,i)=>{card.insertAdjacentHTML('afterbegin',icon(kinds[i]));});
  if(page===0){
   const maximum=Math.max(draft.count,draft.enemy,1);
   [draft.count,draft.enemy].forEach((count,i)=>{
    cards[i].classList.add(i===0?'is-own':'is-enemy');
    cards[i].insertAdjacentHTML('beforeend',meter(count,maximum,`${i===0?'我军':'敌军'}兵力 ${fmt(count)} 人，同尺度对比`)+`<span class="campaign-training">训练 ${i===0?draft.training:draft.enemyTraining} / 100</span>`+meter(i===0?draft.training:draft.enemyTraining,100,'训练水平'));
   });
  }
  d.querySelector('[data-paper-close]').onclick=()=>d.close();d.querySelector('[data-risk-page]').onclick=()=>{page=1-page;draw();};d.querySelector('[data-campaign-edit]').onclick=onEdit;d.querySelector('[data-campaign-seal]').onclick=onSeal;
 }
 draw();
}
