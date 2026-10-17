from pathlib import Path
import struct,re,json,hashlib
out=Path(__file__).parent
ps=[next(Path('reverse/emperor/extracted').rglob('KingEdit.exe')),next(Path('/Users/fengheliang/Downloads/115').rglob('皇帝内存修改器V1.2.exe'))]
for p in ps:
 d=p.read_bytes();pe=struct.unpack_from('<I',d,60)[0];oh=pe+24;base=struct.unpack_from('<I',d,oh+28)[0];ns=struct.unpack_from('<H',d,pe+6)[0];sz=struct.unpack_from('<H',d,pe+20)[0];secs=[]
 for i in range(ns):
  o=oh+sz+40*i;n,vs,va,rs,fo=struct.unpack_from('<8sIIII',d,o);secs.append((n.rstrip(b'\0').decode(),vs,va,rs,fo))
 def off(rva):
  for n,vs,va,rs,fo in secs:
   if va<=rva<va+rs:return fo+rva-va
  return rva
 def z(o):return d[o:d.index(b'\0',o)].decode('ascii',errors='replace')
 imports={};irva=struct.unpack_from('<I',d,oh+104)[0];io=off(irva)
 while any(d[io:io+20]):
  oft,_,_,name,ft=struct.unpack_from('<5I',d,io);dll=z(off(name));it=off(oft or ft);i=0
  while (v:=struct.unpack_from('<I',d,it+4*i)[0]):
   imports[hex(base+ft+4*i)]=dll+'!'+('ordinal_'+str(v&65535) if v>>31 else z(off(v)+2));i+=1
  io+=20
 rows=[]
 for sec,vs,va,rs,fo in secs:
  if sec not in ['.text','.data','.rdata']:continue
  for m in re.finditer(rb'[^\x00]{4,}\x00',d[fo:fo+rs]):
   try:s=m[0][:-1].decode('gb18030')
   except:continue
   if all(c.isprintable() for c in s) and (any('\u4e00'<=c<='\u9fff' for c in s) or re.search('vb|Get|Put|Seek|Read|Write|Cheat|King|SAV',s)):
    if len(s)<300:rows.append({'offset':hex(fo+m.start()),'va':hex(base+va+m.start()),'text':s})
 (out/(p.stem+'.metadata.json')).write_text(json.dumps({'path':str(p),'sha256':hashlib.sha256(d).hexdigest(),'sections':secs,'imports':imports,'strings':rows},ensure_ascii=False,indent=2))
 if p.name=='KingEdit.exe':
  dis=(out/'KingEdit.disasm.txt').read_text()
  for a,n in imports.items():dis=dis.replace(a+' ',a+' <'+n+'> ')
  (out/'KingEdit.annotated.txt').write_text(dis)
 # Preserve complete resource leaves, accepting malformed icon contents as opaque bytes.
 rrva=struct.unpack_from('<I',d,oh+112)[0];ro=off(rrva);resources=[];rd=out/(p.stem+'.resources');rd.mkdir(exist_ok=True)
 def name(v):
  if v&0x80000000:
   q=ro+(v&0x7fffffff);n=struct.unpack_from('<H',d,q)[0];return d[q+2:q+2+2*n].decode('utf-16le')
  return v
 def walk(q,path):
  n1,n2=struct.unpack_from('<HH',d,q+12)
  for j in range(n1+n2):
   k,v=struct.unpack_from('<II',d,q+16+8*j);np=path+[name(k)]
   if v&0x80000000:walk(ro+(v&0x7fffffff),np)
   else:
    rva,sz,cp,_=struct.unpack_from('<4I',d,ro+v);f=off(rva);fn='_'.join(str(x) for x in np)+'.bin';(rd/fn).write_bytes(d[f:f+sz]);resources.append({'ids':np,'rva':hex(rva),'offset':hex(f),'bytes':sz,'file':str(rd/fn)})
 if rrva:walk(ro,[])
 (out/(p.stem+'.resources.json')).write_text(json.dumps(resources,ensure_ascii=False,indent=2))
