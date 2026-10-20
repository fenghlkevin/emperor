import {GENERAL_WEAPONS,WEAPON_ACTIONS} from './battle-general-weapons.mjs';
import {generalFrames} from './battle-general-frames.mjs';
// Dedicated battlefield identities; troop rules continue to use unit.kind.
export const BATTLE_GENERALS=[
  {key:"general-guoziyi",id:"cbdb-94373",name:"郭子仪",asset:"assets/battle/generals/war-general-mounted-guoziyi-v2.png"},
  {
    "key": "general-guanyu",
    "id": "manual-1553",
    "name": "关羽",
    "asset": "assets/battle/generals/war-general-mounted-guanyu-v2.png"
  },
  {
    "key": "general-zhangfei",
    "id": "manual-1554",
    "name": "张飞",
    "asset": "assets/battle/generals/war-general-mounted-zhangfei-v2.png"
  },
  {
    "key": "general-zhaoyun",
    "id": "manual-1555",
    "name": "赵云",
    "asset": "assets/battle/generals/war-general-mounted-zhaoyun-v2.png"
  },
  {
    "key": "general-machao",
    "id": "manual-1556",
    "name": "马超",
    "asset": "assets/battle/generals/war-general-mounted-machao-v2.png"
  },
  {
    "key": "general-huangzhong",
    "id": "manual-1557",
    "name": "黄忠",
    "asset": "assets/battle/generals/war-general-mounted-huangzhong-v2.png"
  },
  {
    "key": "general-lvbu",
    "id": "general-285-45592",
    "name": "吕布",
    "asset": "assets/battle/generals/war-general-mounted-lvbu-v2.png"
  },
  {
    "key": "general-yuefei",
    "id": "cbdb-8175",
    "name": "岳飞",
    "asset": "assets/battle/generals/war-general-mounted-yuefei-v2.png"
  },
  {
    "key": "general-hanxin",
    "id": "manual-1530",
    "name": "韩信",
    "asset": "assets/battle/generals/war-general-mounted-hanxin-v2.png"
  },
  {
    "key": "general-baiqi",
    "id": "manual-1520",
    "name": "白起",
    "asset": "assets/battle/generals/war-general-mounted-baiqi-v2.png"
  },
  {
    "key": "general-weiqing",
    "id": "manual-1537",
    "name": "卫青",
    "asset": "assets/battle/generals/war-general-mounted-weiqing-v2.png"
  },
  {
    "key": "general-huoqubing",
    "id": "manual-1536",
    "name": "霍去病",
    "asset": "assets/battle/generals/war-general-mounted-huoqubing-v2.png"
  },
  {
    "key": "general-sunce",
    "id": "cbdb-20608",
    "name": "孙策",
    "asset": "assets/battle/generals/war-general-mounted-sunce-v2.png"
  },
  {
    "key": "general-zhouyu",
    "id": "manual-1569",
    "name": "周瑜",
    "asset": "assets/battle/generals/war-general-mounted-zhouyu-v2.png"
  },
  {
    "key": "general-zhangliao",
    "id": "manual-1566",
    "name": "张辽",
    "asset": "assets/battle/generals/war-general-mounted-zhangliao-v2.png"
  },
  {
    "key": "general-xuhuang",
    "id": "manual-1567",
    "name": "徐晃",
    "asset": "assets/battle/generals/war-general-mounted-xuhuang-v2.png"
  },
  {
    "key": "general-xuchu",
    "id": "general-185-70866",
    "name": "许褚",
    "asset": "assets/battle/generals/war-general-mounted-xuchu-v2.png"
  },
  {
    "key": "general-dianwei",
    "id": "general-186-59742",
    "name": "典韦",
    "asset": "assets/battle/generals/war-general-mounted-dianwei-v2.png"
  },
  {
    "key": "general-ganning",
    "id": "general-254-53401",
    "name": "甘宁",
    "asset": "assets/battle/generals/war-general-mounted-ganning-v2.png"
  },
  {
    "key": "general-taishici",
    "id": "general-253-69220",
    "name": "太史慈",
    "asset": "assets/battle/generals/war-general-mounted-taishici-v2.png"
  },
  {
    "key": "general-jiangwei",
    "id": "manual-1559",
    "name": "姜维",
    "asset": "assets/battle/generals/war-general-mounted-jiangwei-v2.png"
  },
  {
    "key": "general-dengai",
    "id": "general-198-70417",
    "name": "邓艾",
    "asset": "assets/battle/generals/war-general-mounted-dengai-v2.png"
  },
  {
    "key": "general-lijing",
    "id": "manual-1582",
    "name": "李靖",
    "asset": "assets/battle/generals/war-general-mounted-lijing-v2.png"
  },
  {
    "key": "general-qijiguang",
    "id": "manual-1614",
    "name": "戚继光",
    "asset": "assets/battle/generals/war-general-mounted-qijiguang-v2.png"
  },
  {
    "key": "general-liguang",
    "id": "general-103-50637",
    "name": "李广",
    "asset": "assets/battle/generals/war-general-mounted-liguang-v2.png"
  },
  {
    "key": "general-xuerengui",
    "id": "general-403-90513",
    "name": "薛仁贵",
    "asset": "assets/battle/generals/war-general-mounted-xuerengui-v2.png"
  },
  {
    "key": "general-qinqiong",
    "id": "general-398-60962",
    "name": "秦琼",
    "asset": "assets/battle/generals/war-general-mounted-qinqiong-v2.png"
  }
  ,{key:"general-luxun",id:"cbdb-33662",name:"陆逊",asset:"assets/battle/generals/war-general-mounted-luxun-v2.png"}
  ,{key:"general-zhugeliang",id:"cbdb-25403",name:"诸葛亮",asset:"assets/battle/generals/war-general-mounted-zhugeliang-v2.png"}
  ,{key:"general-lianpo",id:"manual-1518",name:"廉颇",asset:"assets/battle/generals/war-general-mounted-lianpo-v2.png"}
  ,{key:"general-wangjian",id:"manual-1521",name:"王翦",asset:"assets/battle/generals/war-general-mounted-wangjian-v2.png"}
  ,{key:"general-limu",id:"manual-1522",name:"李牧",asset:"assets/battle/generals/war-general-mounted-limu-v2.png"}
  ,{key:"general-weiyan",id:"manual-1558",name:"魏延",asset:"assets/battle/generals/war-general-mounted-weiyan-v2.png"}
  ,{key:"general-simayi",id:"manual-1565",name:"司马懿",asset:"assets/battle/generals/war-general-mounted-simayi-v2.png"}
  ,{key:"general-zhanghe",id:"manual-1568",name:"张郃",asset:"assets/battle/generals/war-general-mounted-zhanghe-v2.png"}
  ,{key:"general-sunjian",id:"general-169-45747",name:"孙坚",asset:"assets/battle/generals/war-general-mounted-sunjian-v2.png"}
  ,{key:"general-xiahoudun",id:"general-171-67973",name:"夏侯惇",asset:"assets/battle/generals/war-general-mounted-xiahoudun-v2.png"}
  ,{key:"general-xiahouyuan",id:"general-172-71368",name:"夏侯渊",asset:"assets/battle/generals/war-general-mounted-xiahouyuan-v2.png"}
  ,{key:"general-caoren",id:"general-173-46522",name:"曹仁",asset:"assets/battle/generals/war-general-mounted-caoren-v2.png"}
  ,{key:"general-caohong",id:"general-174-54307",name:"曹洪",asset:"assets/battle/generals/war-general-mounted-caohong-v2.png"}
  ,{key:"general-lejin",id:"general-181-56875",name:"乐进",asset:"assets/battle/generals/war-general-mounted-lejin-v2.png"}
  ,{key:"general-yujin",id:"general-182-51215",name:"于禁",asset:"assets/battle/generals/war-general-mounted-yujin-v2.png"}
  ,{key:"general-pangde",id:"general-187-48725",name:"庞德",asset:"assets/battle/generals/war-general-mounted-pangde-v2.png"}
  ,{key:"general-guanping",id:"general-220-45030",name:"关平",asset:"assets/battle/generals/war-general-mounted-guanping-v2.png"}
  ,{key:"general-huanggai",id:"general-250-71066",name:"黄盖",asset:"assets/battle/generals/war-general-mounted-huanggai-v2.png"}
  ,{key:"general-zhoutai",id:"general-256-49496",name:"周泰",asset:"assets/battle/generals/war-general-mounted-zhoutai-v2.png"}
  ,{key:"general-xusheng",id:"general-258-54891",name:"徐盛",asset:"assets/battle/generals/war-general-mounted-xusheng-v2.png"}
  ,{key:"general-dingfeng",id:"general-259-42826",name:"丁奉",asset:"assets/battle/generals/war-general-mounted-dingfeng-v2.png"}
  ,{key:"general-yuanshao",id:"general-275-67406",name:"袁绍",asset:"assets/battle/generals/war-general-mounted-yuanshao-v2.png"}
  ,{key:"general-yuanshu",id:"general-276-61360",name:"袁术",asset:"assets/battle/generals/war-general-mounted-yuanshu-v2.png"}
  ,{key:"general-yanliang",id:"general-280-72459",name:"颜良",asset:"assets/battle/generals/war-general-mounted-yanliang-v2.png"}
  ,{key:"general-wenchou",id:"general-281-45976",name:"文丑",asset:"assets/battle/generals/war-general-mounted-wenchou-v2.png"}
  ,{key:"general-chenqingzhi",id:"general-325-82713",name:"陈庆之",asset:"assets/battle/generals/war-general-mounted-chenqingzhi-v2.png"}
  ,{key:"general-diqing",id:"general-523-68118",name:"狄青",asset:"assets/battle/generals/war-general-mounted-diqing-v2.png"}
  ,{key:"general-yueyun",id:"general-550-43844",name:"岳云",asset:"assets/battle/generals/war-general-mounted-yueyun-v2.png"}
  ,{key:"general-yangzaixing",id:"general-555-68201",name:"杨再兴",asset:"assets/battle/generals/war-general-mounted-yangzaixing-v2.png"}
];
export function battleGeneral(person){
 const id=String(person?.id??'').replace(/^recruit-/, '');
 return BATTLE_GENERALS.find(g=>generalFrames[g.key]?.revision===2&&(g.id===id||g.name===person?.name))??null;
}
export const generalSprites=Object.fromEntries(BATTLE_GENERALS.map(g=>[g.key,{
 asset:g.asset,width:1536,height:1024,displayWidth:96,displayHeight:128,
 walk:Array.from({length:4},(_,i)=>[i*384,0,384,512]),
 attack:Array.from({length:4},(_,i)=>[i*384,512,384,512]),
 fps:{walk:8,attack:6},
 weapon:GENERAL_WEAPONS[g.key.replace('general-','')],
 attackMs:WEAPON_ACTIONS[GENERAL_WEAPONS[g.key.replace('general-','')]].ms,
 attackTimes:WEAPON_ACTIONS[GENERAL_WEAPONS[g.key.replace('general-','')]].times,
 ...generalFrames[g.key],
}]));
