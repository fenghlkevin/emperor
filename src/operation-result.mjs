// A caller may reject persistence without throwing. Never dismiss a draft in that case.
export function commitOperation(onCommit,next){
 if(typeof onCommit!=='function')throw Error('当前入口不支持办理');
 const saved=onCommit(next);
 if(saved===false)throw Error('办理结果未保存，请重试');
 return saved??next;
}
