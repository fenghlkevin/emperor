import {openMilitaryHelp} from './military-help-ui.mjs';
// Reuse the fiscal scroll frame without replacing the military controls or rules.
export function militaryPage(d,title){
 d.classList.add('court-atlas','military-single-page');
 const header=d.querySelector(':scope>header');header.classList.add('atlas-header');header.querySelector('h1').textContent=title;
 const close=header.querySelector('button');close.classList.add('court-dialog-close');close.textContent='关闭 ×';close.setAttribute('aria-label','返回朝堂');
 d.querySelector(':scope>nav')?.remove();
 const body=d.querySelector('.personnel-scene-body,.revenue-body,.governance-content');body.classList.add('military-layout');
 const decision=d.querySelector('.personnel-decision');if(decision)decision.classList.add('atlas-order');
 for(const input of d.querySelectorAll('input[type=number]')){
  const field=document.createElement('div');field.className='military-amount atlas-amount';
  const controls=document.createElement('div');input.before(field);field.append(controls);
  const step=direction=>{if(direction<0)input.stepDown();else input.stepUp();input.dispatchEvent(new Event('input',{bubbles:true}));};
  const less=document.createElement('button'),more=document.createElement('button');
  for(const [button,direction,label] of [[less,-1,'减少'],[more,1,'增加']]){button.type='button';button.textContent=direction<0?'−':'＋';button.setAttribute('aria-label',label);button.disabled=input.disabled;button.onclick=()=>step(direction);}
  controls.append(less,input,more);
 }
 const main=d.querySelector('.personnel-scene-main'),side=d.querySelector('.personnel-scene-side');
 const explanations=[];
 for(const el of d.querySelectorAll('.military-confirm-notes,.garrison-map-note,.personnel-scene-detail>p,.draft-controls>p,.garrison-support,.garrison-ledger,.campaign-original,.campaign-count>small,.revenue-workspace>p,.revenue-command-note,.revenue-command-heading>p,.governance-content>p:first-child')){
  if(el.querySelector('button,input,select')||el.matches('[role=status],[data-military-fact]')||(el.matches('.personnel-scene-detail>p')&&d.querySelector('[data-garrison-seal],[data-campaign-seal]')))continue;
  explanations.push(el.textContent.trim());el.remove();
 }
 if(explanations.length){const help=document.createElement('button');help.className='military-help';help.textContent='？';help.setAttribute('aria-label','查看军务说明');help.onclick=()=>openMilitaryHelp(d,'军务说明',explanations.join('\n\n'));header.append(help);}
 if(main&&side){
 const draft=d.querySelector('.draft-controls');if(draft){
  for(const label of draft.querySelectorAll('.industry-targets>label')){
   const select=label.querySelector('select'),text=label.firstChild.textContent;
   const match=text.match(/^(.+?)：现有([\d,]+)人，已抽([\d,]+)人，最多再抽([\d,]+)人$/);
   if(!match)continue;
   const name=document.createElement('span');name.className='military-draft-name';name.textContent=match[1];
   const facts=document.createElement('dl');facts.className='military-draft-facts';
   for(const [title,value] of [['现有',match[2]],['已抽',match[3]],['可再抽',match[4]]]){const row=document.createElement('div'),term=document.createElement('dt'),count=document.createElement('dd');term.textContent=title;count.textContent=value+' 人';row.append(term,count);facts.append(row);}
   label.replaceChildren(name,facts,select);
  }
  main.append(draft);draft.open=true;
 }

 }else if(d.querySelector(':scope>.revenue-command')&&d.dataset.kitTab!=='inventory'){
 const command=d.querySelector(':scope>.revenue-command');command.classList.add('military-legacy-command');body.append(command);
 }
}
