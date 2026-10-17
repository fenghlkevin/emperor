from common import *
def setup():
 l.load();W=alloc(0x200);B=alloc(0x800);H=alloc(0x4e);p.write(H,bytes(0x4e));p.call(0x962c8,[H]);put(p.data(0xcc5f4),H,4)
 w=bytearray(0x200);struct.pack_into('<I',w,0x5d,B);b=bytearray(0x800)
 for base in [0x65,0x3ce]:
  for i in range(45):b[base+i*18+1:base+i*18+3]=b'\xff\xff'
 nodes=[];node=get(p.data(0xc992c),4,False)
 for i in range(2):
  raw=p.read(node,12);person=struct.unpack_from('<I',raw)[0];nodes.append({'node':node,'person':person,'id':p.read(person,1)[0]});node=struct.unpack_from('<I',raw,8)[0]
 # Saved officials have unassigned battle associations (FF), so establish distinct controlled associations.
 for i,entry in enumerate(nodes):
  entry['original_association']=entry['id'];entry['id']=240+i;put(entry['person'],entry['id'],1)
 struct.pack_into('<h',b,0x6fc,nodes[0]['id']);struct.pack_into('<h',b,0x6fe,nodes[1]['id']);put(l.E+0xe,20,1)
 return W,B,H,w,b,nodes
results=[]
for case in ['annex','lose-last','lose-not-last']:
 W,B,H,w,b,nodes=setup();target=10;local=0;rt=l.R0+target*337;rl=l.R0+local*337
 b[0x5d]=target;b[0x390]=local
 if case=='annex':
  w[0x80]=2;w[0x81]=0;put(rt+2,0);put(l.E+0x2e,10,1);put(rt+0x8c,10000,4);p.write(rt+0x13e,bytes([40,20,10,10]));put(rt+0x142,5,1)
 else:
  w[0x80]=1;w[0x81]=0;b[0x12]=1;put(rl+2,1);put(l.E+0x2e,1 if case=='lose-last' else 2,1)
 p.write(W,w);p.write(B,b)
 before={'fixture_officials':nodes,'owned_count':get(l.E+0x2e,1,False),'target_owned':get(rt+2),'local_owned':get(rl+2)};(OUT/f'{case}-before-regions.bin').write_bytes(p.read(l.R0,31*337));p.call(0x6668f,[W],timeout=20)
 after={'owned_count':get(l.E+0x2e,1,False),'target_owned':get(rt+2),'local_owned':get(rl+2),'last_flag':get(W+0x11a,1,False),'history_winner':get(H+6),'target_population':get(rt+0x8c,4),'target_occupations':list(struct.unpack('<4i',p.read(rt+6,16))),'target_soldiers':get(rt+0x22)}
 expected={'owned_count':11,'target_owned':1,'target_occupations':[4000,2000,1000,1000],'target_soldiers':500} if case=='annex' else {'owned_count':0 if case=='lose-last' else 1,'local_owned':0,'last_flag':int(case=='lose-last')}
 passed=all(after[k]==v for k,v in expected.items());results.append({'case':case,'before':before,'after':after,'expected':expected,'passed':passed});(OUT/f'{case}-after-regions.bin').write_bytes(p.read(l.R0,31*337));(OUT/f'{case}-after-E.bin').write_bytes(p.read(l.E,0x300));l.save(f'round4-{case}.SAV')
 if case=='lose-last':
  frame=p.STACK-0x100;put(frame+0x14,W,4);block(0x657e1,0x6591f,frame);last={'stamina':get(l.E+0x19),'flag_f':get(l.E+0xf,1,False),'flag_10':get(l.E+0x10,1,False)};results[-1]['end_branch']=last;results[-1]['end_branch_passed']=last=={'stamina':0,'flag_f':128,'flag_10':0}
 finish('territory-live',results)
assert all(x['passed'] for x in results)
