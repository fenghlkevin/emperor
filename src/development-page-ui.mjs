// Shared paper, vermilion seal and illustrated task layout for new ministry pages.
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function developmentScene({image,alt,title,subtitle,facts,controls}){
 return `<section class="development-sheet"><figure class="development-scene"><img src="${image}" alt="${esc(alt)}"><figcaption><small>${esc(subtitle)}</small><h2>${esc(title)}</h2></figcaption></figure><section class="development-task"><dl class="development-facts">${facts.map(([name,value])=>`<div><dt>${esc(name)}</dt><dd>${esc(value)}</dd></div>`).join('')}</dl>${controls}</section></section>`;
}
