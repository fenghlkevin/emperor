# 皇帝 DOS 资源数据恢复

静态解析；没有执行游戏或修改原文件。源目录为 `../extracted/皇帝完美版/games/EMPEROR/`。运行 `python3 analyze_resources.py` 可重建清单及导出。脚本仅使用 Python 标准库。

## 覆盖与验证

- 全目录 173 个文件的文件名、大小、SHA-256、首部字节在 `manifest.json`。
- 108 个 PIC：42 个图片容器，共 872 个块，已经逐块无损导出；66 个整屏 RLE 图片均完整解码为 153600 字节，均对应 640×480、4 bit/pixel。
- 28 个 FLC：文件声明长度与实际长度全部相等，外层记录全部遍历到 EOF；头部帧数合计 2014。每个文件另有一个 F100 前缀及一个 F1FA 环回帧，外层记录总数 2070。
- SOUND.BIN：37 个区段，目录及数据范围均在文件内，已逐块导出。
- CHINESE.FNT：85740 字节，完整划分为 2858 个 30 字节字模；按 16×15 一位点阵渲染后，目视为清晰中文。CHINESE.IDX：30210 字节，即 15105 个 little-endian uint16。

## PIC 目录格式（已验证）

`uint8 count; struct { uint32 offset; uint32 length; } entries[count];`，全部 little-endian；offset 是文件绝对偏移。各块前四字节为 `uint16 width; uint16 height;`，随后为图像数据。所有块范围有效，最后一块结束均正好为 EOF。

通常图像长度为 `4 × ceil(width/8) × height`，四个位平面依次整块存储，单平面内部按行、高位优先。BACKGND 的样例验证了这种位平面布局。872 块中有 44 块长度超出此公式；可能为预分配缓冲、附加画面或其他记录，尚未由读取代码确认，完整字节已保留，不能把超出部分丢弃。导出的 `.bin` 包含原始四字节尺寸头。目录样例使用标准 EGA 诊断调色板；这些资源没有携带独立调色板，颜色不是已恢复的真实游戏颜色。

## PIC 整屏格式（已验证）

保留 PCX 形式的 128 字节头，许多文件的头部前八字节和保留字段被改变，不能直接依赖标准 PCX magic。offset 8/10 是 xmax/ymax（639/479），offset 12/14 为640/480，offset16..63 为16×RGB调色板。图像自128开始。

RLE：字节 <0xC0 为字面值；字节 >=0xC0 时，低6位是重复次数，下一个字节是值。解码后每行320字节，依次为4个80字节位平面，plane0 是像素最低位，高位优先。全部66图的解码长度精确等于153600。标题和人物 PNG 已目视验证画面正确。每图导出解码位平面及原始调色板；完整原压缩文件保留在源目录。

## FLC（结构已验证，图像解码未实现）

标准 Autodesk FLC 类型0xAF12，128字节头：offset0 u32 size、4 u16 magic、6 u16 frames、8/10 u16 width/height、12 u16 depth（8）、14 u16 flags、16 u32 speed_ms。

外层记录头：u32 size、u16 magic；F1FA 帧在offset6为u16 chunk_count，16字节帧头后是 `{u32 size; u16 type; payload}` 块序列。F100是前缀，不按图像帧块解析。实际图像块类型包括4（调色板）、7（字差分）、15（行RLE）、18（邮票预览）。`flc_structure.json` 保存所有外层及图像块的偏移、长度和类型。FLC完整原文件保留在源目录，未声称已解码动画。

## SOUND.BIN（目录已验证，播放参数未知）

`uint16 count=37; {uint32 offset; uint32 length;} entries[37];`。表末offset298，第一数据也从298开始。37个原区段保存在 `exports/SOUND/00.bin` 等；`sound_structure.json` 保存范围、哈希、字节统计。内容围绕0x80变化，符合8位无符号PCM的候选特征，但没有确认采样率、通道和游戏读取方式，因此不人为生成带猜测参数的WAV。

## 字库（点阵已验证，编码映射部分推断）

每字30字节，15行×每行2字节，高位优先、黑白1bpp。`font_diagnostic_16x15.png` 以32字一行输出2858条固定记录，末尾填充白格。`font_index.csv` 包含整个IDX每个word的原始位置和值。

IDX开头两个word均为2858，正文有2857个非零值。常用Big5汉字段候选公式：

```
normalizedTrail = trail - 0x40                  # 0x40..0x7E
normalizedTrail = trail - 0x62                  # 0xA1..0xFE
wordIndex = 2049 + (lead - 0xA4)*157 + normalizedTrail
glyphIndex = IDX[wordIndex] - 1
fontOffset = glyphIndex * 30
```

目视字模前几个记录与该公式匹配，例如 初(Big5 AAEC)→IDX word3129值1→FNT offset0；臣(A6DA)→word2483值2→offset30；曹(B1E4)→word4220值3→offset60。候选映射另存 `font_big5_candidates.csv`。标点等前2049word的映射规则尚未确定；最后一个字模也未确认映射。公式仍需游戏代码交叉验证，CSV不会把候选映射冒充完全确认的原始结构。

## 可预览导出

- `exports/TITLE/sample.png`：标题图，资源自身调色板。
- `exports/LADY011/sample.png`：人物图。
- `exports/ENDING04/sample.png`：结局图。
- `exports/BACKGND/sample_000_ega.png`：四平面容器诊断图（颜色待确认）。
- `exports/font_diagnostic_16x15.png`：完整字模图。

游戏逻辑数表、人物/地区基础属性可能在EXE的数据段；这里仅分析外置资源，不覆盖EXE或存档的完整业务结构。
