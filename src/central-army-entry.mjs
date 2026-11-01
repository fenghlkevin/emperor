// Keep every selectable central depot visible beside its existing selector.
export function bindCentralArmyEntries(root){
 for(const select of root.querySelectorAll('select')){
  const option=[...select.options].find(o=>o.value==='central');
  if(!option||select.parentElement.querySelector('.garrison-central-entry'))continue;
  const button=document.createElement('button');button.type='button';button.className='garrison-central-entry';button.dataset.centralArmyEntry='';
  const label=select.getAttribute('aria-label')??(select.hasAttribute('data-kit-target')?'调入驻地':'驻地');
  button.textContent='中央禁军';button.setAttribute('aria-label',`${label}选择中央禁军`);
  const sync=()=>{button.disabled=select.disabled||option.disabled;button.setAttribute('aria-pressed',String(select.value==='central'));};
  button.onclick=()=>{if(button.disabled)return;select.value='central';select.dispatchEvent(new Event('change',{bubbles:true}));sync();};
  select.addEventListener('change',sync);select.after(button);sync();
 }
}
