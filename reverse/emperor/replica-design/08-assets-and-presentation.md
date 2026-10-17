# 08 资源、编码与表现层

## 适配接口（N）

```text
AssetCatalog.lookup(key) -> {sourceFile, block, dimensions, palettePolicy, hash}
PictureDecoder.decode(bytes, kind) -> IndexedImage/Planes + diagnostics
TextDecoder.decode(rawBig5) -> DisplayText + undecodableSpans
FontProvider.glyph(codePoint/rawBig5) -> bitmap / fallback
AnimationPlayer.play(id, onFinished) -> disposableToken
AudioPlayer.play(id, parameters?) -> disposableToken / UnsupportedFormat
```

领域事件只引用稳定资源key，不保存宿主文件路径和窗口指针。单纯动画完成只推进UI状态，不能重复执行付款、建战或结算。未恢复原动画/声音参数时允许用静态图和明确替代音效完成逻辑版，但不得将替代资源称原版还原。

## 原资源格式

|类型|已确认|实现规则/边界|
|---|---|---|
|PIC目录图|42文件、872块；u8 count后每项u32 offset/length|offset文件绝对位置；块头u16宽高，四个位平面|
|PIC整屏|66文件，640×480 4bpp，解码153600字节|128字节类PCX头，16色调色板；RLE阈值C0|
|FLC|28文件、声明2014帧，外层2070记录|AF12头、F100前缀、F1FA帧；4/7/15/18块；未完成完整像素解码|
|SOUND.BIN|u16 count37+37个offset/length，表长298|区段边界已验证，采样率/通道等未确认|
|CHINESE.FNT|2858个30字节字模|16×15，行2字节，高位先，1bpp|
|CHINESE.IDX|15105个u16|BIG5常用汉字候选映射已部分验证；标点/末字模未全确认|

整屏RLE：b<C0输出一个b；否则重复下一个字节 `b & 0x3f` 次。每行320字节=4×80，plane0对应像素最低位。严格检查输出长度和每次读取范围，禁止只凭被修改的PCX magic选解码器。

目录块常见长度 `4*ceil(width/8)*height`（不含4字节尺寸头），但44块有额外字节，必须保留和报告，不能截掉。目录图的EGA诊断色不是已恢复的游戏调色板；正式复刻需从真实装载调用与调色板状态恢复或显式使用替代配色。

## 文字与坐标

旧人物文字BIG5，攻略GB18030，导出文档UTF-8；不能把一个解码器应用到所有文件。旧档名称7字节可能含NUL、半个双字节或残留，raw串必须保留。

界面逻辑坐标640×480，现代窗口缩放后先把输入变换回逻辑坐标，再命中按钮/遮罩；信箱边距不能触发游戏。旧宫廷用四张1bit遮罩组合活动ID，视觉位置不能仅凭矩形猜所有热点。

经典模式使用竖排与原点阵字；可读性模式使用系统中文字体和现代布局（N），改变布局不改变动作规则。繁简转换只用于显示，不能回写旧档人物原字节。

## 资源交付与测试

原文件/哈希：[完整清单](../files.json)；外置资源清单：[manifest](../resource-analysis/manifest.json)；EXE人物/地区/药材模板：[tables](../code-analysis/tables)。建议构建时导出新引擎通用PNG、JSON及合法来源音效，并保存sourceHash和解码版本。

测试：所有目录块范围有效、RLE输出长度精确、bit-plane像素与已导出PNG比对、缩放后点击同一逻辑热点得到同一动作。FLC、PCM和字库标点未完成项列入表现层缺口，不阻止先交付无动画的逻辑验收版本。

来源：[资源恢复报告](../resource-analysis/README.md)、[真实战斗菜单位图核验](../validation-round4/unit-flags/README.md)。
