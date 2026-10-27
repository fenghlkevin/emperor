# 宰相国政汇总卷轴

入口：朝堂 → 召见宰相 → 国政汇总。只读，不消耗行动，不更改存档。

沿用现有国家、委任、工程、财政账本；不引入地图或新的业务入口。两侧卷杆、绢边和连续绢面由页面绘制，场景使用无文字画稿，数字与题签由真实数据渲染。

视觉修订 v2：卷杆、织锦绢边、端帽、空白题签和纹理绢面统一使用透明底框 `assets/scenes/governance/sketch-governance-scroll-frame-v2.png`，替换原 CSS 金属柱与整条标题栏。场景图集单元以原始 3:2 比例绘制后裁切；`src/governance-ink-mask.svg` 提供不规则晕染边缘，下半部向数据留白方向淡出。桌面按原型整体比例展示，窄屏保持卷框并在绢面内滚动。

底框由内置 imagegen 以确认的卷轴原型为参考生成。提示词与素材信息见 `docs/art/governance-scroll-frame-v2.md`。

## 财政场景

- 存银达到当前常规支出三旬：钱粮充盈，银箱满。
- 存银不足三旬：国库吃紧，银箱大部分空置。
- 无存银且有国债：使用欠据场景；国债不足当前收入三旬为轻债，达到三旬为重债。
- 存银与国债并存：库房按存银绘制，国债独立显示金额及轻重；不把国债抵消为负现金。
- 无存银、无国债：标注“国库暂无余银”，不凭预算赤字推断实际负债。

三旬阈值只影响插画和状态题签，不影响经济规则。收入、支出为当前预算；本旬结算仅使用同旬且非 legacy 的原始账本，没有记录时显示缺省文案，不把预算当作实绩。

工程有在建普通工程或全国特殊工程时显示施工场景，否则显示营造模型与图样。地方委任只统计当前本国州郡。

## 验证

`node --test tests/court-governance.test.mjs tests/court-office-access.test.mjs tests/finance.test.mjs tests/turn-economy-report.test.mjs`

`electron tests/court-governance-desktop.cjs` 验证真实朝堂入口、查阅存档不变、四种财政场景、素材加载、桌面和窄窗布局及关闭，截图保存在 `docs/screenshots/court-governance-*.png`。
