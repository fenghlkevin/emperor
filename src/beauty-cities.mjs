import {BEAUTY_REGIONS} from './beauties.mjs';
const homeland=[['hebei','河北','燕赵骑射'],['henan','河南','中州礼乐'],['huainan','淮南','运河珠绣'],['jiangnan','江南','烟雨丝绸'],['lingnan','岭南','轻罗银饰'],['hedong','河东','紫锦骑装'],['guannei','关内','长安宫锦'],['shannan','山南','草木青染'],['jiannan','剑南','蜀锦花绣'],['longyou','陇右','丝路织锦']];
const capitals=['','逻些','太和','平壤','平安京','王庭','瀚海','泰西封','巴格达','君士坦丁堡','曲女城','西突厥王庭','高昌','东突厥王庭','契丹王庭','奚王庭','吐火罗王城','疏勒','龟兹','吐谷浑王城','小勃律王城','斯拉夫王庭','法兰西王城','黠戛斯王庭','靺鞨王庭','卑谬','伊奢那城','巨港','诃陵王城','占城','吕宋王城','阿克苏姆王城','柏柏尔王庭','僧伽罗王城'];
export const BEAUTY_CITIES=[...homeland.map(([id,name,tradition],i)=>({id,name,regionId:'sheng',region:'中原',culture:'zhongyuan',tradition,style:i})),...BEAUTY_REGIONS.slice(1).map((r,i)=>({id:`${r.id}-core`,name:capitals[i+1],regionId:r.id,region:r.name,culture:r.culture,tradition:r.dress,style:i+10}))];
export function unlockedBeautyCities(state){return BEAUTY_CITIES.filter(c=>state.domestic.provinces.some(p=>p.id===c.id&&p.countryId===state.domestic.playerCountryId));}
export function cityForBeauty(person){return BEAUTY_CITIES.find(c=>c.id===person.cityId)??BEAUTY_CITIES.find(c=>c.regionId===person.regionId);}
