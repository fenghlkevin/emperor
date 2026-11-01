import {commitOperation} from './operation-result.mjs';
import {configureProjectRush,quoteProjectRush,findProject,cancelProjectWork} from './project-work-orders.mjs';
export function projectWorkControls(state,p,kind){
 if(p.resourceRulesVersion!==1||!findProject(state.domestic,p,kind))return '';
 const rush=Boolean(findProject(state.domestic,p,kind).workOrder?.rush);
 return `<section class="project-work-controls"><h3>工程进度</h3><form data-project-work="${kind}" data-project-province="${p.id}"><label><input type="checkbox" name="rush" ${rush?'checked':''}>加急修建</label><p>自动施工至完工；受灾或缺员时暂停，条件恢复后自动继续。加急只增加银两支出。</p><p data-work-preview aria-live="polite"></p><button type="submit">${rush?'改为常规修建':'加急修建'}</button><p data-work-status role="status"></p></form>${kind==='special'?'':`<button type="button" data-cancel-project="${kind}" data-province="${p.id}">停建工程</button><p>已付费用不退，释放后续民夫占用。</p><p data-cancel-status role="status"></p>`}</section>`;
}
export function bindProjectWorkControls(root,state,onCommit,onResult){
 root.querySelectorAll('[data-cancel-project]').forEach(button=>button.onclick=()=>{try{const result=cancelProjectWork(state,button.dataset.province,button.dataset.cancelProject,state.domestic.industryActions.nextId);commitOperation(onCommit,result.state);onResult(result);}catch(error){button.parentElement.querySelector('[data-cancel-status]').textContent=error.message;}});
 root.querySelectorAll('[data-project-work]').forEach(form=>{
  const initial=form.elements.rush.checked;
  const preview=()=>{try{const rush=form.elements.rush.checked,q=quoteProjectRush(state,form.dataset.projectProvince,form.dataset.projectWork,rush);form.querySelector('[data-work-preview]').textContent=`预计剩余 ${q.fastTurns} 旬 · 占用民夫 ${q.workers} 人 · 加急额外 ${q.perTurn} 两/旬。${q.blockedReason??''}`;form.querySelector('button').hidden=rush===initial;form.querySelector('button').textContent=rush?'加急修建':'改为常规修建';}catch(e){form.querySelector('[data-work-preview]').textContent=e.message;}};
  form.onchange=preview;form.onsubmit=e=>{e.preventDefault();try{const result=configureProjectRush(state,form.dataset.projectProvince,form.dataset.projectWork,form.elements.rush.checked);commitOperation(onCommit,result.state);onResult(result);}catch(e){form.querySelector('[data-work-status]').textContent=e.message;}};preview();
 });
}
