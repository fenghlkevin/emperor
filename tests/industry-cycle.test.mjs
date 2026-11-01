import test from 'node:test';
import assert from 'node:assert/strict';
import {newGame} from '../src/game.mjs';
import {executeIndustry,settleIndustry,validateIndustry,quoteIndustry,DEVELOPMENT_TURNS} from '../src/industry.mjs';
import {projectTotal} from '../src/project-work-orders.mjs';
for(const random of [0,.5,.999999])test(`development takes half a year and samples bounded area (${random})`,()=>{
 const s=newGame('开发周期'),p=s.domestic.provinces.find(p=>p.id==='hebei');
 const command={id:1,kind:'develop',provinceId:p.id,industry:'agriculture',area:100};
 assert.deepEqual(quoteIndustry(s,command).areaRange,{min:80,max:100});
 const r=executeIndustry(s,command).state,d=r.domestic,target=d.provinces.find(x=>x.id===p.id),before=p.economy.agriculture.developedArea;
 assert.equal(projectTotal('development',target.development.project),DEVELOPMENT_TURNS);
 const original=Math.random;try{Math.random=()=>random;
 for(let turn=2;turn<=1+DEVELOPMENT_TURNS;turn++){settleIndustry(d,turn);validateIndustry(d);if(turn<1+DEVELOPMENT_TURNS){assert(target.development.project);assert.equal(target.economy.agriculture.developedArea,before);}}
 }finally{Math.random=original;}
 assert.equal(target.development.project,null);assert.equal(target.economy.agriculture.developedArea-before,80+Math.floor(random*21));assert.equal(target.development.activation.effectiveTurn,2+DEVELOPMENT_TURNS);
 const snapshot=JSON.stringify(d);settleIndustry(d,1+DEVELOPMENT_TURNS);assert.equal(JSON.stringify(d),snapshot);
});
