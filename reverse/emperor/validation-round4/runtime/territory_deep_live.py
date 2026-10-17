from common import *
s=Path(__file__).with_name('territory_live.py').read_text();exec(s.split('results=[]')[0])
W,B,H,w,b,nodes=setup();w[0x80]=1;w[0x81]=2;b[0x12]=1;b[0x5d]=10;b[0x390]=0;put(l.R0+2,1);put(l.E+0x2e,2,1);put(l.R0+0x8c,10000,4);put(l.R0+0x142,10,1);put(l.R0+0xac,-5);put(l.E+0x96,1000,4)
clear=[0xd7,*range(0xd9,0xdf),0x11b,0x124,0x128]
for off in clear:put(l.R0+off,7,1)
put(l.R0+0x134,7);p.write(l.R0+0x129,struct.pack('<f',0.25));q=bytearray(300)
for i in range(20):q[i*15]=255
for i,(reg,cost) in enumerate([(0,123),(1,77)]):q[i*15]=reg;struct.pack_into('<iii',q,i*15+3,cost,500,0)
p.write(p.data(0xcca9c),q);p.write(W,w);p.write(B,b)
def officials():
 out=[];n=get(p.data(0xc992c),4,False)
 while n:
  a=p.read(n,12);person=struct.unpack_from('<I',a)[0];out.append(p.read(person,1)[0]);n=struct.unpack_from('<I',a,8)[0];assert len(out)<256
 return out
ids_before=officials();p.call(0x6668f,[W]);ids_after=officials();invrow=get(l.R0+10*337+0xb8,4,False);localrow=get(l.R0+0xb8,4,False);r={'reason':2,'owned_count':get(l.E+0x2e,1,False),'local_owned':get(l.R0+2),'local_soldiers':get(l.R0+0x22),'friendship':get(l.R0+0xac),'cleared':{hex(off):get(l.R0+off,1,False) for off in clear},'phase_counter':get(l.R0+0x134),'production_multiplier':struct.unpack('<f',p.read(l.R0+0x129,4))[0],'workers':get(l.E+0x96,4),'remaining_investment_region':get(p.data(0xcca9c),1,False),'second_investment_slot':get(p.data(0xcca9c)+15,1,False),'relation_invader_to_local':get(invrow,1,False),'relation_local_to_invader':get(localrow+10,1,False),'relation_invader_to_china':get(invrow+30,1,False),'relation_local_to_china':get(localrow+30,1,False),'official_count_before':len(ids_before),'official_count_after':len(ids_after),'deleted_ids':[v for v in ids_before if v not in ids_after]};r['passed']=r['owned_count']==1 and r['local_owned']==0 and r['local_soldiers']==1000 and r['friendship']==-2 and all(v==0 for v in r['cleared'].values()) and r['phase_counter']==0 and r['production_multiplier']==1 and r['workers']==877 and r['remaining_investment_region']==1 and r['second_investment_slot']==255 and [r[k] for k in ['relation_invader_to_local','relation_local_to_invader','relation_invader_to_china','relation_local_to_china']]==[4,3,0,6] and set(r['deleted_ids'])=={v['id'] for v in nodes};finish('territory-deep-live',r);assert r['passed']
