import fs from 'node:fs';
import {ACTIVE_HISTORICAL_PEOPLE} from '../src/exam.mjs';
const shapes=['long narrow face with high cheekbones','broad square face and heavy jaw','rounded full cheeks with small chin','lean oval face and angular chin','diamond face with prominent cheekbones','long rectangular face and high forehead','wide triangular face and strong cheekbones','slender heart-shaped face and tapered chin','rugged trapezoid face and broad jaw','soft elongated oval face'];
const eyes=['small deep-set eyes','large steady almond eyes','narrow upturned eyes','slightly drooping gentle eyes','widely spaced thoughtful eyes','sharp close-set eyes','heavy-lidded calm eyes'];
const noses=['straight long aquiline nose','short broad nose','high narrow bridged nose','rounded prominent nose','slightly hooked long nose','straight medium nose'];
const beards=['clean shaven','thin straight mustache and short pointed beard','full thick black beard','fine forked goatee','neat short boxed beard','long flowing beard','sparse mustache and narrow chin beard'];
const colors=['muted jade green','sapphire blue','burgundy','warm ivory','ochre','slate gray','indigo','dark olive','plum purple','rust red'];
const special={
'刘基':{age:50,face:'long narrow face, high broad forehead, narrow insightful almond eyes, raised left eyebrow, thin long nose, fine forked black-and-grey goatee, visible cheekbones'},
'苏轼':{age:45,face:'broad rounded benevolent face, full cheeks, laughing crescent eyes, slightly broad nose, dense rounded black beard and curling mustache, cheerful expression'},
'欧阳修':{age:58,face:'lean oval face, high receding forehead, gentle drooping eyes, broad straight nose, long thin gray mustache and sparse silver chin beard'},
'李斯':{age:46,face:'hard square jaw, deep set piercing close eyes, low flat eyebrows, straight hooked nose, precisely trimmed narrow dark chin beard, stern thin lips'},
'关羽':{age:42,face:'deep ruddy complexion, exceptionally long straight black beard, arched silkworm brows, narrow phoenix eyes, firm long oval face'},
'张飞':{age:38,face:'broad rugged dark-tan face, fierce round eyes, thick raised bushy brows, wide flat nose, bushy bristling black beard'},
'赵云':{age:30,face:'handsome clean-shaven narrow oval face, bright calm eyes, straight brows and narrow straight nose, fair healthy complexion'},
'吕布':{age:32,face:'powerful broad angular clean-shaven face, high sharp cheekbones, piercing eyes, thick straight eyebrows and strong chin'},
'诸葛亮':{age:43,face:'slender long face, high clear forehead, calm almond eyes, fine straight brows, long thin black goatee and elegant mustache'},
'曹操':{age:48,face:'short broad face, slightly small calculating eyes, strong cheekbones, heavy black brows, thick neat mustache and short full beard'},
'包拯':{age:52,face:'very dark sun-tanned broad square face, wide serious eyes, heavy straight eyebrows, broad nose, short dense black beard'},
'岳飞':{age:34,face:'strong oval face, determined bright eyes, thick curved eyebrows, broad straight nose, short neat mustache and firm chin'},
'霍去病':{age:22,face:'youthful angular clean-shaven face, athletic lean cheeks, sharp alert eyes, straight black brows, short straight nose'},
'孔子':{age:62,face:'broad high forehead, solemn kind deep-set eyes, large rounded nose, long gray beard with two separated tips, weathered oval face'},
'老子':{age:75,face:'ancient narrow deeply wrinkled face, tall forehead, long white eyebrows, serene small eyes, very long flowing white beard'},
'刘墉':{age:60,face:'thin elongated humorous face, one slightly lower eyebrow, narrow smiling eyes, long hooked nose, short wispy gray beard, slightly stooped shoulders'},
'和珅':{age:38,face:'round smooth full face, fair complexion, small smiling eyes, fine arched brows, rounded small nose, clean-shaven cheeks and neat thin mustache'}
};
const signatureClothes={
'诸葛亮':'iconic white crane-feather cloak (鹤氅) over pale scholar robes, black silk lunjin headcloth (纶巾), holding a white feather fan (羽扇), no armor',
'吕布':'iconic crimson and black battle armor, phoenix-wing purple-gold crown with two long pheasant tail plumes, holding a complete halberd 方天画戟 vertically with straight central spear point and two restrained crescent side blades, full tip and butt inside canvas with clear margin, powerful athletic build, no helmet hiding his face',
'张飞':'iconic dark battle armor, rugged broad muscular build, holding a complete 丈八蛇矛 vertically, perfectly straight rigid long shaft and short narrow rigid spearhead with subtle serpentine edges only at tip, never flexible or whip-like, no dainty scholar physique',
'关羽':'iconic flowing emerald green robe over lamellar armor, green headcloth, exceptionally long flowing black beard, holding a complete green-dragon crescent glaive 青龙偃月刀 vertically with blade tip and shaft butt inside canvas with clear margin, tall imposing build',
'赵云':'silver-white lamellar armor, white cloak, silver helmet, holding a long silver spear, youthful clean-shaven face',
'曹操':'rich dark burgundy brocade robe with restrained gold decoration and black high court cap, holding a rolled military dispatch, clever authoritative expression',
'周瑜':'elegant red and silver light armor with white cape, finely crafted sword at waist, youthful cultivated gentleman commander',
'姜子牙':'ivory sage robes and simple linen hood, long white beard, holding a wooden staff and rolled divination scroll',
'包拯':'solemn black official robe, black winged hat, ivory ceremonial tablet, very dark face and stern broad brows, recognizable judge',
'岳飞':'restrained steel lamellar armor with dark red cape, engraved traditional helmet, straight spear, resolute young commander',
'孙武':'archaic dark bronze leather lamellar armor with muted brown cloak and period cap, holding bamboo military treatise',
'孔子':'simple broad-sleeved earth-brown ancient scholar robes and archaic black cap, clasped hands with bamboo classics, long gray beard',
'老子':'plain pale linen and ivory Daoist robes, white hair in a simple topknot, wooden staff, very long white beard, serene elderly sage',
'苏轼':'sapphire blue literati robe, Dongpo-style folded scholar cap, bamboo scroll and small writing brush, rounded smiling face',
'李白':'flowing ivory poet robes, simple black scholar cap, wine gourd at belt and loosely held poetry scroll, carefree elegant bearing',
'司马懿':'dark violet high-collared scholar robe, black silk cap, clasped hands and calculating narrowed eyes, lean elderly strategist',
'霍去病':'youthful athletic commander in dark red Han-inspired lamellar armor, cavalry bow and short sword, clean-shaven',
'卫青':'dark Han-inspired lamellar armor with subdued jade cloak and helmet, cavalry sword, calm seasoned commander',
'郑成功':'late Ming dark armor with red cloak, military cap and straight sword, youthful determined commander'
};
const specs=ACTIVE_HISTORICAL_PEOPLE.map((p,i)=>{const known=special[p.name];return {id:p.id,name:p.name,role:p.role,age:known?.age??(25+(i*17)%39),identity:known?.face??`${shapes[i%shapes.length]}, ${eyes[Math.floor(i/3)%eyes.length]}, ${noses[Math.floor(i/7)%noses.length]}, ${beards[Math.floor(i/2)%beards.length]}, ${['warm tan','pale ivory','bronze sun-tanned','light olive','warm medium'][i%5]} complexion, ${['subtle raised left eyebrow','faint smile lines','small dimple in chin','prominent ears','asymmetric thoughtful brow'][Math.floor(i/5)%5]}`,clothing:signatureClothes[p.name]??(p.role==='武将'?`${colors[i%10]} cloth surcoat over historically inspired dark steel lamellar armor, practical belt and boots, no wings or huge pauldrons`:`${colors[i%10]} layered scholar long robe, silk texture, restrained embroidery, period scholar cap, narrow sleeves and black shoes`),status:{full:fs.existsSync(`assets/officials/${p.id}-full.png`),avatar:fs.existsSync(`assets/officials/${p.id}-avatar.png`),court:fs.existsSync(`assets/officials/${p.id}-court.png`)}};});
for(const line of fs.readFileSync('docs/official-art/historical-review.tsv','utf8').trim().split('\n')){const [name,age,artRole,identity,clothing]=line.split('\t');const item=specs.find(p=>p.name===name);if(!item)throw Error(name);Object.assign(item,{age:Number(age),artRole,identity,clothing,reviewed:true});}
fs.mkdirSync('docs/official-art',{recursive:true});fs.writeFileSync('docs/official-art/characters.json',JSON.stringify(specs,null,2));
console.log(`${specs.length} individual identity briefs`);
