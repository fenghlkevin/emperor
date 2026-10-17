#!/usr/bin/env python3
"""Offline resource inventory and lossless payload exports. No game execution."""
from pathlib import Path
import struct, hashlib, json, csv, zlib, collections
ROOT=Path(__file__).resolve().parent
SRC=ROOT.parent/'extracted/皇帝完美版/games/EMPEROR'
OUT=ROOT/'exports'; OUT.mkdir(exist_ok=True)
def png(path,w,h,rgb):
 def chunk(k,d): return struct.pack('>I',len(d))+k+d+struct.pack('>I',zlib.crc32(k+d)&0xffffffff)
 raw=b''.join(b'\0'+rgb[y*w*3:(y+1)*w*3] for y in range(h))
 path.write_bytes(b'\x89PNG\r\n\x1a\n'+chunk(b'IHDR',struct.pack('>IIBBBBB',w,h,8,2,0,0,0))+chunk(b'IDAT',zlib.compress(raw))+chunk(b'IEND',b''))
def planar(raw,w,h,palette,whole_plane=False):
 stride=(w+7)//8; rgb=bytearray(w*h*3)
 for y in range(h):
  for x in range(w):
   c=sum(((raw[(p*h*stride+y*stride+x//8) if whole_plane else (y*stride*4+p*stride+x//8)]>>(7-x%8))&1)<<p for p in range(4))
   rgb[(y*w+x)*3:(y*w+x)*3+3]=bytes(palette[c])
 return bytes(rgb)
ega=[(0,0,0),(0,0,170),(0,170,0),(0,170,170),(170,0,0),(170,0,170),(170,85,0),(170,170,170),(85,85,85),(85,85,255),(85,255,85),(85,255,255),(255,85,85),(255,85,255),(255,255,85),(255,255,255)]
manifest=[]; pics=[]; flcs=[]; errors=[]
for f in sorted(SRC.iterdir()):
 if not f.is_file():continue
 b=f.read_bytes();manifest.append({'file':f.name,'size':len(b),'sha256':hashlib.sha256(b).hexdigest(),'prefix_hex':b[:32].hex()})
 if f.suffix.upper()=='.PIC':
  n=b[0]; entries=[]; valid=n>0 and 1+n*8<=len(b)
  if valid:
   for i in range(n):
    o,s=struct.unpack_from('<II',b,1+i*8)
    if o<1+n*8 or s<4 or o+s>len(b):valid=False;break
    w,h=struct.unpack_from('<HH',b,o);entries.append({'index':i,'offset':o,'length':s,'width':w,'height':h,'nominal_4bpp_bytes':4*((w+7)//8)*h,'extra_bytes':s-4-4*((w+7)//8)*h})
  if valid:
   dest=OUT/f.stem;dest.mkdir(exist_ok=True)
   for e in entries:(dest/('%03d.bin'%e['index'])).write_bytes(b[e['offset']:e['offset']+e['length']])
   pics.append({'file':f.name,'format':'u8 count + offset,length directory','entries':entries,'table_end':1+8*n,'last_entry_end':max(e['offset']+e['length'] for e in entries)})
   if f.name in ['NUMBER.PIC','BACKGND.PIC','AREA.PIC','PEOPLE01.PIC']:
    for e in entries[:1]:
     o=e['offset'];w=e['width'];h=e['height'];raw=b[o+4:o+e['length']]
     if e['extra_bytes']==0:png(dest/'sample_000_ega.png',w,h,planar(raw,w,h,ega,True))
  else:
   raw=bytearray();pos=128;truncated=False
   while pos<len(b):
    c=b[pos];pos+=1
    if c>=192:
     if pos==len(b):truncated=True;break
     raw.extend(bytes([b[pos]])*(c&63));pos+=1
    else:raw.append(c)
   # Legacy PIC full-screen resources retain PCX bounds/palette but many headers are altered.
   xmax,ymax=struct.unpack_from('<HH',b,8);w=xmax+1;h=ymax+1
   expected=((w+7)//8)*h*4
   ok=len(raw)==expected and not truncated
   pics.append({'file':f.name,'format':'PCX-like RLE planar 4bpp','width':w,'height':h,'rle_offset':128,'decoded_length':len(raw),'expected_length':expected,'decode_exact':ok,'header_hex':b[:128].hex()})
   if ok:
    dest=OUT/f.stem;dest.mkdir(exist_ok=True);(dest/'decoded_planar.bin').write_bytes(raw);(dest/'palette_rgb.bin').write_bytes(b[16:64])
    if f.name in ['TITLE.PIC','LADY011.PIC','ENDING04.PIC']:
     palette=[tuple(b[16+3*i:19+3*i]) for i in range(16)];png(dest/'sample.png',w,h,planar(raw,w,h,palette))
 if f.suffix.upper()=='.FLC':
  size,magic,frames,w,h,depth,flags,speed=struct.unpack_from('<I6HI',b)
  rec={'file':f.name,'declared_size':size,'actual_size':len(b),'magic':hex(magic),'frames':frames,'width':w,'height':h,'depth':depth,'flags':flags,'speed_ms':speed,'frame_records':[]};pos=128
  while pos+16<=len(b):
   fs,fm,nc=struct.unpack_from('<IHH',b,pos)
   if fs<16 or pos+fs>len(b):break
   cp=pos+16;cs=[]
   for _ in range(nc if fm==0xf1fa else 0):
    if cp+6>pos+fs:break
    sz,ct=struct.unpack_from('<IH',b,cp)
    if sz<6 or cp+sz>pos+fs:break
    cs.append({'offset':cp,'size':sz,'type':ct});cp+=sz
   rec['frame_records'].append({'offset':pos,'size':fs,'magic':hex(fm),'chunks':cs});pos+=fs
  rec['parsed_end']=pos;flcs.append(rec)
(ROOT/'manifest.json').write_text(json.dumps(manifest,indent=2,ensure_ascii=False))
(ROOT/'pic_structure.json').write_text(json.dumps(pics,indent=2,ensure_ascii=False))
(ROOT/'flc_structure.json').write_text(json.dumps(flcs,indent=2,ensure_ascii=False))
# SOUND.BIN uses uint16 count followed by uint32 offset,length pairs.
b=(SRC/'SOUND.BIN').read_bytes();n=struct.unpack_from('<H',b)[0];sounds=[];dest=OUT/'SOUND';dest.mkdir(exist_ok=True)
for i in range(n):
 o,s=struct.unpack_from('<II',b,2+8*i);assert o+s<=len(b)
 raw=b[o:o+s];(dest/('%02d.bin'%i)).write_bytes(raw)
 sounds.append({'index':i,'offset':o,'length':s,'sha256':hashlib.sha256(raw).hexdigest(),'min_byte':min(raw),'max_byte':max(raw),'mean_byte':sum(raw)/len(raw)})
(ROOT/'sound_structure.json').write_text(json.dumps({'count':n,'table_end':2+8*n,'entries':sounds},indent=2))
# Preserve raw font index and export every 30-byte fixed-length glyph without claiming codepoint mapping.
b=(SRC/'CHINESE.FNT').read_bytes();assert len(b)%30==0
(OUT/'CHINESE.FNT.raw').write_bytes(b);(OUT/'CHINESE.IDX.raw').write_bytes((SRC/'CHINESE.IDX').read_bytes())
vals=struct.unpack('<15105H',(SRC/'CHINESE.IDX').read_bytes())
with (ROOT/'font_index.csv').open('w') as f:
 writer=csv.writer(f);writer.writerow(['word_index','file_offset','value']);writer.writerows((i,2*i,v) for i,v in enumerate(vals))
# Diagnostic fixed-size 16x15 one-bit contact sheet, no asserted codepoint mapping.
w=16*32;h=15*90;rgb=bytearray([255])*(w*h*3)
for g in range(len(b)//30):
 ox=(g%32)*16;oy=(g//32)*15
 for y in range(15):
  for x in range(16):
   c=0 if (b[g*30+y*2+x//8]>>(7-x%8))&1 else 255
   q=((oy+y)*w+ox+x)*3;rgb[q:q+3]=bytes([c]*3)
png(OUT/'font_diagnostic_16x15.png',w,h,bytes(rgb))
print(json.dumps({'files':len(manifest),'pic_files':len(pics),'directory_pic':sum(x['format'].startswith('u8') for x in pics),'rle_pic_exact':sum(x.get('decode_exact',False) for x in pics),'rle_pic_failed':[x['file'] for x in pics if x.get('decode_exact')==False],'flc_files':len(flcs),'sound_entries':n,'font_30byte_records':len(b)//30},ensure_ascii=False))
