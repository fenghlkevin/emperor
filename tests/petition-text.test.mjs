import test from 'node:test';
import assert from 'node:assert/strict';
import {chineseNumber,petitionText,petitionSeal} from '../src/petition-text.mjs';
test('Chinese display numbers preserve zero groups, large amounts, signs and decimals',()=>{
 for(const [value,expected] of [[0,'零'],[10,'十'],[11,'十一'],[800,'八百'],[1001,'一千零一'],['12,618','一万二千六百一十八'],[21121,'二万一千一百二十一'],[100000001,'一亿零一'],[100100010,'一亿零一十万零一十'],['-8,599.05','负八千五百九十九点零五']])assert.equal(chineseNumber(value),expected);
});
test('reports highlight numeric quantities including units without injecting markup',()=>{
 assert.equal(petitionText('实付800两，进度2/10旬，税率12.5%。'), '实付<span class="petition-value">八百两</span>，进度<span class="petition-value">二</span>/<span class="petition-value">十旬</span>，税率<span class="petition-value">百分之十二点五</span>。');
 assert.equal(petitionText('<img onerror="bad">0两 & 粮'), '&lt;img onerror=&quot;bad&quot;&gt;<span class="petition-value">零两</span> &amp; 粮');
});
test('seals distinguish urgent, requests and reports without implying approval',()=>{
 assert.equal(petitionSeal({urgent:true,action:'local-petition'}),'加急');
 assert.equal(petitionSeal({action:'local-petition'}),'请旨');
 assert.equal(petitionSeal({id:'works-complete:hebei'}),'复奏');
 assert.equal(petitionSeal({id:'deficit'}),'奏事');
});
