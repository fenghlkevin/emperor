# 外国使臣完整横版场景

当前游戏使用 33 个外国各 3 张完整横版会面图，共 99 张。每张图在同一幅画中包含使臣、服饰、双手、茶案及屏风，不拼装人物，不以竖版人物叠贴另一张背景。

文件：`assets/envoys/wide/<国家>/envoy-0.png`、`envoy-1.png`、`envoy-2.png`。

界面左侧按原比例完整显示整张场景图（object-fit: contain），不裁切、不拉伸、不加渐隐蒙版；右侧独立功能栏放置议题、对话和操作按钮，关系信息放在图片下方，不压住图片。小窗口可滚动右侧文书。

同次来访、切换议题、暂离和读档保持同一人物。旧固定立绘编号继续有效。此前竖图、分层素材和校准源文件保留，但不打入正式包。

33 国场景由内置 image_gen 生成，每国源图为三张横版场景上下排列。完整生成基础提示词和各国设计约束位于 `wide-scenes-generation.json`；最终提示词由 base 加对应国家的肤色、冠帽、衣袍颜色、发式、饰品及屏风题材组成。未使用 CLI 生成。

原始三行图保存在 `assets/envoys/wide-sources/<国家>.png`。
准备素材：`npx electron scripts/prepare-wide-envoys.cjs`。
验证：`npm test`、`npm run test:envoy-wide`。
