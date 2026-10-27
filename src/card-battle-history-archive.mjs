import {publicCardHistory,validatePublicCardHistory} from './card-battle-history.mjs';
const keys=(x,allowed)=>x&&typeof x==='object'&&!Array.isArray(x)&&Object.keys(x).every(k=>allowed.includes(k));
const fail=()=>{throw Error('交战记录归档无效');};
// Version 1 lossless, deterministic DAG: [0,...array child indexes],
// [1,key index,value index,...], [2,primitive]. Every reference points backward.
// Repeated names, refs and state snapshots are stored once, never dropped.
export function packCardRecord(value){
 const nodes=[],interned=new Map();let visited=0;
 function encode(x,depth=0){
  if(depth>32||++visited>1000000)fail();let node;
  if(x===null||['string','boolean','number'].includes(typeof x)){if(typeof x==='number'&&!Number.isFinite(x))fail();node=[2,x];}
  else if(Array.isArray(x))node=[0,...x.map(v=>encode(v,depth+1))];
  else if(x&&typeof x==='object')node=[1,...Object.keys(x).sort().flatMap(k=>[encode(k,depth+1),encode(x[k],depth+1)])];else fail();
  const signature=JSON.stringify(node);if(interned.has(signature))return interned.get(signature);const id=nodes.length;nodes.push(node);interned.set(signature,id);return id;
 }
 const root=encode(value);return {nodes,root};
}
export function unpackCardRecord(data){
 if(!keys(data,['nodes','root'])||!Array.isArray(data.nodes)||!data.nodes.length||data.nodes.length>250000||data.root!==data.nodes.length-1)fail();const values=[],depths=[],weights=[];
 for(const [i,node]of data.nodes.entries()){
  if(!Array.isArray(node)||!node.length)fail();const get=id=>{if(!Number.isSafeInteger(id)||id<0||id>=i)fail();return values[id];};let value,depth=0,weight=1;
  if(node[0]===2){if(node.length!==2||!(node[1]===null||['string','boolean','number'].includes(typeof node[1]))||typeof node[1]==='number'&&!Number.isFinite(node[1]))fail();value=node[1];}
  else if(node[0]===0){value=node.slice(1).map(get);weight+=node.slice(1).reduce((n,id)=>n+weights[id],0);depth=1+Math.max(0,...node.slice(1).map(id=>depths[id]));}
  else if(node[0]===1){if(node.length%2!==1)fail();const entries=[],seen=new Set();for(let j=1;j<node.length;j+=2){const k=get(node[j]),v=get(node[j+1]);if(typeof k!=='string'||seen.has(k))fail();seen.add(k);entries.push([k,v]);depth=Math.max(depth,1+depths[node[j+1]]);weight+=weights[node[j]]+weights[node[j+1]];}value=Object.fromEntries(entries);}
  else fail();if(depth>32||weight>1000000)fail();values.push(value);depths.push(depth);weights.push(weight);
 }
 const value=values.at(-1);
 // Reject unreachable/duplicate payload nodes as well as noncanonical encodings.
 if(JSON.stringify(packCardRecord(value))!==JSON.stringify({nodes:data.nodes,root:data.root}))fail();return value;
}
// Integer child indexes use unsigned varints; primitive text remains a public JSON table.
// Safe BMP characters carry 15 bits each (no controls/surrogates), keeping the
// UTF-16 localStorage footprint small as well as the exported UTF-8 save.
function compact(value){
 const dag=packCardRecord(value),values=[],bytes=[];const write=n=>{do{let byte=n%128;n=Math.floor(n/128);bytes.push(byte|(n?128:0));}while(n);};
 for(const node of dag.nodes){write(node[0]);if(node[0]===2){write(values.length);values.push(node[1]);}else{write(node.length-1);for(const id of node.slice(1))write(id);}}
 let nodes='',bits=0,buffer=0;for(const byte of bytes){buffer|=byte<<bits;bits+=8;if(bits>=15){nodes+=String.fromCharCode(0x1000+(buffer&32767));buffer>>>=15;bits-=15;}}if(bits)nodes+=String.fromCharCode(0x1000+buffer);return {values,nodes,bytes:bytes.length,root:dag.root};
}
function expand(data){
 if(!keys(data,['values','nodes','bytes','root'])||!Array.isArray(data.values)||data.values.some(x=>!(x===null||['string','boolean','number'].includes(typeof x)))||typeof data.nodes!=='string'||data.nodes.length>8*1024*1024||!Number.isSafeInteger(data.bytes)||data.bytes<1||data.nodes.length!==Math.ceil(data.bytes*8/15)||!Number.isSafeInteger(data.root)||data.root<0||data.root>=250000)fail();
 const binary=[];let bits=0,buffer=0;for(const char of data.nodes){const n=char.charCodeAt(0)-0x1000;if(n<0||n>32767)fail();buffer|=n<<bits;bits+=15;while(bits>=8&&binary.length<data.bytes){binary.push(buffer&255);buffer>>>=8;bits-=8;}}if(buffer||binary.length!==data.bytes)fail();let pos=0;const read=()=>{let n=0,m=1;for(let i=0;i<5;i++){if(pos>=binary.length)fail();const byte=binary[pos++];n+=(byte&127)*m;if(!(byte&128))return n;m*=128;}fail();};const nodes=[];
 while(pos<binary.length){if(nodes.length>data.root)fail();const kind=read(),n=read();if(kind===2){if(n>=data.values.length)fail();nodes.push([2,data.values[n]]);}else if(kind===0||kind===1){if(n>binary.length-pos)fail();const row=[kind];for(let j=0;j<n;j++)row.push(read());nodes.push(row);}else fail();}
 const value=unpackCardRecord({nodes,root:data.root});if(JSON.stringify(compact(value))!==JSON.stringify({values:data.values,nodes:data.nodes,bytes:data.bytes,root:data.root}))fail();return value;
}
const cache=new WeakMap(),validated=new Map();
// Content signatures survive state clones. Only validation metadata is retained
// globally; decoded histories remain weakly held. Any byte change misses the cache.
function checked(archive,decode=true){
 if(!keys(archive,['version','data'])||archive.version!==1||!keys(archive.data,['values','nodes','bytes','root'])||typeof archive.data.nodes!=='string'||!Array.isArray(archive.data.values)||archive.data.values.some(x=>!(x===null||['string','boolean','number'].includes(typeof x))||typeof x==='number'&&!Number.isFinite(x)))fail();const signature=JSON.stringify(archive),old=cache.get(archive);if(old?.signature===signature)return old.record;if(!decode&&validated.has(signature))return validated.get(signature);
 const record=expand(archive.data);
 if(!keys(record,['orderId','targetName','rulesVersion','ply','result','history','people'])||!Number.isSafeInteger(record.orderId)||record.orderId<1||typeof record.targetName!=='string'||record.targetName.length>256||![3,4,5,6].includes(record.rulesVersion)||!Number.isSafeInteger(record.ply)||record.ply<1||!['victory','defeat','draw'].includes(record.result)||!Array.isArray(record.people))fail();
 validatePublicCardHistory(record.history,record.ply);
 const refs=new Map();function collect(x){if(!x||typeof x!=='object')return;if(x.id&&x.side&&x.type&&typeof x.name==='string')refs.set(x.id,x);else for(const v of Object.values(x))collect(v);}collect(record.history);
 const seen=new Set();for(const p of record.people){if(!keys(p,['cardId','personId','definitionId','historicalDefinitionId','templateId'])||!['general','hero'].includes(refs.get(p.cardId)?.type)||seen.has(p.cardId)||typeof p.personId!=='string'||!p.personId.length||p.personId.length>256||['definitionId','historicalDefinitionId','templateId'].some(k=>p[k]!==undefined&&p[k]!==null&&(typeof p[k]!=='string'||p[k].length>256)))fail();seen.add(p.cardId);}
 const end=record.history.entries.at(-1),result=end?.events.findLast(e=>e.type==='result');if(end&&(!result||result.result!==record.result))fail();
 cache.set(archive,{signature,record});validated.set(signature,{orderId:record.orderId,targetName:record.targetName,result:record.result});if(validated.size>256)validated.delete(validated.keys().next().value);return record;
}
export function validateCardHistoryArchive(archive,receipt){
 const record=checked(archive,false);if(receipt&&(receipt.id!==record.orderId||receipt.kind!=='war'||receipt.report&&(receipt.report.targetName!==record.targetName||receipt.report.result!==record.result)))fail();return true;
}
export function readCardHistoryArchive(archive){return structuredClone(checked(archive));}
export function archiveCardHistory(b){
 if(![3,4,5,6].includes(b.cards?.rulesVersion))return undefined;if(!b.result)throw Error('交战结束后才能归档');
 const history=JSON.parse(JSON.stringify(publicCardHistory(b))),refs=new Map();function collect(x){if(!x||typeof x!=='object')return;if(x.id&&x.side&&x.type&&typeof x.name==='string')refs.set(x.id,x);else for(const v of Object.values(x))collect(v);}collect(history);
 const people=[];for(const x of refs.values())if(['hero','general'].includes(x.type)){const unit=x.type==='hero'?b.units.find(u=>u.side===x.side&&u.commander):b.units.find(u=>u.id===b.cards.catalog[x.id]?.unitId),p=b.cardPeople?.[unit?.cardPersonId];if(p)people.push({cardId:x.id,personId:p.personId,...Object.fromEntries(['definitionId','historicalDefinitionId','templateId'].filter(k=>p[k]!==undefined).map(k=>[k,p[k]]))});}
 const archive={version:1,data:compact({orderId:b.command.id,targetName:b.targetName,rulesVersion:b.cards.rulesVersion,ply:b.cards.ply,result:b.result,history,people})};validateCardHistoryArchive(archive);return archive;
}
