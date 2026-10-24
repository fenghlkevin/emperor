// Canonical versioned card definitions; matches docs/card-battle-release-catalog.json.
export const CARD_CATALOG = {
 "version": "phase1-release-v5",
 "date": "2026-10-22",
 "scope": "production canonical data; validated by the shared JavaScript battle engine",
 "training_reference": 60,
 "training": {
  "0-39": {
   "general_health": -1
  },
  "40-69": {},
  "70-89": {
   "elite_health": 1
  },
  "90-100": {
   "elite_general_health": 1
  }
 },
 "cards": [
  {
   "id": "vanguard",
   "name": "前锋小队",
   "type": "troop",
   "kind": "source",
   "cost": 1,
   "attack": 1,
   "health": 2,
   "tags": [],
   "enter": [],
   "death": []
  },
  {
   "id": "levy",
   "name": "乡勇",
   "type": "troop",
   "kind": "infantry",
   "cost": 1,
   "attack": 1,
   "health": 1,
   "tags": [],
   "enter": [],
   "death": [],
   "equipment": "unarmed"
  },
  {
   "id": "infantry_scout",
   "name": "刀盾兵小队",
   "type": "troop",
   "kind": "infantry",
   "cost": 2,
   "attack": 3,
   "health": 2,
   "tags": [],
   "enter": [],
   "death": []
  },
  {
   "id": "infantry_line",
   "name": "刀盾兵主力",
   "type": "troop",
   "kind": "infantry",
   "cost": 3,
   "attack": 3,
   "health": 4,
   "tags": [
    "taunt"
   ],
   "enter": [],
   "death": []
  },
  {
   "id": "infantry_elite",
   "name": "刀盾兵精锐",
   "type": "troop",
   "kind": "infantry",
   "cost": 5,
   "attack": 5,
   "health": 6,
   "tags": [
    "taunt"
   ],
   "enter": [],
   "death": []
  },
  {
   "id": "spears_scout",
   "name": "长枪兵小队",
   "type": "troop",
   "kind": "spears",
   "cost": 2,
   "attack": 2,
   "health": 3,
   "tags": [],
   "enter": [],
   "death": []
  },
  {
   "id": "spears_line",
   "name": "长枪兵主力",
   "type": "troop",
   "kind": "spears",
   "cost": 3,
   "attack": 3,
   "health": 4,
   "tags": [
    "anti"
   ],
   "enter": [],
   "death": []
  },
  {
   "id": "spears_elite",
   "name": "长枪兵精锐",
   "type": "troop",
   "kind": "spears",
   "cost": 5,
   "attack": 4,
   "health": 6,
   "tags": [
    "taunt",
    "anti"
   ],
   "enter": [],
   "death": []
  },
  {
   "id": "cavalry_scout",
   "name": "轻骑兵小队",
   "type": "troop",
   "kind": "cavalry",
   "cost": 2,
   "attack": 3,
   "health": 2,
   "tags": [
    "rush"
   ],
   "enter": [],
   "death": []
  },
  {
   "id": "cavalry_patrol_scout",
   "name": "轻骑巡哨",
   "type": "troop",
   "kind": "cavalry",
   "cost": 2,
   "attack": 2,
   "health": 3,
   "tags": [
    "rush"
   ],
   "enter": [],
   "death": []
  },
  {
   "id": "cavalry_line",
   "name": "轻骑兵主力",
   "type": "troop",
   "kind": "cavalry",
   "cost": 3,
   "attack": 3,
   "health": 3,
   "tags": [
    "rush"
   ],
   "enter": [],
   "death": []
  },
  {
   "id": "cavalry_elite",
   "name": "轻骑兵精锐",
   "type": "troop",
   "kind": "cavalry",
   "cost": 5,
   "attack": 5,
   "health": 4,
   "tags": [
    "rush"
   ],
   "enter": [],
   "death": []
  },
  {
   "id": "heavy_scout",
   "name": "重骑兵小队",
   "type": "troop",
   "kind": "heavy",
   "cost": 2,
   "attack": 2,
   "health": 3,
   "tags": [],
   "enter": [],
   "death": []
  },
  {
   "id": "heavy_line",
   "name": "重骑兵主力",
   "type": "troop",
   "kind": "heavy",
   "cost": 4,
   "attack": 4,
   "health": 4,
   "tags": [
    "rush"
   ],
   "enter": [],
   "death": []
  },
  {
   "id": "heavy_elite",
   "name": "重骑兵精锐",
   "type": "troop",
   "kind": "heavy",
   "cost": 6,
   "attack": 6,
   "health": 6,
   "tags": [
    "rush"
   ],
   "enter": [],
   "death": []
  },
  {
   "id": "archers_scout",
   "name": "弓兵小队",
   "type": "troop",
   "kind": "archers",
   "cost": 2,
   "attack": 2,
   "health": 3,
   "tags": [],
   "enter": [],
   "death": []
  },
  {
   "id": "archers_line",
   "name": "弓兵主力",
   "type": "troop",
   "kind": "archers",
   "cost": 3,
   "attack": 3,
   "health": 2,
   "tags": [],
   "enter": [
    {
     "op": "damage",
     "n": 1,
     "target": "enemy"
    }
   ],
   "death": []
  },
  {
   "id": "archers_elite",
   "name": "弓兵精锐",
   "type": "troop",
   "kind": "archers",
   "cost": 5,
   "attack": 4,
   "health": 4,
   "tags": [],
   "enter": [
    {
     "op": "damage",
     "n": 2,
     "target": "enemy"
    }
   ],
   "death": []
  },
  {
   "id": "crossbows_scout",
   "name": "弩兵小队",
   "type": "troop",
   "kind": "crossbows",
   "cost": 2,
   "attack": 1,
   "health": 2,
   "tags": [],
   "enter": [],
   "death": [
    {
     "op": "draw",
     "n": 1
    }
   ]
  },
  {
   "id": "crossbows_line",
   "name": "弩兵主力",
   "type": "troop",
   "kind": "crossbows",
   "cost": 4,
   "attack": 4,
   "health": 4,
   "tags": [
    "pierce"
   ],
   "enter": [],
   "death": []
  },
  {
   "id": "crossbows_elite",
   "name": "弩兵精锐",
   "type": "troop",
   "kind": "crossbows",
   "cost": 6,
   "attack": 5,
   "health": 6,
   "tags": [
    "pierce"
   ],
   "enter": [],
   "death": []
  },
  {
   "id": "horse_archers_scout",
   "name": "弓骑兵小队",
   "type": "troop",
   "kind": "horse_archers",
   "cost": 2,
   "attack": 2,
   "health": 3,
   "tags": [],
   "enter": [],
   "death": []
  },
  {
   "id": "horse_archers_line",
   "name": "弓骑兵主力",
   "type": "troop",
   "kind": "horse_archers",
   "cost": 4,
   "attack": 4,
   "health": 3,
   "tags": [
    "rush"
   ],
   "enter": [],
   "death": []
  },
  {
   "id": "horse_archers_elite",
   "name": "弓骑兵精锐",
   "type": "troop",
   "kind": "horse_archers",
   "cost": 6,
   "attack": 5,
   "health": 6,
   "tags": [
    "rush"
   ],
   "enter": [],
   "death": []
  },
  {
   "id": "camel_scout",
   "name": "骆驼骑兵小队",
   "type": "troop",
   "kind": "camel",
   "cost": 2,
   "attack": 2,
   "health": 3,
   "tags": [],
   "enter": [],
   "death": []
  },
  {
   "id": "camel_line",
   "name": "骆驼骑兵主力",
   "type": "troop",
   "kind": "camel",
   "cost": 4,
   "attack": 3,
   "health": 5,
   "tags": [
    "anti_horse"
   ],
   "enter": [],
   "death": []
  },
  {
   "id": "camel_elite",
   "name": "骆驼骑兵精锐",
   "type": "troop",
   "kind": "camel",
   "cost": 6,
   "attack": 5,
   "health": 7,
   "tags": [
    "anti_horse"
   ],
   "enter": [],
   "death": []
  },
  {
   "id": "elephant_scout",
   "name": "象兵小队",
   "type": "troop",
   "kind": "elephant",
   "cost": 2,
   "attack": 2,
   "health": 3,
   "tags": [],
   "enter": [],
   "death": []
  },
  {
   "id": "elephant_line",
   "name": "象兵主力",
   "type": "troop",
   "kind": "elephant",
   "cost": 7,
   "attack": 6,
   "health": 8,
   "tags": [
    "taunt"
   ],
   "enter": [],
   "death": []
  },
  {
   "id": "elephant_elite",
   "name": "象兵精锐",
   "type": "troop",
   "kind": "elephant",
   "cost": 9,
   "attack": 8,
   "health": 10,
   "tags": [
    "taunt"
   ],
   "enter": [],
   "death": []
  },
  {
   "id": "precision",
   "name": "精准射击",
   "type": "spell",
   "cost": 2,
   "attack": null,
   "health": null,
   "tags": [],
   "enter": [
    {
     "op": "damage",
     "target": "enemy_character",
     "n": 3
    }
   ],
   "death": []
  },
  {
   "id": "fire",
   "name": "集中火力",
   "type": "spell",
   "cost": 4,
   "attack": null,
   "health": null,
   "tags": [],
   "enter": [
    {
     "op": "damage",
     "target": "enemy_character",
     "n": 6
    }
   ],
   "death": []
  },
  {
   "id": "execute",
   "name": "乘隙追击",
   "type": "spell",
   "cost": 2,
   "attack": null,
   "health": null,
   "tags": [],
   "enter": [
    {
     "op": "destroy",
     "target": "enemy",
     "injured": true
    }
   ],
   "death": []
  },
  {
   "id": "arrows",
   "name": "万箭齐发",
   "type": "spell",
   "cost": 3,
   "attack": null,
   "health": null,
   "tags": [],
   "enter": [
    {
     "op": "aoe",
     "n": 2
    }
   ],
   "death": []
  },
  {
   "id": "barrage",
   "name": "密集齐射",
   "type": "spell",
   "cost": 6,
   "attack": null,
   "health": null,
   "tags": [],
   "enter": [
    {
     "op": "aoe",
     "n": 4
    }
   ],
   "death": []
  },
  {
   "id": "brace",
   "name": "坚守阵线",
   "type": "spell",
   "cost": 1,
   "attack": null,
   "health": null,
   "tags": [],
   "enter": [
    {
     "op": "buff",
     "a": 0,
     "h": 2,
     "target": "friend"
    }
   ],
   "death": []
  },
  {
   "id": "assault",
   "name": "奋勇进击",
   "type": "spell",
   "cost": 1,
   "attack": null,
   "health": null,
   "tags": [],
   "enter": [
    {
     "op": "buff",
     "target": "friend",
     "a": 3,
     "h": 0,
     "temp": true
    }
   ],
   "death": []
  },
  {
   "id": "fortify",
   "name": "整队备战",
   "type": "spell",
   "cost": 2,
   "attack": null,
   "health": null,
   "tags": [],
   "enter": [
    {
     "op": "buff",
     "a": 2,
     "h": 2,
     "target": "friend"
    }
   ],
   "death": []
  },
  {
   "id": "dispel",
   "name": "扰乱军令",
   "type": "spell",
   "cost": 2,
   "attack": null,
   "health": null,
   "tags": [],
   "enter": [
    {
     "op": "silence",
     "target": "enemy"
    }
   ],
   "death": []
  },
  {
   "id": "pin",
   "name": "牵制敌军",
   "type": "spell",
   "cost": 2,
   "attack": null,
   "health": null,
   "tags": [],
   "enter": [
    {
     "op": "freeze",
     "target": "enemy"
    },
    {
     "op": "draw",
     "n": 1
    }
   ],
   "death": []
  },
  {
   "id": "supply",
   "name": "军需调度",
   "type": "spell",
   "cost": 3,
   "attack": null,
   "health": null,
   "tags": [],
   "enter": [
    {
     "op": "draw",
     "n": 2
    }
   ],
   "death": []
  },
  {
   "id": "heal",
   "name": "整军鼓舞",
   "type": "spell",
   "cost": 2,
   "attack": null,
   "health": null,
   "tags": [],
   "enter": [
    {
     "op": "heal",
     "n": 5
    }
   ],
   "death": []
  },
  {
   "id": "person_cbdb-27948",
   "person_id": "cbdb-27948",
   "name": "刘基",
   "type": "general",
   "kind": "source",
   "cost": 5,
   "attack": 2,
   "health": 5,
   "tags": [],
   "skill": "运筹帷幄",
   "enter": [
    {
     "op": "draw",
     "n": 1,
     "filter": "tactic"
    },
    {
     "op": "discount",
     "n": 1
    }
   ],
   "death": [],
   "source": {
    "id": "cbdb-27948",
    "name": "刘基",
    "role": "文职",
    "martial": 16,
    "intelligence": 98,
    "leadership": 76,
    "tags": [
     "谋臣"
    ],
    "biography": "明初谋臣，参与战略筹划与制度建设，文学成就突出，不采用神机法术传说。",
    "dynasty": "明",
    "source": "https://cbdb.fas.harvard.edu/cbdbapi/person.php?id=27948&o=json",
    "sourceTitle": "CBDB人物资料：27948",
    "historicalVerified": true
   },
   "historical_definition_id": "cbdb-27948",
   "art": {
    "avatar": "assets/officials/historical/cbdb-27948/avatar.png",
    "full": "assets/officials/historical/cbdb-27948/full.png",
    "court": "assets/officials/historical/cbdb-27948/court.png"
   },
   "evidence_status": "现有人物简介可追溯",
   "design_basis": "明初谋臣，参与战略筹划与制度建设，文学成就突出，不采用神机法术传说。",
   "ui_archetype": "文臣谋士",
   "cost_basis": "费用统一支付身体、关键词与技能预算；不按名气定高费，不把智力直接换算成个人攻击。",
   "ui_requirements": [
    "使用关联人物现有头像与姓名",
    "服饰与时代、文武身份相符",
    "技能表现采用军令、兵器、阵形或军需，不画无史据法术",
    "史料不足沿用原作资源并标记待核，不据同名猜朝代"
   ]
  },
  {
   "id": "person_cbdb-3767",
   "person_id": "cbdb-3767",
   "name": "苏轼",
   "type": "general",
   "kind": "source",
   "cost": 4,
   "attack": 2,
   "health": 5,
   "tags": [],
   "skill": "惠民养兵",
   "enter": [
    {
     "op": "armor",
     "n": 3
    },
    {
     "op": "heal",
     "n": 3
    }
   ],
   "death": [],
   "source": {
    "id": "cbdb-3767",
    "name": "苏轼",
    "role": "文职",
    "martial": 20,
    "intelligence": 94,
    "leadership": 35,
    "tags": [
     "文学名家",
     "地方能臣"
    ],
    "biography": "北宋文学家，曾任杭州等地长官，疏浚西湖并筑苏堤；诗文书画成就突出。",
    "dynasty": "宋",
    "source": "https://zh.wikipedia.org/?curid=6433",
    "sourceTitle": "维基百科：苏轼（导言节录，CC BY-SA 4.0）",
    "historicalVerified": true
   },
   "historical_definition_id": "cbdb-3767",
   "art": {
    "avatar": "assets/officials/historical/cbdb-3767/avatar.png",
    "full": "assets/officials/historical/cbdb-3767/full.png",
    "court": "assets/officials/historical/cbdb-3767/court.png"
   },
   "evidence_status": "现有人物简介可追溯",
   "design_basis": "北宋文学家，曾任杭州等地长官，疏浚西湖并筑苏堤；诗文书画成就突出。",
   "ui_archetype": "文臣谋士",
   "cost_basis": "费用统一支付身体、关键词与技能预算；不按名气定高费，不把智力直接换算成个人攻击。",
   "ui_requirements": [
    "使用关联人物现有头像与姓名",
    "服饰与时代、文武身份相符",
    "技能表现采用军令、兵器、阵形或军需，不画无史据法术",
    "史料不足沿用原作资源并标记待核，不据同名猜朝代"
   ]
  },
  {
   "id": "person_cbdb-1384",
   "person_id": "cbdb-1384",
   "name": "欧阳修",
   "type": "general",
   "kind": "source",
   "cost": 3,
   "attack": 2,
   "health": 3,
   "tags": [],
   "skill": "举贤荐才",
   "enter": [
    {
     "op": "draw",
     "n": 1,
     "filter": "general"
    }
   ],
   "death": [],
   "source": {
    "id": "cbdb-1384",
    "name": "欧阳修",
    "role": "文职",
    "martial": 14,
    "intelligence": 92,
    "leadership": 25,
    "tags": [
     "文学名家",
     "名臣"
    ],
    "biography": "北宋文学家、史学家，参与《新唐书》编修，奖掖苏轼等后进，并历任地方官。",
    "dynasty": "宋",
    "source": "https://zh.wikipedia.org/?curid=10634",
    "sourceTitle": "维基百科：欧阳修（导言节录，CC BY-SA 4.0）",
    "historicalVerified": true
   },
   "historical_definition_id": "cbdb-1384",
   "art": {
    "avatar": "assets/officials/historical/cbdb-1384/avatar.png",
    "full": "assets/officials/historical/cbdb-1384/full.png",
    "court": "assets/officials/historical/cbdb-1384/court.png"
   },
   "evidence_status": "现有人物简介可追溯",
   "design_basis": "北宋文学家、史学家，参与《新唐书》编修，奖掖苏轼等后进，并历任地方官。",
   "ui_archetype": "文臣谋士",
   "cost_basis": "费用统一支付身体、关键词与技能预算；不按名气定高费，不把智力直接换算成个人攻击。",
   "ui_requirements": [
    "使用关联人物现有头像与姓名",
    "服饰与时代、文武身份相符",
    "技能表现采用军令、兵器、阵形或军需，不画无史据法术",
    "史料不足沿用原作资源并标记待核，不据同名猜朝代"
   ]
  },
  {
   "id": "person_manual-1523",
   "person_id": "manual-1523",
   "name": "李斯",
   "type": "general",
   "kind": "source",
   "cost": 5,
   "attack": 2,
   "health": 5,
   "tags": [],
   "skill": "整肃军令",
   "enter": [
    {
     "op": "silence",
     "target": "enemy"
    },
    {
     "op": "armor",
     "n": 2
    }
   ],
   "death": [],
   "source": {
    "id": "manual-1523",
    "name": "李斯",
    "role": "文职",
    "martial": 12,
    "intelligence": 96,
    "leadership": 35,
    "tags": [
     "名相",
     "权臣"
    ],
    "biography": "秦朝丞相，推动统一制度，参与沙丘政变；制度建设能力强，政治操守存在严重污点。",
    "dynasty": "周",
    "source": "https://zh.wikipedia.org/?curid=13760",
    "sourceTitle": "维基百科：李斯（导言节录，CC BY-SA 4.0）",
    "historicalVerified": true
   },
   "historical_definition_id": "manual-1523",
   "art": {
    "avatar": "assets/officials/historical/manual-1523/avatar.png",
    "full": "assets/officials/historical/manual-1523/full.png",
    "court": "assets/officials/historical/manual-1523/court.png"
   },
   "evidence_status": "现有人物简介可追溯",
   "design_basis": "秦朝丞相，推动统一制度，参与沙丘政变；制度建设能力强，政治操守存在严重污点。",
   "ui_archetype": "文臣谋士",
   "cost_basis": "费用统一支付身体、关键词与技能预算；不按名气定高费，不把智力直接换算成个人攻击。",
   "ui_requirements": [
    "使用关联人物现有头像与姓名",
    "服饰与时代、文武身份相符",
    "技能表现采用军令、兵器、阵形或军需，不画无史据法术",
    "史料不足沿用原作资源并标记待核，不据同名猜朝代"
   ]
  },
  {
   "id": "person_original-4",
   "person_id": "original-4",
   "name": "张巡",
   "type": "general",
   "kind": "source",
   "cost": 5,
   "attack": 3,
   "health": 6,
   "tags": [
    "taunt"
   ],
   "skill": "孤城坚守",
   "enter": [
    {
     "op": "armor",
     "n": 3
    }
   ],
   "death": [],
   "source": {
    "id": "original-4",
    "name": "张巡",
    "role": "武将",
    "martial": 90,
    "intelligence": 58,
    "leadership": 90,
    "tags": [
     "原作人物"
    ],
    "biography": "原作特殊人物表收录，未匹配到现有人物史料。",
    "dynasty": "原作",
    "source": "",
    "sourceTitle": "原作反汇编人物表",
    "historicalVerified": false
   },
   "historical_definition_id": "original-4",
   "art": {
    "avatar": "assets/officials/historical/original-4/avatar.png",
    "full": "assets/officials/historical/original-4/full.png",
    "court": "assets/officials/historical/original-4/court.png"
   },
   "evidence_status": "原作模板，历史关联待补核",
   "design_basis": "原作特殊人物表收录，未匹配到现有人物史料。",
   "ui_archetype": "武将",
   "cost_basis": "费用统一支付身体、关键词与技能预算；不按名气定高费，不把智力直接换算成个人攻击。",
   "ui_requirements": [
    "使用关联人物现有头像与姓名",
    "服饰与时代、文武身份相符",
    "技能表现采用军令、兵器、阵形或军需，不画无史据法术",
    "史料不足沿用原作资源并标记待核，不据同名猜朝代"
   ]
  },
  {
   "id": "person_cbdb-17364",
   "person_id": "cbdb-17364",
   "name": "管仲",
   "type": "general",
   "kind": "source",
   "cost": 4,
   "attack": 2,
   "health": 4,
   "tags": [],
   "skill": "富国强兵",
   "enter": [
    {
     "op": "discount",
     "n": 1
    },
    {
     "op": "armor",
     "n": 2
    }
   ],
   "death": [],
   "source": {
    "id": "cbdb-17364",
    "name": "管仲",
    "role": "文职",
    "martial": 22,
    "intelligence": 98,
    "leadership": 65,
    "tags": [
     "名相",
     "改革者"
    ],
    "biography": "辅佐齐桓公改革内政与军制，推动齐国富强和诸侯霸业，是先秦重要政治家。",
    "dynasty": "汉前",
    "source": "https://zh.wikipedia.org/?curid=38041",
    "sourceTitle": "维基百科：管仲（导言节录，CC BY-SA 4.0）",
    "historicalVerified": true
   },
   "historical_definition_id": "cbdb-17364",
   "art": {
    "avatar": "assets/officials/historical/cbdb-17364/avatar.png",
    "full": "assets/officials/historical/cbdb-17364/full.png",
    "court": "assets/officials/historical/cbdb-17364/court.png"
   },
   "evidence_status": "现有人物简介可追溯",
   "design_basis": "辅佐齐桓公改革内政与军制，推动齐国富强和诸侯霸业，是先秦重要政治家。",
   "ui_archetype": "文臣谋士",
   "cost_basis": "费用统一支付身体、关键词与技能预算；不按名气定高费，不把智力直接换算成个人攻击。",
   "ui_requirements": [
    "使用关联人物现有头像与姓名",
    "服饰与时代、文武身份相符",
    "技能表现采用军令、兵器、阵形或军需，不画无史据法术",
    "史料不足沿用原作资源并标记待核，不据同名猜朝代"
   ]
  },
  {
   "id": "person_manual-1527",
   "person_id": "manual-1527",
   "name": "萧何",
   "type": "general",
   "kind": "source",
   "cost": 4,
   "attack": 2,
   "health": 5,
   "tags": [],
   "skill": "转饷不绝",
   "enter": [
    {
     "op": "draw",
     "n": 1,
     "filter": "troop"
    }
   ],
   "death": [],
   "source": {
    "id": "manual-1527",
    "name": "萧何",
    "role": "文职",
    "martial": 10,
    "intelligence": 96,
    "leadership": 34,
    "tags": [
     "名相"
    ],
    "biography": "西汉开国丞相，管理关中、供应军需并建立政务体系，后勤与行政能力极强。",
    "dynasty": "秦汉",
    "source": "https://zh.wikipedia.org/?curid=93952",
    "sourceTitle": "维基百科：萧何（导言节录，CC BY-SA 4.0）",
    "historicalVerified": true
   },
   "historical_definition_id": "manual-1527",
   "art": {
    "avatar": "assets/officials/historical/manual-1527/avatar.png",
    "full": "assets/officials/historical/manual-1527/full.png",
    "court": "assets/officials/historical/manual-1527/court.png"
   },
   "evidence_status": "现有人物简介可追溯",
   "design_basis": "西汉开国丞相，管理关中、供应军需并建立政务体系，后勤与行政能力极强。",
   "ui_archetype": "文臣谋士",
   "cost_basis": "费用统一支付身体、关键词与技能预算；不按名气定高费，不把智力直接换算成个人攻击。",
   "ui_requirements": [
    "使用关联人物现有头像与姓名",
    "服饰与时代、文武身份相符",
    "技能表现采用军令、兵器、阵形或军需，不画无史据法术",
    "史料不足沿用原作资源并标记待核，不据同名猜朝代"
   ]
  },
  {
   "id": "person_manual-1529",
   "person_id": "manual-1529",
   "name": "张良",
   "type": "general",
   "kind": "source",
   "cost": 4,
   "attack": 2,
   "health": 4,
   "tags": [],
   "skill": "帷幄决胜",
   "enter": [
    {
     "op": "draw",
     "n": 1,
     "filter": "tactic"
    }
   ],
   "death": [],
   "source": {
    "id": "manual-1529",
    "name": "张良",
    "role": "文职",
    "martial": 24,
    "intelligence": 99,
    "leadership": 78,
    "tags": [
     "谋臣"
    ],
    "biography": "辅佐刘邦夺取天下，善于战略谋划与政治判断，功成后逐步退出权力中心。",
    "dynasty": "秦汉",
    "source": "https://zh.wikipedia.org/?curid=15455",
    "sourceTitle": "维基百科：张良（导言节录，CC BY-SA 4.0）",
    "historicalVerified": true
   },
   "historical_definition_id": "manual-1529",
   "art": {
    "avatar": "assets/officials/historical/manual-1529/avatar.png",
    "full": "assets/officials/historical/manual-1529/full.png",
    "court": "assets/officials/historical/manual-1529/court.png"
   },
   "evidence_status": "现有人物简介可追溯",
   "design_basis": "辅佐刘邦夺取天下，善于战略谋划与政治判断，功成后逐步退出权力中心。",
   "ui_archetype": "文臣谋士",
   "cost_basis": "费用统一支付身体、关键词与技能预算；不按名气定高费，不把智力直接换算成个人攻击。",
   "ui_requirements": [
    "使用关联人物现有头像与姓名",
    "服饰与时代、文武身份相符",
    "技能表现采用军令、兵器、阵形或军需，不画无史据法术",
    "史料不足沿用原作资源并标记待核，不据同名猜朝代"
   ]
  },
  {
   "id": "person_original-8",
   "person_id": "original-8",
   "name": "魏徵",
   "type": "general",
   "kind": "source",
   "cost": 3,
   "attack": 2,
   "health": 4,
   "tags": [],
   "skill": "直谏",
   "enter": [
    {
     "op": "heal",
     "n": 2
    }
   ],
   "death": [],
   "source": {
    "id": "original-8",
    "name": "魏徵",
    "role": "文职",
    "martial": 55,
    "intelligence": 92,
    "leadership": 55,
    "tags": [
     "原作人物"
    ],
    "biography": "原作特殊人物表收录，未匹配到现有人物史料。",
    "dynasty": "原作",
    "source": "",
    "sourceTitle": "原作反汇编人物表",
    "historicalVerified": false
   },
   "historical_definition_id": "original-8",
   "art": {
    "avatar": "assets/officials/historical/original-8/avatar.png",
    "full": "assets/officials/historical/original-8/full.png",
    "court": "assets/officials/historical/original-8/court.png"
   },
   "evidence_status": "原作模板，历史关联待补核",
   "design_basis": "原作特殊人物表收录，未匹配到现有人物史料。",
   "ui_archetype": "文武兼长",
   "cost_basis": "费用统一支付身体、关键词与技能预算；不按名气定高费，不把智力直接换算成个人攻击。",
   "ui_requirements": [
    "使用关联人物现有头像与姓名",
    "服饰与时代、文武身份相符",
    "技能表现采用军令、兵器、阵形或军需，不画无史据法术",
    "史料不足沿用原作资源并标记待核，不据同名猜朝代"
   ]
  },
  {
   "id": "person_cbdb-8043",
   "person_id": "cbdb-8043",
   "name": "范仲淹",
   "type": "general",
   "kind": "source",
   "cost": 5,
   "attack": 3,
   "health": 5,
   "tags": [
    "taunt"
   ],
   "skill": "经略边防",
   "enter": [
    {
     "op": "buff",
     "a": 0,
     "h": 2,
     "mask": "foot",
     "target": "friend",
     "temp": false
    }
   ],
   "death": [],
   "source": {
    "id": "cbdb-8043",
    "name": "范仲淹",
    "role": "武将",
    "martial": 30,
    "intelligence": 95,
    "leadership": 83,
    "tags": [
     "名臣",
     "改革者"
    ],
    "biography": "北宋名臣，主持庆历新政，任陕西经略安抚招讨副使，兼具边防筹划与地方治理能力。",
    "dynasty": "宋",
    "source": "https://zh.wikipedia.org/?curid=83581",
    "sourceTitle": "维基百科：范仲淹（导言节录，CC BY-SA 4.0）",
    "historicalVerified": true
   },
   "historical_definition_id": "cbdb-8043",
   "art": {
    "avatar": "assets/officials/historical/cbdb-8043/avatar.png",
    "full": "assets/officials/historical/cbdb-8043/full.png",
    "court": "assets/officials/historical/cbdb-8043/court.png"
   },
   "evidence_status": "现有人物简介可追溯",
   "design_basis": "北宋名臣，主持庆历新政，任陕西经略安抚招讨副使，兼具边防筹划与地方治理能力。",
   "ui_archetype": "文臣谋士",
   "cost_basis": "费用统一支付身体、关键词与技能预算；不按名气定高费，不把智力直接换算成个人攻击。",
   "ui_requirements": [
    "使用关联人物现有头像与姓名",
    "服饰与时代、文武身份相符",
    "技能表现采用军令、兵器、阵形或军需，不画无史据法术",
    "史料不足沿用原作资源并标记待核，不据同名猜朝代"
   ]
  },
  {
   "id": "person_cbdb-34344",
   "person_id": "cbdb-34344",
   "name": "曾国藩",
   "type": "general",
   "kind": "source",
   "cost": 6,
   "attack": 3,
   "health": 6,
   "tags": [
    "taunt"
   ],
   "skill": "治军有方",
   "enter": [
    {
     "op": "group",
     "a": 0,
     "h": 1,
     "mask": "all",
     "limit": 2,
     "temp": false
    }
   ],
   "death": [],
   "source": {
    "id": "cbdb-34344",
    "name": "曾国藩",
    "role": "武将",
    "martial": 32,
    "intelligence": 95,
    "leadership": 94,
    "tags": [
     "名臣",
     "统帅"
    ],
    "biography": "清代湘军统帅，善建军、后勤和用人，参与镇压太平天国，功业与战争杀戮并存。",
    "dynasty": "清",
    "source": "https://zh.wikipedia.org/?curid=8457",
    "sourceTitle": "维基百科：曾国藩（导言节录，CC BY-SA 4.0）",
    "historicalVerified": true
   },
   "historical_definition_id": "cbdb-34344",
   "art": {
    "avatar": "assets/officials/historical/cbdb-34344/avatar.png",
    "full": "assets/officials/historical/cbdb-34344/full.png",
    "court": "assets/officials/historical/cbdb-34344/court.png"
   },
   "evidence_status": "现有人物简介可追溯",
   "design_basis": "清代湘军统帅，善建军、后勤和用人，参与镇压太平天国，功业与战争杀戮并存。",
   "ui_archetype": "文臣谋士",
   "cost_basis": "费用统一支付身体、关键词与技能预算；不按名气定高费，不把智力直接换算成个人攻击。",
   "ui_requirements": [
    "使用关联人物现有头像与姓名",
    "服饰与时代、文武身份相符",
    "技能表现采用军令、兵器、阵形或军需，不画无史据法术",
    "史料不足沿用原作资源并标记待核，不据同名猜朝代"
   ]
  },
  {
   "id": "person_cbdb-1762",
   "person_id": "cbdb-1762",
   "name": "王安石",
   "type": "general",
   "kind": "source",
   "cost": 4,
   "attack": 2,
   "health": 4,
   "tags": [],
   "skill": "新法整备",
   "enter": [
    {
     "op": "discount",
     "n": 1
    },
    {
     "op": "heal",
     "n": 2
    }
   ],
   "death": [],
   "source": {
    "id": "cbdb-1762",
    "name": "王安石",
    "role": "文职",
    "martial": 15,
    "intelligence": 97,
    "leadership": 45,
    "tags": [
     "改革名臣"
    ],
    "biography": "北宋宰相，主持熙宁变法，推行青苗、募役等法；改革能力突出，政策及用人争议并存。",
    "dynasty": "宋",
    "source": "https://zh.wikipedia.org/?curid=16067",
    "sourceTitle": "维基百科：王安石（导言节录，CC BY-SA 4.0）",
    "historicalVerified": true
   },
   "historical_definition_id": "cbdb-1762",
   "art": {
    "avatar": "assets/officials/historical/cbdb-1762/avatar.png",
    "full": "assets/officials/historical/cbdb-1762/full.png",
    "court": "assets/officials/historical/cbdb-1762/court.png"
   },
   "evidence_status": "现有人物简介可追溯",
   "design_basis": "北宋宰相，主持熙宁变法，推行青苗、募役等法；改革能力突出，政策及用人争议并存。",
   "ui_archetype": "文臣谋士",
   "cost_basis": "费用统一支付身体、关键词与技能预算；不按名气定高费，不把智力直接换算成个人攻击。",
   "ui_requirements": [
    "使用关联人物现有头像与姓名",
    "服饰与时代、文武身份相符",
    "技能表现采用军令、兵器、阵形或军需，不画无史据法术",
    "史料不足沿用原作资源并标记待核，不据同名猜朝代"
   ]
  },
  {
   "id": "person_manual-1510",
   "person_id": "manual-1510",
   "name": "商鞅",
   "type": "general",
   "kind": "source",
   "cost": 4,
   "attack": 2,
   "health": 4,
   "tags": [],
   "skill": "军功励战",
   "enter": [
    {
     "op": "buff",
     "a": 2,
     "h": 0,
     "mask": "all",
     "target": "friend",
     "temp": true
    }
   ],
   "death": [],
   "source": {
    "id": "manual-1510",
    "name": "商鞅",
    "role": "文职",
    "martial": 20,
    "intelligence": 96,
    "leadership": 65,
    "tags": [
     "改革者"
    ],
    "biography": "在秦国主持变法，推行军功爵制与县制等措施，强化国家组织，也因严刑峻法而有争议。",
    "dynasty": "周",
    "source": "https://zh.wikipedia.org/?curid=5851",
    "sourceTitle": "维基百科：商鞅（导言节录，CC BY-SA 4.0）",
    "historicalVerified": true
   },
   "historical_definition_id": "manual-1510",
   "art": {
    "avatar": "assets/officials/historical/manual-1510/avatar.png",
    "full": "assets/officials/historical/manual-1510/full.png",
    "court": "assets/officials/historical/manual-1510/court.png"
   },
   "evidence_status": "现有人物简介可追溯",
   "design_basis": "在秦国主持变法，推行军功爵制与县制等措施，强化国家组织，也因严刑峻法而有争议。",
   "ui_archetype": "文臣谋士",
   "cost_basis": "费用统一支付身体、关键词与技能预算；不按名气定高费，不把智力直接换算成个人攻击。",
   "ui_requirements": [
    "使用关联人物现有头像与姓名",
    "服饰与时代、文武身份相符",
    "技能表现采用军令、兵器、阵形或军需，不画无史据法术",
    "史料不足沿用原作资源并标记待核，不据同名猜朝代"
   ]
  },
  {
   "id": "person_manual-1629",
   "person_id": "manual-1629",
   "name": "左宗棠",
   "type": "general",
   "kind": "source",
   "cost": 6,
   "attack": 3,
   "health": 5,
   "tags": [],
   "skill": "筹饷西征",
   "enter": [
    {
     "op": "draw",
     "n": 1,
     "filter": "high"
    },
    {
     "op": "armor",
     "n": 2
    }
   ],
   "death": [],
   "source": {
    "id": "manual-1629",
    "name": "左宗棠",
    "role": "武将",
    "martial": 44,
    "intelligence": 96,
    "leadership": 96,
    "tags": [
     "名臣",
     "统帅"
    ],
    "biography": "清代重臣，经营西北、收复新疆，重视后勤、工业与边疆治理。",
    "dynasty": "清",
    "source": "https://zh.wikipedia.org/?curid=105623",
    "sourceTitle": "维基百科：左宗棠（导言节录，CC BY-SA 4.0）",
    "historicalVerified": true
   },
   "historical_definition_id": "manual-1629",
   "art": {
    "avatar": "assets/officials/historical/manual-1629/avatar.png",
    "full": "assets/officials/historical/manual-1629/full.png",
    "court": "assets/officials/historical/manual-1629/court.png"
   },
   "evidence_status": "现有人物简介可追溯",
   "design_basis": "清代重臣，经营西北、收复新疆，重视后勤、工业与边疆治理。",
   "ui_archetype": "文武兼长",
   "cost_basis": "费用统一支付身体、关键词与技能预算；不按名气定高费，不把智力直接换算成个人攻击。",
   "ui_requirements": [
    "使用关联人物现有头像与姓名",
    "服饰与时代、文武身份相符",
    "技能表现采用军令、兵器、阵形或军需，不画无史据法术",
    "史料不足沿用原作资源并标记待核，不据同名猜朝代"
   ]
  },
  {
   "id": "person_original-14",
   "person_id": "original-14",
   "name": "朱庆国",
   "type": "general",
   "kind": "source",
   "cost": 4,
   "attack": 3,
   "health": 5,
   "tags": [],
   "skill": "筹划",
   "enter": [
    {
     "op": "armor",
     "n": 2
    }
   ],
   "death": [],
   "source": {
    "id": "original-14",
    "name": "朱庆国",
    "role": "文职",
    "martial": 60,
    "intelligence": 91,
    "leadership": 60,
    "tags": [
     "原作人物"
    ],
    "biography": "原作特殊人物表收录，未匹配到现有人物史料。",
    "dynasty": "原作",
    "source": "",
    "sourceTitle": "原作反汇编人物表",
    "historicalVerified": false
   },
   "historical_definition_id": "original-14",
   "art": {
    "avatar": "assets/officials/historical/original-14/avatar.png",
    "full": "assets/officials/historical/original-14/full.png",
    "court": "assets/officials/historical/original-14/court.png"
   },
   "evidence_status": "原作模板，历史关联待补核",
   "design_basis": "原作特殊人物表收录，未匹配到现有人物史料。",
   "ui_archetype": "文武兼长",
   "cost_basis": "费用统一支付身体、关键词与技能预算；不按名气定高费，不把智力直接换算成个人攻击。",
   "ui_requirements": [
    "使用关联人物现有头像与姓名",
    "服饰与时代、文武身份相符",
    "技能表现采用军令、兵器、阵形或军需，不画无史据法术",
    "史料不足沿用原作资源并标记待核，不据同名猜朝代"
   ]
  },
  {
   "id": "person_manual-1543",
   "person_id": "manual-1543",
   "name": "班超",
   "type": "general",
   "kind": "source",
   "cost": 5,
   "attack": 4,
   "health": 4,
   "tags": [
    "rush"
   ],
   "skill": "经营西域",
   "enter": [
    {
     "op": "draw",
     "n": 1
    }
   ],
   "death": [],
   "source": {
    "id": "manual-1543",
    "name": "班超",
    "role": "武将",
    "martial": 78,
    "intelligence": 94,
    "leadership": 92,
    "tags": [
     "名将",
     "外交家"
    ],
    "biography": "东汉经营西域的将领，以军事和外交手段恢复汉朝在西域的影响。",
    "dynasty": "秦汉",
    "source": "https://zh.wikipedia.org/?curid=13520",
    "sourceTitle": "维基百科：班超（导言节录，CC BY-SA 4.0）",
    "historicalVerified": true
   },
   "historical_definition_id": "manual-1543",
   "art": {
    "avatar": "assets/officials/historical/manual-1543/avatar.png",
    "full": "assets/officials/historical/manual-1543/full.png",
    "court": "assets/officials/historical/manual-1543/court.png"
   },
   "evidence_status": "现有人物简介可追溯",
   "design_basis": "东汉经营西域的将领，以军事和外交手段恢复汉朝在西域的影响。",
   "ui_archetype": "文武兼长",
   "cost_basis": "费用统一支付身体、关键词与技能预算；不按名气定高费，不把智力直接换算成个人攻击。",
   "ui_requirements": [
    "使用关联人物现有头像与姓名",
    "服饰与时代、文武身份相符",
    "技能表现采用军令、兵器、阵形或军需，不画无史据法术",
    "史料不足沿用原作资源并标记待核，不据同名猜朝代"
   ]
  },
  {
   "id": "person_original-16",
   "person_id": "original-16",
   "name": "公孙侨",
   "type": "general",
   "kind": "source",
   "cost": 3,
   "attack": 2,
   "health": 3,
   "tags": [],
   "skill": "宽政养民",
   "enter": [
    {
     "op": "heal",
     "n": 4
    }
   ],
   "death": [],
   "source": {
    "id": "original-16",
    "name": "公孙侨",
    "role": "文职",
    "martial": 46,
    "intelligence": 93,
    "leadership": 46,
    "tags": [
     "原作人物"
    ],
    "biography": "原作特殊人物表收录，未匹配到现有人物史料。",
    "dynasty": "原作",
    "source": "",
    "sourceTitle": "原作反汇编人物表",
    "historicalVerified": false
   },
   "historical_definition_id": "original-16",
   "art": {
    "avatar": "assets/officials/historical/original-16/avatar.png",
    "full": "assets/officials/historical/original-16/full.png",
    "court": "assets/officials/historical/original-16/court.png"
   },
   "evidence_status": "原作模板，历史关联待补核",
   "design_basis": "原作特殊人物表收录，未匹配到现有人物史料。",
   "ui_archetype": "文武兼长",
   "cost_basis": "费用统一支付身体、关键词与技能预算；不按名气定高费，不把智力直接换算成个人攻击。",
   "ui_requirements": [
    "使用关联人物现有头像与姓名",
    "服饰与时代、文武身份相符",
    "技能表现采用军令、兵器、阵形或军需，不画无史据法术",
    "史料不足沿用原作资源并标记待核，不据同名猜朝代"
   ]
  },
  {
   "id": "person_manual-1530",
   "person_id": "manual-1530",
   "name": "韩信",
   "type": "general",
   "kind": "source",
   "cost": 7,
   "attack": 4,
   "health": 6,
   "tags": [],
   "skill": "多多益善",
   "enter": [
    {
     "op": "group",
     "a": 1,
     "h": 1,
     "mask": "all",
     "limit": 2,
     "temp": false
    }
   ],
   "death": [],
   "source": {
    "id": "manual-1530",
    "name": "韩信",
    "role": "武将",
    "martial": 78,
    "intelligence": 98,
    "leadership": 99,
    "tags": [
     "名将",
     "军事家"
    ],
    "biography": "西汉开国将领，破魏、赵、齐，参与垓下之战，以战略机动与临敌指挥著称。",
    "dynasty": "秦汉",
    "source": "https://zh.wikipedia.org/?curid=69222",
    "sourceTitle": "维基百科：韩信（导言节录，CC BY-SA 4.0）",
    "historicalVerified": true
   },
   "historical_definition_id": "manual-1530",
   "art": {
    "avatar": "assets/officials/historical/manual-1530/avatar.png",
    "full": "assets/officials/historical/manual-1530/full.png",
    "court": "assets/officials/historical/manual-1530/court.png"
   },
   "evidence_status": "现有人物简介可追溯",
   "design_basis": "西汉开国将领，破魏、赵、齐，参与垓下之战，以战略机动与临敌指挥著称。",
   "ui_archetype": "文武兼长",
   "cost_basis": "费用统一支付身体、关键词与技能预算；不按名气定高费，不把智力直接换算成个人攻击。",
   "ui_requirements": [
    "使用关联人物现有头像与姓名",
    "服饰与时代、文武身份相符",
    "技能表现采用军令、兵器、阵形或军需，不画无史据法术",
    "史料不足沿用原作资源并标记待核，不据同名猜朝代"
   ]
  },
  {
   "id": "person_general-874-55746",
   "person_id": "general-874-55746",
   "name": "施琅",
   "type": "general",
   "kind": "source",
   "cost": 5,
   "attack": 4,
   "health": 5,
   "tags": [],
   "skill": "协同进击",
   "enter": [
    {
     "op": "buff",
     "a": 1,
     "h": 1,
     "mask": "ranged",
     "target": "friend",
     "temp": false
    }
   ],
   "death": [],
   "source": {
    "id": "general-874-55746",
    "name": "施琅",
    "role": "武将",
    "martial": 77,
    "intelligence": 91,
    "leadership": 94,
    "tags": [
     "名将"
    ],
    "biography": "明清之际海军将领，澎湖之战获胜并促成清朝控制台湾，长于海战与航海组织。",
    "dynasty": "清",
    "source": "https://zh.wikipedia.org/?curid=38071",
    "sourceTitle": "维基百科：施琅（导言节录，CC BY-SA 4.0）",
    "historicalVerified": true
   },
   "historical_definition_id": "general-874-55746",
   "art": {
    "avatar": "assets/officials/historical/general-874-55746/avatar.png",
    "full": "assets/officials/historical/general-874-55746/full.png",
    "court": "assets/officials/historical/general-874-55746/court.png"
   },
   "evidence_status": "现有人物简介可追溯",
   "design_basis": "明清之际海军将领，澎湖之战获胜并促成清朝控制台湾，长于海战与航海组织。",
   "ui_archetype": "文武兼长",
   "cost_basis": "费用统一支付身体、关键词与技能预算；不按名气定高费，不把智力直接换算成个人攻击。",
   "ui_requirements": [
    "使用关联人物现有头像与姓名",
    "服饰与时代、文武身份相符",
    "技能表现采用军令、兵器、阵形或军需，不画无史据法术",
    "史料不足沿用原作资源并标记待核，不据同名猜朝代"
   ]
  },
  {
   "id": "person_manual-1519",
   "person_id": "manual-1519",
   "name": "蔺相如",
   "type": "general",
   "kind": "source",
   "cost": 4,
   "attack": 2,
   "health": 5,
   "tags": [],
   "skill": "顾全大局",
   "enter": [
    {
     "op": "buff",
     "a": 0,
     "h": 0,
     "give": "shield",
     "target": "friend"
    }
   ],
   "death": [],
   "source": {
    "id": "manual-1519",
    "name": "蔺相如",
    "role": "武将",
    "martial": 24,
    "intelligence": 95,
    "leadership": 35,
    "tags": [
     "名臣",
     "外交家"
    ],
    "biography": "赵国大臣，完璧归赵、渑池会等事见于《史记》，以外交胆识和顾全大局著称。",
    "dynasty": "周",
    "source": "https://zh.wikipedia.org/?curid=103486",
    "sourceTitle": "维基百科：蔺相如（导言节录，CC BY-SA 4.0）",
    "historicalVerified": true
   },
   "historical_definition_id": "manual-1519",
   "art": {
    "avatar": "assets/officials/historical/manual-1519/avatar.png",
    "full": "assets/officials/historical/manual-1519/full.png",
    "court": "assets/officials/historical/manual-1519/court.png"
   },
   "evidence_status": "现有人物简介可追溯",
   "design_basis": "赵国大臣，完璧归赵、渑池会等事见于《史记》，以外交胆识和顾全大局著称。",
   "ui_archetype": "文臣谋士",
   "cost_basis": "费用统一支付身体、关键词与技能预算；不按名气定高费，不把智力直接换算成个人攻击。",
   "ui_requirements": [
    "使用关联人物现有头像与姓名",
    "服饰与时代、文武身份相符",
    "技能表现采用军令、兵器、阵形或军需，不画无史据法术",
    "史料不足沿用原作资源并标记待核，不据同名猜朝代"
   ]
  },
  {
   "id": "person_manual-1579",
   "person_id": "manual-1579",
   "name": "房玄龄",
   "type": "general",
   "kind": "source",
   "cost": 4,
   "attack": 2,
   "health": 4,
   "tags": [],
   "skill": "房谋",
   "enter": [
    {
     "op": "draw",
     "n": 1,
     "filter": "low"
    },
    {
     "op": "armor",
     "n": 1
    }
   ],
   "death": [],
   "source": {
    "id": "manual-1579",
    "name": "房玄龄",
    "role": "文职",
    "martial": 10,
    "intelligence": 96,
    "leadership": 42,
    "tags": [
     "名相"
    ],
    "biography": "唐太宗重臣，参与政务与制度建设，善于谋划、用人和协调。",
    "dynasty": "唐",
    "source": "https://zh.wikipedia.org/?curid=78968",
    "sourceTitle": "维基百科：房玄龄（导言节录，CC BY-SA 4.0）",
    "historicalVerified": true
   },
   "historical_definition_id": "manual-1579",
   "art": {
    "avatar": "assets/officials/historical/manual-1579/avatar.png",
    "full": "assets/officials/historical/manual-1579/full.png",
    "court": "assets/officials/historical/manual-1579/court.png"
   },
   "evidence_status": "现有人物简介可追溯",
   "design_basis": "唐太宗重臣，参与政务与制度建设，善于谋划、用人和协调。",
   "ui_archetype": "文臣谋士",
   "cost_basis": "费用统一支付身体、关键词与技能预算；不按名气定高费，不把智力直接换算成个人攻击。",
   "ui_requirements": [
    "使用关联人物现有头像与姓名",
    "服饰与时代、文武身份相符",
    "技能表现采用军令、兵器、阵形或军需，不画无史据法术",
    "史料不足沿用原作资源并标记待核，不据同名猜朝代"
   ]
  },
  {
   "id": "person_manual-1509",
   "person_id": "manual-1509",
   "name": "晏婴",
   "type": "general",
   "kind": "source",
   "cost": 3,
   "attack": 2,
   "health": 4,
   "tags": [],
   "skill": "节用",
   "enter": [
    {
     "op": "discount",
     "n": 1
    }
   ],
   "death": [],
   "source": {
    "id": "manual-1509",
    "name": "晏婴",
    "role": "文职",
    "martial": 8,
    "intelligence": 94,
    "leadership": 30,
    "tags": [
     "名臣",
     "外交家"
    ],
    "biography": "春秋齐国大臣，辅佐数代国君，善于外交应对，以节俭和敢谏著称。",
    "dynasty": "周",
    "source": "https://zh.wikipedia.org/?curid=1446",
    "sourceTitle": "维基百科：晏婴（导言节录，CC BY-SA 4.0）",
    "historicalVerified": true
   },
   "historical_definition_id": "manual-1509",
   "art": {
    "avatar": "assets/officials/historical/manual-1509/avatar.png",
    "full": "assets/officials/historical/manual-1509/full.png",
    "court": "assets/officials/historical/manual-1509/court.png"
   },
   "evidence_status": "现有人物简介可追溯",
   "design_basis": "春秋齐国大臣，辅佐数代国君，善于外交应对，以节俭和敢谏著称。",
   "ui_archetype": "文臣谋士",
   "cost_basis": "费用统一支付身体、关键词与技能预算；不按名气定高费，不把智力直接换算成个人攻击。",
   "ui_requirements": [
    "使用关联人物现有头像与姓名",
    "服饰与时代、文武身份相符",
    "技能表现采用军令、兵器、阵形或军需，不画无史据法术",
    "史料不足沿用原作资源并标记待核，不据同名猜朝代"
   ]
  },
  {
   "id": "person_general-113-60981",
   "person_id": "general-113-60981",
   "name": "苏武",
   "type": "general",
   "kind": "source",
   "cost": 3,
   "attack": 1,
   "health": 5,
   "tags": [
    "taunt"
   ],
   "skill": "持节",
   "enter": [
    {
     "op": "armor",
     "n": 2
    }
   ],
   "death": [],
   "source": {
    "id": "general-113-60981",
    "name": "苏武",
    "role": "武将",
    "martial": 26,
    "intelligence": 82,
    "leadership": 25,
    "tags": [
     "忠臣",
     "使节"
    ],
    "biography": "西汉使者，出使匈奴后长期被扣留而守节，最终归汉。",
    "dynasty": "秦汉",
    "source": "https://zh.wikipedia.org/?curid=110844",
    "sourceTitle": "维基百科：苏武（导言节录，CC BY-SA 4.0）",
    "historicalVerified": true
   },
   "historical_definition_id": "general-113-60981",
   "art": {
    "avatar": "assets/officials/historical/general-113-60981/avatar.png",
    "full": "assets/officials/historical/general-113-60981/full.png",
    "court": "assets/officials/historical/general-113-60981/court.png"
   },
   "evidence_status": "现有人物简介可追溯",
   "design_basis": "西汉使者，出使匈奴后长期被扣留而守节，最终归汉。",
   "ui_archetype": "文臣谋士",
   "cost_basis": "费用统一支付身体、关键词与技能预算；不按名气定高费，不把智力直接换算成个人攻击。",
   "ui_requirements": [
    "使用关联人物现有头像与姓名",
    "服饰与时代、文武身份相符",
    "技能表现采用军令、兵器、阵形或军需，不画无史据法术",
    "史料不足沿用原作资源并标记待核，不据同名猜朝代"
   ]
  },
  {
   "id": "person_cbdb-898",
   "person_id": "cbdb-898",
   "name": "寇准",
   "type": "general",
   "kind": "source",
   "cost": 4,
   "attack": 2,
   "health": 4,
   "tags": [],
   "skill": "临危决断",
   "enter": [
    {
     "op": "freeze",
     "target": "enemy"
    },
    {
     "op": "armor",
     "n": 1
    }
   ],
   "death": [],
   "source": {
    "id": "cbdb-898",
    "name": "寇准",
    "role": "文职",
    "martial": 16,
    "intelligence": 93,
    "leadership": 47,
    "tags": [
     "名臣"
    ],
    "biography": "北宋宰相，澶渊之役力主真宗亲征，敢于决断，以刚直著称。",
    "dynasty": "宋",
    "source": "https://zh.wikipedia.org/?curid=98792",
    "sourceTitle": "维基百科：寇准（导言节录，CC BY-SA 4.0）",
    "historicalVerified": true
   },
   "historical_definition_id": "cbdb-898",
   "art": {
    "avatar": "assets/officials/historical/cbdb-898/avatar.png",
    "full": "assets/officials/historical/cbdb-898/full.png",
    "court": "assets/officials/historical/cbdb-898/court.png"
   },
   "evidence_status": "现有人物简介可追溯",
   "design_basis": "北宋宰相，澶渊之役力主真宗亲征，敢于决断，以刚直著称。",
   "ui_archetype": "文臣谋士",
   "cost_basis": "费用统一支付身体、关键词与技能预算；不按名气定高费，不把智力直接换算成个人攻击。",
   "ui_requirements": [
    "使用关联人物现有头像与姓名",
    "服饰与时代、文武身份相符",
    "技能表现采用军令、兵器、阵形或军需，不画无史据法术",
    "史料不足沿用原作资源并标记待核，不据同名猜朝代"
   ]
  },
  {
   "id": "person_manual-1544",
   "person_id": "manual-1544",
   "name": "马援",
   "type": "general",
   "kind": "source",
   "cost": 5,
   "attack": 4,
   "health": 5,
   "tags": [],
   "skill": "老当益壮",
   "enter": [
    {
     "op": "buff",
     "a": 1,
     "h": 2,
     "mask": "foot",
     "target": "friend",
     "temp": false
    }
   ],
   "death": [],
   "source": {
    "id": "manual-1544",
    "name": "马援",
    "role": "武将",
    "martial": 87,
    "intelligence": 88,
    "leadership": 92,
    "tags": [
     "名将"
    ],
    "biography": "东汉名将，参与平定陇右、交趾等战事，以老当益壮的形象著称。",
    "dynasty": "秦汉",
    "source": "https://zh.wikipedia.org/?curid=135961",
    "sourceTitle": "维基百科：马援（导言节录，CC BY-SA 4.0）",
    "historicalVerified": true
   },
   "historical_definition_id": "manual-1544",
   "art": {
    "avatar": "assets/officials/historical/manual-1544/avatar.png",
    "full": "assets/officials/historical/manual-1544/full.png",
    "court": "assets/officials/historical/manual-1544/court.png"
   },
   "evidence_status": "现有人物简介可追溯",
   "design_basis": "东汉名将，参与平定陇右、交趾等战事，以老当益壮的形象著称。",
   "ui_archetype": "武将",
   "cost_basis": "费用统一支付身体、关键词与技能预算；不按名气定高费，不把智力直接换算成个人攻击。",
   "ui_requirements": [
    "使用关联人物现有头像与姓名",
    "服饰与时代、文武身份相符",
    "技能表现采用军令、兵器、阵形或军需，不画无史据法术",
    "史料不足沿用原作资源并标记待核，不据同名猜朝代"
   ]
  },
  {
   "id": "person_general-296-67948",
   "person_id": "general-296-67948",
   "name": "祖逖",
   "type": "general",
   "kind": "source",
   "cost": 5,
   "attack": 4,
   "health": 4,
   "tags": [
    "rush"
   ],
   "skill": "击楫进取",
   "enter": [
    {
     "op": "armor",
     "n": 2
    }
   ],
   "death": [],
   "source": {
    "id": "general-296-67948",
    "name": "祖逖",
    "role": "武将",
    "martial": 83,
    "intelligence": 89,
    "leadership": 91,
    "tags": [
     "名将"
    ],
    "biography": "东晋北伐将领，恢复黄河以南部分地区，以恢复中原的志向著称。",
    "dynasty": "两晋南北朝",
    "source": "https://zh.wikipedia.org/?curid=187760",
    "sourceTitle": "维基百科：祖逖（导言节录，CC BY-SA 4.0）",
    "historicalVerified": true
   },
   "historical_definition_id": "general-296-67948",
   "art": {
    "avatar": "assets/officials/historical/general-296-67948/avatar.png",
    "full": "assets/officials/historical/general-296-67948/full.png",
    "court": "assets/officials/historical/general-296-67948/court.png"
   },
   "evidence_status": "现有人物简介可追溯",
   "design_basis": "东晋北伐将领，恢复黄河以南部分地区，以恢复中原的志向著称。",
   "ui_archetype": "武将",
   "cost_basis": "费用统一支付身体、关键词与技能预算；不按名气定高费，不把智力直接换算成个人攻击。",
   "ui_requirements": [
    "使用关联人物现有头像与姓名",
    "服饰与时代、文武身份相符",
    "技能表现采用军令、兵器、阵形或军需，不画无史据法术",
    "史料不足沿用原作资源并标记待核，不据同名猜朝代"
   ]
  },
  {
   "id": "person_general-790-68223",
   "person_id": "general-790-68223",
   "name": "吴三桂",
   "type": "general",
   "kind": "source",
   "cost": 5,
   "attack": 4,
   "health": 4,
   "tags": [
    "rush"
   ],
   "skill": "关山突进",
   "enter": [
    {
     "op": "buff",
     "a": 1,
     "h": 0,
     "mask": "cavalry",
     "target": "friend",
     "temp": true
    }
   ],
   "death": [],
   "source": {
    "id": "general-790-68223",
    "name": "吴三桂",
    "role": "武将",
    "martial": 90,
    "intelligence": 88,
    "leadership": 93,
    "tags": [
     "权臣",
     "争议人物"
    ],
    "biography": "明末清初将领，山海关引清军入关，后成为清朝藩王并发动三藩之乱。",
    "dynasty": "明",
    "source": "https://zh.wikipedia.org/?curid=48763",
    "sourceTitle": "维基百科：吴三桂（导言节录，CC BY-SA 4.0）",
    "historicalVerified": true
   },
   "historical_definition_id": "general-790-68223",
   "art": {
    "avatar": "assets/officials/historical/general-790-68223/avatar.png",
    "full": "assets/officials/historical/general-790-68223/full.png",
    "court": "assets/officials/historical/general-790-68223/court.png"
   },
   "evidence_status": "现有人物简介可追溯",
   "design_basis": "明末清初将领，山海关引清军入关，后成为清朝藩王并发动三藩之乱。",
   "ui_archetype": "武将",
   "cost_basis": "费用统一支付身体、关键词与技能预算；不按名气定高费，不把智力直接换算成个人攻击。",
   "ui_requirements": [
    "使用关联人物现有头像与姓名",
    "服饰与时代、文武身份相符",
    "技能表现采用军令、兵器、阵形或军需，不画无史据法术",
    "史料不足沿用原作资源并标记待核，不据同名猜朝代"
   ]
  },
  {
   "id": "person_cbdb-94373",
   "person_id": "cbdb-94373",
   "name": "郭子仪",
   "type": "general",
   "kind": "source",
   "cost": 6,
   "attack": 4,
   "health": 6,
   "tags": [
    "taunt"
   ],
   "skill": "中兴定军",
   "enter": [
    {
     "op": "armor",
     "n": 4
    }
   ],
   "death": [],
   "source": {
    "id": "cbdb-94373",
    "name": "郭子仪",
    "role": "武将",
    "martial": 84,
    "intelligence": 94,
    "leadership": 98,
    "tags": [
     "名将",
     "重臣"
    ],
    "biography": "唐朝中兴名将，平定安史之乱、稳定边防，政治处事稳健，功高而能保全。",
    "dynasty": "唐",
    "source": "https://zh.wikipedia.org/?curid=1007698",
    "sourceTitle": "维基百科：郭子仪（导言节录，CC BY-SA 4.0）",
    "historicalVerified": true
   },
   "historical_definition_id": "cbdb-94373",
   "art": {
    "avatar": "assets/officials/historical/cbdb-94373/avatar.png",
    "full": "assets/officials/historical/cbdb-94373/full.png",
    "court": "assets/officials/historical/cbdb-94373/court.png"
   },
   "evidence_status": "现有人物简介可追溯",
   "design_basis": "唐朝中兴名将，平定安史之乱、稳定边防，政治处事稳健，功高而能保全。",
   "ui_archetype": "武将",
   "cost_basis": "费用统一支付身体、关键词与技能预算；不按名气定高费，不把智力直接换算成个人攻击。",
   "ui_requirements": [
    "使用关联人物现有头像与姓名",
    "服饰与时代、文武身份相符",
    "技能表现采用军令、兵器、阵形或军需，不画无史据法术",
    "史料不足沿用原作资源并标记待核，不据同名猜朝代"
   ]
  },
  {
   "id": "person_general-298-58873",
   "person_id": "general-298-58873",
   "name": "陶侃",
   "type": "general",
   "kind": "source",
   "cost": 5,
   "attack": 3,
   "health": 5,
   "tags": [
    "taunt"
   ],
   "skill": "勤修军备",
   "enter": [
    {
     "op": "draw",
     "n": 1,
     "filter": "low"
    }
   ],
   "death": [],
   "source": {
    "id": "general-298-58873",
    "name": "陶侃",
    "role": "武将",
    "martial": 66,
    "intelligence": 88,
    "leadership": 91,
    "tags": [
     "名将",
     "能臣"
    ],
    "biography": "东晋重臣，参与平定苏峻之乱，长期治理荆州，重视勤政与军备。",
    "dynasty": "两晋南北朝",
    "source": "https://zh.wikipedia.org/?curid=302095",
    "sourceTitle": "维基百科：陶侃（导言节录，CC BY-SA 4.0）",
    "historicalVerified": true
   },
   "historical_definition_id": "general-298-58873",
   "art": {
    "avatar": "assets/officials/historical/general-298-58873/avatar.png",
    "full": "assets/officials/historical/general-298-58873/full.png",
    "court": "assets/officials/historical/general-298-58873/court.png"
   },
   "evidence_status": "现有人物简介可追溯",
   "design_basis": "东晋重臣，参与平定苏峻之乱，长期治理荆州，重视勤政与军备。",
   "ui_archetype": "文武兼长",
   "cost_basis": "费用统一支付身体、关键词与技能预算；不按名气定高费，不把智力直接换算成个人攻击。",
   "ui_requirements": [
    "使用关联人物现有头像与姓名",
    "服饰与时代、文武身份相符",
    "技能表现采用军令、兵器、阵形或军需，不画无史据法术",
    "史料不足沿用原作资源并标记待核，不据同名猜朝代"
   ]
  },
  {
   "id": "person_original-29",
   "person_id": "original-29",
   "name": "谢安",
   "type": "general",
   "kind": "source",
   "cost": 5,
   "attack": 3,
   "health": 5,
   "tags": [],
   "skill": "从容定策",
   "enter": [
    {
     "op": "freeze",
     "target": "enemy"
    },
    {
     "op": "draw",
     "n": 1
    }
   ],
   "death": [],
   "source": {
    "id": "original-29",
    "name": "谢安",
    "role": "文职",
    "martial": 83,
    "intelligence": 92,
    "leadership": 83,
    "tags": [
     "原作人物"
    ],
    "biography": "原作特殊人物表收录，未匹配到现有人物史料。",
    "dynasty": "原作",
    "source": "",
    "sourceTitle": "原作反汇编人物表",
    "historicalVerified": false
   },
   "historical_definition_id": "original-29",
   "art": {
    "avatar": "assets/officials/historical/original-29/avatar.png",
    "full": "assets/officials/historical/original-29/full.png",
    "court": "assets/officials/historical/original-29/court.png"
   },
   "evidence_status": "原作模板，历史关联待补核",
   "design_basis": "原作特殊人物表收录，未匹配到现有人物史料。",
   "ui_archetype": "武将",
   "cost_basis": "费用统一支付身体、关键词与技能预算；不按名气定高费，不把智力直接换算成个人攻击。",
   "ui_requirements": [
    "使用关联人物现有头像与姓名",
    "服饰与时代、文武身份相符",
    "技能表现采用军令、兵器、阵形或军需，不画无史据法术",
    "史料不足沿用原作资源并标记待核，不据同名猜朝代"
   ]
  },
  {
   "id": "person_manual-1582",
   "person_id": "manual-1582",
   "name": "李靖",
   "type": "general",
   "kind": "source",
   "cost": 6,
   "attack": 4,
   "health": 5,
   "tags": [
    "rush"
   ],
   "skill": "多路协同",
   "enter": [
    {
     "op": "buff",
     "a": 1,
     "h": 1,
     "mask": "cavalry",
     "target": "friend",
     "temp": false
    }
   ],
   "death": [],
   "source": {
    "id": "manual-1582",
    "name": "李靖",
    "role": "武将",
    "martial": 82,
    "intelligence": 98,
    "leadership": 99,
    "tags": [
     "名将",
     "军事家"
    ],
    "biography": "唐初统帅，平辅公祏、破东突厥、征吐谷浑，长于战略机动与多路协同。",
    "dynasty": "唐",
    "source": "https://zh.wikipedia.org/?curid=1160",
    "sourceTitle": "维基百科：李靖（导言节录，CC BY-SA 4.0）",
    "historicalVerified": true
   },
   "historical_definition_id": "manual-1582",
   "art": {
    "avatar": "assets/officials/historical/manual-1582/avatar.png",
    "full": "assets/officials/historical/manual-1582/full.png",
    "court": "assets/officials/historical/manual-1582/court.png"
   },
   "evidence_status": "现有人物简介可追溯",
   "design_basis": "唐初统帅，平辅公祏、破东突厥、征吐谷浑，长于战略机动与多路协同。",
   "ui_archetype": "武将",
   "cost_basis": "费用统一支付身体、关键词与技能预算；不按名气定高费，不把智力直接换算成个人攻击。",
   "ui_requirements": [
    "使用关联人物现有头像与姓名",
    "服饰与时代、文武身份相符",
    "技能表现采用军令、兵器、阵形或军需，不画无史据法术",
    "史料不足沿用原作资源并标记待核，不据同名猜朝代"
   ]
  },
  {
   "id": "person_general-403-90513",
   "person_id": "general-403-90513",
   "name": "薛仁贵",
   "type": "general",
   "kind": "source",
   "cost": 5,
   "attack": 4,
   "health": 4,
   "tags": [],
   "skill": "强弓破阵",
   "enter": [
    {
     "op": "damage",
     "n": 3,
     "target": "enemy"
    }
   ],
   "death": [],
   "source": {
    "id": "general-403-90513",
    "name": "薛仁贵",
    "role": "武将",
    "martial": 98,
    "intelligence": 85,
    "leadership": 90,
    "tags": [
     "勇将",
     "名将"
    ],
    "biography": "唐将，以射术和个人勇武著称，征辽东、铁勒有功，大非川之战失败也影响统率评价。",
    "dynasty": "隋唐",
    "source": "https://zh.wikipedia.org/?curid=388382",
    "sourceTitle": "维基百科：薛仁贵（导言节录，CC BY-SA 4.0）",
    "historicalVerified": true
   },
   "historical_definition_id": "general-403-90513",
   "art": {
    "avatar": "assets/officials/historical/general-403-90513/avatar.png",
    "full": "assets/officials/historical/general-403-90513/full.png",
    "court": "assets/officials/historical/general-403-90513/court.png"
   },
   "evidence_status": "现有人物简介可追溯",
   "design_basis": "唐将，以射术和个人勇武著称，征辽东、铁勒有功，大非川之战失败也影响统率评价。",
   "ui_archetype": "武将",
   "cost_basis": "费用统一支付身体、关键词与技能预算；不按名气定高费，不把智力直接换算成个人攻击。",
   "ui_requirements": [
    "使用关联人物现有头像与姓名",
    "服饰与时代、文武身份相符",
    "技能表现采用军令、兵器、阵形或军需，不画无史据法术",
    "史料不足沿用原作资源并标记待核，不据同名猜朝代"
   ]
  },
  {
   "id": "person_cbdb-630",
   "person_id": "cbdb-630",
   "name": "韩琦",
   "type": "general",
   "kind": "source",
   "cost": 4,
   "attack": 2,
   "health": 5,
   "tags": [
    "taunt"
   ],
   "skill": "安边",
   "enter": [
    {
     "op": "heal",
     "n": 3
    }
   ],
   "death": [],
   "source": {
    "id": "cbdb-630",
    "name": "韩琦",
    "role": "武将",
    "martial": 25,
    "intelligence": 90,
    "leadership": 76,
    "tags": [
     "名臣"
    ],
    "biography": "北宋宰相，参与西北边防与庆历新政，长期主持政务；军事组织优于个人武勇。",
    "dynasty": "宋",
    "source": "https://zh.wikipedia.org/?curid=193154",
    "sourceTitle": "维基百科：韩琦（导言节录，CC BY-SA 4.0）",
    "historicalVerified": true
   },
   "historical_definition_id": "cbdb-630",
   "art": {
    "avatar": "assets/officials/historical/cbdb-630/avatar.png",
    "full": "assets/officials/historical/cbdb-630/full.png",
    "court": "assets/officials/historical/cbdb-630/court.png"
   },
   "evidence_status": "现有人物简介可追溯",
   "design_basis": "北宋宰相，参与西北边防与庆历新政，长期主持政务；军事组织优于个人武勇。",
   "ui_archetype": "文臣谋士",
   "cost_basis": "费用统一支付身体、关键词与技能预算；不按名气定高费，不把智力直接换算成个人攻击。",
   "ui_requirements": [
    "使用关联人物现有头像与姓名",
    "服饰与时代、文武身份相符",
    "技能表现采用军令、兵器、阵形或军需，不画无史据法术",
    "史料不足沿用原作资源并标记待核，不据同名猜朝代"
   ]
  },
  {
   "id": "person_original-33",
   "person_id": "original-33",
   "name": "黄飞鸿",
   "type": "general",
   "kind": "source",
   "cost": 4,
   "attack": 4,
   "health": 3,
   "tags": [
    "rush"
   ],
   "skill": "武艺精熟",
   "enter": [
    {
     "op": "armor",
     "n": 1
    }
   ],
   "death": [],
   "source": {
    "id": "original-33",
    "name": "黄飞鸿",
    "role": "武将",
    "martial": 95,
    "intelligence": 80,
    "leadership": 95,
    "tags": [
     "原作人物"
    ],
    "biography": "原作特殊人物表收录，未匹配到现有人物史料。",
    "dynasty": "原作",
    "source": "",
    "sourceTitle": "原作反汇编人物表",
    "historicalVerified": false
   },
   "historical_definition_id": "original-33",
   "art": {
    "avatar": "assets/officials/historical/original-33/avatar.png",
    "full": "assets/officials/historical/original-33/full.png",
    "court": "assets/officials/historical/original-33/court.png"
   },
   "evidence_status": "原作模板，历史关联待补核",
   "design_basis": "原作特殊人物表收录，未匹配到现有人物史料。",
   "ui_archetype": "武将",
   "cost_basis": "费用统一支付身体、关键词与技能预算；不按名气定高费，不把智力直接换算成个人攻击。",
   "ui_requirements": [
    "使用关联人物现有头像与姓名",
    "服饰与时代、文武身份相符",
    "技能表现采用军令、兵器、阵形或军需，不画无史据法术",
    "史料不足沿用原作资源并标记待核，不据同名猜朝代"
   ]
  },
  {
   "id": "person_manual-1590",
   "person_id": "manual-1590",
   "name": "李林甫",
   "type": "general",
   "kind": "source",
   "cost": 4,
   "attack": 2,
   "health": 4,
   "tags": [],
   "skill": "排异",
   "enter": [
    {
     "op": "silence",
     "target": "enemy"
    }
   ],
   "death": [],
   "source": {
    "id": "manual-1590",
    "name": "李林甫",
    "role": "文职",
    "martial": 9,
    "intelligence": 91,
    "leadership": 24,
    "tags": [
     "奸臣"
    ],
    "biography": "唐玄宗时期长期为相，排斥异己、阻塞言路，擅长权力运作。",
    "dynasty": "唐",
    "source": "https://zh.wikipedia.org/?curid=181807",
    "sourceTitle": "维基百科：李林甫（导言节录，CC BY-SA 4.0）",
    "historicalVerified": true
   },
   "historical_definition_id": "manual-1590",
   "art": {
    "avatar": "assets/officials/historical/manual-1590/avatar.png",
    "full": "assets/officials/historical/manual-1590/full.png",
    "court": "assets/officials/historical/manual-1590/court.png"
   },
   "evidence_status": "现有人物简介可追溯",
   "design_basis": "唐玄宗时期长期为相，排斥异己、阻塞言路，擅长权力运作。",
   "ui_archetype": "文臣谋士",
   "cost_basis": "费用统一支付身体、关键词与技能预算；不按名气定高费，不把智力直接换算成个人攻击。",
   "ui_requirements": [
    "使用关联人物现有头像与姓名",
    "服饰与时代、文武身份相符",
    "技能表现采用军令、兵器、阵形或军需，不画无史据法术",
    "史料不足沿用原作资源并标记待核，不据同名猜朝代"
   ]
  },
  {
   "id": "person_manual-1591",
   "person_id": "manual-1591",
   "name": "杨国忠",
   "type": "general",
   "kind": "source",
   "cost": 3,
   "attack": 2,
   "health": 3,
   "tags": [],
   "skill": "急调军需",
   "enter": [
    {
     "op": "refund",
     "n": 1
    },
    {
     "op": "selfdamage",
     "n": 2
    }
   ],
   "death": [],
   "source": {
    "id": "manual-1591",
    "name": "杨国忠",
    "role": "文职",
    "martial": 12,
    "intelligence": 76,
    "leadership": 27,
    "tags": [
     "奸臣"
    ],
    "biography": "唐玄宗外戚与宰相，聚敛专权，干预军事，与安禄山矛盾激化，安史之乱中被杀。",
    "dynasty": "唐",
    "source": "https://zh.wikipedia.org/?curid=132019",
    "sourceTitle": "维基百科：杨国忠（导言节录，CC BY-SA 4.0）",
    "historicalVerified": true
   },
   "historical_definition_id": "manual-1591",
   "art": {
    "avatar": "assets/officials/historical/manual-1591/avatar.png",
    "full": "assets/officials/historical/manual-1591/full.png",
    "court": "assets/officials/historical/manual-1591/court.png"
   },
   "evidence_status": "现有人物简介可追溯",
   "design_basis": "唐玄宗外戚与宰相，聚敛专权，干预军事，与安禄山矛盾激化，安史之乱中被杀。",
   "ui_archetype": "文臣谋士",
   "cost_basis": "费用统一支付身体、关键词与技能预算；不按名气定高费，不把智力直接换算成个人攻击。",
   "ui_requirements": [
    "使用关联人物现有头像与姓名",
    "服饰与时代、文武身份相符",
    "技能表现采用军令、兵器、阵形或军需，不画无史据法术",
    "史料不足沿用原作资源并标记待核，不据同名猜朝代"
   ]
  },
  {
   "id": "person_general-468-78206",
   "person_id": "general-468-78206",
   "name": "安禄山",
   "type": "general",
   "kind": "source",
   "cost": 6,
   "attack": 5,
   "health": 5,
   "tags": [
    "rush"
   ],
   "skill": "拥众而进",
   "enter": [
    {
     "op": "group",
     "a": 1,
     "h": 0,
     "mask": "cavalry",
     "limit": 2,
     "temp": true
    }
   ],
   "death": [],
   "source": {
    "id": "general-468-78206",
    "name": "安禄山",
    "role": "武将",
    "martial": 83,
    "intelligence": 81,
    "leadership": 87,
    "tags": [
     "叛将"
    ],
    "biography": "唐朝边将，兼领多镇，发动安史之乱。组织与作战能力不能掩盖叛乱造成的破坏。",
    "dynasty": "隋唐",
    "source": "https://zh.wikipedia.org/?curid=64765",
    "sourceTitle": "维基百科：安禄山（导言节录，CC BY-SA 4.0）",
    "historicalVerified": true
   },
   "historical_definition_id": "general-468-78206",
   "art": {
    "avatar": "assets/officials/historical/general-468-78206/avatar.png",
    "full": "assets/officials/historical/general-468-78206/full.png",
    "court": "assets/officials/historical/general-468-78206/court.png"
   },
   "evidence_status": "现有人物简介可追溯",
   "design_basis": "唐朝边将，兼领多镇，发动安史之乱。组织与作战能力不能掩盖叛乱造成的破坏。",
   "ui_archetype": "武将",
   "cost_basis": "费用统一支付身体、关键词与技能预算；不按名气定高费，不把智力直接换算成个人攻击。",
   "ui_requirements": [
    "使用关联人物现有头像与姓名",
    "服饰与时代、文武身份相符",
    "技能表现采用军令、兵器、阵形或军需，不画无史据法术",
    "史料不足沿用原作资源并标记待核，不据同名猜朝代"
   ]
  },
  {
   "id": "person_original-37",
   "person_id": "original-37",
   "name": "屈原",
   "type": "general",
   "kind": "source",
   "cost": 3,
   "attack": 2,
   "health": 3,
   "tags": [],
   "skill": "明志",
   "enter": [
    {
     "op": "draw",
     "n": 1
    }
   ],
   "death": [],
   "source": {
    "id": "original-37",
    "name": "屈原",
    "role": "文职",
    "martial": 36,
    "intelligence": 90,
    "leadership": 36,
    "tags": [
     "原作人物"
    ],
    "biography": "原作特殊人物表收录，未匹配到现有人物史料。",
    "dynasty": "原作",
    "source": "",
    "sourceTitle": "原作反汇编人物表",
    "historicalVerified": false
   },
   "historical_definition_id": "original-37",
   "art": {
    "avatar": "assets/officials/historical/original-37/avatar.png",
    "full": "assets/officials/historical/original-37/full.png",
    "court": "assets/officials/historical/original-37/court.png"
   },
   "evidence_status": "原作模板，历史关联待补核",
   "design_basis": "原作特殊人物表收录，未匹配到现有人物史料。",
   "ui_archetype": "文臣谋士",
   "cost_basis": "费用统一支付身体、关键词与技能预算；不按名气定高费，不把智力直接换算成个人攻击。",
   "ui_requirements": [
    "使用关联人物现有头像与姓名",
    "服饰与时代、文武身份相符",
    "技能表现采用军令、兵器、阵形或军需，不画无史据法术",
    "史料不足沿用原作资源并标记待核，不据同名猜朝代"
   ]
  },
  {
   "id": "person_manual-1537",
   "person_id": "manual-1537",
   "name": "卫青",
   "type": "general",
   "kind": "source",
   "cost": 6,
   "attack": 4,
   "health": 6,
   "tags": [
    "taunt"
   ],
   "skill": "稳军出塞",
   "enter": [
    {
     "op": "buff",
     "a": 1,
     "h": 1,
     "mask": "cavalry",
     "target": "friend",
     "temp": false
    }
   ],
   "death": [],
   "source": {
    "id": "manual-1537",
    "name": "卫青",
    "role": "武将",
    "martial": 88,
    "intelligence": 93,
    "leadership": 97,
    "tags": [
     "名将"
    ],
    "biography": "西汉抗击匈奴的主要统帅，多次远征取胜，待士宽厚，政治处事谨慎。",
    "dynasty": "秦汉",
    "source": "https://zh.wikipedia.org/?curid=70251",
    "sourceTitle": "维基百科：卫青（导言节录，CC BY-SA 4.0）",
    "historicalVerified": true
   },
   "historical_definition_id": "manual-1537",
   "art": {
    "avatar": "assets/officials/historical/manual-1537/avatar.png",
    "full": "assets/officials/historical/manual-1537/full.png",
    "court": "assets/officials/historical/manual-1537/court.png"
   },
   "evidence_status": "现有人物简介可追溯",
   "design_basis": "西汉抗击匈奴的主要统帅，多次远征取胜，待士宽厚，政治处事谨慎。",
   "ui_archetype": "武将",
   "cost_basis": "费用统一支付身体、关键词与技能预算；不按名气定高费，不把智力直接换算成个人攻击。",
   "ui_requirements": [
    "使用关联人物现有头像与姓名",
    "服饰与时代、文武身份相符",
    "技能表现采用军令、兵器、阵形或军需，不画无史据法术",
    "史料不足沿用原作资源并标记待核，不据同名猜朝代"
   ]
  },
  {
   "id": "person_manual-1536",
   "person_id": "manual-1536",
   "name": "霍去病",
   "type": "general",
   "kind": "source",
   "cost": 6,
   "attack": 5,
   "health": 4,
   "tags": [
    "rush"
   ],
   "skill": "长驱突袭",
   "enter": [
    {
     "op": "damage",
     "n": 2,
     "target": "enemy"
    }
   ],
   "death": [],
   "source": {
    "id": "manual-1536",
    "name": "霍去病",
    "role": "武将",
    "martial": 96,
    "intelligence": 92,
    "leadership": 97,
    "tags": [
     "名将"
    ],
    "biography": "西汉名将，善于远程突袭，多次大破匈奴，年轻时即获显著战功。",
    "dynasty": "秦汉",
    "source": "https://zh.wikipedia.org/?curid=72011",
    "sourceTitle": "维基百科：霍去病（导言节录，CC BY-SA 4.0）",
    "historicalVerified": true
   },
   "historical_definition_id": "manual-1536",
   "art": {
    "avatar": "assets/officials/historical/manual-1536/avatar.png",
    "full": "assets/officials/historical/manual-1536/full.png",
    "court": "assets/officials/historical/manual-1536/court.png"
   },
   "evidence_status": "现有人物简介可追溯",
   "design_basis": "西汉名将，善于远程突袭，多次大破匈奴，年轻时即获显著战功。",
   "ui_archetype": "武将",
   "cost_basis": "费用统一支付身体、关键词与技能预算；不按名气定高费，不把智力直接换算成个人攻击。",
   "ui_requirements": [
    "使用关联人物现有头像与姓名",
    "服饰与时代、文武身份相符",
    "技能表现采用军令、兵器、阵形或军需，不画无史据法术",
    "史料不足沿用原作资源并标记待核，不据同名猜朝代"
   ]
  },
  {
   "id": "person_manual-1513",
   "person_id": "manual-1513",
   "name": "孙膑",
   "type": "general",
   "kind": "source",
   "cost": 5,
   "attack": 2,
   "health": 6,
   "tags": [],
   "skill": "围魏救赵",
   "enter": [
    {
     "op": "freeze",
     "target": "enemy"
    },
    {
     "op": "draw",
     "n": 1
    }
   ],
   "death": [],
   "source": {
    "id": "manual-1513",
    "name": "孙膑",
    "role": "武将",
    "martial": 8,
    "intelligence": 98,
    "leadership": 96,
    "tags": [
     "兵家",
     "名将"
    ],
    "biography": "战国齐国军事家，参与桂陵、马陵之战。受膑刑，武力低而军略与统率极高。",
    "dynasty": "周",
    "source": "https://zh.wikipedia.org/?curid=1137",
    "sourceTitle": "维基百科：孙膑（导言节录，CC BY-SA 4.0）",
    "historicalVerified": true
   },
   "historical_definition_id": "manual-1513",
   "art": {
    "avatar": "assets/officials/historical/manual-1513/avatar.png",
    "full": "assets/officials/historical/manual-1513/full.png",
    "court": "assets/officials/historical/manual-1513/court.png"
   },
   "evidence_status": "现有人物简介可追溯",
   "design_basis": "战国齐国军事家，参与桂陵、马陵之战。受膑刑，武力低而军略与统率极高。",
   "ui_archetype": "文臣谋士",
   "cost_basis": "费用统一支付身体、关键词与技能预算；不按名气定高费，不把智力直接换算成个人攻击。",
   "ui_requirements": [
    "使用关联人物现有头像与姓名",
    "服饰与时代、文武身份相符",
    "技能表现采用军令、兵器、阵形或军需，不画无史据法术",
    "史料不足沿用原作资源并标记待核，不据同名猜朝代"
   ]
  },
  {
   "id": "person_original-41",
   "person_id": "original-41",
   "name": "庞涓",
   "type": "general",
   "kind": "source",
   "cost": 5,
   "attack": 4,
   "health": 4,
   "tags": [],
   "skill": "争先制敌",
   "enter": [
    {
     "op": "damage",
     "n": 2,
     "target": "enemy"
    },
    {
     "op": "discount",
     "n": 1
    }
   ],
   "death": [],
   "source": {
    "id": "original-41",
    "name": "庞涓",
    "role": "文职",
    "martial": 86,
    "intelligence": 90,
    "leadership": 86,
    "tags": [
     "原作人物"
    ],
    "biography": "原作特殊人物表收录，未匹配到现有人物史料。",
    "dynasty": "原作",
    "source": "",
    "sourceTitle": "原作反汇编人物表",
    "historicalVerified": false
   },
   "historical_definition_id": "original-41",
   "art": {
    "avatar": "assets/officials/historical/original-41/avatar.png",
    "full": "assets/officials/historical/original-41/full.png",
    "court": "assets/officials/historical/original-41/court.png"
   },
   "evidence_status": "原作模板，历史关联待补核",
   "design_basis": "原作特殊人物表收录，未匹配到现有人物史料。",
   "ui_archetype": "武将",
   "cost_basis": "费用统一支付身体、关键词与技能预算；不按名气定高费，不把智力直接换算成个人攻击。",
   "ui_requirements": [
    "使用关联人物现有头像与姓名",
    "服饰与时代、文武身份相符",
    "技能表现采用军令、兵器、阵形或军需，不画无史据法术",
    "史料不足沿用原作资源并标记待核，不据同名猜朝代"
   ]
  },
  {
   "id": "person_cbdb-25403",
   "person_id": "cbdb-25403",
   "name": "诸葛亮",
   "type": "general",
   "kind": "source",
   "cost": 6,
   "attack": 2,
   "health": 6,
   "tags": [],
   "skill": "筹策北伐",
   "enter": [
    {
     "op": "draw",
     "n": 1,
     "filter": "tactic"
    },
    {
     "op": "armor",
     "n": 3
    }
   ],
   "death": [],
   "source": {
    "id": "cbdb-25403",
    "name": "诸葛亮",
    "role": "武将",
    "martial": 25,
    "intelligence": 99,
    "leadership": 94,
    "tags": [
     "名相",
     "军事家"
    ],
    "biography": "蜀汉丞相，治理国家、整顿军政，南征并多次北伐；统军组织力突出，个人武勇不是其特长。",
    "dynasty": "三国蜀",
    "source": "https://zh.wikipedia.org/?curid=2837",
    "sourceTitle": "维基百科：诸葛亮（导言节录，CC BY-SA 4.0）",
    "historicalVerified": true
   },
   "historical_definition_id": "cbdb-25403",
   "art": {
    "avatar": "assets/officials/historical/cbdb-25403/avatar.png",
    "full": "assets/officials/historical/cbdb-25403/full.png",
    "court": "assets/officials/historical/cbdb-25403/court.png"
   },
   "evidence_status": "现有人物简介可追溯",
   "design_basis": "蜀汉丞相，治理国家、整顿军政，南征并多次北伐；统军组织力突出，个人武勇不是其特长。",
   "ui_archetype": "文臣谋士",
   "cost_basis": "费用统一支付身体、关键词与技能预算；不按名气定高费，不把智力直接换算成个人攻击。",
   "ui_requirements": [
    "使用关联人物现有头像与姓名",
    "服饰与时代、文武身份相符",
    "技能表现采用军令、兵器、阵形或军需，不画无史据法术",
    "史料不足沿用原作资源并标记待核，不据同名猜朝代"
   ]
  },
  {
   "id": "person_original-43",
   "person_id": "original-43",
   "name": "王玄策",
   "type": "general",
   "kind": "source",
   "cost": 5,
   "attack": 4,
   "health": 4,
   "tags": [],
   "skill": "应变",
   "enter": [
    {
     "op": "silence",
     "target": "enemy"
    },
    {
     "op": "armor",
     "n": 2
    }
   ],
   "death": [],
   "source": {
    "id": "original-43",
    "name": "王玄策",
    "role": "武将",
    "martial": 90,
    "intelligence": 85,
    "leadership": 90,
    "tags": [
     "原作人物"
    ],
    "biography": "原作特殊人物表收录，未匹配到现有人物史料。",
    "dynasty": "原作",
    "source": "",
    "sourceTitle": "原作反汇编人物表",
    "historicalVerified": false
   },
   "historical_definition_id": "original-43",
   "art": {
    "avatar": "assets/officials/historical/original-43/avatar.png",
    "full": "assets/officials/historical/original-43/full.png",
    "court": "assets/officials/historical/original-43/court.png"
   },
   "evidence_status": "原作模板，历史关联待补核",
   "design_basis": "原作特殊人物表收录，未匹配到现有人物史料。",
   "ui_archetype": "武将",
   "cost_basis": "费用统一支付身体、关键词与技能预算；不按名气定高费，不把智力直接换算成个人攻击。",
   "ui_requirements": [
    "使用关联人物现有头像与姓名",
    "服饰与时代、文武身份相符",
    "技能表现采用军令、兵器、阵形或军需，不画无史据法术",
    "史料不足沿用原作资源并标记待核，不据同名猜朝代"
   ]
  },
  {
   "id": "person_original-44",
   "person_id": "original-44",
   "name": "刘仁轨",
   "type": "general",
   "kind": "source",
   "cost": 5,
   "attack": 3,
   "health": 5,
   "tags": [
    "taunt"
   ],
   "skill": "水陆策应",
   "enter": [
    {
     "op": "buff",
     "a": 1,
     "h": 1,
     "mask": "ranged",
     "target": "friend",
     "temp": false
    }
   ],
   "death": [],
   "source": {
    "id": "original-44",
    "name": "刘仁轨",
    "role": "武将",
    "martial": 90,
    "intelligence": 84,
    "leadership": 90,
    "tags": [
     "原作人物"
    ],
    "biography": "原作特殊人物表收录，未匹配到现有人物史料。",
    "dynasty": "原作",
    "source": "",
    "sourceTitle": "原作反汇编人物表",
    "historicalVerified": false
   },
   "historical_definition_id": "original-44",
   "art": {
    "avatar": "assets/officials/historical/original-44/avatar.png",
    "full": "assets/officials/historical/original-44/full.png",
    "court": "assets/officials/historical/original-44/court.png"
   },
   "evidence_status": "原作模板，历史关联待补核",
   "design_basis": "原作特殊人物表收录，未匹配到现有人物史料。",
   "ui_archetype": "武将",
   "cost_basis": "费用统一支付身体、关键词与技能预算；不按名气定高费，不把智力直接换算成个人攻击。",
   "ui_requirements": [
    "使用关联人物现有头像与姓名",
    "服饰与时代、文武身份相符",
    "技能表现采用军令、兵器、阵形或军需，不画无史据法术",
    "史料不足沿用原作资源并标记待核，不据同名猜朝代"
   ]
  },
  {
   "id": "person_general-422-82978",
   "person_id": "general-422-82978",
   "name": "苏定方",
   "type": "general",
   "kind": "source",
   "cost": 6,
   "attack": 5,
   "health": 5,
   "tags": [
    "rush"
   ],
   "skill": "远征破敌",
   "enter": [
    {
     "op": "armor",
     "n": 2
    }
   ],
   "death": [],
   "source": {
    "id": "general-422-82978",
    "name": "苏定方",
    "role": "武将",
    "martial": 87,
    "intelligence": 94,
    "leadership": 97,
    "tags": [
     "名将"
    ],
    "biography": "唐朝名将，平西突厥、灭百济，多次长途远征获胜。",
    "dynasty": "隋唐",
    "source": "https://zh.wikipedia.org/?curid=524793",
    "sourceTitle": "维基百科：苏定方（导言节录，CC BY-SA 4.0）",
    "historicalVerified": true
   },
   "historical_definition_id": "general-422-82978",
   "art": {
    "avatar": "assets/officials/historical/general-422-82978/avatar.png",
    "full": "assets/officials/historical/general-422-82978/full.png",
    "court": "assets/officials/historical/general-422-82978/court.png"
   },
   "evidence_status": "现有人物简介可追溯",
   "design_basis": "唐朝名将，平西突厥、灭百济，多次长途远征获胜。",
   "ui_archetype": "武将",
   "cost_basis": "费用统一支付身体、关键词与技能预算；不按名气定高费，不把智力直接换算成个人攻击。",
   "ui_requirements": [
    "使用关联人物现有头像与姓名",
    "服饰与时代、文武身份相符",
    "技能表现采用军令、兵器、阵形或军需，不画无史据法术",
    "史料不足沿用原作资源并标记待核，不据同名猜朝代"
   ]
  },
  {
   "id": "person_general-523-68118",
   "person_id": "general-523-68118",
   "name": "狄青",
   "type": "general",
   "kind": "source",
   "cost": 5,
   "attack": 4,
   "health": 4,
   "tags": [
    "rush"
   ],
   "skill": "出奇制胜",
   "enter": [
    {
     "op": "freeze",
     "target": "enemy"
    }
   ],
   "death": [],
   "source": {
    "id": "general-523-68118",
    "name": "狄青",
    "role": "武将",
    "martial": 97,
    "intelligence": 88,
    "leadership": 95,
    "tags": [
     "名将"
    ],
    "biography": "北宋将领，出身行伍，参与西北战争并平侬智高，以勇武与临阵谋略见长。",
    "dynasty": "宋辽金夏",
    "source": "https://zh.wikipedia.org/?curid=24558",
    "sourceTitle": "维基百科：狄青（导言节录，CC BY-SA 4.0）",
    "historicalVerified": true
   },
   "historical_definition_id": "general-523-68118",
   "art": {
    "avatar": "assets/officials/historical/general-523-68118/avatar.png",
    "full": "assets/officials/historical/general-523-68118/full.png",
    "court": "assets/officials/historical/general-523-68118/court.png"
   },
   "evidence_status": "现有人物简介可追溯",
   "design_basis": "北宋将领，出身行伍，参与西北战争并平侬智高，以勇武与临阵谋略见长。",
   "ui_archetype": "武将",
   "cost_basis": "费用统一支付身体、关键词与技能预算；不按名气定高费，不把智力直接换算成个人攻击。",
   "ui_requirements": [
    "使用关联人物现有头像与姓名",
    "服饰与时代、文武身份相符",
    "技能表现采用军令、兵器、阵形或军需，不画无史据法术",
    "史料不足沿用原作资源并标记待核，不据同名猜朝代"
   ]
  },
  {
   "id": "person_cbdb-1488",
   "person_id": "cbdb-1488",
   "name": "司马光",
   "type": "general",
   "kind": "source",
   "cost": 4,
   "attack": 2,
   "health": 5,
   "tags": [],
   "skill": "鉴往知来",
   "enter": [
    {
     "op": "draw",
     "n": 1,
     "filter": "tactic"
    }
   ],
   "death": [],
   "source": {
    "id": "cbdb-1488",
    "name": "司马光",
    "role": "文职",
    "martial": 12,
    "intelligence": 94,
    "leadership": 38,
    "tags": [
     "史学名家",
     "重臣"
    ],
    "biography": "北宋史学家、宰相，主持编纂《资治通鉴》，反对新法。长于史学与议政，非武勇型人物。",
    "dynasty": "宋",
    "source": "https://zh.wikipedia.org/?curid=6432",
    "sourceTitle": "维基百科：司马光（导言节录，CC BY-SA 4.0）",
    "historicalVerified": true
   },
   "historical_definition_id": "cbdb-1488",
   "art": {
    "avatar": "assets/officials/historical/cbdb-1488/avatar.png",
    "full": "assets/officials/historical/cbdb-1488/full.png",
    "court": "assets/officials/historical/cbdb-1488/court.png"
   },
   "evidence_status": "现有人物简介可追溯",
   "design_basis": "北宋史学家、宰相，主持编纂《资治通鉴》，反对新法。长于史学与议政，非武勇型人物。",
   "ui_archetype": "文臣谋士",
   "cost_basis": "费用统一支付身体、关键词与技能预算；不按名气定高费，不把智力直接换算成个人攻击。",
   "ui_requirements": [
    "使用关联人物现有头像与姓名",
    "服饰与时代、文武身份相符",
    "技能表现采用军令、兵器、阵形或军需，不画无史据法术",
    "史料不足沿用原作资源并标记待核，不据同名猜朝代"
   ]
  },
  {
   "id": "person_cbdb-8175",
   "person_id": "cbdb-8175",
   "name": "岳飞",
   "type": "general",
   "kind": "source",
   "cost": 6,
   "attack": 4,
   "health": 5,
   "tags": [
    "rush"
   ],
   "skill": "岳家军令",
   "enter": [
    {
     "op": "group",
     "a": 1,
     "h": 0,
     "mask": "foot",
     "limit": 2,
     "temp": true
    }
   ],
   "death": [],
   "source": {
    "id": "cbdb-8175",
    "name": "岳飞",
    "role": "武将",
    "martial": 97,
    "intelligence": 94,
    "leadership": 98,
    "tags": [
     "名将",
     "忠臣"
    ],
    "biography": "南宋抗金统帅，治军严整，收复襄阳等地，多次击败金军，后遭冤杀。",
    "dynasty": "宋",
    "source": "https://zh.wikipedia.org/?curid=7133",
    "sourceTitle": "维基百科：岳飞（导言节录，CC BY-SA 4.0）",
    "historicalVerified": true
   },
   "historical_definition_id": "cbdb-8175",
   "art": {
    "avatar": "assets/officials/historical/cbdb-8175/avatar.png",
    "full": "assets/officials/historical/cbdb-8175/full.png",
    "court": "assets/officials/historical/cbdb-8175/court.png"
   },
   "evidence_status": "现有人物简介可追溯",
   "design_basis": "南宋抗金统帅，治军严整，收复襄阳等地，多次击败金军，后遭冤杀。",
   "ui_archetype": "武将",
   "cost_basis": "费用统一支付身体、关键词与技能预算；不按名气定高费，不把智力直接换算成个人攻击。",
   "ui_requirements": [
    "使用关联人物现有头像与姓名",
    "服饰与时代、文武身份相符",
    "技能表现采用军令、兵器、阵形或军需，不画无史据法术",
    "史料不足沿用原作资源并标记待核，不据同名猜朝代"
   ]
  },
  {
   "id": "person_cbdb-19123",
   "person_id": "cbdb-19123",
   "name": "文天祥",
   "type": "general",
   "kind": "source",
   "cost": 4,
   "attack": 2,
   "health": 5,
   "tags": [
    "taunt"
   ],
   "skill": "正气",
   "enter": [
    {
     "op": "heal",
     "n": 3
    }
   ],
   "death": [],
   "source": {
    "id": "cbdb-19123",
    "name": "文天祥",
    "role": "武将",
    "martial": 40,
    "intelligence": 91,
    "leadership": 67,
    "tags": [
     "忠臣"
    ],
    "biography": "南宋末年抗元，兵败被俘后拒降，著《正气歌》；气节突出，统军能力不等于顶级名将。",
    "dynasty": "宋",
    "source": "https://zh.wikipedia.org/?curid=7134",
    "sourceTitle": "维基百科：文天祥（导言节录，CC BY-SA 4.0）",
    "historicalVerified": true
   },
   "historical_definition_id": "cbdb-19123",
   "art": {
    "avatar": "assets/officials/historical/cbdb-19123/avatar.png",
    "full": "assets/officials/historical/cbdb-19123/full.png",
    "court": "assets/officials/historical/cbdb-19123/court.png"
   },
   "evidence_status": "现有人物简介可追溯",
   "design_basis": "南宋末年抗元，兵败被俘后拒降，著《正气歌》；气节突出，统军能力不等于顶级名将。",
   "ui_archetype": "文武兼长",
   "cost_basis": "费用统一支付身体、关键词与技能预算；不按名气定高费，不把智力直接换算成个人攻击。",
   "ui_requirements": [
    "使用关联人物现有头像与姓名",
    "服饰与时代、文武身份相符",
    "技能表现采用军令、兵器、阵形或军需，不画无史据法术",
    "史料不足沿用原作资源并标记待核，不据同名猜朝代"
   ]
  },
  {
   "id": "person_manual-1608",
   "person_id": "manual-1608",
   "name": "徐达",
   "type": "general",
   "kind": "source",
   "cost": 6,
   "attack": 4,
   "health": 6,
   "tags": [],
   "skill": "军纪严整",
   "enter": [
    {
     "op": "group",
     "a": 0,
     "h": 2,
     "mask": "all",
     "limit": 2,
     "temp": false
    }
   ],
   "death": [],
   "source": {
    "id": "manual-1608",
    "name": "徐达",
    "role": "武将",
    "martial": 91,
    "intelligence": 95,
    "leadership": 98,
    "tags": [
     "名将"
    ],
    "biography": "明朝开国统帅，平江南、北伐灭元，作战稳健，军纪与政治处事谨慎。",
    "dynasty": "明",
    "source": "https://zh.wikipedia.org/?curid=26339",
    "sourceTitle": "维基百科：徐达（导言节录，CC BY-SA 4.0）",
    "historicalVerified": true
   },
   "historical_definition_id": "manual-1608",
   "art": {
    "avatar": "assets/officials/historical/manual-1608/avatar.png",
    "full": "assets/officials/historical/manual-1608/full.png",
    "court": "assets/officials/historical/manual-1608/court.png"
   },
   "evidence_status": "现有人物简介可追溯",
   "design_basis": "明朝开国统帅，平江南、北伐灭元，作战稳健，军纪与政治处事谨慎。",
   "ui_archetype": "武将",
   "cost_basis": "费用统一支付身体、关键词与技能预算；不按名气定高费，不把智力直接换算成个人攻击。",
   "ui_requirements": [
    "使用关联人物现有头像与姓名",
    "服饰与时代、文武身份相符",
    "技能表现采用军令、兵器、阵形或军需，不画无史据法术",
    "史料不足沿用原作资源并标记待核，不据同名猜朝代"
   ]
  },
  {
   "id": "person_manual-1609",
   "person_id": "manual-1609",
   "name": "常遇春",
   "type": "general",
   "kind": "source",
   "cost": 6,
   "attack": 6,
   "health": 4,
   "tags": [
    "rush"
   ],
   "skill": "勇冠三军",
   "enter": [
    {
     "op": "buff",
     "a": 1,
     "h": 0,
     "mask": "all",
     "target": "friend",
     "temp": true
    }
   ],
   "death": [],
   "source": {
    "id": "manual-1609",
    "name": "常遇春",
    "role": "武将",
    "martial": 99,
    "intelligence": 83,
    "leadership": 94,
    "tags": [
     "勇将",
     "名将"
    ],
    "biography": "明朝开国将领，勇于突击，战功显著；杀降等行为影响操守评价。",
    "dynasty": "明",
    "source": "https://zh.wikipedia.org/?curid=76028",
    "sourceTitle": "维基百科：常遇春（导言节录，CC BY-SA 4.0）",
    "historicalVerified": true
   },
   "historical_definition_id": "manual-1609",
   "art": {
    "avatar": "assets/officials/historical/manual-1609/avatar.png",
    "full": "assets/officials/historical/manual-1609/full.png",
    "court": "assets/officials/historical/manual-1609/court.png"
   },
   "evidence_status": "现有人物简介可追溯",
   "design_basis": "明朝开国将领，勇于突击，战功显著；杀降等行为影响操守评价。",
   "ui_archetype": "武将",
   "cost_basis": "费用统一支付身体、关键词与技能预算；不按名气定高费，不把智力直接换算成个人攻击。",
   "ui_requirements": [
    "使用关联人物现有头像与姓名",
    "服饰与时代、文武身份相符",
    "技能表现采用军令、兵器、阵形或军需，不画无史据法术",
    "史料不足沿用原作资源并标记待核，不据同名猜朝代"
   ]
  },
  {
   "id": "person_cbdb-54819",
   "person_id": "cbdb-54819",
   "name": "林则徐",
   "type": "general",
   "kind": "source",
   "cost": 4,
   "attack": 2,
   "health": 4,
   "tags": [],
   "skill": "整肃",
   "enter": [
    {
     "op": "silence",
     "target": "enemy"
    },
    {
     "op": "heal",
     "n": 2
    }
   ],
   "death": [],
   "source": {
    "id": "cbdb-54819",
    "name": "林则徐",
    "role": "文职",
    "martial": 21,
    "intelligence": 95,
    "leadership": 62,
    "tags": [
     "名臣"
    ],
    "biography": "清代重臣，主持禁烟、虎门销烟，关注海防与西方知识，地方治理与气节突出。",
    "dynasty": "清",
    "source": "https://zh.wikipedia.org/?curid=37941",
    "sourceTitle": "维基百科：林则徐（导言节录，CC BY-SA 4.0）",
    "historicalVerified": true
   },
   "historical_definition_id": "cbdb-54819",
   "art": {
    "avatar": "assets/officials/historical/cbdb-54819/avatar.png",
    "full": "assets/officials/historical/cbdb-54819/full.png",
    "court": "assets/officials/historical/cbdb-54819/court.png"
   },
   "evidence_status": "现有人物简介可追溯",
   "design_basis": "清代重臣，主持禁烟、虎门销烟，关注海防与西方知识，地方治理与气节突出。",
   "ui_archetype": "文臣谋士",
   "cost_basis": "费用统一支付身体、关键词与技能预算；不按名气定高费，不把智力直接换算成个人攻击。",
   "ui_requirements": [
    "使用关联人物现有头像与姓名",
    "服饰与时代、文武身份相符",
    "技能表现采用军令、兵器、阵形或军需，不画无史据法术",
    "史料不足沿用原作资源并标记待核，不据同名猜朝代"
   ]
  },
  {
   "id": "person_cbdb-28093",
   "person_id": "cbdb-28093",
   "name": "方孝孺",
   "type": "general",
   "kind": "source",
   "cost": 3,
   "attack": 1,
   "health": 4,
   "tags": [
    "taunt"
   ],
   "skill": "不屈",
   "enter": [],
   "death": [
    {
     "op": "draw",
     "n": 1
    }
   ],
   "source": {
    "id": "cbdb-28093",
    "name": "方孝孺",
    "role": "文职",
    "martial": 10,
    "intelligence": 92,
    "leadership": 13,
    "tags": [
     "学者",
     "忠臣"
    ],
    "biography": "明初学者、建文朝重臣，靖难后拒绝为朱棣草诏而遇害，以守节著称。",
    "dynasty": "明",
    "source": "https://zh.wikipedia.org/?curid=25600",
    "sourceTitle": "维基百科：方孝孺（导言节录，CC BY-SA 4.0）",
    "historicalVerified": true
   },
   "historical_definition_id": "cbdb-28093",
   "art": {
    "avatar": "assets/officials/historical/cbdb-28093/avatar.png",
    "full": "assets/officials/historical/cbdb-28093/full.png",
    "court": "assets/officials/historical/cbdb-28093/court.png"
   },
   "evidence_status": "现有人物简介可追溯",
   "design_basis": "明初学者、建文朝重臣，靖难后拒绝为朱棣草诏而遇害，以守节著称。",
   "ui_archetype": "文臣谋士",
   "cost_basis": "费用统一支付身体、关键词与技能预算；不按名气定高费，不把智力直接换算成个人攻击。",
   "ui_requirements": [
    "使用关联人物现有头像与姓名",
    "服饰与时代、文武身份相符",
    "技能表现采用军令、兵器、阵形或军需，不画无史据法术",
    "史料不足沿用原作资源并标记待核，不据同名猜朝代"
   ]
  },
  {
   "id": "person_manual-1614",
   "person_id": "manual-1614",
   "name": "戚继光",
   "type": "general",
   "kind": "source",
   "cost": 6,
   "attack": 4,
   "health": 5,
   "tags": [],
   "skill": "兵种协同",
   "enter": [
    {
     "op": "group",
     "a": 1,
     "h": 1,
     "mask": "foot",
     "limit": 2,
     "temp": false
    }
   ],
   "death": [],
   "source": {
    "id": "manual-1614",
    "name": "戚继光",
    "role": "武将",
    "martial": 94,
    "intelligence": 96,
    "leadership": 98,
    "tags": [
     "名将",
     "军事家"
    ],
    "biography": "明朝抗倭与北边统帅，重视训练、阵法、兵器协同，著《纪效新书》等。",
    "dynasty": "明",
    "source": "https://zh.wikipedia.org/?curid=38978",
    "sourceTitle": "维基百科：戚继光（导言节录，CC BY-SA 4.0）",
    "historicalVerified": true
   },
   "historical_definition_id": "manual-1614",
   "art": {
    "avatar": "assets/officials/historical/manual-1614/avatar.png",
    "full": "assets/officials/historical/manual-1614/full.png",
    "court": "assets/officials/historical/manual-1614/court.png"
   },
   "evidence_status": "现有人物简介可追溯",
   "design_basis": "明朝抗倭与北边统帅，重视训练、阵法、兵器协同，著《纪效新书》等。",
   "ui_archetype": "武将",
   "cost_basis": "费用统一支付身体、关键词与技能预算；不按名气定高费，不把智力直接换算成个人攻击。",
   "ui_requirements": [
    "使用关联人物现有头像与姓名",
    "服饰与时代、文武身份相符",
    "技能表现采用军令、兵器、阵形或军需，不画无史据法术",
    "史料不足沿用原作资源并标记待核，不据同名猜朝代"
   ]
  },
  {
   "id": "person_manual-1611",
   "person_id": "manual-1611",
   "name": "于谦",
   "type": "general",
   "kind": "source",
   "cost": 5,
   "attack": 2,
   "health": 6,
   "tags": [
    "taunt"
   ],
   "skill": "京师保卫",
   "enter": [
    {
     "op": "buff",
     "a": 0,
     "h": 0,
     "give": "shield",
     "target": "friend"
    }
   ],
   "death": [],
   "source": {
    "id": "manual-1611",
    "name": "于谦",
    "role": "武将",
    "martial": 28,
    "intelligence": 94,
    "leadership": 87,
    "tags": [
     "名臣",
     "忠臣"
    ],
    "biography": "明朝重臣，土木之变后组织北京保卫战，整顿军政稳定局势，后遭冤杀。",
    "dynasty": "明",
    "source": "https://zh.wikipedia.org/?curid=307345",
    "sourceTitle": "维基百科：于谦（导言节录，CC BY-SA 4.0）",
    "historicalVerified": true
   },
   "historical_definition_id": "manual-1611",
   "art": {
    "avatar": "assets/officials/historical/manual-1611/avatar.png",
    "full": "assets/officials/historical/manual-1611/full.png",
    "court": "assets/officials/historical/manual-1611/court.png"
   },
   "evidence_status": "现有人物简介可追溯",
   "design_basis": "明朝重臣，土木之变后组织北京保卫战，整顿军政稳定局势，后遭冤杀。",
   "ui_archetype": "文臣谋士",
   "cost_basis": "费用统一支付身体、关键词与技能预算；不按名气定高费，不把智力直接换算成个人攻击。",
   "ui_requirements": [
    "使用关联人物现有头像与姓名",
    "服饰与时代、文武身份相符",
    "技能表现采用军令、兵器、阵形或军需，不画无史据法术",
    "史料不足沿用原作资源并标记待核，不据同名猜朝代"
   ]
  },
  {
   "id": "person_cbdb-30374",
   "person_id": "cbdb-30374",
   "name": "王守仁",
   "type": "general",
   "kind": "source",
   "cost": 5,
   "attack": 3,
   "health": 5,
   "tags": [],
   "skill": "知行合一",
   "enter": [
    {
     "op": "damage",
     "n": 2,
     "target": "enemy"
    },
    {
     "op": "armor",
     "n": 2
    }
   ],
   "death": [],
   "source": {
    "id": "cbdb-30374",
    "name": "王守仁",
    "role": "武将",
    "martial": 56,
    "intelligence": 98,
    "leadership": 92,
    "tags": [
     "名臣",
     "思想家"
    ],
    "biography": "明代思想家、将领，提出心学学说，平定宁王之乱并治理地方，军政兼长。",
    "dynasty": "明",
    "source": "https://zh.wikipedia.org/?curid=48474",
    "sourceTitle": "维基百科：王阳明（导言节录，CC BY-SA 4.0）",
    "historicalVerified": true
   },
   "historical_definition_id": "cbdb-30374",
   "art": {
    "avatar": "assets/officials/historical/cbdb-30374/avatar.png",
    "full": "assets/officials/historical/cbdb-30374/full.png",
    "court": "assets/officials/historical/cbdb-30374/court.png"
   },
   "evidence_status": "现有人物简介可追溯",
   "design_basis": "明代思想家、将领，提出心学学说，平定宁王之乱并治理地方，军政兼长。",
   "ui_archetype": "文武兼长",
   "cost_basis": "费用统一支付身体、关键词与技能预算；不按名气定高费，不把智力直接换算成个人攻击。",
   "ui_requirements": [
    "使用关联人物现有头像与姓名",
    "服饰与时代、文武身份相符",
    "技能表现采用军令、兵器、阵形或军需，不画无史据法术",
    "史料不足沿用原作资源并标记待核，不据同名猜朝代"
   ]
  },
  {
   "id": "person_original-57",
   "person_id": "original-57",
   "name": "程咬金",
   "type": "general",
   "kind": "source",
   "cost": 5,
   "attack": 5,
   "health": 4,
   "tags": [
    "rush"
   ],
   "skill": "奋战",
   "enter": [],
   "death": [
    {
     "op": "armor",
     "n": 2
    }
   ],
   "source": {
    "id": "original-57",
    "name": "程咬金",
    "role": "武将",
    "martial": 88,
    "intelligence": 72,
    "leadership": 88,
    "tags": [
     "原作人物"
    ],
    "biography": "原作特殊人物表收录，未匹配到现有人物史料。",
    "dynasty": "原作",
    "source": "",
    "sourceTitle": "原作反汇编人物表",
    "historicalVerified": false
   },
   "historical_definition_id": "original-57",
   "art": {
    "avatar": "assets/officials/historical/original-57/avatar.png",
    "full": "assets/officials/historical/original-57/full.png",
    "court": "assets/officials/historical/original-57/court.png"
   },
   "evidence_status": "原作模板，历史关联待补核",
   "design_basis": "原作特殊人物表收录，未匹配到现有人物史料。",
   "ui_archetype": "武将",
   "cost_basis": "费用统一支付身体、关键词与技能预算；不按名气定高费，不把智力直接换算成个人攻击。",
   "ui_requirements": [
    "使用关联人物现有头像与姓名",
    "服饰与时代、文武身份相符",
    "技能表现采用军令、兵器、阵形或军需，不画无史据法术",
    "史料不足沿用原作资源并标记待核，不据同名猜朝代"
   ]
  },
  {
   "id": "person_cbdb-8008",
   "person_id": "cbdb-8008",
   "name": "秦桧",
   "type": "general",
   "kind": "source",
   "cost": 4,
   "attack": 2,
   "health": 5,
   "tags": [],
   "skill": "封驳",
   "enter": [
    {
     "op": "silence",
     "target": "enemy"
    },
    {
     "op": "selfdamage",
     "n": 1
    }
   ],
   "death": [],
   "source": {
    "id": "cbdb-8008",
    "name": "秦桧",
    "role": "文职",
    "martial": 9,
    "intelligence": 89,
    "leadership": 25,
    "tags": [
     "奸臣"
    ],
    "biography": "南宋宰相，主和并打击政敌，参与岳飞冤案。权术与行政能力较强，清廉与政治操守极低。",
    "dynasty": "宋",
    "source": "https://zh.wikipedia.org/?curid=43263",
    "sourceTitle": "维基百科：秦桧（导言节录，CC BY-SA 4.0）",
    "historicalVerified": true
   },
   "historical_definition_id": "cbdb-8008",
   "art": {
    "avatar": "assets/officials/historical/cbdb-8008/avatar.png",
    "full": "assets/officials/historical/cbdb-8008/full.png",
    "court": "assets/officials/historical/cbdb-8008/court.png"
   },
   "evidence_status": "现有人物简介可追溯",
   "design_basis": "南宋宰相，主和并打击政敌，参与岳飞冤案。权术与行政能力较强，清廉与政治操守极低。",
   "ui_archetype": "文臣谋士",
   "cost_basis": "费用统一支付身体、关键词与技能预算；不按名气定高费，不把智力直接换算成个人攻击。",
   "ui_requirements": [
    "使用关联人物现有头像与姓名",
    "服饰与时代、文武身份相符",
    "技能表现采用军令、兵器、阵形或军需，不画无史据法术",
    "史料不足沿用原作资源并标记待核，不据同名猜朝代"
   ]
  },
  {
   "id": "person_original-59",
   "person_id": "original-59",
   "name": "史可法",
   "type": "general",
   "kind": "source",
   "cost": 5,
   "attack": 3,
   "health": 5,
   "tags": [
    "taunt"
   ],
   "skill": "督师",
   "enter": [],
   "death": [
    {
     "op": "armor",
     "n": 4
    }
   ],
   "source": {
    "id": "original-59",
    "name": "史可法",
    "role": "武将",
    "martial": 92,
    "intelligence": 88,
    "leadership": 92,
    "tags": [
     "原作人物"
    ],
    "biography": "原作特殊人物表收录，未匹配到现有人物史料。",
    "dynasty": "原作",
    "source": "",
    "sourceTitle": "原作反汇编人物表",
    "historicalVerified": false
   },
   "historical_definition_id": "original-59",
   "art": {
    "avatar": "assets/officials/historical/original-59/avatar.png",
    "full": "assets/officials/historical/original-59/full.png",
    "court": "assets/officials/historical/original-59/court.png"
   },
   "evidence_status": "原作模板，历史关联待补核",
   "design_basis": "原作特殊人物表收录，未匹配到现有人物史料。",
   "ui_archetype": "武将",
   "cost_basis": "费用统一支付身体、关键词与技能预算；不按名气定高费，不把智力直接换算成个人攻击。",
   "ui_requirements": [
    "使用关联人物现有头像与姓名",
    "服饰与时代、文武身份相符",
    "技能表现采用军令、兵器、阵形或军需，不画无史据法术",
    "史料不足沿用原作资源并标记待核，不据同名猜朝代"
   ]
  },
  {
   "id": "person_manual-1592",
   "person_id": "manual-1592",
   "name": "包拯",
   "type": "general",
   "kind": "source",
   "cost": 4,
   "attack": 2,
   "health": 4,
   "tags": [],
   "skill": "明断",
   "enter": [
    {
     "op": "damage",
     "n": 2,
     "target": "enemy"
    }
   ],
   "death": [],
   "source": {
    "id": "manual-1592",
    "name": "包拯",
    "role": "文职",
    "martial": 18,
    "intelligence": 87,
    "leadership": 30,
    "tags": [
     "清官"
    ],
    "biography": "北宋官员，历任监察御史、开封府等职，以敢于弹劾权贵、廉洁执法著称。",
    "dynasty": "宋",
    "source": "https://zh.wikipedia.org/?curid=13519",
    "sourceTitle": "维基百科：包拯（导言节录，CC BY-SA 4.0）",
    "historicalVerified": true
   },
   "historical_definition_id": "manual-1592",
   "art": {
    "avatar": "assets/officials/historical/manual-1592/avatar.png",
    "full": "assets/officials/historical/manual-1592/full.png",
    "court": "assets/officials/historical/manual-1592/court.png"
   },
   "evidence_status": "现有人物简介可追溯",
   "design_basis": "北宋官员，历任监察御史、开封府等职，以敢于弹劾权贵、廉洁执法著称。",
   "ui_archetype": "文臣谋士",
   "cost_basis": "费用统一支付身体、关键词与技能预算；不按名气定高费，不把智力直接换算成个人攻击。",
   "ui_requirements": [
    "使用关联人物现有头像与姓名",
    "服饰与时代、文武身份相符",
    "技能表现采用军令、兵器、阵形或军需，不画无史据法术",
    "史料不足沿用原作资源并标记待核，不据同名猜朝代"
   ]
  },
  {
   "id": "person_manual-1507",
   "person_id": "manual-1507",
   "name": "姜子牙",
   "type": "general",
   "kind": "source",
   "cost": 6,
   "attack": 3,
   "health": 6,
   "tags": [],
   "skill": "辅军定谋",
   "enter": [
    {
     "op": "buff",
     "a": 0,
     "h": 0,
     "give": "shield",
     "target": "friend"
    },
    {
     "op": "draw",
     "n": 1,
     "filter": "low"
    }
   ],
   "death": [],
   "source": {
    "id": "manual-1507",
    "name": "姜子牙",
    "role": "武将",
    "martial": 48,
    "intelligence": 91,
    "leadership": 92,
    "tags": [
     "开国重臣",
     "军事家"
    ],
    "biography": "周初重臣，又称吕尚，辅佐周武王克商。此处依据历史政治军事身份，不采用封神法术设定。",
    "dynasty": "周",
    "source": "https://zh.wikipedia.org/?curid=91415",
    "sourceTitle": "维基百科：姜太公（导言节录，CC BY-SA 4.0）",
    "historicalVerified": true
   },
   "historical_definition_id": "manual-1507",
   "art": {
    "avatar": "assets/officials/historical/manual-1507/avatar.png",
    "full": "assets/officials/historical/manual-1507/full.png",
    "court": "assets/officials/historical/manual-1507/court.png"
   },
   "evidence_status": "现有人物简介可追溯",
   "design_basis": "周初重臣，又称吕尚，辅佐周武王克商。此处依据历史政治军事身份，不采用封神法术设定。",
   "ui_archetype": "文武兼长",
   "cost_basis": "费用统一支付身体、关键词与技能预算；不按名气定高费，不把智力直接换算成个人攻击。",
   "ui_requirements": [
    "使用关联人物现有头像与姓名",
    "服饰与时代、文武身份相符",
    "技能表现采用军令、兵器、阵形或军需，不画无史据法术",
    "史料不足沿用原作资源并标记待核，不据同名猜朝代"
   ]
  },
  {
   "id": "person_original-62",
   "person_id": "original-62",
   "name": "比干",
   "type": "general",
   "kind": "source",
   "cost": 3,
   "attack": 1,
   "health": 5,
   "tags": [
    "taunt"
   ],
   "skill": "直言",
   "enter": [],
   "death": [
    {
     "op": "heal",
     "n": 3
    }
   ],
   "source": {
    "id": "original-62",
    "name": "比干",
    "role": "文职",
    "martial": 54,
    "intelligence": 88,
    "leadership": 54,
    "tags": [
     "原作人物"
    ],
    "biography": "原作特殊人物表收录，未匹配到现有人物史料。",
    "dynasty": "原作",
    "source": "",
    "sourceTitle": "原作反汇编人物表",
    "historicalVerified": false
   },
   "historical_definition_id": "original-62",
   "art": {
    "avatar": "assets/officials/historical/original-62/avatar.png",
    "full": "assets/officials/historical/original-62/full.png",
    "court": "assets/officials/historical/original-62/court.png"
   },
   "evidence_status": "原作模板，历史关联待补核",
   "design_basis": "原作特殊人物表收录，未匹配到现有人物史料。",
   "ui_archetype": "文武兼长",
   "cost_basis": "费用统一支付身体、关键词与技能预算；不按名气定高费，不把智力直接换算成个人攻击。",
   "ui_requirements": [
    "使用关联人物现有头像与姓名",
    "服饰与时代、文武身份相符",
    "技能表现采用军令、兵器、阵形或军需，不画无史据法术",
    "史料不足沿用原作资源并标记待核，不据同名猜朝代"
   ]
  },
  {
   "id": "person_original-63",
   "person_id": "original-63",
   "name": "周公",
   "type": "general",
   "kind": "source",
   "cost": 5,
   "attack": 3,
   "health": 5,
   "tags": [],
   "skill": "制礼整军",
   "enter": [
    {
     "op": "group",
     "a": 0,
     "h": 1,
     "mask": "all",
     "limit": 2,
     "temp": false
    },
    {
     "op": "armor",
     "n": 2
    }
   ],
   "death": [],
   "source": {
    "id": "original-63",
    "name": "周公",
    "role": "文职",
    "martial": 71,
    "intelligence": 96,
    "leadership": 71,
    "tags": [
     "原作人物"
    ],
    "biography": "原作特殊人物表收录，未匹配到现有人物史料。",
    "dynasty": "原作",
    "source": "",
    "sourceTitle": "原作反汇编人物表",
    "historicalVerified": false
   },
   "historical_definition_id": "original-63",
   "art": {
    "avatar": "assets/officials/historical/original-63/avatar.png",
    "full": "assets/officials/historical/original-63/full.png",
    "court": "assets/officials/historical/original-63/court.png"
   },
   "evidence_status": "原作模板，历史关联待补核",
   "design_basis": "原作特殊人物表收录，未匹配到现有人物史料。",
   "ui_archetype": "文武兼长",
   "cost_basis": "费用统一支付身体、关键词与技能预算；不按名气定高费，不把智力直接换算成个人攻击。",
   "ui_requirements": [
    "使用关联人物现有头像与姓名",
    "服饰与时代、文武身份相符",
    "技能表现采用军令、兵器、阵形或军需，不画无史据法术",
    "史料不足沿用原作资源并标记待核，不据同名猜朝代"
   ]
  },
  {
   "id": "person_original-64",
   "person_id": "original-64",
   "name": "孔子",
   "type": "general",
   "kind": "source",
   "cost": 4,
   "attack": 2,
   "health": 4,
   "tags": [],
   "skill": "因材施教",
   "enter": [
    {
     "op": "buff",
     "a": 1,
     "h": 1,
     "mask": "all",
     "target": "friend",
     "temp": false
    },
    {
     "op": "draw",
     "n": 1
    }
   ],
   "death": [],
   "source": {
    "id": "original-64",
    "name": "孔子",
    "role": "文职",
    "martial": 32,
    "intelligence": 99,
    "leadership": 32,
    "tags": [
     "原作人物"
    ],
    "biography": "原作特殊人物表收录，未匹配到现有人物史料。",
    "dynasty": "原作",
    "source": "",
    "sourceTitle": "原作反汇编人物表",
    "historicalVerified": false
   },
   "historical_definition_id": "original-64",
   "art": {
    "avatar": "assets/officials/historical/original-64/avatar.png",
    "full": "assets/officials/historical/original-64/full.png",
    "court": "assets/officials/historical/original-64/court.png"
   },
   "evidence_status": "原作模板，历史关联待补核",
   "design_basis": "原作特殊人物表收录，未匹配到现有人物史料。",
   "ui_archetype": "文臣谋士",
   "cost_basis": "费用统一支付身体、关键词与技能预算；不按名气定高费，不把智力直接换算成个人攻击。",
   "ui_requirements": [
    "使用关联人物现有头像与姓名",
    "服饰与时代、文武身份相符",
    "技能表现采用军令、兵器、阵形或军需，不画无史据法术",
    "史料不足沿用原作资源并标记待核，不据同名猜朝代"
   ]
  },
  {
   "id": "person_original-65",
   "person_id": "original-65",
   "name": "康有为",
   "type": "general",
   "kind": "source",
   "cost": 3,
   "attack": 2,
   "health": 3,
   "tags": [],
   "skill": "整备",
   "enter": [
    {
     "op": "draw",
     "n": 1,
     "filter": "low"
    }
   ],
   "death": [],
   "source": {
    "id": "original-65",
    "name": "康有为",
    "role": "文职",
    "martial": 21,
    "intelligence": 89,
    "leadership": 21,
    "tags": [
     "原作人物"
    ],
    "biography": "原作特殊人物表收录，未匹配到现有人物史料。",
    "dynasty": "原作",
    "source": "",
    "sourceTitle": "原作反汇编人物表",
    "historicalVerified": false
   },
   "historical_definition_id": "original-65",
   "art": {
    "avatar": "assets/officials/historical/original-65/avatar.png",
    "full": "assets/officials/historical/original-65/full.png",
    "court": "assets/officials/historical/original-65/court.png"
   },
   "evidence_status": "原作模板，历史关联待补核",
   "design_basis": "原作特殊人物表收录，未匹配到现有人物史料。",
   "ui_archetype": "文臣谋士",
   "cost_basis": "费用统一支付身体、关键词与技能预算；不按名气定高费，不把智力直接换算成个人攻击。",
   "ui_requirements": [
    "使用关联人物现有头像与姓名",
    "服饰与时代、文武身份相符",
    "技能表现采用军令、兵器、阵形或军需，不画无史据法术",
    "史料不足沿用原作资源并标记待核，不据同名猜朝代"
   ]
  },
  {
   "id": "person_original-66",
   "person_id": "original-66",
   "name": "老子",
   "type": "general",
   "kind": "source",
   "cost": 4,
   "attack": 2,
   "health": 5,
   "tags": [],
   "skill": "守静",
   "enter": [
    {
     "op": "freeze",
     "target": "enemy"
    },
    {
     "op": "heal",
     "n": 2
    }
   ],
   "death": [],
   "source": {
    "id": "original-66",
    "name": "老子",
    "role": "文职",
    "martial": 44,
    "intelligence": 90,
    "leadership": 44,
    "tags": [
     "原作人物"
    ],
    "biography": "原作特殊人物表收录，未匹配到现有人物史料。",
    "dynasty": "原作",
    "source": "",
    "sourceTitle": "原作反汇编人物表",
    "historicalVerified": false
   },
   "historical_definition_id": "original-66",
   "art": {
    "avatar": "assets/officials/historical/original-66/avatar.png",
    "full": "assets/officials/historical/original-66/full.png",
    "court": "assets/officials/historical/original-66/court.png"
   },
   "evidence_status": "原作模板，历史关联待补核",
   "design_basis": "原作特殊人物表收录，未匹配到现有人物史料。",
   "ui_archetype": "文武兼长",
   "cost_basis": "费用统一支付身体、关键词与技能预算；不按名气定高费，不把智力直接换算成个人攻击。",
   "ui_requirements": [
    "使用关联人物现有头像与姓名",
    "服饰与时代、文武身份相符",
    "技能表现采用军令、兵器、阵形或军需，不画无史据法术",
    "史料不足沿用原作资源并标记待核，不据同名猜朝代"
   ]
  },
  {
   "id": "person_manual-1512",
   "person_id": "manual-1512",
   "name": "孙武",
   "type": "general",
   "kind": "source",
   "cost": 6,
   "attack": 3,
   "health": 6,
   "tags": [],
   "skill": "知彼知己",
   "enter": [
    {
     "op": "silence",
     "target": "enemy"
    },
    {
     "op": "draw",
     "n": 1,
     "filter": "troop"
    }
   ],
   "death": [],
   "source": {
    "id": "manual-1512",
    "name": "孙武",
    "role": "武将",
    "martial": 63,
    "intelligence": 98,
    "leadership": 98,
    "tags": [
     "兵家"
    ],
    "biography": "春秋军事家，传统上被认为著有《孙子兵法》。评分偏重兵学与统率，不将兵法等同个人武艺。",
    "dynasty": "周",
    "source": "https://zh.wikipedia.org/?curid=142752",
    "sourceTitle": "维基百科：孙武（导言节录，CC BY-SA 4.0）",
    "historicalVerified": true
   },
   "historical_definition_id": "manual-1512",
   "art": {
    "avatar": "assets/officials/historical/manual-1512/avatar.png",
    "full": "assets/officials/historical/manual-1512/full.png",
    "court": "assets/officials/historical/manual-1512/court.png"
   },
   "evidence_status": "现有人物简介可追溯",
   "design_basis": "春秋军事家，传统上被认为著有《孙子兵法》。评分偏重兵学与统率，不将兵法等同个人武艺。",
   "ui_archetype": "文武兼长",
   "cost_basis": "费用统一支付身体、关键词与技能预算；不按名气定高费，不把智力直接换算成个人攻击。",
   "ui_requirements": [
    "使用关联人物现有头像与姓名",
    "服饰与时代、文武身份相符",
    "技能表现采用军令、兵器、阵形或军需，不画无史据法术",
    "史料不足沿用原作资源并标记待核，不据同名猜朝代"
   ]
  },
  {
   "id": "person_original-68",
   "person_id": "original-68",
   "name": "韩非",
   "type": "general",
   "kind": "source",
   "cost": 4,
   "attack": 3,
   "health": 4,
   "tags": [],
   "skill": "严令",
   "enter": [
    {
     "op": "buff",
     "a": 1,
     "h": 0,
     "mask": "all",
     "target": "friend",
     "temp": true
    },
    {
     "op": "armor",
     "n": 2
    }
   ],
   "death": [],
   "source": {
    "id": "original-68",
    "name": "韩非",
    "role": "文职",
    "martial": 33,
    "intelligence": 91,
    "leadership": 33,
    "tags": [
     "原作人物"
    ],
    "biography": "原作特殊人物表收录，未匹配到现有人物史料。",
    "dynasty": "原作",
    "source": "",
    "sourceTitle": "原作反汇编人物表",
    "historicalVerified": false
   },
   "historical_definition_id": "original-68",
   "art": {
    "avatar": "assets/officials/historical/original-68/avatar.png",
    "full": "assets/officials/historical/original-68/full.png",
    "court": "assets/officials/historical/original-68/court.png"
   },
   "evidence_status": "原作模板，历史关联待补核",
   "design_basis": "原作特殊人物表收录，未匹配到现有人物史料。",
   "ui_archetype": "文臣谋士",
   "cost_basis": "费用统一支付身体、关键词与技能预算；不按名气定高费，不把智力直接换算成个人攻击。",
   "ui_requirements": [
    "使用关联人物现有头像与姓名",
    "服饰与时代、文武身份相符",
    "技能表现采用军令、兵器、阵形或军需，不画无史据法术",
    "史料不足沿用原作资源并标记待核，不据同名猜朝代"
   ]
  },
  {
   "id": "person_original-69",
   "person_id": "original-69",
   "name": "墨子",
   "type": "general",
   "kind": "source",
   "cost": 5,
   "attack": 2,
   "health": 6,
   "tags": [
    "taunt"
   ],
   "skill": "兼守",
   "enter": [
    {
     "op": "armor",
     "n": 4
    }
   ],
   "death": [],
   "source": {
    "id": "original-69",
    "name": "墨子",
    "role": "文职",
    "martial": 78,
    "intelligence": 89,
    "leadership": 78,
    "tags": [
     "原作人物"
    ],
    "biography": "原作特殊人物表收录，未匹配到现有人物史料。",
    "dynasty": "原作",
    "source": "",
    "sourceTitle": "原作反汇编人物表",
    "historicalVerified": false
   },
   "historical_definition_id": "original-69",
   "art": {
    "avatar": "assets/officials/historical/original-69/avatar.png",
    "full": "assets/officials/historical/original-69/full.png",
    "court": "assets/officials/historical/original-69/court.png"
   },
   "evidence_status": "原作模板，历史关联待补核",
   "design_basis": "原作特殊人物表收录，未匹配到现有人物史料。",
   "ui_archetype": "文武兼长",
   "cost_basis": "费用统一支付身体、关键词与技能预算；不按名气定高费，不把智力直接换算成个人攻击。",
   "ui_requirements": [
    "使用关联人物现有头像与姓名",
    "服饰与时代、文武身份相符",
    "技能表现采用军令、兵器、阵形或军需，不画无史据法术",
    "史料不足沿用原作资源并标记待核，不据同名猜朝代"
   ]
  },
  {
   "id": "person_manual-1520",
   "person_id": "manual-1520",
   "name": "白起",
   "type": "general",
   "kind": "source",
   "cost": 7,
   "attack": 5,
   "health": 5,
   "tags": [],
   "skill": "围歼",
   "enter": [
    {
     "op": "destroy",
     "target": "enemy",
     "injured": true
    }
   ],
   "death": [],
   "source": {
    "id": "manual-1520",
    "name": "白起",
    "role": "武将",
    "martial": 83,
    "intelligence": 96,
    "leadership": 99,
    "tags": [
     "名将"
    ],
    "biography": "秦国名将，指挥伊阙、鄢郢、长平等大战，歼灭战能力突出，杀降与大规模杀戮饱受争议。",
    "dynasty": "周",
    "source": "https://zh.wikipedia.org/?curid=19391",
    "sourceTitle": "维基百科：白起（导言节录，CC BY-SA 4.0）",
    "historicalVerified": true
   },
   "historical_definition_id": "manual-1520",
   "art": {
    "avatar": "assets/officials/historical/manual-1520/avatar.png",
    "full": "assets/officials/historical/manual-1520/full.png",
    "court": "assets/officials/historical/manual-1520/court.png"
   },
   "evidence_status": "现有人物简介可追溯",
   "design_basis": "秦国名将，指挥伊阙、鄢郢、长平等大战，歼灭战能力突出，杀降与大规模杀戮饱受争议。",
   "ui_archetype": "武将",
   "cost_basis": "费用统一支付身体、关键词与技能预算；不按名气定高费，不把智力直接换算成个人攻击。",
   "ui_requirements": [
    "使用关联人物现有头像与姓名",
    "服饰与时代、文武身份相符",
    "技能表现采用军令、兵器、阵形或军需，不画无史据法术",
    "史料不足沿用原作资源并标记待核，不据同名猜朝代"
   ]
  },
  {
   "id": "person_manual-1521",
   "person_id": "manual-1521",
   "name": "王翦",
   "type": "general",
   "kind": "source",
   "cost": 7,
   "attack": 4,
   "health": 8,
   "tags": [
    "taunt"
   ],
   "skill": "持重",
   "enter": [
    {
     "op": "armor",
     "n": 3
    }
   ],
   "death": [],
   "source": {
    "id": "manual-1521",
    "name": "王翦",
    "role": "武将",
    "martial": 77,
    "intelligence": 95,
    "leadership": 98,
    "tags": [
     "名将"
    ],
    "biography": "秦国名将，参与灭赵、灭燕并统大军灭楚，重视准备与军力优势，作战稳健。",
    "dynasty": "周",
    "source": "https://zh.wikipedia.org/?curid=29919",
    "sourceTitle": "维基百科：王翦（导言节录，CC BY-SA 4.0）",
    "historicalVerified": true
   },
   "historical_definition_id": "manual-1521",
   "art": {
    "avatar": "assets/officials/historical/manual-1521/avatar.png",
    "full": "assets/officials/historical/manual-1521/full.png",
    "court": "assets/officials/historical/manual-1521/court.png"
   },
   "evidence_status": "现有人物简介可追溯",
   "design_basis": "秦国名将，参与灭赵、灭燕并统大军灭楚，重视准备与军力优势，作战稳健。",
   "ui_archetype": "文武兼长",
   "cost_basis": "费用统一支付身体、关键词与技能预算；不按名气定高费，不把智力直接换算成个人攻击。",
   "ui_requirements": [
    "使用关联人物现有头像与姓名",
    "服饰与时代、文武身份相符",
    "技能表现采用军令、兵器、阵形或军需，不画无史据法术",
    "史料不足沿用原作资源并标记待核，不据同名猜朝代"
   ]
  },
  {
   "id": "person_manual-1518",
   "person_id": "manual-1518",
   "name": "廉颇",
   "type": "general",
   "kind": "source",
   "cost": 6,
   "attack": 4,
   "health": 7,
   "tags": [
    "taunt"
   ],
   "skill": "坚壁",
   "enter": [],
   "death": [
    {
     "op": "armor",
     "n": 3
    }
   ],
   "source": {
    "id": "manual-1518",
    "name": "廉颇",
    "role": "武将",
    "martial": 91,
    "intelligence": 87,
    "leadership": 94,
    "tags": [
     "名将"
    ],
    "biography": "战国赵国名将，多次领军作战，长平之战前期采取坚守，后有负荆请罪的记载。",
    "dynasty": "周",
    "source": "https://zh.wikipedia.org/?curid=29932",
    "sourceTitle": "维基百科：廉颇（导言节录，CC BY-SA 4.0）",
    "historicalVerified": true
   },
   "historical_definition_id": "manual-1518",
   "art": {
    "avatar": "assets/officials/historical/manual-1518/avatar.png",
    "full": "assets/officials/historical/manual-1518/full.png",
    "court": "assets/officials/historical/manual-1518/court.png"
   },
   "evidence_status": "现有人物简介可追溯",
   "design_basis": "战国赵国名将，多次领军作战，长平之战前期采取坚守，后有负荆请罪的记载。",
   "ui_archetype": "武将",
   "cost_basis": "费用统一支付身体、关键词与技能预算；不按名气定高费，不把智力直接换算成个人攻击。",
   "ui_requirements": [
    "使用关联人物现有头像与姓名",
    "服饰与时代、文武身份相符",
    "技能表现采用军令、兵器、阵形或军需，不画无史据法术",
    "史料不足沿用原作资源并标记待核，不据同名猜朝代"
   ]
  },
  {
   "id": "person_manual-1522",
   "person_id": "manual-1522",
   "name": "李牧",
   "type": "general",
   "kind": "source",
   "cost": 6,
   "attack": 4,
   "health": 6,
   "tags": [
    "taunt",
    "anti"
   ],
   "skill": "守边设伏",
   "enter": [
    {
     "op": "armor",
     "n": 1
    }
   ],
   "death": [],
   "source": {
    "id": "manual-1522",
    "name": "李牧",
    "role": "武将",
    "martial": 86,
    "intelligence": 96,
    "leadership": 98,
    "tags": [
     "名将"
    ],
    "biography": "赵国名将，长期防御匈奴，后抗秦取得胜绩；精于边防、练兵与机动作战。",
    "dynasty": "周",
    "source": "https://zh.wikipedia.org/?curid=184014",
    "sourceTitle": "维基百科：李牧（导言节录，CC BY-SA 4.0）",
    "historicalVerified": true
   },
   "historical_definition_id": "manual-1522",
   "art": {
    "avatar": "assets/officials/historical/manual-1522/avatar.png",
    "full": "assets/officials/historical/manual-1522/full.png",
    "court": "assets/officials/historical/manual-1522/court.png"
   },
   "evidence_status": "现有人物简介可追溯",
   "design_basis": "赵国名将，长期防御匈奴，后抗秦取得胜绩；精于边防、练兵与机动作战。",
   "ui_archetype": "武将",
   "cost_basis": "费用统一支付身体、关键词与技能预算；不按名气定高费，不把智力直接换算成个人攻击。",
   "ui_requirements": [
    "使用关联人物现有头像与姓名",
    "服饰与时代、文武身份相符",
    "技能表现采用军令、兵器、阵形或军需，不画无史据法术",
    "史料不足沿用原作资源并标记待核，不据同名猜朝代"
   ]
  },
  {
   "id": "person_manual-1524",
   "person_id": "manual-1524",
   "name": "吕不韦",
   "type": "general",
   "kind": "source",
   "cost": 4,
   "attack": 2,
   "health": 4,
   "tags": [],
   "skill": "筹资",
   "enter": [
    {
     "op": "refund",
     "n": 1
    }
   ],
   "death": [],
   "source": {
    "id": "manual-1524",
    "name": "吕不韦",
    "role": "文职",
    "martial": 16,
    "intelligence": 95,
    "leadership": 39,
    "tags": [
     "权臣",
     "政治家"
    ],
    "biography": "秦国相邦，组织编纂《吕氏春秋》，擅长政治经营，后因嫪毐事件失势。",
    "dynasty": "周",
    "source": "https://zh.wikipedia.org/?curid=5852",
    "sourceTitle": "维基百科：吕不韦（导言节录，CC BY-SA 4.0）",
    "historicalVerified": true
   },
   "historical_definition_id": "manual-1524",
   "art": {
    "avatar": "assets/officials/historical/manual-1524/avatar.png",
    "full": "assets/officials/historical/manual-1524/full.png",
    "court": "assets/officials/historical/manual-1524/court.png"
   },
   "evidence_status": "现有人物简介可追溯",
   "design_basis": "秦国相邦，组织编纂《吕氏春秋》，擅长政治经营，后因嫪毐事件失势。",
   "ui_archetype": "文臣谋士",
   "cost_basis": "费用统一支付身体、关键词与技能预算；不按名气定高费，不把智力直接换算成个人攻击。",
   "ui_requirements": [
    "使用关联人物现有头像与姓名",
    "服饰与时代、文武身份相符",
    "技能表现采用军令、兵器、阵形或军需，不画无史据法术",
    "史料不足沿用原作资源并标记待核，不据同名猜朝代"
   ]
  },
  {
   "id": "person_general-56-58629",
   "person_id": "general-56-58629",
   "name": "蒙恬",
   "type": "general",
   "kind": "source",
   "cost": 5,
   "attack": 3,
   "health": 6,
   "tags": [
    "taunt"
   ],
   "skill": "北疆防线",
   "enter": [
    {
     "op": "buff",
     "a": 0,
     "h": 2,
     "mask": "foot",
     "target": "friend",
     "temp": false
    }
   ],
   "death": [],
   "source": {
    "id": "general-56-58629",
    "name": "蒙恬",
    "role": "武将",
    "martial": 85,
    "intelligence": 87,
    "leadership": 92,
    "tags": [
     "名将"
    ],
    "biography": "秦将，率军北击匈奴并参与北方防务建设，沙丘政变后被迫自杀。",
    "dynasty": "先秦",
    "source": "https://zh.wikipedia.org/?curid=108334",
    "sourceTitle": "维基百科：蒙恬（导言节录，CC BY-SA 4.0）",
    "historicalVerified": true
   },
   "historical_definition_id": "general-56-58629",
   "art": {
    "avatar": "assets/officials/historical/general-56-58629/avatar.png",
    "full": "assets/officials/historical/general-56-58629/full.png",
    "court": "assets/officials/historical/general-56-58629/court.png"
   },
   "evidence_status": "现有人物简介可追溯",
   "design_basis": "秦将，率军北击匈奴并参与北方防务建设，沙丘政变后被迫自杀。",
   "ui_archetype": "武将",
   "cost_basis": "费用统一支付身体、关键词与技能预算；不按名气定高费，不把智力直接换算成个人攻击。",
   "ui_requirements": [
    "使用关联人物现有头像与姓名",
    "服饰与时代、文武身份相符",
    "技能表现采用军令、兵器、阵形或军需，不画无史据法术",
    "史料不足沿用原作资源并标记待核，不据同名猜朝代"
   ]
  },
  {
   "id": "person_general-103-50637",
   "person_id": "general-103-50637",
   "name": "李广",
   "type": "general",
   "kind": "source",
   "cost": 5,
   "attack": 4,
   "health": 3,
   "tags": [],
   "skill": "飞将强弓",
   "enter": [
    {
     "op": "damage",
     "n": 4,
     "target": "enemy"
    }
   ],
   "death": [],
   "source": {
    "id": "general-103-50637",
    "name": "李广",
    "role": "武将",
    "martial": 97,
    "intelligence": 77,
    "leadership": 79,
    "tags": [
     "勇将"
    ],
    "biography": "西汉将领，以射术和个人武勇闻名，统军长期与匈奴作战，也有迷失道路等失误。",
    "dynasty": "秦汉",
    "source": "https://zh.wikipedia.org/?curid=94116",
    "sourceTitle": "维基百科：李广（导言节录，CC BY-SA 4.0）",
    "historicalVerified": true
   },
   "historical_definition_id": "general-103-50637",
   "art": {
    "avatar": "assets/officials/historical/general-103-50637/avatar.png",
    "full": "assets/officials/historical/general-103-50637/full.png",
    "court": "assets/officials/historical/general-103-50637/court.png"
   },
   "evidence_status": "现有人物简介可追溯",
   "design_basis": "西汉将领，以射术和个人武勇闻名，统军长期与匈奴作战，也有迷失道路等失误。",
   "ui_archetype": "武将",
   "cost_basis": "费用统一支付身体、关键词与技能预算；不按名气定高费，不把智力直接换算成个人攻击。",
   "ui_requirements": [
    "使用关联人物现有头像与姓名",
    "服饰与时代、文武身份相符",
    "技能表现采用军令、兵器、阵形或军需，不画无史据法术",
    "史料不足沿用原作资源并标记待核，不据同名猜朝代"
   ]
  },
  {
   "id": "person_original-77",
   "person_id": "original-77",
   "name": "荆轲",
   "type": "general",
   "kind": "source",
   "cost": 5,
   "attack": 5,
   "health": 3,
   "tags": [
    "stealth"
   ],
   "skill": "隐袭",
   "enter": [],
   "death": [],
   "source": {
    "id": "original-77",
    "name": "荆轲",
    "role": "武将",
    "martial": 89,
    "intelligence": 71,
    "leadership": 89,
    "tags": [
     "原作人物"
    ],
    "biography": "原作特殊人物表收录，未匹配到现有人物史料。",
    "dynasty": "原作",
    "source": "",
    "sourceTitle": "原作反汇编人物表",
    "historicalVerified": false
   },
   "historical_definition_id": "original-77",
   "art": {
    "avatar": "assets/officials/historical/original-77/avatar.png",
    "full": "assets/officials/historical/original-77/full.png",
    "court": "assets/officials/historical/original-77/court.png"
   },
   "evidence_status": "原作模板，历史关联待补核",
   "design_basis": "原作特殊人物表收录，未匹配到现有人物史料。",
   "ui_archetype": "武将",
   "cost_basis": "费用统一支付身体、关键词与技能预算；不按名气定高费，不把智力直接换算成个人攻击。",
   "ui_requirements": [
    "使用关联人物现有头像与姓名",
    "服饰与时代、文武身份相符",
    "技能表现采用军令、兵器、阵形或军需，不画无史据法术",
    "史料不足沿用原作资源并标记待核，不据同名猜朝代"
   ]
  },
  {
   "id": "person_general-38-51333",
   "person_id": "general-38-51333",
   "name": "田单",
   "type": "general",
   "kind": "source",
   "cost": 6,
   "attack": 4,
   "health": 5,
   "tags": [],
   "skill": "反攻",
   "enter": [
    {
     "op": "aoe",
     "n": 1
    }
   ],
   "death": [],
   "source": {
    "id": "general-38-51333",
    "name": "田单",
    "role": "武将",
    "martial": 63,
    "intelligence": 94,
    "leadership": 91,
    "tags": [
     "名将"
    ],
    "biography": "战国齐将，坚守即墨，利用火牛阵等手段反攻燕军、恢复齐国。",
    "dynasty": "先秦",
    "source": "https://zh.wikipedia.org/?curid=313431",
    "sourceTitle": "维基百科：田单（导言节录，CC BY-SA 4.0）",
    "historicalVerified": true
   },
   "historical_definition_id": "general-38-51333",
   "art": {
    "avatar": "assets/officials/historical/general-38-51333/avatar.png",
    "full": "assets/officials/historical/general-38-51333/full.png",
    "court": "assets/officials/historical/general-38-51333/court.png"
   },
   "evidence_status": "现有人物简介可追溯",
   "design_basis": "战国齐将，坚守即墨，利用火牛阵等手段反攻燕军、恢复齐国。",
   "ui_archetype": "文武兼长",
   "cost_basis": "费用统一支付身体、关键词与技能预算；不按名气定高费，不把智力直接换算成个人攻击。",
   "ui_requirements": [
    "使用关联人物现有头像与姓名",
    "服饰与时代、文武身份相符",
    "技能表现采用军令、兵器、阵形或军需，不画无史据法术",
    "史料不足沿用原作资源并标记待核，不据同名猜朝代"
   ]
  },
  {
   "id": "person_original-79",
   "person_id": "original-79",
   "name": "司马迁",
   "type": "general",
   "kind": "source",
   "cost": 3,
   "attack": 2,
   "health": 3,
   "tags": [],
   "skill": "博闻",
   "enter": [
    {
     "op": "draw",
     "n": 1,
     "filter": "high"
    }
   ],
   "death": [],
   "source": {
    "id": "original-79",
    "name": "司马迁",
    "role": "文职",
    "martial": 40,
    "intelligence": 90,
    "leadership": 40,
    "tags": [
     "原作人物"
    ],
    "biography": "原作特殊人物表收录，未匹配到现有人物史料。",
    "dynasty": "原作",
    "source": "",
    "sourceTitle": "原作反汇编人物表",
    "historicalVerified": false
   },
   "historical_definition_id": "original-79",
   "art": {
    "avatar": "assets/officials/historical/original-79/avatar.png",
    "full": "assets/officials/historical/original-79/full.png",
    "court": "assets/officials/historical/original-79/court.png"
   },
   "evidence_status": "原作模板，历史关联待补核",
   "design_basis": "原作特殊人物表收录，未匹配到现有人物史料。",
   "ui_archetype": "文武兼长",
   "cost_basis": "费用统一支付身体、关键词与技能预算；不按名气定高费，不把智力直接换算成个人攻击。",
   "ui_requirements": [
    "使用关联人物现有头像与姓名",
    "服饰与时代、文武身份相符",
    "技能表现采用军令、兵器、阵形或军需，不画无史据法术",
    "史料不足沿用原作资源并标记待核，不据同名猜朝代"
   ]
  },
  {
   "id": "person_cbdb-30257",
   "person_id": "cbdb-30257",
   "name": "曹操",
   "type": "general",
   "kind": "source",
   "cost": 6,
   "attack": 3,
   "health": 5,
   "tags": [],
   "skill": "统合军务",
   "enter": [
    {
     "op": "draw",
     "n": 1,
     "filter": "troop"
    },
    {
     "op": "armor",
     "n": 3
    }
   ],
   "death": [],
   "source": {
    "id": "cbdb-30257",
    "name": "曹操",
    "role": "文职",
    "martial": 39,
    "intelligence": 94,
    "leadership": 80,
    "tags": [
     "学术",
     "文艺",
     "技术",
     "谋略",
     "外交",
     "勇武",
     "领军",
     "防务",
     "治军",
     "后勤",
     "水师",
     "中枢",
     "行政",
     "财政治理",
     "教育",
     "政治反复"
    ],
    "biography": "曹操（155年—220年3月15日），字孟德，小字阿瞒，沛国谯县（今安徽亳州）人。东汉末年丞相、军事家、政治家、文学家和诗人，东汉末年主要群雄之一，职位为丞相，为汉末实际上的最高掌权者，亦是三国时代曹魏奠基者。父亲曹嵩。其子曹丕建立曹魏，追尊其庙号为太祖，追谥武皇帝。 早年与袁绍相处甚厚，袁绍与何进欲尽诛阉宦，引董卓入京。后董卓祸乱朝野，授予曹操为骁骑校尉，想要与曹操共事。曹操更名改姓，东归陈留，聚义兵随多路诸侯一同讨伐董卓。后联盟破碎，曹操自行发展，实力逐渐积累。后董卓伏诛，操讨陶谦，征张绣，灭吕布，败袁术，在中原成功立足。",
    "dynasty": "东汉",
    "source": "https://zh.wikipedia.org/?curid=2870",
    "sourceTitle": "维基百科：曹操（导言节录，CC BY-SA 4.0）",
    "historicalVerified": true
   },
   "historical_definition_id": "cbdb-30257",
   "art": {
    "avatar": "assets/officials/historical/cbdb-30257/avatar.png",
    "full": "assets/officials/historical/cbdb-30257/full.png",
    "court": "assets/officials/historical/cbdb-30257/court.png"
   },
   "evidence_status": "现有人物简介可追溯",
   "design_basis": "曹操（155年—220年3月15日），字孟德，小字阿瞒，沛国谯县（今安徽亳州）人。东汉末年丞相、军事家、政治家、文学家和诗人，东汉末年主要群雄之一，职位为丞相，为汉末实际上的最高掌权者，亦是三国时代曹魏奠基者。父亲曹嵩。其子曹丕建立曹魏，追尊其庙号为太祖，追谥武皇帝。 早年与袁绍相处甚厚，袁绍与何进欲尽诛阉宦，引董卓入京。后董卓祸乱朝野，授予曹操为骁骑校尉，想要与曹操共事。曹操更名改姓，东归陈留，聚义兵随多路诸侯一同讨伐董卓。后联盟破碎，曹操自行发展，实力逐渐积累。后董卓伏诛，操讨陶谦，征张绣，灭吕布，败袁术，在中原成功立足。",
   "ui_archetype": "文臣谋士",
   "cost_basis": "费用统一支付身体、关键词与技能预算；不按名气定高费，不把智力直接换算成个人攻击。",
   "ui_requirements": [
    "使用关联人物现有头像与姓名",
    "服饰与时代、文武身份相符",
    "技能表现采用军令、兵器、阵形或军需，不画无史据法术",
    "史料不足沿用原作资源并标记待核，不据同名猜朝代"
   ]
  },
  {
   "id": "person_manual-1555",
   "person_id": "manual-1555",
   "name": "赵云",
   "type": "general",
   "kind": "source",
   "cost": 6,
   "attack": 4,
   "health": 5,
   "tags": [
    "rush",
    "shield"
   ],
   "skill": "护军突阵",
   "enter": [],
   "death": [],
   "source": {
    "id": "manual-1555",
    "name": "赵云",
    "role": "武将",
    "martial": 96,
    "intelligence": 78,
    "leadership": 83,
    "tags": [
     "勇将"
    ],
    "biography": "蜀汉将领，长坂保护刘禅，任事谨慎；以忠勇与军纪见长，避免把演义战绩全部计入。",
    "dynasty": "三国",
    "source": "https://zh.wikipedia.org/?curid=22278",
    "sourceTitle": "维基百科：赵云（导言节录，CC BY-SA 4.0）",
    "historicalVerified": true
   },
   "historical_definition_id": "manual-1555",
   "art": {
    "avatar": "assets/officials/historical/manual-1555/avatar.png",
    "full": "assets/officials/historical/manual-1555/full.png",
    "court": "assets/officials/historical/manual-1555/court.png"
   },
   "evidence_status": "现有人物简介可追溯",
   "design_basis": "蜀汉将领，长坂保护刘禅，任事谨慎；以忠勇与军纪见长，避免把演义战绩全部计入。",
   "ui_archetype": "武将",
   "cost_basis": "费用统一支付身体、关键词与技能预算；不按名气定高费，不把智力直接换算成个人攻击。",
   "ui_requirements": [
    "使用关联人物现有头像与姓名",
    "服饰与时代、文武身份相符",
    "技能表现采用军令、兵器、阵形或军需，不画无史据法术",
    "史料不足沿用原作资源并标记待核，不据同名猜朝代"
   ]
  },
  {
   "id": "person_manual-1565",
   "person_id": "manual-1565",
   "name": "司马懿",
   "type": "general",
   "kind": "source",
   "cost": 6,
   "attack": 3,
   "health": 6,
   "tags": [],
   "skill": "审势",
   "enter": [
    {
     "op": "setattack",
     "n": 1,
     "target": "enemy"
    }
   ],
   "death": [],
   "source": {
    "id": "manual-1565",
    "name": "司马懿",
    "role": "武将",
    "martial": 48,
    "intelligence": 98,
    "leadership": 96,
    "tags": [
     "军事家",
     "权臣"
    ],
    "biography": "曹魏重臣，抵御蜀汉北伐并平辽东，后发动高平陵政变，奠定司马氏专权基础。",
    "dynasty": "三国",
    "source": "https://zh.wikipedia.org/?curid=49432",
    "sourceTitle": "维基百科：司马懿（导言节录，CC BY-SA 4.0）",
    "historicalVerified": true
   },
   "historical_definition_id": "manual-1565",
   "art": {
    "avatar": "assets/officials/historical/manual-1565/avatar.png",
    "full": "assets/officials/historical/manual-1565/full.png",
    "court": "assets/officials/historical/manual-1565/court.png"
   },
   "evidence_status": "现有人物简介可追溯",
   "design_basis": "曹魏重臣，抵御蜀汉北伐并平辽东，后发动高平陵政变，奠定司马氏专权基础。",
   "ui_archetype": "文武兼长",
   "cost_basis": "费用统一支付身体、关键词与技能预算；不按名气定高费，不把智力直接换算成个人攻击。",
   "ui_requirements": [
    "使用关联人物现有头像与姓名",
    "服饰与时代、文武身份相符",
    "技能表现采用军令、兵器、阵形或军需，不画无史据法术",
    "史料不足沿用原作资源并标记待核，不据同名猜朝代"
   ]
  },
  {
   "id": "person_general-285-45592",
   "person_id": "general-285-45592",
   "name": "吕布",
   "type": "general",
   "kind": "source",
   "cost": 6,
   "attack": 6,
   "health": 5,
   "tags": [
    "rush"
   ],
   "skill": "无双突阵",
   "enter": [],
   "death": [],
   "source": {
    "id": "general-285-45592",
    "name": "吕布",
    "role": "武将",
    "martial": 89,
    "intelligence": 67,
    "leadership": 92,
    "tags": [
     "外交",
     "勇武",
     "领军",
     "防务",
     "治军",
     "后勤",
     "行政",
     "守节",
     "政治反复"
    ],
    "biography": "吕布（160年或更早—199年2月7日），字奉先，并州五原郡九原（今内蒙古自治区包头市九原区）人，东汉末年武将与军阀，被封为温侯。先后为丁原、董卓的部将，也曾为袁绍效力，后趁刘备与袁术交战时而占据徐州，自成一方势力。建安三年十二月（199年2月7日），在下邳被曹操击败处死。",
    "dynasty": "三国",
    "source": "https://zh.wikipedia.org/?curid=15693",
    "sourceTitle": "维基百科：吕布（导言节录，CC BY-SA 4.0）",
    "historicalVerified": true
   },
   "historical_definition_id": "general-285-45592",
   "art": {
    "avatar": "assets/officials/historical/general-285-45592/avatar.png",
    "full": "assets/officials/historical/general-285-45592/full.png",
    "court": "assets/officials/historical/general-285-45592/court.png"
   },
   "evidence_status": "现有人物简介可追溯",
   "design_basis": "吕布（160年或更早—199年2月7日），字奉先，并州五原郡九原（今内蒙古自治区包头市九原区）人，东汉末年武将与军阀，被封为温侯。先后为丁原、董卓的部将，也曾为袁绍效力，后趁刘备与袁术交战时而占据徐州，自成一方势力。建安三年十二月（199年2月7日），在下邳被曹操击败处死。",
   "ui_archetype": "武将",
   "cost_basis": "费用统一支付身体、关键词与技能预算；不按名气定高费，不把智力直接换算成个人攻击。",
   "ui_requirements": [
    "使用关联人物现有头像与姓名",
    "服饰与时代、文武身份相符",
    "技能表现采用军令、兵器、阵形或军需，不画无史据法术",
    "史料不足沿用原作资源并标记待核，不据同名猜朝代"
   ]
  },
  {
   "id": "person_manual-1553",
   "person_id": "manual-1553",
   "name": "关羽",
   "type": "general",
   "kind": "source",
   "cost": 6,
   "attack": 5,
   "health": 5,
   "tags": [
    "rush"
   ],
   "skill": "斩将",
   "enter": [
    {
     "op": "damage",
     "n": 2,
     "target": "enemy",
     "injured": true
    }
   ],
   "death": [],
   "source": {
    "id": "manual-1553",
    "name": "关羽",
    "role": "武将",
    "martial": 98,
    "intelligence": 82,
    "leadership": 88,
    "tags": [
     "名将",
     "勇将"
    ],
    "biography": "蜀汉将领，镇守荆州，襄樊之战水淹于禁军，后失荆州被杀；勇武突出但战略处置有失误。",
    "dynasty": "三国",
    "source": "https://zh.wikipedia.org/?curid=22300",
    "sourceTitle": "维基百科：关羽（导言节录，CC BY-SA 4.0）",
    "historicalVerified": true
   },
   "historical_definition_id": "manual-1553",
   "art": {
    "avatar": "assets/officials/historical/manual-1553/avatar.png",
    "full": "assets/officials/historical/manual-1553/full.png",
    "court": "assets/officials/historical/manual-1553/court.png"
   },
   "evidence_status": "现有人物简介可追溯",
   "design_basis": "蜀汉将领，镇守荆州，襄樊之战水淹于禁军，后失荆州被杀；勇武突出但战略处置有失误。",
   "ui_archetype": "武将",
   "cost_basis": "费用统一支付身体、关键词与技能预算；不按名气定高费，不把智力直接换算成个人攻击。",
   "ui_requirements": [
    "使用关联人物现有头像与姓名",
    "服饰与时代、文武身份相符",
    "技能表现采用军令、兵器、阵形或军需，不画无史据法术",
    "史料不足沿用原作资源并标记待核，不据同名猜朝代"
   ]
  },
  {
   "id": "person_manual-1554",
   "person_id": "manual-1554",
   "name": "张飞",
   "type": "general",
   "kind": "source",
   "cost": 5,
   "attack": 4,
   "health": 5,
   "tags": [
    "taunt"
   ],
   "skill": "据阵",
   "enter": [
    {
     "op": "damage",
     "n": 1,
     "target": "enemy"
    }
   ],
   "death": [],
   "source": {
    "id": "manual-1554",
    "name": "张飞",
    "role": "武将",
    "martial": 99,
    "intelligence": 70,
    "leadership": 82,
    "tags": [
     "勇将"
    ],
    "biography": "蜀汉将领，长坂拒敌、巴西击败张郃等战绩见于史传；善待士人而苛待部下。",
    "dynasty": "三国",
    "source": "https://zh.wikipedia.org/?curid=22305",
    "sourceTitle": "维基百科：张飞（导言节录，CC BY-SA 4.0）",
    "historicalVerified": true
   },
   "historical_definition_id": "manual-1554",
   "art": {
    "avatar": "assets/officials/historical/manual-1554/avatar.png",
    "full": "assets/officials/historical/manual-1554/full.png",
    "court": "assets/officials/historical/manual-1554/court.png"
   },
   "evidence_status": "现有人物简介可追溯",
   "design_basis": "蜀汉将领，长坂拒敌、巴西击败张郃等战绩见于史传；善待士人而苛待部下。",
   "ui_archetype": "武将",
   "cost_basis": "费用统一支付身体、关键词与技能预算；不按名气定高费，不把智力直接换算成个人攻击。",
   "ui_requirements": [
    "使用关联人物现有头像与姓名",
    "服饰与时代、文武身份相符",
    "技能表现采用军令、兵器、阵形或军需，不画无史据法术",
    "史料不足沿用原作资源并标记待核，不据同名猜朝代"
   ]
  },
  {
   "id": "person_manual-1569",
   "person_id": "manual-1569",
   "name": "周瑜",
   "type": "general",
   "kind": "source",
   "cost": 6,
   "attack": 4,
   "health": 4,
   "tags": [],
   "skill": "火攻",
   "enter": [
    {
     "op": "aoe",
     "n": 2
    }
   ],
   "death": [],
   "source": {
    "id": "manual-1569",
    "name": "周瑜",
    "role": "武将",
    "martial": 75,
    "intelligence": 96,
    "leadership": 97,
    "tags": [
     "名将"
    ],
    "biography": "孙吴统帅，参与赤壁之战并争夺荆州，史载宽宏有度，与演义中的狭隘形象不同。",
    "dynasty": "三国",
    "source": "https://zh.wikipedia.org/?curid=4163",
    "sourceTitle": "维基百科：周瑜（导言节录，CC BY-SA 4.0）",
    "historicalVerified": true
   },
   "historical_definition_id": "manual-1569",
   "art": {
    "avatar": "assets/officials/historical/manual-1569/avatar.png",
    "full": "assets/officials/historical/manual-1569/full.png",
    "court": "assets/officials/historical/manual-1569/court.png"
   },
   "evidence_status": "现有人物简介可追溯",
   "design_basis": "孙吴统帅，参与赤壁之战并争夺荆州，史载宽宏有度，与演义中的狭隘形象不同。",
   "ui_archetype": "文武兼长",
   "cost_basis": "费用统一支付身体、关键词与技能预算；不按名气定高费，不把智力直接换算成个人攻击。",
   "ui_requirements": [
    "使用关联人物现有头像与姓名",
    "服饰与时代、文武身份相符",
    "技能表现采用军令、兵器、阵形或军需，不画无史据法术",
    "史料不足沿用原作资源并标记待核，不据同名猜朝代"
   ]
  },
  {
   "id": "person_general-398-60962",
   "person_id": "general-398-60962",
   "name": "秦琼",
   "type": "general",
   "kind": "source",
   "cost": 5,
   "attack": 4,
   "health": 5,
   "tags": [
    "rush"
   ],
   "skill": "破阵护军",
   "enter": [],
   "death": [],
   "source": {
    "id": "general-398-60962",
    "name": "秦琼",
    "role": "武将",
    "martial": 98,
    "intelligence": 75,
    "leadership": 83,
    "tags": [
     "勇将"
    ],
    "biography": "唐初将领，以骁勇善战著称，多次随李世民作战，不采用演义中的虚构排名。",
    "dynasty": "隋唐",
    "source": "https://zh.wikipedia.org/?curid=134467",
    "sourceTitle": "维基百科：秦琼（导言节录，CC BY-SA 4.0）",
    "historicalVerified": true
   },
   "historical_definition_id": "general-398-60962",
   "art": {
    "avatar": "assets/officials/historical/general-398-60962/avatar.png",
    "full": "assets/officials/historical/general-398-60962/full.png",
    "court": "assets/officials/historical/general-398-60962/court.png"
   },
   "evidence_status": "现有人物简介可追溯",
   "design_basis": "唐初将领，以骁勇善战著称，多次随李世民作战，不采用演义中的虚构排名。",
   "ui_archetype": "武将",
   "cost_basis": "费用统一支付身体、关键词与技能预算；不按名气定高费，不把智力直接换算成个人攻击。",
   "ui_requirements": [
    "使用关联人物现有头像与姓名",
    "服饰与时代、文武身份相符",
    "技能表现采用军令、兵器、阵形或军需，不画无史据法术",
    "史料不足沿用原作资源并标记待核，不据同名猜朝代"
   ]
  },
  {
   "id": "person_original-88",
   "person_id": "original-88",
   "name": "尉迟恭",
   "type": "general",
   "kind": "source",
   "cost": 5,
   "attack": 4,
   "health": 5,
   "tags": [
    "taunt"
   ],
   "skill": "护卫",
   "enter": [
    {
     "op": "armor",
     "n": 2
    }
   ],
   "death": [],
   "source": {
    "id": "original-88",
    "name": "尉迟恭",
    "role": "武将",
    "martial": 91,
    "intelligence": 52,
    "leadership": 91,
    "tags": [
     "原作人物"
    ],
    "biography": "原作特殊人物表收录，未匹配到现有人物史料。",
    "dynasty": "原作",
    "source": "",
    "sourceTitle": "原作反汇编人物表",
    "historicalVerified": false
   },
   "historical_definition_id": "original-88",
   "art": {
    "avatar": "assets/officials/historical/original-88/avatar.png",
    "full": "assets/officials/historical/original-88/full.png",
    "court": "assets/officials/historical/original-88/court.png"
   },
   "evidence_status": "原作模板，历史关联待补核",
   "design_basis": "原作特殊人物表收录，未匹配到现有人物史料。",
   "ui_archetype": "武将",
   "cost_basis": "费用统一支付身体、关键词与技能预算；不按名气定高费，不把智力直接换算成个人攻击。",
   "ui_requirements": [
    "使用关联人物现有头像与姓名",
    "服饰与时代、文武身份相符",
    "技能表现采用军令、兵器、阵形或军需，不画无史据法术",
    "史料不足沿用原作资源并标记待核，不据同名猜朝代"
   ]
  },
  {
   "id": "person_original-89",
   "person_id": "original-89",
   "name": "李密",
   "type": "general",
   "kind": "source",
   "cost": 5,
   "attack": 3,
   "health": 5,
   "tags": [],
   "skill": "筹兵",
   "enter": [
    {
     "op": "draw",
     "n": 1,
     "filter": "troop"
    },
    {
     "op": "discount",
     "n": 1
    }
   ],
   "death": [],
   "source": {
    "id": "original-89",
    "name": "李密",
    "role": "文职",
    "martial": 90,
    "intelligence": 90,
    "leadership": 90,
    "tags": [
     "原作人物"
    ],
    "biography": "原作特殊人物表收录，未匹配到现有人物史料。",
    "dynasty": "原作",
    "source": "",
    "sourceTitle": "原作反汇编人物表",
    "historicalVerified": false
   },
   "historical_definition_id": "original-89",
   "art": {
    "avatar": "assets/officials/historical/original-89/avatar.png",
    "full": "assets/officials/historical/original-89/full.png",
    "court": "assets/officials/historical/original-89/court.png"
   },
   "evidence_status": "原作模板，历史关联待补核",
   "design_basis": "原作特殊人物表收录，未匹配到现有人物史料。",
   "ui_archetype": "武将",
   "cost_basis": "费用统一支付身体、关键词与技能预算；不按名气定高费，不把智力直接换算成个人攻击。",
   "ui_requirements": [
    "使用关联人物现有头像与姓名",
    "服饰与时代、文武身份相符",
    "技能表现采用军令、兵器、阵形或军需，不画无史据法术",
    "史料不足沿用原作资源并标记待核，不据同名猜朝代"
   ]
  },
  {
   "id": "person_cbdb-3332",
   "person_id": "cbdb-3332",
   "name": "韩愈",
   "type": "general",
   "kind": "source",
   "cost": 3,
   "attack": 2,
   "health": 4,
   "tags": [],
   "skill": "振作军心",
   "enter": [
    {
     "op": "heal",
     "n": 3
    }
   ],
   "death": [],
   "source": {
    "id": "cbdb-3332",
    "name": "韩愈",
    "role": "文职",
    "martial": 18,
    "intelligence": 96,
    "leadership": 31,
    "tags": [
     "文学名家",
     "名臣"
    ],
    "biography": "唐代文学家，倡导古文运动，曾出使镇州宣抚，谏迎佛骨获贬。",
    "dynasty": "唐",
    "source": "https://zh.wikipedia.org/?curid=16413",
    "sourceTitle": "维基百科：韩愈（导言节录，CC BY-SA 4.0）",
    "historicalVerified": true
   },
   "historical_definition_id": "cbdb-3332",
   "art": {
    "avatar": "assets/officials/historical/cbdb-3332/avatar.png",
    "full": "assets/officials/historical/cbdb-3332/full.png",
    "court": "assets/officials/historical/cbdb-3332/court.png"
   },
   "evidence_status": "现有人物简介可追溯",
   "design_basis": "唐代文学家，倡导古文运动，曾出使镇州宣抚，谏迎佛骨获贬。",
   "ui_archetype": "文臣谋士",
   "cost_basis": "费用统一支付身体、关键词与技能预算；不按名气定高费，不把智力直接换算成个人攻击。",
   "ui_requirements": [
    "使用关联人物现有头像与姓名",
    "服饰与时代、文武身份相符",
    "技能表现采用军令、兵器、阵形或军需，不画无史据法术",
    "史料不足沿用原作资源并标记待核，不据同名猜朝代"
   ]
  },
  {
   "id": "person_general-638-62417",
   "person_id": "general-638-62417",
   "name": "拔都",
   "type": "general",
   "kind": "source",
   "cost": 5,
   "attack": 3,
   "health": 4,
   "tags": [
    "rush"
   ],
   "skill": "骑阵进击",
   "enter": [
    {
     "op": "buff",
     "a": 0,
     "h": 1,
     "mask": "cavalry",
     "target": "friend",
     "temp": false
    }
   ],
   "death": [],
   "source": {
    "id": "general-638-62417",
    "name": "拔都",
    "role": "武将",
    "martial": 43,
    "intelligence": 60,
    "leadership": 62,
    "tags": [
     "领军"
    ],
    "biography": "拔都（蒙古语：ᠪᠠᠲᠣ，鲍培转写：Batu，秘史记音：巴秃，西里尔字母：Бат，1209年—1256年），是铁木真之孙，朮赤的次子，生母是兀乞旭真可敦，为弘吉剌部按陈那颜的女儿。蒙古钦察汗国的开创者。蒙古人因他对部下宽大，称他赛因汗（即“慈善可汗”之意）。",
    "dynasty": "元",
    "source": "https://zh.wikipedia.org/?curid=100626",
    "sourceTitle": "维基百科：拔都（导言节录，CC BY-SA 4.0）",
    "historicalVerified": true
   },
   "historical_definition_id": "general-638-62417",
   "art": {
    "avatar": "assets/officials/historical/general-638-62417/avatar.png",
    "full": "assets/officials/historical/general-638-62417/full.png",
    "court": "assets/officials/historical/general-638-62417/court.png"
   },
   "evidence_status": "现有人物简介可追溯",
   "design_basis": "拔都（蒙古语：ᠪᠠᠲᠣ，鲍培转写：Batu，秘史记音：巴秃，西里尔字母：Бат，1209年—1256年），是铁木真之孙，朮赤的次子，生母是兀乞旭真可敦，为弘吉剌部按陈那颜的女儿。蒙古钦察汗国的开创者。蒙古人因他对部下宽大，称他赛因汗（即“慈善可汗”之意）。",
   "ui_archetype": "文武兼长",
   "cost_basis": "费用统一支付身体、关键词与技能预算；不按名气定高费，不把智力直接换算成个人攻击。",
   "ui_requirements": [
    "使用关联人物现有头像与姓名",
    "服饰与时代、文武身份相符",
    "技能表现采用军令、兵器、阵形或军需，不画无史据法术",
    "史料不足沿用原作资源并标记待核，不据同名猜朝代"
   ]
  },
  {
   "id": "person_general-795-83328",
   "person_id": "general-795-83328",
   "name": "郑成功",
   "type": "general",
   "kind": "source",
   "cost": 6,
   "attack": 4,
   "health": 6,
   "tags": [],
   "skill": "水陆并进",
   "enter": [
    {
     "op": "buff",
     "a": 1,
     "h": 1,
     "mask": "ranged",
     "target": "friend",
     "temp": false
    },
    {
     "op": "armor",
     "n": 2
    }
   ],
   "death": [],
   "source": {
    "id": "general-795-83328",
    "name": "郑成功",
    "role": "武将",
    "martial": 88,
    "intelligence": 94,
    "leadership": 96,
    "tags": [
     "名将"
    ],
    "biography": "明清之际将领，经营东南沿海并收复台湾，善水陆协同、海上后勤和军政组织。",
    "dynasty": "明",
    "source": "https://zh.wikipedia.org/?curid=35169",
    "sourceTitle": "维基百科：郑成功（导言节录，CC BY-SA 4.0）",
    "historicalVerified": true
   },
   "historical_definition_id": "general-795-83328",
   "art": {
    "avatar": "assets/officials/historical/general-795-83328/avatar.png",
    "full": "assets/officials/historical/general-795-83328/full.png",
    "court": "assets/officials/historical/general-795-83328/court.png"
   },
   "evidence_status": "现有人物简介可追溯",
   "design_basis": "明清之际将领，经营东南沿海并收复台湾，善水陆协同、海上后勤和军政组织。",
   "ui_archetype": "武将",
   "cost_basis": "费用统一支付身体、关键词与技能预算；不按名气定高费，不把智力直接换算成个人攻击。",
   "ui_requirements": [
    "使用关联人物现有头像与姓名",
    "服饰与时代、文武身份相符",
    "技能表现采用军令、兵器、阵形或军需，不画无史据法术",
    "史料不足沿用原作资源并标记待核，不据同名猜朝代"
   ]
  },
  {
   "id": "person_manual-1616",
   "person_id": "manual-1616",
   "name": "袁崇焕",
   "type": "general",
   "kind": "source",
   "cost": 6,
   "attack": 3,
   "health": 7,
   "tags": [
    "taunt"
   ],
   "skill": "坚城御敌",
   "enter": [
    {
     "op": "armor",
     "n": 3
    }
   ],
   "death": [],
   "source": {
    "id": "manual-1616",
    "name": "袁崇焕",
    "role": "武将",
    "martial": 43,
    "intelligence": 91,
    "leadership": 88,
    "tags": [
     "名将"
    ],
    "biography": "明末辽东重臣，宁远、宁锦防御有功，擅筑城守御，处置毛文龙等事存在争议。",
    "dynasty": "明",
    "source": "https://zh.wikipedia.org/?curid=65732",
    "sourceTitle": "维基百科：袁崇焕（导言节录，CC BY-SA 4.0）",
    "historicalVerified": true
   },
   "historical_definition_id": "manual-1616",
   "art": {
    "avatar": "assets/officials/historical/manual-1616/avatar.png",
    "full": "assets/officials/historical/manual-1616/full.png",
    "court": "assets/officials/historical/manual-1616/court.png"
   },
   "evidence_status": "现有人物简介可追溯",
   "design_basis": "明末辽东重臣，宁远、宁锦防御有功，擅筑城守御，处置毛文龙等事存在争议。",
   "ui_archetype": "文武兼长",
   "cost_basis": "费用统一支付身体、关键词与技能预算；不按名气定高费，不把智力直接换算成个人攻击。",
   "ui_requirements": [
    "使用关联人物现有头像与姓名",
    "服饰与时代、文武身份相符",
    "技能表现采用军令、兵器、阵形或军需，不画无史据法术",
    "史料不足沿用原作资源并标记待核，不据同名猜朝代"
   ]
  },
  {
   "id": "person_manual-1625",
   "person_id": "manual-1625",
   "name": "刘墉",
   "type": "general",
   "kind": "source",
   "cost": 4,
   "attack": 2,
   "health": 5,
   "tags": [],
   "skill": "稽核军需",
   "enter": [
    {
     "op": "draw",
     "n": 1
    }
   ],
   "death": [],
   "source": {
    "id": "manual-1625",
    "name": "刘墉",
    "role": "文职",
    "martial": 9,
    "intelligence": 87,
    "leadership": 20,
    "tags": [
     "名臣"
    ],
    "biography": "清代官员、书法家，历任地方和中央职务，具有清官声誉，民间传说不全等于史实。",
    "dynasty": "清",
    "source": "https://zh.wikipedia.org/wiki/%E5%88%98%E5%A2%89",
    "sourceTitle": "人物身份资料，尚缺详传",
    "historicalVerified": true
   },
   "historical_definition_id": "manual-1625",
   "art": {
    "avatar": "assets/officials/historical/manual-1625/avatar.png",
    "full": "assets/officials/historical/manual-1625/full.png",
    "court": "assets/officials/historical/manual-1625/court.png"
   },
   "evidence_status": "现有人物简介可追溯",
   "design_basis": "清代官员、书法家，历任地方和中央职务，具有清官声誉，民间传说不全等于史实。",
   "ui_archetype": "文臣谋士",
   "cost_basis": "费用统一支付身体、关键词与技能预算；不按名气定高费，不把智力直接换算成个人攻击。",
   "ui_requirements": [
    "使用关联人物现有头像与姓名",
    "服饰与时代、文武身份相符",
    "技能表现采用军令、兵器、阵形或军需，不画无史据法术",
    "史料不足沿用原作资源并标记待核，不据同名猜朝代"
   ]
  },
  {
   "id": "person_manual-1618",
   "person_id": "manual-1618",
   "name": "魏忠贤",
   "type": "general",
   "kind": "source",
   "cost": 4,
   "attack": 2,
   "health": 3,
   "tags": [],
   "skill": "专断",
   "enter": [
    {
     "op": "silence",
     "target": "enemy"
    },
    {
     "op": "refund",
     "n": 1
    }
   ],
   "death": [],
   "source": {
    "id": "manual-1618",
    "name": "魏忠贤",
    "role": "文职",
    "martial": 21,
    "intelligence": 76,
    "leadership": 28,
    "tags": [
     "权宦",
     "奸臣"
    ],
    "biography": "明熹宗时期权宦，操纵朝政、迫害异己，组织与结党能力不等于学识或清廉。",
    "dynasty": "明",
    "source": "https://zh.wikipedia.org/?curid=91350",
    "sourceTitle": "维基百科：魏忠贤（导言节录，CC BY-SA 4.0）",
    "historicalVerified": true
   },
   "historical_definition_id": "manual-1618",
   "art": {
    "avatar": "assets/officials/historical/manual-1618/avatar.png",
    "full": "assets/officials/historical/manual-1618/full.png",
    "court": "assets/officials/historical/manual-1618/court.png"
   },
   "evidence_status": "现有人物简介可追溯",
   "design_basis": "明熹宗时期权宦，操纵朝政、迫害异己，组织与结党能力不等于学识或清廉。",
   "ui_archetype": "文臣谋士",
   "cost_basis": "费用统一支付身体、关键词与技能预算；不按名气定高费，不把智力直接换算成个人攻击。",
   "ui_requirements": [
    "使用关联人物现有头像与姓名",
    "服饰与时代、文武身份相符",
    "技能表现采用军令、兵器、阵形或军需，不画无史据法术",
    "史料不足沿用原作资源并标记待核，不据同名猜朝代"
   ]
  },
  {
   "id": "person_manual-1624",
   "person_id": "manual-1624",
   "name": "和珅",
   "type": "general",
   "kind": "source",
   "cost": 4,
   "attack": 2,
   "health": 4,
   "tags": [],
   "skill": "调度财货",
   "enter": [
    {
     "op": "draw",
     "n": 1,
     "filter": "tactic"
    },
    {
     "op": "selfdamage",
     "n": 2
    }
   ],
   "death": [],
   "source": {
    "id": "manual-1624",
    "name": "和珅",
    "role": "文职",
    "martial": 12,
    "intelligence": 91,
    "leadership": 26,
    "tags": [
     "贪臣"
    ],
    "biography": "清乾隆朝重臣，擅长政务、财政与迎合皇帝，巨额贪赃使清廉极低。",
    "dynasty": "清",
    "source": "https://zh.wikipedia.org/?curid=7415",
    "sourceTitle": "维基百科：和珅（导言节录，CC BY-SA 4.0）",
    "historicalVerified": true
   },
   "historical_definition_id": "manual-1624",
   "art": {
    "avatar": "assets/officials/historical/manual-1624/avatar.png",
    "full": "assets/officials/historical/manual-1624/full.png",
    "court": "assets/officials/historical/manual-1624/court.png"
   },
   "evidence_status": "现有人物简介可追溯",
   "design_basis": "清乾隆朝重臣，擅长政务、财政与迎合皇帝，巨额贪赃使清廉极低。",
   "ui_archetype": "文臣谋士",
   "cost_basis": "费用统一支付身体、关键词与技能预算；不按名气定高费，不把智力直接换算成个人攻击。",
   "ui_requirements": [
    "使用关联人物现有头像与姓名",
    "服饰与时代、文武身份相符",
    "技能表现采用军令、兵器、阵形或军需，不画无史据法术",
    "史料不足沿用原作资源并标记待核，不据同名猜朝代"
   ]
  },
  {
   "id": "person_original-97",
   "person_id": "original-97",
   "name": "刘耀伦",
   "type": "general",
   "kind": "source",
   "cost": 5,
   "attack": 4,
   "health": 5,
   "tags": [
    "taunt"
   ],
   "skill": "统兵",
   "enter": [
    {
     "op": "armor",
     "n": 1
    }
   ],
   "death": [],
   "source": {
    "id": "original-97",
    "name": "刘耀伦",
    "role": "武将",
    "martial": 90,
    "intelligence": 80,
    "leadership": 90,
    "tags": [
     "原作人物"
    ],
    "biography": "原作特殊人物表收录，未匹配到现有人物史料。",
    "dynasty": "原作",
    "source": "",
    "sourceTitle": "原作反汇编人物表",
    "historicalVerified": false
   },
   "historical_definition_id": "original-97",
   "art": {
    "avatar": "assets/officials/historical/original-97/avatar.png",
    "full": "assets/officials/historical/original-97/full.png",
    "court": "assets/officials/historical/original-97/court.png"
   },
   "evidence_status": "原作模板，历史关联待补核",
   "design_basis": "原作特殊人物表收录，未匹配到现有人物史料。",
   "ui_archetype": "武将",
   "cost_basis": "费用统一支付身体、关键词与技能预算；不按名气定高费，不把智力直接换算成个人攻击。",
   "ui_requirements": [
    "使用关联人物现有头像与姓名",
    "服饰与时代、文武身份相符",
    "技能表现采用军令、兵器、阵形或军需，不画无史据法术",
    "史料不足沿用原作资源并标记待核，不据同名猜朝代"
   ]
  },
  {
   "id": "person_original-98",
   "person_id": "original-98",
   "name": "邹鹏",
   "type": "general",
   "kind": "source",
   "cost": 4,
   "attack": 3,
   "health": 4,
   "tags": [],
   "skill": "筹策",
   "enter": [
    {
     "op": "draw",
     "n": 1
    }
   ],
   "death": [],
   "source": {
    "id": "original-98",
    "name": "邹鹏",
    "role": "文职",
    "martial": 70,
    "intelligence": 90,
    "leadership": 70,
    "tags": [
     "原作人物"
    ],
    "biography": "原作特殊人物表收录，未匹配到现有人物史料。",
    "dynasty": "原作",
    "source": "",
    "sourceTitle": "原作反汇编人物表",
    "historicalVerified": false
   },
   "historical_definition_id": "original-98",
   "art": {
    "avatar": "assets/officials/historical/original-98/avatar.png",
    "full": "assets/officials/historical/original-98/full.png",
    "court": "assets/officials/historical/original-98/court.png"
   },
   "evidence_status": "原作模板，历史关联待补核",
   "design_basis": "原作特殊人物表收录，未匹配到现有人物史料。",
   "ui_archetype": "文武兼长",
   "cost_basis": "费用统一支付身体、关键词与技能预算；不按名气定高费，不把智力直接换算成个人攻击。",
   "ui_requirements": [
    "使用关联人物现有头像与姓名",
    "服饰与时代、文武身份相符",
    "技能表现采用军令、兵器、阵形或军需，不画无史据法术",
    "史料不足沿用原作资源并标记待核，不据同名猜朝代"
   ]
  },
  {
   "id": "person_original-99",
   "person_id": "original-99",
   "name": "沈昌平",
   "type": "general",
   "kind": "source",
   "cost": 4,
   "attack": 3,
   "health": 5,
   "tags": [],
   "skill": "整军",
   "enter": [
    {
     "op": "heal",
     "n": 2
    }
   ],
   "death": [],
   "source": {
    "id": "original-99",
    "name": "沈昌平",
    "role": "文职",
    "martial": 65,
    "intelligence": 90,
    "leadership": 65,
    "tags": [
     "原作人物"
    ],
    "biography": "原作特殊人物表收录，未匹配到现有人物史料。",
    "dynasty": "原作",
    "source": "",
    "sourceTitle": "原作反汇编人物表",
    "historicalVerified": false
   },
   "historical_definition_id": "original-99",
   "art": {
    "avatar": "assets/officials/historical/original-99/avatar.png",
    "full": "assets/officials/historical/original-99/full.png",
    "court": "assets/officials/historical/original-99/court.png"
   },
   "evidence_status": "原作模板，历史关联待补核",
   "design_basis": "原作特殊人物表收录，未匹配到现有人物史料。",
   "ui_archetype": "文武兼长",
   "cost_basis": "费用统一支付身体、关键词与技能预算；不按名气定高费，不把智力直接换算成个人攻击。",
   "ui_requirements": [
    "使用关联人物现有头像与姓名",
    "服饰与时代、文武身份相符",
    "技能表现采用军令、兵器、阵形或军需，不画无史据法术",
    "史料不足沿用原作资源并标记待核，不据同名猜朝代"
   ]
  }
 ],
 "initial_generals": [
  {
   "id": "initial_central-general",
   "pool": "command_0",
   "role": "command",
   "tier": 0,
   "primary_min": 0,
   "primary_max": 59,
   "variant": 1,
   "name": "沈文远",
   "type": "general",
   "kind": "source",
   "cost": 3,
   "attack": 2,
   "health": 3,
   "tags": [],
   "skill": "通用统领",
   "enter": [
    {
     "op": "armor",
     "n": 1
    }
   ],
   "death": [],
   "requires_martial": 0,
   "person_id": "central-general",
   "source": {
    "id": "central-general",
    "name": "沈文远",
    "role": null,
    "martial": 36,
    "intelligence": 36,
    "leadership": 37,
    "tags": null,
    "biography": null
   },
   "profile": {
    "personId": "central-general",
    "name": "沈文远",
    "portraitId": "random-military-3",
    "abilities": {
     "id": "central-general",
     "name": "沈文远",
     "role": null,
     "martial": 36,
     "intelligence": 36,
     "leadership": 37,
     "tags": null,
     "biography": null
    },
    "role": "command",
    "tier": 0,
    "poolId": "command_0",
    "templateId": "random_command_0_1",
    "generationVersion": 1,
    "generationSeed": 77000
   }
  },
  {
   "id": "initial_hebei-general",
   "pool": "intelligence_0",
   "role": "intelligence",
   "tier": 0,
   "primary_min": 0,
   "primary_max": 59,
   "variant": 1,
   "name": "陆文远",
   "type": "general",
   "kind": "source",
   "cost": 3,
   "attack": 1,
   "health": 2,
   "tags": [],
   "skill": "通用谋士",
   "enter": [
    {
     "op": "heal",
     "n": 2
    }
   ],
   "death": [],
   "requires_martial": 0,
   "person_id": "hebei-general",
   "source": {
    "id": "hebei-general",
    "name": "陆文远",
    "role": null,
    "martial": 49,
    "intelligence": 46,
    "leadership": 35,
    "tags": null,
    "biography": null
   },
   "profile": {
    "personId": "hebei-general",
    "name": "陆文远",
    "portraitId": "random-military-8",
    "abilities": {
     "id": "hebei-general",
     "name": "陆文远",
     "role": null,
     "martial": 49,
     "intelligence": 46,
     "leadership": 35,
     "tags": null,
     "biography": null
    },
    "role": "intelligence",
    "tier": 0,
    "poolId": "intelligence_0",
    "templateId": "random_intelligence_0_1",
    "generationVersion": 1,
    "generationSeed": 77037
   }
  },
  {
   "id": "initial_henan-general",
   "pool": "martial_2",
   "role": "martial",
   "tier": 2,
   "primary_min": 75,
   "primary_max": 89,
   "variant": 2,
   "name": "韩守正",
   "type": "general",
   "kind": "source",
   "cost": 5,
   "attack": 4,
   "health": 5,
   "tags": [
    "taunt"
   ],
   "skill": "通用勇将",
   "enter": [],
   "death": [],
   "requires_martial": 0,
   "person_id": "henan-general",
   "source": {
    "id": "henan-general",
    "name": "韩守正",
    "role": null,
    "martial": 76,
    "intelligence": 42,
    "leadership": 40,
    "tags": null,
    "biography": null
   },
   "profile": {
    "personId": "henan-general",
    "name": "韩守正",
    "portraitId": "random-military-9",
    "abilities": {
     "id": "henan-general",
     "name": "韩守正",
     "role": null,
     "martial": 76,
     "intelligence": 42,
     "leadership": 40,
     "tags": null,
     "biography": null
    },
    "role": "martial",
    "tier": 2,
    "poolId": "martial_2",
    "templateId": "random_martial_2_2",
    "generationVersion": 1,
    "generationSeed": 77074
   }
  },
  {
   "id": "initial_huainan-general",
   "pool": "martial_1",
   "role": "martial",
   "tier": 1,
   "primary_min": 60,
   "primary_max": 74,
   "variant": 0,
   "name": "张景行",
   "type": "general",
   "kind": "source",
   "cost": 4,
   "attack": 4,
   "health": 2,
   "tags": [
    "rush"
   ],
   "skill": "通用勇将",
   "enter": [],
   "death": [],
   "requires_martial": 60,
   "person_id": "huainan-general",
   "source": {
    "id": "huainan-general",
    "name": "张景行",
    "role": null,
    "martial": 65,
    "intelligence": 40,
    "leadership": 35,
    "tags": null,
    "biography": null
   },
   "profile": {
    "personId": "huainan-general",
    "name": "张景行",
    "portraitId": "random-military-6",
    "abilities": {
     "id": "huainan-general",
     "name": "张景行",
     "role": null,
     "martial": 65,
     "intelligence": 40,
     "leadership": 35,
     "tags": null,
     "biography": null
    },
    "role": "martial",
    "tier": 1,
    "poolId": "martial_1",
    "templateId": "random_martial_1_0",
    "generationVersion": 1,
    "generationSeed": 77111
   }
  },
  {
   "id": "initial_jiangnan-general",
   "pool": "intelligence_1",
   "role": "intelligence",
   "tier": 1,
   "primary_min": 60,
   "primary_max": 74,
   "variant": 2,
   "name": "沈怀安",
   "type": "general",
   "kind": "source",
   "cost": 4,
   "attack": 2,
   "health": 4,
   "tags": [],
   "skill": "通用谋士",
   "enter": [
    {
     "op": "draw",
     "n": 1,
     "filter": "low"
    }
   ],
   "death": [],
   "requires_martial": 0,
   "person_id": "jiangnan-general",
   "source": {
    "id": "jiangnan-general",
    "name": "沈怀安",
    "role": null,
    "martial": 62,
    "intelligence": 66,
    "leadership": 59,
    "tags": null,
    "biography": null
   },
   "profile": {
    "personId": "jiangnan-general",
    "name": "沈怀安",
    "portraitId": "random-military-10",
    "abilities": {
     "id": "jiangnan-general",
     "name": "沈怀安",
     "role": null,
     "martial": 62,
     "intelligence": 66,
     "leadership": 59,
     "tags": null,
     "biography": null
    },
    "role": "intelligence",
    "tier": 1,
    "poolId": "intelligence_1",
    "templateId": "random_intelligence_1_2",
    "generationVersion": 1,
    "generationSeed": 77148
   }
  },
  {
   "id": "initial_lingnan-general",
   "pool": "martial_1",
   "role": "martial",
   "tier": 1,
   "primary_min": 60,
   "primary_max": 74,
   "variant": 2,
   "name": "顾明德",
   "type": "general",
   "kind": "source",
   "cost": 4,
   "attack": 3,
   "health": 4,
   "tags": [
    "taunt"
   ],
   "skill": "通用勇将",
   "enter": [],
   "death": [],
   "requires_martial": 0,
   "person_id": "lingnan-general",
   "source": {
    "id": "lingnan-general",
    "name": "顾明德",
    "role": null,
    "martial": 69,
    "intelligence": 72,
    "leadership": 76,
    "tags": null,
    "biography": null
   },
   "profile": {
    "personId": "lingnan-general",
    "name": "顾明德",
    "portraitId": "random-military-2",
    "abilities": {
     "id": "lingnan-general",
     "name": "顾明德",
     "role": null,
     "martial": 69,
     "intelligence": 72,
     "leadership": 76,
     "tags": null,
     "biography": null
    },
    "role": "martial",
    "tier": 1,
    "poolId": "martial_1",
    "templateId": "random_martial_1_2",
    "generationVersion": 1,
    "generationSeed": 77185
   }
  },
  {
   "id": "initial_hedong-general",
   "pool": "command_1",
   "role": "command",
   "tier": 1,
   "primary_min": 60,
   "primary_max": 74,
   "variant": 0,
   "name": "许文远",
   "type": "general",
   "kind": "source",
   "cost": 4,
   "attack": 3,
   "health": 5,
   "tags": [
    "taunt"
   ],
   "skill": "通用统领",
   "enter": [],
   "death": [],
   "requires_martial": 0,
   "person_id": "hedong-general",
   "source": {
    "id": "hedong-general",
    "name": "许文远",
    "role": null,
    "martial": 50,
    "intelligence": 69,
    "leadership": 74,
    "tags": null,
    "biography": null
   },
   "profile": {
    "personId": "hedong-general",
    "name": "许文远",
    "portraitId": "random-military-7",
    "abilities": {
     "id": "hedong-general",
     "name": "许文远",
     "role": null,
     "martial": 50,
     "intelligence": 69,
     "leadership": 74,
     "tags": null,
     "biography": null
    },
    "role": "command",
    "tier": 1,
    "poolId": "command_1",
    "templateId": "random_command_1_0",
    "generationVersion": 1,
    "generationSeed": 77222
   }
  },
  {
   "id": "initial_guannei-general",
   "pool": "intelligence_2",
   "role": "intelligence",
   "tier": 2,
   "primary_min": 75,
   "primary_max": 89,
   "variant": 0,
   "name": "李守正",
   "type": "general",
   "kind": "source",
   "cost": 5,
   "attack": 2,
   "health": 6,
   "tags": [],
   "skill": "通用谋士",
   "enter": [
    {
     "op": "draw",
     "n": 1
    }
   ],
   "death": [],
   "requires_martial": 0,
   "person_id": "guannei-general",
   "source": {
    "id": "guannei-general",
    "name": "李守正",
    "role": null,
    "martial": 35,
    "intelligence": 77,
    "leadership": 80,
    "tags": null,
    "biography": null
   },
   "profile": {
    "personId": "guannei-general",
    "name": "李守正",
    "portraitId": "random-military-3",
    "abilities": {
     "id": "guannei-general",
     "name": "李守正",
     "role": null,
     "martial": 35,
     "intelligence": 77,
     "leadership": 80,
     "tags": null,
     "biography": null
    },
    "role": "intelligence",
    "tier": 2,
    "poolId": "intelligence_2",
    "templateId": "random_intelligence_2_0",
    "generationVersion": 1,
    "generationSeed": 77259
   }
  },
  {
   "id": "initial_shannan-general",
   "pool": "command_2",
   "role": "command",
   "tier": 2,
   "primary_min": 75,
   "primary_max": 89,
   "variant": 1,
   "name": "陆景行",
   "type": "general",
   "kind": "source",
   "cost": 5,
   "attack": 4,
   "health": 7,
   "tags": [],
   "skill": "通用统领",
   "enter": [
    {
     "op": "buff",
     "a": 1,
     "h": 1,
     "target": "friend"
    }
   ],
   "death": [],
   "requires_martial": 0,
   "person_id": "shannan-general",
   "source": {
    "id": "shannan-general",
    "name": "陆景行",
    "role": null,
    "martial": 89,
    "intelligence": 32,
    "leadership": 81,
    "tags": null,
    "biography": null
   },
   "profile": {
    "personId": "shannan-general",
    "name": "陆景行",
    "portraitId": "random-military-3",
    "abilities": {
     "id": "shannan-general",
     "name": "陆景行",
     "role": null,
     "martial": 89,
     "intelligence": 32,
     "leadership": 81,
     "tags": null,
     "biography": null
    },
    "role": "command",
    "tier": 2,
    "poolId": "command_2",
    "templateId": "random_command_2_1",
    "generationVersion": 1,
    "generationSeed": 77296
   }
  },
  {
   "id": "initial_jiannan-general",
   "pool": "command_1",
   "role": "command",
   "tier": 1,
   "primary_min": 60,
   "primary_max": 74,
   "variant": 2,
   "name": "韩怀安",
   "type": "general",
   "kind": "source",
   "cost": 4,
   "attack": 2,
   "health": 5,
   "tags": [],
   "skill": "通用统领",
   "enter": [
    {
     "op": "armor",
     "n": 2
    }
   ],
   "death": [],
   "requires_martial": 0,
   "person_id": "jiannan-general",
   "source": {
    "id": "jiannan-general",
    "name": "韩怀安",
    "role": null,
    "martial": 50,
    "intelligence": 72,
    "leadership": 63,
    "tags": null,
    "biography": null
   },
   "profile": {
    "personId": "jiannan-general",
    "name": "韩怀安",
    "portraitId": "random-military-9",
    "abilities": {
     "id": "jiannan-general",
     "name": "韩怀安",
     "role": null,
     "martial": 50,
     "intelligence": 72,
     "leadership": 63,
     "tags": null,
     "biography": null
    },
    "role": "command",
    "tier": 1,
    "poolId": "command_1",
    "templateId": "random_command_1_2",
    "generationVersion": 1,
    "generationSeed": 77333
   }
  },
  {
   "id": "initial_longyou-general",
   "pool": "intelligence_2",
   "role": "intelligence",
   "tier": 2,
   "primary_min": 75,
   "primary_max": 89,
   "variant": 1,
   "name": "张明德",
   "type": "general",
   "kind": "source",
   "cost": 5,
   "attack": 3,
   "health": 4,
   "tags": [],
   "skill": "通用谋士",
   "enter": [
    {
     "op": "silence",
     "target": "enemy"
    }
   ],
   "death": [],
   "requires_martial": 0,
   "person_id": "longyou-general",
   "source": {
    "id": "longyou-general",
    "name": "张明德",
    "role": null,
    "martial": 66,
    "intelligence": 84,
    "leadership": 35,
    "tags": null,
    "biography": null
   },
   "profile": {
    "personId": "longyou-general",
    "name": "张明德",
    "portraitId": "random-military-9",
    "abilities": {
     "id": "longyou-general",
     "name": "张明德",
     "role": null,
     "martial": 66,
     "intelligence": 84,
     "leadership": 35,
     "tags": null,
     "biography": null
    },
    "role": "intelligence",
    "tier": 2,
    "poolId": "intelligence_2",
    "templateId": "random_intelligence_2_1",
    "generationVersion": 1,
    "generationSeed": 77370
   }
  }
 ],
 "heroes": {
  "martial": {
   "name": "督战",
   "cost": 2,
   "effect": {
    "op": "ping",
    "n": 1,
    "target": "enemy_any"
   },
   "health": 30
  },
  "intelligence": {
   "name": "运筹",
   "cost": 2,
   "effect": [
    {
     "op": "draw",
     "n": 1
    },
    {
     "op": "selfdamage",
     "n": 2
    }
   ],
   "health": 30
  },
  "command": {
   "name": "整军",
   "cost": 2,
   "effect": {
    "op": "heal",
    "n": 2,
    "target": "friendly_any"
   },
   "health": 30
  }
 },
 "coin": {
  "id": "coin",
  "name": "调兵令",
  "type": "spell",
  "cost": 0,
  "attack": null,
  "health": null,
  "tags": [],
  "enter": [
   {
    "op": "refund",
    "n": 1
   }
  ],
  "death": []
 },
 "source_counts": {
  "active": 100,
  "military": 58,
  "civil": 42,
  "initial": 11
 },
 "parameters": {
  "initial_troop_cap": 18,
  "people_cap": 3,
  "spell_copies": "archetype_curve_at_most_two_until_slots_exhausted",
  "elite_every": 3,
  "scout_cap": 5,
  "starting_mana": 1,
  "hand_limit": 10,
  "board_limit": 7,
  "hero_health": 30,
  "reserve_default": "only_when_deck_empty",
  "deck_size": 30,
  "initial_troop_granularity": 25,
  "standard_troop_size": 100,
  "compact_army_health_penalty": "line_elite_person_below_75_minus_1",
  "spell_packages": {
   "martial": [
    "precision",
    "precision",
    "fire",
    "fire",
    "fortify",
    "fortify",
    "assault",
    "supply",
    "supply",
    "pin",
    "dispel",
    "heal"
   ],
   "intelligence": [
    "precision",
    "precision",
    "fire",
    "execute",
    "arrows",
    "arrows",
    "barrage",
    "barrage",
    "pin",
    "pin",
    "supply",
    "dispel"
   ],
   "command": [
    "precision",
    "fire",
    "fire",
    "fortify",
    "fortify",
    "assault",
    "assault",
    "supply",
    "supply",
    "brace",
    "heal",
    "dispel"
   ]
  }
 },
 "random_pools": [
  {
   "id": "random_martial_0_0",
   "pool": "martial_0",
   "role": "martial",
   "tier": 0,
   "primary_min": 0,
   "primary_max": 59,
   "variant": 0,
   "name": "随机人物模板",
   "type": "general",
   "kind": "source",
   "cost": 3,
   "attack": 3,
   "health": 2,
   "tags": [],
   "skill": "勇决1",
   "enter": [],
   "death": [],
   "requires_martial": 0
  },
  {
   "id": "random_martial_0_1",
   "pool": "martial_0",
   "role": "martial",
   "tier": 0,
   "primary_min": 0,
   "primary_max": 59,
   "variant": 1,
   "name": "随机人物模板",
   "type": "general",
   "kind": "source",
   "cost": 3,
   "attack": 2,
   "health": 2,
   "tags": [],
   "skill": "勇决2",
   "enter": [
    {
     "op": "armor",
     "n": 1
    }
   ],
   "death": [],
   "requires_martial": 0
  },
  {
   "id": "random_martial_0_2",
   "pool": "martial_0",
   "role": "martial",
   "tier": 0,
   "primary_min": 0,
   "primary_max": 59,
   "variant": 2,
   "name": "随机人物模板",
   "type": "general",
   "kind": "source",
   "cost": 3,
   "attack": 2,
   "health": 2,
   "tags": [],
   "skill": "勇决3",
   "enter": [
    {
     "op": "heal",
     "n": 1
    }
   ],
   "death": [],
   "requires_martial": 0
  },
  {
   "id": "random_martial_1_0",
   "pool": "martial_1",
   "role": "martial",
   "tier": 1,
   "primary_min": 60,
   "primary_max": 74,
   "variant": 0,
   "name": "随机人物模板",
   "type": "general",
   "kind": "source",
   "cost": 4,
   "attack": 4,
   "health": 3,
   "tags": [
    "rush"
   ],
   "skill": "勇决1",
   "enter": [],
   "death": [],
   "requires_martial": 60
  },
  {
   "id": "random_martial_1_1",
   "pool": "martial_1",
   "role": "martial",
   "tier": 1,
   "primary_min": 60,
   "primary_max": 74,
   "variant": 1,
   "name": "随机人物模板",
   "type": "general",
   "kind": "source",
   "cost": 4,
   "attack": 3,
   "health": 3,
   "tags": [],
   "skill": "勇决2",
   "enter": [
    {
     "op": "damage",
     "n": 1,
     "target": "enemy"
    }
   ],
   "death": [],
   "requires_martial": 0
  },
  {
   "id": "random_martial_1_2",
   "pool": "martial_1",
   "role": "martial",
   "tier": 1,
   "primary_min": 60,
   "primary_max": 74,
   "variant": 2,
   "name": "随机人物模板",
   "type": "general",
   "kind": "source",
   "cost": 4,
   "attack": 3,
   "health": 4,
   "tags": [
    "taunt"
   ],
   "skill": "勇决3",
   "enter": [],
   "death": [],
   "requires_martial": 0
  },
  {
   "id": "random_martial_2_0",
   "pool": "martial_2",
   "role": "martial",
   "tier": 2,
   "primary_min": 75,
   "primary_max": 89,
   "variant": 0,
   "name": "随机人物模板",
   "type": "general",
   "kind": "source",
   "cost": 5,
   "attack": 5,
   "health": 4,
   "tags": [
    "rush"
   ],
   "skill": "勇决1",
   "enter": [],
   "death": [],
   "requires_martial": 60
  },
  {
   "id": "random_martial_2_1",
   "pool": "martial_2",
   "role": "martial",
   "tier": 2,
   "primary_min": 75,
   "primary_max": 89,
   "variant": 1,
   "name": "随机人物模板",
   "type": "general",
   "kind": "source",
   "cost": 5,
   "attack": 4,
   "health": 4,
   "tags": [],
   "skill": "勇决2",
   "enter": [
    {
     "op": "damage",
     "n": 2,
     "target": "enemy"
    }
   ],
   "death": [],
   "requires_martial": 0
  },
  {
   "id": "random_martial_2_2",
   "pool": "martial_2",
   "role": "martial",
   "tier": 2,
   "primary_min": 75,
   "primary_max": 89,
   "variant": 2,
   "name": "随机人物模板",
   "type": "general",
   "kind": "source",
   "cost": 5,
   "attack": 4,
   "health": 5,
   "tags": [
    "taunt"
   ],
   "skill": "勇决3",
   "enter": [],
   "death": [],
   "requires_martial": 0
  },
  {
   "id": "random_martial_3_0",
   "pool": "martial_3",
   "role": "martial",
   "tier": 3,
   "primary_min": 90,
   "primary_max": 100,
   "variant": 0,
   "name": "随机人物模板",
   "type": "general",
   "kind": "source",
   "cost": 6,
   "attack": 6,
   "health": 5,
   "tags": [
    "rush"
   ],
   "skill": "勇决1",
   "enter": [],
   "death": [],
   "requires_martial": 60
  },
  {
   "id": "random_martial_3_1",
   "pool": "martial_3",
   "role": "martial",
   "tier": 3,
   "primary_min": 90,
   "primary_max": 100,
   "variant": 1,
   "name": "随机人物模板",
   "type": "general",
   "kind": "source",
   "cost": 6,
   "attack": 5,
   "health": 5,
   "tags": [],
   "skill": "勇决2",
   "enter": [
    {
     "op": "damage",
     "n": 2,
     "target": "enemy"
    }
   ],
   "death": [],
   "requires_martial": 0
  },
  {
   "id": "random_martial_3_2",
   "pool": "martial_3",
   "role": "martial",
   "tier": 3,
   "primary_min": 90,
   "primary_max": 100,
   "variant": 2,
   "name": "随机人物模板",
   "type": "general",
   "kind": "source",
   "cost": 6,
   "attack": 5,
   "health": 6,
   "tags": [
    "taunt"
   ],
   "skill": "勇决3",
   "enter": [],
   "death": [],
   "requires_martial": 0
  },
  {
   "id": "random_intelligence_0_0",
   "pool": "intelligence_0",
   "role": "intelligence",
   "tier": 0,
   "primary_min": 0,
   "primary_max": 59,
   "variant": 0,
   "name": "随机人物模板",
   "type": "general",
   "kind": "source",
   "cost": 3,
   "attack": 1,
   "health": 3,
   "tags": [],
   "skill": "谋划1",
   "enter": [
    {
     "op": "draw",
     "n": 1
    }
   ],
   "death": [],
   "requires_martial": 0
  },
  {
   "id": "random_intelligence_0_1",
   "pool": "intelligence_0",
   "role": "intelligence",
   "tier": 0,
   "primary_min": 0,
   "primary_max": 59,
   "variant": 1,
   "name": "随机人物模板",
   "type": "general",
   "kind": "source",
   "cost": 3,
   "attack": 1,
   "health": 3,
   "tags": [],
   "skill": "谋划2",
   "enter": [
    {
     "op": "heal",
     "n": 2
    }
   ],
   "death": [],
   "requires_martial": 0
  },
  {
   "id": "random_intelligence_0_2",
   "pool": "intelligence_0",
   "role": "intelligence",
   "tier": 0,
   "primary_min": 0,
   "primary_max": 59,
   "variant": 2,
   "name": "随机人物模板",
   "type": "general",
   "kind": "source",
   "cost": 3,
   "attack": 1,
   "health": 3,
   "tags": [],
   "skill": "谋划3",
   "enter": [
    {
     "op": "draw",
     "n": 1,
     "filter": "low"
    }
   ],
   "death": [],
   "requires_martial": 0
  },
  {
   "id": "random_intelligence_1_0",
   "pool": "intelligence_1",
   "role": "intelligence",
   "tier": 1,
   "primary_min": 60,
   "primary_max": 74,
   "variant": 0,
   "name": "随机人物模板",
   "type": "general",
   "kind": "source",
   "cost": 4,
   "attack": 2,
   "health": 4,
   "tags": [],
   "skill": "谋划1",
   "enter": [
    {
     "op": "draw",
     "n": 1
    }
   ],
   "death": [],
   "requires_martial": 0
  },
  {
   "id": "random_intelligence_1_1",
   "pool": "intelligence_1",
   "role": "intelligence",
   "tier": 1,
   "primary_min": 60,
   "primary_max": 74,
   "variant": 1,
   "name": "随机人物模板",
   "type": "general",
   "kind": "source",
   "cost": 4,
   "attack": 2,
   "health": 4,
   "tags": [],
   "skill": "谋划2",
   "enter": [
    {
     "op": "silence",
     "target": "enemy"
    }
   ],
   "death": [],
   "requires_martial": 0
  },
  {
   "id": "random_intelligence_1_2",
   "pool": "intelligence_1",
   "role": "intelligence",
   "tier": 1,
   "primary_min": 60,
   "primary_max": 74,
   "variant": 2,
   "name": "随机人物模板",
   "type": "general",
   "kind": "source",
   "cost": 4,
   "attack": 2,
   "health": 4,
   "tags": [],
   "skill": "谋划3",
   "enter": [
    {
     "op": "draw",
     "n": 1,
     "filter": "low"
    }
   ],
   "death": [],
   "requires_martial": 0
  },
  {
   "id": "random_intelligence_2_0",
   "pool": "intelligence_2",
   "role": "intelligence",
   "tier": 2,
   "primary_min": 75,
   "primary_max": 89,
   "variant": 0,
   "name": "随机人物模板",
   "type": "general",
   "kind": "source",
   "cost": 5,
   "attack": 3,
   "health": 5,
   "tags": [],
   "skill": "谋划1",
   "enter": [
    {
     "op": "draw",
     "n": 1
    }
   ],
   "death": [],
   "requires_martial": 0
  },
  {
   "id": "random_intelligence_2_1",
   "pool": "intelligence_2",
   "role": "intelligence",
   "tier": 2,
   "primary_min": 75,
   "primary_max": 89,
   "variant": 1,
   "name": "随机人物模板",
   "type": "general",
   "kind": "source",
   "cost": 5,
   "attack": 3,
   "health": 5,
   "tags": [],
   "skill": "谋划2",
   "enter": [
    {
     "op": "silence",
     "target": "enemy"
    }
   ],
   "death": [],
   "requires_martial": 0
  },
  {
   "id": "random_intelligence_2_2",
   "pool": "intelligence_2",
   "role": "intelligence",
   "tier": 2,
   "primary_min": 75,
   "primary_max": 89,
   "variant": 2,
   "name": "随机人物模板",
   "type": "general",
   "kind": "source",
   "cost": 5,
   "attack": 3,
   "health": 5,
   "tags": [],
   "skill": "谋划3",
   "enter": [
    {
     "op": "draw",
     "n": 1,
     "filter": "tactic"
    }
   ],
   "death": [],
   "requires_martial": 0
  },
  {
   "id": "random_intelligence_3_0",
   "pool": "intelligence_3",
   "role": "intelligence",
   "tier": 3,
   "primary_min": 90,
   "primary_max": 100,
   "variant": 0,
   "name": "随机人物模板",
   "type": "general",
   "kind": "source",
   "cost": 6,
   "attack": 4,
   "health": 6,
   "tags": [],
   "skill": "谋划1",
   "enter": [
    {
     "op": "draw",
     "n": 2
    }
   ],
   "death": [],
   "requires_martial": 0
  },
  {
   "id": "random_intelligence_3_1",
   "pool": "intelligence_3",
   "role": "intelligence",
   "tier": 3,
   "primary_min": 90,
   "primary_max": 100,
   "variant": 1,
   "name": "随机人物模板",
   "type": "general",
   "kind": "source",
   "cost": 6,
   "attack": 4,
   "health": 6,
   "tags": [],
   "skill": "谋划2",
   "enter": [
    {
     "op": "silence",
     "target": "enemy"
    }
   ],
   "death": [],
   "requires_martial": 0
  },
  {
   "id": "random_intelligence_3_2",
   "pool": "intelligence_3",
   "role": "intelligence",
   "tier": 3,
   "primary_min": 90,
   "primary_max": 100,
   "variant": 2,
   "name": "随机人物模板",
   "type": "general",
   "kind": "source",
   "cost": 6,
   "attack": 4,
   "health": 6,
   "tags": [],
   "skill": "谋划3",
   "enter": [
    {
     "op": "draw",
     "n": 1,
     "filter": "tactic"
    }
   ],
   "death": [],
   "requires_martial": 0
  },
  {
   "id": "random_command_0_0",
   "pool": "command_0",
   "role": "command",
   "tier": 0,
   "primary_min": 0,
   "primary_max": 59,
   "variant": 0,
   "name": "随机人物模板",
   "type": "general",
   "kind": "source",
   "cost": 3,
   "attack": 2,
   "health": 4,
   "tags": [
    "taunt"
   ],
   "skill": "整军1",
   "enter": [],
   "death": [],
   "requires_martial": 0
  },
  {
   "id": "random_command_0_1",
   "pool": "command_0",
   "role": "command",
   "tier": 0,
   "primary_min": 0,
   "primary_max": 59,
   "variant": 1,
   "name": "随机人物模板",
   "type": "general",
   "kind": "source",
   "cost": 3,
   "attack": 2,
   "health": 4,
   "tags": [],
   "skill": "整军2",
   "enter": [
    {
     "op": "armor",
     "n": 1
    }
   ],
   "death": [],
   "requires_martial": 0
  },
  {
   "id": "random_command_0_2",
   "pool": "command_0",
   "role": "command",
   "tier": 0,
   "primary_min": 0,
   "primary_max": 59,
   "variant": 2,
   "name": "随机人物模板",
   "type": "general",
   "kind": "source",
   "cost": 3,
   "attack": 1,
   "health": 4,
   "tags": [],
   "skill": "整军3",
   "enter": [
    {
     "op": "armor",
     "n": 1
    }
   ],
   "death": [],
   "requires_martial": 0
  },
  {
   "id": "random_command_1_0",
   "pool": "command_1",
   "role": "command",
   "tier": 1,
   "primary_min": 60,
   "primary_max": 74,
   "variant": 0,
   "name": "随机人物模板",
   "type": "general",
   "kind": "source",
   "cost": 4,
   "attack": 3,
   "health": 5,
   "tags": [
    "taunt"
   ],
   "skill": "整军1",
   "enter": [],
   "death": [],
   "requires_martial": 0
  },
  {
   "id": "random_command_1_1",
   "pool": "command_1",
   "role": "command",
   "tier": 1,
   "primary_min": 60,
   "primary_max": 74,
   "variant": 1,
   "name": "随机人物模板",
   "type": "general",
   "kind": "source",
   "cost": 4,
   "attack": 3,
   "health": 5,
   "tags": [],
   "skill": "整军2",
   "enter": [
    {
     "op": "buff",
     "a": 1,
     "h": 1,
     "target": "friend"
    }
   ],
   "death": [],
   "requires_martial": 0
  },
  {
   "id": "random_command_1_2",
   "pool": "command_1",
   "role": "command",
   "tier": 1,
   "primary_min": 60,
   "primary_max": 74,
   "variant": 2,
   "name": "随机人物模板",
   "type": "general",
   "kind": "source",
   "cost": 4,
   "attack": 2,
   "health": 5,
   "tags": [],
   "skill": "整军3",
   "enter": [
    {
     "op": "armor",
     "n": 2
    }
   ],
   "death": [],
   "requires_martial": 0
  },
  {
   "id": "random_command_2_0",
   "pool": "command_2",
   "role": "command",
   "tier": 2,
   "primary_min": 75,
   "primary_max": 89,
   "variant": 0,
   "name": "随机人物模板",
   "type": "general",
   "kind": "source",
   "cost": 5,
   "attack": 4,
   "health": 6,
   "tags": [
    "taunt"
   ],
   "skill": "整军1",
   "enter": [],
   "death": [],
   "requires_martial": 0
  },
  {
   "id": "random_command_2_1",
   "pool": "command_2",
   "role": "command",
   "tier": 2,
   "primary_min": 75,
   "primary_max": 89,
   "variant": 1,
   "name": "随机人物模板",
   "type": "general",
   "kind": "source",
   "cost": 5,
   "attack": 4,
   "health": 6,
   "tags": [],
   "skill": "整军2",
   "enter": [
    {
     "op": "buff",
     "a": 1,
     "h": 1,
     "target": "friend"
    }
   ],
   "death": [],
   "requires_martial": 0
  },
  {
   "id": "random_command_2_2",
   "pool": "command_2",
   "role": "command",
   "tier": 2,
   "primary_min": 75,
   "primary_max": 89,
   "variant": 2,
   "name": "随机人物模板",
   "type": "general",
   "kind": "source",
   "cost": 5,
   "attack": 3,
   "health": 6,
   "tags": [],
   "skill": "整军3",
   "enter": [
    {
     "op": "armor",
     "n": 3
    }
   ],
   "death": [],
   "requires_martial": 0
  },
  {
   "id": "random_command_3_0",
   "pool": "command_3",
   "role": "command",
   "tier": 3,
   "primary_min": 90,
   "primary_max": 100,
   "variant": 0,
   "name": "随机人物模板",
   "type": "general",
   "kind": "source",
   "cost": 6,
   "attack": 5,
   "health": 7,
   "tags": [
    "taunt"
   ],
   "skill": "整军1",
   "enter": [],
   "death": [],
   "requires_martial": 0
  },
  {
   "id": "random_command_3_1",
   "pool": "command_3",
   "role": "command",
   "tier": 3,
   "primary_min": 90,
   "primary_max": 100,
   "variant": 1,
   "name": "随机人物模板",
   "type": "general",
   "kind": "source",
   "cost": 6,
   "attack": 5,
   "health": 7,
   "tags": [],
   "skill": "整军2",
   "enter": [
    {
     "op": "buff",
     "a": 1,
     "h": 1,
     "target": "friend"
    }
   ],
   "death": [],
   "requires_martial": 0
  },
  {
   "id": "random_command_3_2",
   "pool": "command_3",
   "role": "command",
   "tier": 3,
   "primary_min": 90,
   "primary_max": 100,
   "variant": 2,
   "name": "随机人物模板",
   "type": "general",
   "kind": "source",
   "cost": 6,
   "attack": 4,
   "health": 7,
   "tags": [],
   "skill": "整军3",
   "enter": [
    {
     "op": "armor",
     "n": 4
    }
   ],
   "death": [],
   "requires_martial": 0
  }
 ],
 "random_identity_pool": {
  "civil": [
   "random-civil-1",
   "random-civil-2",
   "random-civil-3",
   "random-civil-4",
   "random-civil-5",
   "random-civil-6",
   "random-civil-7",
   "random-civil-8",
   "random-civil-9",
   "random-civil-10"
  ],
  "military": [
   "random-military-1",
   "random-military-2",
   "random-military-3",
   "random-military-4",
   "random-military-5",
   "random-military-6",
   "random-military-7",
   "random-military-8",
   "random-military-9",
   "random-military-10"
  ],
  "surnames": [
   "沈",
   "陆",
   "顾",
   "韩",
   "许",
   "张",
   "李",
   "周",
   "陈",
   "徐"
  ],
  "given_names": [
   "守仁",
   "明远",
   "景和",
   "文清",
   "怀诚",
   "承礼",
   "弘毅",
   "知远",
   "守信",
   "安邦"
  ],
  "generation_order": [
   "读取或生成真实能力",
   "根据能力筛选专有子池",
   "按同预算权重抽模板及外观",
   "创建唯一人物实例并持久化"
  ]
 },
 "notes_release": [
  "规则为炉石式完整回合；数值以此生产卡表与开战快照为准。",
  "新增轻骑巡哨为固定公开卡定义，智力与统率自动军阵使用该低费骑兵；武力自动军阵使用轻骑小队。两者均消耗同一真实骑兵来源。"
 ]
};
