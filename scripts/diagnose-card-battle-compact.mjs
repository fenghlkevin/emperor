import fs from 'node:fs';
import crypto from 'node:crypto';
import {compareCompactPenalty} from './card-battle-compact-diagnostic.mjs';
const args=Object.fromEntries(process.argv.slice(2).map(s=>s.replace(/^--/,'').split('='))),pairs=Number(args.pairs??3000),domain=args.domain??'stage1-diagnostic-20261022-B';
if(!Number.isSafeInteger(pairs)||pairs<1||pairs>100000)throw Error('pairs must be an integer from 1 to 100000');
const files=['src/card-battle.mjs','src/card-battle-data.mjs','scripts/card-battle-balance-fixture.mjs','scripts/card-battle-compact-diagnostic.mjs','scripts/diagnose-card-battle-compact.mjs'];
const sources=Object.fromEntries(files.map(p=>[p,crypto.createHash('sha256').update(fs.readFileSync(new URL('../'+p,import.meta.url))).digest('hex')]));
const start=Date.now(),rows=[];
for(const [training,hero]of [[20,'command'],[60,'command'],[90,'command'],[20,'martial']]){const row=compareCompactPenalty({training,hero,pairs,domain});rows.push(row);console.log(row.id,JSON.stringify({baseline:row.baseline,removed:row.withoutCompactPenalty,change:row.pairedChange}));}
const report={version:'compact-penalty-diagnostic-v1',date:new Date().toISOString(),domain,pairs,sources,method:'Production engine and AI; same A/B seeds and fixed people; swapped initiative. Only compactPenalty differs, symmetrically. Paired change CI uses independent seed pairs. Diagnostic only, not release acceptance.',elapsedSeconds:(Date.now()-start)/1000,games:rows.reduce((n,r)=>n+r.games,0),rows};
if(args.out)fs.writeFileSync(args.out,JSON.stringify(report,null,2)+'\n');console.log('elapsedSeconds',report.elapsedSeconds);
