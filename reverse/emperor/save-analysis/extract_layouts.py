from pathlib import Path
import re,json
root=Path(__file__).resolve().parents[1]
s=(root/'code-analysis/KING/object1.relocated.asm').read_text()
configs=[('official',0x924db,0x9268b,0xce7c4,None),('harem',0x9268b,0x927b7,0xce7f4,0xcc1dc),('child',0x927b7,0x928c0,0xce80c,None),('region',0x928c0,0x934d1,0xce824,0xc990e)]
res={}
for name,start,end,srcbase,dstbase in configs:
 fields=[];pending={}
 for line in s.splitlines():
  m=re.match(r'\s*([0-9a-f]+):.*?\t(.*)',line)
  if not m:continue
  pc=int(m[1],16)
  if not start<=pc<end:continue
  ins=m[2];load=re.search(r'mov(?:sx|zx)?\s+(\w+), (byte|word|dword) ptr \[0x([0-9a-f]+)\]',ins)
  if load:
   reg,typ,addr=load.groups();addr=int(addr,16)
   if srcbase<=addr<srcbase+0x180:pending[reg]={'serialized_offset':addr-srcbase,'width':{'byte':1,'word':2,'dword':4}[typ],'load_pc':hex(pc)}
  store=re.search(r'mov\s+(byte|word|dword) ptr \[(e\w+)(?: \+ 0x([0-9a-f]+))?\], (\w+)$',ins)
  if store:
   typ,base,dst,reg=store.groups()
   if reg in pending:
    f=dict(pending.pop(reg));f['runtime_offset']=int(dst or '0',16)-(dstbase or 0);f['store_pc']=hex(pc);f['runtime_width']={'byte':1,'word':2,'dword':4}[typ];f['conversion']='sign-extension' if 'movsx' in next((ln for ln in s.splitlines() if ln.lstrip().startswith(f["load_pc"][2:]+':')), '') else 'zero-extension' if 'movzx' in next((ln for ln in s.splitlines() if ln.lstrip().startswith(f["load_pc"][2:]+':')), '') else 'copy';fields.append(f)
 res[name]={'evidence_function':hex(start),'fields':fields}
(root/'save-analysis/layout_evidence.json').write_text(json.dumps(res,indent=2))
print({k:len(v['fields']) for k,v in res.items()})
