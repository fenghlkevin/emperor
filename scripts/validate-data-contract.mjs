import {executeSpecial} from '../src/special-buildings.mjs';
import {captureArmyRecovery,offerArmyRecovery,quoteArmyRecovery,executeArmyRecovery,settleArmyRecovery} from '../src/army-recovery.mjs';
import {loseForceKits} from '../src/kit-strategy.mjs';
import {settleHanlin} from '../src/hanlin.mjs';
import {companyBond} from '../src/harem-bonds.mjs';
// Compile actual runtime snapshots against the saved-state contract, without
// trusting the inferred `any` types of the JavaScript implementation.
import ts from 'typescript';
import {initializeResourceEconomy} from '../src/province-resources.mjs';
import {mkdtempSync,writeFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {newGame,createPlayableGame,advance,validateSave} from '../src/game.mjs';
import {countrySummary} from '../src/domestic.mjs';
import {beginWar,finishWar,generals,borderingCountries} from '../src/war.mjs';
import {actBattle} from '../src/battle.mjs';
import {startCampaign,beginDefense,finishDefense} from '../src/foreign-strategy.mjs';
import {inviteEnvoy} from '../src/envoy-visits.mjs';
import {scheduleTravel,beginTravel,completeTravel} from '../src/travel.mjs';
import {alchemyAction} from '../src/alchemy.mjs';
import {executePersonnel,settlePersonnel} from '../src/personnel-actions.mjs';
import {startConstruction} from '../src/construction.mjs';
import {executeIndustry} from '../src/industry.mjs';
import {reserveWorldKits,settleWorldKits,executeKitCommand} from '../src/troop-kit-world.mjs';
import {laborProfile} from '../src/labor.mjs';
import {ACTIVE_HISTORICAL_PEOPLE} from '../src/exam.mjs';
import {endReign} from '../src/ending-rules.mjs';
import {settleReignResult} from '../src/reign-result.mjs';
import {occupyProvince} from '../src/occupation.mjs';
import {capitalFalls} from '../src/capital-crisis.mjs';

const root=resolve(fileURLToPath(new URL('..',import.meta.url)));
const snapshots=[];
const game=()=>{const s=newGame('数据契约');s.createdAt='2026-10-17T00:00:00.000Z';return s;};
const capture=(label,state)=>{const s=validateSave(structuredClone(state));snapshots.push({label,type:'GameSave',value:s});return s;};
const fresh=capture('new game',game());
capture('novice discounted special project',executeSpecial(createPlayableGame('特殊工程契约','大晟',{difficulty:'novice',seed:7}),{id:1,building:'mausoleum',provinceId:'longyou'}).state);
for(const difficulty of ['novice','standard','veteran'])capture('difficulty '+difficulty,createPlayableGame('难度契约','大晟',{difficulty,seed:7}));
for(const kind of ['longevity','harmony']){
 const s=game();s.turn=40;s.harem.streak=1;
 Object.assign(s.harem.members[0],{hiddenTraits:{version:1,source:'historical',kinds:[kind]},specialty:kind==='harmony'?'琴艺':'园艺',personality:'独立洒脱',bond:{visits:6,lastVisitTurn:39,lastEventTurn:0,lifeGranted:0}});
 let earned;for(let seed=1;seed<2000;seed++){const candidate=structuredClone(s);candidate.harem.portraitSeed=seed;companyBond(candidate,candidate.harem.members[0]);if(candidate.harem.bonds.history[0]?.kind===kind){earned=candidate;break;}}
 if(!earned)throw Error('Missing harem bond contract fixture: '+kind);capture('earned hidden harem '+kind,earned);
}
const playable=capture('canonical v2 new game',createPlayableGame('新版契约'));advance(playable);capture('canonical v2 settlement',playable);capture('v2 development plan',executeIndustry(createPlayableGame('计划契约'),{id:1,kind:'plan',provinceId:'hebei',industry:'commerce',area:1000,budget:2000}).state);capture('v2 expansion work',executeIndustry(createPlayableGame('扩城契约'),{id:1,kind:'expand',provinceId:'hebei'}).state);
const resourceGame=game();initializeResourceEconomy(resourceGame.domestic);
capture('resource economy new game',resourceGame);
advance(resourceGame);capture('resource economy settled turn',resourceGame);
snapshots.push({label:'all active historical profiles',type:'ExamCandidate[]',value:ACTIVE_HISTORICAL_PEOPLE.map(({dimensionEvidence,ratingBasis,...p})=>({...p,age:p.initialAge,loyalty:p.initialLoyalty,experience:p.initialExperience}))});
const annual=game();annual.turn=36;advance(annual);capture('annual settlement',annual);
snapshots.push({label:'country summary',type:'CountrySummary',value:countrySummary(annual.domestic)});
const g=generals(fresh.domestic),command={id:1,kitVersion:1,kind:'war',targetId:borderingCountries(fresh.domestic)[0].id,generalId:g[0].id,commanderSquad:{kind:'cavalry',count:37},squads:[{kind:'spears',count:137,generalId:g[1].id}]};
const cards=beginWar(game(),{...command,battleMode:'cards'});capture('card battle and fixed people',cards);capture('card battle after mulligan',(await import('../src/war.mjs')).advanceWar(cards,{type:'mulligan',ids:[]}));
const weaponBattle=beginWar(game(),{...command,battleMode:'cards',cardWeapons:{version:1,counts:{arsenal_blade:1,arsenal_spear:1}}});capture('weapon battle v4 actual spare-kit allocation',weaponBattle);capture('secret battle v5 sourced commander orders',beginWar(game(),{...command,battleMode:'cards',cardSecrets:{version:1,counts:{secret_watch:1,secret_ambush:1}}}));
capture('landmark battle v6 facilities plus secrets and weapons',beginWar(game(),{...command,battleMode:'cards',cardLandmarks:{version:1,counts:{field_camp:1,rally_post:1}},cardSecrets:{version:1,counts:{secret_watch:1,secret_ambush:1}},cardWeapons:{version:1,counts:{arsenal_blade:1,arsenal_spear:1}}}));
const war=capture('offensive battle',beginWar(fresh,command));war.domestic.war.battle=actBattle(war.domestic.war.battle,{type:'retreat'});capture('offensive report',finishWar(war).state);
const defense=game();defense.turn=37;startCampaign(defense.domestic,'xi','hebei',37);
const dg=generals(defense.domestic);capture('defensive weapons real local source',beginDefense(defense,{deployment:{kitVersion:1,battleMode:'cards',generalId:dg[0].id,commander:{sourceId:'hebei',kind:'cavalry',count:37,equipped:true},squads:[{sourceId:'central',kind:'spears',count:137,equipped:true,generalId:dg[1].id}],cardWeapons:{version:1,counts:{arsenal_blade:1,arsenal_spear:1}}}}));
capture('defensive secrets commander source v5',beginDefense(defense,{deployment:{kitVersion:1,battleMode:'cards',generalId:dg[0].id,commander:{sourceId:'central',kind:'cavalry',count:37,equipped:true},squads:[{sourceId:'hebei',kind:'infantry',count:73,equipped:true,generalId:dg[1].id}],cardSecrets:{version:1,counts:{secret_watch:1,secret_ambush:1}}}}));
capture('defensive landmarks commander source v6',beginDefense(defense,{deployment:{kitVersion:1,battleMode:'cards',generalId:dg[0].id,commander:{sourceId:'central',kind:'cavalry',count:37,equipped:true},squads:[{sourceId:'hebei',kind:'infantry',count:73,equipped:true,generalId:dg[1].id}],cardLandmarks:{version:1,counts:{field_camp:1,rally_post:1}}}}));
const defending=capture('defensive deployment',beginDefense(defense));defending.domestic.war.battle=actBattle(defending.domestic.war.battle,{type:'retreat'});capture('defensive report',finishDefense(defending).state);
const court=game();court.scene='court';capture('envoy invitation',inviteEnvoy(court,'japan'));
const alchemy=game();alchemy.phase=2;const brewing=capture('alchemy furnace',alchemyAction(alchemy,{kind:'brew',herbs:['A','B']}).state);for(let i=0;i<3;i++)advance(brewing);capture('alchemy batches',brewing);
const trip=game();trip.phase=1;trip.domestic.countries.find(c=>c.id==='sheng').fiscal.treasury=30000;
const scheduled=capture('scheduled tour',scheduleTravel(trip,'tour','guannei').state);advance(scheduled);const traveling=capture('started tour',beginTravel(scheduled).state);
// The completed path with no encounters represents a supported older in-flight tour.
traveling.travel.pending.encounters=[];capture('completed tour',completeTravel(traveling).state);
const personnel=game();personnel.turn=2;personnel.domestic.personnel.examTurn=2;
let n=0;settlePersonnel(personnel.domestic,2,()=>[0,.1,.9,.3,.6,.8][n++%6],personnel.stats);
capture('exam candidates',personnel);const candidateId=personnel.domestic.personnel.candidates[0].id;
capture('hired official',executePersonnel(personnel,{id:1,kind:'hire',candidateId}).state);
capture('construction project',startConstruction(game(),'hebei','temples').state);
const industry=executeIndustry(game(),{id:1,kind:'develop',provinceId:'hebei',industry:'agriculture',area:10}).state;
capture('industry project',industry);advance(industry);capture('industry activation',industry);
const converted=executeIndustry(game(),{id:1,kind:'convert',provinceId:'hebei',fromIndustry:'commerce',industry:'agriculture',area:10}).state;
capture('land conversion project',converted);advance(converted);capture('land conversion activation',converted);
capture('city capacity expansion',executeIndustry(game(),{id:1,kind:'expand',provinceId:'hebei'}).state);
const drafted=game();initializeResourceEconomy(drafted.domestic);drafted.domestic.countries[0].fiscal.treasury=100000;
const enlisted=laborProfile(drafted.domestic.provinces[0]).available+100;
capture('industry drafted soldiers',executeKitCommand(drafted,{id:1,kind:'recruit',sourceId:'hebei',amount:enlisted,draftRates:{farmers:50}}).state);
capture('industry drafted militia',executeIndustry(drafted,{id:1,kind:'levy-militia',provinceId:'hebei',amount:enlisted,draftRates:{workers:50}}).state);
const employer=executeIndustry(drafted,{id:1,kind:'develop',provinceId:'hebei',industry:'industry',area:100}).state;advance(employer);capture('industry pending hiring',employer);advance(employer);capture('industry hired workers',employer);
const occupied=game();const target=occupied.domestic.provinces.find(p=>p.countryId==='japan');
snapshots.push({label:'occupation receipt',type:'OccupationReceipt',value:occupyProvince(occupied.domestic,'japan',1,'sheng',target.id)});capture('occupation',occupied);
const crisis=game();capitalFalls(crisis.domestic,'xi',1);capture('capital crisis',crisis);
const ended=game();endReign(ended,'病逝','类型验证：危重病逝');settleReignResult(ended);capture('current reign result',ended);
const legacy=structuredClone(ended);legacy.reignResult.version=1;delete legacy.reignResult.historical;delete legacy.reignResult.warRecord;delete legacy.reignResult.evidence;capture('retained legacy result',legacy);

const hanlin=game();initializeResourceEconomy(hanlin.domestic);const pupil=hanlin.domestic.justice.officials[0];Object.assign(pupil,{positionId:null,office:'待命',provinceId:null});const studying=executePersonnel(hanlin,{id:hanlin.domestic.personnel.nextId,kind:'hanlin-enroll',officialId:pupil.id,attribute:'politics'}).state;settleHanlin(studying.domestic,2);studying.turn=2;capture('hanlin tuition and fixed potential',studying);

const extraGear=game();reserveWorldKits(extraGear.domestic,'central','type:extra',[{kind:'infantry',count:1}],{extraKits:{spears:2}});capture('extra equipment reservation without extra soldiers',extraGear);settleWorldKits(extraGear.domestic,'central','type:extra',[1],{extraKitLoss:{spears:1}});capture('separate equipment loss settlement',extraGear);

let recovery=createPlayableGame('恢复契约');captureArmyRecovery(recovery.domestic,recovery.turn);loseForceKits(recovery.domestic,{countryId:'sheng',sourceId:'central',soldiers:1600,training:60},1600);offerArmyRecovery(recovery.domestic,recovery.turn);capture('central loss recovery offer',recovery);
recovery=executeArmyRecovery(recovery,{id:1,kind:'start',cap:quoteArmyRecovery(recovery).suggestedCap,train:true,draft:true}).state;capture('authorized paid recovery',recovery);
settleArmyRecovery(recovery.domestic,2);recovery.turn=2;capture('paid recovery batch',recovery);recovery=executeArmyRecovery(recovery,{id:2,kind:'cancel'}).state;capture('cancelled recovery budget',recovery);
const directory=mkdtempSync(join(tmpdir(),'emperor-data-contract-'));
try{
 const file=join(directory,'snapshots.mts');
 const source=`import type {GameSave,CountrySummary,Province,DomesticState,ReignResult,TroopKind,ExamCandidate,OccupationReceipt,KitReservation,KitStock} from ${JSON.stringify(join(root,'src/game-types.d.ts'))};\n`+
 snapshots.map(({label,type,value},i)=>`// ${label}\nconst snapshot${i} = ${JSON.stringify(value)} satisfies ${type};`).join('\n')+`
// Required modern fields and discriminated versions must remain enforced.
declare const stock: KitStock;
// @ts-expect-error active reservations cannot already report settled equipment loss
const earlyExtraLoss: KitReservation = {status:'active',squads:[],extraKits:stock,extraKitLoss:stock};
// @ts-expect-error settled equipment occupancy must carry its loss receipt
const missingExtraLoss: KitReservation = {status:'settled',squads:[],survivors:[],extraKits:stock};
// @ts-expect-error a loss receipt cannot invent unreserved equipment
const inventedExtraLoss: KitReservation = {status:'settled',squads:[],survivors:[],extraKitLoss:stock};
declare const state: GameSave;
// @ts-expect-error military equipment lives in troopKits, not the province
state.domestic.provinces[0].military.arsenal;
// @ts-expect-error central soldiers are a deployment, not an equipment ledger
state.domestic.centralArmy.arsenal;
// @ts-expect-error the ninth supported troop kind is horse-archers
const invalidKind: TroopKind = 'horses';
// @ts-expect-error domestic schema 6 is unsupported
const invalidVersion: DomesticState['schemaVersion'] = 6;
// @ts-expect-error troop stock is required after normalization
const missingKits: DomesticState = { ...state.domestic, troopKits: undefined };
// @ts-expect-error schema 8 requires the completed civic baselines
const missingCivic: Province = { ...state.domestic.provinces[0], civic: undefined };
// @ts-expect-error current reign results require historical evidence
const missingEvidence: ReignResult = { ...state.reignResult!, version: 2, historical: undefined };
`;
 writeFileSync(file,source);
 const program=ts.createProgram([file],{noEmit:true,strict:true,target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.NodeNext,moduleResolution:ts.ModuleResolutionKind.NodeNext,types:[]});
 const diagnostics=ts.getPreEmitDiagnostics(program);
 if(diagnostics.length){
  // JSON snapshots use a long single line. Emit compact errors without dumping
  // the complete state, and identify the originating fixture.
  for(const d of diagnostics){const pos=d.file?.getLineAndCharacterOfPosition(d.start??0);const line=pos?.line??0;const lines=d.file?.text.split('\n')??[];const label=lines[line-1]?.startsWith('// ')?lines[line-1].slice(3):d.file?.fileName;console.error(`${label}:${(pos?.line??0)+1} TS${d.code}: ${ts.flattenDiagnosticMessageText(d.messageText,' ')}`);}
  process.exitCode=1;
 }else console.log(`Data contract: ${snapshots.length} runtime snapshots and negative type checks passed (TypeScript ${ts.version}).`);
}finally{rmSync(directory,{recursive:true,force:true});}
