from pathlib import Path
exec(Path(__file__).with_name('war_live.py').read_text().split('for name,res,reason,expected')[0])
fixture(1,1);unit(1,1,1);unit(2,4,4);p.call(0x6775f,[W]);actual={'soldiers':get(l.R0+0x22),'knife':get(l.R0+0x7c),'helmet':get(l.R0+0x82)};expected={'soldiers':104,'knife':3,'helmet':3};r={'actual':actual,'expected':expected,'passed':actual==expected};(p.ROOT/'rounding-live.json').write_text(json.dumps(r,indent=2));p.dump_log('rounding-live-protocol.json');print(r)
