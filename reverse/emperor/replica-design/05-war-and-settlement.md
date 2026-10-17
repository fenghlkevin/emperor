# 05　战争、谈判与战后结算实现契约

本章以 EMPEROR.EXE 为地址基准。A 是敌方/目标国及其援军，B 是玩家中央军/属地军及其援军；`Battle` 是原0x704字节战斗记录，`W` 是战场窗口，两者不可混用。地区指针 `R` 指完整337字节对象，含前2字节前缀。本章偏移不沿用旧报告的“R+2为字段基准”约定。

证据标签：**[D]** 原 DOS 函数或有明确入口/终点的机器码片段实测；**[S]** 静态指令及原数据表恢复；**[I]** 基于证据的解释；**[N]** 新实现建议。函数级[D]不等于从正常菜单至战后退出的整条流程[D]。本章读取到的第六轮资料已包含正常菜单/宫廷调度进入原战场构造的进展，未取得完整战后退出通过证据，不将端到端列为通过。

## 1. 模块边界与数据模型

建议实现下列接口，UI只能提交事件，不能直接改兵数、关系或链表。接口名和稳定ID属于[N]，输入输出语义依据后续原规则。

```ts
type Side = 'A' | 'B';
type EndReason = 0 | 1 | 2 | 3 | 4;
type EndState = { winner: Side, reason: EndReason };
type RuleMode = 'legacy' | 'modern';

createExpedition(world, request, rng, mode): Result<BattleCreated, RejectReason>
beginBattleRound(battle, board): RoundStarted
submitUnitOrder(battle, board, side, slot, order): Result<ActionPlan, RejectReason>
resolveContact(battle, board, contact, mode): DamageDelta
scoreAICandidate(battle, board, candidate, mode): CandidateScore
negotiate(battle, option, direction, rng): NegotiationDecision
applyNegotiation(world, battle, decision): WorldDelta
settleBattle(world, battle, endState, rng, mode): SettlementDelta
finishBattleStage(world, queue, battleId, endStateOrNull): ExitTransition
```

每个Delta需有变化前后值、随机种子前后值和语义事件；回放必须只消费原分支实际抽取的随机数。`settleBattle` 返回官员/库存/人口/领土/历史变化，`finishBattleStage` 负责队列及场景，UI动画不得重复执行结算。[N] 建议由一次事务提交，但须保留原程序的逻辑顺序用于差分；原版异常后可能部分提交，见第8节。

### 1.1 18字节单位记录

[S] A数组 `Battle+0x65`、B数组 `Battle+0x3CE`，各45槽、810字节。序列化必须显式 little-endian、packed、无宿主对齐；slot0是主将特殊槽，普通队循环通常为1..44。

|偏移|类型|字段与约束|
|---|---|---|
|0|u8|初始化/记录标志；保留原值，尚无稳定UI业务名|
|1|u8|兵种0/1/2；FF为空。刀/枪/马供应链支持对应关系，但直接中文兵种标签证据仍不足|
|2|u8|来源地区；30为中央特殊地区，FF常作空国别|
|3|u8|本轮行动状态：0可行动；>=128完成；80已完成，81守备完成 [D]|
|4|s16|当前兵员N；正常队1..100，空队以typeFF标记；不要用N=0替代空标记|
|6/8/10|s16|头盔/甲/盾数量|
|12|u8|训练；由地区训练word取低byte|
|13|s16|攻击缓存|
|15|s16|防御缓存；unaligned读写|
|17=11h|u8|特殊减伤遗留字节，**仅值1有效**；不是守备状态 [D]|

[D] 特殊字节90槽经原存读完整保留，包括AF/CF/DF。[S+D] 原初始化84210及普通建队849FF未清它；第五轮主动菜单、自动及援军建队路径保留预置A5，支持“未初始化堆遗留”而非一个已恢复业务特技。未发现正常主动赋1的业务来源，禁止命名为伏兵/火攻/地形。[N] 新建战斗统一置0；兼容读档保留所有原字节，导出可逆；若需要模拟原堆行为，作为独立调试选项并记录来源，不能称确定性原规则。

### 1.2 战斗与窗口最低字段

|位置|字段|用途|
|---|---|---|
|Battle+12h|localDefense u8|0非属地战，非0属地受袭；也用于停战方向|
|Battle+1Ah|阶段计数字段|6564E递增，不应直接当世界月份|
|Battle+5Dh|enemyCountry u8|A主国|
|Battle+5Fh/61h/63h|三类初始A兵数word|敌主国战后人口扣减基数|
|Battle+390h|localCountry u8|属地索引，非属地常为30|
|Battle+391h/393h|B/A阵营能力word|进入攻击公式，精确对应人物属性UI名未定|
|Battle+3C2h/3C4h/3C6h|初始本地三类兵数word|本地人口扣减基数|
|Battle+6FCh/6FEh|将领关联word|首将领、属地第二将领；不是永久官员ID|
|Battle+700h/702h|B/A聚合军力word|85A60重算|
|W+5Dh|Battle指针|运行窗口所有权关系；不导出宿主指针|
|W+80h/81h|winner/reason u8|0未结束；1=A胜、2=B胜；原因下表|
|W+11Ah|末属地失败标志u8|6668F设，6564E后续消费|

原因码[S]：0主将消灭、1撤退、2交出领土投降、3条件投降/停战、4普通队耗尽分支。原因3不能统一显示成赔款，必须另存具体协议。66607只扫描普通槽，当两边普通槽都空仍可给B胜/4，并不表示两边主将全灭。

## 2. 创建出征、编队及生命周期

### 2.1 正常主动创建契约

`request={targetCountry, regularUnits[], commanderId}`。前置条件[S]：有合法散官（职务77、状态非4），有非属地且关系非5目标；中央兵不等于皇帝预留兵E+AA，三类武器不全0。`4B6E8`禁用标志生命周期尚需UI链核实，不能把以上视为所有控件状态条件。请求兵装须在库存和对话框上下限内，不允许复刻UI省掉数据校验。[N] 重构为显式检查函数。

后置条件[S]：每队兵装从来源库存立即转出；slot0配置主将，普通队从slot1起；选将person.state=4；计数关联按第8节分配；目标战争状态5，友好度向零除2，贸易年数/额度/利润率/利润清0；威望减10，目标原关系非0再减20，下限0；原创建动作扣体力30并设置动作计时2，完整普通战后退出再扣50。创建末尾将Battle节点追加队尾，不能以创建成功等同立即进入战场。

[S] 正常战场入口要经过官员行动结束、主调度3行动推进阶段和宫廷事件扫描；当前行动进度不是0时可能需要正常完成下一行动。扫描事件1将head设current并排队，提示回调与主循环再构造场景23。完整原链见 [第六轮累计与调度证据](../validation-round6/reach/README.md)。[N] 复刻可用显式状态机 `Draft→Queued→Scheduled→BattleOpen`，每一步产生一次事件。

### 2.2 自动队伍分配

[S] 原84F54分配器以word结果 `Q=min(刀+枪+马,4500)` 为分母。兵员>N容量时会使用三类库存作为出战量并清库；该分支只钳Q、不再次钳异常库存。否则先限制兵员4500，三类按 `T(N*stock_i/Q)` 分配并扣库，余数按刀→枪→马轮补。每100人为一普通队，容量45槽需结合slot0分别处理，不能把4500称全程序统一上限。

外援按人口×动员率/100，敌军辅助生成85273还包含随机20%区间减半、20%区间减至四分之一、再上限4400并均分三类。该随机生成流程应按原汇编逐分支移植，不能用一个均匀随机人数替代。[S] 装备逐队 `min(stock,N)` 扣库，先队优先；部分援军装备计数0、防御直接复制地区预置值，不能套用中央满装公式。

## 3. 回合、动作、战场AI

[S+D] `beginBattleRound` 对普通队行动状态清0；已完成判定为`u8>=128`，并非`==128`。命令菜单确实只有3项：返回0“進攻”、1“守備”、2“退後”；原WINDOW.PIC第92块为横排三列竖排两字，右进攻、中守备、左退后。

`submitUnitOrder`前置：slot有效、非空、属于当前侧、未完成、非待动画状态；后置：进攻/后退产生路线计划，动作结束写80；守备立即写81，不改变special17。后撤普通队2格、type2为3格，列边界1..9；仍需棋盘可达性，不是无视占位瞬移。前进/后退接敌都进入592B9/59437交战链。[S] 计时器按W+8B选择B进/退、A进/退路线步进器；应把路线和交战动画分离，但只在原接触时刻扣兵。

AI独立接口必须有输入board、候选起终位置、双方slot和行动侧，输出`s16 score`及候选次序，不以函数EAX为得分。原62905写 `W+8Ch+row*22+x*2`。[D] 一组1000兵、B攻击1000/A500、防御0、工事0的同槽候选：防守A特殊值0/2/255得49，1得43；只改进攻B特殊字节为1仍49。

[S] AI与实际损失存在已定位差异：AI原始损失不钳非负；把工事/special缩放到双方预测；相克表在保护逻辑前后各乘一次；62C69一处B兵数索引使用A槽号，后面又改B槽号。**不得用实际伤害函数直接替换legacy AI。** 未完整恢复最终评分的全部位置项与平分优先级，复刻发布前应按 [ai_battle.asm](../rules-analysis/war-diplomacy/ai_battle.asm) 逐指令移植并补不同slot/坐标黄金例；当前49/43只覆盖一个候选，不证明整个AI策略等价。[N] modern模式可复用真实伤害预测并修正索引，但应明确模式改变。

## 4. 数值及真实接触损失

`T(a/b)`为有符号向零取整；`s16/u16/u8`在原赋值点截断。正常范围公式如下[S]，局部DOS伤害及AI差分见[D]矩阵；不承诺所有修改器溢出输入。不要把连续整数除法合成浮点再round。

```text
attack = 250 + T(12*N*(100 + T(training*100/30)
                              + T(sideAbility*100/240))/1000)
centralOrLocalDefense = T((25*helmet + 45*armor + 30*shield)/N)
power(side) = u16(sum_over_nonempty_slots(
    T(N*(50 + training + defense)/50)))   # 每项累加word截断
r = s16(1000 if powerB==0 else T(100*powerA/powerB))
```

攻击来自85942，防御85BAC，军力85A60。[N] 防御函数N=0返回错误而非除零；legacy需限定有效非空队N>0并保留异常输入诊断，不能默默把除数0改1。单位被扣兵后攻击/防御缓存的重算时机需保持原调用链，不从缓存字段存在推断永远固定。

实际损失59437基本算法：

```text
la = max(0,T((10*b.attack - 25*a.defense)/130))
lb = max(0,T((10*a.attack - 25*b.defense)/130))
C = 500 - battlefieldRegion.fortificationRaw  # 完整R+13Ch
S = 85 if attackedUnit.special17==1 else 100
if acting_side==1: la=T(C*la*S/50000)   # 行动侧编码按原函数，防守A减损
else:              lb=T(C*lb*S/50000)   # 防守B减损
if slotA!=0 and slotB!=0:
    la=T(la*M[typeA][typeB]/100)
    lb=T(lb*M[typeB][typeA]/100)
deadA=(la>=a.N); deadB=(lb>=b.N)
overA=T((la-a.N)/3) if deadA else 0
overB=T((lb-b.N)/3) if deadB else 0
la=min(la,a.N); lb=min(lb,b.N)
if deadA and not deadB: lb=max(0,lb-overA)
if deadB and not deadA: la=max(0,la-overB)
a.N-=la; b.N-=lb
```

工事地区选择随localDefense分支；它不是通用双方防御倍率。相克表`M`保留原非对称项：

|损失方\施伤方|0|1|2|
|---|---:|---:|---:|
|0|100|75|115|
|1|115|100|75|
|2|100|115|75|

不能擅自把type2同型75改100。两边都拟消灭时直接双灭，不触发单方过量伤害保护。主将槽接敌跳过普通兵种相克。

## 5. 招降和停战的纯判定接口

输入包括重算军力、option、localDefense方向及32位seed；输出 `{success, protocol, endState?, seedAfter, rolls[]}`。失败分支不修改领土/资金；成功协议的副作用在单独apply函数执行一次。

[D] 原PRNG与8A7FE：

```text
seed=u32(seed*0x41C64E6D+0x3039)
roll=((seed>>16)&0x7FFF)%100
success = roll < s16(threshold)
```

即使threshold<=0或>=100，只要调用gate仍消费一次；外层直接成功/失败不消费。roll有取模偏差：0..67各328种15位原值、68..99各327种；不要用现代uniform(0,99)声称确定性兼容。

### 5.1 玩家向敌招降

|option|外层条件|gate阈值|成功结局|
|---|---|---|---|
|0割地|r<75|T((75-r)/2)|B胜/2|
|1藩属|r<100|100-r|B胜/3，关系协议|
|2赔款|总成功|不抽|B胜/3，收入=敌人口×10|

[D] r72/73割地阈值均1；r74阈值0仍抽，r75直接失败不抽。r99藩属阈值1，r100不抽失败。敌主动招降的r<=100直接选赔款；r>100先gate(T((r-100)/4))选割地，失败再相同阈值抽藩属，均失败赔款；连续两骰共享seed，不能假设独立重新播种。

### 5.2 七选项停战

|option|方向0|方向非0|
|---|---|---|
|0无条件|r<100直接成功|同左|
|1互不侵犯|r<75直接成功|失败|
|2防御同盟|r<90直接成功|失败|
|3敌藩属|r<75时gate(2*(75-r))|失败|
|4敌赔款|r<90时gate(2*(100-r))|失败|
|5我贡金|直接成功|r<=110直接成功；111..199 gate(220-r)；>=200 gate20|
|6我藩属|同5|同5|

[D] 111..120实际抽签但必成功，110不抽；r121阈值99、199阈值21、200阈值20。阈值传参也s16，极端比例为负时不能用“概率夹到100”代替原溢出。

成功停战W= A胜/3，清战争状态；1双向1/1，2双向2/2，3双向3/4，6双向4/3且E+2C0减1；4收人口×2，5付50000。收入写资金E+45与收入E+4D，支出写资金与E+71。称臣具体方向以协议两端国家显式表达，避免`relation=3`丢失方向。普通招降/停战结果及seed边界有152主体与73消费补测[D]；完整弹窗成功副作用并未据此全称端到端通过。

## 6. 完整结算契约

前置：endState非未结束；真实官员关联、地区关系对象和历史管理器已初始化；未重复settled；兵员初始总数与队伍国别有效。输出包括兵装归还、人口扣减、官员状态/删除、外交、领土与历史。原函数6668F处理这些业务，不负责释放战斗队列。[N] 业务模块不应持有W指针，转为EndState与Battle参数。

### 6.1 原先后顺序

|结局|先执行人口/回库函数|
|---|---|
|A胜/0|67E9D外援损失；不归还B兵装|
|B胜/0|6775F归B兵装→67D9E敌主国人口|
|reason非0|67E9D→6775F→67D9E|

随后查找两将领；reason1/3/4恢复状态（非属地0，属地恢复R+4低byte）；清地方战争状态，敌主国仍5则清0；再按胜方与原因执行吞并/失败表，最后按官职排序。清战争状态不会恢复已清的贸易额度。

### 6.2 兵装回库与人口

6775F只遍历B普通槽1..44，处理country30中央、country=local本地。Q=80仅A胜/撤退1，其余Q100。总返兵先按两类总数 `T(total*Q/100)`；每队武器/头盔/甲/盾分别 `T(item*Q/100)` 后求和，尾数不等价。

```text
newTraining = min(100,T((oldN*oldTraining
                  + returnedN*min(100,lastMatchingUnitTraining+10))
                  /(oldN+returnedN)))
```

分母0训练置0；训练取最后匹配队而非各队加权平均。中央库存是country30特殊地区，本地回库仅localDefense非0。本地人口减“本地初始三类兵数合计−本地返兵”；敌主国人口减“初始A三类合计−A同主国生还”，B胜/敌撤退1时该生还总数再乘80%。A武器没有对称回库。

67E9D援军损失按每匹配槽`100-currentN`累加而非`initialN-currentN`；非属地统计A除主国，属地统计B除本地与30，前置A国别FF检查是原实现细节。[D] 援军只剩15仍扣85人口已验证，复刻不能“修正”为未满百初队人数。归队正常、撤退与两队1+4尾数差有原函数[D]。

### 6.3 吞并与丢地

B胜且reason0/2→吞并；B胜1/3/4不吞并。A胜0/2→删除官员，属地战再丢地；A胜1/3/4不丢地。

吞并：E属地数+1；目标R+2/R+4置1，R+BF置1；按人口×四职业比例/100重建职业人口及职业合计，兵员按动员率；自动选派/生成地方文武官；生产基率每项加`rand()%10−5`，范围[-5,+4]；按年龄>20建设追加并重算生产；目标与30国双向关系清0，历史事件16h。[D] 人口10000、比例40/20/10/10、动员5得到职业4000/2000/1000/1000及兵500。

非属地失败：删除一名关联官员payload与双链节点。属地失败：先属地数−1，0时W+11A=1、历史胜国=侵略者；地方统治/职级/BF清0；侵略国→本地4、本地→侵略国3、侵略国对中国0、本地对中国6（以第四轮深测修正早期报告方向误述）；重建外国驻军；删两名官员；友好度向零除2；匹配投资项标100、扣E+96金额并原压缩队列；清灾害/饥荒/阶段累计，生产乘数恢复1.0，重算地区并记历史。[D] 两名合法关联40→38、负友好−5→−2、投资/灾害清理已测。不能只验证所有权就称整结算一致。

## 7. 战斗队列及战后退出

[S+D局部] 原队列8字节单链节点`[Battle*,next]`，head=CC5E0、current=CC5E8；官员则12字节双链`[payload,prev,next]`，不得混用删除函数。原6564E流程：阶段计数++→真实子窗口析构→6441B→若winner非0完整6668F→一般分支释放current.payload再current节点、修head/prev/current→扣体力50→还有下一战且条件允许则65CCA初始化→否则回上层场景并恢复控件。

[D] 头/中/尾/单节点删除原片段均捕获实际两个free参数。最后属地分支W11A=1跳过正常摘链，设置体力0、E+F=80h、E+10=0；实际片段已核对链保留，但后续游戏结束全场景销毁尚未全部验证。复刻[N] 终局时显式清队列、幂等销毁；legacy快照需能展示原“此阶段保留节点”，无需在安全语言中制造内存泄漏。

UI驱动的重要契约[S]：已显示提示必须经过原提示事件3039C，先清shown/移除窗口再通知owner；直接调用4967E跳过前处理是第五轮受控异常的具体原因候选，不能当作正常游戏bug。正常菜单、国家、兵装、选将应调用各控件事件以同步输入和选中人，不能把owner回调参数77误当按钮数组下标。[N] 重构UI使用事件队列，窗口销毁与业务事务各一次；模型测试与完整UI验收分开。

## 8. 255/256错误兼容与正常累计

[S+D] counter为持久u16；主动出征分配一次，属地受袭分配武官/文官两次；官员只存low8，Battle保留word。结算以s16(BattleWord)比较zeroExtend(personByte)，且不检查官职/出战状态。结算不清旧关联byte、不减少counter。

```text
assign(person,battleField):
    person.state=4
    person.associationByte=u8(counter)
    battleField=u16(counter)
    counter=u16(counter+1)
lookupOriginal(word): first officer in chain where u8(person.byte0)==s16(word)
```

从c0开始`counter=u16(c0+A+2D)`；0开始第256次分配取255，第257次取256，不需同时256战斗或官员。退却/金钱停战后同目标关系5清0且不吞并，允许重复；库存、体力、行动计时、金钱和随机事件仍制约完整自然路线。已证明代码累计和重复路径，未完成未改档自然开局257次全菜单实玩。

[D] 第五轮255匹配另一FF官员而真将仍4；256恢复分支读DOS线性0后向0xF000CA62写0，完整6668F仍返回。第六轮独立夹具结果还包括：吞并255/256、非属地失败255/256、属地254/255、255/256、256/257均原函数返回；255失败删除无关官，local254/255删两人但第二错配，local255/256只少一名无关官，local256/257未少真实官，两真将仍4。[D边界] 这些是受控关联配置+完整原结算，不是自然菜单走至该计数；函数返回不表示allocator/低内存无损坏。

[N] 两种明确模式：

- **legacy**：保留u16 counter/u8旧关联和原first-match选择，返回可审计`AssociationCollision`或`AssociationMissing`。可在影子模型显示原会错改/删谁；缺失匹配时停止提交并报告原非法内存操作，不能在宿主进程读写0或重现任意free。此项是安全边界，非逐内存破坏等价。
- **modern**：稳定OfficerId+BattleId关联，创建/加载时建立映射，宽度足够且唯一；结算必须两关联均存在且属于本战，删除/恢复幂等。旧档255歧义不能仅用byte猜；按slot0国别/将领职务/状态交叉校验，若仍多解交由兼容导入策略显式选择，保留原raw bytes。禁止静默把256取模0后认为修复。

验收modern连续至少65537次关联分配，无复用错配；同场双将关联必须不同，删除前先验证两者不同且存在。[N] 原始导出仍写格式规定word/byte并给出不可无损表达新稳定ID的说明，内部稳定ID用旁车版本化存档。

## 9. 验收矩阵与剩余阻断项

|范围|输入/边界|必须输出|现有证据与复刻验收要求|
|---|---|---|---|
|序列化|90槽各18字节、特殊0/1/2/255|原始字节可逆、两810块位置正确|[D] 原存读；新实现需逐字节roundtrip|
|行动|0/1/127、128/129/255|前三未完成、后三完成|[D] 12例；守81不写special|
|伤害|双方行动、special0/1/2/255、工事、slot0、相克全9项、单灭/双灭|每一步截断、兵数及空槽变化|[S] 全式，[D] 特殊缩放局部；全矩阵仍需原黄金例|
|AI|防守special变化、A/B不同slot、负raw、平分|score内存与选定路线|[D]49/43小场景；完整位置项/平分仍待核实|
|谈判|r72/73/74/75、99/100、110/111/120/121/199/200、PB0、s16溢出|结果+准确seed消费|[D] 审计主体152、seed73及PB0；不把1111静态预测计动态|
|回库|正常/撤退、每队1+4、不同训练、中央/地方/援军|总返兵与逐队装备尾数、训练最后匹配队|[D]6775F/67E9D；未匹配训练原栈边界仍待核实|
|领土|胜0/2、败0/2、非最后/最后|人口、关系、官员链、投资与历史|[D] 完整6668F多例；新实现逐字段diff|
|异常关联|255、256、local254/255、255/256、256/257|错配/缺失及部分变化审计|[D]受控原结算；宿主禁止非法free|
|队列|头/中/尾/单、末属地|两次free、保留/推进与游戏终态|[D]连续片段；完整UI析构/退出不据此通过|
|全流程|正常菜单输入→选将→阶段事件→真实战场→谈判或交战→消息→退出→再次同国出征|官员/库存/seed/时间/队列/窗口均一致|尚未取得整链通过证据，需保持阻断项|

交付复刻前还需：AI全部评分/路线平分黄金例；主将能力与工事精确中文标签；自动军队随机分支全样本；完整退出和下一战GUI生命周期；自然计数边界资源/寿命可达路线。未知字段继续保留raw，不用营销化“计谋”名称补洞。

## 10. 可复用证据

- [战争公式与汇编索引](../rules-analysis/war-diplomacy/README.md)、[可执行正常范围公式](../rules-analysis/war-diplomacy/formulas.py)：旧报告的action-state、AI返回位置等错误以第四轮订正为准。
- [特殊标记/动作](../validation-round4/unit-flags/README.md)、[谈判边界](../validation-round4/negotiation/README.md)、[第四轮DOS审计](../validation-round4/runtime/README.md)。
- [战后库存/人口](../validation-round3/postwar/README.md)、[第四轮领土与官员](../validation-round4/territory/README.md)：关系方向及随机[-5,+4]以较新实测为准。
- [第五轮标记来源](../validation-round5/flag-origin/README.md)、[关联累计](../validation-round5/association-reach/README.md)、[第六轮控件入口](../validation-round6/callback/README.md)、[分支地图](../validation-round6/branches/README.md)。
- 第六轮受控完整结算原始结果：[annex255](../validation-round6/runtime/annex255/result.json)、[annex256](../validation-round6/runtime/annex256/result.json)、[defeat255](../validation-round6/runtime/defeat255/result.json)、[defeat256](../validation-round6/runtime/defeat256/result.json)、[local254](../validation-round6/runtime/local254/result.json)、[local255](../validation-round6/runtime/local255/result.json)、[local256](../validation-round6/runtime/local256/result.json)。
