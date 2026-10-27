# 军阵卡牌美术记录

日期：2026-10-22。使用现有历史人物资源与最初已认可的沙场卡牌视觉体系。人物定义、人物实例、肖像资源分别按 ID 关联，不用姓名猜图。

## 原型与既有素材

- 最初认可原型：`docs/screenshots/card-battle-original-prototype.png`，从本会话原始用户可见图片恢复，作为视觉对照，不是本轮重新生成的替代原型。
- 沙场、兵种九宫格、计策图：`assets/battle/card-battlefield-v1.png`、`card-troops-v1.png`、`card-tactics-v1.png`，沿用本分支前期原型素材。
- 100名开放人物使用 `src/official-art.mjs` 中本人已有的头像／肖像；没有把区域随机人物插画套给历史人物。

## 本轮新增区域人物

使用内置 `image_gen.imagegen`（内置生成模式，无本地 API key），两张独立生成的 3×3 肖像图集，不是对历史人物肖像的修改。运行时按格定位，不裁剪重绘原图。

| 用途 | 运行时路径 | 原始生成文件 |
|---|---|---|
| 随机军官 | `docs/art/retired-assets/battle/card-regional-military-v1.png` | `/Users/fengheliang/.codex/generated_images/01a15ee4-794a-7840-ad34-c11183262c4a/exec-08086b14-5712-4b47-9a9f-58ded27b693f.png` |
| 随机文臣 | `docs/art/retired-assets/battle/card-regional-civil-v1.png` | `/Users/fengheliang/.codex/generated_images/01a15ee4-794a-7840-ad34-c11183262c4a/exec-561b2fa0-b827-4838-8482-720b3248fa6b.png` |

格序为：吐蕃、草原、中亚；波斯、阿拉伯、印度；东罗马、南诏／大理、日本。区域映射、文武选择与姓名池保存在 `src/card-battle-cultures.mjs`。这些是虚构随机人物的时期风格插画，不声称是特定真人或考古复原。

共同提示词（下列两个方括号位置分别替换为军官版、文臣版文本）：

> Use case: historical-scene. Asset type: one production 3 by 3 portrait atlas for a historical strategy card game. Create exactly NINE equally sized square cells in a perfectly aligned 3x3 grid, edge-to-edge with NO gutters, NO text, no numbers, no symbols or UI frames. Each cell one DISTINCT fictional adult [military officer in historically grounded armor / civil administrator / adviser in historically grounded civil dress], head and upper torso, face centered in the UPPER MIDDLE of each cell, portrait crops useful at small size. Consistent refined realistic painted historical game art, warm parchment gold, muted natural earth colors, soft detailed faces. These are anonymous generated characters, not portraits of known historical people. All men, calm dignified expressions. Exact cell order: top left medieval Tibetan; top middle early medieval Turkic / Mongolian steppe; top right Sogdian / Central Asian; middle left early medieval Persian; middle middle medieval Arab; middle right early medieval Indian; bottom left Byzantine / East Roman medieval; bottom middle Nanzhao / Dali southwestern Chinese kingdom; bottom right early medieval Japanese. [Armor and headgear suited to each culture; no fantasy plate, no Renaissance suits or modern medals, no civilian court hats replacing military gear. / Court robes and appropriate headwear suited to each culture; clearly unarmored, no weapons, no European fantasy wizard clothes.] Period-inspired clothing rather than claiming archaeological precision. No giant objects, no modern elements, no objects crossing cell boundaries. Simple subtle low-contrast backgrounds.

## 已知历史边界

100名人物均有本人ID、既有肖像和专属卡定义；原人物库中26名原作身份／史实尚待考证，牌册保留待考标记。图集补全不改变这一状态，也不代替逐人史料核实。

## 原型还原修订与两种卡面

- 场景底板：`assets/battle/card-prototype-plate-v2.png`；参考本会话最初原型编辑生成，原输出 `/Users/fengheliang/.codex/generated_images/01a15ee4-794a-7840-ad34-c11183262c4a/exec-5239ca0c-754c-4bd3-bb49-0e5bbfc588d0.png`。
- 12计策图集：`assets/battle/card-tactics-v3.png`，4列3行，每格对应一张计策；原输出 `/Users/fengheliang/.codex/generated_images/01a15ee4-794a-7840-ad34-c11183262c4a/exec-ca954b35-882c-428c-84a5-b43a61797577.png`。去除大字印章覆盖，采用独立叙事插画。
- 早期卡框、费用、攻命、牌背、军令盘和空位纹样使用原生SVG；旧卡框保留演进记录，当前主卡框已替换为下文的v4实物材质。人物卡使用本人完整立绘与沙场衬景，主将使用本人头像。

底板使用内置图像编辑，透明背景关闭。实际提示词：

> Restore the provided approved game UI into a clean production background plate, preserving its original 1664x941 /16:9 composition, art, ornate details and exact positions. This is extraction, not redesign. Keep the SAME crowded dramatic golden sandy fortress battlefield, distant troops and towers, red and teal banners, close-up braziers, finely carved dark wooden command table across bottom and antique brass ornamental frames. Keep the top-center and lower-center round brass commander frames, red/green life banners with shield badges, left turn dial, large right jade end-turn button with its intricate sculpted brass rim, retreat frame, top-left title sign, bottom-right mana tray and lower hero-power jade button. REMOVE all portraits inside the two commander frames, all text/Chinese characters/numbers, all battlefield cards and ghost card slots, all bottom hand cards, all enemy card backs and all mana dots. Fill removed cards seamlessly with battlefield sand or bottom carved wooden table. Leave portrait centers as dark recesses, jade buttons blank green, name banners solid red/green. Preserve elaborate metal rims, patina, carving, shadows and material depth exactly like the approved reference. No simplification into flat geometric shapes, no new interface elements, no words, no watermark. One full 16:9 scene.

计策图集使用原型作为画风参考、透明背景关闭。实际提示词：

> Create a production ILLUSTRATION ATLAS for the twelve tactic cards in this approved Chinese historical battle-game prototype. Match the reference's richly painted warm realistic historical card illustrations, earthy gold/ochre, smoke, dramatic natural light and physical detail. Exactly FOUR columns by THREE rows of equally sized square illustrations, edge-to-edge with absolutely no gutters or frames. NO UI, NO lettering, NO Chinese characters, NO numbers, NO seals, NO giant symbols. Each cell is a real illustrated action, composed to remain clear on a small card. Exact order left to right, top to bottom: 1 close-up disciplined Chinese archer taking a precise aimed shot; 2 historical Chinese soldiers using fire arrows and torches against siege works; 3 light cavalry pursuing a retreating enemy column in dust; 4 a dramatic dense rain of arrows over a massed enemy formation; 5 disciplined crossbow formation unleashing a coordinated volley; 6 a strong defensive wall of overlapping tall shields; 7 courageous soldiers charging forward under a red war flag; 8 a commander organizing and reinforcing a defensive line; 9 an adviser exposing and burning a false military order while messengers disrupt the enemy camp; 10 troops pinned in a narrow mountain pass by arrows and obstacles; 11 ox carts delivering sacks of grain to an army camp; 12 a historical Chinese field medic bandaging a seated wounded soldier, no gore. Medieval Chinese armor and clothing, no European knights or modern weapons. All twelve cells must be different fully painted narrative scenes. No text anywhere, no card numbers, no logos, no watermark. Output one 4:3 landscape sheet with the exact 4x3 square-cell grid.

## 2026-10-22 实物卡框与持续动画修订

当前主卡框改用 `assets/battle/card-material-v4.png`：内置 `image_gen.imagegen` 生成、透明背景开启，参考用户再次提供的原型图片。原始输出为 `/Users/fengheliang/.codex/generated_images/01a15ee4-794a-7840-ad34-c11183262c4a/exec-14ac345a-69a3-4176-b774-8a0613a6b4f1.png`。图片原样复制到项目，人物和数值继续实时叠加；未将人物、技能文字烘焙到卡框中。

实际提示词：

> Use case: ui-mockup. Asset type: production texture for ONE reusable ancient Chinese card-game card frame, portrait 5:7 aspect, shown STRAIGHT ON, for compositing real card art and live text in code. Input image is STYLE REFERENCE ONLY: precisely match the warm aged parchment and richly worked dark bronze/gold thin frames of the cards in this approved battle prototype. Generate ONLY a single blank physical rectangular card, filling the canvas edge to edge except tiny transparent rounded corners. NO scene, no board, no other cards, no characters, no letters, no numerals, no circles, no badges, no symbols in center. The whole interior is uninterrupted warm ivory aged rice paper, with fine visible fibres, mottled edges, tiny restrained age flecks and subtle hand-painted wear; leave center clean for card illustrations and readable rules to be overlaid. Outer 3.5% is an ornate but thin dark weathered bronze rim with warm rubbed gold bevel, tiny inset ornamental corner flourishes, hairline engraved cloud patterns, metal edge chips, realistic directional highlights, rivets at corners, slight leather-brown backing and very subtle physical thickness. Thin inner dark-brown keyline. Museum quality hand-painted fantasy strategy game UI material, tactile, dimensional, intricate, restrained; no flat vector look, no thick gold slab, no glossy plastic, no heavy bright saturation. Keep sides perfectly parallel and corners square with tiny radius, no perspective: the app will apply perspective itself. Truly transparent background ONLY outside the card; the entire paper interior is opaque.

用户在实机反馈后要求取消桌面倾斜，最终场上卡框正置；保留5:7竖向矩形和手牌浅扇形。持续动画由代码完成：立绘轻呼吸、衣甲流光、少量粒子与边光，不修改原人物图。技能与落定效果同样由代码消费正式引擎事件，不参与随机或战斗计算。原生 Electron 实机录屏为 `docs/screenshots/card-battle-v3-skills.webm`。
