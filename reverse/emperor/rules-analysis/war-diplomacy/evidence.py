#!/usr/bin/env python3
"""Rebuild focused disassembly, fixup-backed table and static call references.
No runtime execution. Run from repository root. All addresses EMPEROR relocated VAs.
"""
import json
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
OUT=Path(__file__).resolve().parent
RANGES={'annual_trade':(0x12edd,0x13103),'trade_years':(0x133e0,0x1349d),'friendship':(0x48eae,0x4902e),'declaration':(0x4ac28,0x4ad10),'trade_negotiation':(0x473d1,0x478d5),'equipment_allocation':(0x84f54,0x85942),'unit_init':(0x849ff,0x84cb4),'unit_attack':(0x85942,0x85bac),'unit_defense':(0x85bac,0x85c3b),'actual_battle':(0x59437,0x59f83),'ai_battle':(0x62905,0x62ef6),'random_gate':(0x8a7fe,0x8a84b),'coalition_event':(0x801ff,0x8040a),'diplomacy_dispatcher':(0x45a4f,0x482f3),'military_power':(0x39bde,0x39d26),'trade_rate_initial':(0x3ad1a,0x3ad4b),'invasion_selection':(0x80700,0x80e62),'prng':(0x9ad6c,0x9ada4),'foreign_gifts':(0x83bea,0x83ee1),'foreign_gift_clock':(0x14ce5,0x14d24),'protection_fee':(0x13059,0x13103),'friendship_yearly':(0x12420,0x124bf)}
def main():
 j=json.loads((ROOT/'rules-analysis/EMPEROR.index.json').read_text())
 for n,(a,b) in RANGES.items():
  (OUT/(n+'.asm')).write_text('\n'.join(f"{x['address']:08x}: {x['op']} {x['args']}" for x in j['instructions'] if a<=x['address']<b)+'\n')
 b=(ROOT/'code-analysis/EMPEROR/object2.relocated.bin').read_bytes()
 table=list(b[0xc80d8-0xb0000:0xc80d8-0xb0000+9])
 report={'variant':'EMPEROR','table_va':'0xc80d8','type_order':'raw 0,1,2 (weapon mapping probable: sword,spear,cavalry)','matchup_matrix':[table[i:i+3] for i in range(0,9,3)],'snippets':{},'field_xrefs':{}}
 for n,(a,z) in RANGES.items():
  report['snippets'][n]={'start':hex(a),'end_exclusive':hex(z),'direct_callers':[{'caller_function_candidate':hex(f['start']),'pc':hex(c['pc'])} for f in j['functions'] for c in f['calls'] if c['target']==a]}
 for name,addr in {'friendship':0xc9a58,'trade_years':0xc9a5a,'quota':0xc9a5c,'income':0xc9a5e,'profit_rate':0xc9a62,'defense_modifier':0xc9ae8}.items():
  report['field_xrefs'][name]=[{'pc':hex(i['address']),'op':i['op'],'args':i['args']} for i in j['instructions'] if hex(addr) in i['args']]
 import struct
 messages=[]
 for msg in list(range(0x3f,0x6b))+list(range(0x228,0x22e)):
  pointer=struct.unpack_from('<I',b,0xc71ec-0xb0000+msg*4)[0]
  raw=b[pointer-0xb0000:].split(b'\0')[0]
  messages.append({'id':hex(msg),'pointer_va':hex(pointer),'text_big5':raw.decode('big5',errors='replace')})
 (OUT/'diplomacy-messages.json').write_text(json.dumps(messages,ensure_ascii=False,indent=2)+'\n')
 (OUT/'evidence.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
 print('Generated',len(RANGES),'snippets; matchup matrix:',report['matchup_matrix'])
if __name__=='__main__':main()
