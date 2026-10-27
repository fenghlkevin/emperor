// Keep hand hit areas and painted faces connected while the battle/notice changes.
// Recreating those nodes restarts :hover transitions and makes a stationary hand shake.
export function createCardBattleStageRender(dialog,applyArt){
 const templates=new Map();
 function attributes(current,next){for(const a of [...current.attributes])if(a.name!=='style'&&!next.hasAttribute(a.name))current.removeAttribute(a.name);for(const a of next.attributes)if(a.name!=='style'&&current.getAttribute(a.name)!==a.value)current.setAttribute(a.name,a.value);}
 function around(current,next,kept,incoming){
  for(const n of [...current.childNodes])if(n!==kept)n.remove();let passed=false;
  for(const n of [...next.childNodes]){if(n===incoming){passed=true;continue;}current.insertBefore(n,passed?null:kept);}
 }
 return markup=>{
  const template=dialog.ownerDocument.createElement('template');template.innerHTML=markup;const next=template.content.firstElementChild,current=dialog.querySelector(':scope>.cb-stage'),table=current?.querySelector(':scope>.cb-table'),incoming=next.querySelector(':scope>.cb-table'),newHand=incoming.querySelector('.cb-hand');
  const nextTemplates=new Map([...newHand.children].map(e=>[e.dataset.card,e.outerHTML]));
  if(current&&table){
   const hand=table.querySelector('.cb-hand'),existing=new Map([...hand.children].map(e=>[e.dataset.card,e]));let cursor=hand.firstElementChild;
   for(const fresh of [...newHand.children]){
    const id=fresh.dataset.card,card=existing.get(id)??fresh;
    if(card!==fresh){attributes(card,fresh);card.style.removeProperty('visibility');}
    if(card!==fresh&&templates.get(id)!==nextTemplates.get(id)){
     const face=card.querySelector('.cb-card-surface'),newFace=fresh.querySelector('.cb-card-surface'),art=face.querySelector(':scope>.cb-art'),newArt=newFace.querySelector(':scope>.cb-art');
     if(art&&newArt&&art.className===newArt.className&&JSON.stringify(art.dataset)===JSON.stringify(newArt.dataset)){around(face,newFace,art,newArt);}else{face.replaceChildren(...newFace.childNodes);applyArt(card);}
    }else if(card===fresh)applyArt(card);
    if(card!==cursor)hand.insertBefore(card,cursor);cursor=card.nextElementSibling;existing.delete(id);
   }
   for(const e of existing.values())e.remove();
   table.querySelector('.cb-mana').replaceWith(incoming.querySelector('.cb-mana'));
   attributes(current,next);around(current,next,table,incoming);
   for(const child of current.children)if(child!==table)applyArt(child);
  }else{dialog.replaceChildren(next);applyArt(dialog);}
  templates.clear();for(const [id,html]of nextTemplates)templates.set(id,html);
 };
}
