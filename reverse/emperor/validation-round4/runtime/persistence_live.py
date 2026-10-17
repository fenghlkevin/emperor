from common import *
import importlib.util,shutil
spec=importlib.util.spec_from_file_location('decoder',ROOT.parents[1]/'save-analysis/parse_saves.py');d=importlib.util.module_from_spec(spec);spec.loader.exec_module(d)
l.load();B=alloc(0x800);N=alloc(8);b=bytearray(0x800);expected=[]
values=[0,1,2,255,165,175,207,223]
for k,base in enumerate([0x65,0x3ce]):
 for i in range(45):
  b[base+i*18+1:base+i*18+3]=b'\xff\xff';v=values[(i+k)%len(values)];b[base+i*18+17]=v;expected.append(v)
p.write(B,b);p.write(N,struct.pack('<II',B,0));put(p.data(0xcc5e0),N,4);put(p.data(0xcc5e8),N,4);p.call(0x91d91,[l.C,3]);dest=OUT/'flag-persistence.SAV';shutil.copyfile(p.ROOT/'game/KING4.SAV',dest);decoded=d.parse(dest);assert decoded['other_count']==1
rec=decoded['battle_records'][0];diskflags=[u['special_flag'] for key in ['units_a','units_b'] for u in rec[key]];p.call(0x91c87,[l.C,3]);newnode=get(p.data(0xcc5e0),4,False);newB=get(newnode,4,False);actual=p.read(newB,0x704);loadedflags=[actual[base+i*18+17] for base in [0x65,0x3ce] for i in range(45)];r={'saved_battle_count':decoded['other_count'],'slots':90,'expected_flags':expected,'disk_flags':diskflags,'loaded_flags':loadedflags,'passed':expected==diskflags==loadedflags,'tail33_status':decoded['redundant_portrait_tail']['status']};finish('flag-persistence-live',r);assert r['passed'];put(p.data(0xcc5e0),0,4);put(p.data(0xcc5e8),0,4);p.call(0x9ad58,[newB]);p.call(0x9ad58,[newnode]);l.load()
