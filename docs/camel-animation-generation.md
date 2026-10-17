# 阶段三骆驼图集生成记录

使用 imagegen 内置工具；两版均待修，不引用到生产图集。

原始：/Users/fengheliang/.codex/generated_images/01a143d6-5244-7ea2-937c-d18139041e75/exec-e993636a-c6b8-4eaa-961b-c81013166223.png

最终提示词：

Use case: historical-scene. Square transparent production game sprite atlas, exactly 4 columns by 4 rows, 16 full rider-and-CAMEL poses facing RIGHT. Painted realistic miniature strategy game style, muted blue-gray and earth tones. A clearly recognizable Arabian dromedary CAMEL with long curved neck, one hump, small ears, long legs and camel muzzle, NOT a horse. Rider in blue-gray tunic and modest lamellar vest with wrapped headcloth, carrying compact curved saber. Same character, same saddle, consistent scale, full camel and rider inside every cell. Generous 15 percent empty padding on every cell edge, boots hooves head weapon never touching or crossing cell bounds. Top 8 frames: sequential camel WALK cycle with distinct alternating leg positions, neck sway and rider rocking naturally. Bottom 8 frames: sequential saber ATTACK cycle: relaxed, prepare, raise saber, forward slash, contact extension, follow through, recover, relaxed. Genuine arm and animal joint movement, not repeated stills. Saber short enough to fit square cell. Fixed ground baseline for all camel feet, no jumping. Absolutely empty alpha transparent background, no shadows no glows no scenery no text no grid lines. Match hand-painted Chinese historical strategy troops, visible believable animal anatomy.

编辑版：/Users/fengheliang/.codex/generated_images/01a143d6-5244-7ea2-937c-d18139041e75/exec-7e17a9c4-a478-43a2-87aa-ffdd62c4cd06.png

编辑提示词：

Edit this camel animation atlas to fix frame boundaries. Keep the exact 16 distinct camel/rider poses, same painted artwork style and transparent background. Re-layout as 4 columns x4 rows on a SQUARE canvas. Every camel-and-rider MUST be scaled down to occupy at most 70% of each cell width and 78% of cell height, centered horizontally and grounded at 88% of cell height. This leaves obvious empty transparent gaps between ALL figures. No nose, tail, scarf, hoof or saber can touch or cross a cell edge. Especially fix top-right camel nose and third-row raised saber extending beyond its cell. Preserve actual different walking and slashing limb poses, fixed animal scale, all facing right, recognizable long-necked one-hump camel (never horse). No labels, no grid, no backdrop, no glow, no shadow. Output genuine transparency.

检查：真实骆驼外观、腿部步态和骑手刀击存在；右边缘鼻口与部分格边留白不足，修改版仍未严格遵守70%占宽要求。未接生产，不算动画交付。下一步重新设计宽格布局或重新生成带更短武器且严格留白的图集，再实际播放验收。

