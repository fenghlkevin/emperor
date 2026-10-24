#!/usr/bin/env python3
"""Design-only rule checks, balanced/seat-paired simulations and person ablations."""
import argparse,copy,hashlib,importlib.util,json,math,statistics,sys
from pathlib import Path
from random import Random
from collections import Counter
BASE=Path(__file__).with_name('simulate-card-phase1.py')
spec=importlib.util.spec_from_file_location('phase_one',BASE);m=importlib.util.module_from_spec(spec);sys.modules[spec.name]=m;spec.loader.exec_module(m)

def check_state(g):
    for p in g.p:
        cards=p.deck+p.hand+p.board+p.grave
        assert len({c.uid for c in cards})==len(cards)
        assert sum(c.count for c in cards)+sum(p.reserve.values())==p.total
        assert 0<=p.mana<=10 and 0<=p.maxmana<=10 and len(p.hand)<=10 and len(p.board)<=7
        assert p.hp<=30 and p.armor>=0 and all(c.hp<=c.maxhp and 0<=c.loss_peak<=1 for c in cards if c.troop)
        people=[c.source_person for c in cards if c.data['type']=='general']
        assert len(people)==len(set(people))
    return 2

def structural(n=100):
    states=opening=0
    for seed in range(n):
        name=list(m.ROSTERS)[seed%8];roster=m.ROSTERS[name];t=(20,60,90)[seed%3];hero=('martial','intelligence','command')[seed%3];seeds=(700000+2*seed,700001+2*seed)
        named=[c['id']for c in m.CAT['cards']if c['type']=='general']
        pool=[named[(seed*3+j)%100]for j in range(3)]
        a=m.Game(roster,t,hero,seeds,0,people=pool);b=m.Game(roster,t,hero,seeds[::-1],1,people=pool)
        for g in(a,b):
            for p in g.p:assert any(c.troop and c.cost<=1 for c in p.hand);opening+=1
        def snap(g):
            out=[]
            for p in g.p:
                out.append((p.hp,p.armor,p.mana,p.maxmana,p.own_turn,p.power_used,p.fatigue,p.discount,tuple(p.gaps),dict(p.reserve),p.rng.getstate(),[[vars(c)for c in zone]for zone in(p.deck,p.hand,p.board,p.grave)]))
            return out
        while a.result is None:
            ac=a.choose();bc=b.choose();assert ac==bc,(seed,ac,bc)
            a.act(ac);b.act(bc);states+=check_state(a)+check_state(b)
            assert snap(a)==snap(b)[::-1]
        assert b.result==('draw'if a.result=='draw'else 1-a.result)
    fixed={};random_checks=0
    for seed in range(3000):
        rng=Random(seed);stats={k:rng.randrange(101)for k in('martial','intelligence','leadership')};stats['role']='文职'if seed%2 else'武将'
        uid='test-'+str(seed);x=m.fixed_random_person(fixed,uid,stats,seed)
        saved=json.loads(json.dumps(fixed));again=m.fixed_random_person(saved,uid,{k:100 for k in('martial','intelligence','leadership')},seed+10000)
        assert x==again
        d=x['cardDefinition'];assert stats['martial']>=d['requires_martial']
        primary=stats['leadership']if x['role']=='command'else stats[x['role']]
        assert d['primary_min']<=primary<=d['primary_max']
        assert d['cost']==3+x['tier']
        if stats['martial']<40:assert d['attack']<=2 and'rush'not in d['tags']
        assert x['name']not in {c['name']for c in m.CAT['cards']if c['type']=='general'}
        if stats['role']=='文职':assert x['portraitId'].startswith('random-civil-')
        random_checks+=1
    # Standard and partial-army entity accounting.
    for roster in ({'heavy':37},{'infantry':137,'spears':263},{'elephant':1800},{'heavy':7200}):
        g=m.Game(roster)
        while g.result is None:g.act(g.choose());states+=check_state(g)
    return {'identity_swap_pairs':n,'side_resource_states':states,'legal_opening_states':opening,'random_profile_generation_and_reload':random_checks}

def edge_checks():
    def blank():
        g=m.Game(m.ROSTERS['mixed_600']);g.result=None
        for p in g.p:p.board=[];p.hand=[];p.hp=30;p.armor=0;p.mana=p.maxmana=10
        return g
    def c(g,side,a,h,tags=()):
        u=g.card('infantry_line',len(g.p[side].board)+100,kind='infantry',count=100);u.a=u.printed_a=a;u.hp=u.maxhp=u.printed_hp=h;u.tags=set(tags);u.ready=True;g.p[side].board.append(u);return u
    passed=[]
    g=blank();a=c(g,0,5,10);b=c(g,1,3,10);g.act(('attack',a.uid,b.uid));assert(a.hp,b.hp)==(7,5);passed.append('5攻打10命并同时反击')
    g=blank();a=c(g,0,5,1);b=c(g,1,3,5);g.act(('attack',a.uid,b.uid));assert not g.p[0].board and not g.p[1].board;passed.append('交锋同归于尽仍完成双方伤害')
    g=blank();a=c(g,0,3,4,['shield']);g.hurt(a,0);assert'shield'in a.tags;g.hurt(a,9);assert a.hp==4 and'shield'not in a.tags and a.loss_peak==0;passed.append('圣盾抵消首次正伤害')
    g=blank();a=c(g,0,3,4,['rush']);a.rushing=True;assert -1 not in g.legal_attacks(a,g.p[1]);passed.append('突袭不能打主将')
    g=blank();a=c(g,0,3,4);b=c(g,1,2,3,['taunt']);assert g.legal_attacks(a,g.p[1])==[b.uid];b.tags.add('stealth');assert -1 in g.legal_attacks(a,g.p[1]);g.effect(0,{'op':'aoe','n':2},None,None);assert b.hp==1;passed.append('护卫与潜行、范围伤害')
    g=blank();a=c(g,1,3,4);g.effect(0,{'op':'freeze','target':'enemy'},a.uid,None);g.act(('end',));assert not g.legal_attacks(a,g.p[0]);g.act(('end',));assert not a.frozen;passed.append('冻结跳过下一个攻击回合')
    g=blank();a=c(g,0,2,3);g.hurt(a,2);peak=a.loss_peak;g.buff(a,{'a':2,'h':2});assert a.loss_peak==peak;g.effect(1,{'op':'silence','target':'enemy'},a.uid,None);assert a.a==2 and a.hp<=3 and a.loss_peak>=peak;passed.append('强化、沉默不返还既有兵员战损')
    g=blank();a=c(g,0,2,3);g.buff(a,{'a':2,'h':0,'temp':True});g.act(('end',));assert a.a==2;passed.append('临时攻击在己方回合结束移除')
    g=blank();p=g.p[0];p.deck=[];g.draw(p);g.draw(p);assert(p.hp,p.fatigue)==(27,2);passed.append('抽空疲劳逐次1、2')
    g=blank();p=g.p[0];p.armor=2;g.hero_hurt(p,3);assert(p.hp,p.armor,p.hero_damage)==(29,0,1);passed.append('护甲吸收伤害且不折损亲卫')
    g=blank();p=g.p[0];p.hand=[g.card('supply',200+i)for i in range(10)];u=g.card('infantry_line',999,'infantry',100);p.deck=[u];g.draw(p);assert u in p.grave and u.loss_peak==0;passed.append('爆牌弃置不产生兵员死亡')
    g=blank();a=c(g,0,2,3);p=g.p[0];p.hero='command';g.hurt(a,2);peak=a.loss_peak;g.act(('power',a.uid));assert a.hp==3 and a.loss_peak==peak;passed.append('整军治疗部队不复活实际兵员')
    g=blank();p=g.p[0];person=next(d for d in m.CAT['cards']if d['name']=='方孝孺');a=g.card(person['id'],555,'infantry',100);a.hp=0;a.played=1;p.board=[a];before=len(p.hand);g.cleanup();assert len(p.hand)==before+1;g.cleanup();assert len(p.hand)==before+1;passed.append('亡语只触发一次')
    return passed

def compare(label,roster,n,training,hero,people,people2=None,training2=None,roster2=None,offset=0,policy='balanced'):
    points=[];aw=bw=draw=0;rounds=[]
    for seed in range(offset,offset+n):
        pair=[]
        for first in(0,1):
            g=m.Game(roster,training,hero,(seed*2+9187,seed*2+9188),first,policy,people,roster2,training2,None,people2);r=g.run();aw+=r==0;bw+=r==1;draw+=r=='draw';pair.append(.5 if r=='draw'else float(r==0));rounds.append(g.round)
        points.append(sum(pair)/2)
    score=(aw+draw*.5)/(2*n);se=statistics.stdev(points)/math.sqrt(n)if n>1 else 0
    return {'case':label,'seed_pairs':n,'games':2*n,'A_wins':aw,'B_wins':bw,'draws':draw,'A_score':round(score,5),'paired_95ci':[round(max(0,score-1.96*se),5),round(min(1,score+1.96*se),5)],'median_rounds':statistics.median(rounds)}

if __name__=='__main__':
    ap=argparse.ArgumentParser();ap.add_argument('--quick',action='store_true');ap.add_argument('--output',default='/private/tmp/card-phase1-audit.json');a=ap.parse_args()
    structure=structural(10 if a.quick else 120);edges=edge_checks();print('checks',structure,'edges',len(edges),flush=True)
    people=[d for d in m.CAT['cards']if d['type']=='general'];matrix=[];mirrors=[];ablations=[];cross=[];sensitivity=[]
    for name in m.ROSTERS:
        for t in(20,60,90):
            for hero in('martial','intelligence','command'):matrix.append(m.evaluate(name,m.ROSTERS[name],10 if a.quick else 300,t,hero,offset=500000))
        print('matrix',name,flush=True)
    common=[m.generic_definition('martial'),m.generic_definition('command')]
    for i,d in enumerate(people):
        hero=('martial','intelligence','command')[i%3];pool=[d['id'],*common]
        mirrors.append(m.evaluate(d['name'],m.ROSTERS['mixed_1800'],3 if a.quick else 50,60,hero,offset=600000,people=pool))
        muted=copy.deepcopy(d);muted['id']='muted_'+d['id'];muted['enter']=[];muted['death']=[];muted['tags']=[];m.DEFS[muted['id']]=muted
        ablations.append(compare(d['name'],m.ROSTERS['mixed_1800'],3 if a.quick else 50,60,hero,pool,[muted['id'],*common],offset=610000))
    print('all 100 person mirrors and skill ablations',flush=True)
    for name in('mixed_1800','cavalry_1800','heavy_1800'):
        for hero in('martial','intelligence','command'):
            cross.append(compare(name+'_training_90_v_60_'+hero,m.ROSTERS[name],10 if a.quick else 200,90,hero,None,training2=60,offset=700000))
    for hero in('martial','intelligence','command'):
        cross.append(compare('army_1800_v_600_'+hero,m.ROSTERS['mixed_1800'],10 if a.quick else 200,60,hero,None,roster2=m.ROSTERS['mixed_600'],offset=710000))
        cross.append(compare('army_3600_v_1800_'+hero,m.ROSTERS['reserve_3600'],10 if a.quick else 200,60,hero,None,roster2=m.ROSTERS['mixed_1800'],offset=720000))
    for name,hero,t in [('mixed_1800','intelligence',60),('heavy_1800','intelligence',90),('mixed_600','martial',60)]:
        for policy in('balanced','aggressive','control'):
            sensitivity.append(m.evaluate(name,m.ROSTERS[name],10 if a.quick else 500,t,hero,policy,offset=800000))
    print('strength and independent policy checks',flush=True)
    report={'date':'2026-10-22','scope':'independent design model; not production engine or human win rates','quick':a.quick,'model_sha256':hashlib.sha256(BASE.read_bytes()).hexdigest(),'catalog_sha256':hashlib.sha256(m.CATALOG_PATH.read_bytes()).hexdigest(),'structural':structure,'edge_checks':edges,'matrix':matrix,'person_mirrors':mirrors,'person_skill_ablations':ablations,'training_and_army':cross,'independent_policy_checks':sensitivity}
    report['statistical_games']=sum(r['games']for rows in(matrix,mirrors,ablations,cross,sensitivity)for r in rows)
    Path(a.output).write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n');print('statistical games',report['statistical_games'],flush=True)
