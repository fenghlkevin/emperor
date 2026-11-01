import {medicalQuote,treatEmperor} from './medical.mjs';
import {commitOperation} from './operation-result.mjs';
const esc=v=>String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function openMedical(initial,root,onCommit,onClose){
 let state=initial,message='',busy=false;
 const d=document.createElement('dialog');d.className='medical-dialog';d.setAttribute('aria-label','太医院');
 d.onclose=()=>{d.remove();onClose?.();};root.append(d);
 function draw(){
  const q=medicalQuote(state),a=state.stats,treated=state.endings.lastTreatmentTurn===state.turn;
  d.innerHTML=`<header><div><small>内廷医署 · 奉旨调养</small><h1>太医院</h1></div><button data-medical-close aria-label="离开太医院">离院 ×</button></header><section class="medical-body"><div class="medical-doctor"><img class="medical-scenery" src="assets/scenes/medical/sketch-medical-v1.png" alt="太医院内，太医为皇帝请脉，药柜与药炉陈列两侧" draggable="false"><small>值院太医</small><h2>${treated?'药已服下，静养为宜':'请陛下入座，容臣请脉'}</h2><p>病体宜养，苦药亦有耗损。诊治可改善健康，服药后会略感疲乏，心绪也需慢慢调适。</p></div><div class="medical-prescription"><small>御脉与方笺</small><div class="medical-health"><span>当前健康</span><strong data-medical-health>${a.health}<small> / 100</small></strong></div><meter min="0" max="100" value="${a.health}" aria-label="当前健康"></meter><dl><div><dt>诊治恢复</dt><dd>健康 +${Math.max(0,q.healthGain)}</dd></div><div><dt>药后疲乏</dt><dd>体力 −${q.energyLoss}</dd></div><div><dt>苦药不适</dt><dd>快乐 −${q.happinessLoss}</dd></div><div><dt>本次诊金</dt><dd>${q.cost.toLocaleString('zh-CN')} 两</dd></div></dl><p class="medical-rule">每旬只诊治一次，与紧急诊治共用次数。药后疲乏会保留至少1点体力；体力已经耗尽也可就诊，不额外扣寿元。</p></div></section><footer><p role="status">${esc(message||q.block||'健康未满即可就诊，无须等到病重。')}</p><button class="primary" data-medical-treat ${busy||q.block?'disabled':''}>${treated?'本旬已诊治':'就诊服药'}</button></footer>`;
  d.querySelector('[data-medical-close]').onclick=()=>d.close();
  d.querySelector('[data-medical-treat]').onclick=()=>{
   if(busy)return;busy=true;
   try{const result=treatEmperor(state);state=commitOperation(onCommit,result.state);message=result.message;}catch(e){message=e.message;}
   finally{busy=false;draw();}
  };
 }
 draw();d.showModal();return d;
}
