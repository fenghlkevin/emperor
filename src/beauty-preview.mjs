import {portraitCanvas,paintPortraits} from './beauty-raster-portrait.mjs';

export function bindBeautyPreview(root,people){
 const byId=new Map(people.map(person=>[person.id,person]));
 for(const canvas of root.querySelectorAll('canvas[data-beauty]')){
  const person=byId.get(canvas.dataset.beauty);if(!person)continue;
  canvas.classList.add('beauty-preview-trigger');
  canvas.tabIndex=0;canvas.setAttribute('role','button');
  canvas.setAttribute('aria-label',`放大查看${person.name}的立绘`);
  canvas.title='点击放大立绘';
  const open=()=>{
   const preview=document.createElement('dialog');preview.className='beauty-preview';
   preview.setAttribute('aria-label',`${person.name} · 立绘预览`);
   preview.innerHTML=`<button type="button" class="beauty-preview-close" aria-label="关闭立绘预览" autofocus>×</button><figure>${portraitCanvas(person)}<figcaption></figcaption></figure>`;
   preview.querySelector('figcaption').textContent=person.name;
   document.body.append(preview);
   preview.addEventListener('close',()=>{preview.remove();if(canvas.isConnected)canvas.focus();},{once:true});
   preview.querySelector('button').onclick=()=>preview.close();
   preview.onclick=event=>{if(event.target===preview)preview.close();};
   preview.showModal();paintPortraits(preview,[person]);
  };
  canvas.onclick=event=>{event.stopPropagation();open();};
  canvas.onkeydown=event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();event.stopPropagation();open();}};
 }
}
