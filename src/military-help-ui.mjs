export function openMilitaryHelp(root,title,text){
 const parts=text.split(/\n\s*\n/).filter(Boolean);let topic=0;
 const d=document.createElement('dialog');d.className='rites-help-dialog military-help-dialog';d.setAttribute('aria-label',title);
 const h=document.createElement('h2'),p=document.createElement('p'),picker=document.createElement('select'),close=document.createElement('button');h.textContent=title;close.textContent='关闭 ×';picker.setAttribute('aria-label','选择说明事项');
 parts.forEach((part,i)=>{const o=document.createElement('option');o.value=i;o.textContent=part.slice(0,24)+(part.length>24?'…':'');picker.append(o);});picker.hidden=parts.length<2;
 const draw=()=>{p.textContent=parts[topic]??'暂无补充说明';};picker.onchange=()=>{topic=Number(picker.value);draw();};d.append(h,picker,p,close);close.onclick=()=>d.close();d.onclose=()=>d.remove();root.append(d);draw();d.showModal();return d;
}
