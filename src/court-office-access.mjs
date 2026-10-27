import {justiceDeputyMarkup,openJusticeDeputy} from './justice-deputy-ui.mjs';
import {openRitesDeputy,ritesDeputyMarkup} from './rites-deputy-ui.mjs';
import {openPersonnel} from './personnel-ui.mjs';
import {worksDeputyMarkup,openWorksDeputy} from './works-deputy-ui.mjs';
import {warDeputyMarkup,openWarDeputy} from './war-deputy-ui.mjs';
import {revenueDeputyMarkup,openRevenueDeputy} from './revenue-deputy-ui.mjs';
import {CONSTRUCTION_PLANS} from './construction.mjs';
import {CENTRAL_OFFICES} from './personnel.mjs';
import {countrySummary} from './domestic.mjs';
import {governanceSummaryMarkup} from './court-governance-ui.mjs';
const actions={
 'revenue-minister':['atlas-grain','food-purchase','tax','subsidy','census','register'],
 'works-minister':['atlas-build','industry','special','register','works-buildings','works-develop','works-expand','works-levy-militia','works-release-militia','works-special','works-schedule','works-records'],
 'war-minister':['army-recovery','espionage','garrison','garrison-purchase','garrison-recruit','garrison-dismiss','garrison-transfer','campaign'],
 'central-general':['register'],
 'personnel-minister':['personnel','personnel-honor','personnel-dismiss','personnel-budget','personnel-delegate','personnel-exam','personnel-hanlin'],
 'justice-minister':['justice','justice-funding','justice-sentence','justice-amnesty','register'],
 'rites-minister':['diplomacy','register'],
 'prime-minister':['office-report','domestic-register','petition']
};
export function canOfficeNavigate(office,action){
 if(!CENTRAL_OFFICES.some(o=>o.id===office))return false;
 if(office==='war-deputy')return ['office-report','register'].includes(action);
 if(office==='justice-deputy')return ['office-report','justice-prison'].includes(action);
 if(office==='personnel-deputy')return ['office-report','personnel-profiles'].includes(action);
 if(office.endsWith('-deputy'))return action==='office-report';
 return action==='office-report'||Boolean(actions[office]?.includes(action));
}
export function assertOfficeNavigation(office,action){if(!canOfficeNavigate(office,action))throw Error('此职不办理该事项，请由陛下召见主管尚书。');}
export function officeReport(state,office){
 const role=CENTRAL_OFFICES.find(o=>o.id===office);if(!role)throw Error('官职不存在');
 const d=state.domestic,q=countrySummary(d,undefined,state.turn),ps=q.provinces,department=role.department;
 let rows=[];
 if(office==='prime-minister')rows=[['国库',`${q.country.fiscal.treasury}两`],['当前预算预计',`${q.income}入 / ${q.expenditure}支 / ${q.net}净两每旬`],['本国州数',ps.length],['地方委任',`${d.personnel.delegations.length}州`],['在建普通工程',ps.filter(p=>p.construction.project).length],['全国特殊工程',d.specialWorks.project?'在建':'无']];
 if(office==='prime-minister'){const actual=q.country.ledger.find(r=>r.turn===state.turn&&!r.legacy);if(actual)rows.splice(2,0,['本旬已结算',`第${actual.turn}旬：实收${actual.income}两 / 实付${actual.expenditure}两 / 期末${actual.closingTreasury}两`]);}
 else if(department==='户部')rows=ps.map(p=>[p.name,`人口${p.population.total}，田赋统一入全国粮库，税率${Math.round(p.budget.taxRate*100)}%`]);
 if(department==='户部')rows.push(...d.fiscalActions.records.map(r=>[`第${r.turn}旬 · ${r.kind==='census'?'招纳流民入籍':r.title}`,`支出${r.cost}两，入账${r.income}两；${r.lines.join('；')}`]));
 else if(department==='工部')rows=ps.map(p=>[p.name,`普通工程${p.construction.project?`${CONSTRUCTION_PLANS[p.construction.project.building].name}：${p.construction.project.progress}工量`:'无'}；开垦/产业${p.development.project?`${p.development.project.area}亩`:'无'}；现有民夫${p.population.professions.militia}人`]);
 else if(department==='兵部'||office==='central-general')rows=ps.map(p=>[p.name,`兵员${p.population.professions.soldiers}，训练${p.military.training}`]);
 else if(department==='吏部')rows=d.justice.officials.filter(o=>o.status==='serving').map(o=>[o.name,`${o.office}；政治${o.politics??50}，智力${o.intelligence??50}`]);
 else if(department==='礼部')rows=d.diplomacy.filter(r=>r.countryIds.includes(d.playerCountryId)).map(r=>[d.countries.find(c=>c.id===r.countryIds.find(id=>id!==d.playerCountryId))?.name??'未知邦国',`邦交${({none:'常态',ally:'盟好',hostile:'敌对'})[r.relation]??r.relation}；友善${r.friendship}`]);
 else if(department==='刑部')rows=[['已查实待决',d.justice.officials.filter(o=>o.status==='serving'&&o.discovered).length],['在押',d.justice.officials.filter(o=>o.status==='imprisoned').length]];
 return {title:office==='prime-minister'?'宰相·国政汇总':`${role.name}·本部查阅`,scope:office==='prime-minister'?'汇总国情与协调呈奏，具体事项由主管部门办理。':'本部只读资料；不提供任命、征兵、建设或拨款操作。',rows};
}
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function officeReportMarkup(state,office){if(office==='justice-deputy')return justiceDeputyMarkup(state);if(office==='rites-deputy')return ritesDeputyMarkup(state);if(office==='works-deputy')return worksDeputyMarkup(state);if(office==='war-deputy')return warDeputyMarkup(state);if(office==='revenue-deputy')return revenueDeputyMarkup(state);if(office==='prime-minister')return governanceSummaryMarkup(state);const r=officeReport(state,office);return `<p>${esc(r.scope)}</p><div class="civil-table"><table><thead><tr><th>项目</th><th>记录与口径</th></tr></thead><tbody>${r.rows.map(row=>`<tr>${row.map(v=>`<td>${esc(v)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;}
export function openOfficeReport(state,root,office,onClose,options={}){if(office==='justice-deputy')return openJusticeDeputy(state,root,onClose,options);if(office==='rites-deputy')return openRitesDeputy(state,root,onClose);if(office==='personnel-deputy')return openPersonnel(state,root,onClose);if(office==='works-deputy')return openWorksDeputy(state,root,onClose);if(office==='war-deputy')return openWarDeputy(state,root,onClose);if(office==='revenue-deputy')return openRevenueDeputy(state,root,onClose);const r=officeReport(state,office),d=document.createElement('dialog'),scroll=office==='prime-minister';d.className=scroll?'governance-dialog':'domestic-dialog turn-economy-report';d.setAttribute('aria-label',r.title);d.innerHTML=`${scroll?'<span class="governance-roller governance-roller--left" aria-hidden="true"></span><span class="governance-roller governance-roller--right" aria-hidden="true"></span>':''}<header class="${scroll?'governance-header':'civil-header'}"><h1>${esc(r.title)}</h1><button aria-label="关闭查阅" autofocus>${scroll?'关闭 ×':'×'}</button></header><div class="${scroll?'governance-content':'civil-content'}">${officeReportMarkup(state,office)}</div>`;d.querySelector('button').onclick=()=>d.close();d.onclose=()=>{d.remove();onClose?.();};root.append(d);d.showModal();return d;}
const surfaceViews={
 atlas:{'revenue-minister':['grain','finance'],'works-minister':['build'],'war-minister':['army']},
 national:{'works-minister':['works'],'personnel-minister':['people','officials']}
};
export function officeSurfaceViews(office,surface,all){return office?all.filter(id=>surfaceViews[surface]?.[office]?.includes(id)):[...all];}
export function assertOfficeSurface(office,surface,view){if(office&&!surfaceViews[surface]?.[office]?.includes(view))throw Error('此页超出本部职掌，请召见主管部门办理。');}
export function assertNationalOfficeCommand(office,kind){if(!office)return;if(office==='works-minister'&&['special','cancel-special'].includes(kind))return;throw Error('此政令不属本部职掌。');}
