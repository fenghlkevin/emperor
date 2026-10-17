from pathlib import Path
import importlib.util, tempfile,struct,json
ROOT=Path(__file__).resolve().parents[1];spec=importlib.util.spec_from_file_location('saves',ROOT/'save-analysis/parse_saves.py');m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
base=ROOT/'extracted/皇帝完美版/games/EMPEROR/KING1.SAV';parsed=m.parse(base);raw=base.read_bytes();tail=parsed['tail_offset'];battle=bytearray(1793)
for start in [88,961]:
 for slot in range(45):battle[start+slot*18+1]=255
# Slots are exact raw blocks written/read as 45*18, not synthesized save offsets from game heap.
battle[88+18+1]=0;struct.pack_into('<h',battle,88+18+4,100);struct.pack_into('<h',battle,88+18+13,610)
battle[961+2*18+1]=1;struct.pack_into('<h',battle,961+2*18+4,200);struct.pack_into('<h',battle,961+2*18+15,100)
synthetic=raw[:tail]+b'\x01'+battle+raw[tail+1:]
with tempfile.TemporaryDirectory(prefix='emperor-schema-') as temp:
 p=Path(temp)/'synthetic.SAV';p.write_bytes(synthetic);s=m.parse(p)
 assert bytes.fromhex(s['raw_hex'])==synthetic
 assert s['other_count']==1 and len(s['battle_records'])==1
 a=s['battle_records'][0]['units_a'];b=s['battle_records'][0]['units_b']
 assert len(a)==len(b)==45
 assert (a[1]['type'],a[1]['soldiers'],a[1]['attack'])==(0,100,610)
 assert (b[2]['type'],b[2]['soldiers'],b[2]['defense'])==(1,200,100)
 assert b[44]['file_offset']==tail+1+961+44*18
 assert s['redundant_portrait_tail']['status']=='matches'
 result=dict(method='synthetic save insertion using observed serialized offsets; not a live game save or runtime roundtrip',battle_records=1,side_a_units=45,side_b_units=45,tail_copy_status=s['redundant_portrait_tail']['status'],fixture_size=len(synthetic),checks='raw reversible, unit offsets, sign widths, tail position after dynamic battle record')
(ROOT/'rules-analysis/parsing-verification.json').write_text(json.dumps(result,indent=2));print('synthetic battle parsing passed')
