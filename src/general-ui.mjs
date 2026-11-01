import {PALACE_ATTENDANT_ART} from './palace-character-art.mjs';
import {developmentScene} from './development-page-ui.mjs';
import {balanced} from './development-balance.mjs';
import {commitOperation} from './operation-result.mjs';
import {GENERAL_TABS,quoteGeneral,executeGeneral,centralTrainingEffect,centralTrainingCost,ongoingTrainingStatus} from './general.mjs';
const fmt=n=>n.toLocaleString('zh-CN');
export function openGeneral(state,root,onCommit,onClose,options={}){
 const tab=['train','ongoing','security'].includes(options.tab)?options.tab:'train';
 const a=state.domestic.centralArmy,g=state.domestic.general,capital=state.domestic.provinces.find(p=>p.id===g.capitalProvinceId);
 const title=GENERAL_TABS.find(([id])=>id===tab)[1];
 const descriptions={train:`基础训练10点，按当前大将军能力预计提高${centralTrainingEffect(state.domestic,10).gain}点，最高100。${balanced(state.domestic)?`每旬限一次，需${centralTrainingCost(state.domestic,true)}两。`:'本次军务不扣国库。'}`,ongoing:`开启后按当前大将军能力每旬预计提高${centralTrainingEffect(state.domestic,2).gain}点，最高100。${balanced(state.domestic)?`实际训练每旬支银${centralTrainingCost(state.domestic)}两；满值或预算不足暂停扣费。`:`维持既定训练保底。`}无中央士兵时自动停止。`,security:`派中央士兵检视京城内外，将${capital.name}的治安值提高10，最高100，每旬限一次。`};
 const scenes={train:['assets/scenes/martial/sketch-martial-sparring-v2.png','军士操练武艺'],ongoing:[PALACE_ATTENDANT_ART.martial,'校场阅武与日常训练'],security:['assets/scenes/tour/sketch-tour-bandits.png','军士巡防地方，维护安定']};
 const trainingStatus=ongoingTrainingStatus(state.domestic);
 const facts=tab==='security'?[['京城',capital.name],['当前治安',capital.welfare.security+' / 100'],['中央士兵',fmt(a.soldiers)+' 人']]:[['中央士兵',fmt(a.soldiers)+' 人'],['训练值',a.training+' / 100'],['长期训练',trainingStatus.label]];
 const d=document.createElement('dialog');d.className='domestic-dialog ink-mode revenue-dialog development-page general-task-page';d.dataset.general=tab;d.setAttribute('aria-label','大将军 · '+title);root.append(d);d.onclose=()=>{d.remove();onClose?.();};
 d.innerHTML=`<header class="civil-header revenue-header"><div class="revenue-brand"><span class="revenue-seal">军<br>务</span><h1>${title}</h1><small>大将军府 · 中央统军</small></div><div class="revenue-header-end"><button class="close" aria-label="返回大将军">×</button></div></header><div class="revenue-body">${developmentScene({image:scenes[tab][0],alt:scenes[tab][1],title,subtitle:'大将军府 · 修我戈矛',facts,controls:`<p>${descriptions[tab]}</p>${tab==='ongoing'?`<form><label class="general-plan-toggle"><input type="checkbox" data-enabled ${g.ongoing?'checked':''}><span>开启长期训练</span></label><p>勾选开启，取消勾选停止；颁令保存计划，训练在下一旬结算时生效。</p><p data-training-status>${trainingStatus.reason}${trainingStatus.budget}</p></form>`:''}<div class="general-task-preview" data-preview aria-live="polite"></div>`})}</div><footer class="revenue-command"><div><span>拟定军令 · ${title}</span><p role="status" data-status></p></div><button class="primary" data-execute>颁令执行</button></footer>`;
 const command=()=>({id:g.nextId,kind:tab,enabled:d.querySelector('[data-enabled]')?.checked});
 const button=d.querySelector('[data-execute]'),status=d.querySelector('[data-status]');
 function preview(){if(tab==='ongoing'&&command().enabled===g.ongoing){button.disabled=true;status.textContent='训练计划未改变；修改勾选后可颁令保存。';d.querySelector('[data-preview]').textContent='';return;}try{const q=quoteGeneral(state,command());d.querySelector('[data-preview]').textContent=q.lines.join('；');status.textContent='确认后立即执行并自动保存。';button.disabled=!q.canAfford;}catch(error){button.disabled=true;status.textContent=error.message;d.querySelector('[data-preview]').textContent='';}}
 d.querySelector('.close').onclick=()=>d.close();d.querySelector('[data-enabled]')?.addEventListener('change',preview);d.querySelector('form')?.addEventListener('submit',e=>{e.preventDefault();button.click();});
 button.onclick=()=>{if(button.disabled)return;button.disabled=true;try{const result=executeGeneral(state,command());commitOperation(onCommit,result.state);d.close();}catch(error){status.textContent=error.message;button.disabled=false;}};
 preview();d.showModal();return d;
}
