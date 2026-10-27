// Isolated UI fixture: never reads or writes player storage and cannot start a battle.
import {newGame,validateSave} from '../../src/game.mjs';
import {initializeResourceEconomy} from '../../src/province-resources.mjs';
import {openCourtPersonnel} from '../../src/court-personnel-ui.mjs';
import {openGeneral} from '../../src/general-ui.mjs';
import {openEnvoyPlanner} from '../../src/envoy-planner-ui.mjs';
import {openRevenue} from '../../src/revenue-ui.mjs';
import {openConstruction} from '../../src/construction-ui.mjs';
import {openCourtSpecial} from '../../src/court-special-ui.mjs';
import {openCourtJustice} from '../../src/court-justice-ui.mjs';
const root=document.body,status=document.querySelector('#fixture-status');
let state,commits=0,closed=0;
function commit(next){const mode=document.querySelector('#save-mode').value;if(mode==='false')return false;if(mode==='throw')throw Error('验收：保存失败，原档未改');validateSave(structuredClone(next));state=next;commits++;status.textContent=`保存${commits}次；返回${closed}次；国库${state.stats.treasury}`;return state;}
function close(){closed++;status.textContent=`保存${commits}次；返回${closed}次；国库${state.stats.treasury}`;}
for(const [name,open] of [
 ['地方授权',(s)=>openCourtPersonnel(s,root,commit,close,{view:'delegate',provinceId:'hebei'})],
 ['吏部任命',(s)=>openCourtPersonnel(s,root,commit,close)],
 ['大将军办理',(s)=>openGeneral(s,root,commit,close)],
 ['礼部祭祀',(s)=>openEnvoyPlanner(s,root,commit,close,{tab:'ritual'})],
 ['户部理财',(s)=>openRevenue(s,root,commit,close)],
 ['工部营建',(s)=>openConstruction(s,root,commit,close)],
 ['特殊工程',(s)=>openCourtSpecial(s,root,commit,close)],
 ['刑部办理',(s)=>openCourtJustice(s,root,commit,close)],
]){const b=document.createElement('button');b.textContent=name;b.onclick=()=>{state=newGame('办理独立验收');initializeResourceEconomy(state.domestic);open(state);};document.querySelector('#fixture-actions').append(b);}
