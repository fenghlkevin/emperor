// Shared quantity editor. Keep the original input and its handlers intact.
const limits=new WeakMap(),editors=new WeakMap();
export function affordableMaximum(ceiling,affordable){
 let lo=0,hi=Math.max(0,Math.floor(ceiling));
 while(lo<hi){const mid=lo+Math.ceil((hi-lo)/2);if(affordable(mid))lo=mid;else hi=mid-1;}
 return lo;
}
export function setQuantityLimits(root,resolve){limits.set(root,resolve);refreshQuantityControls(root);}
function bounds(input){
 const editor=editors.get(input);
 if(editor&&input.max!==editor.lastMax)editor.declaredMax=input.max;
 const declared=editor?.declaredMax??input.max;
 let max=declared===''?Number.MAX_SAFE_INTEGER:Number(declared);
 for(let el=input.parentElement;el;el=el.parentElement){const resolve=limits.get(el);if(resolve){const limit=resolve(input);if(Number.isFinite(limit))max=Math.min(max,Math.max(0,Math.floor(limit)));break;}}
 if(editor&&input.min!==editor.lastMin)editor.declaredMin=input.min;
 const min=Math.min(max,Number(editor?.declaredMin??input.min)||0);
 return {min,max};
}
export function clampQuantity(value,min,max,step=1){
 if(!Number.isFinite(value))return min;
 return Math.max(min,Math.min(max,Number((min+Math.round((value-min)/step)*step).toFixed(8))));
}
function sync(input,clamp=false){
 const editor=editors.get(input);if(!editor)return;
 const {min,max}=bounds(input),step=input.step==='any'?1:Number(input.step)||1;
 if(input.min!==String(min))input.min=String(min);
 // Only persist explicit/dynamic maxima; unbounded settings keep their original semantics.
 if(max!==Number.MAX_SAFE_INTEGER&&input.max!==String(max))input.max=String(max);
 if(clamp&&input.value!=='')input.value=String(clampQuantity(input.valueAsNumber,min,max,step));
 editor.lastMax=input.max;editor.lastMin=input.min;
 const disabled=input.disabled||input.readOnly||max<=min;
 for(const el of [editor.min,editor.max,editor.range])el.disabled=disabled;
 editor.range.min=String(min);editor.range.max=String(max);editor.range.step=String(step);
 editor.range.value=input.value||String(min);
 editor.min.title=`最小 ${min.toLocaleString('zh-CN')}`;editor.max.title=`最大 ${max.toLocaleString('zh-CN')}`;
 editor.range.setAttribute('aria-valuetext',`${input.value||min} / ${max}`);
}
export function refreshQuantityControls(root=document,normalize=false){
 for(const input of root.querySelectorAll('input[type=number]')){
  if(input.closest('.game-editor,[data-quantity-ignore]'))continue;
  if(!editors.has(input)){
   const doc=input.ownerDocument,bar=doc.createElement('span'),range=doc.createElement('input'),min=doc.createElement('button'),max=doc.createElement('button');
   bar.className='quantity-controls';range.type='range';range.setAttribute('aria-label',`${input.getAttribute('aria-label')||'数量'}滑条`);
   min.type=max.type='button';min.textContent='Min';max.textContent='Max';
   const apply=value=>{if(input.disabled||input.readOnly)return;const b=bounds(input);input.value=String(clampQuantity(Number(value),b.min,b.max,input.step==='any'?1:Number(input.step)||1));input.dispatchEvent(new doc.defaultView.Event('input',{bubbles:true}));input.dispatchEvent(new doc.defaultView.Event('change',{bubbles:true}));sync(input);};
   min.onclick=()=>apply(bounds(input).min);max.onclick=()=>apply(bounds(input).max);range.oninput=()=>apply(range.value);
   bar.append(min,range,max);input.after(bar);editors.set(input,{bar,range,min,max,declaredMax:input.max,lastMax:input.max,declaredMin:input.min,lastMin:input.min});
  }
  const before=input.value;sync(input,normalize);
  if(normalize&&input.value!==before&&input.isConnected)input.dispatchEvent(new input.ownerDocument.defaultView.Event('input',{bubbles:true}));
 }
}
export function installQuantityControls(doc){
 // Capture before the screen's draft handler so typed and pasted values are bounded.
 doc.addEventListener('input',e=>{if(e.target.matches?.('input[type=number]')){refreshQuantityControls(e.target.closest('dialog')||doc);sync(e.target,true);}},true);
 doc.addEventListener('change',e=>{if(e.target.matches?.('input[type=number]'))sync(e.target,true);},true);
 doc.addEventListener('change',()=>refreshQuantityControls(doc));
 doc.addEventListener('input',e=>{if(e.target.matches?.('input[type=number]'))queueMicrotask(()=>{if(e.target.isConnected)refreshQuantityControls(e.target.closest('dialog')||doc);});},true);
 doc.addEventListener('input',e=>{if(e.target.matches?.('input[type=number]'))refreshQuantityControls(e.target.closest('dialog')||doc);});
 new doc.defaultView.MutationObserver(records=>{if(records.some(r=>r.type==='childList'||r.target.matches?.('input[type=number]')))refreshQuantityControls(doc,true);}).observe(doc.body,{childList:true,subtree:true,attributes:true,attributeFilter:['max','min','disabled','readonly']});
 refreshQuantityControls(doc);
}
if(typeof document!=='undefined')installQuantityControls(document);
