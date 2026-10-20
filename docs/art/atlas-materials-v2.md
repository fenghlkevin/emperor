# 统一舆图美术 v2

工具：内置 `image_gen.imagegen`，未使用 CLI。
参考：本聊天最终获认可的国内 / 天下双界面原型，仅提取地图的美术风格。

产物：
- `assets/scenes/atlas/sketch-atlas-materials-v2.png`：1774 × 887，左侧宣纸、右侧海纹。
- `assets/scenes/atlas/sketch-atlas-mountains-v2.png`：1254 × 1254，透明底四种水墨山形。

这些素材由 `src/atlas-base.mjs` 统一使用；纹理镜像平铺，山纹固定在游戏地理坐标中。地图边界、命中区域、皇朝疆域、存档与其他 UI 不因装饰素材而改变。`src/atlas-colors.mjs` 登记每国独立颜色，所有地图按当前归属引用，同国同色，选中 / 本国状态覆盖颜色单独处理。

## 宣纸、海纹原始提示词

Use case: stylized-concept. Production material texture atlas for an ancient Chinese imperial map. Reference image ONLY for map art surface style, not layout. Output a flat 2:1 landscape texture sheet split EXACTLY into two equal square tiles left and right, no gaps, no borders. LEFT half: close-up seamless warm pale ivory tan xuan paper used for the reference map; understated fine fibers and fine natural uneven ink absorption, faint tiny age specks, soft low contrast worn paper. No obvious clouds or large stains, no creases, no vignette, no shadows. Uniform overall lighting and tone, naturally irregular fine organic texture suitable for tiling. RIGHT half: muted desaturated celadon/teal antique map sea with very delicate engraved flowing wave lines like the map reference, low contrast, flat texture suitable for tiling. Waves extremely subtle, small scale, not dramatic real water or foam. Absolutely no maps, no land, no text, no lettering, no mountains, no illustrations, no UI or frame. Production texture samples only. Focus material quality close to the approved mockup.

## 水墨山纹原始提示词

Use case: stylized-concept. Production transparent sprite sheet of FOUR separate tiny ancient Chinese ink cartographic mountain clusters for the map shown in the reference. Match the modest small hand-painted sepia-gray mountain motifs on the approved map, not large landscape scenery. Output square 2x2 sprite sheet on genuinely TRANSPARENT background. Four evenly sized quadrants, ONE distinct mountain cluster centered within each quadrant with wide fully transparent margins at least 15% of each cell. Each cluster short wide silhouette, 2.5:1 width:height ratio: three to five overlapping little peaks in classic Chinese antique atlas brush drawing, tapering fine ragged brush ink contours, restrained dry-brush rock hatching down the slopes and a little pale gray sepia ink wash near the base. Fine handmade detail, elegant aged ink, fully readable in tiny size. Peaks modest, none too dark or heavily shaded, no modern geometric triangle outlines. No scenery beyond the isolated cluster, no trees, no clouds, no frame, no paper rectangles, no beige background, no text, no compass, no snow, no real photographic mountains. Uniform same brush style across four different silhouettes. Artwork must be isolated with real alpha transparency for placing over colored map regions.
