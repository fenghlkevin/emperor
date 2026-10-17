# 01 数据模型与字段字典

## 三层数据必须分开

1. **磁盘层（S）**：旧SAV逐字节结构，little-endian，BIG5原始文字。包括被加载器跳过的预留字节、重复副本与额外尾字节。
2. **领域层（N）**：稳定ID和命名字段；对象关系用ID，不用数组位置、角色编号或指针。未知字段带来源保留，不能赋予虚构业务名。
3. **表现层（N）**：窗口、焦点、选择索引、对话状态；退出画面不销毁领域人物和军队。

[机器字段目录](data/field-catalog.json)同时给实体、磁盘偏移/宽度、运行时偏移/宽度、转换、名称置信度和证据。地区77项语义见[完整表](data/region-fields.json)。布局映射不等于业务名全部已确认。

## 实体及容器

|实体|原磁盘/运行时长度|原容器|新实现字段|
|---|---:|---|---|
|Emperor|固定头块中的字段 / 非简单dump|单例|属性、资金、十项账、中央库存、事件计数、opaque|
|Official|47 / 37|双向节点12字节，next+8|id、name、role、state、age、attributes、rank、legacyAssociation、opaque|
|Consort|24 / 19|固定34槽|slot、present、name、age、appearance、experience、ability、pregnancyMonths、deathCounter、portraitId|
|Child|21 / 18|动态链表|id、name、age、sex、motherNameRaw/可解析母亲ID、opaque|
|Region|370 / 337|固定31条|slot、ownership、automation、occupations、army、economy、relations、events、opaque|
|Battle|1793 / 1796|8字节节点，next+4|id、sides、commanders、outcome、queueOrder、legacyImage|
|Unit|18 / 18|每方45槽|flags、type、origin、actionState、兵装、training、attack、defense、legacySpecialByte|
|Project|15 / 按尾表解释|固定20槽|slot、region、kind、perPeriodInvestment、required、progress|
|Other5ByteRecord|5 / 节点9|next+5的特殊链|保留有序raw记录，语义未证实前不命名为任务/事件|

不把31号地区一概叫中央国家。当前军事代码把country30用于中国一侧且军力汇总可遍历31条；其他经济/外交遍历通常只取前30。应定义 `RegionSlot(0..30)` 与 `ForeignCountrySlot(0..29)` 两种范围，并在每条规则声明范围。

## 核心标识（N）

```text
OfficialId: u64或UUID，创建后不随排序/任职改变
RegionId: 固定表slot，外部名称由region_names表解析
BattleId: u64/UUID，独立于legacy u16计数器
UnitId: BattleId + Side + Slot(0..44)
RoleCode: u8，77仅是原职务编码（闲散），不是人物ID或按钮索引
LegacyBattleAssociation: {personByte:u8, battleWord:u16, provenance}
```

官员byte0默认FF（D/S），它是旧战斗关联，**不是永久人物编号**。255会与默认FF碰撞；256保存到官员低byte为0，而战斗word仍256。新实现禁止拿byte0作字典主键，也不通过“第几个官员”恢复指挥官。导入旧档时只有唯一可证明匹配才建立commanderId，否则输出歧义诊断。

## 皇帝已确认公开字段

以下为SAV绝对偏移；运行时字段相对于E，而不是文件起点。

|字段|磁盘偏移/宽度|E偏移|语义|
|---|---|---|---|
|年龄|24 / u8|0E|年增长；25为独立状态字节|
|寿命上限/剩余|26、28 / 2|13、15|按使用指令决定signed语义，不能用年龄代替|
|最大/当前体力|30、32 / 2|17、19|行为成本与恢复分别处理|
|智慧/武术/魅力/才艺|34、36、38、40 / 2|1B、1D、1F、21|药效与行动函数交叉确认|
|健康/快乐|42、44 / 2|23、25|与体力不是同一资源|
|资金|72 / 4|45|保留signed32及原字节；KING1=1000000|

账项E+49..71每4字节：具体收入/支出分类与清账顺序见经济/回合章。E+2B8是外交军事相关指标，中文名仍需区分“已确认用途”和“界面名称”；不要误叫健康。完整头部90条复制映射随数据交付，未映射名称保持 `header@offset`。

## 官员与后宫字段

官员：磁盘+7→runtime+2（状态）、+8→+3、+9→+11（年龄）；+10/+12/+14/+16/+18的u16分别→+12/+14/+16/+18/+21（智慧、武力、清廉、忠诚、经验，名称有程序用途与历史标签的不同置信度）；磁盘+20→+20爵位、+21→+1职务、+22→+0战斗关联。名称7原始字节保存，显示解码不修改原串。

后宫存在标志+0必须先判断；空槽残留名称不能创建有效人物。磁盘+15为怀孕月计数，+16为老年死亡概率累计，+17肖像→运行时+18。完整复制转换按映射表，不按等偏移memcpy。皇后能力600是实际样本，不能强行套普通入宫模板。

子女年龄磁盘+7、性别+8（0男、1女），运行时+8/+9。母亲名称从磁盘+9开始；文本关联不保证唯一，现代模式解析失败时保留名称，不随意绑定同名后宫。

## 地区数据分组

所有规则用完整R为基准：R0 KING=C990C、EMPEROR=C99AC，步长337；文件第0字段→R+2。

|组|主要R偏移|实现要求|
|---|---|---|
|所有权/治理|+2/+4|不是同一字段；丢地更新二者及依赖|
|职业人口|+6/+A/+E/+12|四个职业，signed32运算语义由规则约束|
|军事/总量|+22士兵、+24职业合计、+88训练、+8C总人口|不得用总人口替代职业人口或兵员|
|财政/生产|财富积分、贫富等级、积粮、建筑、产出、税账|完整表按字段给偏移；财富可负|
|外交|+B0贸易额度、+B2贸易收入、+B6利润率、关系数组、友好度|磁盘贸易收入s16加载扩展到运行时s32|
|事件|+D3内乱、+D5暴动、+11B饥荒|旧“特殊工程”别名撤回|
|贡品/军力|+12D计数、+12F敌军力基数|调用频率与字段宽度独立|

库存用 `InventoryLocation` 区分中央、地方、战斗在途；数量字段保持原宽度，累加使用明确中间宽度。新模式不允许重复把在途兵计入可部署兵。

## 原始数据与模板

- 已有KING1–3是游戏进度，不是出厂新局；KING4/5原附件仅3字节空槽标记。
- EXE模板：30位历史美女、41条和100条人物模板、地区/药材名。只有用途证实后才用于“生成官员/后宫”；两套人物模板不能根据外形猜类别。
- 新局初始世界快照尚未完整恢复，建议阶段一只承诺“导入已验证旧档开局”。现代原创新局参数必须独立版本化，不能命名为原版初值。

来源：[存档报告](../save-analysis/README.md)、[布局复制证据](../save-analysis/layout_evidence.json)、[地区语义](../rules-analysis/region-semantics.json)、[第五轮关联序号](../validation-round5/association-reach/README.md)。
