from pathlib import Path
import json,struct
import probe as p
from live_checks import snap,save,E,C,OUT
ROOT=p.ROOT
cases=[]
for name,date,expected,age_delta,training_delta in [('no-half',[0,2,0,0],[0,2,0,1],0,0),('upper-to-lower',[0,2,0,2],[0,2,1,0],0,-1),('year',[0,11,1,2],[1,0,0,0],1,-1)]:
 p.call(0x91c87,[C,0]);p.write(p.data(0xc9030),struct.pack('<I',12345));p.write(C,struct.pack('<H',1));p.write(p.data(0xc98dc),bytes(date));before=snap(name+'-before');save(name+'-before.SAV');p.call(0x11f7d,[C]);after=snap(name+'-after');save(name+'-after.SAV');assert after['date']==expected,(name,after);assert after['age']==before['age']+age_delta;assert after['region_training'][0]==before['region_training'][0]+training_delta
 cases.append({'id':name,'before':before,'after':after,'status':'passed date, emperor age, hebei training','source':'original function11f7d executed in32bit DOS4GW'})
(ROOT/'calendar-live.json').write_text(json.dumps(cases,indent=2));p.dump_log('calendar-live-protocol.json');print([(c['id'],c['before']['treasury'],c['after']['treasury'],c['after']['date'],c['after']['age']) for c in cases])
