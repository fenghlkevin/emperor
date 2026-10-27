// 游戏历法每月三旬；1—3月春、4—6月夏、7—9月秋、10—12月冬。
export const SEASONS=[{id:'spring',name:'春',detail:'新芽初绽 · 满苑春绿'},{id:'summer',name:'夏',detail:'浓荫深翠 · 草木繁盛'},{id:'autumn',name:'秋',detail:'金叶染庭 · 秋意渐浓'},{id:'winter',name:'冬',detail:'琼楼覆雪 · 银装宫阙'}];
export const DAYLIGHT=[{id:'dawn',name:'卯时',detail:'晨曦初照'},{id:'morning',name:'巳时',detail:'清光满庭'},{id:'noon',name:'午时',detail:'日华当空'},{id:'afternoon',name:'申时',detail:'斜阳入院'},{id:'dusk',name:'酉时',detail:'落霞映阙'},{id:'night',name:'亥时',detail:'月色宫灯'}];
const WEATHER={spring:['clear','clear','cloudy','mist','rain'],summer:['clear','clear','cloudy','rain','rain'],autumn:['clear','clear','cloudy','mist','leaves'],winter:['snow','snow','snow','cloudy','clear']};
const WEATHER_NAMES={clear:'晴',cloudy:'多云',mist:'薄雾',rain:'细雨',leaves:'落叶随风',snow:'飘雪'};
// 使用存档身份、回合与阶段取样，保证读档与重绘不会重新摇天气。
function sample(key){let n=2166136261;for(const c of key){n^=c.charCodeAt(0);n=Math.imul(n,16777619);}n^=n>>>16;n=Math.imul(n,0x7feb352d);n^=n>>>15;return (n>>>0)/4294967296;}
export function palaceAtmosphere(state){
 const month=Math.floor((state.turn-1)%36/3)+1;
 const season=SEASONS[Math.floor((month-1)/3)],light=DAYLIGHT[state.phase??0];
 const key=`${state.createdAt??''}/${state.name??''}/${state.turn}/${state.phase??0}`;
 const choices=WEATHER[season.id],weather=choices[Math.floor(sample(key+'/weather')*choices.length)];
 const variation=['soft','balanced','vivid'][Math.floor(sample(key+'/light')*3)];
 return {month,season,light,weather,variation,image:`assets/scenes/palace/sketch-palace-${season.id}.png`,label:`${season.name} · ${light.name} · ${WEATHER_NAMES[weather]}`,description:`${season.detail} · ${light.detail}`};
}
export function palaceArtwork(state){
 const a=palaceAtmosphere(state);
 const particles=['snow','rain','leaves'].includes(a.weather)?`<div class="palace-particles palace-${a.weather}" aria-hidden="true">${Array.from({length:a.weather==='leaves'?18:32},(_,i)=>`<i class="weather-particle particle-${i}"></i>`).join('')}</div>`:'';
 return `<div class="palace-artwork season-${a.season.id} daylight-${a.light.id} weather-${a.weather} light-${a.variation}" data-season="${a.season.id}" data-daylight="${a.light.id}" data-weather="${a.weather}" data-light-variation="${a.variation}" role="img" aria-label="${a.label}，${a.description}"><img class="palace-season-image" src="${a.image}" alt="" draggable="false"><div class="palace-light" aria-hidden="true"></div><div class="palace-weather" aria-hidden="true"></div><div class="palace-lanterns" aria-hidden="true">${Array.from({length:18},(_,i)=>`<i class="palace-lantern lantern-${i}"></i>`).join('')}</div>${particles}</div>`;
}
