from pathlib import Path
import json
ROOT=Path(__file__).resolve().parent;E=ROOT.parents[1]
s=json.loads((E/'rules-analysis/EMPEROR.index.json').read_text())['instructions']
ranges={'manual_creation_complete':(0x49d85,0x4adc6),'invasion_creation_complete':(0x80bf6,0x80e62),'battle_constructors_and_reinforcement':(0x84210,0x84cb4),'chiefs_and_regular_forces':(0x84cb4,0x85942),'attack_defense_recompute':(0x85942,0x85c3b),'allocation_wrapper':(0x9ac78,0x9acc7),'malloc':(0x9b4f5,0x9b5f5),'load_arrays':(0x935b6,0x93a28)}
for n,(a,b) in ranges.items():(ROOT/(n+'.asm')).write_text('\n'.join(f'{x["address"]:x}: {x["op"]} {x["args"]}' for x in s if a<=x['address']<b)+'\n')
reads=[x for x in s if 0x56000<=x['address']<0x85c3b and any(z in x['args'] for z in ['+ 0x76]','+ 0x3df]'])]
(ROOT/'evidence.json').write_text(json.dumps({'variant':'EMPEROR','static_va':True,'ranges':{n:[hex(a),hex(b)]for n,(a,b) in ranges.items()},'literal_76_3df_references':reads,'unit_flag_offsets':{'A':'B + 0x76 + slot * 18','B':'B + 0x3df + slot * 18'},'watchpoint_checkpoints':{'manual_after_allocation':'0x49db1','manual_before_finalize':'0x4ad2a','manual_after_finalize':'0x4ad2f','manual_complete':'0x4adc6','invasion_after_allocation':'0x80c10','invasion_before_finalize':'0x80db3','invasion_after_finalize':'0x80db8','invasion_complete':'0x80e5a'}},ensure_ascii=False,indent=2))
