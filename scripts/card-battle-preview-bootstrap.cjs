// The isolated playable preview uses the same committed-state save boundary as the game.
function previewBootstrap({showcase=false}={}){
 return `(async()=>{
  if(window.cardPreviewMounted)return;window.cardPreviewMounted=true;
  const {createCardBattlePreview,createCardBattleShowcase}=await import('./scripts/card-battle-preview-state.mjs'),{drawBattle}=await import('./src/battle-ui.mjs'),{drawWarResult}=await import('./src/war-result-ui.mjs'),{validateSave}=await import('./src/game.mjs');
  const key=${JSON.stringify(showcase?'emperor.card-preview.showcase.v1':'emperor.card-preview.play.v1')};let state;
  const saved=localStorage.getItem(key);
  if(saved){try{const candidate=JSON.parse(saved);validateSave(candidate);if(candidate.domestic.war.battle?.cards?.rulesVersion===3){state=candidate;console.log('CARD_PREVIEW_RECOVERED');}}catch(e){console.error('CARD_PREVIEW_SAVE_INVALID '+e.message);}}
  state??=${showcase?'createCardBattleShowcase()':'createCardBattlePreview()'};
  validateSave(state);localStorage.setItem(key,JSON.stringify(state));
  window.cardPreviewSnapshot=()=>JSON.parse(JSON.stringify(state));
  const open=()=>{const d=document.createElement('dialog');document.body.append(d);d.onclose=()=>{d.remove();if(!state.domestic.war.battle)return;const b=document.createElement('button');b.textContent='继续军阵试玩';b.onclick=()=>{b.remove();open();};document.body.append(b);};drawBattle(d,()=>state,s=>{validateSave(s);localStorage.setItem(key,JSON.stringify(s));state=s;},r=>drawWarResult(d,r,()=>window.close(),()=>window.close()));d.showModal();};
  open();console.log('CARD_PREVIEW_READY round='+state.domestic.war.battle.round+' mana='+state.domestic.war.battle.cards.players.home.mana);
 })()`;
}
module.exports={previewBootstrap};
