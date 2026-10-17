import {SAVE_KEY,validateSave} from './game.mjs';
export const SLOTS_KEY='emperor.save.slots.v1';
export const SLOT_COUNT=11;
export function readSlots(storage){
 const raw=storage.getItem(SLOTS_KEY),saved=raw?JSON.parse(raw):[];
 if(!Array.isArray(saved))throw Error('存档列表损坏，请先导出当前进度');
 if(saved.length===SLOT_COUNT&&saved.every((s,i)=>!s||s.id===`slot:${i}`))return saved;
 const slots=Array(SLOT_COUNT).fill(null);
 const latest=storage.getItem(SAVE_KEY);
 if(latest){try{slots[0]={id:'slot:0',kind:'auto',at:saved.find(s=>s?.kind==='auto')?.at||Date.now(),data:validateSave(JSON.parse(latest))};}catch{/* Unsupported progress is not loaded or converted; a new dynasty may still save. */}}
 else if(saved.find(s=>s?.kind==='auto'))slots[0]={...saved.find(s=>s?.kind==='auto'),id:'slot:0'};
 saved.filter(s=>s?.kind==='manual').slice(0,10).forEach((s,i)=>slots[i+1]={...s,id:`slot:${i+1}`});
 return slots;
}
export function writeProgress(storage,next){
 if(typeof storage.getItem!=='function'){storage.setItem(SAVE_KEY,JSON.stringify(next));return;}
 const previous=storage.getItem(SLOTS_KEY),slots=readSlots(storage);
 slots[0]={id:'slot:0',kind:'auto',at:Date.now(),data:next};
 try{storage.setItem(SLOTS_KEY,JSON.stringify(slots));storage.setItem(SAVE_KEY,JSON.stringify(next));}
 catch{try{if(previous===null)storage.removeItem(SLOTS_KEY);else storage.setItem(SLOTS_KEY,previous);}catch{}throw Error('保存失败，本次操作未执行，请释放存储空间后重试。');}
}
export function writeSlot(storage,index,data,label=''){
 if(!Number.isInteger(index)||index<0||index>=SLOT_COUNT)throw Error('无效的存档位置');
 const copy=validateSave(structuredClone(data));
 if(index===0){writeProgress(storage,copy);return readSlots(storage)[0];}
 const slots=readSlots(storage),entry={id:`slot:${index}`,kind:'manual',label:label.trim().slice(0,40)||'手动存档',at:Date.now(),data:copy};
 slots[index]=entry;
 try{storage.setItem(SLOTS_KEY,JSON.stringify(slots));}catch{throw Error('手动存档失败，请导出备份或释放存储空间。');}return entry;
}
export function manualSave(storage,data,label='',index){
 const target=index??readSlots(storage).findIndex((s,i)=>i>0&&!s);
 if(target<1)throw Error('手动存档已满，请选择要覆盖的位置');
 return writeSlot(storage,target,data,label);
}
