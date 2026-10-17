from pathlib import Path
import json,struct,importlib.util
import probe as p
ROOT=p.ROOT;OUT=ROOT/'checks';OUT.mkdir(exist_ok=True);E=p.u32(p.data(0xc98ac));C=p.u32(p.data(0xc9920));R0=p.data(0xc99ac)
def integer(b,o,w=2,s=True):return int.from_bytes(b[o:o+w],'little',signed=s)
def snap(name):
 e=p.read(E,0x300);rs=p.read(R0,31*337);date=list(p.read(p.data(0xc98dc),4));(OUT/f'{name}-E.bin').write_bytes(e);(OUT/f'{name}-regions.bin').write_bytes(rs)
 return {'date':date,'treasury':integer(e,0x45,4),'age':e[14],'health':integer(e,0x23),'stamina':integer(e,0x19),'ledger':{hex(o):integer(e,o,4) for o in range(0x49,0x75,4)},'region_training':[integer(rs,i*337+0x88) for i in range(31)]}
def load():p.call(0x91c87,[C,0]);p.write(p.data(0xc9030),struct.pack('<I',12345))
def save(dest):
 p.call(0x91d91,[C,3]);b=(ROOT/'game/KING4.SAV').read_bytes();(OUT/dest).write_bytes(b);return len(b)
def expected_fees():
 e=p.read(E,0x300);rs=p.read(R0,31*337);tmpl=p.read(p.data(0xc505c+0x9c),23*22) # table moved by +0x9c in EMPEROR data, confirm below against first pointer text
 # Retrieve true loaded table from instruction-referenced static VA; EMPR table starts c50f8.
 maintenance=[integer(tmpl,i*22+12,4) for i in range(23)];P=N=M=0
 offsets=[0x64,0x68,0x60,0x62,0x6a,0x66,0x6c]
 for i in range(30):
  r=rs[i*337:(i+1)*337]
  if not integer(r,2):continue
  P+=integer(r,0x24,4);N+=integer(r,0x22)
  M+=sum(integer(r,o)*maintenance[k] for k,o in enumerate(offsets))
 M+=sum(maintenance[i+7] for i in range(16) if integer(e,0x298+i*2)==1)
 node=p.u32(p.data(0xc992c));wage=noble=0;salaries=list(struct.unpack('<7h',p.read(p.data(0xc8b7e),14))) # KING c8ae2 +9c
 while node:
  n=p.read(node,12);person=p.read(integer(n,0,4,False),37);wage+=20 if person[1]==77 else 40;noble+=salaries[person[20]];node=integer(n,8,4,False)
 central=integer(p.read(p.data(0xcc14c),2),0)
 return {'0x6d':M,'0x51':P//2,'0x55':wage,'0x61':noble,'0x5d':integer(e,0x96,4)*4,'0x59':(N+central)*4}
if __name__=='__main__':
 results={}
 load();before=snap('fees-before');expected=expected_fees();p.call(0x13121,[C]);after=snap('fees-after');observed={k:after['ledger'][k]-before['ledger'][k] for k in expected};assert expected==observed,(expected,observed);assert after['treasury']==before['treasury']-sum(expected.values());save('fees-after.SAV');results['monthly_fees']={'before':before,'after':after,'expected':expected,'observed':observed,'status':'passed'}
 load();p.write(C,struct.pack('<H',1));p.write(p.data(0xc98dc),bytes([0,2,1,2]));before=snap('month-before');regs=p.call(0x11f7d,[C]);after=snap('month-after');assert after['date']==[0,3,0,0],after;save('month-after.SAV');results['month_boundary']={'before':before,'after':after,'return':regs,'status':'date passed; subsidiary deltas captured'}
 (ROOT/'live-checks.json').write_text(json.dumps({'method':'actual EMPEROR original functions executed in DOSBox-X 32-bit DOS4GW; controlled call stack and memory inputs injected; no subsystem stubs', 'code_object_runtime_base':p.CODE,'data_object_runtime_base':p.DATA,'emperor_pointer':E,'controller_pointer':C,'cases':results},indent=2));p.dump_log('live-checks-protocol.json');print(json.dumps(results,indent=2))
