// Gameplay art direction, not claims about historically surviving weapons.
export const GENERAL_WEAPONS={
 yangzaixing:'quick-spear',
 yueyun:'twin-maces',
 diqing:'guandao',
 chenqingzhi:'sword',
 wenchou:'serpent-spear',
 yanliang:'guandao',
 yuanshu:'sword',
 yuanshao:'sword',
 dingfeng:'saber',
 xusheng:'rising-spear',
 zhoutai:'saber',
 huanggai:'saber',
 guanping:'guandao',
 pangde:'guandao',
 yujin:'serpent-spear',
 lejin:'quick-spear',
 caohong:'saber',
 caoren:'serpent-spear',
 xiahouyuan:'saber',
 xiahoudun:'guandao',
 sunjian:'saber',
 zhanghe:'rising-spear',
 simayi:'sword',
 weiyan:'guandao',
 limu:'serpent-spear',
 wangjian:'sword',
 lianpo:'serpent-spear',
 zhugeliang:'sword',
 luxun:'sword',
 guoziyi:'sword',
 guanyu:'guandao',zhangfei:'serpent-spear',zhaoyun:'quick-spear',machao:'rising-spear',
 huangzhong:'guandao',lvbu:'halberd',yuefei:'serpent-spear',hanxin:'sword',baiqi:'sword',
 weiqing:'serpent-spear',huoqubing:'quick-spear',sunce:'rising-spear',zhouyu:'sword',
 zhangliao:'halberd',xuhuang:'axe',xuchu:'saber',dianwei:'dual-halberds',ganning:'saber',
 taishici:'quick-spear',jiangwei:'rising-spear',dengai:'sword',lijing:'sword',qijiguang:'saber',
 liguang:'saber',xuerengui:'halberd',qinqiong:'twin-maces',
};
export const WEAPON_ACTIONS={
 'guandao':{name:'偃月刀·蓄势横斩',ms:1040,contact:.5,times:[0,.32,.5,.8],reach:.15,lift:1,impact:'<path d="M-52,27 Q52,8 23,-49 M-45,32 Q63,6 29,-53"/>'},
 'serpent-spear':{name:'长矛·收势重刺',ms:880,contact:.46,times:[0,.29,.46,.76],reach:.31,lift:0,impact:'<path d="M-80,4 L42,-3 M-5,-9 L18,0 L-5,9"/>'},
 'quick-spear':{name:'长枪·探身快刺',ms:620,contact:.34,times:[0,.18,.34,.66],reach:.36,lift:0,impact:'<path d="M-70,0 L43,0 M-16,-5 L25,-5 M-16,5 L25,5"/>'},
 'rising-spear':{name:'长枪·上挑接刺',ms:820,contact:.48,times:[0,.27,.48,.78],reach:.27,lift:6,impact:'<path d="M-42,24 Q-14,-29 26,-21 M-45,5 L38,-6"/>'},
 'halberd':{name:'画戟·钩挑横扫',ms:980,contact:.5,times:[0,.31,.5,.79],reach:.2,lift:4,impact:'<path d="M-52,20 Q17,-35 38,-14 Q51,10 3,17 M-49,27 L34,0"/>'},
 'axe':{name:'战斧·举斧重劈',ms:1120,contact:.55,times:[0,.36,.55,.83],reach:.13,lift:3,impact:'<path d="M-6,-58 L12,30 M-17,21 L9,36 L29,19"/>'},
 'saber':{name:'战刀·斜斩回刀',ms:760,contact:.43,times:[0,.25,.43,.73],reach:.2,lift:2,impact:'<path d="M-40,29 Q20,-3 35,-35 M-32,34 Q32,2 42,-30"/>'},
 'sword':{name:'佩剑·引剑直击',ms:680,contact:.38,times:[0,.21,.38,.7],reach:.25,lift:0,impact:'<path d="M-47,8 L34,-8 M-12,-10 L10,12"/>'},
 'dual-halberds':{name:'双戟·交错连击',ms:900,contact:.44,times:[0,.25,.44,.77],reach:.19,lift:2,impact:'<path d="M-38,-33 L31,29 M-35,31 L34,-32 M-42,-29 L26,34"/>'},
 'twin-maces':{name:'双锏·左右交击',ms:940,contact:.49,times:[0,.28,.49,.79],reach:.17,lift:3,impact:'<path d="M-30,-42 L19,23 M29,-39 L-19,24"/><circle r="13"/>'},
};

export function weaponMotion(style,dx,dy){
 const s=WEAPON_ACTIONS[style],sign=dx<0?-1:1;
 const pose=(f,y,angle,offset)=>({transform:`translate(${dx*f}px,${dy*f+y}px) rotate(${angle*sign}deg)`,offset});
 return [pose(0,0,0,0),pose(-.025,-s.lift,-s.lift*.3,s.times[1]),
  pose(s.reach,s.lift*.3,s.lift*.2,s.contact),pose(s.reach*.7,0,0,s.times[3]),pose(0,0,0,1)];
}
