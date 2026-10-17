#!/usr/bin/env python3
"""Executable static reconstructions; valid normal gameplay ranges only.
Does not emulate x86 overflow or call the original game. T means IDIV truncation.
"""
from dataclasses import dataclass
import json

def T(a,b):
 if b==0: raise ZeroDivisionError('original x86 IDIV would also trap')
 return (abs(a)//abs(b)) * (-1 if (a<0)!=(b<0) else 1)
MATCHUP=((100,75,115),(115,100,75),(100,115,75))

def trade(friendship,quota,profit_rate):
 rate=min(50,profit_rate+T(friendship,20))
 return rate,T(quota*rate,100)

def attitude(friendship):
 return 0 if friendship>80 else 1 if friendship>60 else 2 if friendship>40 else 3 if friendship>20 else 4

def attack(soldiers,training,side_commander):
 return 250+T(12*soldiers*(100+T(training*100,30)+T(side_commander*100,240)),1000)

def defense(soldiers,helmet,armor,shield):
 return T(25*helmet+45*armor+30*shield,soldiers)

@dataclass
class Unit:
 soldiers:int
 attack:int
 defense:int
 type:int

def actual_damage(a:Unit,b:Unit,acting_side:int,fortification:int,special=False,apply_matchup=True):
 # a array at0x65, b array at0x3ce. Returned values = a_loss,b_loss.
 la=max(0,T(10*b.attack-25*a.defense,130))
 lb=max(0,T(10*a.attack-25*b.defense,130))
 scale=85 if special else 100
 if acting_side==1:la=T((500-fortification)*la*scale,50000)
 else:lb=T((500-fortification)*lb*scale,50000)
 # Original skips matchup when either unit's slot index==0; caller supplies flag.
 if apply_matchup:
  la=T(la*MATCHUP[a.type][b.type],100)
  lb=T(lb*MATCHUP[b.type][a.type],100)
 over_a=T(la-a.soldiers,3) if la>=a.soldiers else 0
 over_b=T(lb-b.soldiers,3) if lb>=b.soldiers else 0
 dead_a=la>=a.soldiers;dead_b=lb>=b.soldiers
 la=min(la,a.soldiers);lb=min(lb,b.soldiers)
 if dead_a and not dead_b:lb=max(0,lb-over_a)
 if dead_b and not dead_a:la=max(0,la-over_b)
 return la,lb

def examples():
 a=Unit(100,attack(100,30,120),defense(100,100,100,100),0)
 b=Unit(100,attack(100,20,80),defense(100,50,50,50),1)
 return {'trade_friendship79_quota1000_rate10':trade(79,1000,10),'trade_max_rate':trade(99,1000,49),'unit_a':a.__dict__,'unit_b':b.__dict__,'a_acts_fort0':actual_damage(a,b,1,0),'a_acts_fort100':actual_damage(a,b,1,100),'b_acts_fort100':actual_damage(a,b,2,100),'attitude_boundaries':{f:attitude(f) for f in [20,21,40,41,60,61,80,81]}}
if __name__=='__main__':print(json.dumps(examples(),ensure_ascii=False,indent=2))
