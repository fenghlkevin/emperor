#!/usr/bin/env python3
"""Finite-range checks of recovered integer arithmetic; no game emulation."""
import json
from pathlib import Path
from formulas import T,trade,attitude

def s16(v):return ((v+32768)&65535)-32768
def s32(v):return ((v+2147483648)&4294967295)-2147483648

def treaty(F,P,M,K,kind):
 inner=T(s32(P*M),K)
 B=T(s32(s32(F*F)*inner),10000)
 if kind==1:return s16(B)
 if kind==2:return s16(B*2)
 if kind==3:return s16(T(s16(B),20))
 if kind==4:return 100
 raise ValueError(kind)

def invasion(F,K,M):
 Q=T(s32(s32((101-F)*(101-F))*K),M)
 return T(s16(Q),1000)

def military(regions,standing):
 r=[x for x in regions if x['controlled']]
 equipment=T(sum(x['helmet']+x['armor']+x['shield'] for x in r)*2,3)
 trained=sum(T(x['training']*x['soldiers'],50) for x in r)
 return T(equipment+trained+standing,50)

def main():
 rates=[];rate=-20;cash=0
 for year in range(1,11):
  rate,income=trade(99,1000,rate);cash+=income
  rates.append({'settlement':year,'rate':rate,'income':income,'cumulative':cash})
 assert [x['income'] for x in rates]==[-160,-120,-80,-40,0,40,80,120,160,200]
 assert [treaty(99,100,100,100,k) for k in [1,2,3,4]]==[98,196,4,100]
 assert s16(32768)==-32768 and s16(65535)==-1
 assert [invasion(0,k,100) for k in [100,200,1000]]==[10,20,-29]
 assert [attitude(f)<=2 for f in [40,41]]==[False,True]
 r=[{'controlled':True,'helmet':100,'armor':100,'shield':100,'training':50,'soldiers':100},{'controlled':False,'helmet':999,'armor':999,'shield':999,'training':99,'soldiers':999}]
 assert military(r,200)==10
 counts={str(th):sum(v%100<s16(th) for v in range(32768)) for th in [0,1,2,30,50,68,90,99,100,32767,32768]}
 assert counts['0']==0 and counts['100']==32768 and counts['32768']==0 and counts['2']==656
 out={'scope':'static arithmetic checks, not original game runtime tests','trade_constant_friendship99_quota1000':rates,'treaty_thresholds_F99_P100_M100_K100':{str(k):treaty(99,100,100,100,k) for k in [1,2,3,4]},'invasion_signed16_example':[{'F':0,'K':k,'M':100,'H':invasion(0,k,100)} for k in [100,200,1000]],'random_gate_passes_out_of32768':counts,'age_boundary_valid':{str(a):16<=a<29 for a in [15,16,28,29]},'gift_friendship_increment':{str(a):T(s16(a),2000) for a in [1999,2000,20000,32000,32768]},'extort_friendship_decrement':{str(a):T(s16(a),1000) for a in [999,1000,32000,32768]},'checks':'passed'}
 (Path(__file__).with_name('diplomacy-verification.json')).write_text(json.dumps(out,ensure_ascii=False,indent=2)+'\n')
 print('Recovered diplomacy integer arithmetic checks passed')
if __name__=='__main__':main()
