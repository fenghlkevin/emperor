from pathlib import Path
import re,json,struct
root=Path(__file__).resolve().parents[2];out=Path(__file__).parent
ranges={'halfyear':(0x123e6,0x13109),'regional_tick':(0x13825,0x14f20),'regional_helpers':(0x3afc7,0x3bd2c),'build_timer':(0x13630,0x1371e),'disaster_loss':(0x15647,0x15857)}
lines=(root/'code-analysis/KING/object1.relocated.asm').read_text().splitlines()
for n,(a,b) in ranges.items():
 (out/(n+'.asm')).write_text('\n'.join(l for l in lines if (m:=re.match(r'\s*([0-9a-f]+):',l)) and a<=int(m[1],16)<b)+'\n')
layout=json.loads((root/'code-analysis/KING/layout.json').read_text());obj=next(o for o in layout['objects'] if o['index']==2);data=(root/'code-analysis/KING/object2.relocated.bin').read_bytes();base=obj['base']
tables={}
for name,a,n,w,signed in [('wealth_up',0xc7cd8,5,2,True),('wealth_down',0xc7ce2,5,2,True),('disaster_progress',0xc8b28,8,1,False),('population_move_percent',0xc8b24,1,1,False)]:
 tables[name]={'address':hex(a),'width':w,'raw_hex':data[a-base:a-base+n*w].hex(),'values':[int.from_bytes(data[a-base+i*w:a-base+(i+1)*w],'little',signed=signed) for i in range(n)]}
(out/'constants.json').write_text(json.dumps(tables,ensure_ascii=False,indent=2))
