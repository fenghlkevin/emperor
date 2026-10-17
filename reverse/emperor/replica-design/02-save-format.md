# 02 存档与兼容设计

## 外层布局（S，little-endian）

```text
prefix[10]
fixedHeader[746]
officialCount:u16
officials[officialCount][47]
harem[34][24]
childCount:u16
children[childCount][21]
regions[31][370]
battleCount:u8
battles[battleCount][1793]
other5Count:u16
other5[other5Count][5]
fixedTail[1523]
optionalPortraitCopies[33]
optionalExtra[remaining]
```

`officialCount`绝对偏移0x2F4，官员始于0x2F6。后续偏移必须递推，不能硬编码攻略中的后宫或药材绝对地址。令O、C、B、L为各数量：

```text
haremStart = 0x2F6 + 47*O
childCountPos = haremStart + 34*24
regionStart = childCountPos + 2 + 21*C
battleCountPos = regionStart + 31*370
other5CountPos = battleCountPos + 1 + 1793*B
fixedTailStart = other5CountPos + 2 + 5*L
parsedEnd = fixedTailStart + 1523
```

原解析器的 `tail_offset` 是战斗数量开始的位置，而 `tail_b_offset` 才进入后续固定尾块；实现时按本节明确命名，不能仅凭JSON旧键名猜区段。

## 导入过程（N，对照原格式）

1. 先识别3字节 `1\r\n` 空槽，不把它当损坏完整世界。
2. 检查每次读取的剩余长度；数量乘法使用不会溢出的宿主宽度，先验证所需长度再分配，限制文件总大小。
3. 保存原字节、每条记录起点、区段顺序和未知字段，随后依照复制映射生成领域对象。
4. 文字保存raw bytes、解码文本及解码异常位置；BIG5损坏字节可显示替代符，但不回写替代字符覆盖原数据。
5. 读取正式肖像使用20字节数组，再把未消费尾部33字节记为两个冗余副本状态。多余字节单独保留。
6. 检查数量、枚举/兵种、部队有效槽、关联冲突；合法旧异常是诊断，不自动改档。新模式修复需要显式迁移报告。
7. 不在纯解析过程中自动推进地区或时间。原界面读档有额外地区更新（S），若要兼容这种副作用，由 `LegacyLoadRestore`命令单独执行并记录，避免解析器、UI和世界各更新一次。

## 磁盘与内存转换

官员47→37、后宫24→19、子女21→18、地区370→337。必须逐字段转换；磁盘记录中的预留字段不是可删除填充。地区贸易收入磁盘s16→运行时s32，因此逆写需要检查s16可表示性：

- `preserve`：完全未编辑记录按原始字节输出。
- `strictCompatible`：编辑值不能表示时拒绝导出并列出字段；不能静默截断。
- `legacyTruncate`：仅显式选择时按原写入低位，报告实际落盘值。

## 战斗记录

1793字节不是1796字节运行时B整体。原加载分32块；两组810字节映射到B+0x65与B+0x3CE，每组45×18。中间控制字段及末尾多个u16必须按加载/保存序列独立存储，原加载可能连续写同一运行时+0x702；不要只保留最终覆盖值后丢掉前面的磁盘数据。

序列与长度见[尾部分块数据](../save-analysis/tail_layout_evidence.json)。旧附件的三份完整存档没有活动战斗，解析器战斗边界的合成样例验证与DOS新建战斗快照是不同证据，不得混称附件真实战役档。

u8当前战斗条数与u16累计关联计数不同。新模式可以有更大队列；导出旧格式若当前活动战斗>255，应拒绝，不能低byte截断后丢失节点。

## 固定尾与33字节

固定1523字节的依次分块：u16、8×u16药材、30×12数组、20×15工程、四u8、100字节、30字节、651字节、六u8、u16、u8、u16、20字节、两个u8、20字节、三个u8、4字节。具体字段来源按[分块表](../save-analysis/tail_layout_evidence.json)及解析导出tail_sections，未知数组保持有序raw。

33字节是正式20字节肖像使用数组的前13字节副本，再完整20字节副本。三个程序保存写出，加载不消费（S/D样本）：

```text
copies = portraitUsed[0:13] + portraitUsed[0:20]
```

读取状态为matches/differs/missing/incomplete，不把副本差异当校验和失败。`preserve`保留原尾，`canonical`重新生成副本但必须报告改写；追加Extra字节不能悄悄抛弃。

## 新格式（N）

建议以版本化JSON/CBOR/数据库快照存领域结构，并附可选旧格式OpaqueImage；旧档输出是适配层，不把旧固定长度限制扩散到所有新功能。

```text
SaveEnvelope {
 formatVersion, rulesetVersion, compatibilityProfile,
 sourceVariant, sourceHash, revision,
 world, rngSeed, pendingEvents, settledBattleVersions,
 legacyOpaque?: {sourceBytes, recordIdentityMap, importDiagnostics}
}
```

写入先生成完整临时文件、校验再原子替换，并保留上一版本；不覆盖输入原档。旧SAV的完整随机seed恢复/初始化契约尚未在本套资料收拢，不能把固定尾最后4字节猜成seed；原DOS对照用外部记录的seed初值。新格式必须显式保存seed。稳定ID不随导入列表排序变化；同名人物分别保留。新档不保存游戏窗口状态指针，但可以保存“待显示事件ID”以恢复交互。

## 验收

- O=40/83/85的KING1/2/3无编辑导入导出逐字节一致，SHA-256相同。
- 新增一官员时后宫及后续位置恰后移47；新增子女后移21。
- 截短任一可变区段应返回具体区段/期望长度，不越界读、不分配巨量内存。
- 插入一条1793字节战斗后两组45槽正确、后续尾位置恰+1793。
- s16贸易收入-1导入为s32 -1；导出40000严格模式报错，显式截断模式报告-25536。
- 尾33不一致不改变领域状态；无编辑保留异常尾；canonical重新生成可验证的33字节。
- 空槽、非BIG5文本、未知字段、未匹配的关联序号都必须可诊断且可保留原数据。

来源：[存档报告](../save-analysis/README.md)、[解析器](../save-analysis/parse_saves.py)、[可编译磁盘定义](../code-analysis/serialized_structs.h)、[尾33核实](../rules-analysis/tail33/README.md)。
