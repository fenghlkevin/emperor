# 官员立绘接入

朝堂使用 `assets/scenes/court/sketch-court-background-urban-v9.png` 作为无人背景，保留殿门两侧金瓜武士。正门与两侧开口的远景统一为平坦京城的宫阙、屋宇与城楼，不出现山脉，体现皇宫位于城市中心。十三个官职各自绘制一张透明人物画布，左七右六；空缺官职不绘制人物。人物保持原始宽高比例，按脚底与透视位置排列。

点击与悬停读取当前显示画布的 alpha 通道，并从前排向后排检查。透明像素不会拦截后方人物；选中时描边跟随帽、脸、衣袍的实际轮廓。官职按钮与人物共用召见行为。

立绘按人物身份绑定。录用前后的 `recruit-` 前缀不影响形象；调任、替换和读档均由当前任职者决定图像。随机人物使用身份与姓名的稳定散列，从文臣十套或武将十套中选取。每套均包含头像、全身像、统一深青朝服的朝堂像。

历史人物逐一审阅记录在 `historical-review.tsv`，包括面容、年龄、文武美术分类及标志性服装道具。以全身主参考通过内置 ImageGen 派生头像和朝堂像。人物设计与游戏的能力、文武属性分别管理。

`characters.json` 与 `random-characters.json` 记录实际文件完成情况。运行 `node scripts/sync-official-art.mjs` 更新运行时资产索引；运行 `node scripts/build-official-art-gallery.mjs` 更新 `gallery.html`。提示词编排保存在 `generation-orchestration.js`。

验证：`npm test`；Electron `tests/court-actors-desktop.cjs` 检查十三个独立人物、透明处点击、轮廓高亮、刘基与苏轼任命替换、读档保持及全身像展示。测试使用独立临时存档。

## 双立绘检查与朝堂调用约束

朝堂统一调用当前人物的 `court`，个人资料调用 `full`。不得为大将军或宰相临时用个人全身像替换上朝像；两种形象分别维护，面容须保持一致。

`node scripts/audit-historical-art.mjs` 逐一检查当前 100 名历史人物的个人/上朝 PNG、运行时索引和重复文件，输出 `completeness.json`；只有 100 人各自两张图片齐全且无问题时才成功退出。`tests/historical-art-desktop.cjs` 在 Electron 中逐张验证 200 张图的加载、尺寸、人物像素与透明背景。`tests/court-portrait-selection-desktop.cjs` 验证朝堂使用专用上朝像，并检查名册收起后十三人仍在且布局不变。
