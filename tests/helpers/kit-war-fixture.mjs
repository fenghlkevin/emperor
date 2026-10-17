import {beginWar,finishWar,generals} from '../../src/war.mjs';
import {check} from '../../src/battle.mjs';
export function kitOrder(s,targetId){const gs=generals(s.domestic);return {id:s.domestic.war.nextId,kind:'war',kitVersion:1,targetId,generalId:gs[0].id,commanderSquad:{kind:'infantry',count:100},squads:[{kind:'spears',count:100,generalId:gs[1].id}]};}
// A completed tactical fixture for occupation/career tests. Uses actual reserved
// soldiers and accounts for the defeated commander's exact kit/person losses.
export function settledVictory(s,targetId){const n=beginWar(s,kitOrder(s,targetId)),b=n.domestic.war.battle,u=b.units.find(u=>u.commander&&u.side==='enemy');u.dead=u.initial;u.count=0;check(b);return finishWar(n);}
export function settledRetreat(s,targetId){const n=beginWar(s,kitOrder(s,targetId)),b=n.domestic.war.battle;for(const u of b.units.filter(u=>u.side==='home'))u.fled=true;check(b);return finishWar(n);}
