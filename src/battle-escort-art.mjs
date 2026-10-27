import {escortFrames} from './battle-escort-frames.mjs';
// Dedicated escorts painted from the approved battle UI reference.
export const escortSprites=Object.fromEntries(['spears','infantry','cavalry'].map((kind,column)=>{
 const frames=escortFrames[kind];
 return [`escort-${kind}`,{asset:'assets/battle/units/war-escorts-core-v2.png',width:1536,height:1024,
  displayWidth:180,displayHeight:108,mounted:kind==='cavalry',
  walk:frames.slice(0,2),attack:[frames[2],frames[3],frames[2],frames[0]],fps:{walk:5,attack:6}}];
}));
