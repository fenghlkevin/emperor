# 游戏数据字典

本文件描述当前运行代码的持久化数据和权威来源。完整字段类型见 [game-types.d.ts](../src/game-types.d.ts)，输入兼容规则见[存档版本兼容](save-compatibility.md)，时间与生效先后见[旬结算顺序](turn-settlement.md)。历史调研、开发方案和阶段验收记录不代表当前运行约定。

## 顶层状态

| 字段 | 含义与权威来源 | 管理模块 |
| --- | --- | --- |
| `version` | 存档封装版本，当前为 2 | `game.mjs` |
| `emperorRulesVersion` | 皇帝能力、体力量纲版本，当前为 1 | `emperor-rules.mjs` |
| `balanceRulesVersion` | 玩法平衡版本，当前1；缺失补标记且不回补资源 | `balance-rules.mjs` |
| `saveRevision` | 本次内存游戏状态的提交序号；成功保存加 1，用于拒绝过期候选 | `persistence.mjs` |
| `name / createdAt` | 帝号与创建时间；部分确定性随机逻辑使用创建时间 | `game.mjs` |
| `turn / phase / scene` | 当前旬（从 1 起）、行动阶段（0–5）、皇城或朝堂 | `game.mjs` |
| `stats` | 皇帝个人属性；其中国库和威望为国家记录的显示镜像 | `emperor.mjs`、`game.mjs` |
| `domestic` | 国家、地方、财政、外交、人事、战争等共同状态，schema 8 | `domestic.mjs` |
| `harem / mother / dynasty` | 后宫、皇嗣、太后、继位与历朝归档 | `emperor.mjs`、`mother.mjs`、`dynasty.mjs` |
| `travel / alchemy / hunting` | 出行、炼丹、最近已结算狩猎场次；狩猎实时靶场不入档 | 对应业务模块 |
| `envoyVisit / auspices` | 使臣行程与固定形象、祥瑞记录及已读标记 | 对应业务模块 |
| `endings / imperialProgress / reignResult` | 危重与禅让流程、称号封禅、已结束朝次的终评 | 对应业务模块 |
| `visits / history?` | 地点访问次数；顶层 history 为保留的历史兼容字段，不再新增 | `app.mjs` |

`stats` 数值：健康、快乐 0–100；魅力、才艺、智慧、武术 0–500；体力 0–maxEnergy，体力上限 1–500；`trainingSpecialty` 为 null 或 0（魅力）/1（智慧）/2（武术）。寿元以旬为量纲，开局 2160、上限 3600；自然跨旬扣 1，不自动恢复体力与健康。皇帝年龄按每年 36 旬增长。

## 国家、地方与权威边界

| 数据 | 字段和单位 | 约束与汇总口径 |
| --- | --- | --- |
| 国家身份与领土 | `countries[].id/name/capital/provinceIds` | 州的 countryId 与国家 provinceIds 双向一致；占领须同时更新 |
| 国库与债务 | `country.fiscal.treasury/debt`，两 | 非负安全整数，唯一国家现金与欠款余额；运行中通过财政记账函数变更 |
| 威望 | `country.prestige` | 0–500；`stats.prestige` 在载入、保存与跨旬时同步 |
| 地方人口 | `province.population.total/professions`，人 | 六职业合计不大于总人口；未从业人口由差额计算 |
| 地方产业 | 四业 `developedArea/capacityArea/productivity` | 面积单位为等效经营用地亩数；四业共用 `cityCapacity.land`，`capacityArea` 保留为产出基准；生产力 0–100 |
| 地方民生 | `welfare` 六项指标 | 民生整数部分 0–100；部分指标的小数以 buildingEffects.carry 的百分之一存储，查询用 welfareValue |
| 全国官粮 | `country.fiscal.grain`、`country.grainAccounting` | 唯一国家存粮，单位石；各州不再持有库存，统一收税和供粮 |
| 地方生活 | `status.livingStandard/situation` | 生活 0–100，可保留两位小数；中央补助直接改善生活；情势 stable/unrest/disaster/war |
| 普通与特殊建物 | `buildings / specialBuildings` | 普通七类数量；特殊建物记录规则版本、完工旬和生效旬，不能仅凭名称发效果 |
| 地方预算 | `budget.taxRate/otherIncome/expenses` | 州税率独立保存；国税率不是覆盖所有州的即时查询值；费用需叠加动态调整 |
| 军籍与训练 | `population.professions.soldiers`、`military.training` | 士兵是实际人口的一部分；训练 0–100 |
| 中央军部署 | `centralArmy.sourceProvinceId/soldiers/training` | 中央人数已含在来源州士兵内，不再额外计入全国人口或兵力 |
| 装备库存 | `troopKits.depots[驻地].stock/reservations` | 九兵种，各一人份配齐一名士兵；驻地为 central 或州 ID，无独立散件武器、战马、护甲库存 |

初始剧本为 34 国、43 州（本国 10 州与 33 个外国核心州）。叛乱可新增国家，但不新增州。全国人数、土地、建筑与存粮求和，民生及生活水平按人口加权；四类产量单位分别为石、头、两、件，禁止直接求和。地图几何、人物模板和美术素材属于静态定义，不是第二套进度。

## 业务子系统登记

| `domestic` 子系统 | 保存内容 | 必须保持的关系 |
| --- | --- | --- |
| `fiscalActions / countries[].ledger` | 财政政令回执、每旬实际现金流水 | 政令与流水用途不同；同一笔支出不能在下一旬再次收费 |
| `industryActions / province.development` | 产业开发、职业调配与下旬启用记录 | 每州产业队列独立于普通施工队列；新增面积依 effectiveTurn 参与产出 |
| `province.construction / buildingEffects` | 普通施工、建筑待启用与民生累积 | 已完工数量与当旬有效数量可能不同 |
| `foodRelief / province.foodRelief` | 购粮调粮历史、当旬额度、最近供粮快照 | 调粮双端守恒，快照为已结算事实，不随人口变化重算 |
| `disasters` | 种子、最近结算旬、祭祀期限、最多 200 条灾情 | 持续灾害阻止叠灾、冻结施工；不直接把地方损失当作国库损失 |
| `justice / personnel` | 官员身份与状态、制举名单、任职、委任、退职与隐藏人物 | 官职定义由 personnel.mjs 生成；在职人的数据以 justice.officials 为准 |
| `governance` | 全国治理预算、保留线、当旬实际支出与原因 | 自动委任在常规内政之后结算，须保留国库底线 |
| `stateDevelopment / province.civic` | 动态费用基线、年度人口、每三旬生活、民变、地方投资启用 | 基线不是当前库存；不存在散件军备基线字段 |
| `diplomacy / treatyObligations` | 无向国家对协议、贸易履约、贡银、军援请求 | 国家对 ID 排序；protector/protected 的方向依排序解释，不能交换后照搬 |
| `war / strategy / troopKits` | 战场、累计战绩、外国战役、真实兵装占用 | 出战占用不立刻扣库存；战后按来源核销伤亡与对应套装，禁止重复核销 |
| `collapse / province.occupation` | 京城存亡与普通州占领治理 | 京城需单独处理迁都/亡国，不能走普通州占领 |
| `specialWorks` | 全国单个特殊工程与进度 | 与普通施工、产业开发相互独立；完工后下一旬启用 |
| `royalFamily` | 宗室、婚姻与教育登记 | 亲生子女用 childId 关联 harem.children，外国公主用 consortId 关联后宫 |

官员 `personality` 当前有七类：repentant、fearful、staunch、resentful、steadfast、composed、pragmatic，实际囚禁反应由 `personality-rules.mjs` 定义。人物史料与评级元数据是说明信息，不能替代在职状态、兵籍或财政记录。

## 财政、查询与提交

- 唯一国库余额为 `country.fiscal.treasury`，`stats.treasury` 仅为镜像。
- `countrySummary / provinceBudget / outputFor / worldKitDepot` 为查询和适配入口，不另存一份全国总表。需要核对某旬的完工效益时必须传入旬序。
- `ledger` 最近 36 期，每期最多 100 笔明细；较早明细进入 carried，交易 key 保留至每期最多 4096 个。实际支付与新增欠款分开，详见[财政记账](finance-accounting.md)。
- `lastTurn`、命令 nextId、交易 key 和 saveRevision 分别用于业务结算、政令、防重复记账与内存候选版本控制，不能互相替代。
- `advance` 原地修改传入对象；界面必须在副本上调用后提交。`validateSave` 含初始化、兼容补值、镜像同步和终评生成，不是纯只读检查器。
- `persistCandidate` 对私有副本准备、校验、写盘，成功后发布。自动档双键写入带尽力回滚，不是数据库事务；saveRevision 不提供跨窗口原子锁。
- 灾害、祥瑞、炼丹进贡、巡游事件等使用确定性随机；修习、怀孕、部分皇室与制举等仍使用 Math.random。读档不会重复发已记录奖励，但重新执行未保存动作不保证同结果。

## 验证入口

`npm run test:types` 将新局、年度结算、工程、军务、出行、人物和两代终评等真实运行快照编译为 `satisfies` 类型断言，并检查过时字段与不支持版本不能通过编译。`npm test` 先运行数据契约检查，再执行全部业务单元测试。类型检查不能代替运行时的安全整数、范围、归属、守恒与重复执行校验。

## 平衡规则1的预算与供粮字段

`countrySummary.publicServiceCost`为繁荣公共服务费（两/旬），已计入`administration`，不能再叠加一次。`round(Σ各州 人口×0.0013×max(0,生活−50)/100)`。商业营业修正为`1+min(0.1,max(0,营业−基准)/600)`。新局本国`fiscal.otherIncome=400`，旧档保留原值。

供粮快照可选`storageLoss`为实际陈粮损耗（石），缺失视为0；当前预估的`protectedStock/protectedTurns/storageLoss`是查询结果，不反写历史。普通独寝与安寝至明不额外扣寿元；自然跨旬减1，过劳仍额外减30。

## 城州承载与共用土地（2026-10-19）

`domestic.capacityRulesVersion:1` 标识容量规则已初始化。`province.cityCapacity` 保存 `{version:1,land,population}`，分别为共用可开发亩数与正常人口容量。超载上限从正常容量×120%派生，不另存一份。四业已开发面积与新增开发预留共用 `land`；原行业 `capacityArea` 保留作生产公式基准。产业工程与完工启用记录可带 `fromIndustry`，表示等量转出土地，双方产出在同一启用旬切换。规则与兼容见[城州容量](city-capacity.md)。

## 产业用工与抽调来源

`industryLaborVersion:1` 与州级 `industryLabor:{version:1,base,pending}` 保存各业固定用工密度和启用旬招工任务。`manpowerVersion:1`、`manpower:{version:1,drafts}` 保存累计在役抽调来源，记录原籍州、当前驻地、原职业、soldiers/militia角色及人数。它们不是第二份兵籍，人数不得超过真实在役记录；调兵随营迁移，遣散/阵亡释放来源约束。见[产业用工与军役抽调](industry-manpower.md)。

## 地形经济（2026-10-19）

采用现有四类 `terrain`。新增 `domestic.terrainEconomyVersion:1`、各州 `terrainCapacity:{version:1,kind,landLimit,legacyLand,legacySectors}`。新局按地形设置土地共池和四业上限，保留初始化人口与75%劳动力比例。旧档既有用地、在建项目和人口均保留，迁移基线只登记一次；部分字段缺失或记录篡改不得重置上限。特色加成进入统一生产函数，不改税率及钱粮开支。详见[地形经济规则](terrain-economy.md)。

## 州县地理归类（2026-10-19）

新增 `domestic.geographyVersion:1`，43个现有州县与外国腹地集中配置。旧档先校验地形容量快照，再迁移 `terrain`；保留既有用地、在建项目、人口、职业、钱粮及实际流水，地形容量记录只更新未来上限及必要保留值。相同版本不重复迁移。详情见[州县地理归类](province-geography.md)。

### 当前四业资源单位

农业、牧业产出单位均为石，工业、商业均为两。资源新制粮食快照 `resourceSettlement.production.foodSources` 可包含 `agriculture`、`pastoral` 两项，各有 `base` 和 `produced`，分项最终产粮之和必须等于 `production.produced`。未含该字段的旧快照按当时单一农业产粮记录校验，不重算历史。
