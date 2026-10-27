export type DifficultyId = 'novice'|'standard'|'veteran';
export interface DifficultyState {version:1;id:DifficultyId;legacy:boolean;openingApplied:boolean;seed:number;random:Partial<Record<'personnel'|'tactics',number>>;examMisses:number;aid:{used:number;lastTurn:number;records:Array<{turn:number;grain:number;silver:number}>};provoked:string[]}
export interface ArmyRecoveryTarget {turn:number;soldiers:number;training:number;kits:KitStock;ongoing:boolean}
export interface CentralOfficeSource {id: string|null; name: string; ability: number; integrity: number}
export interface CentralCostEffect {source: CentralOfficeSource; discountRate: number; lossRate: number}
export interface CentralLaborEffect {source: CentralOfficeSource; baseWorkers: number; rate: number; workers: number}
export interface GrainAccounting {
        version: 1;
        periods: Array<{
            turn: number; opening: number; income: number; expense: number;
            net: number; closing: number; keys: string[];
            carried: {income: number; expense: number};
            entries: Array<{
                key: string;
                category: 'tax' | 'production' | 'consumption' | 'storage' | 'purchase' | 'transfer' | 'disaster' | 'event';
                reason: string; income: number; expense: number; before: number; after: number;
            }>;
        }>;
}
/** 当前存档经 validateSave 归一化后的结构；输入兼容范围见 docs/save-compatibility.md。
 * 数值范围、引用一致性和记账守恒仍由运行时校验；TS number 不代表安全整数。
 */
export type TroopKind = 'infantry' | 'spears' | 'cavalry' | 'heavy-cavalry' | 'archers' | 'crossbows' | 'camel' | 'elephant' | 'horse-archers';
export type KitStock = Record<TroopKind, number>;
export type Phase = 0 | 1 | 2 | 3 | 4 | 5;
export type EndReason = '寿元已尽' | '禅让' | '升仙' | '病逝' | '遇刺' | '服毒' | '亡国';
export interface TurnMessage {
    turn: number;
    message: string;
}
/** 存档以基本数据为准，汇总与产量在查询时计算。单位见 docs/domestic-model.md。 */
export type IndustryKey = 'agriculture' | 'pastoral' | 'commerce' | 'industry';
export type ProfessionKey = 'farmers' | 'herders' | 'merchants' | 'workers' | 'soldiers' | 'militia';
export type ExpenseKey = 'administration' | 'officialSalaries' | 'soldierSalaries' | 'militiaSalaries' | 'nobleStipends' | 'weapons' | 'construction' | 'maintenance' | 'other';
export type BuildingKey = 'temples' | 'markets' | 'palaces' | 'yamen' | 'granaries' | 'walls' | 'trainingGrounds';
export type WelfareKey = 'stability' | 'security' | 'activity' | 'fitness' | 'defense' | 'loyalty';
export type Terrain = '平原型' | '河海型' | '高山型' | '丘陵型';
export interface Industry {
    developedArea: number;
    /** 保留原产出公式的基准面积；实际占地同时受 cityCapacity.land 共池与地形产业上限约束。 */
    capacityArea: number;
    productivity: number;
}
export interface DevelopmentProject {
    workOrder?: {mode: number; untilTurn: number; comfort?: boolean};
    id: number;
    industry: IndustryKey;
    fromIndustry?: IndustryKey;
    area: number;
    cost: number;
    progress: 0;
    startedTurn: number;
    ownerId: string;
}
export interface DevelopmentState {
    plan?: {industry:IndustryKey;remaining:number;budget:number;startedTurn:number;ownerId:string};
    lastTurn: number;
    lastAllocationTurn: number | null;
    project: DevelopmentProject | null;
    activation: {
        industry: IndustryKey;
        fromIndustry?: IndustryKey;
        area: number;
        completedTurn: number;
        effectiveTurn: number;
    } | null;
}
export interface BuildingEffectState {
    version: 1;
    baselineActivity: number;
    baselineDefense: number;
    baselineWalls: number;
    lastTurn: number;
    carry: Record<'stability' | 'security' | 'activity' | 'fitness' | 'loyalty', number>;
    pending: {
        building: BuildingKey;
        completedTurn: number;
        effectiveTurn: number;
    } | null;
    last: {
        turn: number;
        fed: boolean;
        disaster: boolean;
        before: Record<string, number>;
        gains: Record<string, number>;
        baseGains?: Record<string, number>;
        facilityGains?: Record<string, number>;
        counts: Record<BuildingKey, number>;
        defense: number;
    } | null;
}
export interface FoodSupplyRecord {
    national?: boolean;
    /** 超周转储备的开仓陈粮耗损；旧供粮快照缺省为0。 */
    storageLoss?: number;
    turn: number;
    opening: number;
    produced: number;
    need: number;
    consumed: number;
    shortfall: number;
    closing: number;
}
export interface Province {
    difficultyId?: DifficultyId;
    difficultyPlayerCountryId?: string;
    developmentBalanceVersion?: 2;
    specialWorkSegments?: Partial<Record<"canal"|"greatWall",{count:number;effectiveTurn:number}>>;
    specialServiceBonus?: Partial<Record<BuildingKey,number>>;
    industryLabor?: {version:1; base:Record<IndustryKey,{area:number;workers:number}>; pending:Array<{industry:IndustryKey;fromIndustry?:IndustryKey;effectiveTurn:number}>};
    terrainCapacity: {version:1;kind:Terrain;landLimit:number;legacyLand:number;legacySectors:Record<IndustryKey,number>};
    cityCapacity: {version: 1; land: number; population: number; expansion?: {id:number;startedTurn:number;ownerId:string;progress:number;land:number;workOrder?:{mode:number;untilTurn:number;comfort?:boolean}}};
    resourceRulesVersion?: 1;
    resourceSettlement?: {
        developmentBalanceVersion?: 2;
        version: 1; turn: number; provinceId: string;
        production: {developed: number; cultivated: number; produced: number; foodSources?: {agriculture: {base:number;produced:number};pastoral: {base:number;produced:number}}};
        officers?: OfficialProduction;
        officialImpact?: {baseProduction:number;productionDelta:number;grainAssessed:number;grainLoss:number;cashBase:number;cashAssessed:number;cashLoss:number};
        civilian: {need: number; available: number; shortfall: number; surplus: number};
        grain: {opening: number; tax: number; officialNeed: number; reliefNeed: number;
            need: number; consumed: number; storageLoss: number; shortfall: number; closing: number; nationalIn?: number; nationalOut?: number};
        cash: {tax: number; expense: number; net: number};
        rates: {grain: number; cash: number};
    };
    foodRelief: {
        purchase: {
            turn: number;
            ration: number;
            limit: number;
            bought: number;
        } | null;
        lastSettlement: FoodSupplyRecord | null;
    };
    buildingEffects: BuildingEffectState;
    development: DevelopmentState;
    disaster: {
        kind: string;
        startTurn: number;
        endTurn: number;
        reliefTurns?: number;
        lastReliefTurn?: number;
    } | null;
    officialProduction?: OfficialProduction;
    localPolicy?: {version: 1; civil: boolean; military: boolean; budget: number; priority: string; locks: string[]; lastLaborTurn?: number};
    projectLaborPressure?: {turn: number; streak: number; loss: number};
    projectLabor?: {turn: number; capacity: number; allocations: {kind: string; key: string; startedTurn: number; workers: number; granted: number; speed?: number; expense?: number; mode?: number; reason?: string; comfort?: boolean; laborEffect?: CentralLaborEffect; officerEffect?: {id:string|null;name:string;ability:number;bonus:number;remaining:number;baseSpeed:number;applied:number}}[]};
    construction: {
        lastTurn: number;
        project: {
            workOrder?: {mode: number; untilTurn: number; comfort?: boolean};
            building: string;
            requiredTurns?: number;
            progress: number;
            startedTurn: number;
        } | null;
    };
    id: string;
    countryId: string;
    name: string;
    terrain: Terrain;
    area: number;
    population: {
        total: number;
        professions: Record<ProfessionKey, number>;
    };
    economy: Record<IndustryKey, Industry>;
    welfare: Record<WelfareKey, number>;
    status: {
        situation: 'stable' | 'unrest' | 'disaster' | 'war';
        livingStandard: number;
    };
    military: {
        training: number;
    };
    specialBuildings: {
        id: string;
        name: string;
        description: string;
        count: number;
        ruleVersion?: 1;
        completedTurn?: number;
        effectiveTurn?: number;
    }[];
    buildings: Record<BuildingKey, number>;
    budget: {
        taxRate: number;
        otherIncome: number;
        expenses: Record<ExpenseKey, number>;
    };
    occupation?: {
        version: 1;
        turn: number;
        previousOwner: string;
        lastTurn: number;
        settled: boolean;
    };
    civic: CivicState;
    specialCommerceBonus?: number;
}
export type CashCategory = 'regular' | 'oneOff' | 'transfer';
export interface CashTotals {
    income: number;
    expenditure: number;
    debtAdded: number;
    debtRepaid?: number;
}
export interface CashPosting extends CashTotals {
    recurring?: true;
    id: number;
    key: string;
    category: CashCategory;
    reason: string;
    treasuryBefore: number;
    treasuryAfter: number;
    debtBefore: number;
    debtAfter: number;
}
/** legacy rows are incomplete historical budgets; optional fields exist only in complete cash periods. */
export interface LedgerEntry {
    turn: number;
    income: number;
    expenditure: number;
    net: number;
    closingTreasury: number;
    closingDebt: number;
    legacy?: boolean;
    legacyBaseline?: LedgerEntry;
    openingTreasury?: number;
    openingDebt?: number;
    debtAdded?: number;
    debtRepaid?: number;
    categories?: Partial<Record<CashCategory, CashTotals>>;
    entries?: CashPosting[];
    keys?: string[];
    carried?: CashTotals;
    recurring?: {income: number; expense: number};
    recurringCarried?: {income: number; expense: number};
}
export interface NationalFoodForecast {
 turn:number; opening:number; grain:number; protectedStock:number; storageLoss:number; produced:number; need:number; consumed:number; shortfall:number; closing:number;
 provinces:Array<{id:string;name:string;resource:Province["resourceSettlement"]|null;produced:number;need:number;consumed:number;shortfall:number}>;
}
export interface Country {
    grainAccounting?: GrainAccounting;
    foodSettledTurn?: number;
    foodSettlement?: NationalFoodForecast;
    id: string;
    name: string;
    capital: string;
    prestige: number;
    relations: 'self' | 'neutral' | 'ally' | 'hostile';
    provinceIds: string[];
    fiscal: {
        grain: number;
        treasury: number;
        debt: number;
        taxRate: number;
        otherIncome: number;
        centralExpenses: Record<ExpenseKey, number>;
        accounting: {
            version: 1;
            lastSettledTurn: number;
            nextId: number;
            history?: Array<{turn: number; income: number; expense: number}>;
        };
    };
    ledger: LedgerEntry[];
}
export interface DomesticState {
    difficulty?: DifficultyState;
    cardBattlePlans?: {version:1;nextId:number;plans:Array<{id:number;name:string;kind:'campaign'|'defense';formation:{kitVersion?:1;generalId:string;commander?:DeploymentSquad;commanderSquad?:KitSquad;squads:Array<KitSquad & {sourceId?:string;generalId:string}>;cardTactics?:CardTacticSelection;cardWeapons?:WeaponSelection;cardSecrets?:SecretSelection;cardLandmarks?:LandmarkSelection}}>};
    cardPeople?: CardPersonRegistry;
    developmentBalanceVersion?: 2;
    industryLaborVersion?: 1;
    manpowerVersion: 1;
    manpower: {version:1;drafts:Array<{originId:string;stationId:string;role:'soldiers'|'militia';job:'farmers'|'herders'|'merchants'|'workers';count:number}>};
    nationalResourcesVersion: 1;
    geographyVersion: 1;
    terrainEconomyVersion: 1;
    capacityRulesVersion: 1;
    resourceRulesVersion?: 1;
    industryActions: {
        version: 1;
        nextId: number;
        history: {
            id: number;
            turn: number;
            kind: 'develop' | 'convert' | 'expand' | 'levy-militia' | 'release-militia' | 'allocate' | 'complete' | 'plan' | 'stop-plan';
            provinceId: string;
            cost: number;
            message: string;
        }[];
    };
    schemaVersion: 8;
    worldExpansionVersion: 1;
    disasters: {
        seed: number;
        lastTurn: number;
        ritualUntil: number;
        lastRitualTurn: number;
        history: {
            turn: number;
            provinceId: string;
            kind: string;
            endTurn: number;
            grainLoss: number;
            rawGrainLoss?: number;
            grainSaved?: number;
            cashLoss: number;
        }[];
    };
    royalFamily: RoyalPerson[];
    general: {
        nextId: number;
        lastTrainingTurn: number;
        manualTrainingTurn?: number;
        trainingEffect?: {turn:number;before:number;after:number;floor:number;delta:number;mode:"manual"|"ongoing";source:{id:string|null;name:string;ability:number};baseGain:number;gainCap:number;gain:number};
        ongoing: boolean;
        trainingFloor: number;
        capitalProvinceId: string;
    };
    armyRecovery?: {
        version: 1; nextId: number; lastTurn: number;
        battleTarget: ArmyRecoveryTarget|null; offer: ArmyRecoveryTarget|null;
        plan: null|{active:boolean; target:ArmyRecoveryTarget; startTurn:number; cap:number; spent:number; train:boolean; draft:boolean; debtRecovery?:boolean; reserve:number; status:string; completedTurn?:number; waitingCap?:boolean};
        history: Array<{turn:number;message:string}>;
    };
    fiscalActions: {
        nextId: number;
        records: FiscalAction[];
    };
    diplomacy: DiplomaticRelationship[];
    centralArmy: {
        sourceProvinceId: string;
        soldiers: number;
        training: number;
    };
    playerCountryId: string;
    countries: Country[];
    provinces: Province[];
    justice: JusticeState;
    war: WarState;
    foodRelief: {
        purchase?: {turn:number;ration:number;limit:number;bought:number}|null;
        version: 1;
        nextId: number;
        history: {
            sellerCountryId?: string;
            sellerGrainBefore?: number;
            sellerGrainAfter?: number;
            sellerTreasuryBefore?: number;
            sellerTreasuryAfter?: number;
            procurement?: CentralCostEffect;
            national?: boolean;
            id: number;
            turn: number;
            kind: 'purchase' | 'transfer';
            sourceId: string | null;
            targetId: string;
            amount: number;
            cost: number;
            sourceBefore: number | null;
            sourceAfter: number | null;
            targetBefore: number;
            targetAfter: number;
            treasuryBefore: number;
            treasuryAfter: number;
        }[];
    };
    officialEffectsVersion?: 1;
    governance: {
        coordination?: {turn:number;budget:number;source:CentralOfficeSource;transfers:{fromId:string;toId:string;amount:number}[]};
        reliefTurn?: number;
        version: 1;
        reserve: number;
        budget: number;
        turnBudget: number;
        lastTurn: number;
        spent: number;
        records: GovernanceRecord[];
        obstructions?: {provinceId:string;building:string;lastTurn:number;streak:number}[];
        militaryPetitions?: {nextId:number;items:{id:number;provinceId:string;turn:number;status:"pending"|"deferred"|"rejected"|"cancelled"|"executed";cost:number;reason:string;decidedTurn?:number;command:{kind:"recruit";sourceId:string;amount:number}|{kind:"transfer";sourceId:string;targetId:string;soldiers:number;quantities:Record<string,number>}}[]};
        petitions?: {nextId:number;items:{id:number;provinceId:string;building:string;cost:number;turn:number;status:"pending"|"deferred"|"rejected"|"cancelled"|"executed";reason:string;decidedTurn?:number}[]};
    };
    stateDevelopment: {
        version: 1;
        nextId: number;
        lastTurn: number;
        fiscalLastTurn: number;
        history: {
            turn: number;
            message: string;
        }[];
    };
    specialWorks: {
        version: 1;
        nextId: number;
        lastTurn: number;
        project: {
            balanceVersion?: 2;
            difficultyId?: DifficultyId;
            id: number;
            workOrder?: {mode: number; untilTurn: number; comfort?: boolean};
            building: string;
            provinceId: string;
            ownerId: string;
            progress: number;
            startedTurn: number;
        } | null;
        history: {
            turn: number;
            message: string;
        }[];
    };
    treatyObligations: {
        version: 1;
        lastTurn: number;
        requests: {
            key: string;
            turn: number;
            attacker: string;
            defender: string;
            helper: string;
            amount: number;
            status: 'pending' | 'fulfilled' | 'declined';
        }[];
        history: {
            key: string;
            turn: number;
            boost: number;
            message: string;
        }[];
    };
    troopKits: TroopKitState;
    personnel: PersonnelState;
    strategy: StrategyState;
    collapse: CollapseState;
}
export interface GameSave {
    envoyVisit: {
        appearance: {
            version: 3;
            countryId: string;
            seed: number;
            variant: number;
        };
        countryId: string;
        requestedTurn: number;
        arrivalTurn: number;
        notified: boolean;
        rulesVersion?: 2;
    } | null;
    phase: Phase;
    version: 2;
    emperorRulesVersion: 1;
    balanceRulesVersion: 1;
    saveRevision: number;
    name: string;
    /** 旧存档缺省时沿用原名号纪年。 */
    eraName?: string;
    turn: number;
    scene: 'palace' | 'court';
    createdAt: string;
    stats: {
        treasury: number;
        health: number;
        prestige: number;
        age: number;
        energy: number;
        maxEnergy: number;
        happiness: number;
        charm: number;
        talent: number;
        wisdom: number;
        martial: number;
        life: number;
        lifeLimit: number;
        trainingSpecialty: 0 | 1 | 2 | null;
    };
    harem: {
        royalNotices: {
            id: number;
            kind: 'pregnancy' | 'miscarriage' | 'birth' | 'death' | 'beauty-tribute' | 'harem-bond';
            message: string;
            turn: number;
            availableTurn: number;
        }[];
        royalNoticeSequence: number;
        royalLastTurn?: number;
        bonds?: {
            version: 1;
            reignStartTurn: number;
            lastAttemptTurn: number;
            lastEventTurn: number;
            lifeGranted: number;
            harmony: {personId: string; startedTurn: number; untilTurn: number} | null;
            history: {turn: number; personId: string; personName: string;
                kind: 'longevity' | 'care' | 'harmony' | 'education' | 'advice'; message: string}[];
        };
        beautyTributeLastTurn?: number;
        members: Beauty[];
        encounter: Beauty | null;
        hiddenEncounter?: Beauty;
        sequence: number;
        streak: number;
        history: string[];
        seen?: string[];
        dismissed?: string[];
        portraitSeed: number;
        children: {
            id: string;
            name: string;
            age: number;
            gender: '男' | '女';
            motherId: string;
            birthTurn?: number;
            status: 'palace' | 'married' | 'deceased';
            deathTurn?: number;
            spouseCountryId?: string;
            marriedTurn?: number;
        }[];
    };
    /** 旧存档兼容字段，不再使用。 */ history?: string[];
    visits: Record<string, number>;
    domestic: DomesticState;
    reignResult?: ReignResult;
    dynasty: DynastyState;
    imperialProgress: {
        version: 1;
        lastTurn: number;
        titles: {
            id: string;
            turn: number;
        }[];
        crowns: {
            turn: number;
        }[];
        history: string[];
        arenaRewarded: boolean;
    };
    mother: {
        filialPiety: number;
        lastVisitTurn: number | null;
        neglectedTurns: number;
        age: number;
        alive: boolean;
        unknown?: boolean;
        deathTurn?: number;
    };
    alchemy: AlchemyState;
    travel: TravelState;
    endings: EndingsState;
    auspices: AuspicesState;
    hunting?: {
        lastRoundId: string;
    };
}
export interface ProvinceBudget {
    tax: number;
    other: number;
    income: number;
    expenditure: number;
    net: number;
}
export interface CountrySummary {
    /** 已含在administration内的生活水平公共服务成本。 */
    publicServiceCost: number;
    country: Country;
    provinces: Province[];
    total: number;
    area: number;
    professions: Record<ProfessionKey, number>;
    dependents: number;
    welfare: Record<WelfareKey, number>;
    buildings: Record<BuildingKey, number>;
    grainReserve: number;
    grainSecurity: number;
    income: number;
    expenditure: number;
    net: number;
    tax: number;
    otherIncome: number;
    expenses: Record<ExpenseKey, number>;
    loyalty: number;
    military: number;
    livingStandard: number;
}
export interface ProvinceGeography {
    id: string;
    name: string;
    terrain: Terrain;
    center: [
        number,
        number
    ];
    polygon: [
        number,
        number
    ][];
}
/** Canonical unordered country pair; one symmetric record per pair. */
export interface DiplomaticRelationship {
    countryIds: [
        string,
        string
    ];
    relation: 'none' | 'ally' | 'hostile' | 'nonaggression' | 'defense' | 'protector' | 'protected';
    agreement: {
        lastPerformance?: {
            turn: number;
            exportsDue: number;
            exportsPaid: number;
            importsDue: number;
            importsPaid: number;
        };
        lastTribute?: {
            turn: number;
            due: number;
            paid: number;
        };
        exports: number;
        imports: number;
        settledTurns: number;
        lastTurn: number;
        tribute: number;
        payerId: string | null;
        marriages: {
            name: string;
            direction: 'in' | 'out';
            turn: number;
        }[];
    };
    friendship: number;
    trade: {
        years: number;
        quota: number;
        income: number;
    };
}
export interface OfficeAttributes {
    name: string | null;
    age: number | null;
    intelligence: number | null;
    martial: number | null;
    integrity: number | null;
    loyalty: number | null;
    experience: number | null;
    nobility: string | null;
}
export interface FiscalAction {
    id: number;
    turn: number;
    kind: 'census' | 'purchase' | 'subsidy' | 'tax' | 'levy' | 'repay';
    title: string;
    cost: number;
    income: number;
    treasuryBefore: number;
    treasuryAfter: number;
    lines: string[];
}
export type OfficialPersonality = 'repentant' | 'fearful' | 'staunch' | 'resentful' | 'steadfast' | 'composed' | 'pragmatic';
/** 本次关押记录；释放、处斩后保留最终记录，不再结算。 */
export interface PrisonRecord {
    admittedTurn: number;
    lastSettledTurn: number;
    servedTurns: number;
    lastDelta: number;
    totalDelta: number;
    lastReason: string;
}
export interface JusticeOfficial extends PersonProfile {
    lastAppointmentRewardTurn?: number;
    id: string;
    name: string;
    office: string;
    provinceId: string | null;
    loyalty: number;
    personality: OfficialPersonality;
    status: 'serving' | 'imprisoned' | 'executed' | 'rebel' | 'released' | 'retired' | 'deceased';
    discovered: boolean;
    discoveredTurn?: number;
    plotTurn: number | null;
    prison: PrisonRecord | null;
    age?: number;
    intelligence?: number;
    politics?: number;
    integrity?: number;
    leadership?: number;
    martial?: number;
    experience?: number;
    growthVersion?: 1;
    lifecycleReason?: '致仕' | '寿终';
    positionId?: string | null;
    rank?: number;
    nobilityLevel?: number;
}
export interface JusticeState {
    justiceDeputyVersion?: 1;
    nextId: number;
    funding: number;
    lastTurn: number;
    lastAmnesty: number;
    amnestyUses?: {year: number; count: number};
    history: string[];
    officials: JusticeOfficial[];
}
export interface Beauty {
    hiddenTraits?: {version: 1; source: 'historical' | 'random' | 'event';
        kinds: ('longevity' | 'care' | 'harmony' | 'education' | 'advice')[]};
    bond?: {visits: number; lastVisitTurn: number; lastEventTurn: number; lifeGranted: number};
    id: string;
    name: string;
    origin: string;
    regionId: string;
    region: string;
    culture: string;
    dress: string;
    age: number;
    appearance: number;
    experience: number;
    ability: number;
    portrait: string;
    cityId: string;
    portraitRecipe?: PortraitRecipe;
    portraitAsset?: string;
    featured?: boolean;
    legacyCode?: string;
    pregnancy?: {
        conceivedTurn: number;
        /** Already pregnant on arrival; special tour birth is due the following turn. */
        arrivalDueTurn?: number;
    };
    inColdPalace?: boolean;
    personality: string;
    specialty: string;
    biography: string;
    rank?: number | null;
    foreignRoyal?: boolean;
    royalId?: string;
    royalCountryId?: string;
    baseAbility?: number;
    regionalPortrait?: boolean;
    tributeOrigin?: {kind: 'annual' | 'foreign'; turn: number; provinceId: string; countryId: string};
    randomBeauty?: boolean;
    randomPortraitAsset?: string;
    travelOrigin?: {
        eventId: string;
        turn: number;
        provinceId: string;
        consented: boolean;
        easterEgg?: string;
    };
}
export interface PortraitRecipe {
    version: 3;
    artVersion: 1;
    compositeVersion: 1;
    seed: number;
    cityId: string;
    culture: string;
    cityStyle: number;
    body: number;
    face: number;
    hair: number;
    clothes: number;
    shoes: number;
    item: number;
    ornament: number;
    secondary: number;
}
export interface GovernanceRecord {
    turn: number;
    provinceId: string;
    cost: number;
    reason: string;
}
export interface EndingAssessment {
    version: 1;
    id: string;
    title: string;
    verdict: string;
    analogy: string | null;
    text: string;
    facts: {
        reason: EndReason;
        years: number;
        domestic: number;
        living: number;
        order: number;
        control: number;
        wisdom: number;
        martial: number;
        victories: number;
        battles: number;
        homeDead: number;
        total: number;
        executions: number;
        filial: number;
        parenting: number;
        priorDomestic: number | null;
    };
}
export interface ReignResultBase {
    assessment?: EndingAssessment;
    name: string;
    turn: number;
    age: number;
    reason: EndReason;
    heirId?: string;
    heirName?: string;
    ritualBonus?: number;
    crowns?: number;
    family?: {
        filialPiety: number;
        parenting: number;
    };
    achievements?: {
        id: string;
        turn: number;
    }[];
    population: number;
    provinces: number;
    treasury: number;
    debt: number;
    scores: {
        people: number;
        finance: number;
        territory: number;
        prestige: number;
    };
    total: number;
    title: '盛世明君' | '守成之君' | '功过参半' | '国事维艰';
    wars: number;
}
export interface RoyalPerson {
    id: string;
    name: string;
    sex: 'male' | 'female';
    age: number;
    countryId: string;
    spouseCountryId: string | null;
    status: 'palace' | 'married' | 'deceased';
    learning: number;
    lastEducationTurn: number;
    childId?: string;
    motherId?: string;
    consortId?: string;
    deathTurn?: number;
}
export interface CivicState {
    taxPressure?: number;
    taxGrievance?: number;
    version: 1;
    baselineSoldiers: number;
    baselineMilitia: number;
    baselineBuildings: number;
    lastTurn: number;
    unrestTurns: number;
    lastMigrationTurn: number;
    lastLivingTurn: number;
    lastPacifyTurn?: number;
    localInvestment?: {
        area: number;
        effectiveTurn: number;
    } | null;
}
export interface DynastyState {
    endingRecord?: {
        version: 1;
        executions: number;
        coverage: 'complete' | 'partial';
        sinceTurn: number;
    };
    version: 1;
    lastTurn: number;
    reignStartTurn: number;
    rulerId: string | null;
    heirId: string | null;
    parenting: number;
    history: string[];
    endReason: EndReason | null;
    endEvidence?: {
        turn: number;
        text: string;
    };
    pastReigns: ReignResult[];
    deadConsorts: {
        id: string;
        name: string;
        age: number;
        deathTurn: number;
        royalId: string | null;
    }[];
    formerConsorts: {
        id: string;
        name: string;
        age: number;
    }[];
}
/** 一人份装备为一名士兵提供完整兵种套装；兵员和训练不重复存入库存。 */
export interface KitSquad {
    kind: TroopKind;
    count: number;
    equipped?: boolean;
}
export type KitReservation = {
    status: 'active';
    squads: KitSquad[];
    /** 单独占用完整套装；不额外占用士兵。当前v3战斗禁止接入。 */
    extraKits?: KitStock;
    extraKitLoss?: never;
} | {
    status: 'settled';
    squads: KitSquad[];
    survivors: number[];
} & ({ extraKits?: never; extraKitLoss?: never } | { extraKits: KitStock; extraKitLoss: KitStock });
export interface KitDepotRecord {
    stock: KitStock;
    reservations: Record<string, KitReservation>;
}
export interface KitDepot extends KitDepotRecord {
    version: 1;
    id: string;
    soldiers: number;
    training: number;
}
export interface TroopKitState {
    version: 1;
    nextId: number;
    history: {
        id: number;
        turn: number;
        kind: 'purchase' | 'transfer' | 'recruit' | 'dismiss';
        cost: number;
        lines: string[];
    }[];
    depots: Record<string, KitDepotRecord>;
}
export interface PersonProfile {
    region?: string;
    sources?: string[];
    identityStatus?: string;
    identityBasis?: string;
    replacesOriginalId?: string;
    potential?: {version:1|2|3;base:Record<'intelligence'|'martial'|'leadership'|'politics'|'integrity',number>;caps:Record<'intelligence'|'martial'|'leadership'|'politics'|'integrity',number>};
    studyProgress?: {experience:number;abilities:Record<'intelligence'|'martial'|'leadership'|'politics'|'integrity',number>;lastTurn:number};
    dynasty?: string;
    role?: string;
    generated?: boolean;
    originalName?: string;
    intelligence?: number;
    martial?: number;
    leadership?: number;
    politics?: number;
    integrity?: number;
    initialAge?: number;
    initialLoyalty?: number;
    initialExperience?: number;
    tags?: string[];
    biography?: string;
    source?: string;
    sourceTitle?: string;
    biographyStatus?: string;
    ratingStatus?: string;
    ratingMethod?: string;
    ratingConfidence?: string;
    ratingVersion?: number;
    designNote?: string;
    designCaveats?: string[];
    ratingBasis?: string;
    characterTraits?: string[];
    personalityBasis?: string;
    personalityEvidence?: string;
    personalityMethod?: string;
    personalitySource?: string;
    personalityVersion?: number;
}
export interface ExamCandidate extends PersonProfile {
    id: string;
    name: string;
    age: number;
    loyalty: number;
    experience: number;
    intelligence: number;
    martial: number;
    integrity: number;
    personality: OfficialPersonality;
}
export interface PersonnelState {
    hanlin?: {version:1;lastTurn:number;students:{officialId:string;attribute:string;admittedTurn:number}[];history:{turn:number;message:string}[]};
    nextId: number;
    lastTurn: number;
    examTurn: number | null;
    candidates: ExamCandidate[];
    delegations: string[];
    history: string[];
    retired: string[];
    hiddenPeople: (ExamCandidate | JusticeOfficial)[];
}
export interface Force {
    countryId: string;
    sourceId: string;
    soldiers: number;
    training: number;
    reserve?: number;
}
export interface Campaign {
    id: number;
    turn: number;
    attacker: string;
    defender: string;
    provinceId: string;
    attack: Force;
    allies: Force[];
    playerAid: boolean;
    support: number;
}
export interface StrategyState {
    version: 1;
    lastTurn: number;
    nextId: number;
    lastPlayerAttack: number;
    pending: Campaign | null;
    history: TurnMessage[];
    nations: Record<string, {
        lastWar: number;
        lastPeace: number;
        profile?: "expansionist" | "regional" | "cautious";
        initiative?: number;
    }>;
}
export interface CollapseState {
    version: 1;
    pending: {
        attacker: string;
        provinceId: string;
        turn: number;
    } | null;
    ended: boolean;
    history: TurnMessage[];
}
export interface WarTotals {
    total: number;
    victories: number;
    defeats: number;
    unknown: number;
    homeDead: number;
    enemyDead: number;
}
export type WarCoverage = 'complete' | 'retained-history';
export interface WarCareer extends WarTotals {
    version: 1;
    lastId: number;
    coverage: WarCoverage;
}
export interface CommanderSnapshot extends Partial<Omit<JusticeOfficial, 'id'>> {
    id?: string | null;
    name: string;
    martial?: number;
    intelligence?: number;
    leadership?: number;
    experience?: number;
}
export interface DeploymentSquad extends KitSquad {
    sourceId: string;
    generalId?: string;
}
export interface CardTacticSelection {version:1; counts:Record<string,number>;}
export interface DefensePlan {
    cardLandmarks?: LandmarkSelection;
    cardSecrets?: SecretSelection;
    cardWeapons?: WeaponSelection;
    cardTactics?: CardTacticSelection;
    battleMode?: 'cards';
    kitVersion: 1;
    generalId: string;
    commander: DeploymentSquad;
    squads: DeploymentSquad[];
}
export interface WeaponSelection {version:1;counts:Record<string,number>;}
export interface WeaponAllocation {version:1;home:{sourceId:string;selection:WeaponSelection};enemy:{sourceId:string;selection:WeaponSelection};}
export interface SecretSelection {version:1;counts:Record<string,number>;}
export interface SecretAllocation {version:1;home:{sourceId:string;selection:SecretSelection};enemy:{sourceId:string;selection:SecretSelection};}
export interface LandmarkSelection {version:1;counts:Record<string,number>;}
export interface LandmarkAllocation {version:1;home:{sourceId:string;selection:LandmarkSelection};enemy:{sourceId:string;selection:LandmarkSelection};}
export interface OffensiveCommand {
    cardLandmarks?:LandmarkSelection;landmarkAllocation?:LandmarkAllocation;
    cardSecrets?: SecretSelection;
    secretAllocation?: SecretAllocation;
    cardWeapons?: WeaponSelection;
    weaponAllocation?: WeaponAllocation;
    cardTactics?: CardTacticSelection;
    battleMode?: 'cards';
    id: number;
    kind: 'war';
    kitVersion: 1;
    targetId: string;
    generalId: string;
    commanderSquad: KitSquad;
    squads: (KitSquad & {
        generalId: string;
    })[];
    supply?: {version: 1 | 2 | 3; logistics?: number; mounted?: number; count: number; silver: number; grain: number; sourceProvinceId: string; officer?: CentralCostEffect};
    kitSupport: number;
    kitBattleId: string;
    squadLimitVersion?: 1;
    provinceId: string;
    alliedForces: Force[];
    defensive?: false;
}
export interface DefensiveCommand {
    cardLandmarks?: LandmarkSelection;
    landmarkAllocation?: LandmarkAllocation;
    cardSecrets?: SecretSelection;
    secretAllocation?: SecretAllocation;
    cardWeapons?: WeaponSelection;
    weaponAllocation?: WeaponAllocation;
    cardTactics?: CardTacticSelection;
    battleMode?: 'cards';
    id: number;
    kind: 'war';
    kitVersion: 1;
    kitBattleId: string;
    squadLimitVersion?: 1;
    defensive: true;
    campaignId: number;
    deploymentVersion: 2;
    deployment: DefensePlan;
    generalId: string;
    commanderSquad: DeploymentSquad;
    squads: DeploymentSquad[];
    forces: Force[];
    attack: Force;
}
export interface BattleUnit extends KitSquad {
    artCulture?: string;
    artRegion?: string;
    cardPersonId?: string;
    id: string;
    side: 'home' | 'enemy';
    name: string;
    sourceId: string;
    general: CommanderSnapshot;
    x: number;
    y: number;
    facing: number;
    initial: number;
    dead: number;
    fled: boolean;
    defending: boolean;
    retaliated: boolean;
    waited: boolean;
    moved: boolean;
    training: number;
    equipmentFactor: number;
    commander?: boolean;
    allyIndex?: number;
    forceIndex?: number;
    moveSpent?: number;
    attacked?: boolean;
    chargeRun?: number;
    chargeFacing?: number;
    bonus: {
        attack: number;
        defense: number;
        speed: 0 | 1;
        aura: number;
    };
}
/** 身份与随机生成结果持久化，战斗动作不重新生成。 */
export interface CardEffect {
    op: 'draw'|'armor'|'heal'|'selfdamage'|'refund'|'discount'|'aoe'|'damage'|'destroy'|'freeze'|'setattack'|'silence'|'buff'|'group';
    n?: number; target?: 'friend'|'enemy'|'enemy_character'; a?: number; h?: number;
    temp?: boolean; give?: string; mask?: string; limit?: number; filter?: string; injured?: boolean;
}
export interface CardDefinition {
    uses?:number;cooldown?:number;ability?:{op:string;amount:number};
    trigger?:string;effect?:string;amount?:number;text?:string;
    id: string; name: string; type: 'troop'|'general'|'spell'|'weapon'|'secret'|'landmark'; cost: number;
    attack?: number|null; health?: number|null; tags: string[]; enter: CardEffect[]; death: CardEffect[];
    [metadata: string]: unknown;
}
export interface CardPersonProfile {
    version: 1; personId: string; historicalDefinitionId: string|null; name: string; portraitId: string;
    definitionId?: string; abilities: {martial: number; intelligence: number; leadership: number;politics?:number;integrity?:number;experience?:number};
    potential?: unknown; role?: 'martial'|'intelligence'|'command'; tier?: number; poolId?: string;
    templateId?: string; revision?:number;lastGrowthTurn?:number;generationSeed?: number; culture: string; definition?: CardDefinition;
}
export interface CardPersonRegistry {
    version: 1; rng: number; worldSeed?:number; people: Record<string,CardPersonProfile>;
    garrisons: Record<string,{id:string;name:string;martial:number;intelligence:number;leadership:number;role:'武将'|'文职';generated:true;culture:string;artRegion?:string;politics:number;integrity:number;experience:number;potential?:unknown}>;
}
export interface CombatCard {
    landmarkSource?:{unitId:string;sourceId:string;personId:string};uses?:number;landmarkUsed?:number;landmarkReadyTurn?:number;landmarkDeployedTurn?:number;landmarkLastUsedTurn?:number;landmarkRemoved?:string;
    secretSource?:{unitId:string;sourceId:string;personId:string};secretRevealed?:boolean;armedOrder?:number;secretSeal?:string;
    id: string; definitionId: string; type: 'troop'|'general'|'tactic'|'weapon'|'secret'|'landmark'; side: 'home'|'enemy'; name:string;
    durability?:number;
    cost:number; definition:CardDefinition; unitId?:string; kind?:TroopKind; count?:number; training?:number;
    general?:string; personId?:string;personInstanceId?:string;historicalDefinitionId?:string|null; attack?:number; hp?:number; maxHp?:number; printedAttack?:number;
    printedHp?:number; ready?:boolean; rushing?:boolean; tags?:string[]; buffAttack?:number;
    buffHealth?:number; tempAttack?:number; lossPeak?:number; played?:number; frozen?:boolean;
    silenced?:boolean; front?:boolean; attackedPly?:number; enteredPly?:number;
}
export interface CardPlayer {
    landmarks?:string[];
    secrets?:string[];
    weapon?:string|null;heroAttackUsed?:boolean;
    hero:number; armor:number; mana:number; maxMana:number; hand:string[]; deck:string[];
    board:string[]; grave:string[]; reserve:Record<string,number>; gaps:string[]; fatigue:number;
    ownTurn:number; powerUsed:boolean; heroDamage:number; discount:number; rng:number;
    skill:{kind:'martial'|'intelligence'|'command';name:string;text:string};
}
export interface CardBattleState {
    history?: {version:1;nextId:number;checksum:number;startedPly:number;partial:boolean;entries:Array<Record<string,unknown>>};
    deckConfiguration?: {version:1; tactics:CardTacticSelection};
    deckConfigurationHash?: number;
    version:2; rulesVersion:3|4|5|6; seed:number;
    landmarkAiVersion?:1;
    secretAiVersion?:1;secretSequence?:number;
    weaponAiVersion?:1;
    weaponSupplies?:Record<string,{sourceId:string;kind:TroopKind;quantity:1;lost:boolean;reason?:'exhausted'|'replaced'|'leader-defeated'}>;
    catalogVersion:string;definitionHash:number;definitionCatalog:Record<string,CardDefinition>;personCatalog:Record<string,CardDefinition>;rulesSnapshot:{attributeRules?:{version:1;trainingAttack:number;trainingHealth:number;officerAttack:number;officerHealth:number;commander:number};version:number;unitSize:number;compactArmy:boolean;compactPenalty:boolean;penaltyTiersOnly?:boolean;reserveDeckGrowth?:number;lowTrainingPenalty?:'general'|'elite'|'none';scoutVariants?:Record<string,Record<string,string>>;troopCap:number;boardLimit:number;handLimit:number;deckSize:number;spellPackages:Record<string,string[]>}; first:'home'|'enemy'; turn:'home'|'enemy';
    phase:'mulligan'|'play'|'ended'; ply:number; nextId:number; sequence:number;
    players:Record<'home'|'enemy',CardPlayer>; catalog:Record<string,CombatCard>;
    events:Array<{type:string;[detail:string]:string|number|boolean|undefined}>; retreated?:'home'|'enemy';
}
export interface LegacyCardBattleState {
    version:1; rulesVersion?:1|2; seed:number; turn:'home'|'enemy'; phase:'mulligan'|'play'|'ended';
    ply:number; selected:string[]; players:Record<string,unknown>; catalog:Record<string,unknown>;retreated?:'home'|'enemy';
}

export interface BattleState {
    difficultyId?: DifficultyId;
    cards?: CardBattleState | LegacyCardBattleState;
    cardPeople?: Record<string,CardPersonProfile>;
    cardSeed?: number;
    tiles?: ('plain' | 'road' | 'hill' | 'forest' | 'sand' | 'water')[];
    version: 2;
    command: OffensiveCommand | DefensiveCommand;
    targetName: string;
    units: BattleUnit[];
    field?: {
        terrain: Terrain;
        surface?: 'normal' | 'desert';
        defenderSide?: 'home' | 'enemy';
        defense: number;
    };
    round: number;
    cursor: number;
    order: string[];
    log: string[];
    result: 'victory' | 'defeat' | 'draw' | null;
}
export interface OccupationReceipt {
    provinceId: string;
    name: string;
    previousOwner: string;
    annexed: boolean;
}
export interface ArmyReport {
    initial: number;
    dead: number;
    survived: number;
    commander: {
        name: string;
        personId?: string;
        count: number;
        initial: number;
        status: string;
    };
    units: {
        name: string;
        kind: TroopKind;
        commander: boolean;
        initial: number;
        dead: number;
        survived: number;
        generalName: string;
        generalId?: string;
        sourceId: string;
    }[];
}
export interface CardHistoryArchive {version:1;data:{values:Array<string|number|boolean|null>;nodes:string;bytes:number;root:number};}
export interface WarReceipt {
    cardHistory?: CardHistoryArchive;
    id: number;
    turn: number;
    kind: 'war' | 'recruit' | 'dismiss';
    title: string;
    lines: string[];
    occupation?: OccupationReceipt | null;
    report?: {
        kitVersion: 1;
        occupation: OccupationReceipt | null;
        result: 'victory' | 'defeat' | 'draw';
        targetName: string;
        rounds: number;
        reason: string;
        home: ArmyReport;
        enemy: ArmyReport;
        loot: number;
        prestige: number;
        kitLoss: KitStock;
    };
    defenseDetails?: {
        version: 2;
        units: {
            side: 'home' | 'enemy';
            sourceId: string;
            kind: TroopKind;
            generalName: string;
        generalId?: string;
            initial: number;
            dead: number;
            survived: number;
        }[];
        kitLoss: {
            home: KitStock;
            enemy: KitStock;
        };
    };
}
export interface WarState {
    nextId: number;
    history: WarReceipt[];
    career: WarCareer;
    battle?: BattleState;
}
export interface HistoricalEvaluation {
    version: 1;
    basis: string;
    name: string;
    row: number;
    column: number;
    years: number;
    shortReign: boolean;
    living: number;
    production: number;
    order: number;
    domesticScore: number;
    control: number;
    protectedCount: number;
    tags: string[];
}
/** 当前生成版本为2；已保存的版本1终评保留，不能凭裁剪后的战报补造历史。 */
export type ReignResult = (ReignResultBase & {
    version: 1;
    historical?: never;
    warRecord?: never;
    evidence?: never;
}) | (ReignResultBase & {
    version: 2;
    historical: HistoricalEvaluation;
    warRecord: WarTotals & {
        coverage: WarCoverage;
    };
    evidence: string;
});
export interface EndingsState {
    version: 1;
    lastTurn: number;
    criticalTurns: number;
    lastTreatmentTurn: number;
    adviceYear: number;
    advicePending: boolean;
    completeReign: boolean;
    warBaseline: WarTotals;
    history: TurnMessage[];
}
export type HerbId = 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G' | 'H';
export type DrugEffect = 'energy' | 'wellness' | 'abilities' | 'capacity' | 'life8' | 'life7' | 'life6' | 'harm';
export interface AlchemyBatch {
    id: number;
    key: string;
    effect: DrugEffect;
    quantity: number;
    identified: boolean;
    startedTurn: number;
    readyTurn: number;
}
export interface AlchemyState {
    version: 1;
    lastTurn: number;
    sequence: number;
    herbs: Record<HerbId, number>;
    furnace: AlchemyBatch | null;
    batches: AlchemyBatch[];
    known: string[];
    history: string[];
}
export interface TourEncounter {
    id: string;
    type: string;
    seed: number;
    status: 'pending' | 'resolved';
    choiceId: string | null;
    result: string | null;
    personId?: string;
}
export interface TravelRecord {
    rulesVersion?: 1 | 2;
    id: number;
    kind: 'tour' | 'incognito';
    provinceId: string;
    scheduledTurn: number;
    dueTurn: number;
    visits: string[];
    visitCounts: Record<string, number>;
    events: {
        placeId: string;
        title: string;
        text: string;
    }[];
    encounters: TourEncounter[];
    ended: boolean;
    startedTurn?: number;
    startedPhase?: Phase;
    returnTurn?: number;
    reward?: {
        treasury: number;
        happiness: number;
        life: number;
        health: number;
        loyalty: number;
    };
    completedTurn?: number;
    message?: string;
    celebrated?: boolean;
}
export interface TravelState {
    version: 1;
    nextId: number;
    pending: TravelRecord | null;
    history: (TravelRecord & {
        completedTurn: number;
        message: string;
    })[];
    easterEggs: {
        xiaYuheSeen: boolean;
        cameosSeen?: string[];
    };
}
export interface AuspicesState {
    lastTurn: number;
    history: {
        turn: number;
        kind: string;
        provinceId: string | null;
        amount: number;
        notified: boolean;
        rulesVersion?: 2;
    }[];
}
export interface SaveSlot {
    id: string;
    kind: 'auto' | 'manual';
    at: number;
    data: GameSave;
    label?: string;
}

export interface OfficialProduction {version:1;turn:number;productionRate:number;collectionRate:number;lossRate:number;sources:{id:string|null;name:string;office:string;provinceId:string|null;role:string;ability:number;integrity:number;efficiency:number;lossRate:number;active:boolean}[];}
