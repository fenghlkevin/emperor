import sys,json,importlib.util
from pathlib import Path
R=Path(__file__).resolve().parent;D=R/sys.argv[1];sys.path.insert(0,str(D));from live_flow import *
spec=importlib.util.spec_from_file_location('fixture6',R.parent/'branches/fixture_draft.py');f=importlib.util.module_from_spec(spec);spec.loader.exec_module(f)
ctx=stop_main();C=p.u32(p.data(0xc9920));p.call(0x91c87,[C,0]);name=sys.argv[2];case=next(x for x in f.CASES if x['name']==name);j=f.build(p,case)
# Keep ownership valid for the controlled path, unlike the menu-unavailable country used in old fixtures.
put(p.data(0xc99ac)+10*337+2,0)
(D/'fixture.json').write_text(json.dumps(j,indent=2));p.dump_log('fixture-protocol.json')
try:
 after=f.settle(p,j);result={'status':'complete-original-function-return','before':j,'after':after}
except Exception as e:
 result={'status':'did-not-return','error':str(e),'cpu':p.regs(),'before':j}
 if result['cpu']['CS']==0x160 and result['cpu']['DS']==0x168:
  result['after_partial']={'officials':f.officials(p),'local_owned':get(p.data(0xc99ac)+2,2,False),'target_owned':get(p.data(0xc99ac)+10*337+2,2,False)}
(D/'result.json').write_text(json.dumps(result,indent=2));p.dump_log('result-protocol.json');print(D.name,result['status'],flush=True)
