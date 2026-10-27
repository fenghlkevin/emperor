const fs = require('node:fs');
const path = require('node:path');
const {fileURLToPath, pathToFileURL} = require('node:url');

function releaseAssetURL(requestURL, root, assets) {
  let url, relative;
  try {
    url = new URL(requestURL);
    if (url.protocol !== 'file:') return null;
    relative = path.relative(root, fileURLToPath(url)).split(path.sep).join('/');
  } catch { return null; }
  if (!relative.startsWith('assets/') || relative.split('/').includes('..')) return null;
  const mapped = assets[relative];
  if (typeof mapped !== 'string' || !mapped.startsWith('assets/') || mapped.split('/').includes('..') || !mapped.endsWith('.webp')) return null;
  const target = path.resolve(root, mapped);
  const withinAssets = path.relative(path.join(root, 'assets'), target);
  if (withinAssets === '..' || withinAssets.startsWith('..' + path.sep) || path.isAbsolute(withinAssets)) return null;
  const result = pathToFileURL(target);
  result.search = url.search;
  result.hash = url.hash;
  return result.href;
}

function installReleaseAssets({protocol, net}, root) {
  const manifest = path.join(root, 'release-assets.json');
  if (!fs.existsSync(manifest)) return false;
  const {version, assets} = JSON.parse(fs.readFileSync(manifest, 'utf8'));
  if (version !== 1 || !assets || typeof assets !== 'object') throw Error('发行素材清单无效');
  protocol.handle('file', request => {
    let relative;
    try { relative = path.relative(root, fileURLToPath(new URL(request.url))); }
    catch { return new Response('Invalid file URL', {status:400}); }
    if (relative === '..' || relative.startsWith('..' + path.sep) || path.isAbsolute(relative))
      return new Response('Outside application bundle', {status:403});
    return net.fetch(releaseAssetURL(request.url, root, assets) ?? request.url,
      {bypassCustomProtocolHandlers: true});
  });
  return true;
}

module.exports = {releaseAssetURL, installReleaseAssets};
