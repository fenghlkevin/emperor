from pathlib import Path
import json,hashlib,struct
ROOT=Path(__file__).resolve().parents[2]
OUT=Path(__file__).parent
ranges={'KING':{'training':(0x8d120,0x8dcea),'gain':(0x8e48b,0x8e57d),'cost':(0x8dcea,0x8de4a),'gate':(0x8a70e,0x8a75b)},'EMPEROR':{'training':(0x8d260,0x8de02),'gain':(0x8e5a3,0x8e695),'cost':(0x8de02,0x8df62)},'QUICK':{'training':(0x8d28c,0x8de6f),'gain':(0x8e60f,0x8e70f),'cost':(0x8de6f,0x8dfcf)}}
identities=[]
for variant,rr in ranges.items():
 j=json.loads((ROOT/f'rules-analysis/{variant}.index.json').read_text())
 layout=json.loads((ROOT/f'code-analysis/{variant}/layout.json').read_text())
 obj=ROOT/f'code-analysis/{variant}/object1.relocated.bin'
 identities.append({'variant':variant,'original_exe_sha256':layout['sha256'],'relocated_code_sha256':hashlib.sha256(obj.read_bytes()).hexdigest()})
 for name,(start,end) in rr.items():
  (OUT/f'{variant.lower()}_{name}.asm').write_text('\n'.join(f'{x["address"]:x}: {x["op"]:8} {x["args"]}' for x in j['instructions'] if start<=x['address']<end)+'\n')
data=(ROOT/'code-analysis/KING/object2.relocated.bin').read_bytes()
def string(va):return data[va-0xb0000:].split(b'\0',1)[0].decode('big5')
labels=[{'pointer':hex(a),'text':string(struct.unpack_from('<I',data,a-0xb0000)[0])} for a in range(0xc79d4,0xc79fc,4)]
(OUT/'training-evidence.json').write_text(json.dumps({'method':'existing relocated linear disassembly; focused control-flow inspection, no REA decompiler or live DOS observation','artifacts':identities,'labels':labels},ensure_ascii=False,indent=2)+'\n')
print('Exported training evidence for three variants')
