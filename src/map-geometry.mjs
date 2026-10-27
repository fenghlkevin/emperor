// Shared planar topology: every undirected edge has one detailed chain.
// Coordinates describe the fictional campaign, not historical administrative surveys.
const key=p=>p.map(v=>v.toFixed(7)).join(',');
export function partition(sites,bounds=[-12,150,-2,64]){
 const [west,east,south,north]=bounds;
 return sites.map(site=>{
  let ring=[[west,south],[east,south],[east,north],[west,north]];
  for(const other of sites){
   if(other===site)continue;
   const [x,y]=site.center,[u,v]=other.center,a=u-x,b=v-y,c=(u*u+v*v-x*x-y*y)/2;
   const clipped=[];
   for(let i=0;i<ring.length;i++){
    const p=ring[i],q=ring[(i+1)%ring.length],dp=a*p[0]+b*p[1]-c,dq=a*q[0]+b*q[1]-c;
    if(dp<=1e-9)clipped.push(p);
    if((dp<0&&dq>0)||(dp>0&&dq<0)){const t=dp/(dp-dq);clipped.push([p[0]+t*(q[0]-p[0]),p[1]+t*(q[1]-p[1])]);}
   }
   ring=clipped;
  }
  return {...site,polygon:ring};
 });
}
export function sharedRings(regions){
 const vertices=[...new Map(regions.flatMap(r=>r.polygon).map(p=>[key(p),p])).values()];
 const edges=new Map();
 return regions.map(region=>({...region,polygon:region.polygon.flatMap((p,i)=>{
  const q=region.polygon[(i+1)%region.polygon.length],dx=q[0]-p[0],dy=q[1]-p[1],length2=dx*dx+dy*dy;
  if(length2<1e-14)return [];
  const points=vertices.map(v=>({v,t:((v[0]-p[0])*dx+(v[1]-p[1])*dy)/length2})).filter(({v,t})=>t>=-1e-8&&t<1-1e-8&&Math.abs((v[0]-p[0])*dy-(v[1]-p[1])*dx)<1e-7).sort((a,b)=>a.t-b.t).map(({v})=>v);
  points.push(q);
  return points.slice(0,-1).flatMap((a,j)=>{
   const b=points[j+1],forward=key(a)<key(b),start=forward?a:b,end=forward?b:a,id=key(start)+'/'+key(end);
   if(!edges.has(id)){
    const vx=end[0]-start[0],vy=end[1]-start[1],length=Math.hypot(vx,vy),count=Math.max(3,Math.ceil(length/.32));
    let hash=0;for(const ch of id)hash=(hash*31+ch.charCodeAt(0))>>>0;
    const frameEdge=(Math.abs(start[0]-end[0])<1e-8&&[-12,150].some(x=>Math.abs(start[0]-x)<1e-8))||(Math.abs(start[1]-end[1])<1e-8&&[-2,64].some(y=>Math.abs(start[1]-y)<1e-8));
    const chain=Array.from({length:count+1},(_,n)=>{
     if(n===0)return start;if(n===count)return end;
     const t=n/count,offset=(frameEdge?0:1)*Math.sin(Math.PI*t)*Math.min(.13,length*.035)*(Math.sin(t*Math.PI*4+(hash%31))*.65+Math.sin(t*Math.PI*9+(hash%17))*.35);
     return [start[0]+vx*t-vy/length*offset,start[1]+vy*t+vx/length*offset];
    });edges.set(id,chain);
   }
   const chain=edges.get(id);return (forward?chain:[...chain].reverse()).slice(0,-1);
  });
 })}));
}
export const ringPath=ring=>ring.map(([x,y],i)=>`${i?'L':'M'}${x.toFixed(6)},${(-y).toFixed(6)}`).join('')+'Z';

// Two monotone shears bend a complete planar partition, including every shared
// junction, together. This keeps countries watertight rather than perturbing
// their outlines independently. Both frame edges remain fixed.
export function reliefPoint([x,y]){
 const u=x+Math.sin(Math.PI*(x+12)/162)*(1.6*Math.sin(y*.42)+.7*Math.sin(y*1.7)+.18*Math.sin(y*5.2));
 const v=y+Math.sin(Math.PI*(y+2)/66)*(Math.sin(u*.43)+.42*Math.sin(u*1.9)+.12*Math.sin(u*5));
 return [u,v];
}
export function reliefRings(regions){
 return regions.map(r=>({...r,center:reliefPoint(r.center),polygon:r.polygon.flatMap((a,i)=>{
  const b=r.polygon[(i+1)%r.polygon.length],n=Math.max(1,Math.ceil(Math.hypot(b[0]-a[0],b[1]-a[1])/.12));
  return Array.from({length:n},(_,j)=>reliefPoint([a[0]+(b[0]-a[0])*j/n,a[1]+(b[1]-a[1])*j/n]));
 })}));
}
// Remove duplicated internal state edges from the national outline.
export function exteriorPath(regions){
 const edges=new Map(),point=p=>p.map(v=>v.toFixed(6)).join(',');
 for(const r of regions)for(let i=0;i<r.polygon.length;i++){
  const a=r.polygon[i],b=r.polygon[(i+1)%r.polygon.length],ka=point(a),kb=point(b),id=[ka,kb].sort().join('/');
  if(edges.has(id))edges.delete(id);else edges.set(id,[a,b]);
 }
 return [...edges.values()].map(([a,b])=>`M${a[0].toFixed(6)},${(-a[1]).toFixed(6)}L${b[0].toFixed(6)},${(-b[1]).toFixed(6)}`).join('');
}

// Round authored coastline corners without overshooting narrow straits. Open
// chains retain their endpoints, so the shared eastern coast remains exact.
export function softenCoast(points,closed=false,passes=2){
 let ring=points;
 for(let pass=0;pass<passes;pass++){
  const out=closed?[]:[ring[0]],n=closed?ring.length:ring.length-1;
  for(let i=0;i<n;i++){
   const a=ring[i],b=ring[(i+1)%ring.length];
   out.push(a.map((v,k)=>v*.75+b[k]*.25),a.map((v,k)=>v*.25+b[k]*.75));
  }
  if(!closed)out.push(ring.at(-1));ring=out;
 }
 return ring;
}

export function clipToBounds(ring,[west,east,south,north]){
 let result=ring;
 for(const [axis,edge,sign]of [[0,west,1],[0,east,-1],[1,south,1],[1,north,-1]]){
  const out=[];
  for(let i=0;i<result.length;i++){
   const a=result[i],b=result[(i+1)%result.length],da=(a[axis]-edge)*sign,db=(b[axis]-edge)*sign;
   if(da>=0)out.push(a);
   if(da*db<0){const t=da/(da-db);out.push(a.map((v,k)=>v+(b[k]-v)*t));}
  }
  result=out;
 }
 return result;
}

// Deterministic shared inland chain for un-authored state edges. Canonical
// direction ensures adjacent polygons receive the exact reversed samples.
export function naturalBorder(a,b){
 const forward=key(a)<key(b),start=forward?a:b,end=forward?b:a;
 const dx=end[0]-start[0],dy=end[1]-start[1],length=Math.hypot(dx,dy);
 let hash=0;for(const c of key(start)+'/'+key(end))hash=(hash*31+c.charCodeAt(0))>>>0;
 const count=Math.max(8,Math.ceil(length/.12));
 const points=Array.from({length:count+1},(_,i)=>{
  if(!i)return start;if(i===count)return end;
  const t=i/count,wave=Math.sin(Math.PI*t)*Math.min(.22,length*.055)*(Math.sin(t*Math.PI*2+(hash%17))*.7+Math.sin(t*Math.PI*5+(hash%11))*.3);
  return [start[0]+dx*t-dy/length*wave,start[1]+dy*t+dx/length*wave];
 });
 return forward?points:points.reverse();
}

// Local cartographic correction for the far northeastern mainland. Two gentle
// shears move every shared country/coast sample together; the home provinces
// and Japanese archipelago remain outside the affected window.
export function northeastPoint([x,y]){
 const smooth=t=>{t=Math.max(0,Math.min(1,t));return t*t*(3-2*t);};
 const east=smooth((x-130)/18)*smooth((185-x)/12),north=smooth((y-48)/10);
 const u=x+east*north*(1.05*Math.sin((y-48)*.48)+.38*Math.sin((y-48)*1.1));
 const south=smooth((u-150)/14)*smooth((185-u)/10);
 const v=y-2*south*Math.exp(-(((y-60)/5)**2));
 return [u,v];
}
