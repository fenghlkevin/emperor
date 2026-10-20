// An office, not a person's biography/文武 label, selects its bonus ability.
export const OFFICE_ABILITY_TYPES={
 'prime-minister':'civil','personnel-minister':'civil','personnel-deputy':'civil',
 'revenue-minister':'civil','revenue-deputy':'civil','works-minister':'civil','works-deputy':'civil',
 'rites-minister':'civil','rites-deputy':'civil','justice-minister':'civil',
 'war-minister':'military','war-deputy':'military','central-general':'military'
};
const clamp=(n,fallback=50)=>Math.max(0,Math.min(100,Number.isFinite(n)?n:fallback));
export function officeAbilityType(office,role){return OFFICE_ABILITY_TYPES[office]??(office?.endsWith('-general')||role==='general'?'military':'civil');}
export function officeAbility(person,office,role){
 const type=officeAbilityType(office,role),primary=clamp(person?.[type==='military'?'martial':'intelligence']),secondary=clamp(person?.[type==='military'?'leadership':'politics'],primary),experience=clamp(person?.experience,0);
 return Math.round((primary+secondary+experience)/3);
}
export function officeAbilityBasis(office,role){return officeAbilityType(office,role)==='military'?'武职：武力、统率、经验取均值':'文职：智力、政务、经验取均值';}
