import {test} from 'node:test';import assert from 'node:assert/strict';
import {fixture} from '../scripts/card-battle-balance-fixture.mjs';
import {actCardsMutable,cardAI,HISTORICAL_CARDS} from '../src/card-battle.mjs';
import {cardHistoryView,historyStatChanges} from '../src/card-battle-history-view.mjs';
function place(b,side,select=x=>x.type!=='tactic'){const p=b.cards.players[side],id=[...p.hand,...p.deck].find(id=>select(b.cards.catalog[id]));assert.ok(id);for(const z of ['hand','deck'])p[z]=p[z].filter(x=>x!==id);p.board.push(id);const x=b.cards.catalog[id];x.ready=true;x.played=++b.cards.sequence;return x;}
const start=options=>{const b=fixture(options);actCardsMutable(b,cardAI(b));return b;};
test('history view describes 5 attack against 10 health, simultaneous retaliation and actual armor changes',()=>{
 const b=start(),a=place(b,'home'),t=place(b,'enemy');Object.assign(a,{attack:5,hp:10,maxHp:10,tags:[]});Object.assign(t,{attack:3,hp:10,maxHp:10,tags:[]});actCardsMutable(b,{type:'attack',id:a.id,target:t.id});
 const before=JSON.stringify(b),row=cardHistoryView(b).groups.at(-1).rows.at(-1);assert.equal(row.cost,0);assert.ok(row.title.includes(a.name+' → '+t.name));assert.ok(row.events.some(e=>e.values.some(v=>v.text==='生命 10 → 5（-5）')));assert.ok(row.events.some(e=>e.cause.includes('同时反击 · '+t.name)&&e.values.some(v=>v.text==='生命 10 → 7（-3）')));assert.equal(JSON.stringify(b),before);
 assert.deepEqual(historyStatChanges({hp:10,armor:2},{hp:7,armor:0}).map(v=>v.text),['生命 10 → 7（-3）','护甲 2 → 0（-2）']);
 a.ready=true;t.tags=['shield'];const hp=t.hp;actCardsMutable(b,{type:'attack',id:a.id,target:t.id});const shield=cardHistoryView(b).groups.at(-1).rows.at(-1).events.find(e=>e.title.includes('护甲盾消耗'));assert.deepEqual(shield.values.map(v=>v.text),['关键词 护甲盾 → 无']);assert.equal(t.hp,hp);
});
test('view filters rounds and actors while preserving real event order across a turn boundary',()=>{
 const b=start();for(let i=0;i<12&&!b.result;i++)actCardsMutable(b,cardAI(b));const all=cardHistoryView(b),round=all.rounds.at(-1),filtered=cardHistoryView(b,{round:String(round),side:'home'});assert.equal(filtered.total,all.total);assert.ok(filtered.groups.every(g=>g.round===round&&g.rows.every(r=>r.side==='home')));assert.equal(filtered.shown,filtered.groups.flatMap(g=>g.rows).length);
 const first=all.groups[0].rows[0];assert.ok(first.events.some(e=>e.cause.includes('回合开始')));const turn=all.groups.flatMap(g=>g.rows).find(r=>r.events.some(e=>e.ply>r.ply));assert.ok(turn);assert.ok(turn.events.every((e,i)=>e.ordinal===i+1));
});
test('death draw fatigue chain, localized status expiry and skill costs stay inspectable',()=>{
 const person=HISTORICAL_CARDS.find(d=>d.death.some(f=>f.op==='draw')),b=start({people:[person]}),a=place(b,'home',x=>x.type==='general'&&x.definition.death.length),t=place(b,'enemy');Object.assign(a,{attack:1,hp:1,tags:[]});Object.assign(t,{attack:10,hp:20,tags:[]});const p=b.cards.players.home;p.grave.push(...p.deck);p.deck=[];p.gaps=[];actCardsMutable(b,{type:'attack',id:a.id,target:t.id});const row=cardHistoryView(b).groups.at(-1).rows.at(-1),fatigue=row.events.find(e=>e.title.includes('疲劳'));assert.ok(fatigue.cause.includes('遗计 · '+a.name+' / 抽牌 → 疲劳'));assert.match(fatigue.note,/疲劳伤害/);
 const status=historyStatChanges({frozen:true,silenced:false,tempAttack:3,tags:['taunt','shield']},{frozen:false,silenced:true,tempAttack:0,tags:[]}).map(v=>v.text);assert.ok(status.includes('冻结 是 → 否'));assert.ok(status.includes('沉默 否 → 是'));assert.ok(status.includes('临时攻击 3 → 0（-3）'));assert.ok(status.includes('关键词 护卫、护甲盾 → 无'));
 const skill=start({hero:'intelligence'});skill.cards.players.home.mana=skill.cards.players.home.maxMana=10;actCardsMutable(skill,{type:'power'});const power=cardHistoryView(skill).groups.at(-1).rows.at(-1);assert.equal(power.cost,2);assert.match(power.title,/主将技能/);assert.ok(power.resources.some(r=>r.includes('军令 10 → 8')));
});
test('read-only empty/partial histories and enemy draw labels never expose unknown identities',()=>{
 const fresh=fixture(),before=JSON.stringify(fresh);assert.equal(cardHistoryView(fresh).total,0);assert.equal(cardHistoryView(fresh).partial,false);assert.equal(JSON.stringify(fresh),before);
 const b=start({first:'enemy'}),view=cardHistoryView(b);assert.ok(view.groups.flatMap(g=>g.rows).flatMap(r=>r.events).some(e=>e.title.includes('抽牌 · 敌军（未公开牌名）')));const e=b.cards.players.enemy;for(const id of [...e.hand,...e.deck])b.cards.catalog[id].name='SECRET';e.deck.reverse();assert.deepEqual(cardHistoryView(b),view);assert.ok(!JSON.stringify(view).includes('SECRET'));
 delete b.cards.history;const old=JSON.stringify(b),partial=cardHistoryView(b);assert.equal(partial.partial,true);assert.equal(partial.total,0);assert.equal(JSON.stringify(b),old);actCardsMutable(b,cardAI(b));assert.equal(cardHistoryView(b).partial,true);
});
