from pathlib import Path
import re,json,sys
root=Path(__file__).resolve().parents[2];out=Path(__file__).parent
rows=[]
for v,a in [('KING',0xcc4f8),('EMPEROR',0xcc5dc),('QUICK',0xcc604)]:
 lines=(root/'code-analysis'/v/'object1.relocated.asm').read_text().splitlines()
 refs=[{'line':i+1,'instruction':s.strip()} for i,s in enumerate(lines) if re.search(r'0x%x\b'%a,s)]
 layout=json.loads((root/'code-analysis'/v/'layout.json').read_text());obj=layout['objects'][1];data=(root/'code-analysis'/v/'object2.bin').read_bytes()
 rows.append({'variant':v,'counter_static_va':hex(a),'direct_references':refs,'object2_base':hex(obj['base']),'object2_initialized_dump_length':len(data),'counter_in_virtual_zero_fill':a-obj['base']>=len(data),'object2_virtual_size':obj['virtual_size']})
 if v=='EMPEROR':
  for name,lo,hi in [('active_assign',0x4abd7,0x4ac28),('defense_assign',0x80d0b,0x80da7),('lookup_restore',0x6670e,0x6680a),('battle_append',0x4ad32,0x4ad8d),('counter_load',0x93d34,0x93d49),('counter_save',0x95b32,0x95b49)]:
   ss=[s for s in lines if (m:=re.match(r'\s*([0-9a-f]+):',s)) and lo<=int(m[1],16)<hi];(out/(name+'.asm')).write_text('\n'.join(ss)+'\n')
(out/'evidence.json').write_text(json.dumps(rows,ensure_ascii=False,indent=2)+'\n')
