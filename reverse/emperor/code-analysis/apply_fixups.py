from pathlib import Path
import struct,json,subprocess
root=Path(__file__).parent
for directory in [root/'KING',root/'EMPEROR',root/'QUICK']:
 layout=json.loads((directory/'layout.json').read_text());b=(root.parent/'extracted/皇帝完美版/games/EMPEROR'/layout['file']).read_bytes();h=layout['le_offset'];u=lambda o:struct.unpack_from('<I',b,o)[0]
 table=h+u(h+0x68);records=h+u(h+0x6c);objects=layout['objects']; images=[bytearray((directory/f'object{o["index"]}.bin').read_bytes()) for o in objects];result=[];errors=[]
 for obj in objects:
  for pg in obj['pages']:
   idx=pg['logical_page']-1;p=records+u(table+idx*4);end=records+u(table+(idx+1)*4)
   while p<end:
    begin=p;stype,flags=b[p:p+2];p+=2
    if flags&3 or stype&0x20 or flags&0xc0:
     errors.append(dict(page=idx+1,record=begin,reason='unsupported record',stype=stype,flags=flags));break
    source=struct.unpack_from('<h',b,p)[0];p+=2
    width=2 if flags&0x40 else 1;target=int.from_bytes(b[p:p+width],'little');p+=width
    typ=stype&15
    if typ==2:offset=0
    else:
     width=4 if flags&0x10 else 2;offset=int.from_bytes(b[p:p+width],'little');p+=width
    if flags&4:
     width=4 if flags&0x20 else 2;offset+=int.from_bytes(b[p:p+width],'little');p+=width
    if not 1<=target<=len(objects):errors.append(dict(record=begin,reason='bad target'));break
    at=(idx+1-obj['page_index'])*layout['page_size']+source;value=objects[target-1]['base']+offset
    entry=dict(source_object=obj['index'],source_offset=at,source_va=obj['base']+at,target_object=target,target_offset=offset,target_va=value,source_type=typ,record_file_offset=begin)
    result.append(entry)
    if typ in [7,8] and 0<=at<=len(images[obj['index']-1])-4:
     if typ==8:value-=obj['base']+at+4
     struct.pack_into('<I',images[obj['index']-1],at,value&0xffffffff)
    elif typ not in [7,8]:errors.append(dict(record=begin,reason='record parsed but selector/other type not materialized',type=typ))
 for o,img in zip(objects,images):
  (directory/f'object{o["index"]}.relocated.bin').write_bytes(img)
  carrier=bytearray((directory/f'object{o["index"]}.elf').read_bytes());carrier[52:52+len(img)]=img
  path=directory/f'object{o["index"]}.relocated.elf';path.write_bytes(carrier)
  if o['flags']&4:
   with (directory/f'object{o["index"]}.relocated.asm').open('w') as f:subprocess.run(['/usr/bin/objdump','-D','--x86-asm-syntax=intel',str(path)],stdout=f,check=True)
 (directory/'fixups.json').write_text(json.dumps(dict(records=result,limitations=errors),indent=2));print(directory.name,len(result),'issues',len(errors))
