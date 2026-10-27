import {specialActive} from './special-buildings.mjs';
// End causes and historical judgements are independent. These are project literary titles.
export const ENDING_PROFILES={
 sage:{title:'文成圣帝',verdict:'文足经邦德以成圣',review:'混一寰宇而不忘安民，文武俱臻而能尽孝慈。其功业具载于册，遂为一代盛朝之终章'},
 civilMartial:{title:'文成武帝',verdict:'以文经世以武定邦',review:'有临阵制胜之功，亦能使闾里安定。兼修文武而不偏废，故其事业不止于开疆，更见于治世'},
 benevolent:{title:'仁德之君',verdict:'政以养民德以安邦',review:'以民生为治国之本，使生计有所依，秩序有所守。其德业不独见于庙堂，亦存于百姓日用之间'},
 restorer:{title:'中兴之主',verdict:'承衰运而复治续旧业以开新',review:'承先朝国事艰难之余，而能振起内政，使生民复得安定。前后治绩相较，实有转衰为治之功'},
 conqueror:{title:'开疆武帝',verdict:'威行远域功在山河',review:'屡建胜绩，扩定版图。其武功有可稽考，而内政未至失序。后世论之，以开疆之业为其所长'},
 keeper:{title:'守成之君',verdict:'守社稷之业续宗庙之统',review:'承有天下之责，治绩尚能维持。虽未臻百务尽善之境，亦有守成之实，不可一概抹去'},
 mixed:{title:'功过之君',verdict:'功过并存留待后人',review:'一朝治绩得失相杂，有可称之处，亦有未竟之责。论者当据国势与民生并观，不以一事蔽其一生'},
 warmonger:{title:'穷兵之君',verdict:'兵戈未息民生先疲',review:'本朝交战频仍，而内政困弱，军中伤亡已有实录。武事与民力相较，终见用兵之重，而养民之功未足'},
 tyrant:{title:'暴君',verdict:'刑威虽重民心难回',review:'屡行处斩，重刑之事具在刑曹。而民生困顿，秩序不振。徒恃威刑，终未能使天下安服，后世遂以暴君论之'},
 zhou:{title:'商纣之鉴',verdict:'失民心者终失其国',review:'重刑屡行，而百姓困苦。及至社稷倾覆，苛政与失国相继为戒，史家遂以商纣王为鉴'},
 inept:{title:'昏庸之君',verdict:'居其位而未尽其责',review:'临天下而内政失序，民生凋困。一朝未见足以挽回之治绩，后世据其在位所见，遂以昏庸论之'},
 fallen:{title:'亡国之君',verdict:'山河易主宗社成尘',review:'都城失守，朝廷覆亡，此为本朝终局之实。至于国亡之责，不可仅凭最后一战尽断，仍须参照生前治绩'},
 unfinished:{title:'未竟之君',verdict:'岁月未长事业未竟',review:'临御未久即入终章，所见治绩尚不足以尽论平生。史官谨录眼前国势，不以短暂盛衰遽定终身'},
 troubled:{title:'困局之君',verdict:'国事维艰志业未成',review:'在位所见国事困弱，治绩未臻平顺。其所任之责与未竟之业，俱存于册，留后人据实评说'}
};
export function chooseEndingProfile(f){
 if(f.reason==='升仙')return 'sage';
 if(f.executions>=5&&f.reason==='亡国'&&f.domestic<30)return 'zhou';
 if(f.executions>=3&&f.living<40&&f.order<45)return 'tyrant';
 if(f.reason==='亡国')return 'fallen';
 if(f.years<10)return 'unfinished';
 if(f.domestic>=75&&f.control>=20&&f.wisdom>=400&&f.martial>=400&&f.victories>=3)return 'civilMartial';
 if(f.priorDomestic!==null&&f.priorDomestic<45&&f.domestic>=75)return 'restorer';
 if(f.domestic>=75&&f.executions===0&&f.filial>=80&&f.parenting>=80)return 'benevolent';
 if(f.control>=20&&f.victories>=5&&f.domestic>=45)return 'conqueror';
 if(f.battles>=10&&f.homeDead>0&&f.domestic<45)return 'warmonger';
 if(f.domestic<35&&f.order<40)return 'inept';
 if(f.total>=60)return 'keeper';
 if(f.total>=40)return 'mixed';
 return 'troubled';
}
const noPunctuation=t=>t.replace(/[\p{P}\p{S}\s]/gu,'');
export const plainInscription=noPunctuation;
const conclusions={
 '寿元已尽':'及寿数既终，宫灯渐寂，一生政事遂归史册',
 '禅让':'及传玺释位，本朝至此告终。其后能否承续，仍系于储位之实',
 '升仙':'及功业既成，人间诸事已有所成，遂辞九重宫阙，乘云而去',
 '病逝':'及疾势沉重，调治未复，终以病逝，宫中灯火自此寂然',
 '遇刺':'及巡行遭变，刃影惊驾，终未能免。朝野惊闻，帝业忽入终章',
 '服毒':'及亲服毒丹，此身遂尽。一念所决，终成不可挽回之事',
 '亡国':'及都城陷落，朝廷覆亡，山河易主，故国宫阙终余烟尘'
};
export function buildEndingAssessment(s,r){
 const h=r.historical??{},w=r.warRecord??{},record=s.dynasty?.endingRecord;
 const f={reason:r.reason,years:h.years??Math.floor((r.turn-(s.dynasty?.reignStartTurn??1))/36),domestic:h.domesticScore??r.scores.people,living:h.living??r.scores.people,order:h.order??r.scores.people,control:h.control??r.provinces,wisdom:s.stats.wisdom,martial:s.stats.martial,victories:w.victories??0,battles:w.total??0,homeDead:w.homeDead??0,total:r.total,executions:record?.executions??0,filial:r.family?.filialPiety??0,parenting:r.family?.parenting??0,priorDomestic:s.dynasty?.pastReigns?.at(-1)?.historical?.domesticScore??null};
 const id=chooseEndingProfile(f),profile=ENDING_PROFILES[id],parts=[`帝${r.name}承统，居九重而任天下之责`,profile.review];
 if(r.reason!=='亡国')parts.push(f.living>=80&&f.order>=80?'本朝百姓生计丰足，闾里安定，治安有序，此皆国政所见':f.living<30?'本朝民生贫弱，闾里生计尚多艰难，此为治世未竟之责':'本朝民生未臻大治，治绩当据各州实况而论，不可徒饰以盛世之辞');
 if(f.battles>0)parts.push(f.victories>0?'军中交战与胜负具载兵册，武事有成，亦不可忘阵亡之人':'本朝兵事已有实录，胜负未足称盛，军民所付之重不可不察');
 const arts=['wisdom','martial','charm','talent'].every(k=>s.stats[k]>=500);
 if(arts)parts.push('帝博学明断，兼资武略，风仪才情皆臻圆满，居尊而不废修身');
 if(f.filial>=80&&f.parenting>=80)parts.push('奉亲以孝，育嗣以慈，虽任万机，亦不忘人伦之本');
 if(specialActive(s.domestic,'greatWall',s.turn))parts.push('长城已成，屏藩边陲，留守土之备于后世');
 if(specialActive(s.domestic,'mausoleum',s.turn))parts.push('山陵礼备，慎终追远，宗庙之仪有所归');
 if((r.crowns??0)>=3)parts.push('屡登封禅，告功天地，礼成之事皆有册录');
 parts.push(conclusions[r.reason]??conclusions['寿元已尽']);
 if(f.years<10&&r.reason!=='升仙')parts.push('惟临御未满十载，此评限于已见之政，不遽尽断平生');
 if(record?.coverage!=='complete')parts.push('旧时刑政未有完备纪事，史官不据缺录臆断暴虐');
 parts.push(id==='zhou'?'后世以商纣王之失为鉴，称此为商纣之鉴':`后世据其德业，史称${profile.title}`);
 return {version:1,id,title:profile.title,verdict:profile.verdict,analogy:id==='zhou'?'商纣王':null,text:parts.join('。')+'。',facts:f};
}
