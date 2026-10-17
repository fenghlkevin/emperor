import {writeProgress} from './save-slots.mjs';
import {validateSave} from './game.mjs';

export const MAX_SAVE_BYTES = 8 * 1024 * 1024;
const submitted = new WeakSet();
// Prepare a private state, persist once, then publish. Failed writes publish nothing.
export function persistCandidate(current, candidate, storage, prepare = () => {}) {
  const revision=current?.saveRevision??0;
  if(candidate===current || submitted.has(candidate) || (candidate.saveRevision??0)!==revision)
    throw Error('状态已更新或本次提交已执行，请重新打开后再试');
  const draft=structuredClone(candidate);
  prepare(draft);
  draft.saveRevision=revision+1;
  const next=validateSave(draft);
  try { writeProgress(storage,next); }
  catch { throw Error('保存失败，本次操作未执行，请释放存储空间后重试。'); }
  submitted.add(candidate);
  // UI modules keep this candidate after onCommit; update it only after a successful write.
  Object.assign(candidate,next);
  return candidate;
}
