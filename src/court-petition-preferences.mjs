import {courtAgenda} from './court-agenda.mjs';
const key=s=>'emperor.court.archived.v1:'+s.createdAt;
export function readArchived(s,storage){try{const v=JSON.parse(storage.getItem(key(s))??'[]');return Array.isArray(v)?v.filter(x=>typeof x==='string').slice(-256):[];}catch{return [];}}
export function visibleCourtAgenda(s,storage){return courtAgenda(s,{archived:readArchived(s,storage)});}
export function archivePetition(s,item,storage){if(['capital','war'].includes(item.id))throw Error('紧急军情须先处理');const next=[...new Set([...readArchived(s,storage),item.archiveKey])].slice(-256);try{storage.setItem(key(s),JSON.stringify(next));}catch{throw Error('收折保存失败，请重试');}}
export function restorePetitions(s,storage){try{storage.removeItem(key(s));}catch{throw Error('恢复奏折失败，请重试');}}
