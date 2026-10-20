// One delegated controller covers every ministry, including dynamically drawn forms.
const installed=new WeakMap();
export function holdStepProfile(elapsed){
 if(elapsed>=5000)return {interval:35,multiplier:100};
 if(elapsed>=2500)return {interval:50,multiplier:25};
 if(elapsed>=1000)return {interval:80,multiplier:5};
 return {interval:120,multiplier:1};
}
export function boundedStep(current,step,min=0,max=Number.MAX_SAFE_INTEGER){
 return Math.max(min,Math.min(max,Number((current+step).toFixed(8))));
}
function numericButton(target){
 const button=target?.closest?.('button');
 if(!button||!['+','＋','-','−','–'].includes(button.textContent.trim()))return null;
 const group=button.parentElement,input=group?.querySelector(':scope > input[type=number]');
 if(!input||button.disabled||input.disabled||input.readOnly)return null;
 const explicit=['atlasStep','fiscalStep','foodStep','step'].map(key=>button.dataset[key]).find(value=>value!==undefined);
 const direction=/^[+＋]$/.test(button.textContent.trim())?1:-1;
 const step=Math.abs(Number(explicit??(input.step==='any'?1:input.step||1)));
 if(!Number.isFinite(step)||step<=0)return null;
 return {button,input,direction,step,dialog:button.closest('dialog')};
}
export function installAcceleratingSteppers(doc){
 if(installed.has(doc))return installed.get(doc);
 const win=doc.defaultView;let active=null,timer=null,suppress=null;
 const matches=(a,b)=>a&&b&&a.input===b.input&&a.direction===b.direction;
 const stop=()=>{if(timer!==null)win.clearTimeout(timer);timer=null;active=null;};
 const apply=(control,multiplier)=>{
  const {input,button,dialog}=control;
  if(!input.isConnected||!button.isConnected||input.disabled||button.disabled||input.readOnly||dialog&&!dialog.open){stop();return false;}
  const min=input.min!==''?Number(input.min):0,max=input.max!==''?Number(input.max):Number.MAX_SAFE_INTEGER;
  const current=Number.isFinite(input.valueAsNumber)?input.valueAsNumber:(Number.isFinite(min)?min:0);
  const next=boundedStep(current,control.direction*control.step*multiplier,min,max);
  if(next===current)return false;
  input.value=String(next);
  input.dispatchEvent(new win.Event('input',{bubbles:true}));
  // These forms already keep their draft and preview in their input handlers.
  return true;
 };
 const tick=()=>{
  if(!active)return;
  const control=active,profile=holdStepProfile(win.performance.now()-control.started);
  if(!apply(control,profile.multiplier)){stop();return;}
  if(active===control)timer=win.setTimeout(tick,profile.interval);
 };
 const begin=(control,kind,pointerId)=>{
  stop();active={...control,kind,pointerId,started:win.performance.now()};
  suppress={...control,kind,until:Infinity};
  if(apply(active,1)&&active)timer=win.setTimeout(tick,350);else stop();
 };
 const end=()=>{if(suppress)suppress.until=win.performance.now()+700;stop();};
 const down=e=>{if(e.button!==0||e.isPrimary===false)return;const control=numericButton(e.target);if(!control)return;e.preventDefault();begin(control,'pointer',e.pointerId);};
 const click=e=>{const control=numericButton(e.target);if(control&&suppress&&win.performance.now()<=suppress.until&&matches(control,suppress)&&(e.detail>0||suppress.kind==='keyboard')){e.preventDefault();e.stopImmediatePropagation();suppress=null;}};
 const move=e=>{if(!active||active.kind!=='pointer'||e.pointerId!==active.pointerId)return;const r=active.button.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)end();};
 const out=e=>{if(active?.kind==='pointer'&&active.button.contains(e.target)&&!active.button.contains(e.relatedTarget))end();};
 const keydown=e=>{
  let control;
  if(['ArrowUp','ArrowDown'].includes(e.key)&&e.target.matches?.('dialog input[type=number]')&&!e.target.disabled&&!e.target.readOnly){const input=e.target;control={button:input,input,direction:e.key==='ArrowUp'?1:-1,step:Math.abs(Number(input.step==='any'?1:input.step||1)),dialog:input.closest('dialog')};}
  else if([' ','Enter'].includes(e.key))control=numericButton(e.target);
  if(!control||!Number.isFinite(control.step)||!control.step)return;
  e.preventDefault();if(!e.repeat)begin(control,'keyboard');
 };

 const keyup=e=>{if((active?.kind??suppress?.kind)==='keyboard'&&[' ','Enter','ArrowUp','ArrowDown'].includes(e.key)){e.preventDefault();end();}};
 const focusout=e=>{if(active?.kind==='keyboard'&&(active.button===e.target||active.input===e.target))end();};
 const visibility=()=>{if(doc.hidden)end();};
 const bindings=[['pointerdown',down],['click',click],['pointermove',move],['pointerout',out],['pointerup',end],['pointercancel',end],['keydown',keydown],['keyup',keyup],['focusout',focusout],['close',end],['visibilitychange',visibility]];
 for(const [event,handler] of bindings)doc.addEventListener(event,handler,true);
 win.addEventListener('blur',end);
 const cleanup=()=>{end();for(const [event,handler]of bindings)doc.removeEventListener(event,handler,true);win.removeEventListener('blur',end);installed.delete(doc);};
 installed.set(doc,cleanup);return cleanup;
}
if(typeof document!=='undefined')installAcceleratingSteppers(document);
