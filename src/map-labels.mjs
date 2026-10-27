// Keep labels readable in screen pixels. Hide overlapping text only; the actual
// territory paths and native country picker remain available for navigation.
export function fitMapLabels(svg,selector,priority=()=>0){
 if(!svg?.isConnected)return;const scale=svg.getScreenCTM()?.a;if(!scale)return;
 const nodes=[...svg.querySelectorAll(selector)],frame=svg.getBoundingClientRect(),boxes=[];
 nodes.sort((a,b)=>priority(b)-priority(a));
 for(const node of nodes){node.style.visibility='visible';node.style.fontSize=`${13/scale}px`;node.style.strokeWidth=`${1.2/scale}px`;const r=node.getBoundingClientRect();
  if(r.left<frame.left||r.right>frame.right||r.top<frame.top||r.bottom>frame.bottom||boxes.some(b=>r.left<b.right+5&&r.right>b.left-5&&r.top<b.bottom+4&&r.bottom>b.top-4))node.style.visibility='hidden';else boxes.push(r);
 }
}
