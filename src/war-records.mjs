export const RECORD_FIELDS=['total','victories','defeats','unknown','homeDead','enemyDead'];
export const zeroRecord=()=>Object.fromEntries(RECORD_FIELDS.map(k=>[k,0]));
export function summarizeHistory(d,beforeTurn=Infinity){
 const record=zeroRecord(),home=d.countries.find(c=>c.id===d.playerCountryId).name;
 const rows=d.war.history.filter(r=>r.kind==='war'&&r.turn<beforeTurn&&(r.title!=='边境战报'||r.lines.some(l=>l.includes(home))));
 for(const r of rows){record.total++;const win=r.report?.result==='victory'||r.lines.some(l=>/战果：获胜|守方获胜/.test(l)),loss=r.report?.result==='defeat'||r.lines.some(l=>/战果：战败|守方失利/.test(l));record[win?'victories':loss?'defeats':'unknown']++;record.homeDead+=r.report?.home?.dead??0;record.enemyDead+=r.report?.enemy?.dead??0;}
 return record;
}
export function initializeWarRecord(d){const w=d.war;if(!w||w.career)return;w.career={version:1,...summarizeHistory(d),lastId:Math.max(0,w.nextId-1),coverage:w.nextId===1?'complete':'retained-history'};}
export function recordWar(d,id,{win,homeDead=0,enemyDead=0}){initializeWarRecord(d);const c=d.war.career;if(id<=c.lastId)throw Error('战绩已累计');if(typeof win!=='boolean'||![homeDead,enemyDead].every(n=>Number.isSafeInteger(n)&&n>=0))throw Error('战绩无效');c.lastId=id;c.total++;c[win?'victories':'defeats']++;c.homeDead+=homeDead;c.enemyDead+=enemyDead;}
export function reignWars(s){initializeWarRecord(s.domestic);const c=s.domestic.war.career,b=s.endings?.warBaseline??zeroRecord();return {...Object.fromEntries(RECORD_FIELDS.map(k=>[k,c[k]-b[k]])),coverage:s.endings?.completeReign?'complete':c.coverage};}
export function validateWarRecord(d){const c=d.war?.career;if(!c||c.version!==1||!['complete','retained-history'].includes(c.coverage)||!Number.isSafeInteger(c.lastId)||c.lastId<0||c.lastId>=d.war.nextId||RECORD_FIELDS.some(k=>!Number.isSafeInteger(c[k])||c[k]<0)||c.total!==c.victories+c.defeats+c.unknown)throw Error('永久战绩无效');}
