from pathlib import Path
import re,json,struct
r=Path(__file__).resolve().parents[2];out=Path(__file__).resolve().parent;p=r/'code-analysis/KING';lines=(p/'object1.relocated.asm').read_text().splitlines()
ranges={'event_dispatch':(0x7f649,0x80672),'civil_disorder':(0x81397,0x81795),'famine':(0x81ae2,0x81c79),'disorder_end':(0x14d71,0x14ebb),'health':(0x39743,0x397d1),'health_decrease':(0x39961,0x399c3),'power_aggregate':(0x39bc6,0x39d0e),'low_health_event':(0x8017a,0x80385),'report_messages':(0x352e0,0x35890),'famine_clear':(0x90660,0x906cb)}
for n,(a,b) in ranges.items():
 (out/(n+'.asm')).write_text('\n'.join(l for l in lines if (m:=re.match(r'\s*([0-9a-f]+):',l)) and a<=int(m[1],16)<b)+'\n')
l=json.loads((p/'layout.json').read_text());o=next(x for x in l['objects'] if x['index']==2);d=(p/'object2.relocated.bin').read_bytes();base=o['base']
def text(a):return d[a-base:].split(b'\0')[0].decode('big5',errors='replace')
def table(a,n):
 return [{'index':i,'pointer_address':hex(a+4*i),'string_address':hex(v:=struct.unpack_from('<I',d,a-base+4*i)[0]),'text_big5':text(v)} for i in range(n)]
x={'status':table(0xc4d94,12),'event_messages':table(0xc7a94,12),'ending_messages':table(0xc7604,9),'schedule':[{'event_id':i,'words':list(struct.unpack_from('<5h',d,0xc8230-base+i*10))} for i in range(61)]}
(out/'tables.json').write_text(json.dumps(x,ensure_ascii=False,indent=2))
