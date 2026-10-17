# 03 内政与经济：可实现的状态和结算契约

本章按系统行为组织，目标是实现可与原版逐字段比较的内政内核。它不把修改器标签、攻略建议或理想化公式当作原版逻辑。时间入口与人物规则见 [04 回合与人物](04-turns-and-characters.md)。

证据等级：**[DOS]** 为 DOSBox-X 中原始程序函数执行；**[静态]** 为原始指令直接确认；**[指令模拟]** 为有限解释器执行原指令，不能代替 DOS；**[待证]** 为尚缺公式或正常入口；**[建议]** 为复刻实现方案，不声称原版如此。下列函数地址除特别注明外属于 KING；EMPEROR 不可直接复用 KING 地址。

统一总规范标记映射：**D=[DOS]，S=[静态]，I=推断，N=[建议]**；[指令模拟] 是 S 级解释器核查，不升级为 D；[待证] 不能作为已知原版公式。模式名统一为 **legacy/modern**。原不安全内存行为仅影子诊断，UI 重绘不提交业务或重复推进时间。

## 1. 数值与状态约定

- `D(a,b)`：有符号整数除法向零截断；`UD(a,b)`：对应指令宽度的无符号除法。不要使用语言默认的负数向下取整。
- `s16/u16/u8` 明确读入符号与低位写回；x86 32 位乘加与 16/8 位存储的溢出应由兼容数值层实现。把所有字段改成浮点或任意精度整数会改变边界行为。
- 完整地区对象 `R` 步长 337 字节；`R+0x02` 才是统治标记。旧存档布局表以统治标记为起点，偏移要减 2，不能直接照抄。
- 地区 `0..29` 为地区业务循环；槽 `30` 在相关军事路径用作中央特殊槽，其完整经济/国家身份不扩大推断。每个循环是否包含中央须分别实现，不能统一遍历 31 槽。
- `E` 为皇帝/国家主状态对象。`E+0x45` 是资金，`E+0x49` 本次半年税收，`+0x4D..0x71` 是收入/支出分类区。
- 原版灾害进度、计数、人口分母等不全有防零/防溢出。建议核心返回结构化 `CompatibilityFault`，不要在主机上执行未定义除法；legacy 模式保留可重现的低位结果，modern 模式才增加保护。

来源：[内政证据](../rules-analysis/domestic/README.md)、[地区字段导出](../rules-analysis/region-semantics.csv)、[存档解析器](../save-analysis/parse_saves.py)。

### 最小数据模型

|字段|原始位置/宽度|实现含义|
|---|---|---|
|playerControlled|R+02 s16|0 非玩家；勿擅改全部非 1 值为非法|
|governanceMode|R+04 s16|3 触发每月自动开发|
|workers[农,牧,商,工]|R+06/0A/0E/12 s32|四职业人口，独立于下述分母|
|corvee|R+1E s16|劳役人口；精确界面用词尚待证|
|soldiers|R+22 s16|地区兵员|
|productionPopulation|R+24 s32|产出与损失分母；不能用实时职业和替换|
|capacity[4]|R+28/2C/30/34 s32|行业开发容量|
|development[4]|R+40/44/48/4C s32|农田、牧原、运输、矿区开发量|
|efficiency[4]|R+54/56/58/5A s16|四行业效率|
|statusDisplay|R+5C s16|用于显示的状态码；不是唯一状态机|
|wealthLevel|R+5E s16|贫富等级 0..4|
|metrics[6]|R+6E/70/72/74/76/78 s16|安定、治安、体能、营业、积粮、防御|
|loyalty|R+7A s16|民忠|
|training|R+88 s16|训练，阶段推进会衰减|
|totalPopulation|R+8C s32|另一人口聚合字段，勿与 +24 合并|
|loyaltyExtra / loyaltyInput|R+94/96 s16|额外修正、公式输入；后者中文业务名待证|
|developmentTarget / migrationTarget|R+9A/9B u8|1 农、2 牧、3 商、4 工|
|yieldPerCapita|R+9C s16|半年计算结果|
|taxConversion|R+A4 s16|税额乘数；界面名待证|
|wealthPoints|R+A6 s16|财富累计积分，可负；不是可直接消费的地区现金|
|pendingRelief|R+CE u16|阶段结算分摊入账后清零|
|civil / riot / famine|R+D3/D5/11B u8|0 无，1 活跃，2 已结束待报告|
|civilTrigger / riotTrigger|R+D2/D4 u8|累计触发门限|
|disasterKind / progress|R+D7/D8 u8|灾害类型、解除门限进度|
|yieldRemain[农,商,牧,工]|R+11F/120/121/122 u8|半年剩余产出百分数，注意顺序|
|yieldPenalty|R+128 u8|半年产出累计扣减|
|famineRecovery|R+12E u8|饥荒结束门限累计|
|militaryBurden|R+12F s32|外邦兵力/军费估值，最低 1|
|recruitRatio|R+136 u8|外邦按总人口推兵比例|

字段命名订正以 [第三轮特殊字段](../validation-round3/special-fields/README.md) 为准：内乱/暴动/饥荒不可再称“特殊工程”；民忠读的是 `94/96`，不是 `9E/A0`。

## 2. 半年生产、税收、财富与人口

### 入口和前置条件

**[静态]** `settleHalfYear()` 对地区 0..29 中玩家统治者执行，调度在跨月后更新的月份 0 或 6；仅从上旬跨到下旬不会再执行。它晚于月支出及年更新，且在阶段推进后执行。不是每月收同一笔税。入口 `123E6`。

### 第一遍：产出与税收

严格按地区索引顺序；先清 `E+49`。每地区：

```text
for each remainByte: remainByte = u8(remainByte - yieldPenalty)
a = D(e农*n农,100) * m农
b = D(e牧*n牧,100) * m牧
c = UD((D(e商*n商,100)*m商)*(体能+50),100)
d = D(e工*n工,100) * m工
q = productionPopulation != 0 ? UD(a+b+c+d, productionPopulation) : 0
q = min(s16(q), 2*loyalty)
yieldPerCapita = s16(q)
remain[4] = 100; yieldPenalty = 0
wealthDelta = q - D(q*globalTaxRate,100) - (wealthLevel*15+60)
wealthPoints = s16(wealthPoints + wealthDelta)
if wealthPoints < -100: wealthPoints = -99
stepWealthLevel(region)
tax = D(D(productionPopulation,100)*q*globalTaxRate*taxConversion,100)
E.taxHalfYear += tax
```

随后 `E.money += E.taxHalfYear`。商人的加成读取 **体能 +50**，不是营业；分母为 `R+24`，不是总人口 `R+8C`。税额采用贫富升降前计算的 `q`。byte 产出扣减无下限钳制，低值减大值会回绕。无符号除法细节及乘积溢出须对照 [halfyear.asm](../rules-analysis/domestic/halfyear.asm)，上式不许擅自交换除法次序。

`stepWealthLevel()` **[静态]** 单次最多变动一级：

```text
UP   = [60,65,70,80,100]
DOWN = [-99,-40,-50,-60,-70]
if wealthPoints >= 0:
  if level < 4 and wealthPoints >= UP[level]: wealthPoints -= UP[level]; level++
else:
  if level != 0 and wealthPoints <= DOWN[level]: wealthPoints -= DOWN[level]; level--
```

不使用 `while` 一次连升数级。原始阈值见 [constants.json](../rules-analysis/domestic/constants.json)。

### 第二遍：人口增长及原版共享局部变量

**[静态 + 指令模拟]** 两遍循环不能合并。人口循环开始时，`sharedX` 是第一遍**最后处理的受统治地区**的 `wealthDelta`；人口循环中积粮达到 100 的地区将其改为 100，后续积粮低于 100 的地区沿用该值：

```text
for region in controlledRegionsInIndexOrder:
  if region.foodStockMetric >= 100: sharedX = 100
  r = D((region.loyalty + D(s16(sharedX),2))*15,10)
  for workerCount in region.workers:
    workerCount += D(D(workerCount,100)*s16(r),100)
```

这不是按本地区积粮直接计算增长的正常化公式；它是现有指令反映的原版缺陷。未有受统治地区时本地变量的初始值范围未充分验证，禁止虚构稳定值。建议把 `LegacyPopulationCarry` 显式建模，modern 模式可另设规则开关，不可悄悄修正兼容算法。此处不立即重算所有人口聚合字段。

验收数据来自 [population-verification.json](../rules-analysis/domestic/population-verification.json)：四行业初始各 1000、民忠 40；最后财富变化 -40，积粮 [20,80] → 各地区职业均 1003；积粮 [20,100,20] → [1003,1013,1013]；最后变化 60、积粮 [20,80] → 均 1010。它们是指令模拟通过，尚非 DOS 全半年端到端通过。

## 3. 每阶段内政推进

`advanceRegions()` **[静态]** 由阶段边界调用 `13825`。读档恢复也会调用一次，必须复用同一有副作用函数。完整顺序以 [regional_tick.asm](../rules-analysis/domestic/regional_tick.asm) 为准：

1. 若资金负且月份不是 5/11，执行资金不足补征：国家 `E+2BE--`，各受统治地区财富积分 -3、最低 -99，再判贫富；`Σ(productionPopulation*3)` 入国家 `+8E/+4D/+45`。
2. 顺序遍历地区。非玩家仅走外邦军事负担重算后跳过玩家损失路径；玩家处理内部计数、内乱、暴动、饥荒、灾害、训练、增援、分摊入账。
3. 推进 20 槽工程，再做工程表整理。

`R+134` 非零则自增，其中文意义未证，不可删去。正因为先后顺序可交互，报告消息的清账与纯显示必须分开。

### 灾害和民变状态机

状态显示枚举 **[静态]**：0 安定、1 旱灾、2 水灾、3 蝗害、4 瘟疫、5 严寒、6 地震、7 饥荒、8 战场、9 内乱、10 暴动、11 全国抗税暴动。灾害与民变拥有各自活跃字节，不可只存一个枚举。

内乱/暴动检查前置：受统治、对应状态 0、`s16(D(soldiers*100,productionPopulation)) <20`；内乱还要求安定 <50，暴动要求治安 <50。符合则相应触发 byte `+10`，调用随机门；首个成功地区设置状态 1、概率归零、显示 9/10、`loyaltyExtra--`，皇帝快乐 -5，清本事件 5 项损失账，立即返回。分母未防零；阈值相等不触发。

每阶段内乱/暴动活跃损失：死亡 `D(P,1000)`，转劳役 `D(2*P,1000)`，四项开发分别减 `D(development,1000)`。人口扣减调用原分摊算法，转劳役同时增加 `R+1E` 与国家 `E+A2`。内乱产出扣减每期 **1**，暴动 **2**；相应损失账累加，并执行建筑损毁。内乱账 `DF/E3/E7/EB/EF`；暴动账 `F3/F7/FB/FF/103`，依次死亡、流民/劳役、开发、产出、建筑。旧内政摘要的内乱账和产出扣减已被第三轮订正。

解除条件：状态 1 且兵占比 **>25** 或相应安定/治安 **>60** → 状态 2、显示 0；恰好 25 或 60 不解除。状态 2 在事件消息消费时清回 0，而不是立即恢复可触发。不要把 2 当永久完成态。

饥荒触发检查遍历 30 地区，**不检查统治权**：`famine==0 && disasterKind!=0 && disasterProgress>=30`，以进度作门限；首个成功置饥荒 1、显示 7、恢复进度 0、清账 `143/147/14B`。但非玩家不会进入上述玩家阶段损失段。

饥荒阶段损失：死亡 `D(5*P,1000)`、转劳役 `D(P,100)`、四开发各减 `D(5*value,1000)`；分别累计上述三账。结束进度 byte `+8` 后调用门，成功置状态 2、显示 0，报告消费再清 0。

灾害阶段处理：

|灾害类型|死亡‰ / 转劳役‰ / 开发损失‰|产出扣减|每阶段解除进度增量|
|---|---|---:|---:|
|1 旱灾|1 / 5 / 8|1|6|
|2 水灾|2 / 5 / 8|1|8|
|3 蝗害|此分支不调用人口/开发损失子程序|4|8|
|4 瘟疫|4 / 5 / 4|1|9|
|5 严寒|1 / 2 / 5|2|9|
|6 地震|本段清 D7 及 DE|不据此推定其他入口无损失|11（原始表）|

损失以当期字段计算并累计死亡 `107`、劳役 `10B`、开发 `10F`；累计产出罚值同时记 `128/113`。类型 6 清标志与后续进度路径应按指令顺序实现，不用此表代替控制流。解除门成功调用 `3B55E`。类型 3 的其他影响、地震一次性损失不能以本段没有调用损失函数推定为零。

来源：[第三轮状态机](../validation-round3/special-fields/README.md)、[灾害损失指令](../rules-analysis/domestic/disaster_loss.asm)。这些损失尚未全部逐项 DOS 差分；章节给出静态算法，不标为全部动态通过。

### 职业人口扣减

`deductWorkers(loss)`：先 `D(loss,4)` 均摊四业，再把余数轮流从正数行业扣除；低人口行业存在先清零、再读取旧值的指令次序问题。普通人口范围可按原片段恢复，但极小人口夹具尚待 DOS 核验；不得以“总人口守恒”断言此缺陷路径一定正确。实现时将其做独立 `LegacyWorkerDeduction`，参考 [regional_helpers.asm](../rules-analysis/domestic/regional_helpers.asm) 的 `3B3DD`，为异常分支保留兼容回放测试。

### 训练、增援、分摊财富

- 地区训练 >0 则每阶段 -1。中央训练命令开关 `CC9B5==1` 消费一次；有兵时增量为 `D(官员+0E*10 + 官员+12*10 + 皇帝魅力*4,中央兵数)+2`，无兵为 0，最高 100。官员原始字段 +0E/+12 不能在字段证据不一致时凭直觉改名。
- 每地区 `E+25C+i*2` 非零表示待增援，先清标记，再把训练改为 `D(oldTraining*oldSoldiers + pendingSoldiers*centralTraining,oldSoldiers+pendingSoldiers)`。分母原版无零保护。中央兵和装备按 `E+B8+i*14` 的 7 个 word 扣除，地区对应增加。保留此时训练已先 -1 的顺序。
- `pendingRelief!=0` 且 `P!=0`：财富积分加 `D(u16(pendingRelief),P)`；该字段随后归零，并判一次贫富。小额分摊被整数截断为 0 仍会消费待入账额。

## 4. 每月维护及开发

月更新仅对受统治且治理模式 3 的地区自动开发：找四行业效率最小值，平局保留较早行业；设开发方向后调用开发辅助，再以官员效果增加民忠、上限 100。`developmentTarget==1..4` 时对应开发量加 `8A86D(regionId,mode)` 的返回值并钳到容量；该官员任务效果函数的全部分支不在现有证据中，必须作为 `DevelopmentEffectProvider` 待补，不能造固定增量。

人口转业辅助：原始迁移率 3；通常分母 100，特殊模式 `CCC85!=0` 时为 10。先分别求 `D(n_i*3,denominator)`；指定目标 1..4 时，从其余三业扣对应量，目标加三者之和，目标自己的转移量不用。正常非负输入下职业总量守恒。开发和迁移函数本身不等于所有菜单操作的费用/耗时；命令提交入口尚需单独对应。

月维护 `13109` **[静态 + 指令模拟 + DOS 对应函数 13121]**：

```text
P = sum(玩家地区 productionPopulation)
N = sum(玩家地区 soldiers) + centralSoldiers
buildings = sum(玩家地区七建筑等级 * 模板月维护)
          + sum(16特殊设施中状态恰为1者 * 模板月维护)
population = D(P,2)
office = 40*在职人数 + 20*散官人数
nobility = sum(官员爵位工资)
corvee = 4*E.corveePopulation
army = 4*N
money -= buildings + population + office + nobility + corvee + army
ledger[6D,51,55,61,5D,59] += 对应项
```

资金可负，无余额不足拦截。在职/散官按官员职位字节，散官 `0x4D`；职位工资与爵位工资各计一次。爵位 [王,公,侯,伯,子,男,无] 工资 [600,300,160,80,30,10,0]。前六建筑月维护各 10，行宫 200；特殊设施只在状态 **==1** 计维护，不能用 `!=0`。

模板 23 条、每条 22 字节，应直接导入 [building-templates.json](../rules-analysis/turns/building-templates.json)。其中 `dword_4/8` 尚未全部证明等于菜单造价/总工期，禁止仅凭数值命名成“建筑售价”。

## 5. 工程队列

工程 20 槽，每槽 15 字节：`region:u8, kind:u8, percent:u8, increment:s32, required:s32, accumulated:s32`。地区值 255 空闲、100 待移除。普通种类 0 市集、1 义仓、2 寺庙、3 衙门、4 城墙、5 校场、6 行宫；>=7 为特殊设施。

`advanceConstruction()` **[静态]** 每阶段对有效记录 `accumulated += increment; percent=u8(D(accumulated*100,required))`。累计 >=需求即完成：普通建筑对应等级 word +1，未见等级上限钳制；特殊设施对应 `E+28A+kind*2=2`，另加模板效果到 `E+2C0`。完成后地区标记设 100，每阶段投入量加回 `E+9A`，再由 `39D0E` 压缩全表，空末槽补 255。不能把完成时的状态 2 误当维护判断的 1。

工程创建接口建议：`requestConstruction(region,kind,allocation)` 返回合法性与报价预览，再 `commit` 扣资源并插槽。**[待证]** 原菜单对重复建设、余额、最高等级、工程冲突的全部拦截条件与即时扣款尚未恢复；实现不得把上述建议校验冒称原版。当前可稳定复刻的是既有队列的推进、完成与整理。

建筑损毁 `3BB5B`：仅前六类，不含行宫；总量非零才处理，按原随机门决定损毁机会，随机选类最多 29 次找非零建筑，成功减 1 并累加损毁数。不要替换成每类独立均匀分配；调用次数影响后续随机序列。

另有 `93×7` byte 计时矩阵，独立于工程：旧值 100 跳过，>=3 减 1，旧值 2 调 `14F20` 后清 0，旧值 1 不推进。行的业务归属未完整对应，不可解释成 93 地区或 20 工程槽。

## 6. 民忠与外邦军事估值

民忠重算 **[静态]**，参考 `3B637..3BA74`：先按国家 `E+44*5` 扣体能、最低 0，再加已完成特殊设施对六指标的效果，之后：

```text
taxPart = (50-tax)*2
officerPart = wisdom<59 ? 0 : D((wisdom-59)*25,10)
average = min(D(安定+治安+体能+营业+积粮+防御,6),100)
loyalty = D(taxPart*35 + officerPart*15 + input96*10
            + average*20 + D(wealthLevel,4)*20,100)
loyalty += E.modifier2BE + extra94
loyalty = max(loyalty,0)
```

这里只证明下限，不为该公式擅加统一 100 上限。财富项是先除 `level/4`，0..3 均为 0，4 才贡献；原版粗粒度取整须保留。特殊设施逐个指标加成表应按原助手及模板补足，未核实部分暂不填数。

非玩家地区 `3BA79`：`soldiers=word(D(totalPopulation*recruitRatio,100))`；`burden=D(soldiers + D(unknown8A*soldiers,50) + D(training*soldiers,50),50)`，结果 0 改 1。此为外邦估值/征兵路径，不能使玩家地区每阶段按该比例凭空补兵。

## 7. 实现接口与验收清单

建议接口均接受显式 `WorldState, RuleProfile, RandomStream`，返回逐字段 `MutationLog` 与事件意图；UI 只发命令和消费事件，不直接改地区。接口：`settleHalfYear`、`advanceRegions`、`settleMonthlyExpenses`、`stepWealthLevel`、`advanceConstruction`、`moveWorkers`、`recomputeLoyalty`。随机门统一用 [04](04-turns-and-characters.md) 的实际 LCG，禁止每个子系统自建随机源。

|验收|输入 / 操作|期待|证据等级|
|---|---|---|---|
|贫富不连升|level 0, points 200，调用一次|level 1, points 140|静态，待移植测试|
|边界解除|活跃内乱，P10000，安定60，兵2500/2600|前者保持1，后者2|静态预测，未冒称DOS|
|低额赈济|P10000，pendingRelief9999|财富增0、待入账归0|静态预测|
|月支出合成|P1501，地方兵126，中央13，民夫11，一王在职、一男散官；建筑等级[1,2,2,2,1,1,0]及首特殊设施1|六项[290,750,60,610,44,556]，合计2310|指令模拟通过|
|月支出原档夹具|资金1000000，第三轮原档受控执行|扣19924，剩980076，六分类与记录一致|DOS原函数通过|
|建设恰完成|required100, accumulated90, increment10|percent100、完成效果一次、槽压缩|静态预测|
|转业守恒|四业1000，目标农，普通模式|农1090，其余970，总4000|静态预测|
|跨地区人口carry|见第2节三组输入|1003/1013 等，不随各自积粮理想计算|指令模拟通过|

DOS实测依据：[第三轮运行报告](../validation-round3/runtime/README.md)。完整半年贸易收支、投资创建/回收、全部内政菜单费用、特殊设施效果枚举及官员开发效果仍是功能复刻的显式待补项；现阶段不能仅凭本章宣称经济系统 100% 还原。
