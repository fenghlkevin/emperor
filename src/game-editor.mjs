import {validateSave} from './game.mjs';
import {postTreasury} from './finance.mjs';
import {postNationalGrain} from './national-resources.mjs';
import {WELFARE,BUILDINGS} from './domestic.mjs';

const field=(key,label,max=100,min=0)=>({key,label,min,max});
export const EDITOR_FIELDS={
 emperor:[field('stats.age','年龄',150,1),field('stats.energy','体力',500),field('stats.maxEnergy','体力上限',500,1),field('stats.health','健康'),field('stats.happiness','快乐'),...['charm:魅力','talent:才艺','wisdom:智慧','martial:武术'].map(s=>{const [key,label]=s.split(':');return field('stats.'+key,label,500);}),field('stats.life','剩余寿元（旬）',1000000),field('stats.lifeLimit','寿元上限（旬）',1000000,1)],
 people:[...['intelligence:智力','martial:武力','leadership:统率','politics:政务','integrity:清廉','loyalty:忠诚','experience:经验'].map(s=>field(...s.split(':'))),field('age','年龄',100,1)],
 provinces:[...WELFARE.map(([k,n])=>field('welfare.'+k,n)),field('status.livingStandard','生活水平'),field('military.training','驻军训练'),...BUILDINGS.map(([k,n])=>field('buildings.'+k,n,10000))],
 countries:[field('fiscal.treasury','国库银两（两）',1e12),field('fiscal.grain','全国存粮（石）',1e12),field('prestige','威望',500)]
};
export const editorValue=(object,key)=>key.split('.').reduce((o,k)=>o?.[k],object);
export function editorObjects(state,kind){
 if(kind==='emperor')return [{id:'emperor',name:state.name,stats:state.stats}];
 if(kind==='people')return state.domestic.justice.officials.filter(p=>!['executed','deceased'].includes(p.status));
 if(kind==='provinces')return state.domestic.provinces;
 if(kind==='countries')return state.domestic.countries;
 throw Error('编辑分类无效');
}
export function editorAvailable(state){return !state.reignResult&&!state.domestic.collapse?.pending&&!state.domestic.collapse?.ended&&!state.domestic.war?.battle&&!state.domestic.strategy?.pending;}
export function applyEditorChanges(state,kind,id,values){
 if(!editorAvailable(state))throw Error('请先完成当前战斗或危机，再编辑本局数据。');
 const next=structuredClone(state),object=editorObjects(next,kind).find(o=>o.id===id);
 if(!object)throw Error('编辑对象不存在');
 const changes=[];
 for(const [key,value] of Object.entries(values)){
  const f=EDITOR_FIELDS[kind].find(f=>f.key===key);
  if(!f||!Number.isSafeInteger(value)||value<f.min||value>f.max)throw Error(`${f?.label??key}须为${f?.min??0}至${f?.max??100}之间的整数`);
  const before=editorValue(object,key);if(before===value)continue;
  changes.push({label:f.label,before,after:value});
  if(kind==='countries'&&key.startsWith('fiscal.')){
   const delta=value-before,entry={turn:next.turn,income:Math.max(0,delta),expense:Math.max(0,-delta),category:'event',reason:'局内编辑器调整',key:`editor:${next.saveRevision}:${key}`};
   if(key==='fiscal.treasury')postTreasury(next.domestic,id,{...entry,category:'oneOff'});else postNationalGrain(next.domestic,id,entry);
  }else{const keys=key.split('.'),last=keys.pop();keys.reduce((o,k)=>o[k],object)[last]=value;}
 }
 if(!changes.length)throw Error('尚未修改任何数值');
 if(kind==='emperor'){
  if(next.stats.energy>next.stats.maxEnergy)throw Error('体力不能超过体力上限，请同时调整体力或上限');
  if(next.stats.life>next.stats.lifeLimit)throw Error('剩余寿元不能超过寿元上限，请同时调整寿元或上限');
 }
 if(kind==='people')object.growthVersion=1;
 return {next:validateSave(next),changes};
}
