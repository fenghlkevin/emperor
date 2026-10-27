import {spawnSync} from 'node:child_process';
import {writeFileSync,readFileSync} from 'node:fs';
const tag=process.env.RELEASE_TAG;
const repo=process.env.GITHUB_REPOSITORY;
const gh=args=>{const r=spawnSync('gh',args,{encoding:'utf8'});if(r.status!==0)throw Error(r.stderr);return r.stdout;};
const release=JSON.parse(gh(['release','view',tag,'--repo',repo,'--json','isDraft,targetCommitish,assets']));
if(!release.isDraft||release.targetCommitish!==process.env.GITHUB_SHA)throw Error('Unexpected release source');
const version=tag.slice(1);
const expected=[...['arm64','x64'].flatMap(arch=>['zip','dmg'].map(ext=>`Emperor-${version}-mac-${arch}.${ext}`)),...['portable','setup'].map(kind=>`Emperor-${version}-windows-x64-${kind}.exe`)];
for(const name of expected){const asset=release.assets.find(a=>a.name===name);if(!asset||!asset.size||asset.size>=2*1024**3)throw Error('Missing/invalid package: '+name);}
for(const label of ['darwin-arm64','darwin-x64','win32-x64']){
 gh(['release','download',tag,'--repo',repo,'--pattern',`verification-${label}.json`,'--pattern',`SHA256SUMS-${label}.txt`,'--clobber']);
 const report=JSON.parse(readFileSync(`verification-${label}.json`,'utf8'));
 if(!report.passed||!report.packaged||!report.assetPixelVerification)throw Error('Native smoke or pixel verification failed: '+label);
}
writeFileSync('SHA256SUMS.txt',['darwin-arm64','darwin-x64','win32-x64'].map(label=>readFileSync(`SHA256SUMS-${label}.txt`,'utf8').trim()).join('\n')+'\n');
gh(['release','upload',tag,'SHA256SUMS.txt','--repo',repo,'--clobber']);
gh(['release','edit',tag,'--repo',repo,'--draft=false','--latest']);
console.log('Published verified standalone release: '+tag);
