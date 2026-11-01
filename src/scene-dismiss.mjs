// Scene overlays dismiss from any non-interactive area, including their backdrop.
export function dismissSceneOnClick(dialog,finish=()=>dialog.close()){
 dialog.addEventListener('click',event=>{
  if(event.target.closest('button,a,input,select,textarea,summary,details'))return;
  event.stopPropagation();
  finish();
 });
}
