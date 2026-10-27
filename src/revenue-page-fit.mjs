// Keep the minister's current task on one sheet, including its confirmation.
export function fitRevenuePage(area){
 if(!area)return;
 const sheet=document.createElement('div');sheet.className='revenue-fit-sheet';
 sheet.append(...area.childNodes);area.append(sheet);area.classList.add('revenue-fit-area');
 let pending=false;
 const fit=()=>{pending=false;if(!area.isConnected)return;sheet.style.transform='none';sheet.style.width=area.clientWidth+'px';const available=area.clientHeight,needed=sheet.scrollHeight;const scale=Math.min(1,available/Math.max(1,needed));sheet.style.transform=`scale(${scale})`;};
 const schedule=()=>{if(!pending){pending=true;requestAnimationFrame(fit);}};
 const resize=new ResizeObserver(schedule);resize.observe(area);resize.observe(sheet);
 const changes=new MutationObserver(schedule);changes.observe(sheet,{childList:true,subtree:true,characterData:true});
 area.addEventListener('toggle',schedule,true);document.fonts.ready.then(schedule);schedule();
 const dialog=area.closest('dialog');dialog?.addEventListener('close',()=>{resize.disconnect();changes.disconnect();},{once:true});
}
export function compactRevenueNotes(root,selector){
 for(const el of root.querySelectorAll(selector)){const text=el.textContent.trim();if(!text||el.querySelector('button,input,select'))continue;el.textContent='?';el.title=text;el.setAttribute('aria-label',text);el.tabIndex=0;el.classList.add('revenue-help');}
}
