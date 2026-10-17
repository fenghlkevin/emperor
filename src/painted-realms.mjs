// Ownership zones in the painting's pixels, independent of label coordinates.
// Each convex zone replaces the automatic partition as a whole, including islands.
export const PAINTED_ZONES=[
 ['india',[[615,610],[680,550],[790,560],[900,590],[938,615],[900,860],[615,860]]],
 ['korea',[[1310,270],[1360,248],[1440,330],[1440,400],[1310,400]]],
 ['japan',[[1540,180],[1586,180],[1586,470],[1400,470]]],
 ['luzon',[[1288,620],[1440,620],[1440,840],[1288,840]]],
 ['srivijaya',[[920,820],[1288,820],[1288,950],[920,950]]],
 ['java',[[1288,840],[1586,840],[1586,950],[1288,950]]],
 ['java',[[920,950],[1586,950],[1586,992],[920,992]]],
 ['sinhala',[[715,785],[790,785],[790,860],[715,860]]]
];
// Split a ring by an oriented line. Both halves share exactly the same crossing.
function half(ring,a,b,positive){
 const distance=p=>(b[0]-a[0])*(p[1]-a[1])-(b[1]-a[1])*(p[0]-a[0]);
 const out=[];
 for(let i=0;i<ring.length;i++){
  const p=ring[i],q=ring[(i+1)%ring.length],dp=distance(p),dq=distance(q);
  if(positive?dp>=0:dp<=0)out.push(p);
  if(dp*dq<0){const t=dp/(dp-dq);out.push([p[0]+(q[0]-p[0])*t,p[1]+(q[1]-p[1])*t]);}
 }
 return out;
}
export function subtractZone(ring,zone){
 let remainder=ring;const pieces=[];
 for(let i=0;i<zone.length&&remainder.length;i++){
  const a=zone[i],b=zone[(i+1)%zone.length],outside=half(remainder,a,b,false);
  if(outside.length>=3)pieces.push(outside);
  remainder=half(remainder,a,b,true);
 }
 return pieces;
}

// Rejoin clipped pieces before drawing so ownership-zone cuts never become
// spurious borders inside a country. Split T junctions before cancelling edges.
export function joinPieces(rings){
 const point=p=>p.map(n=>n.toFixed(6)).join(',');
 const vertices=[...new Map(rings.flat().map(p=>[point(p),p])).values()],edges=new Map();
 for(const ring of rings)for(let i=0;i<ring.length;i++){
  const a=ring[i],b=ring[(i+1)%ring.length],dx=b[0]-a[0],dy=b[1]-a[1],len=dx*dx+dy*dy;if(len<1e-12)continue;
  const chain=vertices.map(p=>({p,t:((p[0]-a[0])*dx+(p[1]-a[1])*dy)/len})).filter(({p,t})=>t>=-1e-9&&t<=1+1e-9&&Math.abs((p[0]-a[0])*dy-(p[1]-a[1])*dx)<1e-6).sort((a,b)=>a.t-b.t);
  for(let j=0;j<chain.length-1;j++){const p=chain[j].p,q=chain[j+1].p,k=[point(p),point(q)].sort().join('/');if(edges.has(k))edges.delete(k);else edges.set(k,[p,q]);}
 }
 const pending=[...edges.values()],out=[];
 while(pending.length){const [a,b]=pending.pop(),ring=[a,b];let end=point(b);while(end!==point(a)){
  const i=pending.findIndex(([p,q])=>point(p)===end||point(q)===end);if(i<0)break;
  const [p,q]=pending.splice(i,1)[0],next=point(p)===end?q:p;ring.push(next);end=point(next);
 }if(ring.length>=3)out.push(ring);}
 return out;
}
