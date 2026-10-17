from pathlib import Path
import json,sys,bisect
root=Path(__file__).parent
variant=sys.argv[1];mode=sys.argv[2];a=int(sys.argv[3],0);j=json.loads((root/f'{variant}.index.json').read_text());fs=j['functions'];ss=[f['start'] for f in fs]
def fmt(x):return hex(x)
if mode=='function':
 i=bisect.bisect_right(ss,a)-1;f=fs[i];print('FUNCTION',hex(f['start']),hex(f['end']))
 for x in j['instructions']:
  if f['start']<=x['address']<f['end']:print(f'{x["address"]:x}: {x["op"]:8} {x["args"]}')
elif mode=='xrefs':
 end=int(sys.argv[4],0) if len(sys.argv)>4 else a+1
 for f in fs:
  for c in f['calls']:
   if a<=c['target']<end:print('CALL',fmt(f['start']),fmt(c['pc']),fmt(c['target']))
  for r in f['references']:
   if a<=r['target_va']<end:print('DATA',fmt(f['start']),fmt(r['source_va']),fmt(r['target_va']))
