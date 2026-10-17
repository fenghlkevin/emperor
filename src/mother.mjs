// Hidden relationship: deliberately omitted from the emperor's visible stat panel.
export function initializeMother(s){
 s.mother??={filialPiety:50,lastVisitTurn:null,neglectedTurns:0,age:45,alive:true};
 s.mother.age??=45;s.mother.alive??=true;return s.mother;
}
export function validateMother(s){
 const m=initializeMother(s);
 if(!Number.isInteger(m.age)||m.age<0||m.age>150||typeof m.alive!=='boolean'||(m.unknown!==undefined&&typeof m.unknown!=='boolean')||(m.deathTurn!==undefined&&(!Number.isSafeInteger(m.deathTurn)||m.deathTurn<1||m.deathTurn>s.turn))||!Number.isInteger(m.filialPiety)||m.filialPiety<0||m.filialPiety>100||!Number.isSafeInteger(m.neglectedTurns)||m.neglectedTurns<0||(m.lastVisitTurn!==null&&(!Number.isSafeInteger(m.lastVisitTurn)||m.lastVisitTurn<1||m.lastVisitTurn>s.turn)))throw Error('慈宁宫存档无效');
}
export function visitMother(s){const m=initializeMother(s);m.filialPiety=Math.min(100,m.filialPiety+(m.alive?5:1));m.lastVisitTurn=s.turn;m.neglectedTurns=0;}
export function settleMother(s){
 const m=initializeMother(s);
 if(m.lastVisitTurn===s.turn-1)m.neglectedTurns=0;
 else {m.neglectedTurns++;if(m.neglectedTurns>=3)m.filialPiety=Math.max(0,m.filialPiety-3);}
}
export function motherGreeting(s){const m=initializeMother(s);return m.unknown?'新帝生母未载玉牒，慈宁宫暂奉先朝灵位。':!m.alive?'太后已薨逝，慈宁宫设灵位，陛下可来祭奠。':m.neglectedTurns>=3?'这些日子忙于朝政，也要记得照顾自己。':m.filialPiety>=75?'皇儿常来陪伴，哀家心中甚慰。':m.filialPiety<30?'皇儿来了，坐下陪哀家说说话吧。':'皇儿有心了，来，陪哀家喝盏茶。';}
