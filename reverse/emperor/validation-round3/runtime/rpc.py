from pathlib import Path
import json,uuid,time,sys
Q=Path(__file__).resolve().parent/'queue';Q.mkdir(exist_ok=True);uid=f'{time.time_ns()}-{uuid.uuid4().hex[:8]}';p=Q/f'{uid}.request.json';p.write_text(json.dumps({'command':' '.join(sys.argv[1:])}));out=Q/f'{uid}.response.json'
end=time.time()+45
while not out.exists() and time.time()<end:time.sleep(.05)
if not out.exists():raise TimeoutError('DOSBox RPC response pending: '+str(p))
r=json.loads(out.read_text());print('\n'.join(r.get('lines',[])) if 'lines' in r else r)
