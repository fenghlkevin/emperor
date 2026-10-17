# 御书房

2026-10-16 数值更新：采用普通版DOS修习规则，消耗40体力，能力最高500，基础随机1～4并受年龄及皇帝特长影响。武道场不附赠健康、百戏园不附赠快乐。旧数值说明以 [皇帝属性规则](emperor-harem.md) 为准。
2026-10-16 更新：取消进入后的三秒等待与进度提示，素材加载后立即结算一次，直接显示实际属性增加及体力减少；属性封顶按实际增量显示。以下旧动画说明以本条为准。

进入御书房后，在素材解码完成时立即结算一次研读；消耗40体力，智慧按随机、年龄与皇帝特长增长，最高500，显示实际增量并写入宫廷记录。提前离室或素材载入失败不结算；离室沿用六阶段推进。减少动态效果偏好不改变结算时点。

素材：`assets/sketch-study-v1.png`，通过内置 image_gen 生成。打包已有 `assets/sketch-*.png` 规则覆盖该素材。

生成提示词：

Use case: historical-scene. Game background illustration for Chinese emperor's imperial study, landscape 1536x1024. Fine detailed colored ink architectural painting, warm golden wood and cinnabar pillars, jade green accents, painterly natural textures and fine ink outlines matching sophisticated Chinese palace game. Frontal slightly elevated view into elegant Ming imperial library, bookcases of stitched books on both sides, carved lattice windows looking onto bamboo garden, carved dark wooden imperial writing desk centered in lower middle, open ivory book, inkstone, brushes, warm sunlight. Adult emperor wearing restrained ochre gold dragon robe seated centrally behind desk reading an open book, natural realistic human proportions, clearly visible upper body and hands, elegant calm face, no exaggerated head. Two adult palace attendants discreetly standing in the sides farther back. Rich detailed scholarly interior, dignified peaceful atmosphere, beautiful luminous colors. Entire interior fills frame, clear upper area for game title and lower edge for status overlay. No text, lettering, watermark, UI, collage or borders.

验证：`node_modules/.bin/electron tests/study-desktop.cjs`，覆盖延迟结算、智慧封顶实际增量、体力扣除、记录、提前关闭与体力不足。

## 人物比例修订

当前使用 `assets/sketch-study-v2.png`，通过内置 image_gen 编辑原书房生成，整体绘制皇帝、两名内侍和两名成年短衣侍女。移除原先独立叠加的百戏园人物，侍女分立御案左右，统一人物头身、透视、落脚阴影与御案遮挡。皇帝头部缩小，书页动画重新对齐。

修订提示词：保留原书房建筑、光线、御案与彩绘风格，重绘一致尺度的五名成年人；皇帝坐在案后，头肩手比例自然；两名内侍站在后方；两名成年侍女穿桃粉、浅碧短上衣配长裙，各持茶盘、团扇，站在御案两侧地面，站姿约七头身，头顶高于坐姿皇帝，按实际远近统一头部尺寸，脚下有接触阴影，遮挡关系正确，无悬浮脚、贴图感、巨人或微型人物，无文字水印。

## 空间朝向修订

当前最终素材：`assets/sketch-study-v3.png`。内置 image_gen 编辑 v2：仅修改皇帝后方建筑，将通向竹园的开口替换为实墙、雕木描金山水屏风，侧面格窗采光。观者位于入口，皇帝朝向入口，背靠屏风。五名人物、御案、书卷位置与比例保留。

提示词：Edit only the architecture behind the emperor. Viewer stands at the entrance looking into the room; emperor faces entrance and viewer. Replace open rear courtyard doorway with solid interior rear wall and carved dark wooden imperial folding screen with restrained gilded mountains and clouds. No doorway or garden passage behind emperor. Warm light enters side lattice windows. Preserve five people, natural proportions, identities, short peach and jade jackets of adult maids, poses, positions, desk, chair, book coordinates, floor, framing, painterly style. No text, UI or watermark.
