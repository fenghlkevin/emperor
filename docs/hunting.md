# 巡游狩猎

入口：紫宸殿左侧内侍 → 巡游狩猎。右侧内侍继续提供宫中名册。准备页加载全部画卷后开始计时，未开始时返回不消耗属性。完成后返回宫城，按现有离室流程推进一个行动阶段。

## 普通模式规则

依据 `reverse/emperor/rules-analysis/training-hunting/hunting.md` 中默认启动版本 EMPEROR 的核验结果：60秒、30箭，命中实际不透明图像像素才得分，空射同样扣箭，不按武术掷命中率。箭尽或时间到自动结算。新界面的“结束狩猎”与 Escape 提前收猎按已有成绩结算。

- 36个候选位置随机等概率选择，同时最多5只，抽中已占用位置不重抽。按本次调整，各位置分配为野猪12、野兔10、麋鹿6、老鹰4、熊4；这是用户要求的刷新分布调整。
- 原版位置表保存在 `src/hunting-data.mjs`；当前物种分配、积分与停留时间由 `src/hunting.mjs` 的 `HUNT_SPECIES` 和 `SPECIES_SLOTS` 管理。野兔1分/3秒、野猪2分/2秒、麋鹿3分/1秒、老鹰3分/1秒、熊3分/2秒。老鹰在空中，其余猎物位置适配猎苑地面。并非原版24种精灵的逐帧复刻。
- 1—2月和11—12月生成间隔2000ms；3—6月500ms；7—10月300ms。月份0..11的依据见 `reverse/emperor/rules-analysis/turns/README.md`；按本项目36旬日历换算月份。
- 体力上限增加 `floor(积分/4)`，封顶500，显示实际增加值。
- 健康增加20，封顶100；包括0命中场次。
- 寿元扣8，最低0。当前体力、武术、快乐和国库不因射箭改变。

本项目目前没有DOS特殊快速模式；未套用该模式的96寿元扣减，也未混用QUICK版本的除3收益公式。游戏整体仍使用本项目现有行动阶段与36旬日历。

结算候选状态通过现有存档事务提交后才显示成功。失败保留候选供重试；成功记录唯一场次ID，禁止同场重复领奖。寿元归零走现有终局结算。未修改存档版本，旧档没有狩猎标记时直接兼容。

## 验证

- `npm test`：包含狩猎规则、封顶、0命中、超时、空射、位置去重及保存失败重试测试。
- `npm run test:hunting`：Electron真实入口、像素点击、箭尽、Escape、保存失败重试、实际60秒超时及900/1440窗口验收。临时独立存档，不使用玩家存档。截图在 `outputs/hunting/`。
- 主宫城现有内联样式CSP警告在验收日志中单独记录；狩猎界面使用独立样式文件。

## 美术与生成提示

使用内置 ImageGen，基于用户批准的UI概念图生成。运行资源均保存在 `assets/scenes/hunting/sketch-hunting-*-v1.png`，现有打包规则会包含这些文件；预览截图是实际Electron界面。

背景最终提示（参考图为已批准UI）：

> Create the clean background asset for this approved Chinese imperial hunting game UI. Preserve this exact naturalistic autumn forest, misty mountains, shallow stream, rocks, pine trees, distant tiny imperial camp and sunlight visual style and composition. Remove ALL UI overlays, all text, all gold borders and panels, all animals (deer, boar, rabbit, pheasant), remove first-person arms, bow and arrow. Fill those areas naturally with forest/clearing. Full bleed 16:10 landscape detailed background painting, clear playable natural woodland floor over central and lower 70%, no characters or animals, no text or frame.

猎物最终提示（透明背景）：

> Create a transparent-background game sprite atlas, landscape 3:1 composition. Exactly THREE equal-width square cells in a single horizontal row, no lines or labels. Cell 1 LEFT: one complete side view realistic small brown wild rabbit facing right, ears up. Cell 2 MIDDLE: one complete side view realistic wild boar facing right, dark bristly brown fur. Cell 3 RIGHT: one complete side view realistic male deer with antlers facing left. Each animal isolated entirely inside its own third, aligned with feet along 82% height, with generous transparent padding 12% on all sides; full body including ears tail and antlers must fit, no overlaps between cells, no ground or grass or shadow patches. Fine detailed naturalistic hand-painted ancient Chinese imperial hunting game style, warm late-afternoon sunlight, coherent soft lighting. Not cartoon. Animal coats opaque and crisply defined silhouettes. No text, no frames, no landscape, genuinely transparent background.

弓箭最终提示（透明背景）：

> Transparent-background foreground overlay asset for a realistic first-person ancient Chinese imperial bow hunting game. Wide landscape 3:2 canvas. ONLY a complete elegant traditional dark wooden recurve bow, nocked single arrow, and player's two hands with black and antique-gold embroidered robe sleeves. Composition anchored to bottom-right: sleeves enter from lower right and bottom edge, left hand holds bow at x68% y70%, curved vertical bow rises up to x72% y8%; arrow points diagonally towards upper left at x35% y35%. Bowstring taut. Keep most left half entirely transparent. Fine detailed naturalistic hand-painted historical game asset in warm forest sunlight, no scene, no animals, no frame, no text, no backdrop, genuinely transparent background. Arms and hands anatomically correct, no modern equipment.

## 五种动物与可见度调整

野猪占候选位置的比例由4/36提高至12/36。所有动物增大显示尺寸、提升亮度与对比度，并加冷白色轮廓；名称/积分放在深青色底牌上。背景降亮度和饱和度，像素命中仍只检测动物实际图像，名称牌及描边不计命中。

新增资源：`assets/scenes/hunting/sketch-hunting-eagle-bear-v1.png`。内置ImageGen最终提示：

> Use case: stylized-concept. Transparent game sprite atlas with exactly TWO isolated animals side by side in separate equally wide cells, landscape 2:1. LEFT cell a complete majestic eagle in flight, wings spread wide, silver-gray and white feather highlights, dark slate wing tips, ivory head and golden beak, facing slightly left. RIGHT cell one complete large Asiatic black bear in side three-quarter view facing left, standing on four legs, black blue-charcoal fur with clearly visible pale cream crescent chest marking, cool silver rim lighting all around fur silhouette. Both whole bodies must fit their own half, generous 10% transparent padding, no overlap, no ground or scenery, no cast shadows, no labels. Detailed realistic hand-painted ancient Chinese imperial hunting game assets, match realistic forest game illustration. Strong clearly readable opaque animal silhouettes, bright neutral/cool highlights to stand out against busy warm orange autumn forest. No brown camouflage colors, no UI, no frames. Genuinely transparent background.
