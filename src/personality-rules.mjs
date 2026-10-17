// 天牢反应是游戏化设定，不代表某人必然效忠虚构皇帝。
export const PRISON_PERSONALITIES={
 repentant:{name:'悔过',delta:3,ceiling:80,reason:'反省过失，重拾忠心'},
 fearful:{name:'畏威',delta:1,ceiling:60,reason:'畏惧刑威，渐生顺服'},
 staunch:{name:'刚烈',delta:-1,ceiling:100,reason:'不甘受囚，忠心渐失'},
 resentful:{name:'怨恨',delta:-3,ceiling:100,reason:'积怨日深，离心加重'},
 steadfast:{name:'坚贞',delta:0,ceiling:100,reason:'守持本志，不因囚禁改变心志'},
 composed:{name:'沉静',delta:0,ceiling:100,reason:'隐忍自守，静观处境'},
 pragmatic:{name:'权变',delta:1,ceiling:70,reason:'审度利害，暂求顺服'}
};
