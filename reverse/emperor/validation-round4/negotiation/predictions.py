"""Independent model, deterministic seeds, and original-code breakpoint scenarios."""
import json
from pathlib import Path
ROOT=Path(__file__).resolve().parent
def s16(v): return (v+32768)%65536-32768
def next_rng(seed):
    seed=(seed*0x41c64e6d+0x3039)&0xffffffff
    return seed, ((seed>>16)&0x7fff)%100

def gate(seed,threshold):
    seed,q=next_rng(seed)
    return seed,q<s16(threshold),q

def threshold(kind,option,r,direction=0):
    r=s16(r)
    if kind=='surrender':
        return ((75-r)//2 if r<75 else 0) if option==0 else ((100-r if r<100 else 0) if option==1 else (100 if option==2 else 0))
    if direction:
        if option==0:return 100 if r<100 else 0
        if option in (1,2,3,4):return 0
        if option in (5,6):return 100 if r<=110 else (220-r if r<200 else 20)
        return 0
    return [100 if r<100 else 0,100 if r<75 else 0,100 if r<90 else 0,2*(75-r) if r<75 else 0,2*(100-r) if r<90 else 0,100,100][option]

def probability(t):
    t=max(0,min(100,s16(t)))
    return sum(328 if q<68 else 327 for q in range(t))/32768

def main():
    seeds={}
    for s in range(100000):
        _,q=next_rng(s)
        seeds.setdefault(q,s)
        if len(seeds)==100:break
    (ROOT/'seeds.json').write_text(json.dumps(seeds,indent=2)+'\n')
    rows=[]
    for kind,opts,dirs in [('surrender',range(3),[0]),('truce',range(7),[0,1])]:
        for d in dirs:
            for o in opts:
                for r in [0,1,24,25,26,49,50,73,74,75,76,89,90,99,100,101,110,111,119,120,121,198,199,200,201,499,500,32767,32768,65535]:
                    t=threshold(kind,o,r,d)
                    for q in sorted({0,99,max(0,min(99,t-1)),max(0,min(99,t))}):
                        rows.append(dict(kind=kind,option=o,direction=d,raw_ratio=r,signed_ratio=s16(r),threshold=t,roll=q,seed=seeds[q],success=q<s16(t),ideal_rng_probability=probability(t)))
    (ROOT/'boundary-predictions.json').write_text(json.dumps(rows,indent=2)+'\n')
    print(f'{len(rows)} predictions; {len(seeds)} deterministic residues')
if __name__=='__main__':main()
