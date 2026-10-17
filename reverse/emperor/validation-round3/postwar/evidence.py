from pathlib import Path
import json,struct,hashlib
ROOT=Path(__file__).resolve().parents[2]
OUT=Path(__file__).parent
j=json.loads((ROOT/'rules-analysis/EMPEROR.index.json').read_text())
b=(ROOT/'code-analysis/EMPEROR/object1.relocated.bin').read_bytes()
ranges={'outcome_actions':(0x5cd22,0x60e16),'battle_end_and_remove':(0x6564e,0x65b57),'chief_only_end':(0x66607,0x6668f),'result_dispatch':(0x6668f,0x6775f),'return_B_units':(0x6775f,0x67d9e),'A_population_loss':(0x67d9e,0x67e9d),'aux_population_loss':(0x67e9d,0x68031)}
for name,(a,z) in ranges.items():
 (OUT/f'{name}.asm').write_text('\n'.join(f'{x["address"]:x}: {x["op"]:8} {x["args"]}' for x in j['instructions'] if a<=x['address']<z)+'\n')
tables={hex(a):[hex(v) for v in struct.unpack_from('<5I',b,a-0x10000)] for a in (0x67280,0x67718)}
assert tables['0x67280']==['0x668bf','0x6725e','0x668bf','0x6725e','0x6725e']
assert tables['0x67718']==['0x672e4','0x67712','0x672e4','0x67712','0x67712']
(OUT/'evidence.json').write_text(json.dumps({'evidence_type':'static disassembly and raw relocated jump table, not runtime','sha256':hashlib.sha256(b).hexdigest(),'jump_tables':tables,'ranges':{k:[hex(a),hex(z)] for k,(a,z) in ranges.items()}},indent=2)+'\n')
print('7 assembly slices and 2 raw jump tables verified')
