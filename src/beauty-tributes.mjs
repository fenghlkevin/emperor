import {BEAUTY_CITIES} from './beauty-cities.mjs';
import {generateBeauty} from './random-beauty-generation.mjs';
import {ensurePortrait,portraitHash,portraitRandom} from './beauty-portrait.mjs';
import {relationBetween} from './diplomacy.mjs';
import {recordRoyalEvent} from './royal-events.mjs';
export const BEAUTY_TRIBUTE_RULES={prestige:200,friendship:80,chance:.05};
export function validateBeautyTributes(s){
 const last=s.harem.beautyTributeLastTurn;
 for(const p of [...s.harem.members,...(s.harem.encounter?[s.harem.encounter]:[])]){
 const o=p.tributeOrigin;if(o!==undefined&&(!o||!['annual','foreign'].includes(o.kind)||!Number.isInteger(o.turn)||o.turn<1||o.turn>s.turn||!s.domestic.provinces.some(v=>v.id===o.provinceId)||!s.domestic.countries.some(c=>c.id===o.countryId)||p.cityId!==o.provinceId))throw Error('佳人进献来源无效');
 if(p.regionalPortrait!==undefined&&(typeof p.regionalPortrait!=='boolean'||p.regionalPortrait&&(!p.randomBeauty||p.randomPortraitAsset!==undefined)))throw Error('佳人地域立绘无效');
 }
 if(last!==undefined&&(!Number.isInteger(last)||last<1||last>s.turn))throw Error('佳人进献结算时间无效');
}
export function settleBeautyTributes(s,random){
 const h=s.harem,d=s.domestic;if(h.beautyTributeLastTurn===s.turn)return;
 h.beautyTributeLastTurn=s.turn;
 if(s.stats.life===0||d.collapse?.ended)return;
 random??=portraitRandom(portraitHash(`${h.portraitSeed}|tribute|${s.turn}`));
 const admit=(province,kind)=>{
 let id;do{id=`random-beauty-${h.portraitSeed}-${h.sequence++}`;}while(h.members.some(p=>p.id===id)||h.encounter?.id===id||(h.seen??[]).includes(id));
 const person=ensurePortrait(generateBeauty({id,cityId:province.id,random}),`tribute:${id}`);
 person.tributeOrigin={kind,turn:s.turn,provinceId:province.id,countryId:province.countryId};
 person.biography+=`第${s.turn}旬由${province.name}选送入宫。`;h.members.push(person);
 return `${province.name}：${person.name}（外表${person.appearance}，能力${person.ability}）`;
 };
 const cities=new Set(BEAUTY_CITIES.map(c=>c.id));
 if((s.turn-1)%36===0){
 const lines=d.provinces.filter(p=>p.countryId===d.playerCountryId&&cities.has(p.id)).map(p=>admit(p,'annual'));
 if(lines.length){const message=`正月上旬，各州选送佳人${lines.length}名，均以未册封身份入宫。${lines.join('；')}。`;recordRoyalEvent(s,'beauty-tribute',message);h.history.unshift(`第${s.turn}旬：${message}`);}
 }
 const prestige=d.countries.find(c=>c.id===d.playerCountryId)?.prestige??0;
 if(prestige>=BEAUTY_TRIBUTE_RULES.prestige){
 const eligible=d.provinces.filter(p=>{if(p.countryId===d.playerCountryId||!cities.has(p.id))return false;const r=relationBetween(d,d.playerCountryId,p.countryId);return r&&r.relation!=='hostile'&&r.friendship>=BEAUTY_TRIBUTE_RULES.friendship;});
 if(eligible.length&&random()<BEAUTY_TRIBUTE_RULES.chance){const province=eligible[Math.floor(random()*eligible.length)],line=admit(province,'foreign'),country=d.countries.find(c=>c.id===province.countryId);const message=`${country.name}遣使进献成年佳人，${line}，已以未册封身份入宫。`;recordRoyalEvent(s,'beauty-tribute',message);h.history.unshift(`第${s.turn}旬：${message}`);}
 }
 h.history=h.history.slice(0,30);
}
