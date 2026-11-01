import {dismissSceneOnClick} from './scene-dismiss.mjs';
export function openGarden(root,message){
 const d=document.createElement('dialog');d.className='garden-dialog';d.setAttribute('aria-label','游园散心');
 d.innerHTML=`<section class="garden-scene"><img src="assets/scenes/garden/sketch-garden-v1.png" alt="皇帝与内侍漫步御苑，池畔垂柳与亭桥相映" draggable="false"><header><small>御苑池畔 · 暂歇尘劳</small><h1>游园散心</h1></header><p role="status"></p></section>`;
 d.querySelector('[role=status]').textContent=message;
 dismissSceneOnClick(d);d.onclose=()=>d.remove();root.append(d);d.showModal();return d;
}
