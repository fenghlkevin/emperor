"""Render a local, resumable production gallery; pending images are never placeholders for completed art."""
import json,html
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
out=ROOT/'outputs/harem-roster-draft'; art=out/'portraits'
roster=json.loads((out/'roster-data.json').read_text()); jobs=json.loads((art/'manifest.json').read_text())
by_id={j['id']:j for j in jobs}
for record in art.glob('*.json'):
 if record.stem in ('manifest','production-queue','pending-jobs','individual-art-briefs'): continue
 candidate=json.loads(record.read_text())
 if isinstance(candidate,dict) and candidate.get('id') and candidate.get('file'): by_id[candidate['id']]=candidate
jobs=list(by_id.values())
sources={
 'cn-01-005':[{'title':'《庄子》西施相关文本（教育局古文材料）','url':'https://cd1.edb.hkedcity.net/cd/chi/jilei_2010/pdf_wen/jilei_wen_006.pdf'}],
 'cn-02-015':[{'title':'王昭君：史籍记载汇引，服饰为时代重构','url':'https://www.shidianguji.com/ens/book/SK3265/chapter/1l9ps96kh4dvj'}],
 'cn-03-019':[{'title':'《三国演义》文学身份；服饰为东汉背景艺术设计','url':'https://zh.wikisource.org/zh-hant/三國演義/第008回'}],
 'cn-05-020':[{'title':'故宫：唐妆','url':'https://www.dpm.org.cn/lemmas/242656.html'},{'title':'故宫：三彩女俑','url':'https://www.dpm.org.cn/collection/sculpture/228352.html'}]
}
queue=[];cards=[];e=html.escape
for g in roster['groups']:
 for p in g['people']:
  j=by_id.get(p['id']); row={**p,'groupId':g['id'],'scope':g['scope'],'status':'generated' if j else 'pending-research-and-generation','file':j['file'] if j else None}
  queue.append(row)
  if not j: continue
  j['sources']=sources.get(p['id'],j.get('sources') or ([{'title':'人物／时代造型参考','url':j['source']}] if j.get('source') else []))
  if p['id'] in ('cn-01-005','cn-02-015','cn-03-019','cn-05-020','rome-001','japan-002','steppe-008','franks-002'):
   j['status']='reviewed-v1';j['review']='完整全身、鞋履、手部及PNG透明通道已检查；非精确容貌复原，服饰细节仍属艺术重构'
  refs=''.join(f'<a href="{e(s["url"])}" target="_blank" rel="noopener">{e(s["title"])}</a>' for s in j['sources'])
  cards.append(f'<article data-search="{e(p["name"]+g["label"]+p["trueOrigin"])}"><a class="image" href="portraits/{e(j["file"])}" target="_blank"><img loading="lazy" src="portraits/{e(j["file"])}" alt="{e(p["name"])}全身立绘"></a><div class="body"><h2>{e(p["name"])}</h2><p>{e(p["trueOrigin"])} · {e(p["kind"])}</p><p class="muted">{e(j["review"])}</p><details><summary>文献与造型参考</summary>{refs}<p>面部细节、具体配色及未有文献记载的随身物为艺术补全。</p><details><summary>生成提示词与设计记录</summary><p>{e(j["prompt"])}</p></details></details></div></article>')
(art/'manifest.json').write_text(json.dumps(jobs,ensure_ascii=False,indent=2)+'\n')
(art/'production-queue.json').write_text(json.dumps({'total':530,'generated':len(jobs),'pending':530-len(jobs),'method':'built-in image_gen; one distinct prompt per person','people':queue},ensure_ascii=False,indent=2)+'\n')
page='''<!doctype html><html lang="zh-CN"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>名册人物立绘制作进度</title><style>body{margin:auto;padding:32px;max-width:1450px;background:#f3eee4;color:#352c25;font:15px system-ui}h1{font:34px serif}p{line-height:1.8}a{color:#8b4932}.intro{background:#e9dfce;padding:18px 24px;border-radius:12px}.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(290px,1fr));gap:20px;margin-top:24px}article{background:#fffaf2;border:1px solid #d7c9b1;border-radius:14px;overflow:hidden}.image{display:block;background:#f4ead5;height:540px}.image img{width:100%;height:100%;object-fit:contain}.body{padding:20px}h2{font:25px serif;margin:0}details{margin-top:14px;font-size:13px;line-height:1.8}details a{display:block}.muted{color:#7a6c5b;font-size:13px}input{margin-top:22px;box-sizing:border-box;width:100%;padding:14px;border:1px solid #c9bda9;border-radius:8px;background:#fffaf2;font-size:16px}[hidden]{display:none!important}</style><h1>固定名册 · 人物立绘</h1><div class="intro"><strong>已生成 COUNT / 530 位，待制作 PENDING 位。</strong><p>每位人物独立生成，保持完整全身、发式、服装、配饰和鞋履。优先采用人物自身时代与真实文化归属。资料不足处明确标为艺术重构；不把后世传说当成确定史实。此页为制作预览，尚未接入正式游戏。</p><p><a href="roster.html">查看完整 530 位名册</a> · <a href="portraits/production-queue.json">制作队列</a> · <a href="portraits/manifest.json">图片、提示词及参考资料清单</a></p></div><input id="q" placeholder="搜索已生成的人物…"><main class="grid">CARDS</main><script>document.querySelector('#q').addEventListener('input',e=>document.querySelectorAll('article').forEach(a=>a.hidden=!a.dataset.search.includes(e.target.value.trim())))</script></html>'''.replace('COUNT',str(len(jobs))).replace('PENDING',str(530-len(jobs))).replace('CARDS',''.join(cards))
(out/'portraits.html').write_text(page)
print(f'Gallery: {len(jobs)}/530 portraits; queue records: {len(queue)}')
