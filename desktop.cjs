const path=require('node:path');
const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const { attachRuntimeDiagnostics } = require('./desktop-runtime.cjs');
function createWindow() {
  const window = new BrowserWindow({ width: 1360, height: 950, minWidth: 900, minHeight: 680, backgroundColor: '#242424', autoHideMenuBar: true, webPreferences: { preload: path.join(__dirname,'preload.cjs'), nodeIntegration: false, contextIsolation: true, sandbox: true } });
  // Keep native resize handles proportional to the initial content area.
  const [contentWidth, contentHeight] = window.getContentSize();
  window.setAspectRatio(contentWidth / contentHeight);
  attachRuntimeDiagnostics(app, window, { onRecoveryFailed: logPath => {
    dialog.showErrorBox('游戏画面异常退出', `自动恢复后仍发生异常。请重新启动游戏并选择继续进度。\n诊断日志：${logPath}`);
  } });
  window.loadFile(path.join(__dirname, 'index.html'));
  window.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
  window.webContents.on('will-navigate', event => event.preventDefault());
}
app.whenReady().then(() => { ipcMain.on('emperor:quit', event => { if(BrowserWindow.fromWebContents(event.sender))app.quit(); }); createWindow(); app.on('activate', () => { if (!BrowserWindow.getAllWindows().length) createWindow(); }); });
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
