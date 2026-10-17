# 琴棋阁

2026-10-16 数值更新：采用普通版DOS修习规则，消耗40体力，能力最高500，基础随机1～4并受年龄及皇帝特长影响。武道场不附赠健康、百戏园不附赠快乐。旧数值说明以 [皇帝属性规则](emperor-harem.md) 为准。
2026-10-16 更新：取消进入后的三秒等待与进度提示，素材加载后立即结算一次，直接显示实际属性增加及体力减少；属性封顶按实际增量显示。以下旧动画说明以本条为准。

使用内置 image_gen 生成场景，保存为 assets/sketch-music-pavilion-v1.png。打包规则 assets/sketch-*.png 包含此素材。

提示词：Historical Chinese imperial game environment, landscape 1536x1024, detailed colored ink painting, fine architectural linework, painterly silk and wood textures, realistic human proportions, warm daylight, muted gold red jade palette. Imperial music and Go pavilion beside lotus pond, golden tiled roof, red pillars, carved railing, palace gardens and willows. Emperor in gold robe and scholar in teal seated opposite a square Go board with black and white stones at center; adult palace musician in pale pink short jacket and ivory skirt playing seven-string guqin on separate narrow table at left; two adult attendants serving tea at right. Coherent perspective and human scale, top 15% and bottom 12% quiet for interface. No lettering, UI, watermark or modern objects.

进入后等待图片解码，验证起居条件，播放三秒琴音、落子光纹与进度动画，再结算魅力最多 +5、体力 -1，显示封顶后的实际增量并记录起居历史。提前离阁取消本次结算；体力耗尽、寿元耗尽、夜晚依照既有规则阻止修习。减少动态效果偏好关闭装饰动画，保留三秒结算。场景和动画分离，结算后画面保留。

界面验收：node_modules/.bin/electron tests/music-desktop.cjs。
