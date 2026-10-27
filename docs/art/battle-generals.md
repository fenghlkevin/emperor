# 名将骑战资源

首批覆盖程序历史人物表中的 26 位名将，现按扩展队列逐人追加，名单及原始人物 ID 见 `src/battle-general-art.mjs`。资源统一为骑马立绘与马上动作；不会使用步战人物代替。资源由内置 imagegen 工具生成，保存到项目的 `assets/battle/generals/war-general-mounted-*-v2.png`，打包沿用已有的 `assets/**/*` 规则。

每人一张透明 PNG 图集，两列四行。前两行为四帧马匹行进，后两行为四帧马上攻击（起手、出击、延伸、收势）；待机使用骑乘呼吸，受击与阵亡使用骑乘反馈。行进为 8 fps；攻击按兵器分别设定蓄势、命中与收势时机，快枪 620ms，偃月刀 1040ms，战斧 1120ms。人物始终坐在马上，整匹马、马蹄、尾巴与兵器均须可见。

人物映射支持历史 ID、`recruit-` 招募前缀及旧存档姓名；双方部队与亲卫均可使用。图像选择不会更改部队兵种、人数、伤害、射程或装备规则。没有已验收资源的人物继续使用原兵种图集。

## 图集测量

生成图不会严格遵守网格，不能简单等分裁切。`scripts/measure-general-atlases.py` 只读取 PNG 的透明轮廓，生成 `src/battle-general-frames.mjs` 中的视口、独立 SVG 轮廓和脚底锚点，不修改原图像素。轻微接触的兵器按八个身体核心分离；无法识别八个人马整体时报告 `NEEDS REPAIR`，不启用该资源。

运行该脚本需 Python、Pillow 与 NumPy。当前 Codex 环境可使用 `load_workspace_dependencies` 返回的 Python。

## 生成提示词

使用内置工具，`transparent_background: true`。每人独立调用，提示词中的人物外观、武器与马色分别设定。关羽为绿袍长髯、青龙偃月刀、赤兔马；张飞为黑甲虬髯、蛇矛、黑马；赵云为银甲白袍、银枪、白马；马超为银盔蓝翎、象牙白袍蓝披风、虎头枪、浅灰马。

共用提示词结构：

> Production transparent game sprite atlas: historical Chinese general [NAME], RIDING A [HORSE COLOR] HORSE IN EVERY SINGLE POSE. Rider appearance: [INDIVIDUAL DESIGN AND WEAPON]. Exactly EIGHT complete horse-and-rider figures, two columns by four rows on a square 1536x1536 canvas, wide cells. Ink outlined muted watercolor historical strategy game art. Face RIGHT in side three-quarter view. First two rows FOUR distinct successive HORSE WALK CYCLE poses, changing the horse leg positions (contact, passing, opposite contact, passing), rider ALWAYS seated in saddle. Last two rows FOUR successive MOUNTED weapon attacks: windup, strike, full extension, recovery, rider ALWAYS seated ON THE HORSE, horse always visible. SAME face, clothing, equipment, and SAME horse color across all eight frames. Entire horse with ALL hooves tail ears, entire rider and weapon must be fully contained INSIDE its OWN cell. SMALL figures with at least 35px empty transparent gutters, no touching sprites or overlapping weapons across cells. True transparent alpha background. No dismounted humans, no standing humans, no scenery, no ground, no shadows, no text, no grid lines.

## 验收

`node --test tests/battle-generals.test.mjs tests/battle-idle.test.mjs tests/battle-motion.test.mjs` 检查人物映射、透明图尺寸、动作裁切、骑乘类型与复位。`electron tests/battle-generals-desktop.cjs` 检查全部资源实际加载、动作逐帧播放、左右朝向和真实出征界面。截图输出到 `output/battle-generals/`。

每种兵器的招式、时序与冲击特效见 `src/battle-general-weapons.mjs`。关羽横斩、张飞重刺、赵云快刺、马超上挑接刺；画戟钩挑横扫、战斧举斧重劈、双戟交错连击、双锏左右交击。黄忠用凤嘴长刀、李广用环首刀；本批没有默认马上射箭的将领。此为游戏美术设定。完整生成提示词见同目录人物 prompt 文件和 `battle-general-generation-specs.json`。

逐人补验可运行 `GENERAL_KEY=general-dengai electron tests/battle-generals-desktop.cjs`（替换 key）。该入口会在真实战争中安排双方主将、亲卫与同名部队，包含 recruit- 身份、实际移动接近、专属武器命中、受击及骑乘阵亡。证据分别存入 `output/battle-generals/<key>/`，进度按 generated / integratedIntoWar / verifiedInActualBattle 分开记录。
