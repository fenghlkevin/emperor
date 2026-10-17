"""Install only completed portrait files from a versioned art plan; preserve previous versions."""
import json,sys,re
from pathlib import Path
root=Path(__file__).resolve().parents[1];out=root/'outputs/featured-beauties';version=int(sys.argv[1] if len(sys.argv)>1 else 4)
plan=json.loads((out/f'revision-v{version}-plan.json').read_text());roster=json.loads((out/'roster.json').read_text());config=root/'src/featured-beauties-data.mjs';source=config.read_text();n=0
for direction in plan['people']:
 record=out/f"{direction['key']}-v{version}.json"
 if not record.exists() or not (root/direction['portraitAsset']).is_file():continue
 generated=json.loads(record.read_text());p=next(p for p in roster['people'] if p['key']==direction['key']);p.update(generated);p['status']='ready';p['artAdaptation']='根据用户审美要求作现代古典游戏美术改编；具体容貌、轻装剪裁、舞裙及旗袍不作史实复原。'
 if p['key']=='nie-xiaoqian':
  p['designNotes']='王祖贤版聂小倩的清冷古典影视气质：修长柔美、长发白纱、宽袖飘带、幽静灵动。'
  p['sources']=[{'title':'香港电影资料馆·服装设计访谈（薄纱与风动衣饰）','url':'https://www.filmarchive.gov.hk/documents/OLD-6.-Research-and-Publication/06-03_newsletter/newsletter81_e.pdf'}]
 if p['key']=='yang-yuhuan':p['designNotes']='现代审美的精致鹅蛋脸、匀称纤细体态；保留盛唐金红华服与贵妃气质。'
 if p['key']=='tan-wenwan':p['designNotes']='重新设计的珍珠白旗袍，疏密有致的蓝兰银金刺绣、修身轻盈剪裁与柔和低盘长发；架空时装版。'
 (out/(p['key']+'.json')).write_text(json.dumps(p,ensure_ascii=False,indent=2)+'\n')
 source=re.sub(r'assets/beauties/featured/'+re.escape(p['key'])+r'-v\d+\.png',p['portraitAsset'],source);n+=1
roster['artDirection']=plan.get('style',plan.get('direction'));roster['exoticRule']=plan.get('exoticRule',{});(out/'roster.json').write_text(json.dumps(roster,ensure_ascii=False,indent=2)+'\n');config.write_text(source)
print(f'Installed {n}/30 portraits from revision {version}')
