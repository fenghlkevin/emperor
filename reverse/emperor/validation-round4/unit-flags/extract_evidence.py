"""Bounded static evidence extraction; does not execute or patch game binaries."""
from pathlib import Path
import json,struct,zlib,hashlib
ROOT=Path(__file__).resolve().parent;E=ROOT.parents[1];J=json.loads((E/'rules-analysis/EMPEROR.index.json').read_text());ins=J['instructions']
ranges={'initializer':(0x84210,0x8437e),'unit_creation':(0x849ff,0x84cb4),'manual_unit_creation':(0x49da4,0x49f58),'auto_battle_creation':(0x80bf6,0x80e5a),'battle_load':(0x935b6,0x93a28),'command_menu':(0x5a471,0x5a6b6),'command_dispatch':(0x5f34a,0x5f53c),'ai_score':(0x62905,0x62ef6),'actual_flag':(0x59658,0x59714),'turn_action_clear':(0x5d4a0,0x5d510),'action_mark':(0x58fe6,0x590d4),'ai_command':(0x64883,0x64aca),'turn_completion':(0x65b57,0x65cca),'timer_dispatch':(0x6457a,0x64883)}
for n,(a,b) in ranges.items():(ROOT/(n+'.asm')).write_text('\n'.join(f'{x["address"]:x}: {x["op"]} {x["args"]}' for x in ins if a<=x['address']<b)+'\n')
reads=[]
for x in ins:
 if 0x56000<=x['address']<0x69000 and any(s in x['args'] for s in ['+ 0x76]','+ 0x3df]']):reads.append(x)
orig=[]
for p in sorted((E/'save-analysis/decoded').glob('KING[123].json')):
 j=json.loads(p.read_text());orig.append({'file':p.name,'battle_count':len(j['battle_records']),'unit_flag_sample_count':sum(len(x['units_a'])+len(x['units_b']) for x in j['battle_records'])})
b=(E/'code-analysis/EMPEROR/object2.relocated.bin').read_bytes();terms={}
for t in ['計謀','計策','火攻','埋伏','遠攻','弓兵']:
 x=t.encode('big5');a=[];at=0
 while (at:=b.find(x,at))>=0:a.append(hex(at+0xb0000));at+=len(x)
 terms[t]=a
(ROOT/'evidence.json').write_text(json.dumps({'variant':'EMPEROR','address_convention':'relocated static VA','special_direct_reads_in_56000_69000':reads,'original_save_flag_samples':orig,'bounded_big5_strings_search_in_object2':terms,'ranges':{k:[hex(x) for x in v] for k,v in ranges.items()}},ensure_ascii=False,indent=2))
def png(path,w,h,rgb):
 def c(k,d):return struct.pack('>I',len(d))+k+d+struct.pack('>I',zlib.crc32(k+d)&0xffffffff)
 raw=b''.join(b'\0'+rgb[y*w*3:(y+1)*w*3] for y in range(h));path.write_bytes(b'\x89PNG\r\n\x1a\n'+c(b'IHDR',struct.pack('>IIBBBBB',w,h,8,2,0,0,0))+c(b'IDAT',zlib.compress(raw))+c(b'IEND',b''))
# WINDOW92 is the command popup bound by5A54A. Diagnostic EGA palette; labels are unaffected.
x=(E/'resource-analysis/exports/WINDOW/092.bin').read_bytes();w,h=struct.unpack('<HH',x[:4]);raw=x[4:];stride=(w+7)//8
pal=[(0,0,0),(0,0,170),(0,170,0),(0,170,170),(170,0,0),(170,0,170),(170,85,0),(170,170,170),(85,85,85),(85,85,255),(85,255,85),(85,255,255),(255,85,85),(255,85,255),(255,255,85),(255,255,255)]
rgb=bytearray()
for y in range(h):
 for xx in range(w):rgb.extend(pal[sum(((raw[p*h*stride+y*stride+xx//8]>>(7-xx%8))&1)<<p for p in range(4))])
png(ROOT/'WINDOW-092.png',w,h,rgb)
print(json.dumps({'direct_special_reads':len(reads),'original_saves':orig,'command_bitmap_sha256':hashlib.sha256(x).hexdigest()},ensure_ascii=False))
