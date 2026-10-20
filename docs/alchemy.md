# 青炉房

2026-10-16 实施。参考[调研方案](research/emperor/青炉房调研与功能方案.md)，替换原健康加8的占位操作。

## 玩法

中午、下午可进青炉房。新局八味药材各一份，旧档空药柜迁移，不改变历史属性。选择每味一份，开炉扣10体力，三旬后自动收入两颗丹药；同一时点只容一炉。查看与配伍免费，离房沿用游戏的阶段推进。药柜最多200批，接近容量时不能开新炉。

成丹可试药、亲服或按数量弃药。试药消耗一颗，永久记录丹方，同方各批次同步辨明；未知丹亲服须确认。已知配方可一键配伍。有害丹扣健康最多15、寿元最多12，保留至少1寿元，不设直接服毒死亡。弃药须确认。

采用调研中的十节攻略20组材料集合，投料顺序无影响。恢复体力最多100；健康和快乐各加10；四能力各加2；体力上限加30，当前体力不随之补满。四能力和体力上限最高500，健康快乐最高100，体力受当前上限约束；无收益时不耗丹。回元丹、养和丹、四仪丹、强身丹等为本游戏命名。

延寿是本游戏明确选择的数值：八味基数为`max(1, floor(1200 / max(20, 年龄)))`，特定七味为基数两倍，六味为基数一半向下取整。按服用时年龄计算，最多加至既有`lifeLimit`，不减少年龄；寿元并非保证生存年数。20岁八味60、七味120、六味30寿元。所有药效显示实际增量。

## 贡药

每旬结算一次，在仍有领土、非敌对、友好度至少95的外国中随机选一个。普通友国献药概率25%，受本国保护的外国40%，成功时八味等概率选一味一份。外国每旬最多一份，无资格国不献药。来源国、药名和日期记入献药与炉记；年度贡银不变。

按单一稳定友国计算，平均每年约9份药材；保护国约14.4份。这意味着补齐特定七味需要长期外交积累，而不是每旬必得延寿材料。概率、工期、药效及成丹数量均为项目规则，不宣称已经还原DOS原版算法。

国内进贡：每旬按全国统一5%概率判定一次，成功后从当前属于玩家的州府中随机选一个，八味药材等概率贡献一味一份。州府数量不放大概率，失去的州府不能进贡，无领土或本朝终结时不产生国内进贡。平均每年约1.8份，作为外交贡药之外的稀少补充。国内与外国独立判定，同旬可以各得一份；进贡州府、药名和日期记入献药与炉记。判定由存档和旬次固定，读档不能重刷；沿用同旬结算标记，重复结算不会补发。

## 保存与结算

`src/alchemy.mjs`持有数据和规则，`src/alchemy-ui.mjs`与`src/alchemy.css`负责场景。`game.mjs`接入新局、旧档校验、跨旬结算和开放阶段；移除通用起居的旧炼丹增益。炉次保存材料组合与确定药效，读档不推进工期、不重复成丹或献药。存储失败沿用既有原子提交，未成功写入不发布扣料状态。

## 美术

使用内置 image_gen 生成，保存为`assets/scenes/alchemy/sketch-alchemy-v1.png`，由现有`assets/**/*`打包规则包含。药名和数量由界面绘制，底图不含文字。材料用独立可选药签控件表达，没有另生成八张材料插图。

最终提示词：

> Use case: historical-scene. Production background artwork for an ancient Chinese imperial strategy game, landscape 1536x1024. A royal alchemy chamber with finely detailed colored ink painting style, realistic adult human proportions, restrained jade green, vermilion red, antique gold, warm natural daylight, intricate wooden architecture and painterly surfaces. Left side wooden apothecary cabinets and a table displaying eight small medicinal ingredient containers. Center a large ornate bronze tripod alchemy furnace with a tiny warm charcoal glow and a wisp of smoke. Right side one mature Daoist alchemist in muted teal robes and one adult palace eunuch in dark crimson holding a porcelain medicine tray. Red pillars, gold trim, lattice window with palace garden outside. Entire central furnace and people's faces remain in upper two thirds. Lower third has a quiet shaded wooden foreground table suitable for overlaying interactive controls. Top 12 percent quiet architecture for title overlay. Polished historical palace atmosphere matching an illustrated imperial court game. No fantasy magic beams, no modern items, no text, no letters, no interface, no labels, no watermark.

## 验证

规则测试：`node --test tests/alchemy.test.mjs`。全量：`npm test`。

桌面验收：`node_modules/.bin/electron tests/alchemy-desktop.cjs`，覆盖开炉、跨旬、试药、亲服、发现丹方与真实存储提交，保存1360和900宽窗口截图到`outputs/alchemy/`。
