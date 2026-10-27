export const TROOP_TACTICS={infantry:[3,4],spears:[3,3],archers:[3,5],crossbows:[2,2],cavalry:[6,8],'heavy-cavalry':[4,5],'horse-archers':[5,7],camel:[4,6],elephant:[3,2]};
export const terrainNames={plain:'平地',road:'道路',hill:'丘陵',forest:'林地',sand:'沙地',water:'浅水'};
export const mobility=u=>TROOP_TACTICS[u.kind][0];
export const initiative=u=>TROOP_TACTICS[u.kind][1]+(u.bonus?.speed??0);
export const movementLeft=u=>Math.max(0,mobility(u)-(u.moveSpent??0));
export function terrainAt(b,x,y){return b.tiles?.[y*13+x]??'plain';}
export function terrainCost(b,u,x,y){
 const t=terrainAt(b,x,y),horse=['cavalry','heavy-cavalry','horse-archers'].includes(u.kind),large=horse||['camel','elephant'].includes(u.kind);
 if(['plain','road'].includes(t))return 1;
 if(t==='sand')return u.kind==='camel'?1:2;
 if(t==='hill')return horse||u.kind==='elephant'?3:2;
 return large?3:2;
}
export function terrainMap(field){return Array.from({length:117},(_,i)=>{
 const x=i%13,y=Math.floor(i/13);if(y===4)return 'road';if(x<4||x>8)return field?.surface==='desert'?'sand':'plain';
 const n=(x*17+y*31)%7;
 if(field?.surface==='desert')return 'sand';
 if(field?.terrain==='丘陵型'||field?.terrain==='高山型')return n<4?'hill':n===4?'forest':'plain';
 if(field?.terrain==='河海型')return n<3?'water':'plain';
 return n===0?'forest':n===1?'hill':'plain';
});}
const horse=u=>['cavalry','heavy-cavalry','horse-archers'].includes(u.kind);
function direction(a,t){return (Math.round(Math.atan2(-(t.y-a.y)*Math.sqrt(3),(t.x-a.x)*2+(t.y%2)-(a.y%2))/(Math.PI/3))+6)%6;}
export function front(a,t){const d=Math.abs(direction(t,a)-(t.facing??(t.side==='enemy'?3:0)));return Math.min(d,6-d)<=1;}
export const spearGuard=(a,t)=>t.kind==='spears'&&(!t.moved||t.defending)&&front(a,t);
export function counterFactor(a,t,shot=false){
 if(shot)return 1;
 if(a.kind==='spears'&&horse(t)&&front(t,a))return 1.35;
 if(a.kind==='spears'&&t.kind==='elephant'&&front(t,a))return 1.2;
 if(a.kind==='infantry'&&t.kind==='spears')return 1.2;
 if(a.kind==='cavalry'&&['archers','crossbows','horse-archers'].includes(t.kind))return 1.3;
 if(a.kind==='camel'&&horse(t))return 1.2;
 if(a.kind==='elephant'&&t.kind==='infantry')return 1.25;
 return 1;
}
export function rangedShield(a,t,shot){return shot&&t.kind==='infantry'&&front(a,t)?(a.kind==='crossbows'?.8:.6):1;}
function hexAdjacent(a,b){const x=a.x-(a.y-(a.y&1))/2,y=b.x-(b.y-(b.y&1))/2;return (Math.abs(x-y)+Math.abs(a.y-b.y)+Math.abs(x+a.y-y-b.y))/2===1;}
export function chargeFactor(b,a,t){
 if(a.kind!=='heavy-cavalry'||(a.chargeRun??0)<2||a.chargeFacing!==direction(a,t)||spearGuard(a,t))return 1;
 const camel=b.units.some(v=>v.side!==a.side&&v.count>0&&!v.fled&&v.kind==='camel'&&hexAdjacent(v,a));
 return 1+(['infantry','spears','archers','crossbows'].includes(t.kind)&&!t.defending?.35:.3)*(camel?.5:1);
}
export function troopSkill(b,a,t,shot){
 let f=counterFactor(a,t,shot);
 if(!shot){f*=chargeFactor(b,a,t);if(a.kind==='heavy-cavalry')f*=1.15;if(a.kind==='cavalry'&&!front(a,t))f*=1.15;}
 if(a.kind==='camel'&&terrainAt(b,a.x,a.y)==='sand')f*=1.2;
 return Math.min(1.5,f);
}
