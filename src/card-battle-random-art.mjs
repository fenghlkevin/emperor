// Presentation only: lookup the already fixed portraitId, never reroll identity.
export const RANDOM_BATTLE_ART=Object.freeze(Object.fromEntries([
["random-civil-1", "assets/battle/people/random-civil-1-battle-v1.png"],
["random-civil-2", "assets/battle/people/random-civil-2-battle-v1.png"],
["random-civil-3", "assets/battle/people/random-civil-3-battle-v1.png"],
["random-civil-4", "assets/battle/people/random-civil-4-battle-v1.png"],
["random-civil-5", "assets/battle/people/random-civil-5-battle-v1.png"],
["random-civil-6", "assets/battle/people/random-civil-6-battle-v1.png"],
["random-civil-7", "assets/battle/people/random-civil-7-battle-v1.png"],
["random-civil-8", "assets/battle/people/random-civil-8-battle-v1.png"],
["random-civil-9", "assets/battle/people/random-civil-9-battle-v1.png"],
["random-civil-10", "assets/battle/people/random-civil-10-battle-v1.png"],
["random-military-1", "assets/battle/people/random-military-1-battle-v1.png"],
["random-military-2", "assets/battle/people/random-military-2-battle-v1.png"],
["random-military-3", "assets/battle/people/random-military-3-battle-v1.png"],
["random-military-4", "assets/battle/people/random-military-4-battle-v1.png"],
["random-military-5", "assets/battle/people/random-military-5-battle-v1.png"],
["random-military-6", "assets/battle/people/random-military-6-battle-v1.png"],
["random-military-7", "assets/battle/people/random-military-7-battle-v1.png"],
["random-military-8", "assets/battle/people/random-military-8-battle-v1.png"],
["random-military-9", "assets/battle/people/random-military-9-battle-v1.png"],
["random-military-10", "assets/battle/people/random-military-10-battle-v1.png"]
].map(([personId,src])=>[personId,Object.freeze({personId,src,version:1})])));
export const randomBattleArt=portraitId=>typeof portraitId==='string'?RANDOM_BATTLE_ART[portraitId]??null:null;
