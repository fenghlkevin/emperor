from pathlib import Path
import struct,json,hashlib,subprocess
ROOT=Path(__file__).resolve().parents[1]; game=ROOT/'extracted/皇帝完美版/games/EMPEROR'; out=Path(__file__).parent
u=lambda b,o:struct.unpack_from('<I',b,o)[0]
manifest=[]
for p in sorted(game.glob('*.EXE')):
 b=p.read_bytes(); h=u(b,60)
 if b[h:h+2]!=b'LE':continue
 d=out/p.stem;d.mkdir(exist_ok=True)
 page_size=u(b,h+0x28); last=u(b,h+0x2c); n_pages=u(b,h+0x14); page_table=h+u(b,h+0x48); data=u(b,h+0x80)
 objs=[]
 for i in range(u(b,h+0x44)):
  size,base,flags,start,count,res=struct.unpack_from('<6I',b,h+u(b,h+0x40)+24*i)
  image=bytearray(); pages=[]
  for j in range(count):
   ent=b[page_table+4*(start+j-1):page_table+4*(start+j)]
   number=int.from_bytes(ent[:3],'big'); typ=ent[3]
   length=last if number==n_pages else page_size
   off=data+(number-1)*page_size
   chunk=b[off:off+length] if typ==0 and number else bytes(page_size)
   pages.append(dict(logical_page=start+j,physical_page=number,flags=typ,file_offset=off if number else None,length=len(chunk)))
   image.extend(chunk.ljust(page_size,b'\0'))
  image=image[:size]; (d/f'object{i+1}.bin').write_bytes(image)
  objs.append(dict(index=i+1,virtual_size=size,base=base,flags=flags,page_index=start,page_count=count,pages=pages))
  # ELF analysis carrier, preserves original object virtual addresses; relocations NOT applied.
  name=b'\0.image\0.shstrtab\0'; payload=bytes(image); shoff=(52+len(payload)+len(name)+3)&~3
  hdr=b'\x7fELF'+bytes([1,1,1])+bytes(9)+struct.pack('<HHIIIIIHHHHHH',2,3,1,base,0,shoff,0,52,0,0,40,3,2)
  elf=hdr+payload+name;elf=elf.ljust(shoff,b'\0')+bytes(40)
  elf+=struct.pack('<10I',1,1,6 if flags&4 else 3,base,52,len(payload),0,0,1,0)
  elf+=struct.pack('<10I',8,3,0,0,52+len(payload),len(name),0,0,1,0)
  carrier=d/f'object{i+1}.elf';carrier.write_bytes(elf)
  if flags&4:
   with (d/f'object{i+1}.asm').open('w') as f:subprocess.run(['/usr/bin/objdump','-D','--x86-asm-syntax=intel',str(carrier)],stdout=f,stderr=subprocess.PIPE,check=True)
 entry=dict(file=p.name,sha256=hashlib.sha256(b).hexdigest(),le_offset=h,page_size=page_size,data_pages_offset=data,entry_object=u(b,h+0x18),entry_offset=u(b,h+0x1c),objects=objs,limitation='Raw object images; LE fixups retained in original EXE but not applied to analysis carrier. Linear disassembly includes embedded data and is not a function/control-flow reconstruction.')
 (d/'layout.json').write_text(json.dumps(entry,indent=2));manifest.append(entry)
(out/'layouts.json').write_text(json.dumps(manifest,indent=2))
print([(x['file'],[(o['base'],o['virtual_size'],o['flags']) for o in x['objects']]) for x in manifest])
