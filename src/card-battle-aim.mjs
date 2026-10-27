// Presentation only: target legality is supplied by the battle's existing action rules.
export function cardAimMarkup(){return `<svg class="cb-aim" aria-hidden="true" data-aim-visible="false"><g class="cb-aim-track"><path class="cb-aim-shadow"/><path class="cb-aim-rim"/><path class="cb-aim-core" data-aim-line/></g><g class="cb-aim-origin"><circle r="3"/><circle r="1.2"/></g><g class="cb-aim-tip"><circle class="cb-aim-halo" r="12"/><path class="cb-aim-lock" d="M-7-14H-14V-7M7-14H14V-7M-14 7V14H-7M14 7V14H7"/><g class="cb-aim-head"><path d="M-13-6L0 0-13 6-9 0Z"/></g></g></svg>`;}
export function clearCardAim(svg){if(!svg)return;svg.dataset.aimVisible='false';for(const p of svg.querySelectorAll('.cb-aim-track path'))p.removeAttribute('d');}
export function paintCardAim(svg,{start,target,tone='hostile',locked=false,invalid=false,round=false}){
 if(!svg)return;
 const cx=start.x+start.w/2,cy=start.y+start.h/2,dx=target.x-cx,dy=target.y-cy;
 if(Math.abs(dx)<start.w/2+3&&Math.abs(dy)<start.h/2+3){clearCardAim(svg);return;}
 const scale=round?1/Math.hypot(dx/(start.w*.47),dy/(start.h*.47)):Math.min(start.w*.5/Math.max(.001,Math.abs(dx)),start.h*.5/Math.max(.001,Math.abs(dy)));
 const length=Math.max(1,Math.hypot(dx,dy)),sx=cx+dx*scale+dx/length*12,sy=cy+dy*scale+dy/length*12;
 const ex=target.x,ey=target.y,vx=ex-sx,vy=ey-sy,c1={x:sx+vx*.08,y:sy+vy*.42},c2={x:ex-vx*.28,y:ey-vy*.26};
 const angle=Math.atan2(ey-c2.y,ex-c2.x)*180/Math.PI,d=`M${sx} ${sy}C${c1.x} ${c1.y} ${c2.x} ${c2.y} ${ex} ${ey}`;
 for(const p of svg.querySelectorAll('.cb-aim-track path'))p.setAttribute('d',d);
 svg.querySelector('.cb-aim-origin').setAttribute('transform',`translate(${sx} ${sy})`);svg.querySelector('.cb-aim-tip').setAttribute('transform',`translate(${ex} ${ey})`);svg.querySelector('.cb-aim-head').setAttribute('transform',`rotate(${angle})`);
 svg.dataset.aimTone=tone;svg.dataset.aimLocked=String(locked);svg.dataset.aimInvalid=String(invalid);svg.dataset.aimVisible='true';
}
