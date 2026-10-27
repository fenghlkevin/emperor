# 百戏园画面素材

2026-10-16 数值更新：采用普通版DOS修习规则，消耗40体力，能力最高500，基础随机1～4并受年龄及皇帝特长影响。武道场不附赠健康、百戏园不附赠快乐。旧数值说明以 [皇帝属性规则](emperor-harem.md) 为准。
2026-10-16 更新：取消进入后的三秒等待与进度提示，素材加载后立即结算一次，直接显示实际属性增加及体力减少；属性封顶按实际增量显示。以下旧动画说明以本条为准。

使用内置 image_gen 生成，皇城春季图 assets/scenes/palace/sketch-palace-spring.png 为戏园背景的画风参考。

项目素材：
- assets/scenes/theatre/sketch-theatre-garden-v2.png：彩绘皇家戏园背景，含两侧乐师。
- assets/scenes/theatre/sketch-theatre-dan-v2.png：透明底旦角。
- assets/scenes/theatre/sketch-theatre-sheng-v2.png：透明底生角。

最终生成提示词要点：

背景：Historical Chinese imperial theatre game background, landscape 1536x1024. Match reference fine detailed colored architectural illustration, golden glazed tiled roofs, cinnabar columns, jade trees, turquoise water, delicate ink outlines and painterly textures. View from emperor's seat; central opera pavilion, embroidered burgundy curtains, teal and gold panels, empty central wooden stage, musicians with erhu flute and drums at side wings; pond, stone railings, rocks, flowering trees and corridors. Soft warm daylight. No central actors, UI, lettering or watermark.

旦角：One full-body adult Chinese opera dan-role female cutout, transparent background, facing right, graceful opera stance with long ivory water sleeves, pale rose and ivory embroidered silk robe with jade and gold trim, phoenix headdress with pearls, delicate theatrical makeup, detailed painterly colored ink illustration, realistic anatomy. No extra people, backdrop, lettering or watermark.

生角：One full-body adult Chinese opera sheng-role male scholar cutout, transparent background, facing left, ivory folding fan near chest, extended hand and draping water sleeve, deep teal blue brocade robe with gold clouds and flowers, scholar hat and restrained makeup, detailed painterly colored ink illustration, realistic anatomy. No extra people, backdrop, lettering or watermark.

运行时人物独立叠加，轻微移步和转身，3 秒后停在谢幕姿态。全部图片解码完成后才开始计时；提前关闭取消结算。打包规则 assets/**/* 已包含三张素材。

## 观戏席侍从

通过内置 image_gen 生成透明底人物组，各组两人，固定放在左右前景：
- assets/scenes/theatre/sketch-theatre-eunuchs-v1.png：左侧两名内侍。
- assets/scenes/theatre/sketch-theatre-maids-v1.png：右侧两名成年侍女，短上衣搭配裙装。

生成提示词：

内侍：Historical-scene transparent game asset, exactly two adult Chinese imperial eunuch attendants age 35 and 50, full body heads to shoes, distinct clean shaven faces, black eunuch caps, muted burgundy and slate blue silk palace robes with restrained gold belts, hands folded respectfully, facing slightly right. Refined detailed hand painted colored ink imperial palace illustration, natural human anatomy, warm daylight, fine cloth texture. Pair stands in left foreground of emperor's theatre seat. All feet same baseline, transparent margin, no scenery, lettering or watermark.

侍女：Historical-scene transparent game asset, exactly two beautiful adult Chinese palace maids age 25 and 28, full body, facing slightly left. Distinct elegant faces, refined hairstyles and flower hairpins. Short hip-length fitted silk jackets, elbow-length sleeves, crossed collars and floral embroidery, one peach pink and one jade green; ivory and soft pink ankle-length pleated skirts and narrow sashes. One holds tea tray, other holds round silk fan. Refined detailed hand painted colored ink illustration, warm daylight, natural anatomy and fine silk texture. Right foreground attendants, not performers. Feet same baseline, transparent margin, no scenery, lettering or watermark.
