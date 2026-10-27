import {readdirSync,statSync,readFileSync} from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
const tag=process.env.RELEASE_TAG;
const version=JSON.parse(readFileSync('package.json','utf8')).version;
if(tag!==`v${version}`)throw Error('Release tag must match package version');
const root=path.resolve('dist',`release-${process.platform}-${process.arch}`,'artifacts');
const files=readdirSync(root).filter(n=>/\.(?:zip|dmg|exe|json|txt)$/.test(n));
if(files.length!==4)throw Error('Expected two runnable packages, checksums and a verification report');
const result=spawnSync('gh',['release','view',tag,'--repo',process.env.GITHUB_REPOSITORY,'--json','isDraft,targetCommitish'],{encoding:'utf8'});
if(result.status!==0)throw Error(result.stderr);
const release=JSON.parse(result.stdout);
if(!release.isDraft||release.targetCommitish!==process.env.GITHUB_SHA)throw Error('Refuse to upload to an unrelated or already published release');
for(const name of files){
 const file=path.join(root,name);
 if(statSync(file).size>=2*1024**3)throw Error('Release asset too large: '+name);
 const r=spawnSync('gh',['release','upload',tag,file,'--repo',process.env.GITHUB_REPOSITORY,'--clobber'],{stdio:'inherit'});
 if(r.status!==0)throw Error('Asset upload failed: '+name);
}
