# 卡牌特效预览 V1

独立预览，不接入正式战斗引擎。打开 index.html，选择上方效果类别或下方卡牌后播放；支持暂停、继续、重播、慢放与解除／退场。武器第二次攻击、地标隔回合就绪采用明确标注的时间快进。

六张 jpg 为内置 ImageGen 工具生成的插画草稿，index.html 内嵌同一组素材。原图保留在本聊天的 generated_images 目录。正式卡面文字与数值由页面叠加，未画入插画。

共同生成提示词：historical-scene; portrait collectible strategy game card illustration; no frame, typography, numbers or watermark; painterly historical Chinese strategy art, tactile materials, cinematic chiaroscuro, large readable subject, rich depth, restrained palette, portrait 2:3.

场景提示：
- watch：夜间宫门、持盾戟禁军、门缝暖灯，墨青旧金。
- ambush：狭窄山道，前景暗弩与绷紧引线，远处进入伏击区的敌兵剪影，铁灰暗红。
- blade：前景斜置古代长刀，后侧铆钉皮盾，虚化军械架，冷钢暗木。
- spear：左下至右上的长枪，银色枪头、暗木枪杆、少量暗红枪缨，军械背景。
- camp：军医营帐、绷带、药箱、水盆、透出暖灯的帐布，橄榄绿米白。
- rally：石木号令高台，红色主旗与侧旗、前景战鼓、风云，暗木旧金。

演示单位采用仓库现有人物战斗插画。validation.json 记录本轮交互与宽度检查。

## 增益重制 V2

增益专用演出替换为刃光淬炼、玉枝生长、金属护角闭合；移除旧版泛用圆环和盒式飘字。加攻与生命按各自命中时刻更新，护盾闭合后显示最终三项状态。其他类别演出保持 V1。最终交互与响应式检查见 buff-v2-validation.json。

## 状态重制 V3

参考炉石场上单位与状态的区分方式，组合状态目标改为椭圆场上单位。增益为短促祝福光束、绿色生命微粒、单位弹动与透明金色护罩；负面为多面冰壳、沉默灰雾及小型封印，移除叶片、金属护角、冰蓝叉线和紫色封字方块。削弱攻击以偏红数字显示。正式战斗界面尚未接入。
参考：https://hearthstone.blizzard.com/ja-jp/blog/20118415/ 与 https://hearthstone.blizzard.com/en-us/cards/943/ 。

## 矩形卡与材质重制 V4

恢复矩形卡，不沿用炉石的椭圆轮廓。增益为金色命中爆发、68 枚错峰余烬、生机旋流、护盾能量封合；负面为冰晶沿边结成、碎屑飞散、攻击数值削弱与技能区沉默封印。人物插画短促弹动，卡框保持矩形。最终材质使用新生成的透明素材，文字和数值在材质上方绘制以防遮挡。增加“查看定格”，默认可直接看增益最终效果。

本轮内置 ImageGen 生成的素材及提示词概要：
- `v4-shield.webp`：矩形透明金色能量护盾；琥珀玻璃折射、流动能量丝、克制云纹，中心透明，无人物、文字、数字、背景。
- `v4-ice.webp`：矩形不对称冰晶壳；左下和右上冰簇、内部裂隙、磨砂霜花与折射高光，中心透明，无人物、文字、数字、背景。
- `v4-impact.webp`：瞬时金色法术命中爆发；白金核心、体积感琥珀能量、非对称尖锐辉光和余烬，透明背景，无平面圆环、文字、UI 或人物。

素材由内置生成工具制作，经缩放编码为保留 Alpha 的 WebP；源 PNG 保留在当前聊天 generated_images 目录。最终检查记录：`v4-validation.json`。
