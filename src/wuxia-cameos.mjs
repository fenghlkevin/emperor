// Independent adult screen-character encounters; append to preserve existing cameo roll intervals.
export const WUXIA_CAMEOS=[
 {id:'xiaolongnu',name:'小龙女',age:25,appearance:99,experience:25,ability:110,
  specialty:'古墓武学、琴艺与草药辨识',personality:'清冷自持，重诺守信',
  source:'1995版《神雕侠侣》角色改编',actor:'李若彤',homeCityId:'guannei',eligibleProvinces:['guannei'],encounterCity:'终南山',
  portraitAsset:'assets/beauties/special/xiaolongnu-li-ruotong-v3.png',sceneAsset:'assets/scenes/tour/sketch-tour-recluse.png',
  title:'终南古墓·白衣琴声',revealedTitle:'白衣同行·小龙女',
  story:'巡行关内，终南山下传来断续琴音。二十五岁的小龙女刚以草药救下一名受伤山民，正欲返回古墓。她不喜仪仗喧闹，陛下便屏退从人，与她谈起山外民生。她愿把去留交给自己的心意：若志趣相投，可以同行；若就此作别，也可留下一段论武之谊。',
  admissionText:'小龙女收起琴囊，亲口应下同行之邀。她愿在宫中设一处清静琴室，闲时传授护身之术。',
  choices:[
   {id:'admit',label:'以清静琴室相邀，依她心意迎入宫中',effects:{money:-800,stats:{happiness:10,martial:5},admit:true}},
   {id:'part',label:'请教古墓武学，拱手作别',effects:{stats:{martial:8,wisdom:2}}},
   {id:'patron',label:'赠银添置药材，助她救济山民',effects:{money:-600,local:{loyalty:3,security:2},stats:{health:3,happiness:5}}}
  ]},
 {id:'wang-yuyan',name:'王语嫣',age:24,appearance:99,experience:25,ability:110,
  specialty:'武学典籍、招式辨识与古籍校勘',personality:'温婉博闻，细致笃定',
  source:'1997版《天龙八部》角色改编',actor:'李若彤',homeCityId:'jiangnan',eligibleProvinces:['jiangnan'],encounterCity:'苏州',
  portraitAsset:'assets/beauties/special/wang-yuyan-li-ruotong-v3.png',sceneAsset:'assets/scenes/tour/sketch-tour-school.png',
  title:'姑苏书阁·琅嬛遗卷',revealedTitle:'携卷同行·王语嫣',
  story:'巡行江南，姑苏书肆为一册武学残卷争执不休。二十四岁的王语嫣翻阅数页，便指出错简与招式讹误，让冒充秘笈的贩子无言以对。陛下请她移步书阁论书，见她博闻强识，便谈起修整宫中典籍之事。她珍惜这份知遇，愿自主决定是随驾同行，还是留在姑苏继续校书。',
  admissionText:'王语嫣带上校好的残卷，自愿接受入宫之邀。她盼在宫中整理散佚典籍，让所学各有归处。',
  choices:[
   {id:'admit',label:'邀她入宫校书，依她心意迎入宫中',effects:{money:-800,stats:{happiness:10,wisdom:5,talent:3},admit:true}},
   {id:'part',label:'共辨残卷，论书尽兴后作别',effects:{stats:{wisdom:6,talent:4}}},
   {id:'patron',label:'出资抄录藏书，留她在姑苏校勘',effects:{money:-600,local:{activity:3,stability:2},stats:{wisdom:8}}}
  ]}
];
