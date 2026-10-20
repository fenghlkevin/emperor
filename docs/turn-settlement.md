> 2026-10-19 全国钱粮更新：各国各一份银两、粮食库存，州不再独立存钱存粮。灾损按受灾州人口份额扣全国资源；常规税银直接入国库。委任可先按全国缺口购粮，再统一扣全国仓损、汇总各州田赋、按需求比例供粮；短缺比例分配，按最大余数与州标识确定整数余粮。建筑收益读取实际分配后的缺粮结果。详见 [全国钱粮](national-resources.md)。

# 行动阶段与旬结算顺序

本文件按 `src/game.mjs::advance` 和 `src/domestic.mjs::settleDomestic` 的实际调用顺序排列。它描述现有行为，修改顺序应同时检查财政、粮食、工程生效和战争来源约束。存档版本见[兼容说明](save-compatibility.md)，字段来源见[数据字典](data-dictionary.md)。

## 时间与入口

一年 36 旬，一月 3 旬；turn 从 1 开始，显示日期按 turn−1 换算。每旬 phase 为：0 早上·早朝、1 上午、2 中午、3 下午、4 傍晚、5 夜晚。

- 离屋 `leaveRoom`：phase 0–4 加一；phase 5 离屋调用 advance，进入下一旬 phase 0。同一次朝堂内多次召见不推进阶段，退朝才推进。
- 安寝至明 `sleepUntilNextTurn`：先恢复一次体力（最多 +150，耗尽时补满）、健康最多 +5，普通作息不额外扣寿元（耗尽时扣 30），再 advance；若额外扣寿元已使其归零，直接生成终评，不跨旬。夜晚不可使用该跳过入口，应正常独寝离屋。
- 自动晕倒 `resolveExhaustion`：当前体力不大于 0 且寿元仍大于 0 时，先 advance，再补满体力、健康最多 +5、额外扣 30 寿元，最后补终评；正常跨旬的 1 点寿元另计。
- 普通独寝：白天与夜晚均无额外寿元费用；若体力为 0 则扣 30。恢复动作本身不调用 advance，离屋按阶段处理。正常换旬不自动恢复健康或体力。
- 巡游返宫 `finishTravel`：扣返宫寿元后，逐旬调用 advance 至下一月上旬，遇寿元归零或待处理迁都停止；微服体察返宫只调用 leaveRoom。

这些入口都应在候选副本上执行，统一提交成功后发布；不得直接修改正在展示的状态再尝试补存。

战时必需决策直接打开军务面板，先于早朝阶段、宫殿及普通办公门槛判断，并通过 `app.mjs::commitWar` 提交：正常状态下军务收尾仍扣1体力、2健康、3快乐；如果已有来敌/战场而皇帝已被办公门槛挡住，则必需收尾免除该次办公扣费，避免战时导航锁住恢复入口后无法迎敌或撤守。归零体力在战事清除后按原晕倒规则处理；迁都与终局沿用既有豁免。

## 主结算顺序

下表中的 T 是进入后的新旬序。常规财政和历史记录均记在 T，不记在刚离开的 T−1。

| 步骤 | 调用与结果 |
| --- | --- |
| 1 | 初始化皇帝与祥瑞默认结构；寿元已尽、京城失守待决、存在未结束战场时拒绝 advance |
| 2 | turn 加一为 T；settleMother 根据 T−1 是否探望结算孝道；phase 置 0；寿元扣 1；后宫连续相伴次数归零 |
| 3 | 若 `(T−1)%36===0`，皇帝、后宫成员与当前相见者长一岁；无出生旬的旧子女按年度增长 |
| 4 | settleRoyalFamily：孕育、出生、幼年生死、带出生旬的子女年龄；settleDynasty：宗室同步、年度寿终与储位 |
| 5 | settleJustice：调查费用、囚禁忠诚、谋反及分离州归属 |
| 6 | settleDomestic：完整顺序见下一表 |
| 7 | settlePersonnel：制举揭榜，清理失地委任，再 settleGovernance 自动治理 |
| 8 | settleStrategy：处理在途外国战役、条约军援超时、按条件经营与发动战役；可能产生京城危机 |
| 9 | settleEndings：连续危重和禅让奏章；settleAlchemy：成丹与进贡；settleAuspices：祥瑞 |
| 10 | 从本国权威记录同步 stats.prestige / treasury |
| 11 | settleProgress 更新功业；settleReignResult 在已终结且尚未归档时生成终评 |

步骤 2 的自然寿元若降到 0，advance 不会中途返回，后续模块仍按各自条件执行。各子模块是否跳过终局由其自己的守卫决定；不要把总流程理解成“任意步骤寿元为零就立即中断”。自动晕倒也遵循其先跨旬、后恢复的顺序。

## 内政子流程

| 顺序 | 处理 | 对当旬的影响 |
| --- | --- | --- |
| 1 | refreshSpecialBenefits、beginReliefTurn、initializeBuildingEffects | 刷新特殊商业加成、重置购粮额度、补建筑效果记录 |
| 2 | settleDisasters | 到期灾害结束，按种子判断新灾，先扣地方钱粮、更新民生和情势；持续灾害不叠加 |
| 3 | settleGeneral | 中央训练在本旬财政与生产之前结算 |
| 4 | initializeFinance；依 countries 顺序处理有领土且未结算的国家 | countrySummary(T) 预测本旬收支，通过 postTreasury 登记 regular:T 并更新 accounting.lastSettledTurn |
| 5 | 每个上述国家内按所属州顺序 | 新制本国先执行委任救急购粮，再对各州计算仓损、田赋入仓、军民夫供粮与民间不足的赈济，保存快照；旧制仍为全部产粮入仓并扣全人口口粮。真实缺口才扣安定/民忠，再 settleBuildingEffects；必要时转动荡 |
| 6 | settleDiplomacy | 每旬贸易和年度贡银，按实际支付登记双边流水 |
| 7 | settleConstruction | 普通工程推进；灾时冻结，到期灾害已在步骤 2 清除，故可当旬复工 |
| 8 | settleIndustry | 产业工程推进、记录新增面积与下旬启用 |
| 9 | settleOccupation | 占领治理与状态恢复 |
| 10 | settleSpecialWorks | 特殊工程推进与已生效设施收益、官员年度成长；再次刷新特殊商业加成 |
| 11 | settleStateDevelopment | 税负/缺粮/民变；每三旬生活升降；年度人口、地方投资；官员年龄与致仕寿终 |

国家财政无领土时跳过；财政已结算的国家，其本轮内的供粮和普通建筑民生结算也跳过。其他业务模块用自身 lastTurn 防重复。`settleDomestic` 不递增 turn；只应按连续旬序调用，不能把跳到 T 理解为自动补算中间所有旬。

## 生效边界与报表

- 产业工程在 T 完工，登记面积增加，但 activation.effectiveTurn=T+1。T 的税粮仍用旧面积；T+1 开始增产。地方年度兴农同样登记 localInvestment.effectiveTurn。
- 普通建筑在 T 完工，实际数量立即增加，buildingEffects.pending 标记 T+1 生效；effectiveBuildings(p,T) 排除当旬新建数量。
- 特殊工程同样 T 完工、T+1 启用；民生与官员收益依 specialActive 的旬序判断。
- 已结算供粮快照、现金流水是事实记录；countrySummary 是当前状态下的预算查询，两者不能用来互相覆盖。查询生产或收益生效边界时须显式传 turn。
- 自动委任发生在内政与工程推进之后；其新开项目 startedTurn=T，不在同次结算里再推进。年度人口变化也在当旬供粮之后，改变后续预测而不重算已记录口粮。
- 刑部叛乱在常规内政前，外国战役在其后：前者改变本旬按哪个国家汇总，后者不倒改已经入账的当旬收支。

## 重复执行与随机

防重依赖模块 lastTurn、财政 lastSettledTurn、交易 key、政令 nextId 和战场 reservation 状态。某个模块的防重标记不能代替整个推进流程；重复调用 advance 本身就是推进另一旬。

灾害、祥瑞、炼丹进贡和巡游事件使用各自确定性规则。修习、怀孕、部分皇室与制举仍使用 Math.random；当前没有统一随机状态机，也没有完整事件溯源回放承诺。

### 新资源制的委任救急时序

`resourceRulesVersion=1`的新局在本国常规财政入账后、供粮扣粮前执行`settleGovernance(...,{reliefOnly:true})`。仅已委任本国州可自动购粮，按当旬生效产出和当旬仓损测算缺口；费用与治理损耗合计受当旬预算、国库保留线和购粮额度约束。预算不足时只买可付数量，余下缺口照实结算，不免除惩罚。

`governance.reliefTurn`是可选的新制防重标记；后续人事中的一般治理沿用同一`spent/turnBudget`，不能重置预算或重复购粮。一般治理的生产/施工安排仍在供粮之后，并非本阶段已完成新的完整自治规则。旧档不改变原结算时序。
