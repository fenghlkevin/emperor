# 2026-10-17 官员三图视觉复核

范围：100名历史人物及20套随机模板，共360张。逐人对照全身、头像、上朝像及面部局部；12张对照图位于 outputs/official-art-review/sheet-01.jpg 至 sheet-12.jpg。逐人记录见同名 JSON。

未发现明显身份级换脸。视角、表情、帽型变化不视为换脸；本次是游戏美术视觉检查，并非历史肖像或兵器考据认证。

## 修正

- 吕布 general-285-45592-full.png：旧戟尖碰画布上沿，戟头过度三叉化；改为中央直枪尖、双月牙侧刃，保留人物身份和装束，全武器留边。
- 关羽 manual-1553-full.png：旧青龙偃月刀尖顶到画布上沿；重构完整刀尖、刀杆与人物留边，保留红脸长髯绿袍身份。
- 张飞丈八蛇矛、秦琼双锏、尉迟恭刚性钢鞭另作原尺寸复核。其余无明显需要替换的问题，保留现图。

使用内置 ImageGen，未用 CLI。两张旧图备份在 outputs/official-art-review/backups/。

## 修图提示词

吕布：precise-object-edit；以原 full 为编辑目标，锁定脸型五官、肤色年龄、表情、盔甲披风冠饰双雉翎、姿势；仅改武器为 straight central spear point and two restrained crescent side blades on crossbar，保留刚性直长杆，完整武器和人物留边，真实透明背景，不新增文字场景。

关羽：precise-object-edit；以原 full 为编辑目标，锁定红脸、丹凤眼、眉鼻表情、长黑髯绿头巾绿袍盔甲手部姿势比例；完整显示 Qinglong Yanyue Dao 青龙偃月刀，刀尖及杆尾四周留边，单宽月牙刃和刚性直杆，双脚衣物完整，真实透明背景。

## 验证

360张PNG透明通道检查通过；无完全相同的重复文件。同步人物索引、人物完成状态、图集、completeness；历史完整性审计通过，official-art 测试5/5通过。仍为100/100历史人物、20/20随机模板完整。
