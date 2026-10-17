# 06 界面状态机与事件契约

本章用于实现可运行的功能复刻，区分三种内容：**原程序证据**是地址及实际 DOS 记录支持的行为；**复刻设计**是为实现模块解耦提出的接口；**待验收**表示尚未用完整正常输入链核实。地址采用 EMPEROR 重定位静态 VA，不是 DOS 运行时线性地址。对象偏移与地址均为十六进制；仅含十进制数字的状态/数值按十进制解释，FF/FE为十六进制状态。

## 6.1 已验证范围与交付边界

第六轮 `runtime/flow2` 已通过原控件事件完成出征、兵员同步、合法将领选择、战斗追加，并经过结束官员行动、宫廷时间/事件链进入真实战场构造。这里的“原控件事件”指在 DOS 中调用真实控件入口，使用受控事件状态及编辑框值；并非每一步均由物理鼠标键盘完成。CUA 点击返回 `noWindowsAvailable`，不能宣称整套界面实点验收通过。

战场构造与原战后结算分别已有动态证据，但**从同一正常出征操作连续到战后退出、返回可操作上层的全链仍未完整连通**。本章给出有静态证据的退出设计与验收条件，不把这些条件写成已完成结果。

证据入口：

- [第五轮菜单/场景路线](../validation-round5/menu-flow/README.md)：主循环、场景构造、战场进入及退出地址。
- [第六轮原控件记录](../validation-round6/runtime/flow2/menus.json)：逐步骤状态、对象、计数及战斗链。
- [第六轮消息入口修正](../validation-round6/runtime/flow2/finish_message.py)：最终摘要经真实子控件事件后才能关闭。
- [第六轮宫廷与时间路线](../validation-round6/reach/README.md)：行动结束、阶段推进、宫廷扫描及战斗排队。
- [第六轮异常静态定位](../validation-round6/callback/README.md)：受控回调遗漏的生命周期步骤及限制。

## 6.2 必须分开的状态与对象

|原对象/状态|已知位置|作用|复刻模型|
|---|---|---|---|
|应用 A|global C98D8|运行永久主循环101EC|ApplicationController|
|保存控制器 C|global C9920|读档待恢复标志word0、加载场景word2|LoadCoordinator|
|皇帝 E|global C98AC|体力、健康、寿命等业务状态|EmperorState|
|顶层行动/场景|A.word2|如宫廷0、官员11|ApplicationScene enum|
|场景管理器 S|嵌入 A+8|调度子窗口3D82A|SceneRouter|
|战争管理 Wd|S+14|场景7的出征菜单，495EE构造|DeploymentController|
|战场 Wb|S+3C，即A+44|场景23，5C1B6构造|BattleController|
|官员界面|global CC5A0|官员列表及实际背景/绘图资源|OfficialsScreen|
|宫廷 P|global CC588|序列扫描、等待选择、行动返回|PalaceController|
|底部行动条 F|global CC598|结束当前行动与确认|ActionBarController|
|战斗队列/当前节点|CC5E0 / CC5E8|持久战斗链与正在处理战斗|BattleQueue / currentBattleId|

保存控制器的场景、应用当前场景、场景管理器的子窗口编号互不等价。例如 A.scene=11 下可以显示战争子窗口7或战场23。不能把载入 C+2 的数值直接当当前活窗口，更不能以 C+8 替代 S。

官员界面是出征菜单的真实先决条件：4967E 的首次出征选择会调用2DEC8(CC5A0,7)，后者重建、绘制官员列表。复刻实现应使用数据服务标记官员行动状态，并以事件刷新界面，避免业务函数必须解引用某个正在显示的背景对象。

## 6.3 输入分层

复刻的输入流分四层，测试应明确记录覆盖哪一层：

1. 设备输入：鼠标移动/新按下/释放、键盘确认/取消。
2. 控件输入：某按钮被激活、某数值编辑完成。
3. 页面意图：选择出征、提交兵员、选将、确认停战。
4. 业务事件：部队已创建、时间阶段已推进、战斗已结算。

原鼠标轮询1A5A2读取INT33 AX=3，raw新左键按下=2、持续按下=8、释放=4、默认移动=1。1D638转成type2/4/3/1；1C2E4将类型写事件word+10，坐标自+12复制，另有目标/转发指针+26。宫廷等待选择使用的是**新按下type2**，持续按下不能当作多个独立确认。这里的偏移不是复刻公共事件ABI。

推荐公共输入结构：

```text
InputEvent { kind, pointerPosition?, button?, key?, targetViewId?, sequence }
ControlEvent { viewId, controlId, kind, value?, generation, sequence }
```

`viewId`与`generation`用于拒绝已关闭窗口的迟到事件；`sequence`用于防止同一确认被处理两次。来源地址、职务字节、数组下标均不得直接作为稳定业务主键。

## 6.4 宫廷与官员行动状态机

宫廷原状态有序列号P+69、主状态P+50、子结果P+51、悬停行动P+16，复刻可采用明确枚举，不要求复制这些偏移。

|当前状态|输入/条件|动作|后续状态|证据|
|---|---|---|---|---|
|PalaceSequence|序列5进入事件扫描|7F454→7F871按当前行动进度扫描候选|等待事件提示或继续扫描|31948、3251C、7F887|
|PalaceSequence|进度0且出征事件匹配|current=head，追加战斗队列标识1|等待宫廷提示|7F8DF、7F918|
|PalaceSequence|序列6、进度0、head非空|P+52创建消息2CF，行动选择置11|AwaitBattleNotice|32564..32608|
|AwaitBattleNotice|提示完成|P+51=101，状态3返回行动11|OfficialsEntering|334C0、33192|
|PalaceAwaitChoice|新左键按下且热点可用|由四张位平面计算热点，校验时段|执行选择行动|33366、328A6|
|PalaceAwaitChoice|选择休息3|进入正常休息规则|ActionCompleting|3296C→328F2|
|PalaceAwaitChoice|选择8或9但进度不是1|拒绝该行动|PalaceAwaitChoice|宫廷分支静态证据|
|OfficialsActive|底条结束按钮|构造确认框，F+34=3|AwaitActionEndConfirm|7E201|
|AwaitActionEndConfirm|确认|CC59C=2；销毁官员画面；调用117E7→11F7D|PalaceEntering|7DE8F、7E0D5|
|OfficialsEntering|官员构造完成且队列游标项非零|3D82A(S,23)|BattleEntering|10970、10A74、112DB..11320|

时间不是“每选一次部队动作就一年”：11F7D以三行动推进一阶段；场景11/7基础耗时1，战场23基础耗时0。某出征确认时若进度已到1，结束官员行动只到2；还需正常行动推进到0后，宫廷事件1才匹配。不得在复刻调度中将“创建战斗”等同于立即显示战场。

复刻调度伪代码：

```text
on ActionEndConfirmed:
    closeActionViews()
    timeService.completeAction(currentAction)
    sceneRouter.enter(Palace)

on PalaceSequenceStep:
    for event in eventScanner.eligibleAt(time.actionProgress):
        handleEvent(event)
    if battleQueue.hasPending() and palaceBattleNoticeConfirmed:
        sceneRouter.enter(Officials)

on OfficialsReady:
    if battleQueue.dispatchCursorHasEntry():
        sceneRouter.openChild(Battle, battleQueue.currentId)
```

事件扫描产生“待处理战斗”，场景路由消费它；两个模块不各自创建一份battle。扫描期间的事件提示须按顺序完成，不能跨过消息直接改scene。

## 6.5 出征状态机

`Wd.state`对应原Wd+0C；同一数值可能因活子控件不同表示不同子步骤。复刻应采用枚举细分，保留原值作调试映射。

|复刻状态|原值/活控件|输入|动作与目标状态|
|---|---|---|---|
|DeploymentMenu|初始菜单Wd+10|选择菜单索引0|标记兵部官员行动，关闭菜单，显示说明；进入SelectTargetIntro（1）|
|SelectTargetIntro|1，Wd+8消息|说明完成|构造国家选择Wd+28|
|SelectTarget|1，Wd+28|合法国家按钮|保存targetCountry，关闭选择器，state=2，显示确认消息|
|TargetConfirmed|2，Wd+8|消息完成|构造兵员编辑Wd+1C|
|EditUnit|2，Wd+1C|提交合法兵员|首次分配8字节节点与0x704战斗，84210初始化；追加一队，关闭兵员，显示摘要，state=4|
|UnitSummary|4，Wd+8|摘要完成|打开继续增兵确认Wd+14|
|MoreUnits|4，Wd+14|继续且库存满足|重开兵员编辑；原有battle与已录入单位保留|
|MoreUnits|4，Wd+14|结束增兵|构造将领选择Wd+3E，state=6，显示选将说明|
|ChooseCommander|6，Wd+3E|合法显示将领按钮|原控件选择真实官员，写关联；初始化并追加战斗链，state=FF，显示最终摘要|
|DeploymentCommitted|FF，Wd+8|摘要内部确认控件事件|经30207后调用owner；state=FE，显示返回提示|
|ReturnNotice|FE，Wd+8|提示完成|重建战争菜单|
|DeploymentMenu|FE，Wd+10|关闭菜单FF|关闭战争子窗，保留已追加战斗，返回官员行动|

最后摘要与一般提示不同。flow2直接调用3039C两次时state仍FF；通过`30207(message, message.child16)`才进入FE。复刻不得以“所有消息的确定都调用同一owner回调”替代控件内部状态机。

提交事务伪代码：

```text
on TroopDraftSubmitted(draft):
    validateAgainstStock(draft)
    if deploymentDraft.battle is absent:
        deploymentDraft.battle = battleFactory.createDraft(targetCountry)
    reserveAndAddUnit(deploymentDraft, draft)
    showUnitSummary()

on CommanderChosen(stablePersonId):
    require eligible(stablePersonId)
    transaction:
        reserveCommander(stablePersonId)
        allocateAssociationAccordingToCompatibilityMode()
        initializeBattle(deploymentDraft)
        battleQueue.appendOnce(deploymentDraft.battle)
        applyCreationCosts()
    showFinalSummary()
```

原创建结束经38C10(E,7,0,FF,0)扣体力30并设置计时2；正常战后退出另扣50。复刻界面可显示预计消耗，但业务扣费必须由服务执行一次，不能在消息关闭和队列追加各扣一次。原非初始化字节及关联255/256缺陷属于兼容策略，UI不得默默修复后仍声称逐字节一致。

## 6.6 控件事件适配表

下列为调试/兼容适配器依据；新实现以语义事件对外，不暴露裸指针。

|控件|原入口|如何选择|语义事件|
|---|---|---|---|
|普通菜单|86468(menu,button)|按钮+A+4*i；关闭按钮+26映射FF|MenuChoiceSelected(index) / MenuClosed|
|国家选择|2A987(selector,button)|按钮+46+4*i；国家映射字节+A+i；数目+C6|TargetCountryChosen(countryId)|
|兵员编辑|27396(dialog,button)|确认按钮+1A；四编辑子对象+A/E/12/16的+43；防御+1E、兵种+20|TroopDraftSubmitted(draft)|
|继续增兵确认|flow2原23C34(confirm,button)|flow2选择confirm+A，得到结束增兵分支|MoreUnitsChoice(false)|
|选将|71E07(picker,button)|按钮+4A+4*i；显示数+B2；模式+B0|CommanderChosen(personId)|
|普通提示完成|3039C(message)|提示事件状态+6；内部处理shown及窗口移除|MessageCompleted(messageId)|
|最终摘要子控件|30207(message,child)|flow2 child=message+16所指对象|FinalDeploymentSummaryConfirmed|

必须按活控件实际虚表分派。第五轮曾按另一确认类291A7研究得到“只有确认1”；flow2的继续增兵确认实际经23C34返回结束分支，不能把一个类的按钮布局套给所有确认框。

选将回传的77是官员职务byte1，不是picker第77个按钮。模式1会过滤state4及特定职务，模式2按链位置；控件必须返回真实官员身份，业务层再进行资格校验。

## 6.7 战场状态机与退出顺序

|状态|输入/条件|原行为|复刻要求与验证级别|
|---|---|---|---|
|BattleEntering|主调度消费队列|5C1B6构造0x11E对象，65CCA绑定当前battle|flow2已到真实构造；使用队列中的同一battle|
|AwaitFormationConfirm|Wd与Wb不可混用；Wb+20事件|5CD22→58350创建Wb+3B，5A76C创建Wb+43|必须完成本步骤后才允许退出析构；全链待验收|
|BattleActive|单位进攻/守备/退后|推进战斗规则与动作标记|行动状态独立于特殊减损字节；本章不重定义战斗公式|
|BattleEnding|撤退/投降/停战/胜败条件|生成结束理由及消息|业务服务产出BattleOutcome，界面仅展示|
|AwaitEndNotice|Wb.state=15或17，消息完成|5DCA9→5DCD1→6564E|同一出征链连续退出尚待完成|
|NextBattleDecision|Wb.state=13或14|5DC28继续/切下一战|不得误当最终结算入口|
|Settlement|Wb+80非0|6668F执行战后结算|已有独立完整原函数测试，非UI全链通过|
|BattleDisposal|正常非末属地失败|free battle与8字节node，体力-50|分别释放一次，队列前后/单节点均验收|
|DispatchNext|存在下一战且体力非0|65CCA加载下一场|不得先销毁共享上层资源|
|ReturnToUpper|无下一场或体力耗尽|68031(Wb,7)、2DDAC/2D806/7E613|必须返回可操作官员/上层界面才算成功|
|LastTerritoryLost|Wb+11A判断末属地|设E+19=0、E+F=80、E+10=0，跳过正常清链|作为独立结束状态；不能套常规清队列规则|

复刻建议将原6564E拆成有顺序的可追踪步骤：

```text
finishBattle(outcome):
    require battleUi.phase >= FormationConfirmed
    disableBattleInput()
    closeBattleChildViewsOnce()
    clearTransientBattleState()
    if outcome.requiresSettlement:
        settlementService.applyOnce(battleId, outcome)
    if outcome.isLastTerritoryLoss:
        transitionToGameEnding(legacyPreservedQueuePolicy)
        return
    battleQueue.removeAndDisposeCurrentOnce()
    emperorService.chargePostwarStamina(50)
    if battleQueue.hasNext() and emperor.stamina != 0:
        enterNextBattle()
    else:
        refreshOfficialsAndEnableActionBar()
        sceneRouter.closeChild(Battle)
```

原代码在退出中无条件访问真实子窗口；“构造一个全零Wb直接调用退出”不是有效验收。新实现可用显式phase及可空句柄保护，但应保留行为兼容测试与健壮性测试的区别。

## 6.8 生命周期及模块事件契约

推荐模块边界如下，属于复刻设计：

|生产者→消费者|事件/命令|负载|处理约束|
|---|---|---|---|
|DeploymentView→DeploymentService|SubmitTroopDraft|draftId、类型、兵数、兵装、防御|服务按当前库存再次校验|
|CommanderPicker→DeploymentService|ChooseCommander|draftId、personId|拒绝已出战/不可选官员，禁止依赖显示索引|
|DeploymentService→BattleQueue|CommitBattle|battleId、association、参与者、目标|幂等追加；确认消息不再追加|
|ActionBar→TurnService|CompleteAction|actionId、确认序号|每行动仅推进一次时间|
|PalaceEventService→BattleDispatcher|BattleAvailable|battleId、事件序号|保持原事件顺序与游标|
|BattleRules→BattleView|OutcomeProduced|battleId、reason、settlementInputs|界面不随机重算结果|
|BattleView→SettlementService|AcknowledgeOutcome|battleId、outcomeId|只触发已经冻结的结果|
|SettlementService→SceneRouter|BattleFinished|battleId、nextBattleId?、gameEnding?|数据完成后再刷新/切换|
|WindowManager→页面控制器|ChildClosed|viewId、generation、result|窗口移除及焦点恢复完成后投递|

窗口关闭需要唯一所有者：撤销输入订阅→从显示/焦点链移除→标记closed→投递一次结果→延迟释放对象。新窗口可能在结果处理期间创建，因此旧窗口关闭后不能无条件把“当前窗口”设空。将ChildClosed排队到当前事件处理结束后，可避免递归回调中的对象替换问题。

原程序有提示+58 shown、+A真实窗口、+12 owner、+47消息槽、+6事件状态、+8返回码。它们不是同一“窗口是否存在”的标志。复刻可拆为`MessageModel`、`WindowHandle`、`CompletionPromise`，保存档只保存业务状态和必要的重建场景，不能序列化窗口地址。

## 6.9 DOS/4GW异常的证据边界

静态确定的是：直接owner回调遗漏3039C/30207的正常前处理；stateFF关闭会经3E245→307D2，后者根据shown决定是否再从窗口链移除，然后访问窗口虚表。flow2改用真实提示/子按钮事件后，完成了第五轮失败处的FF→FE→菜单退出，并继续进入战场构造。这支持“驱动入口与控件生命周期不一致”是测试异常的重要原因。

目前不能写成已确定的事实：所有异常都来自同一指令、原正常游戏必然释放后使用、固定合成栈已被证明安全、DOSBox有确定缺陷。历史retry协议开头已经处于实模式错误循环；旧LOGCPU尾部只含绘图，不足以定位首条非法指令。新驱动运行成功不等于完成所有异常原因的排他证明。

功能复刻不应复制调试合成栈。所有窗口操作由事件循环发出，存活判断使用句柄与generation，业务服务不通过界面虚表找官员/战斗对象。

## 6.10 验收用例

|编号|前置与操作|必须检查的结果|当前原程序证据|
|---|---|---|---|
|UI-01|从宫廷进入官员，再开军事子菜单|A.scene11、S.child7、官员对象有效，返回后可操作|构造/控件链已有；全物理点击未完成|
|UI-02|选择合法目标、一队兵、合法显示主将|一次关联分配、一次链尾追加；库存与体力只扣一次|flow2已通过受控原控件链|
|UI-03|最终摘要反复发相同确认事件|只追加一次battle；FF→FE→菜单；迟到旧事件无效|flow2单次链已通过；幂等策略属复刻验收|
|UI-04|从进度1创建出征并结束官员行动|先到进度2；正常再行动到0后才扫描、排队、构造战场|flow2与reach支持；不能直接改日期|
|UI-05|战场开战确认后停战，再确认结局|完整结算、释放当前数据及节点、扣50、回到可操作上层|同一条UI全链待完成|
|UI-06|队列含两场且体力足够/不足各一例|足够进入下一战；不足返回上层，剩余队列与游标正确|静态路线与独立函数证据，连通待验收|
|UI-07|吞并、属地败退、丢失最后属地|各分支官员、归属、资源、队列与结束状态符合结算章节|独立原函数测试；正常UI全链待验收|
|UI-08|累计关联255/256后正常选将与退出|记录错配/滞留的兼容行为；复刻修复模式禁止低内存访问|边界原结算已有受控实测；自然累计全程未完成|
|UI-09|点击持续按住、双击确认、关闭后迟到事件|新按下只处理一次，无重复扣费/追加/释放|设备映射静态证据；复刻需自动验收|
|UI-10|读档场景0与11、存有待处理战斗|先重建对应父场景，再恢复队列；不复用旧窗口地址|读档/父对象先决条件已有证据|

端到端成功日志应含：设备/控件事件、旧新状态、scene与子scene、battleId、关联计数、队列长度、官员状态、中央兵装、体力、时间/进度、消息生成与关闭序号。只有最终回到可操作上层，且下一次合法菜单动作成功，才能将UI-05标记通过；“结算函数返回”不足以替代这一条件。
