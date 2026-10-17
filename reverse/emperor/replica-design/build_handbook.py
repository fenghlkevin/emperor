from pathlib import Path
R=Path(__file__).resolve().parent
chapters=sorted(R.glob('[0-9][0-9]-*.md'))
parts=['# 皇帝 DOS 功能复刻设计文档 合订本\n\n整理日期：2026-10-15。适用边界和证据分级见[总入口](README.md)。本文件由分章自动合并，修改应回到分章后重建。\n\n## 目录\n']
for p in chapters:
 title=p.read_text().splitlines()[0].lstrip('# ')
 parts.append(f'- [{title}](#{p.stem[:2]})\n')
for p in chapters:
 parts.append(f'\n<a id="{p.stem[:2]}"></a>\n\n'+p.read_text()+'\n')
(R/'皇帝DOS功能复刻设计文档.md').write_text(''.join(parts))
print('handbook chapters:',len(chapters))
