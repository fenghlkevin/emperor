import fs from 'node:fs';
import crypto from 'node:crypto';
import {fixture} from './card-battle-balance-fixture.mjs';
import {actCardsMutable} from '../src/card-battle.mjs';
const counts=(c,ids)=>ids.reduce((a,id)=>(a[c.catalog[id].type]++,a),{troop:0,general:0,tactic:0});
const examples=[];for(const n of [25,100,200,450,840,1800]){const b=fixture({roster:{infantry:n}}),c=b.cards,p=c.players.home;examples.push({fieldSoldiers:n,fullDeck:counts(c,[...p.hand,...p.deck])});}
let maxRun=0,longWindows=0,cards=0,wrongDraws=0,drawChecks=0,missingDraws=0;
for(let seed=1;seed<=1000;seed++){
 const b=fixture({seeds:{home:seed,enemy:seed+10000}}),c=b.cards;let run=0;
 for(const id of c.players.home.deck){run=c.catalog[id].type==='tactic'?run+1:0;maxRun=Math.max(maxRun,run);if(run>=4)longWindows++;cards++;}
 actCardsMutable(b,{type:'mulligan',ids:[]});
 for(let i=0;i<100&&!b.result;i++){
  const side=c.turn==='home'?'enemy':'home',top=c.players[side].deck[0];actCardsMutable(b,{type:'end'});
  if(!top)continue;drawChecks++;const e=c.events.find(e=>['draw','burn'].includes(e.type)&&e.side===side);if(!e)missingDraws++;else if(e.id!==top)wrongDraws++;
 }
}
const report={date:'2026-10-22',engineSha256:crypto.createHash('sha256').update(fs.readFileSync(new URL('../src/card-battle.mjs',import.meta.url))).digest('hex'),examples,randomOrderAudit:{seeds:1000,cardsInspected:cards,drawAndBurnChecks:drawChecks,wrongDraws,missingDraws,maxConsecutiveTactics:maxRun,fourOrMoreTacticRunWindows:longWindows},conclusion:'The engine draws or burns the next shuffled card. Tiny armies fill most of the 30-card deck with tactics; random tactic streaks also occur in normal 18-unit/12-tactic decks. No forced type draw is added.'};
if(wrongDraws||missingDraws)throw Error('draw order audit failed');
fs.writeFileSync(new URL('../docs/card-battle-draw-audit.json',import.meta.url),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report.randomOrderAudit));
