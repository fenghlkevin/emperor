// Crop atlas cells with their original proportions. SVG slice never stretches the illustration.
const NS='http://www.w3.org/2000/svg';
const troopTiles={infantry:[0,0],spears:[1,0],cavalry:[2,0],'heavy-cavalry':[0,1],archers:[1,1],crossbows:[2,1],camel:[0,2],elephant:[1,2],'horse-archers':[2,2]};
const tacticTiles={precision:[0,0],fire:[1,0],execute:[2,0],arrows:[3,0],barrage:[0,1],brace:[1,1],assault:[2,1],fortify:[3,1],coin:[3,1],dispel:[0,2],pin:[1,2],supply:[2,2],heal:[3,2]};
function atlas(art,src,x,y,cols,rows,width,height){
 const host=art.querySelector('.cb-living-art')??art;for(const old of host.querySelectorAll('.cb-art-viewport'))old.remove();
 const svg=document.createElementNS(NS,'svg'),image=document.createElementNS(NS,'image'),cw=width/cols,ch=height/rows;
 // Source atlases include a narrow separator; crop inside each cell rather than showing it on a card.
 const inset=src.startsWith('assets/battle/card-source-')?8:0;
 svg.classList.add('cb-art-viewport');svg.setAttribute('viewBox',`${x*cw+inset} ${y*ch+inset} ${cw-inset*2} ${ch-inset*2}`);svg.setAttribute('preserveAspectRatio','xMidYMid slice');svg.setAttribute('aria-hidden','true');image.setAttribute('href',src);image.setAttribute('width',width);image.setAttribute('height',height);svg.append(image);host.prepend(svg);art.style.backgroundImage='none';
}
export function applyCardArt(root){
 for(const art of root.querySelectorAll('[data-portrait-art]')){
  const scene=art.hasAttribute('data-portrait-scene'),tile=art.dataset.portraitTile?.split(',').map(Number);
  if(tile){atlas(art,art.dataset.portraitArt,tile[0]/50,tile[1]/50,3,3,1254,1254);continue;}
  art.style.backgroundImage='url('+JSON.stringify(art.dataset.portraitArt)+')'+(scene?',url("assets/battle/card-battlefield-v1.png")':'');art.style.backgroundSize=scene?'cover,auto 300%':'cover';art.style.backgroundPosition=scene?'center top,center 30%':'center top';
 }
 for(const art of root.querySelectorAll('.cb-art:not([data-portrait-art])')){
  const kind=[...art.classList].find(c=>c.startsWith('troop-'))?.slice(6),tactic=!!art.closest('.cb-card.tactic'),tile=(tactic?tacticTiles:troopTiles)[kind];
  if(tile)atlas(art,tactic?'assets/battle/card-tactics-v3.png':'assets/battle/card-troops-v1.png',...tile,tactic?4:3,3,tactic?1448:1254,tactic?1086:1254);
 }
}
