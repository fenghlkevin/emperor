const path = require('node:path');
const base = require('./package.json').build;
const electron = require.resolve('electron/package.json');
module.exports = {
  ...base,
  electronVersion: require(electron).version,
  electronDist: path.join(path.dirname(electron), 'dist'),
  directories: {output: '../artifacts'},
  files: base.files,
  mac: {...base.mac, identity: '-', minimumSystemVersion: '12.0', target: ['zip', 'dmg'], artifactName: 'Emperor-${version}-mac-${arch}.${ext}'},
  win: {...base.win, target: ['portable', 'nsis']},
  portable: {artifactName: 'Emperor-${version}-windows-${arch}-portable.${ext}'},
  nsis: {...base.nsis, artifactName: 'Emperor-${version}-windows-${arch}-setup.${ext}'},
};
