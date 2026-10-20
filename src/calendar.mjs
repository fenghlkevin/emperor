// 游戏采用每年十二月、每月三旬的简化历法，不推算闰月与具体日辰。
const DIGITS='零一二三四五六七八九';
export function chineseNumber(value){
 if(value<10)return DIGITS[value];
 if(value<100)return `${value<20?'':DIGITS[Math.floor(value/10)]}十${value%10?DIGITS[value%10]:''}`;
 if(value<1000){const rest=value%100;return `${DIGITS[Math.floor(value/100)]}百${rest?(rest<10?'零':'')+chineseNumber(rest):''}`;}
 return String(value).split('').map(n=>DIGITS[Number(n)]).join('');
}
export const MONTH_NAMES=['正月','二月','三月','四月','五月','六月','七月','八月','九月','十月','十一月','腊月'];
export const PERIOD_NAMES=['卯时','巳时','午时','申时','酉时','亥时'];
export function dateLabel(turn,reign=''){
 const n=turn-1,year=Math.floor(n/36)+1;
 return `${reign}${year===1?'元':chineseNumber(year)}年${MONTH_NAMES[Math.floor(n%36/3)]}${['上','中','下'][n%3]}旬`;
}
