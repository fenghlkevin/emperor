import {officeRegister} from './personnel.mjs';
import {servingOfficials,officeId} from './personnel-actions.mjs';
export function appointmentSeats(d){const people=servingOfficials(d);return Object.fromEntries(officeRegister(d).map(o=>[o.id,people.find(p=>officeId(p)===o.id)?.id??null]));}
export function changeAppointment(seats,officeId,personId){
 if(!Object.hasOwn(seats,officeId))throw Error('官职无效');
 const next={...seats},from=Object.keys(next).find(id=>next[id]===personId);
 if(from===officeId)return next;
 if(from)next[from]=next[officeId];
 next[officeId]=personId;return next;
}
export function appointmentChanges(original,seats){return Object.entries(seats).filter(([id,person])=>person!==original[id]);}
export function appointmentAssignments(original,seats){return appointmentChanges(original,seats).filter(([,person])=>person!==null).map(([officeId,officialId])=>({officeId,officialId}));}
