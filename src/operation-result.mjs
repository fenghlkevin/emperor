// A caller may reject persistence without throwing. Never dismiss a draft in that case.
export function commitOperation(onCommit,next){
 if(typeof onCommit!=='function')throw Error('此处尚不能颁行这道旨意，请召主管大臣办理。');
 const saved=onCommit(next);
 if(saved===false)throw Error('这道旨意未能记妥，尚未生效，请再试一次。');
 return saved??next;
}
