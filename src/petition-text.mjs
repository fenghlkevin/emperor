// Display-only formatting: stored amounts and the original report remain numeric.
const digits='零一二三四五六七八九';
const escape=text=>String(text).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function groupText(n){
 let result='',zero=false;
 for(let place=3;place>=0;place--){const power=10**place,digit=Math.floor(n/power)%10;
  if(digit){if(zero)result+='零';result+=digits[digit]+['','十','百','千'][place];zero=false;}
  else if(result&&n%power)zero=true;
 }
 return result;
}
export function chineseNumber(value){
 const raw=String(value).replaceAll(',',''),match=raw.match(/^([+-]?)(\d+)(?:\.(\d+))?$/);
 if(!match)return String(value);
 const [,sign,integer,fraction]=match,groups=[],units=['','万','亿','兆','京'];let remaining=BigInt(integer);
 while(remaining){groups.push(Number(remaining%10000n));remaining/=10000n;}
 let result='',zero=false;
 if(groups.length>units.length)result=[...integer].map(d=>digits[Number(d)]).join('');
 else for(let i=groups.length-1;i>=0;i--){const group=groups[i];if(!group){if(result)zero=true;continue;}if(result&&(zero||group<1000))result+='零';result+=groupText(group)+units[i];zero=false;}
 result=(result||'零').replace(/^一十/,'十');
 return (sign==='-'?'负':sign==='+'?'正':'')+result+(fraction?'点'+[...fraction].map(d=>digits[Number(d)]).join(''):'');
}
export function petitionText(text){
 // Escape every nonnumeric fragment separately; reports never introduce markup.
 const source=String(text),pattern=/[+-]?(?:\d{1,3}(?:,\d{3})+|\d+)(?:\.\d+)?(?:%|％|两|石|旬|人|年|日|月|份|回合|点)?/g;
 let html='',cursor=0;
 for(const match of source.matchAll(pattern)){
  html+=escape(source.slice(cursor,match.index));
  const parts=match[0].match(/^([+-]?[\d,.]+)(.*)$/),number=chineseNumber(parts[1]),unit=parts[2];
  const label=unit==='%'||unit==='％'?'百分之'+number:number+unit;
  html+=`<span class="petition-value">${escape(label)}</span>`;cursor=match.index+match[0].length;
 }
 return html+escape(source.slice(cursor));
}
export function petitionSeal(item){
 if(item.urgent)return '加急';
 if(item.action==='local-petition')return '请旨';
 if(['military-result','diplomatic-receipt','governance','works-complete','special-complete'].includes(item.id.split(':')[0]))return '复奏';
 return '奏事';
}
