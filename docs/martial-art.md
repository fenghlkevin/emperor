# 武道场美术

2026-10-17：按确认的 UI 图完成双人对打。皇帝穿深青色金边中式练功服，与红衣武士面对面徒手交锋、抬臂格挡。两人共用一张透明素材，保持手臂接触关系，避免独立缩放导致错位；按内侍、侍女的比例放在庭院中央。

当前人物素材：`assets/scenes/martial/sketch-martial-sparring-v2.png`，内置 image_gen 生成，含透明背景及脚底阴影。完整生成提示保存在 [sparring-prompt.txt](martial-art/sparring-prompt.txt)。旧版黄袍皇帝素材保留，但武道场不再引用。

当前庭院素材：`assets/scenes/martial/sketch-martial-court-v3.png`，保留两侧内侍、侍女与庭院建筑。人物容器左侧 33.5%、底部 32%、宽 34%、高 30%，随场景等比例缩放，人物不遮挡标题、离场按钮和结算文字。

界面仍使用 DOM 绘制标题、离场和状态消息，结算文字来自真实游戏结果，未使用效果图中旧的健康加成文案。素材加载完成后立即结算一次，消耗 40 体力、武术上限 500，基础随机 1～4 并受年龄及皇帝特长影响，不附赠健康。详见 [皇帝属性规则](emperor-harem.md)。

验证：`node_modules/.bin/electron tests/martial-desktop.cjs` 通过即时结算、封顶实际增量、体力变化、不重复结算、体力不足及载入时关闭检查。实际界面截图：`outputs/instant-palaces/martial.png`，已目视检查双人比例、透明边缘、脚底落地以及与两侧侍从的关系。

红衣侍卫面貌修正：年轻、无胡须、方脸浓眉、朴素束发，与皇帝的短髭尖须和金冠区分；使用内置 image_gen 局部修改，保留对打姿势、比例和透明背景。
