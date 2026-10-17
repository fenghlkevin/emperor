export const ROYAL_EVENT_ART={
 pregnancy:{src:'assets/royal-events/pregnancy.png',alt:'太医为嫔妃诊脉，宫女在侧静候喜讯',note:'十月静养 · 恭候皇嗣'},
 miscarriage:{src:'assets/royal-events/miscarriage.png',alt:'嫔妃在寝宫休养，侍女在旁奉药照料',note:'孕期已结束 · 内廷留记'},
 birth:{src:'assets/royal-events/birth.png',alt:'乳母轻抱襁褓中的新生皇嗣，宫中报喜',note:'添丁之喜 · 已录入皇嗣玉牒'},
 death:{src:'assets/royal-events/death.png',alt:'空置的皇子寝榻与木马，烛火静燃以寄哀思',note:'玉牒留名 · 宫中寄哀'}
};
export const ROYAL_EVENT_TITLES={pregnancy:'嫔妃有喜',miscarriage:'嫔妃流产',birth:'皇嗣降生',death:'皇子夭折'};
export function recordRoyalEvent(state,kind,message,availableTurn=state.turn){
 const h=state.harem;h.royalNotices??=[];h.royalNoticeSequence=(h.royalNoticeSequence??0)+1;
 h.royalNotices.push({id:h.royalNoticeSequence,kind,message,turn:state.turn,availableTurn});
}
export function pendingRoyalEvent(state){return state.harem.royalNotices?.find(e=>e.availableTurn<=state.turn);}
export function validateRoyalEvents(state){
 const h=state.harem;
 if(h.royalNotices===undefined)h.royalNotices=[];
 if(h.royalNoticeSequence===undefined)h.royalNoticeSequence=0;
 if(!Number.isSafeInteger(h.royalNoticeSequence)||h.royalNoticeSequence<0||!Array.isArray(h.royalNotices)||new Set(h.royalNotices.map(e=>e?.id)).size!==h.royalNotices.length||h.royalNotices.some(e=>!e||!Number.isSafeInteger(e.id)||e.id<1||e.id>h.royalNoticeSequence||!Object.hasOwn(ROYAL_EVENT_TITLES,e.kind)||typeof e.message!=='string'||e.message.length>1000||!Number.isInteger(e.turn)||e.turn<1||e.turn>state.turn||!Number.isInteger(e.availableTurn)||e.availableTurn<e.turn||e.availableTurn>e.turn+1))throw Error('皇嗣事件提示存档无效');
}
