from pathlib import Path
import json,struct
root=Path(__file__).resolve().parents[2]
out=Path(__file__).resolve().parent
index=json.loads((root/'rules-analysis/KING.index.json').read_text())
for name,start,end in [('hunting_ctor',0x8e5f0,0x8e7c2),('hunting_settlement',0x8e86a,0x8e9f8),('hunting_setup',0x8e9f8,0x8ed25),('hunting_shot',0x8ee50,0x8f11e),('hunting_spawn_timer',0x8f11e,0x8f80b),('hunting_pixel_hit',0x8f80b,0x8f8eb)]:
 (out/f'{name}.asm').write_text('\n'.join(f'{x["address"]:x}: {x["op"]:8} {x["args"]}' for x in index['instructions'] if start<=x['address']<end)+'\n')
b=(root/'code-analysis/KING/object2.relocated.bin').read_bytes(); base=0xb0000
rows=[]
for k in range(36):
 vals=struct.unpack_from('<6hBBH',b,0xc8c10+16*k-base)
 rows.append(dict(slot=k,va=hex(0xc8c10+16*k),rectangle=vals[:4],offset=vals[4:6],sprite=vals[6],score=vals[7],visible_ms=vals[8]))
(out/'hunting-tables.json').write_text(json.dumps({'table_va':'0xc8c10','season_table_va':'0xc8c04','season_table':list(b[0xc8c04-base:0xc8c10-base]),'targets':rows},ensure_ascii=False,indent=2)+'\n')
print('Exported 6 hunting routines and 36 target table entries.')
