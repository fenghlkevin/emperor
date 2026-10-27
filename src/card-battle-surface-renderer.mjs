// Shared with the approved V7 preview; drawing is independent of battle rules and saves.
export const CARD_SURFACE_EFFECTS=[
  {id:'attack',name:'持续加攻',color:'#f5d786',x:10,y:103,path:'M-3 4L3-4 5-5 5-3-1 5M-4 1L1 6M-4 6L-2 4',description:'攻击位的金色刃光持续向上游走，金屑沿刀锋散出。'},
  {id:'temp',name:'临时加攻',color:'#ffae65',x:10,y:26,path:'M0 6C-7 3-3-2-2-4 0-2 2-5 1-7 8 1 6 6 0 6Z',description:'左上角持续升起火舌与余烬，与攻击位的持续强化分开。'},
  {id:'health',name:'生命强化',color:'#a0efb9',x:89,y:103,path:'M0 5C-8 1-6-6-2-4L0-2 2-4C7-6 9 1 0 5Z',description:'生命位的青玉光流环绕数值上升，小光滴持续汇入。'},
  {id:'shield',name:'护甲盾',color:'#ffe2a0',x:49,y:12,path:'M0-6L5-4V0C5 4 2 6 0 7-3 5-5 3-5 0V-4Z',description:'上缘的金色能量盾持续折射；薄光片向外展开后重新凝聚。'},
  {id:'guard',name:'额外护卫',color:'#c7d9c1',x:9,y:69,path:'M-5-5V0C-5 4-2 6 0 7 3 5 5 3 5 0V-5H2V-2H-2V-5Z',description:'左侧护卫纹由银青色甲片反复合拢，保持独立的防御动态。'},
  {id:'rush',name:'额外突袭',color:'#b3e9df',x:9,y:47,path:'M-5-3H3C8-3 7 1 3 1H0M-6 1H-2M-4 5H3C6 5 7 2 4 2',description:'左侧三道风痕持续向前掠过；没有额外增加卡片高度。'},
  {id:'stealth',name:'额外潜行',color:'#91bbc3',x:91,y:69,path:'M-6 0Q0-7 6 0Q0 7-6 0ZM-2 0A2 2 0 1 0 2 0A2 2 0 1 0-2 0',description:'右侧雾丝循环卷入潜行之眼，中心人物轮廓保持清楚。'},
  {id:'anti',name:'额外反骑',color:'#d5ddac',x:91,y:47,path:'M-5 6L4-5M1-5L6-7 4-1M5 6L-4-5M-1-5L-6-7-4-1',description:'右侧交叉枪芒轮流闪过，细小撞击星火在交点散开。'},
  {id:'freeze',name:'冻结',negative:true,color:'#a5e5ff',x:90,y:26,path:'M0-7V7M-6-4L6 4M-6 4L6-4M-2-6L0-3 2-6M-2 6L0 3 2 6',description:'右上冰晶缓慢生长、退隐，细雪沿卡边飘落；不覆盖人物面部。'},
  {id:'silence',name:'沉默',negative:true,color:'#d1aff1',x:75,y:12,path:'M-4 3H4L2 0V-3C2-7-3-7-3-3V0ZM-1 6H2M-6-6L6 6',description:'紫色禁言符纹持续旋转收束，封印中心保留明确的沉默轮廓。'},
  {id:'weak',name:'攻击削弱',negative:true,color:'#e69abe',x:14,y:125,path:'M-4-6L1-1-2 1 4 6M2-5L0-1M0 3L-4 5',description:'攻击数值周围的紫红裂隙不断爬行，与金色加攻流光同时保留。'},
  {id:'frail',name:'上限削弱',negative:true,color:'#e89b9c',x:86,y:125,path:'M0 5C-8 1-6-6-2-4L0-2 2-4C7-6 9 1 0 5ZM0-3L-2 0 1 1-1 4',description:'生命位保留红色破损脉冲；青玉强化仍持续运动，两种修正不互相擦除。'}
 ];
export const ADDITIONAL_CARD_SURFACE_EFFECTS=[
 {id:'horse',name:'额外慑马',color:'#d4d5a0',x:9,y:89,path:'M-4 6V-1L1-6 5-3 2 0 5 3V6M-3 2H2'},
 {id:'pierce',name:'额外破盾',color:'#e6cb9d',x:91,y:89,path:'M0-6L5-3V1L0 7-5 1V-3ZM3-5L-1 0 2 2-3 6'},
 {id:'temp-weak',name:'临时削弱',negative:true,color:'#ce98d9',x:25,y:26,path:'M-4-5L0-1-2 1 4 6M-4 5H3'}
];
const byId=Object.fromEntries([...CARD_SURFACE_EFFECTS,...ADDITIONAL_CARD_SURFACE_EFFECTS].map(e=>[e.id,e]));
 const readability=new WeakMap();
 const lightAlpha=a=>Math.min(1,a*1.12);
 function pixelScale(c){const t=c.getTransform();return Math.max(.001,Math.sqrt(Math.abs(t.a*t.d-t.b*t.c)));}
 function stroke(c,d,color,width=1,alpha=1,glow=2){
  const m=readability.get(c),scale=pixelScale(c),lineWidth=Math.max(width,(m?.lineMinimum??0)/scale),path=typeof d==='string'?new Path2D(d):d;
  c.save();c.lineCap='round';c.lineJoin='round';
  // A narrow dark keyline keeps a bright effect legible against pale or busy art.
  c.save();c.globalCompositeOperation='source-over';c.strokeStyle='#10212a';c.globalAlpha*=alpha*.58;c.lineWidth=lineWidth+(m?.pixelRatio??1)*.6/scale;c.shadowBlur=0;c.stroke(path);c.restore();
  c.strokeStyle=color;c.lineWidth=lineWidth;c.globalAlpha*=lightAlpha(alpha);c.shadowColor=color;c.shadowBlur=glow*1.12*(m?.pixelRatio??1);c.stroke(path);c.restore();
 }
 function dot(c,x,y,r,color,a=1){const m=readability.get(c),scale=pixelScale(c),radius=Math.max(r,(m?.pointMinimum??0)/scale);c.save();c.globalAlpha*=lightAlpha(a);c.fillStyle=color;c.shadowColor=color;c.shadowBlur=Math.min(5*(m?.pixelRatio??1),Math.max(radius*scale*2,1.5*(m?.pixelRatio??1)))*1.12;c.beginPath();c.arc(x,y,radius,0,Math.PI*2);c.fill();c.restore();}
 function line(c,pts,color,width=1,a=1){const p=new Path2D();pts.forEach(([x,y],i)=>i?p.lineTo(x,y):p.moveTo(x,y));stroke(c,p,color,width,a);}
 const wave=(t,offset=0)=>.5+.5*Math.sin(t+offset);
 function aura(c,x,y,r,color,a){const g=c.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,color);g.addColorStop(1,color+'00');c.save();c.globalAlpha*=lightAlpha(a);c.fillStyle=g;c.fillRect(x-r,y-r,r*2,r*2);c.restore();}
 function rune(c,e,t){c.save();c.translate(e.x,e.y);c.scale(.8,.8);const a=.78+.2*wave(t*1.3,e.x);stroke(c,e.path,e.color,.8,a,2.6);c.restore();}
 function renderEffect(c,e,t,seed){
  const color=e.color,x=e.x,y=e.y,phase=t+seed;
  // Each effect owns a different piece of motion. No raster overlays or whole-face flashing.
  switch(e.id){
   case 'attack':{
    const p=new Path2D('M13 120Q-2 99 7 65Q9 53 6 44');stroke(c,p,color,.8,.78,2.8);
    for(let i=0;i<5;i++){const q=(phase*.23+i/5)%1,yy=119-q*65,xx=4+Math.pow(q-.55,2)*16;dot(c,xx,yy,.45+q*.25,color,Math.sin(q*Math.PI));line(c,[[xx,yy+4],[xx-.4,yy]],color,.45,.55*Math.sin(q*Math.PI));}
    for(let i=0;i<2;i++){const q=(phase*.45+i/2)%1,yy=116-q*25;line(c,[[3,yy+7],[10,yy-3],[7,yy+4]],color,.75,Math.sin(q*Math.PI)*.9);}break;
   }
   case 'temp':{
    for(let i=0;i<3;i++){const q=(phase*.32+i/3)%1,yy=y+7-q*19,xx=x+Math.sin(q*5+i)*2;stroke(c,`M${xx} ${yy+7}Q${xx-4} ${yy+2} ${xx+1} ${yy-3}`,color,.6,Math.sin(q*Math.PI)*.8,1.7);dot(c,xx+3,yy-3,.4,color,1-q);c.save();c.globalAlpha*=Math.sin(q*Math.PI)*.2;c.fillStyle=color;c.beginPath();c.moveTo(xx-3,yy+8);c.bezierCurveTo(xx-7,yy+3,xx+4,yy+1,xx,yy-7);c.bezierCurveTo(xx+8,yy+2,xx+4,yy+8,xx-3,yy+8);c.fill();c.restore();}break;
   }
   case 'health':{
    stroke(c,'M87 120Q105 108 94 89Q90 81 96 74',color,.8,.78,2.8);
    for(let i=0;i<5;i++){const q=(phase*.2+i/5)%1,yy=123-q*47,xx=93+Math.sin(q*6)*3;dot(c,xx,yy,.5,color,Math.sin(q*Math.PI));stroke(c,`M${xx} ${yy}q-2 3 0 4q2-1 0-4Z`,color,.4,Math.sin(q*Math.PI)*.6,1);}c.save();c.translate(86,126);c.scale(1,.5);c.rotate(phase*.35);const p=new Path2D();p.arc(0,0,9,0,Math.PI*1.4);stroke(c,p,color,.8,.8,2);c.restore();break;
   }
   case 'shield':{
    rune(c,e,phase);
    for(let i=0;i<2;i++){const q=(phase*.2+i/2)%1;c.save();c.translate(x,y);c.scale(1+q*.8,1+q*.65);stroke(c,e.path,color,.5,(1-q)*.6,2);c.restore();}
    for(let i=0;i<3;i++){const xx=x-12+i*12,q=wave(phase*1.1,i*2);line(c,[[xx-4,4],[xx,2],[xx+4,4]],color,.5,q*.8);}break;
   }
   case 'guard':{
    const q=wave(phase*1.6)*2;line(c,[[x-7-q,y-5],[x-7-q,y+3],[x-4,y+7]],color,.9,.8);line(c,[[x+7+q,y-5],[x+7+q,y+3],[x+4,y+7]],color,.9,.8);rune(c,e,phase);for(let i=0;i<2;i++)dot(c,x+(i?1:-1)*7,y+Math.sin(phase+i*3)*5,.45,color,.7);break;
   }
   case 'rush':{
    for(let i=0;i<3;i++){const q=(phase*.65+i/3)%1,xx=x-8+q*17,yy=y-5+i*5;stroke(c,`M${xx-5} ${yy+2}Q${xx-1} ${yy} ${xx+3} ${yy}`,color,.7,Math.sin(q*Math.PI),1.3);}break;
   }
   case 'stealth':{
    for(let i=0;i<3;i++){const q=(phase*.17+i/3)%1,yy=y+13-q*28;stroke(c,`M${x+Math.sin(phase+i)*4} ${yy+10}q-7-4 0-9q7-4 0-8`,color,1.6,Math.sin(q*Math.PI)*.42,3);}rune(c,e,phase);break;
   }
   case 'anti':{
    c.save();c.translate(x,y);const q=wave(phase*1.8);stroke(c,'M-5 6L4-5M1-5L6-7 4-1',color,.8,.55+q*.45,2.6);stroke(c,'M5 6L-4-5M-1-5L-6-7-4-1',color,.8,1-q*.45,2.6);c.restore();for(let i=0;i<4;i++){const q=(phase*.4+i/4)%1,a=i*2.4+phase*.3;dot(c,x+Math.cos(a)*q*8,y+Math.sin(a)*q*8,.4,color,1-q);}break;
   }
   case 'freeze':{
    for(let i=0;i<5;i++){const a=i*1.25+Math.PI*.1,len=5+wave(phase*.7,i)*6,xx=x+Math.cos(a)*len,yy=y+Math.sin(a)*len;line(c,[[x,y],[xx,yy],[xx-1.4,yy-2]],color,.75,.84);line(c,[[xx,yy],[xx-2,yy+.6]],color,.65,.7);}
    for(let i=0;i<5;i++){const q=(phase*.12+i/5)%1,yy=12+q*72,xx=96+Math.sin(q*8+i)*2;dot(c,xx,yy,.35,color,Math.sin(q*Math.PI)*.8);}for(let i=0;i<3;i++){const q=wave(phase*.7,i*1.7),xx=x-4+i*4,yy=y+i*3;c.save();c.globalAlpha*=.2+q*.2;c.fillStyle=color;const p=new Path2D();p.moveTo(xx-2,yy+7);p.lineTo(xx+q*2,yy-8-q*4);p.lineTo(xx+3,yy+6);p.closePath();c.fill(p);c.restore();}break;
   }
   case 'silence':{
    c.save();c.translate(x,y);c.rotate(-phase*.22);const p=new Path2D();for(let i=0;i<3;i++){const a=i*Math.PI*2/3;p.moveTo(Math.cos(a)*8,Math.sin(a)*8);p.lineTo(Math.cos(a+.6)*8,Math.sin(a+.6)*8);}stroke(c,p,color,.9,.9,3);c.restore();aura(c,x,y,8,color,.18+wave(phase*1.6)*.1);rune(c,e,phase);break;
   }
   case 'weak':{
    const q=(phase*.25)%1;c.save();c.translate(x,y);stroke(c,'M-5-7L0-2-3 0 4 7M-1 2L-6 6M0-2L4-5',color,.7,.6+wave(phase*1.9)*.35,2);stroke(c,`M-5 ${-8+q*17}l4 3-2 3 6 3`,color,.65,Math.sin(q*Math.PI)*.9,2);c.restore();for(let i=0;i<3;i++){const q=(phase*.2+i/3)%1;dot(c,x-7+Math.sin(q*4)*4,y-3+q*13,.4,color,1-q);}break;
   }
   case 'horse':case 'pierce':{
    rune(c,e,phase);for(let i=0;i<3;i++){const q=(phase*.3+i/3)%1;line(c,[[x-7+q*14,y-7],[x-5+q*14,y-3]],color,.65,Math.sin(q*Math.PI)*.7);}break;
   }
   case 'temp-weak':{
    for(let i=0;i<3;i++){const q=(phase*.32+i/3)%1,yy=y-7+q*18;stroke(c,`M${x-3} ${yy-3}q6 2 2 7`,color,.65,Math.sin(q*Math.PI)*.8,2);dot(c,x+Math.sin(q*7+i)*3,yy,.4,color,1-q);}rune(c,e,phase);break;
   }
   case 'frail':{
    c.save();c.translate(x,y);stroke(c,'M-4-7L-1-3-3 0 2 6M2-5L0-2M1 3L5 6',color,.7,.5+wave(phase*1.5)*.45,1.5);stroke(c,'M-7-7L-5-3M7 6L5 3',color,.7,wave(phase*2)*.8,2.8);c.restore();for(let i=0;i<3;i++){const q=(phase*.22+i/3)%1;dot(c,x+7+Math.sin(q*4),y-7+q*14,.4,color,(1-q)*.7);}break;
   }
  }
 }
export function drawCardSurface(surface,ms,gain=.55){
  const {canvas,ctx:c,u}=surface;if(!canvas.width||!canvas.height)return;const ratio=surface.pixelRatio??Math.min(2,globalThis.devicePixelRatio||1);readability.set(c,{pixelRatio:ratio,lineMinimum:ratio*(.85+gain*.25),pointMinimum:ratio*(.65+gain*.2)});c.setTransform(1,0,0,1,0,0);c.clearRect(0,0,canvas.width,canvas.height);c.setTransform(canvas.width/112,0,0,canvas.height/156.8,0,0);c.translate(6,8.4);c.globalCompositeOperation='screen';c.globalAlpha=Math.min(1,.65+gain*.6);
  const t=ms/1000,seed=u.seed??Number(u.id.split('-')[1])*.63,list=u.keys.map(k=>byId[k]).filter(Boolean);
  // A pair of thin, traveling polarity rails; individual effects retain their own visible anchor.
  for(const neg of [false,true])if(list.some(e=>!!e.negative===neg))for(let i=0;i<3;i++){const q=(t*.08+i/3+seed*.1)%1,yy=neg?132-q*122:10+q*122,xx=neg?98.5:1.5;line(c,[[xx,yy-6],[xx,yy+3]],neg?'#c5a0e0':'#c3db99',.6,Math.sin(q*Math.PI)*.6);}
  for(const e of list){
   const dy=surface.game?(['shield','silence'].includes(e.id)?17:['temp','freeze','temp-weak'].includes(e.id)?14:['rush','anti'].includes(e.id)?5:0):0;
   c.save();c.translate(0,dy);renderEffect(c,e,t,seed);c.restore();
   const index=u.burstKeys.indexOf(e.id),age=ms-u.burst-index*55;
   if(index>=0&&u.burst>0&&age>=0&&age<1450){const q=age/1450,a=Math.sin(q*Math.PI);aura(c,e.x,e.y+dy,8+q*12,e.color,a*.35);for(let i=0;i<9;i++){const angle=i*2.4+seed,dist=q*17;dot(c,e.x+Math.cos(angle)*dist,e.y+dy+Math.sin(angle)*dist,.35+(i%3)*.1,e.color,(1-q)*a);}}
  }
  c.globalAlpha=1;c.globalCompositeOperation='source-over';surface.frames=(surface.frames??0)+1;
 }
