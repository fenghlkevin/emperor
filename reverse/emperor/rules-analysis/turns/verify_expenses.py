from pathlib import Path
import json,struct,csv
from verify_calendar import CPU,SIGN
ROOT=Path(__file__).resolve().parents[1];DATA=(ROOT.parent/'code-analysis/KING/object2.relocated.bin').read_bytes();E=0x100000
rows=[]
for i in range(23):
 at=0xc505c-0xb0000+22*i;ptr,total,work,maintenance,a,b,c=struct.unpack_from('<4I3H',DATA,at);off=ptr-0xb0000;name=DATA[off:DATA.find(b'\0',off)].decode('big5')
 rows.append(dict(kind=i,name=name,table_va=hex(0xc505c+22*i),dword_4=total,dword_8=work,monthly_maintenance=maintenance,u16_16=a,u16_18=b,u16_20=c,raw_hex=DATA[at:at+22].hex()))
(ROOT/'turns/building-templates.json').write_text(json.dumps(rows,ensure_ascii=False,indent=2))
with (ROOT/'turns/building-templates.csv').open('w',newline='',encoding='utf-8-sig') as f:w=csv.DictWriter(f,fieldnames=rows[0]);w.writeheader();w.writerows(rows)
# Fixture exercises owned/non-owned regions, active/free officials, noble salary, special building equality, integer truncation.
c=CPU();c.r['esp']=0x900000;c.push(E);c.push(0);c.put(0xc9810,E,4);c.put(E+0x45,100000,4);c.put(E+0x96,11,4);c.put(0xcc0ac,13,2)
for at in range(0xc5068,0xc5263):c.put(at,DATA[at-0xb0000])
for at in range(0xc8ae2,0xc8af0):c.put(at,DATA[at-0xb0000])
# Controlled region0 1501 professions-population, 126 troops, building levels 2/2/1/1/2/1/0
c.put(0xc990e,1,2);c.put(0xc9930,1501,4);c.put(0xc992e,126,2)
levels=[1,2,2,2,1,1,0];offsets=[0x62,0x66,0x5e,0x60,0x68,0x64,0x6a]
for offset,level in zip(offsets,levels):c.put(0xc990e+offset,level,2)
c.put(0xc990e+337,0,2);c.put(0xc9930+337,99999,4);c.put(0xc992e+337,9999,2)
c.put(E+0x298,1,2);c.put(E+0x29a,2,2) # only ==1 is charged in this specific branch
# two official linked nodes
node=0x300000;c.put(0xc988c,node,4)
for i,(office,noble) in enumerate([(1,0),(0x4d,5)]):
 n=node+0x100*i;person=0x400000+0x100*i;c.put(n,person,4);c.put(n+8,n+0x100 if i==0 else 0,4);c.put(person+1,office);c.put(person+0x14,noble)
c.execute(0x13109)
maint=sum(rows[i]['monthly_maintenance']*levels[i] for i in range(7))+rows[7]['monthly_maintenance'];subsidy=1501//2;official=40+20;noble=600+10;workers=11*4;soldiers=(126+13)*4
expected={0x6d:maint,0x51:subsidy,0x55:official,0x61:noble,0x5d:workers,0x59:soldiers};observed={hex(off):SIGN(c.get(E+off,4),4) for off in expected}
assert all(observed[hex(off)]==v for off,v in expected.items()),(expected,observed)
assert c.get(E+0x45,4)==100000-sum(expected.values())
result=dict(method='bounded interpretation of KING 0x13109, synthetic memory fixture; original binary is not executed',building_templates=rows,noble_salaries=list(struct.unpack_from('<7H',DATA,0xc8ae2-0xb0000)),expected={hex(k):v for k,v in expected.items()},observed=observed,treasury=c.get(E+0x45,4),steps=c.steps)
(ROOT/'turns/expense-verification.json').write_text(json.dumps(result,ensure_ascii=False,indent=2));print('expense assembly verification passed',observed,'treasury',result['treasury'])
