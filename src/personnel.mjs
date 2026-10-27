// Office definitions are independent of officeholders. Court contains central
// offices only; local posts follow the current country's province ownership.
export const OFFICIAL_ATTRIBUTES=[['name','姓名'],['age','年龄'],['intelligence','智力'],['martial','武力'],['integrity','清廉'],['loyalty','忠诚'],['experience','经验'],['nobility','爵位']];
const central=[
 ['central-general','大将军','军务','right',[72,30,7,15]],
 ['works-deputy','工部侍郎','工部','right',[66,25,6,13]],
 ['works-minister','工部尚书','工部','right',[81,24,6,13]],
 ['justice-minister','刑部尚书','刑部','right',[62,19,6,14]],
 ['war-deputy','兵部侍郎','兵部','right',[77,35,7,17]],
 ['war-minister','兵部尚书','兵部','right',[70,43,9,20]],
 ['rites-deputy','礼部侍郎','礼部','left',[21,23,6,13]],
 ['rites-minister','礼部尚书','礼部','left',[30,23,6,13]],
 ['revenue-deputy','户部侍郎','户部','left',[26,26,7,14]],
 ['revenue-minister','户部尚书','户部','left',[15,27,8,15]],
 ['personnel-deputy','吏部侍郎','吏部','left',[23,35,7,15]],
 ['personnel-minister','吏部尚书','吏部','left',[18,42,10,18]],
 ['prime-minister','宰相','中枢','left',[9,43,10,20]],
 ['justice-deputy','刑部侍郎','刑部','right',[74,19,6,14]]
];
export const CENTRAL_OFFICES=central.map(([id,name,department,side,[x,y,w,h]])=>({id,name,department,side,x,y,w,h,description:`${name}奏事。`}));
// Rear to front, matching the supplied court seating plan.
export const COURT_SIDES=[
 ['左列 · 后至前',['works-deputy','works-minister','war-deputy','war-minister','revenue-deputy','revenue-minister','prime-minister']],
 ['右列 · 后至前',['justice-minister','justice-deputy','rites-minister','rites-deputy','personnel-minister','personnel-deputy','central-general']]
];
// Hit regions follow the heads and upper robes in the colored seating artwork.
const courtSlots={
 'prime-minister':['left',[17.5,42,11,23]],
 'revenue-minister':['left',[25.3,35,7.5,17]],'revenue-deputy':['left',[12.5,33,8,19]],
 'war-minister':['left',[29.8,28.5,7,14]],'war-deputy':['left',[20,27,6.5,13]],
 'works-minister':['left',[34,25,5.8,11.5]],'works-deputy':['left',[24.6,23.5,5.8,11.5]],
 'central-general':['right',[71,40,11.5,24]],
 'personnel-minister':['right',[67,33.5,8.5,18]],'personnel-deputy':['right',[79.7,32.5,8,18]],
 'rites-minister':['right',[63.8,27.5,6.3,13.5]],'rites-deputy':['right',[74.4,27,6,13]],
 'justice-minister':['right',[63.8,23.5,5.8,11.5]],
 'justice-deputy':['right',[74.4,23.5,5.8,11.5]]
};
for(const office of CENTRAL_OFFICES){const [side,[x,y,w,h]]=courtSlots[office.id];Object.assign(office,{side,x,y,w,h});}
export function officeRegister(domestic){
 const attributes=()=>Object.fromEntries(OFFICIAL_ATTRIBUTES.map(([key])=>[key,null]));
 const country=domestic.countries.find(c=>c.id===domestic.playerCountryId);
 const central=CENTRAL_OFFICES.map(o=>({id:o.id,name:o.name,department:o.department,scope:'central',provinceId:null,attributes:attributes()}));
 const local=country.provinceIds.flatMap(id=>{
  const province=domestic.provinces.find(p=>p.id===id&&p.countryId===country.id);
  return province?[['governor','刺史','地方行政'],['general','将军','地方军务']].map(([kind,suffix,department])=>({id:`${id}-${kind}`,name:province.name+suffix,department,scope:'local',provinceId:id,attributes:attributes()})):[];
 });
 return [...central,...local];
}
