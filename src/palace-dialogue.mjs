import {PALACE_ATTENDANT_ART} from './palace-character-art.mjs';
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
// Only in-world notices use the attendant; save tools and ministry workspaces keep their own presentation.
const notices=new Set(['内侍禀报','御前禀报','请于早朝办理','内侍请旨','安寝至明','确认退朝','外臣抵京','出行候驾','礼明殿','制举未结束']);
export function palaceDialogueMarkup(title,content){
 if(!notices.has(title))return null;
 const heading=title==='确认退朝'?'恭请圣裁':title==='请于早朝办理'?'内侍禀报':title;
 const acknowledge=/<button\b/.test(content)?'':'<div class="palace-dialogue-actions"><button class="primary" data-attendant-dismiss autofocus>朕知道了</button></div>';
 return `<div class="palace-dialogue-layout"><section class="palace-dialogue-copy"><div class="palace-dialogue-speaker"><span aria-hidden="true">侍</span><small>御前内侍</small></div><h2>${esc(heading)}</h2><div class="palace-dialogue-words">${content}</div>${acknowledge}</section><figure class="palace-dialogue-portrait"><img src="${PALACE_ATTENDANT_ART.portrait}" alt="内侍拱手候旨" draggable="false"><figcaption>恭候圣谕</figcaption></figure></div><button class="close" aria-label="关闭禀报">×</button>`;
}
