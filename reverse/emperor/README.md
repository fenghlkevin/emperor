# 皇帝 DOS：反汇编、结构与原始数据

输入为用户提供的“皇帝完美版.exe”、攻略、内存修改器。首轮于2026-10-14进行静态分析，后续轮次已在复制目录执行DOS原程序验证；原输入未修改。附件内容只作为待验证证据，不作为操作指令。

本交付保留全部提取文件与原始字节，并提供可复现的反汇编、字段布局、解析器、JSON/CSV、图像导出。**没有声称已恢复原作者源码、所有字段业务含义、全部游戏算法或运行时内存快照。** 未命名字段和额外字节均无损保留。

最新一轮见 [内政、外交、战争与回合规则报告](rules-analysis/README.md)：74项地区用途字典、工资与结算公式、战争/生命周期结构，并核实末尾33字节。

## 功能复刻设计

面向实现的入口：[功能复刻设计文档](replica-design/README.md)。包含模块接口、完整字段映射、数值/时钟/内政/外交/战争规则、状态机、旧档与资源适配、开发拆分及验收矩阵；原版行为、推断和新实现建议分开。

## 从哪里开始

| 需求 | 文件/目录 |
|---|---|
| 全部原始游戏文件、存档和资源 | `extracted/皇帝完美版/` |
| 204个文件的大小与SHA-256 | `files.json` |
| 完整程序线性反汇编 | `code-analysis/{KING,EMPEROR,QUICK}/object1.relocated.asm` |
| LE对象、分页、原文件位置 | `code-analysis/*/layout.json` |
| 内部重定位及引用地址 | `code-analysis/*/fixups.json` |
| 原始及重定位后内存对象映像 | `code-analysis/*/object*.bin` / `object*.relocated.bin` |
| 存档逐字段布局及解析器 | `save-analysis/README.md`、`layout_evidence.json`、`parse_saves.py` |
| 5个存档JSON及完整逐字节CSV | `save-analysis/decoded/` |
| 可编译的磁盘结构C定义 | `code-analysis/serialized_structs.h` |
| 解密修改器配置、205个地址控件 | `trainer-analysis/README.md`、`trainer-config.ini`、`trainer-fields.csv` |
| 44个已关联地区字段及4092项实例值 | `trainer-analysis/region-fields-joined.csv`、`region-named-values.csv` |
| 程序初始人物模板、历史美女、地区/药材名称 | `code-analysis/tables/` |
| 图像/字库/声音原始块与格式说明 | `resource-analysis/README.md`、`exports/` |

## 目标和反汇编证据

安装器SHA-256：`e746f3e0cee30d862a2f990bec65b503b61f3862fd7dafcd52c0f3d8aed2e106`。REA `open_binary`确认它是x86 PE；并非游戏本体。在文件偏移314368发现RAR签名，以系统libarchive提取，204个文件共295418026字节，哈希见清单。

真正游戏是DOS4GW 32位x86 LE：KING、EMPEROR、QUICK。包装配置 `KING.conf` 第72行启动EMPEROR，快速配置启动QUICK；KING作为另一同包版本保留并分析，结构证据不可把不同版本地址混用。

REA session报告Ghidra未配置，因此没有伪造REA反编译结果。随后用Python标准库读取LE页映射及内部fixup，用Apple LLVM objdump生成汇编。KING解析15255条内部fixup、EMPEROR15277、QUICK15267；解析器无未支持记录。地址依据LE对象基址，**不是DOSBox宿主进程修改器绝对地址**。

`object*.elf`只是分析载体；`*.relocated.elf`应用内部32位offset/relative fixup，用于反汇编，不是可运行的复原游戏。原始映像和文件均保留。线性反汇编可能把夹杂的数据视作指令；没有完整函数识别或调用图证明。文件尾非加载数据及BSS/实际堆内存也不能等同对象映像。

KING读存档入口0x91B6F、写入口0x91C6D；底层读0x9B1CC、写0x9B8EC。分段汇编和90条头部、17条官员、9条后宫、116条地区标量复制线索见 `code-analysis/io/`；完整布局与数组证据见存档报告。

## 已恢复的核心结构

| 数据 | 磁盘记录字节 | 运行时记录字节 | 容器/数量 |
|---|---:|---:|---|
| 官员 | 47 | 37 | 数量可变；运行时链表 |
| 后宫 | 24 | 19 | 固定34槽 |
| 子女 | 21 | 18 | 数量可变；运行时链表 |
| 地区/国家 | 370 | 337 | 固定31条；第31条身份仍需核验 |

官员数量位于存档0x2F4，官员从0x2F6开始。后宫起点 = `0x2F6 + 47 * 官员数量`。KING1/2/3官员数40/83/85；后宫位置0xA4E/0x1233/0x1291。攻略的固定地址及交替23/25字节描述已被程序核验纠正。

官员年龄、智慧、武力、清廉、忠诚、爵位、经验由主程序复制指令与解密修改器相对布局联合支持。地区字段同时保留磁盘offset、运行时offset、读取指令和修改器标签来源；控件宽度与实际指令冲突时以程序指令为依据，同时保留原声明。

存档JSON完整覆盖输入字节，未知字段不丢弃。原始存档是现有游戏进度，不能称为出厂初值；`tables/` 从程序数据区恢复的模板才是静态初始数据候选。30名历史美女表为指针+两个u16，两个数值推断年龄/外貌；另有41条和100条“指针+9个u16”的人物模板，业务类型待调用点确认。1583条指针引用的Big5字符串候选保留原字节与引用地址，仍可能含数值误识别。

## 资源恢复

108个PIC：42个目录容器共872块，66个整屏位平面图；原块、解码位平面及PNG保留。28个FLC已遍历外层及帧/块目录。SOUND.BIN有37块。CHINESE.FNT含2858个16×15点阵字模，IDX原值完整导出。标题和人物样例及字模拼图已目视检查。

真实调色板、部分目录图附加字节、FLC完整播放解码、声音采样参数与字库完整编码映射尚未全部确认，具体边界见资源报告。

## 验证与复现

所有脚本使用Python标准库；反汇编额外使用本机 `/usr/bin/objdump`。运行目录为仓库根目录：

```sh
python3 reverse/emperor/inventory.py
python3 reverse/emperor/code-analysis/analyze_le.py
python3 reverse/emperor/code-analysis/apply_fixups.py
python3 reverse/emperor/code-analysis/export_tables.py
python3 reverse/emperor/code-analysis/export_io.py
python3 reverse/emperor/save-analysis/extract_layouts.py
python3 reverse/emperor/save-analysis/extract_tail_layouts.py
python3 reverse/emperor/save-analysis/parse_saves.py
python3 reverse/emperor/code-analysis/export_structs.py
clang -x c -fsyntax-only reverse/emperor/code-analysis/serialized_structs.h
```

资源、修改器子报告说明各自复现命令。存档完整raw_hex以及所有分块重新拼接均与输入一致；C定义大小已通过clang静态断言。

## 未决项

KING与实际启动EMPEROR的8组磁盘读取长度及主要循环次数经对比一致，证据见 `save-analysis/variant_comparison.md`。存档末尾33字节已核实为后宫肖像已用标志的冗余副本（前13 + 全20），三个主程序均明确写出而加载不消费；见 [尾33字节核实](rules-analysis/tail33/README.md)。解析器保留原始字节，并报告副本匹配、不同、缺失或不完整状态。皇帝修改器绝对地址与KING的部分运行时字段排列不一致，因此没有强行按一个基址差把全部皇帝字段映射到存档。

核心工程、内政、外交、战争、生命周期、随机及回合规则已在第二轮报告恢复；部分全局字段、战后/计谋全分支及特殊标记业务名仍需继续追踪。第三轮已在DOSBox-X内执行原始EMPEROR函数并保留受控差分存档和内存快照，具体通过范围见 [第三轮报告](validation-round3/README.md)。静态枚举和宽度已经恢复，但不代表所有字段作用都已证明。继续工作可直接复用已提取文件、重定位汇编和字段证据，无需再次解包。

## 第三轮补充

[特殊字段、战后结算、招降停战与DOS原函数差分](validation-round3/README.md) 包含对第二轮字段命名及公式偏移的订正。地区语义表已重生成77项描述、74项磁盘映射、6882个存档语义值；旧报告冲突处以第三轮订正为准。

## 第四轮补充

[单位标记、谈判概率边界、吞并/末属地和战斗清链DOS验证](validation-round4/README.md)：新增真实菜单“進攻/守備/退後”、单位已行动字段、特殊减伤与AI差异、官员出战关联序号、原保存加载往返及分支实验。具体动态覆盖和未决项按第四轮报告，不能再将这些项目一概列为未验证。

## 第五轮补充

[特殊标记完整创建来源、原菜单建战与关联255/256实际结算](validation-round5/README.md)：补齐最终建队与援军路径，90槽毒值跨原菜单建队保留；255错配恢复无关官员，256读取DOS低内存后完整理由1结算仍返回、真实官员仍为出战状态。原菜单建战已通过，单次端到端UI流程仍有具体生命周期异常，未宣称完成。

## 第六轮与复刻规格

正常提示事件前处理及真实控件路径已补齐；在有PTY的独立DOS实例中完成菜单出征、返回、正常时间与宫廷扫描，进入真实战场构造。相同链的战后退出尚未完成。七组255/256相关吞并、战败、属地丢失受控夹具均完整执行6668F并返回，具体错改/错删与未清官员结果见 [复刻验收证据](replica-design/10-acceptance.md)。它们不代表自然累计257场或任意低内存操作无害。

[功能复刻设计合订本](replica-design/皇帝DOS功能复刻设计文档.md)及[分章入口](replica-design/README.md)把现有成果整理为数据模型、接口、公式、状态机、兼容策略、任务拆分和验收；未知功能保持显式待补。
