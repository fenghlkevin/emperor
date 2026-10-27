import {EDITOR_FIELDS,editorObjects,editorValue,editorAvailable,applyEditorChanges} from './game-editor.mjs';
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function openGameEditor(initial,commit){
 let state=initial,kind='people',selected='',query='',pending=null,undo=null,dirty=false;
 const d=document.createElement('dialog');d.className='game-editor';d.setAttribute('aria-label','局内编辑器');document.body.append(d);
 d.innerHTML=`<header><div><small>本局数据 · 第 ${state.turn} 旬</small><h2>局内编辑器</h2></div><button type="button" data-close>关闭 ×</button></header><p>修改不消耗行动、不推进时间；确认后自动保存。钱粮调整计入本旬账目。</p><nav aria-label="编辑分类"></nav><div class="editor-body"><aside><input type="search" aria-label="搜索对象" placeholder="搜索姓名或地名"><div data-list></div></aside><section data-detail></section></div><p role="status" data-message></p><footer><button type="button" data-undo disabled>撤销上次编辑</button><span>城池归属、任免和兵力调动请使用游戏内对应操作。</span></footer>`;
 const message=text=>d.querySelector('[data-message]').textContent=text;
 const discard=()=>!dirty||window.confirm('放弃尚未保存的修改？');
 function close(){if(discard())d.close();}
 d.querySelector('[data-close]').onclick=close;d.oncancel=e=>{e.preventDefault();close();};d.onclose=()=>d.remove();
 for(const [id,name] of [['people','文武人物'],['provinces','州郡城池'],['countries','国家势力']]){
  const b=document.createElement('button');b.type='button';b.textContent=name;b.dataset.kind=id;
  b.onclick=()=>{if(!discard())return;kind=id;selected='';pending=null;dirty=false;draw();};d.querySelector('nav').append(b);
 }
 d.querySelector('input[type=search]').oninput=e=>{query=e.target.value;drawList();};
 function drawList(){
  d.querySelector('[data-list]').innerHTML=editorObjects(state,kind).filter(o=>`${o.name} ${o.office??''}`.includes(query.trim())).map(o=>`<button type="button" data-object="${esc(o.id)}" aria-pressed="${o.id===selected}"><b>${esc(o.name)}</b><small>${esc(kind==='people'?o.office:kind==='provinces'?state.domestic.countries.find(c=>c.id===o.countryId)?.name:o.id===state.domestic.playerCountryId?'本国':'外国')}</small></button>`).join('');
  d.querySelectorAll('[data-object]').forEach(b=>b.onclick=()=>{if(!discard())return;selected=b.dataset.object;pending=null;dirty=false;draw();});
 }
 function draw(){
  d.querySelectorAll('[data-kind]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.kind===kind)));drawList();
  const panel=d.querySelector('[data-detail]'),object=editorObjects(state,kind).find(o=>o.id===selected);
  if(!editorAvailable(state)){panel.innerHTML='<h3>当前无法编辑</h3><p>请先完成当前战斗或危机；已经终评的王朝不可编辑。</p>';return;}
  if(!object){panel.innerHTML='<h3>选择编辑对象</h3><p>在左侧选择人物、州郡或国家，查看并修改当前数值。</p>';return;}
  panel.innerHTML=`<h3>${esc(object.name)}</h3><form><div class="editor-fields">${EDITOR_FIELDS[kind].map((f,i)=>{const value=editorValue(object,f.key)??f.min;return `<div class="editor-field"><label for="editor-number-${i}">${esc(f.label)}</label><input id="editor-number-${i}" name="${f.key}" type="number" min="${f.min}" max="${f.max}" step="1" required value="${value}"><input type="range" data-slider="${f.key}" min="${f.min}" max="${f.max}" step="1" value="${value}" aria-label="${esc(f.label)}滑条"><small>${f.min.toLocaleString()} — ${f.max.toLocaleString()}</small></div>`;}).join('')}</div><button class="primary" type="submit">核对修改</button></form><div data-review></div>`;
  panel.querySelectorAll('.editor-field').forEach(row=>{
   const number=row.querySelector('input[type=number]'),slider=row.querySelector('input[type=range]');
   const clamp=value=>Math.max(Number(number.min),Math.min(Number(number.max),Math.round(value)));
   slider.oninput=()=>{number.value=slider.value;};
   number.oninput=()=>{if(number.value==='')return;const value=Number(number.value);if(Number.isFinite(value)){number.value=String(clamp(value));slider.value=number.value;}};
   number.onchange=()=>{number.value=String(clamp(Number(number.value)||Number(number.min)));slider.value=number.value;};
  });
  panel.querySelector('form').oninput=()=>{dirty=true;pending=null;panel.querySelector('[data-review]').innerHTML='';message('数值尚未保存');};
  panel.querySelector('form').onsubmit=e=>{e.preventDefault();try{
   const values=Object.fromEntries([...new FormData(e.target)].map(([k,v])=>[k,Number(v)]));pending=applyEditorChanges(state,kind,selected,values);
   panel.querySelector('[data-review]').innerHTML=`<h4>确认以下修改</h4><ul>${pending.changes.map(c=>`<li>${esc(c.label)}：${c.before} → <b>${c.after}</b></li>`).join('')}</ul><button type="button" data-apply class="primary">确认并保存</button>`;
   panel.querySelector('[data-apply]').onclick=()=>{try{const before=structuredClone(state),saved=commit(pending.next);undo={before,revision:saved.saveRevision};state=saved;dirty=false;pending=null;draw();d.querySelector('[data-undo]').disabled=false;message('修改已保存，可继续游戏或撤销上次编辑。');}catch(e){message(e.message);}};
  }catch(e){message(e.message);}};
 }
 d.querySelector('[data-undo]').onclick=()=>{try{if(!discard())return;if(!undo||state.saveRevision!==undo.revision)throw Error('进度已改变，无法撤销');const candidate=structuredClone(undo.before);candidate.saveRevision=state.saveRevision;state=commit(candidate);undo=null;pending=null;dirty=false;draw();d.querySelector('[data-undo]').disabled=true;message('已恢复上次编辑前的数据并保存。');}catch(e){message(e.message);}};
 draw();d.showModal();return d;
}
