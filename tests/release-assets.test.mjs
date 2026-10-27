import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {createRequire} from 'node:module';
import {mkdtempSync,writeFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
const {releaseAssetURL,installReleaseAssets}=createRequire(import.meta.url)('../desktop-assets.cjs');
const root=path.resolve('release-fixture');
const url=relative=>pathToFileURL(path.join(root,relative)).href;
test('release images preserve old PNG URLs, Unicode names and cache queries',()=>{
 const source='assets/beauties/人物 portrait.png',target='assets/beauties/人物 portrait.webp';
 const actual=releaseAssetURL(url(source)+'?v=old-save#portrait',root,{[source]:target});
 assert.equal(actual,url(target)+'?v=old-save#portrait');
});
test('unmapped assets and outside paths never acquire a release alias',()=>{
 const aliases={'assets/a.png':'assets/a.webp'};
 assert.equal(releaseAssetURL(url('src/app.mjs'),root,aliases),null);
 assert.equal(releaseAssetURL(url('assets/unknown.png'),root,aliases),null);
 assert.equal(releaseAssetURL('https://example.com/assets/a.png',root,aliases),null);
 assert.equal(releaseAssetURL(pathToFileURL(path.resolve(root,'../assets/a.png')).href,root,aliases),null);
});
test('invalid manifests cannot redirect image requests outside bundled assets',()=>{
 for(const target of ['../private.webp','assets/../../private.webp','src/private.webp',true,'assets/a.png'])
  assert.equal(releaseAssetURL(url('assets/a.png'),root,{'assets/a.png':target}),null);
});
test('the release file handler only serves the application bundle',t=>{
 const directory=mkdtempSync(path.join(tmpdir(),'emperor-release-handler-'));
 t.after(()=>rmSync(directory,{recursive:true,force:true}));
 writeFileSync(path.join(directory,'release-assets.json'),JSON.stringify({version:1,assets:{}}));
 let handler,calls=0;
 installReleaseAssets({protocol:{handle:(_scheme,fn)=>handler=fn},net:{fetch:(target,options)=>{calls++;assert.equal(options.bypassCustomProtocolHandlers,true);return target;}}},directory);
 assert.equal(handler({url:pathToFileURL(path.join(directory,'../private.txt')).href}).status,403);
 assert.equal(calls,0);
 const inside=pathToFileURL(path.join(directory,'index.html')).href;
 assert.equal(handler({url:inside}),inside);assert.equal(calls,1);
});
