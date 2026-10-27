import {spawnSync, spawn} from 'node:child_process';
import {mkdirSync, readFileSync, existsSync, writeFileSync, readdirSync, statSync, createReadStream} from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';

const root = path.resolve(fileURLToPath(new URL('../..', import.meta.url)));
const option = key => process.argv.find(a => a.startsWith(`--${key}=`))?.split('=').slice(1).join('=');
const source = path.resolve(option('source') ?? root);
const arch = option('arch') ?? process.arch;
if (arch !== process.arch) throw Error('Release jobs must build and test on the matching native architecture');
const work = path.join(root, 'dist', `release-${process.platform}-${arch}`);
const stage = path.join(work, 'stage'), artifacts = path.join(work, 'artifacts');
mkdirSync(work, {recursive:true});
const command = (exe,args,options={}) => {const r=spawnSync(exe,args,{stdio:'inherit',...options});if(r.status!==0)throw Error(`${exe} failed: ${r.status}`);};
command(process.env.PYTHON ?? (process.platform==='win32'?'python':'python3'), [path.join(root,'scripts/release/prepare.py'),'--source',source,'--destination',stage]);
// Runtime dependencies are empty; only the bundled Electron runtime is needed by players.
const builder = path.join(root,'node_modules/electron-builder/out/cli/cli.js');
command(process.execPath,[builder,'--config','electron-builder.release.cjs',process.platform==='darwin'?'--mac':'--win',`--${arch}`,'--publish','never'],{cwd:stage,env:{...process.env,CSC_IDENTITY_AUTO_DISCOVERY:'false'}});
const appDir = process.platform==='darwin'?path.join(artifacts,arch==='arm64'?'mac-arm64':'mac','Emperor.app'):path.join(artifacts,'win-unpacked');
const binary = process.platform==='darwin'?path.join(appDir,'Contents/MacOS/Emperor'):path.join(appDir,'Emperor.exe');
if(!existsSync(binary))throw Error('Packaged executable missing: '+binary);
async function smokeExecutable(executable, output) {
 await new Promise((resolve,reject)=>{
  const child=spawn(executable,['--smoke-test'],{env:{...process.env,EMPEROR_SMOKE_OUTPUT:output},stdio:'inherit'});
  const timeout=setTimeout(()=>{child.kill();reject(Error('Packaged app smoke timed out'));},180000);
  child.once('error',error=>{clearTimeout(timeout);reject(error);});
  child.once('exit',code=>{clearTimeout(timeout);code===0?resolve():reject(Error('Packaged app smoke failed: '+code));});
 });
 const result=JSON.parse(readFileSync(output,'utf8'));
 if(!result.passed||!result.packaged||result.arch!==arch||result.version!==JSON.parse(readFileSync(path.join(root,'package.json'),'utf8')).version)throw Error('Packaged app verification failed');
 return result;
}
const output=path.join(work,'smoke.json');
const smoke=await smokeExecutable(binary, output);
if(process.platform==='win32'){
 const portable=readdirSync(artifacts).find(name=>name.endsWith('-portable.exe'));
 if(!portable)throw Error('Portable executable missing');
 await smokeExecutable(path.join(artifacts,portable),path.join(work,'portable-smoke.json'));
 smoke.checks.push('portable self-extracting executable startup');
}
const extensions=process.platform==='darwin'?['.zip','.dmg']:['.exe'];
const files=readdirSync(artifacts).filter(name=>extensions.some(ext=>name.endsWith(ext)));
if(files.length!==2)throw Error('Expected two independent distribution formats, found '+files.length);
const sums=[];
for(const name of files){
 const file=path.join(artifacts,name),bytes=statSync(file).size;
 if(bytes>=2*1024**3)throw Error('GitHub Release asset exceeds 2 GiB: '+name);
 const hash=createHash('sha256');for await(const chunk of createReadStream(file))hash.update(chunk);
 sums.push(`${hash.digest('hex')}  ${name}`);
}
writeFileSync(path.join(artifacts,`SHA256SUMS-${process.platform}-${arch}.txt`),sums.join('\n')+'\n');
const pixelReport=JSON.parse(readFileSync(path.join(work,'asset-verification.json'),'utf8'));
writeFileSync(path.join(artifacts,`verification-${process.platform}-${arch}.json`),JSON.stringify({...smoke,assetPixelVerification:pixelReport.pixelExact,assetCount:pixelReport.files,convertedImages:pixelReport.converted,sourceAssetBytes:pixelReport.sourceBytes,releaseAssetBytes:pixelReport.outputBytes},null,2));
console.log('Release artifacts verified:',artifacts);
