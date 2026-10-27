import fs from 'node:fs';
const read=p=>fs.existsSync(p)?JSON.parse(fs.readFileSync(p,'utf8')):null;
const art=read('docs/card-battle-historical-regional-outfit-review.json');
const visual=read('docs/card-battle-final-visual-performance-summary.json');
const balance=read('docs/card-battle-final-balance-summary.json');
const games=read('docs/card-battle-real-games-ui-validation.json');
const soak=read('docs/card-battle-foreground-soak-validation.json');
const culture=read('docs/card-battle-person-cultural-evidence.json');
const priorValid=['passed','continued-in-foreground'].includes(games?.status)&&games?.errors?.length===0;
const soakGamesValid=soak?.errors?.length===0&&(soak?.completedGames??[]).every(g=>g.settlementMatchesProduction&&g.duplicateSettlementRejected);
const actualGames=(priorValid?(games?.games?.length??0):0)+(soakGamesValid?(soak?.completedGames?.length??0):0);
const gates=[
 {id:'existing-costume-review',done:art?.reviewedCount===100&&!art?.costumeCorrectionPending?.length&&!art?.targetedReviewPending?.length,evidence:'docs/card-battle-historical-regional-outfit-review.json'},
 {id:'native-person-presentations',done:visual?.checksPassed===1901&&visual?.consoleErrors?.length===0,evidence:'docs/card-battle-final-person-presentation-ui-validation.json'},
 {id:'final-balance-user-acceptance',done:balance?.completedGroups===81&&balance?.invalid?.length===0&&balance?.deliveryBalanceStatus==='accepted-by-user-with-recorded-target-exceptions',evidence:'docs/card-battle-final-balance-summary.json',note:'Original numerical gate remains failed; user explicitly accepts recorded base and configured exceptions.'},
 {id:'twenty-actual-ui-games',done:actualGames>=20,completed:actualGames,evidence:'docs/card-battle-real-games-ui-validation.json'},
 {id:'foreground-hour',done:soak?.status==='passed'&&soak?.focusedSeconds>=3600&&soak?.errors?.length===0,focusedSeconds:soak?.focusedSeconds??0,evidence:'docs/card-battle-foreground-soak-validation.json'}
];
const result={updated:new Date().toISOString(),status:gates.every(g=>g.done)?'ready-for-final-evidence-review':'in-progress',gates,historicalIdentityLimitation:{reviewedBiographies:culture?.regionalEvidenceReviewed,explicitlyUnresolvedOriginalLinks:culture?.historicalLinkPending,notPromotedToVerified:true},excluded:['all voice and sound effects','optional hero replacement','old-save compatibility'],note:'This index does not replace individual evidence review or by itself stop the automation.'};
fs.writeFileSync('docs/card-battle-delivery-checklist.json',JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify({status:result.status,gates:gates.map(({id,done,completed,focusedSeconds})=>({id,done,completed,focusedSeconds}))}));
