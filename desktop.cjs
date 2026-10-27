const path=require('node:path');
const { app, BrowserWindow, ipcMain, dialog, protocol, net } = require('electron');
const { attachRuntimeDiagnostics } = require('./desktop-runtime.cjs');
const { installReleaseAssets } = require('./desktop-assets.cjs');
// Keep existing saves when changing the application name.
const fs = require('node:fs');
const smoke = process.argv.includes('--smoke-test') && Boolean(process.env.EMPEROR_SMOKE_OUTPUT);
if (smoke) app.setPath('userData', path.join(app.getPath('temp'), `emperor-release-smoke-${process.pid}`));
const legacyNames = smoke ? [] : app.isPackaged ? ['皇帝', 'emperor-foundation'] : ['emperor-foundation', '皇帝'];
const legacyData = legacyNames.map(name => path.join(app.getPath('appData'), name)).find(dir => fs.existsSync(path.join(dir, 'Local Storage')));
if (legacyData) app.setPath('userData', legacyData);
app.setName('Emperor');
function createWindow() {
  const window = new BrowserWindow({ show: !smoke, width: 1360, height: 950, minWidth: 900, minHeight: 680, backgroundColor: '#242424', icon: path.join(__dirname, 'assets/brand/emperor-icon.png'), autoHideMenuBar: true, webPreferences: { preload: path.join(__dirname,'preload.cjs'), nodeIntegration: false, contextIsolation: true, sandbox: true } });
  // Keep native resize handles proportional to the initial content area.
  const [contentWidth, contentHeight] = window.getContentSize();
  window.setAspectRatio(contentWidth / contentHeight);
  attachRuntimeDiagnostics(app, window, { onRecoveryFailed: logPath => {
    dialog.showErrorBox('游戏画面异常退出', `自动恢复后仍发生异常。请重新启动游戏并选择继续进度。\n诊断日志：${logPath}`);
  } });
  window.loadFile(path.join(__dirname, 'index.html'));
  window.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
  window.webContents.on('will-navigate', event => event.preventDefault());
  return window;
}
app.whenReady().then(async () => { installReleaseAssets({protocol, net}, __dirname); if (process.platform === 'darwin') app.dock?.setIcon(path.join(__dirname, 'assets/brand/emperor-icon.png'));  ipcMain.on('emperor:quit', event => { if(BrowserWindow.fromWebContents(event.sender))app.quit(); }); const window = createWindow(); if (smoke) await require('./desktop-smoke.cjs').runPackagedSmoke(app, window); app.on('activate', () => { if (!BrowserWindow.getAllWindows().length) createWindow(); }); });
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
