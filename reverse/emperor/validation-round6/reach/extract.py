from pathlib import Path
import re,json
ROOT=Path(__file__).resolve().parents[2]
OUT=Path(__file__).resolve().parent
asm=(ROOT/'code-analysis/EMPEROR/object1.relocated.asm').read_text()
ranges={'menu_enable':(0x4b6e8,0x4b8ad),'active_create_cost':(0x4abd7,0x4adc6),'war_state_clear':(0x6680a,0x6689b),'postwar_cost':(0x658ad,0x65900),'timer_update':(0x13648,0x13736),'timer_row7_no_effect':(0x151a7,0x151e9),'rest':(0x8d398,0x8d5bc),'lifespan_subtract':(0x3984f,0x398bb),'calendar':(0x11f7d,0x120df)}
for name,(lo,hi) in ranges.items():
 lines=[]
 for line in asm.splitlines():
  m=re.match(r'\s*([0-9a-f]+):',line)
  if m and lo<=int(m[1],16)<hi: lines.append(line)
 (OUT/(name+'.asm')).write_text('\n'.join(lines)+'\n')
layout=json.loads((ROOT/'code-analysis/EMPEROR/layout.json').read_text());base=layout['objects'][1]['base'];b=(ROOT/'code-analysis/EMPEROR/object2.relocated.bin').read_bytes()
def raw(a,n):return list(b[a-base:a-base+n])
e={'artifact_sha256':layout['sha256'],'object2_base':hex(base),'war_create_stamina':raw(0xc8a64+49,1)[0],'war_create_timer':raw(0xc86b0+49,1)[0],'scene_time_table':raw(0xc3934,28),'ranges':{k:[hex(v[0]),hex(v[1])] for k,v in ranges.items()}}
(OUT/'evidence.json').write_text(json.dumps(e,ensure_ascii=False,indent=2)+'\n')
print(e)
