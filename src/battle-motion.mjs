// Original procedural combat choreography, anchored to the existing painted art.
export function attackMotion(kind,dx,dy){
 const reach=kind==='spears'?.22:(kind==='cavalry'||kind==='heavy-cavalry')?.36:.26;
 const pose=(f,offset)=>({transform:`translate(${dx*f}px,${dy*f}px)`,offset});
 return [pose(0,0),pose(-.035,.18),pose(reach,.42),pose(reach,.49),pose(.06,.78),pose(0,1)];
}
const grounded=(x,angle,scale=1)=>`translate(${x}px,24px) rotate(${angle}deg) scale(1,${scale}) translate(0,-24px)`;
export function hitMotion(direction,mounted=false){
 return [{transform:grounded(0,0),filter:'brightness(1)'},
  {transform:grounded(direction*(mounted?5:8),direction*(mounted?3:6),.97),filter:'brightness(1.45)',offset:.18},
  {transform:grounded(direction*2,-direction,1),filter:'brightness(1)',offset:.6},
  {transform:grounded(0,0),filter:'brightness(1)'}];
}
export function deathMotion(direction,mounted=false){
 return [{transform:grounded(0,0),opacity:1},
  {transform:grounded(direction*7,direction*9,.91),opacity:1,offset:.2},
  {transform:grounded(direction*(mounted?12:16),direction*(mounted?30:68),mounted?.56:.35),opacity:.8,offset:.65},
  {transform:grounded(direction*(mounted?14:18),direction*(mounted?34:75),mounted?.5:.3),opacity:0}];
}
